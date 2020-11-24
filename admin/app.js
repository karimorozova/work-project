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
const { updateMemoqProjectsData } = require('./services/memoqs/projects');
const schedule = require('node-schedule');
const checkCollections = require('./helpers/dbSetDefault');
const { newLangReport } = require('./reports/newLangTierReport');
const { parseAndWriteLQAReport } = require('./reports/parseOldMemoqProjects');
const { saveMessages, updateOtherProjectStatusOnMessages, filterOldMessages } = require('./gmail');
const { Pricelist } = require('./models');
const { getMemoqUsers, deleteMemoqUser } = require('./services/memoqs/users');


// const foo = async () => {
// 	const users = await getMemoqUsers();
// 	const needed = users.filter(user => user.email === 'maksym@pangea.global' || user.email === 'maxyplmr@gmail.com');
// 	console.log(needed);
// 	console.log(users.filter(i => typeof i.email === 'object'))
// }
//  deleteMemoqUser('97d8076f-6e07-4145-b0dc-a77f2e9a15e3');
// foo();
schedule.scheduleJob('0 */3 * * *', async function () {
  console.log('------ Start updating memoq projects data: ', `${new Date()} ------`);
  try {
    await updateMemoqProjectsData();
    console.log('------ Finish updating memoq projects data ', `${new Date()} ------`);
  } catch (err) {
    console.log(err.message);
  }
});

// schedule.scheduledJobs('0 */1 * * *', async function () {
//   console.log('------ Start updating gmail messages collection: ', `${new Date()} ------`);
//   try {
//     await saveMessages();
//     console.log('------ Finish updating gmail messages collection ', `${new Date()} ------`);
//   } catch (err) {
//     console.log(err.message);
//   }
// });

// schedule.scheduleJob('0 23 * * *', async function () {
//   console.log('------ Start filtering old gmail messages: ', `${new Date()} ------`);
//   try {
//     await filterOldMessages();
//     console.log('------ Finish filtering old gmail messages ', `${new Date()} ------`);
//   } catch (err) {
//     console.log(err.message);
//   }
// });

// schedule.scheduledJobs('0 */2 * * *', async function () {
//   console.log('------ Start updating memoq projects statuses based on gmail messages: ', `${new Date()} ------`);
//   try {
//     await updateOtherProjectStatusOnMessages();
//     console.log('------ Finish updating memoq projects statuses based on gmail messages ', `${new Date()} ------`);
//   } catch (err) {
//     console.log(err.message);
//   }
// });

schedule.scheduleJob('30 23 * * *', async function () {
  console.log('------- Start updating lang tier data: ', `${new Date()} -------`);
  try {
    await newLangReport();
    console.log('------- Finish updating lang tier data: ', `${new Date()} --------`);
  } catch (err) {
    console.log(err.message);
  }
});


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
	res.header(
			"Access-Control-Allow-Headers",
			"Origin, Content-Type, Authorization, token-header"
	);
	res.header("Access-Control-Allow-Credentials", true);

	const index = allowedOrigins.indexOf(origin);
	if(index > -1) {
		res.setHeader("Access-Control-Allow-Origin", allowedOrigins[index]);
	}

	return next();
});

// include routes
const routes = require("./routes");
app.use("/", routes);

app.use((err, req, res, next) => {
	return res.status(err.status).send(err.message);
});

app.use(history({ verbose: true, index: '/' }));
app.use(checkRoutes);

app.listen(port, () => {
	console.log(`Server is working on: ${ port }`);
});
