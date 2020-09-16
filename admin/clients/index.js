const {
  getClient,
  getClients,
  getClientAfterUpdate,
  gerFilteredClients,
  getClientsForNewProject,
  getClientRates
} = require('./getClients');
const {
  updateClientRates,
  deleteClientRates,
  getNeededLangPair,
  getNeededStepRow,
  getNeededCurrency,
  getStepMultipliersCombinations,
  getPricelistCombinations,
  replaceOldItem,
  changePricelistTable,
  generateNewPricelistCombinations,
  getClientAfterCombinationsUpdated,
} = require('./clientRates');
const { updateClientInfo, saveClientDocumentDefault, saveClientDocument, removeClientDoc } = require('./info');
const { getAfterTaskStatusUpdate, updateClientProjectDate } = require('./projects');
const { updateClientService, deleteClientService } = require('./clientService');
const { updateRates } = require('./updateClientRates');
const {
  syncClientRatesCost,
  synchronizeBasicPrice,
  synchronizeStepMultiplier,
  synchronizeIndustryMultiplier,
  synchronizePricelistTable
} = require('./syncClientRatesCost');

const { updateClientMatrix, syncClientMatrix } = require('./clientMatrix');

const clients = {
  getClient,
  getClients,
  getClientRates,
  gerFilteredClients,
  updateClientRates,
  deleteClientRates,
  getClientAfterUpdate,
  updateClientInfo,
  getAfterTaskStatusUpdate,
  saveClientDocument,
  updateClientService,
  deleteClientService,
  updateRates,
  removeClientDoc,
  saveClientDocumentDefault,
  syncClientRatesCost,
  getNeededLangPair,
  getNeededStepRow,
  getNeededCurrency,
  getStepMultipliersCombinations,
  getPricelistCombinations,
  replaceOldItem,
  changePricelistTable,
  synchronizeBasicPrice,
  synchronizeStepMultiplier,
  synchronizeIndustryMultiplier,
  synchronizePricelistTable,
  generateNewPricelistCombinations,
  updateClientProjectDate,
  getClientsForNewProject,
  updateClientMatrix,
  syncClientMatrix,
  getClientAfterCombinationsUpdated
};

module.exports = clients;
