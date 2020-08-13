const { getVendor, getVendors, getVendorAfterUpdate, getFilteredVendors } = require("./getVendors");
const {
  saveVendorDocument, saveVendorDocumentDefault, removeVendorDoc, saveHashedPassword, getPhotoLink,
  removeOldVendorFile, updateVendorEducation, removeVendorEdu, updateVendorAssessment
} = require("./info");
const { getJobs, updateStepProp } = require("./jobs");
const { manageNewApplication } = require("./application");
const { notifyTestStatus } = require("./testEmails");
const { updateVendorCompetencies, deleteVendorCompetencies } = require('./competencies');
const { saveQualifications } = require('./qualifications');
const { updateVendorsRatePrices } = require('./updateVendorRates');
const { syncVendorRatesCost } = require('./syncVendorRatesCost');
const { createRateRowFromQualification } = require('./createVendorRates');

module.exports = {
  getVendor,
  getVendors,
  getVendorAfterUpdate,
  getFilteredVendors,
  saveVendorDocument,
  saveVendorDocumentDefault,
  removeVendorDoc,
  saveHashedPassword,
  getPhotoLink,
  removeOldVendorFile,
  getJobs,
  updateStepProp,
  manageNewApplication,
  updateVendorEducation,
  removeVendorEdu,
  updateVendorAssessment,
  notifyTestStatus,
  updateVendorCompetencies,
  deleteVendorCompetencies,
  saveQualifications,
  updateVendorsRatePrices,
  syncVendorRatesCost,
  createRateRowFromQualification
};
