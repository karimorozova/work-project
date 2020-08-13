const router = require('express').Router();
const { upload, stepEmailToVendor } = require('../utils');
const mv = require('mv');
const fse = require('fs-extra');
const { getRatePricelist, changeMainRatePricelist } = require('../rates');
const { updateProject, getProject } = require('../projects');
const {
  getVendor,
  getVendorAfterUpdate,
  getFilteredVendors,
  updateVendorEducation,
  saveVendorDocument,
  saveVendorDocumentDefault,
  removeVendorDoc,
  removeVendorEdu,
  updateVendorAssessment,
  notifyTestStatus,
  updateVendorCompetencies,
  deleteVendorCompetencies,
  updateVendorsRatePrices,
  syncVendorRatesCost
} = require('../vendors');
const { Vendors } = require('../models');
const { getLangTests, updateLangTest, removeLangTest } = require('../langTests');
const { testSentMessage } = require("../emailMessages/candidateCommunication");


function moveFile(oldFile, vendorId) {
  let newFile = './dist/vendorsDocs/' + vendorId + '/' + oldFile.filename;
  mv(oldFile.path, newFile, {
    mkdirp: true
  }, function (err) {
  });
  return oldFile.filename;
}

router.post('/vendor-document-default', async (req, res) => {
  const { vendorId, category } = req.body;
  try {
    const updatedVendor = await saveVendorDocumentDefault({
      vendorId, category
    });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on adding vendor document");
  }
});

router.post('/vendor-document', upload.fields([{ name: 'documentFile' }]), async (req, res) => {
  const { vendorId, category, oldFilePath, oldName, oldCategory } = req.body;
  const files = req.files["documentFile"] || [];
  try {
    const updatedVendor = await saveVendorDocument({
      vendorId, file: files[0], category, oldFilePath, oldName, oldCategory
    });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on adding vendor document");
  }
});

router.post('/remove-vendor-doc', async (req, res) => {
  const { vendorId, docFile } = req.body;
  try {
    const updatedVendor = await removeVendorDoc({
      vendorId, ...docFile
    });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on removing vendor document");
  }
});

router.post('/vendor-education', upload.fields([{ name: 'educationFile' }]), async (req, res) => {
  let education = JSON.parse(req.body.education);
  const { vendorId, index } = req.body;
  const files = req.files["educationFile"] || [];
  try {
    const updatedVendor = await updateVendorEducation({
      vendorId, education, file: files[0], index
    });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on updating");
  }
});

router.post('/remove-vendor-education', async (req, res) => {
  const { vendorId, index, doc } = req.body;
  const path = doc ? doc.path : "";
  try {
    const updatedVendor = await removeVendorEdu({
      vendorId, index, path
    });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on removing vendor document");
  }
});

router.post('/vendor-profExperience', async (req, res) => {
  const { vendorId, index, experience } = req.body;
  try {
    const query = `profExperiences.${index}`;
    const updatedVendor = await getVendorAfterUpdate(
      { _id: vendorId },
      { [query]: experience }
    );
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on updating");
  }
});

router.post('/remove-vendor-experience', async (req, res) => {
  const { vendorId, index } = req.body;
  try {
    const query = `profExperiences.${index}`;
    await Vendors.updateOne({ _id: vendorId }, { [query]: null });
    const updatedVendor = await getVendorAfterUpdate({ _id: vendorId }, { $pull: { "profExperiences": null } });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on removing vendor document");
  }
});

router.post('/vendor-qualification', upload.fields([{ name: 'assessmentFile' }]), async (req, res) => {
  const { vendorId, index, qualification } = req.body;
  try {
    const query = `qualifications.${index}`;
    const updatedVendor = await getVendorAfterUpdate(
      { _id: vendorId },
      { [query]: qualification }
    );
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on updating");
  }
});

router.post('/remove-vendor-qualification', async (req, res) => {
  const { vendorId, index } = req.body;
  try {
    const query = `qualifications.${index}.status`;
    await Vendors.updateOne({ _id: vendorId }, { [query]: "" });
    const updatedVendor = await getVendorAfterUpdate({ _id: vendorId }, { $pull: { qualifications: { status: "" } } });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on removing vendor document");
  }
});

