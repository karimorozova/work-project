const { getFilteredOtherProjects } = require('./filteredOtherProjects');
const { createOtherProjectFinanceData } = require('./financeData');
const { filterMemoqProjectsVendors, isAllTasksFinished, checkProjectStructure } = require('./helpers');
const { updateMemoqProjectFinance, updateAllMemoqProjects } = require('./otherProjectUpdates');

module.exports = {
  getFilteredOtherProjects,
  createOtherProjectFinanceData,
  filterMemoqProjectsVendors,
  isAllTasksFinished,
  checkProjectStructure,
  updateMemoqProjectFinance,
  updateAllMemoqProjects
};