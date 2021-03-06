const {
	getProjectsForVendorPortal,
	getProject,
	taskCompleteNotifyPM,
	notifyManagerStepStarted,
	stepCompletedNotifyPM,
	nextVendorCanStartWorkNotification,
	notifyStepDecisionMade,
	setApprovedStepStatus
} = require('../projects')

const { Projects, Delivery, Languages } = require('../models')
const { updateMemoqProjectUsers } = require('../services/memoqs/projects')
const { dr1Instructions, drInstructionsCompliance } = require('../enums')
const fs = require('fs')

const getJobDetails = async (_stepId, _projectId, _vendorId) => {
	const { projectName, projectId, steps, _id, status, brief, deadline, industry, tasks, projectManager, SmartlingJobID } = await getProject({ _id: _projectId })
	let step = steps.find(({ _id, vendor }) => `${ _id }` === `${ _stepId }` && `${ vendor._id }` === `${ _vendorId }`)
	step = step._doc
	const stepTask = tasks.find(item => item.taskId === step.taskId)
	const prevStep = getPrevStepData(stepTask, steps, step)

	delete step.finance
	delete step.clientRate
	delete step.defaultStepPrice
	step.nativeFinance.Price.receivables = 0

	return {
		...step,
		currentTask: stepTask,
		_projectId: _id,
		projectId: projectId,
		projectName: projectName,
		projectStatus: status,
		projectDeadline: deadline,
		brief: brief,
		industry,
		SmartlingJobID,
		memoqDocs: stepTask.memoqDocs,
		sourceFiles: stepTask.sourceFiles,
		refFiles: stepTask.refFiles,
		targetFiles: stepTask.targetFiles,
		prevStep,
		projectManager
	}
}

function getPrevStepData(stepTask, steps, step) {
	const brotherlySteps = steps.filter(i => i.taskId === stepTask.taskId)
	const prevStep = brotherlySteps.find(i => i.stepNumber === step.stepNumber - 1)
	if (!prevStep) return false

	const prevProgress = isNaN(prevStep.progress)
			? +(prevStep.progress.wordsDone / prevStep.progress.totalWordCount * 100).toFixed(2)
			: prevStep.progress

	return {
		status: prevStep.status,
		progress: prevProgress
	}
}

// async function getJobs(id) {
// 	const allLanguages = await Languages.find()
// 	try {
// 		let jobs = []
// 		const projects = await getProjectsForVendorPortal({ 'steps.vendor': id })
// 		for (let project of projects) {
// 			const steps = getSteps(project, id, allLanguages)
// 			jobs.push(...steps)
// 		}
// 		return jobs
// 	} catch (err) {
// 		console.log(err)
// 		console.log("Error in getJobs")
// 	}
// }

// function getSteps(project, id, allLanguages) {
// 	try {
// 		const { steps, tasks } = project
// 		let assignedSteps = []
// 		let filteredSteps = steps.filter(item => item.vendor && item.vendor.id === id)
//
// 		for (let step of filteredSteps) {
// 			// if (step.name !== 'invalid') {
// 			const stepTask = tasks.find(item => item.taskId === step.taskId)
// 			const prevStep = getPrevStepData(stepTask, steps, step)
// 			const { targetLanguage, sourceLanguage } = step._doc
// 			assignedSteps.push({
// 				...step._doc,
// 				currentTask: stepTask,
// 				project_Id: project._id,
// 				projectId: project.projectId,
// 				projectName: project.projectName,
// 				projectStatus: project.status,
// 				brief: project.brief,
// 				manager: project.projectManager,
// 				industry: project.industry,


// 				targetFiles: stepTask.targetFiles,
// 				taskTargetFiles: stepTask.targetFiles,
// 				fullSourceLanguage: getLangBySymbol(sourceLanguage),
// 				fullTargetLanguage: getLangBySymbol(targetLanguage),
// 				prevStep
// 			})
// 			// }
// 		}
// 		return assignedSteps
//
// 		function getLangBySymbol(symbol) {
// 			return allLanguages.find(({ symbol: s }) => s === symbol)
// 		}
// 	} catch (err) {
// 		console.log(err)
// 	}
// }


async function updateStepProp({ jobId, prop, value }) {

	try {
		const project = await getProject({ 'steps._id': jobId })
		const steps = project.steps.map(item => {
			if (item.id === jobId) {
				item.status = value
				if (prop === "status" && (value === "Approved" || value === "Rejected")) item.vendorsClickedOffer = [ item.vendor ]
			}
			return item
		})

		if (prop === "status") {
			await manageStatuses({ project, steps, jobId, status: value })
		}
	} catch (err) {
		console.log(err)
		console.log("Error in updateStepProp")
	}
}

