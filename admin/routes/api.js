const router = require('express').Router();
const multer = require('multer');
const axios = require('axios');
const unirest = require('unirest');
const HomeApi = require('../models/xtrf/home');
const ClientApi = require('../models/xtrf/client');
const fs = require('fs');
const mv = require('mv');
const { sendMail } = require('../utils/mailhandler');
const { sendMailClient } = require('../utils/mailhandlerclient');
const { sendMailPortal } = require('../utils/mailhandlerportal')
const { Requests, Projects, Languages, Services, Industries, Timezones, User, Clients } = require('../models');
const { quote, project } = require('../models/xtrf');
const reqq = require('request');
const writeFile = require('write');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './dist/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

var upload = multer({
  storage: storage
});


function moveFile(oldFile, requestId) {

  var newFile = './dist/reqfiles/' + requestId + '/' + oldFile.filename;

  mv(oldFile.path, newFile, {
    mkdirp: true
  }, function (err) {
  });

  return oldFile.filename;
}

function moveLangIcon(oldFile, date) {
  var newFile = './dist/static/flags31x21pix/' + date + '-' + oldFile.filename;
  mv(oldFile.path, newFile, {
    mkdirp: true
  }, function (err) {
    if(err) {
      console.log(err);
    }
  });
  console.log('Flag icon moved!')
}

router.get('/wordcount', async (req, res) => {

  var link = req.query.web;
  if (link.indexOf('dropbox') >= 0) {
    var firstPart = link.split("=")[0];
    link = firstPart + "=1";
  }
  const resFull = await axios({
    url: link,
    method: 'GET',
    responseType: 'blob', // important
  });
  var wstream = await reqq(link).pipe(fs.createWriteStream('./dist/testtest.txt'));
  wstream.write(resFull.data);
  wstream.end(() => {
    unirest.post('https://pangea.s.xtrf.eu/qrf/file')
      .headers({ 'Content-Type': 'multipart/form-data' })
      .attach('file', './dist/testtest.txt') // Attachment
      .end(function (response) {
        var token = response.body.token;
        fs.unlink('./dist/testtest.txt', (err) => {
          if (err) throw err;
          console.log("testtеst.txt was deleted!")
        });
        console.log('done');
        res.send({ token });
      });
  });
});


router.post('/request', upload.fields([{ name: 'detailFiles' }, { name: 'refFiles' }]), async (req, res) => {
  try {
  const request = new Requests(req.body);
  var projectName = "";
  if (request.projectName) {
    projectName = request.projectName;
  }

  if (req.body.genBrief) {
    var obj = JSON.parse(req.body.genBrief);
    await writeFile(`./dist/reqfiles/${request.id}/written.txt`, `Package: ${obj.package}
     \nDescription: ${obj.briefDescr};
     \nTargeted Audience: ${obj.briefAudience}; 
     \nTitle: ${obj.briefTitle}; 
     \nTopics: ${obj.briefTopics};
     \nCovered points: ${obj.briefSure};
     \nExamples: ${obj.briefExample}; 
     \nStructure: ${JSON.stringify(obj.structure)};
     \nStyle: ${obj.style}
     \nTone of Voice: ${JSON.stringify(obj.tone)}
     \nDesign: ${JSON.stringify(obj.design)}
     \nSeo: ${JSON.stringify(obj.seo)}
     \nCTA: ${obj.cta}`)
  }

  const detailFiles = req.files["detailFiles"];
  const refFiles = req.files["refFiles"];

  request.sourceLanguage = JSON.parse(req.body.sourceLanguage);
  request.targetLanguages = JSON.parse(req.body.targetLanguages);
  request.service = JSON.parse(req.body.service);
  
  await request.save();
  if (detailFiles) {
    for (var i = 0; i < detailFiles.length; i += 1) {
      request.detailFiles.push(moveFile(detailFiles[i], request.id));
    }
  }
  if (refFiles) {
    for (var i = 0; i < refFiles.length; i += 1) {
      request.refFiles.push(moveFile(refFiles[i], request.id))
    }
  }

  await request.save();
  if (projectName) {
    sendMailPortal(request);
    quote(request);
  } else {
    sendMail(request);
  }
  sendMailClient(request);
  // quote(request);

  console.log("Saved");
  res.send({
    message: "request was added"
  });
  } catch (err) {
      console.log(err);
      res.status(500).send("Something went wrong while adding request " + err)
    }
});

router.post('/project-request', upload.fields([{ name: 'detailFiles' }, { name: 'refFiles' }]), async (req, res) => {
  try {
  const request = new Requests(req.body);
  var projectName = "";
  if (request.projectName) {
    projectName = request.projectName;
  }

  if (req.body.genBrief) {
    var obj = JSON.parse(req.body.genBrief);
    
    await writeFile(`./dist/reqfiles/${request.id}/written.txt`, `Package: ${obj.package}
     \nDescription: ${obj.briefDescr};
     \nTargeted Audience: ${obj.briefAudience}; 
     \nTitle: ${obj.briefTitle}; 
     \nTopics: ${obj.briefTopics};
     \nExamples: ${obj.briefExample}; 
     \nStructure: ${JSON.stringify(obj.structure)};
     \nStyle: ${obj.style}
     \nTone of Voice: ${JSON.stringify(obj.tone)}
     \nDesign: ${JSON.stringify(obj.design)}
     \nSeo: ${JSON.stringify(obj.seo)}
     \nCTA: ${obj.cta}`)
  }

  const detailFiles = req.files["detailFiles"];
  const refFiles = req.files["refFiles"];

  request.sourceLanguage = JSON.parse(req.body.sourceLanguage);
  request.targetLanguages = JSON.parse(req.body.targetLanguages);
  request.service = JSON.parse(req.body.service)

  await request.save();
  if (detailFiles) {
    for (var i = 0; i < detailFiles.length; i += 1) {
      request.detailFiles.push(moveFile(detailFiles[i], request.id));
    }
  }
  if (refFiles) {
    for (var i = 0; i < refFiles.length; i += 1) {
      request.refFiles.push(moveFile(refFiles[i], request.id))
    }
  }

  await request.save();
  if (projectName) {
    sendMailPortal(request)
  } else {
    sendMail(request);
  }
  sendMailClient(request);
  project(request);

  console.log("Saved");
  
  res.send({
    message: "request was added"
  });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong while adding request " + err)
  }
});

