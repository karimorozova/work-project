require('dotenv').config();
const express = require("express");
const app = express();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo")(session);
const bodyParser = require("body-parser");
const config = require('./server-config.json');
const mongoose = require('mongoose');
const port = config.server.port;
const db = mongoose.connection;
const { checkRoutes } = require('./middleware/index');
const history = require('connect-history-api-fallback');
let logger = require('morgan');
const cors = require('cors')
app.use(cors({origin: "http://localhost:8080",}))
require('./helpers/dbSetDefault');
require('./schedule');

// SOCKET.IO SERVER
const httpServer = require("http").Server(app);

const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});
httpServer.listen(8080);
io.on('connection', socket => {
  console.log(`A user connected with socket id ${socket.id}`)

  socket.broadcast.emit('hello', socket.id)

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', socket.id)
  })

  socket.on('nudge-client', data => {
    socket.broadcast.to(data.to).emit('client-nudged', data)
  })
})

// end SOCKET.IO se

// const { getMemoqUsers, deleteMemoqUser } = require('./services/memoqs/users');


const allowedOrigins = [
	"https://admin.pangea.global",
	"https://vendor.pangea.global",
	"https://portal.pangea.global",
	"http://localhost:3000",
	"http://localhost:3002",
	"http://localhost:8081",
	"http://testadmin.pangea.global",
	"http://testvendor.pangea.global",
	"http://testportal.pangea.global",
	"http://95.216.165.38"
];

mongoose.connect(config.mongoDB.url, {
	useNewUrlParser: true,
	useFindAndModify: false,
	useUnifiedTopology: true,
	useCreateIndex: true
});

app.use(logger('dev'));
app.use(
		session({
			secret: "Cookies Very Much secret key!",
			resave: true,
			saveUninitialized: false,
			store: new MongoStore({
				mongooseConnection: db
			})
		})
);

app.use(express.static("dist"));
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
	const origin = req.headers.origin;
	res.header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, token-header");
	res.header("Access-Control-Allow-Credentials", true);

	const index = allowedOrigins.indexOf(origin);
	if(index > -1) res.setHeader("Access-Control-Allow-Origin", allowedOrigins[index]);

	return next();
});

const routes = require("./routes");
app.use("/", routes);

app.use((err, req, res, next) => {
	return res.status(err.status).send(err.message);
});

app.use(history({ verbose: true, index: '/' }));
app.use(checkRoutes);

app.listen(port, () => {
	console.log('\x1b[32m', `✈  Server is working on: ${ port }`, '\x1b[0m');
});
