const { getProject, getProjects, updateProject, getFilteredProjects } = require('./getProjects');
const { storeFiles, getDeliverablesLink, manageDeliveryFile } = require('./files');
const { getProjectAfterCancelTasks, updateProjectStatus, setStepsStatus, updateWithApprovedTasks, downloadCompletedFiles,
    updateProjectProgress, getAfterReopenSteps, updateNonWordsTaskTargetFiles } = require('./updates');
const { stepCancelNotifyVendor, getMessage, taskCompleteNotifyPM, notifyClientTaskReady, sendClientDeliveries, notifyDeliverablesDownloaded, sendTasksQuote, notifyProjectDelivery } = require('./emails');
const  { createProject, createTasks, createTasksWithWordsUnit, createTasksFromRequest } = require('./create');
const { getProjectWithUpdatedFinance, checkProjectForMetrics } = require('./metrics');
const { getProjectAfterFinanceUpdated } = require('./porjectFinance');

module.exports = {
    getProject,
    getProjects,
    updateProject,
    getFilteredProjects,
    storeFiles,
    manageDeliveryFile,
    getProjectAfterCancelTasks,
    updateProjectStatus,
    stepCancelNotifyVendor,
    setStepsStatus,
    createProject,
    createTasks,
    getMessage,
    taskCompleteNotifyPM,
    notifyClientTaskReady,
    getDeliverablesLink,
    sendClientDeliveries,
    notifyDeliverablesDownloaded,
    getProjectWithUpdatedFinance,
    updateProjectProgress,
    updateWithApprovedTasks,
    sendTasksQuote,
    getAfterReopenSteps,
    getProjectAfterFinanceUpdated,
    updateNonWordsTaskTargetFiles,
    createTasksFromRequest,
    checkProjectForMetrics,
    createTasksWithWordsUnit,
    downloadCompletedFiles,
    notifyProjectDelivery
}