router.get('/allprojects', async (req, res) => {
  try {
    const projects = await Projects.find({});
    for(let project of projects) {
      if(project.projectManager) {
        project.projectManager = await User.findOne({"_id": project.projectManager}, {firstName: 1, lastName: 1});
      }
      if(project.customer) {
        project.customer = await Clients.findOne({"_id": project.customer}, {name: 1});
      }
      if(project.service) {
        project.service = await Services.findOne({"_id": project.service}, {title: 1}); 
      };
      if(project.industry) {
        project.industry = await Industries.findOne({"_id": project.industry}, {name: 1, icon: 1});
      }
    }
    res.send(projects)
  } catch(err) {
      console.log(err);
      res.status(500);
      res.send('Something wrong with DB while getting projects! ' + err)
    }
})

router.get('/languages', async (req, res) => {
  try {
    const languages = await Languages.find({});
    res.send(languages)
  } catch(err) {
      console.log(err)
      res.status(500);
      res.send('Something wrong with DB ' + err)
    }
});

router.get('/services', async (req, res) => {
  try {
  let allLangs = await Languages.find();  
  let services = await Services.find();

  for(let serv of services) {
    for(let combination of serv.languageCombinations) {
      for(let lang of allLangs) {
        if(serv.languageForm == 'Duo') {
          if(combination.source._id === lang._id) {
            combination.source.lang = lang.lang;
            combination.source.icon = lang.icon;
            combination.source.active = lang.active;
          }
        }
        if(combination.target._id === lang._id) {
          combination.target.lang = lang.lang;
          combination.target.icon = lang.icon;
          combination.target.active = lang.active;
        }
      }
    }
    await Services.update({title: serv.title}, serv)
  }
    res.send(services);
  } catch(err) {
      console.log(err)
      res.statusCode(500);
      res.send('Something wrong with DB ' + err);
  }
});

router.get('/industries', async (req, res) => {
  try {
  const industries = await Industries.find({});
    res.send(industries)
  } catch(err) {
    console.log(err);
    res.statusCode(500);
    res.send('Something wrong with DB ' + err);
  }
});

router.get('/timezones', async (req, res) => {
  try {  
    const timezones = await Timezones.find({});
    res.send(timezones)
  } catch(err) {
      console.log(err);
      res.status(500);
      res.send('Something wrong with DB ' + err);
  }
})

router.get('/customers', async (req, res) => {
  try{
    let customers = await HomeApi.getAllCustomers();
    res.send(customers)
  } catch(err) {
    console.log(err);
    res.statusCode(500);
    res.send('Something wrong with DB ' + err);
  }
})

router.get('/person', async (req, res) => {
  try{
    let person = await HomeApi.getPerson(req.query.customerId);
    let email = {'email': person};
    res.send(email);
  } catch(err) {
    res.statusCode(500);
    res.send('Something wrong with DB ' + err);
  }
})

router.post('/get-token', async (req, res) => {
  let email = {'email': req.body.email};
  try {
    let token = await HomeApi.getTokenCircular(email);
    res.send(token);
  } catch (err) {
    res.send(err);
    console.log(err);
  }
})

router.post('/token-session', async (req, res) => {
  try {
    let sessionId = await ClientApi.login(req.body.token.body);
      res.send(sessionId);
  } catch(err) {
    res.send(err)
  }
  
})

router.post("/savelanguages", upload.fields([{name: "flag"}]), async (req, res) => {
  const flag = req.files["flag"];
  var langID = req.body.dbIndex;
  try {
    let languageIcon = await Languages.find({'_id': langID});
    var existIcon = languageIcon[0].icon;
    let old = './dist' + languageIcon[0].icon;
    let date = new Date().getTime();
    if (flag) {
      fs.unlinkSync(old, (err) => {
        console.log('old file removed');
      });
      moveLangIcon(flag[0], date);
      existIcon = `/static/flags31x21pix/${date}-` + flag[0].filename; 
    }
    var objForUpdate = {
      lang: req.body.languageName,
      symbol: req.body.languageSymbol,
      iso1: req.body.languageIso1,
      iso2: req.body.languageIso2,
      active: req.body.languageActive,
      icon: existIcon
    };
    const result = await Languages.update({"_id": langID}, objForUpdate);
    res.send(result);
  } catch(err) {
    console.log(err);
    res.status(500).send('Something went wrong while Language saving ' + err);
  }
});

router.post("/removelanguages", async(req, res) => {
  const langID = req.body.languageRem;
  try {
    await Languages.deleteOne({"_id": langID})
    res.send('Removed')
  } catch(err) {
    console.log(err);
    res.status(500).send('Something is wrong with Language removing ' + err)
  }
});

module.exports = router;