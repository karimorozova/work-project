const { getFilteredOtherProjects } = require('./filteredOtherProjects');
const { createOtherProjectFinanceData } = require('./financeData');
const { filterMemoqProjectsVendors, checkProjectStructure, doesAllTasksFinished, defineProjectStatus, clearGarbageProjects } = require('./helpers');
const {
	updateMemoqProjectFinance,
	updateAllMemoqProjects,
	updateMemoqProjectStatus,
	updateStatusesForOtherProjects,
	replaceQueryStatus
} = require('./otherProjectUpdates');
const { getMemoqProjectsForClientPortal } = require('./getMemoqProject');

module.exports = {
	getFilteredOtherProjects,
	createOtherProjectFinanceData,
	filterMemoqProjectsVendors,
	checkProjectStructure,
	updateMemoqProjectFinance,
	updateAllMemoqProjects,
	updateMemoqProjectStatus,
	// doesAllTasksFinished,
	updateStatusesForOtherProjects,
	getMemoqProjectsForClientPortal,
  defineProjectStatus,
	clearGarbageProjects,
	replaceQueryStatus
};
