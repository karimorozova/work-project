const {
	getProject,
	getProjects,
	getProjectsForPortalAll,
	updateProject,
	getFilteredProjects,
	getProjectAfterUpdate,
	getProjectsForVendorPortal,
	getProjectsForPortalList,
	getProjectForClientPortal,
	getProjectsForVendorPortalAll,
	getShortProjectList,
} = require('./getProjects')

const {
	storeFiles,
	createArchiveForDeliverableItem,
	manageDeliveryFile,
	getPdf,
	generateAndSaveCertificate,
	copyProjectFiles,
	generatePOFile,
	generateReceivablesReportsByTemplate
} = require('./files')

const {
	getProjectAfterCancelTasks,
	updateProjectStatus,
	updateWithApprovedTasks,
	downloadCompletedFiles,
	updateProjectProgress,
	getAfterReopenSteps,
	updateNonWordsTaskTargetFiles,
	updateOtherProject,
	assignMemoqTranslator,
	checkProjectHasMemoqStep,
	assignProjectManagers,
	regainWorkFlowStatusByStepId,
	setStepDeadlineProjectAndMemoq,
	cancelProjectInMemoq,
	setApprovedStepStatus,
	reImportFilesFromMemoq,
	generateTargetFileFromMemoq,
	manageReceivableVisible
} = require('./updates')

const {
	stepCancelNotifyVendor,
	taskCompleteNotifyPM,
	notifyManagerStepStarted,
	notifyStepDecisionMade,
	stepCompletedNotifyPM,
	notifyStepReopened,
	notifyVendorStepStart,
	sendQuoteMessage,
	sendCostQuoteMessage,
	nextVendorCanStartWorkNotification
} = require('./emails')

const {
	createProject,
	createTasks,
	createRequestTasks,
	updateRequestTasks,
	createProjectFromRequest,
	autoCreatingTaskInProject,
	autoCreatingTranslationTaskInProject,
	autoCreatingTranslationTaskInProjectByMemoqLink,
	autoCreatingTranslationTaskInProjectByXTMFile,
	autoCreatingTranslationTaskInProjectBySmartlingFile,
	createProjectFromMemoq,
	createProjectFromXTMFile,
	createProjectIndividual
} = require('./create')


const {
	createTasksForWordcount
} = require('./taskForWordcount')

const {
	addDR2,
	addMultiLangDR2,
	removeDR2,
	removeMultiDR2,
	taskApproveReady,
	taskApproveNotify,
	taskApproveDeliver,
	taskApproveDeliverMany,
	changeManagerDR2,
	changeManager,
	rollbackReview,
	targetFileDR2,
	changeTaskStatus,
	targetFileDR1,
	approveInstructionDR2,
	approveFilesDR2,
	changeManagersDR1,
	saveCertificateTODR1Files,
	changeNameLang
} = require('./delivery')

const {
	getPriceAfterApplyingDiscounts,
	manageProjectName
} = require('./helpers')


//EXPORT  =============================>
module.exports = {
	manageReceivableVisible,
	getShortProjectList,
	getProjectsForVendorPortalAll,
	generateTargetFileFromMemoq,
	reImportFilesFromMemoq,
	createProjectIndividual,
	createProjectFromXTMFile,
	createProjectFromMemoq,
	autoCreatingTranslationTaskInProjectByXTMFile,
	autoCreatingTranslationTaskInProjectByMemoqLink,
	autoCreatingTranslationTaskInProjectBySmartlingFile,
	getProjectForClientPortal,
	setApprovedStepStatus,
	getProjectsForVendorPortal,
	generateReceivablesReportsByTemplate,
	generatePOFile,
	nextVendorCanStartWorkNotification,
	cancelProjectInMemoq,
	autoCreatingTranslationTaskInProject,
	manageProjectName,
	copyProjectFiles,
	setStepDeadlineProjectAndMemoq,
	saveCertificateTODR1Files,
	autoCreatingTaskInProject,
	createProjectFromRequest,
	updateRequestTasks,
	createRequestTasks,
	changeManagersDR1,
	approveFilesDR2,
	approveInstructionDR2,
	targetFileDR1,
	changeTaskStatus,
	targetFileDR2,
	rollbackReview,
	changeManagerDR2,
	changeManager,
	taskApproveDeliverMany,
	createArchiveForDeliverableItem,
	taskApproveDeliver,
	taskApproveNotify,
	taskApproveReady,
	removeDR2,
	generateAndSaveCertificate,
	getProject,
	getProjects,
	updateProject,
	updateOtherProject,
	getFilteredProjects,
	storeFiles,
	manageDeliveryFile,
	getProjectAfterCancelTasks,
	updateProjectStatus,
	stepCancelNotifyVendor,
	createProject,
	createTasks,
	taskCompleteNotifyPM,
	updateProjectProgress,
	updateWithApprovedTasks,
	getAfterReopenSteps,
	updateNonWordsTaskTargetFiles,
	createTasksForWordcount,
	downloadCompletedFiles,
	notifyManagerStepStarted,
	stepCompletedNotifyPM,
	notifyStepDecisionMade,
	notifyStepReopened,
	getPdf,
	notifyVendorStepStart,
	getProjectAfterUpdate,
	assignMemoqTranslator,
	checkProjectHasMemoqStep,
	assignProjectManagers,
	sendQuoteMessage,
	sendCostQuoteMessage,
	getPriceAfterApplyingDiscounts,
	regainWorkFlowStatusByStepId,
	addDR2,
	addMultiLangDR2,
	removeMultiDR2,
	changeNameLang,
	getProjectsForPortalAll,
	getProjectsForPortalList
}