router.post('/vendor-assessment', upload.fields([{ name: 'assessmentFile' }]), async (req, res) => {
  const assessment = JSON.parse(req.body.assessment);
  const { index, vendorId } = req.body;
  const files = req.files["assessmentFile"];
  try {
    const updatedVendor = await updateVendorAssessment({
      vendorId,
      index,
      assessment,
      file: files[0]
    });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on saving Vendor's assessment");
  }
});

router.post('/filtered-vendors', async (req, res) => {
  const { filters } = req.body;
  try {
    const filteredVendors = await getFilteredVendors(filters);
    res.send(filteredVendors);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on getting filtered Vendors");
  }
});

router.post('/competencies', async (req, res) => {
  const { vendorId, currentData } = req.body;
  try {
    await updateVendorCompetencies(vendorId, currentData);
    const vendor = await getVendor({ "_id": vendorId });
    res.send(vendor);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error on saving Vendor Competencies');
  }
});

router.delete('/competencies/:vendorId/:competenceId', async (req, res) => {
  const { vendorId, competenceId } = req.params;
  try {
    await deleteVendorCompetencies(vendorId, competenceId);
    res.send('Deleted');
  } catch (err) {
    console.log(err);
    res.status(500).send('Error on deleting Vendor Competencies');
  }
});

router.get('/vendor', async (req, res) => {
  const id = req.query.id;
  try {
    const vendor = await getVendor({ "_id": id });
    res.send(vendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on getting Vendor");
  }
});

router.post('/step-email', async (req, res) => {
  const { projectId, step } = req.body;
  try {
    const project = await getProject({ "_id": projectId });
    const stepsAfterMailSent = await stepEmailToVendor(project, step);
    await updateProject({ "_id": projectId }, { steps: stepsAfterMailSent });
    res.send('Email has been sent');
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on sending email to Vendor");
  }
});

router.post('/rates', async (req, res) => {
  const { vendorId, ...rateInfo } = req.body;
  try {
    const vendor = await getVendor({ "_id": vendorId });
    // const updatedVendor = await updateVendorRates(vendor, rateInfo);
    // res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on updating rates of Vendor");
  }
});

router.post('/remove-rate', async (req, res) => {
  const { vendorId, rateId, prop } = req.body;
  try {
    const updatedVendor = await getVendorAfterUpdate({ "_id": vendorId }, {
      $pull: { [prop]: { '_id': rateId } }
    });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on deleting rate of Vendor");
  }
});

router.post('/remove-rates', async (req, res) => {
  const { vendorId, checkedIds, prop } = req.body;
  try {
    const updatedVendor = await getVendorAfterUpdate({ "_id": vendorId }, {
      $pull: { [prop]: { '_id': { $in: checkedIds } } }
    });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on deleting rate of Vendor");
  }
});

router.post('/combination', async (req, res) => {
  const { step, rate } = req.body;
  try {
    const project = await getProject({ "steps._id": step._id });
    // const updatedVendor = await getVendorAfterCombinationsUpdated({ project, step, rate });
    // res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on adding combination for Vendor");
  }
});

router.post('/import-rates', async (req, res) => {
  const { vendorId, ratesData, prop } = req.body;
  try {
    // const updatedVendor = await importRates({ vendorId, ratesData, prop });
    // res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on importing rates to Vendor");
  }
});

router.post('/new-vendor', upload.fields([{ name: 'photo' }]), async (req, res) => {
  let vendor = JSON.parse(req.body.vendor);
  const photoFile = req.files["photo"];
  try {
    const saveVendor = await Vendors.create(vendor);
    const id = saveVendor.id;
    if (photoFile) {
      await moveFile(photoFile[0], id);
      vendor.photo = `/vendorsDocs/${id}/${photoFile[0].filename}`;
    }
    const updatedVendor = await getVendorAfterUpdate({ "_id": id }, { photo: vendor.photo });
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on creating Vendor");
  }
});

router.post('/update-vendor', upload.fields([{ name: 'photo' }]), async (req, res) => {
  let vendor = JSON.parse(req.body.vendor);
  const photoFile = req.files["photo"];
  try {
    if (photoFile) {
      await moveFile(photoFile[0], vendor._id);
      vendor.photo = `/vendorsDocs/${vendor._id}/${photoFile[0].filename}`;
    }
    const updatedVendor = await getVendorAfterUpdate({ "_id": vendor._id }, vendor);
    res.send(updatedVendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on updating Vendor");
  }
});

router.get('/rates/:id', async (req, res) => {
  const { id: vendorId } = req.params;
  try {
    const { rates } = await getVendor({ _id: vendorId });
    res.send(rates);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error on getting vendor\'s rates');
  }
});

router.post('/rates/:id', async (req, res) => {
  const { id: vendorId } = req.params;
  const { itemIdentifier, updatedItem } = req.body;
  try {
    await updateVendorsRatePrices(vendorId, itemIdentifier, updatedItem);
    res.send('Saved')
  } catch (err) {
    console.log(err);
    res.status(500).send('Error on updating vendor\'s rates');
  }
});

router.post('/rates/change-pricelist/:id', async (req, res) => {
  const { id: vendorId } = req.params;
  try {
    await changeMainRatePricelist(vendorId, req.body, true);
    res.send('Saved');
  } catch (err) {
    console.log(err);
    res.status(500).send('Error on changing pricelist');
  }
});

router.post('/rates/sync-cost/:id', async (req, res) => {
  const { id: vendorId } = req.params;
  const { tableKey, row } = req.body;
  try {
    await syncVendorRatesCost(vendorId, tableKey, row);
    res.send('Synced');
  } catch (err) {
    console.log(err);
    res.status(500).send('Error on syncing vendor\'s rates');
  }
});

router.post('/rates/rate-combinations/:id', async (req, res) => {
  const { id: vendorId } = req.params;
  try {
    const ratePricelist = await getRatePricelist(vendorId, req.body, true);
    res.send(ratePricelist);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error on getting vendor rate\'s combinations');
  }
});

