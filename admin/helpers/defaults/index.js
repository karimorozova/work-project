const { defaultLanguages } = require('./defaultLanguages');
const {
  getDefaultBasicPrices,
  getDefaultStepMultipliers,
  getDefaultIndustryMultipliers
} = require('./defaultPriceLists');
const { defaultUsers } = require('./defaultUsers');
const { defaultSteps, defaultUnits } = require('./defaultStepsAndUnits');
const { defaultClients } = require('./defaultClients');
const { defaultVendors } = require('./defaultVendor');
const { defaultTimezones } = require('./defaultTimezones');
const { defaultIndustries } = require('./defaultIndustries');
const { defaultServices } = require('./defaultServices');
const { defaultGroups } = require('./defaultGroups');

module.exports = {
  defaultLanguages,
  getDefaultBasicPrices,
  getDefaultStepMultipliers,
  getDefaultIndustryMultipliers,
  defaultUsers,
  defaultSteps,
  defaultUnits,
  defaultClients,
  defaultVendors,
  defaultTimezones,
  defaultIndustries,
  defaultServices,
  defaultGroups
};
