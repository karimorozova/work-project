const { MemoqProject, GmailProjectsStatuses, Clients, Vendors } = require('../../../models');
const { checkProjectStructure } = require('./helpers');
const { createOtherProjectFinanceData } = require('./financeData');
const { getMemoqProjects, getProjectAfterUpdate } = require('./getMemoqProject');
const {saveOtherProjectStatuses} = require("../../../gmail");

/**
 *
 * @param {String} querySource - describes status of progress
 * @returns {Array} - returns updated(if fits) projects
 */
const updateAllMemoqProjects = async (querySource) => {
  let query = {};
  switch (querySource) {
    case 'In-progress':
      query.status = 'In progress';
      break;
    case 'Quote':
      query.status = 'Quote';
      break;
    case 'Closed':
      query.status = 'Closed';
  }

  const projects = await MemoqProject.find(query);
  const clients = await Clients.find();
  const vendors = await Vendors.find();
  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];
    const { documents, lockedForRecalculation } = project;
    if (!lockedForRecalculation) {
      const doesHaveCorrectStructure = checkProjectStructure(clients, vendors, project, documents);
      if (doesHaveCorrectStructure) {
        await createOtherProjectFinanceData({ project, documents });
      }
    }
  }
  return await getMemoqProjects(query);
};


const updateStatusesForOtherProjects = async () => {
  let allProjectsStatuses = await GmailProjectsStatuses.find();
  let allProjects =  await MemoqProject.find();
  if(!allProjectsStatuses.length) {
    await saveOtherProjectStatuses();
    allProjectsStatuses = await GmailProjectsStatuses.find();
  }
  allProjectsStatuses = allProjectsStatuses.filter(({ isRead }) => !isRead);

  const readProjectsByStatusAndUpdateOtherProjects = async (status) => {
    const filteredByStatus = (filter) => allProjectsStatuses.filter(({ status: s }) => s === filter);
    for (let { name: fromStatusName, _id: fromStatusId, status: fromStatus } of filteredByStatus(status)){

      if(allProjects.findIndex(({name}) => name === fromStatusName) !== -1 ) {
        await GmailProjectsStatuses.updateOne({"_id": fromStatusId}, { isRead: true });
        await MemoqProject.updateOne({"name": fromStatusName}, { fromStatus });
      }
    }
  };
  await readProjectsByStatusAndUpdateOtherProjects('Quote');
  await readProjectsByStatusAndUpdateOtherProjects('In progress');
  await readProjectsByStatusAndUpdateOtherProjects('Closed');
};

/**
 *
 * @param project
 * @returns {Object} - returns either updated or same project
 */
const updateMemoqProjectFinance = async (project) => {
  const clients = await Clients.find();
  const vendors = await Vendors.find();
  const { documents, lockedForRecalculation } = project;
  const doesHaveCorrectStructure = checkProjectStructure(clients, vendors, project, documents);
  if (!doesHaveCorrectStructure || lockedForRecalculation) {
    return project;
  }
  return await createOtherProjectFinanceData({ project, documents });
};

/**
 *
 * @param {ObjectId} _id
 * @param {String} direction - describes a direction for update
 * @returns {Object} - returns project with updated status
 */
const updateMemoqProjectStatus = async (_id, direction) => {
  const { status } = await MemoqProject.findOne({ _id });
  let updatedStatus;
  if (direction === 'Forward') {
    switch (status) {
      case 'Quote':
        updatedStatus = 'In progress';
        break;
      case 'In progress':
        updatedStatus = 'Closed';
    }
  } else {
    switch (status) {
      case 'In progress':
        updatedStatus = 'Quote';
        break;
      case 'Closed':
        updatedStatus = 'In progress';
    }
  }
  return await getProjectAfterUpdate({ _id }, { status: updatedStatus });
};

module.exports = {
  updateAllMemoqProjects,
  updateMemoqProjectFinance,
  updateMemoqProjectStatus,
  updateStatusesForOtherProjects
};