router.post('/update-vendor-status', async (req, res) => {
  const { id, isTest } = req.body;
  try {
    await Vendors.updateOne({ "_id": id }, { "isTest": isTest });
    const vendor = await getVendor({ "_id": id });
    res.send(vendor);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on updating Vendor status");
  }
});

router.delete('/deletevendor/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Vendors.deleteOne({ "_id": id });
    await fse.remove('./dist/vendorsDocs/' + id);
    res.send("Vendor deleted");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on deleting Vendor");
  }
});

router.post('/update-matrix', async (req, res) => {
  const { _id, matrix } = req.body;
  try {
    const updatedVendor = await getVendorAfterUpdate({ "_id": _id }, { matrix: matrix });
    res.send(updatedVendor);
  } catch (err) {
    res.status(500).send("Error on updating Vendor's matrix");
  }
});

router.get('/any-step', async (req, res) => {
  const { id } = req.query;
  try {
    const project = await getProject({ "steps.vendor": id });
    res.send(project);
  } catch (err) {
    res.status(500).send("Error on gettinf any step with current Vendor");
  }
});

router.get('/lang-tests', async (req, res) => {
  try {
    const tests = await getLangTests({});
    res.send(tests);
  } catch (err) {
    res.status(500).send("Error on getting lang tests for vendors");
  }
});

router.post('/lang-test', upload.fields([{ name: 'testFile' }]), async (req, res) => {
  const stringifiedData = req.body;
  const langTest = Object.keys(stringifiedData).reduce((acc, cur) => {
    acc[cur] = JSON.parse(stringifiedData[cur]);
    return acc;
  }, {});
  const { testFile } = req.files;
  const file = testFile ? testFile[0] : "";
  try {
    await updateLangTest(langTest, file);
    res.send("saved");
  } catch (err) {
    res.status(500).send("Error on updating lang tests for vendors");
  }
});

router.post('/remove-lang-test', async (req, res) => {
  const { _id, path } = req.body;
  try {
    await removeLangTest(_id, path);
    res.send("removed");
  } catch (err) {
    res.send(500).send("Error on removing lang tests for vendors");
  }
});

router.post('/test-emails', async (req, res) => {
  const { vendor, qualification, testPath, message } = req.body;
  try {
    await notifyTestStatus({ vendor, qualification, testPath, template: message });
    res.send("email sent");
  } catch (err) {
    res.send(500).send("Error on sending test status email to vendor");
  }
});

router.post("/get-message", async (req, res) => {
  try {
    const message = await testSentMessage(req.body);
    res.send({ message });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error on getting quote message");
  }
});
module.exports = router;