async function manageStatuses({ project, steps, jobId, status }) {
	let { status: projectStatus, _id, tasks } = project
	const step = steps.find(item => item.id === jobId)
	const _taskIdx = tasks.findIndex(item => item.taskId === step.taskId)
	try {

		if (status === "Completed") {
			await manageCompletedStatus({ project, jobId, steps, tasks, taskIndex: _taskIdx })
		}

		if (status === "Approved") {
			const updatedSteps = setApprovedStepStatus({ project, step, steps })
			await notifyStepDecisionMade({ project, step, decision: 'accept' })
			await Projects.updateOne({ "steps._id": jobId }, { steps: updatedSteps })
		}

		if (status === "Rejected") {
			const updatedSteps = setRejectedStatus({ steps, jobId })
			await notifyStepDecisionMade({ project, step, decision: 'rejected' })
			await Projects.updateOne({ "steps._id": jobId }, { steps: updatedSteps })
		}

		if (status === "In progress") {
			if (tasks[_taskIdx].status !== "In progress") {
				tasks[_taskIdx].status = "In progress"
				projectStatus = projectStatus === 'Approved' ? 'In progress' : projectStatus
				await notifyManagerStepStarted(project, step)
			}
			await Projects.updateOne({ 'steps._id': jobId }, { steps, tasks, status: projectStatus })
		}

	} catch (err) {
		console.log(err)
		console.log("Error in manageStatuses")
	}
}

async function manageCompletedStatus({ project, jobId, steps, tasks, taskIndex }) {
	const step = steps.find(item => item.id === jobId)
	const task = tasks[taskIndex]

	try {
		await stepCompletedNotifyPM(project, step)

		if (isAllStepsCompleted({ steps, task: tasks[taskIndex] })) {
			tasks[taskIndex].status = 'Pending Approval [DR1]'
			await Projects.updateOne({ "steps._id": jobId }, { tasks, steps })
			await pushTasksToDR1(project, task, step)
			await taskCompleteNotifyPM(project, task)

		} else if (step.step.title === 'Post-Editing' && !step.isReceivableVisible) {
			//TODO: !!! temp checks !!! Only MT POST-EDITING first ==>>

			tasks[taskIndex].status = 'Pending Approval [DR1]'
			const actualStepsIds = steps.filter(({ status, taskId }) => (status !== 'Cancelled' && status !== 'Cancelled Halfway') && taskId === task.taskId).map(i => i.stepId)
			steps = steps.map(item => {
				if(actualStepsIds.includes(item.stepId)) item.status = 'Completed'
				return item
			})
			await Projects.updateOne({ "steps._id": jobId }, { tasks, steps })
			await pushTasksToDR1(project, task, step)
			await taskCompleteNotifyPM(project, task)
		} else {
			//TODO: Need to refactor error translation second step canceled and stepNumber need to be +2

			const actualSteps = steps.filter(({ status, taskId }) => (status !== 'Cancelled' && status !== 'Cancelled Halfway') && taskId === task.taskId)
			let nextStep = actualSteps.find(item => item.stepNumber === step.stepNumber + 1)
			// nextStep = !!nextStep ?  actualSteps.find(item => item.stepNumber === step.stepNumber + 2) : undefined

			if (nextStep) {
				tasks[taskIndex].status = 'In progress'

				if ([ 'Approved', 'Ready to Start', 'Waiting to Start' ].includes(nextStep.status)) {
					const updatedSteps = setApprovedStepStatus({ project, step: nextStep, steps })
					await Projects.updateOne({ "steps._id": jobId }, { steps: updatedSteps, tasks })
				} else {
					await Projects.updateOne({ "steps._id": jobId }, { steps, tasks })
				}
				await nextVendorCanStartWorkNotification({ nextStep })
			}
		}
	} catch (err) {
		console.log(err)
		console.log("Error in manageCompletedStatus")
	}
}

const pushTasksToDR1 = async (project, task, step) => {
	const { _id, projectManager, accountManager } = project
	const instructions = step.step.title === 'Compliance' ? drInstructionsCompliance : dr1Instructions
	const files = getTaskTargetFilesWithCopy(project, task)

	const _idxTaskDr1 = project.tasksDR1.findIndex(item => item.taskId === task.taskId)

	if (_idxTaskDr1 === -1) {
		project.tasksDR1.push({
			dr1Manager: projectManager,
			dr2Manager: accountManager,
			instructions,
			taskId: task.taskId,
			files
		})
	} else {
		project.tasksDR1[_idxTaskDr1].files = files
	}

	await Projects.updateOne({ _id: _id }, { tasksDR1: project.tasksDR1 })
}

function getTaskTargetFilesWithCopy(project, task) {
	return task.targetFiles.reduce((acc, cur) => {
		const originalName = cur.path.split("/").pop()
		const dr1FileName = `${ Math.floor(Math.random() * 1000000) }-${ originalName }`

		fs.copyFile(`./dist/projectFiles/${ project._id }/${ originalName }`, `./dist/projectFiles/${ project._id }/${ dr1FileName }`, (err) => {
			if (err) throw err
		})

		acc.push({
			fileName: dr1FileName,
			path: `/projectFiles/${ project._id }/${ dr1FileName }`,
			isFileApproved: false
		})

		return acc
	}, [])
}

function setRejectedStatus({ steps, jobId }) {
	return steps.map(item => {
		if (item.id === jobId) {
			item.status = "Rejected"
		}
		return item
	})
}

function isAllStepsCompleted({ steps, task }) {
	const taskSteps = steps
			.filter(item => item.taskId === task.taskId)
			.filter(({ status }) => status !== 'Cancelled' && status !== 'Cancelled Halfway')

	return taskSteps.length ? taskSteps.every(item => item.status === 'Completed') : false
}

module.exports = {
	// getJobs,
	updateStepProp,
	setRejectedStatus,
	manageStatuses,
	getJobDetails
}
