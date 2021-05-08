const {
	sendEmail,
	managerNotifyMail,
	clientQuoteToEmails
} = require('../utils/mailTemplate')
const {
	managerTaskCompleteNotificationMessage,
	deliverablesDownloadedMessage,
	stepStartedMessage,
	stepCompletedMessage,
	stepDecisionMessage,
	readyForDr2Message
} = require("../emailMessages/internalCommunication")
const {
	messageForClientSendQuote,
	emailMessageForContact,
	taskReadyMessage,
	taskDeliveryMessage,
	messageForClientSendCostQuote
} = require('../emailMessages/clientCommunication')
const {
	stepCancelledMessage,
	stepMiddleCancelledMessage,
	stepReopenedMessage,
	stepReadyToStartMessage
} = require('../emailMessages/vendorCommunication')
const { getProject } = require("./getProjects")
const { getService } = require("../services/getServices")
const { User, Units, Step, Delivery, Projects } = require("../models")
const {
	getDeliverablesLink,
  createArchiveForDeliverableItem,
  getProjectDeliverables,
	getPdf
} = require("./files")
const fs = require('fs')

async function stepCancelNotifyVendor(steps) {
	try {
		for (let step of steps) {
			if (step.vendor && step.status !== "Completed") {
				const message = ifStepStarted(step.status) ? stepMiddleCancelledMessage(step) : stepCancelledMessage(step)
				step["to"] = step.vendor.email
				const id = ifStepStarted(step.status) ? "V004.0" : "V003.0"
				const subject = ifStepStarted(step.status) ? "Step cancelled in the middle" : "Step cancelled"
				step.subject = `${ subject }: ${ step.stepId } (${ step.serviceStep.title }) (ID ${ id })`
				await sendEmail(step, message)
			}
		}
	} catch (err) {
		console.log(err)
		console.log("Error in stepCancelNotifyVendor")
	}

	function ifStepStarted(status) {
		const startStepStatuses = [ 'Started', 'In progress' ]
		return startStepStatuses.includes(status)
	}
}

const allUnitsAndSteps = async () => {
	const allUnits = await Units.find()
	const allSettingsSteps = await Step.find()
	return {
		allUnits, allSettingsSteps
	}
}

async function getCostMessage(projectId) {
	const { allUnits, allSettingsSteps } = await allUnitsAndSteps()
	try {
		let quote = await getQuoteInfo(projectId, [])
		return messageForClientSendCostQuote(quote, allUnits, allSettingsSteps)
	} catch (err) {
		console.log(err)
		console.log('Error in getMessage')
	}
}

async function getMessage(projectId, messageTarget, taskIds = []) {
	const { allUnits, allSettingsSteps } = await allUnitsAndSteps()
	try {
		let quote = await getQuoteInfo(projectId, taskIds)
		switch (messageTarget) {
			case 'quote':
			case 'task':
				return messageForClientSendQuote(quote, allUnits, allSettingsSteps)
			default:
				return emailMessageForContact(quote)
		}
	} catch (err) {
		console.log(err)
		console.log('Error in getMessage')
	}
}

const sendCostQuoteMessage = async (project, message, arrayOfEmails) => {
	const { allUnits, allSettingsSteps } = await allUnitsAndSteps()
	let subject = 'Cost Quote'
	let messageId = 'C001.3'

	const allArrayOfEmail = [...arrayOfEmails, project.accountManager.email, project.projectManager.email, 'am@pangea.global' ]
	for (let contactEmail of allArrayOfEmail) {
		const pdf = await getPdf(allUnits, allSettingsSteps, project)
		const attachments = [ { content: fs.createReadStream(pdf), filename: 'quote.pdf' } ]
		await clientQuoteToEmails(project.accountManager, {
			email: contactEmail,
			attachments,
			subject: `${ subject } ${ project.projectId } - ${ project.projectName } (ID ${ messageId })`
		}, dynamicClientName(message, contactEmail, project))
		fs.unlink(pdf, (err) => {
			if (err) console.log(err)
		})
	}
}

const sendQuoteMessage = async (project, message, arrayOfEmails, tasksIds = []) => {
	const { allUnits, allSettingsSteps } = await allUnitsAndSteps()
	let subject = project.isUrgent ? 'URGENT! Decide on a Quote' : 'Decide on a Quote'
	let messageId = 'C001.0'
	if (project.isPriceUpdated) {
		messageId = 'C001.1'
		subject += ' (UPDATED)'
	}

	const allArrayOfEmail = [...arrayOfEmails, project.accountManager.email, project.projectManager.email, 'am@pangea.global' ]
	for (let contactEmail of allArrayOfEmail) {
		const pdf = tasksIds.length ? await getPdf(allUnits, allSettingsSteps, project, tasksIds) : await getPdf(allUnits, allSettingsSteps, project)
		const attachments = [ { content: fs.createReadStream(pdf), filename: 'quote.pdf' } ]
		await clientQuoteToEmails(project.accountManager, {
			email: contactEmail,
			attachments,
			subject: `${ subject } ${ project.projectId } - ${ project.projectName } (ID ${ messageId })`
		}, dynamicClientName(message, contactEmail, project))
		fs.unlink(pdf, (err) => {
			if (err) console.log(err)
		})
	}
}

function dynamicClientName(message, contactEmail, project) {
	const currentContactIndex = project.clientContacts.findIndex(item => item.email === contactEmail)
	if (currentContactIndex !== -1) {
		const { firstName, surname } = project.clientContacts[currentContactIndex]
		const clientName = `<p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear ${ firstName } ${ surname || "" }</span></p>`
		return message.replace(`<div id="client-name-row">&nbsp;</div>`, clientName)
	} else {
		return message
	}
}

async function getQuoteInfo(projectId, tasksIds) {
	try {
		const project = await getProject({ '_id': projectId })
		const service = await getService({ '_id': project.tasks[0].service })
		let quote = { ...project._doc, id: project.id }
		quote.selectedTasks = tasksIds.length ? project.tasks.filter(task => tasksIds.includes(task.taskId)) : []
		quote.service = service.title
		return quote
	} catch (err) {
		console.log(err)
		console.log("Error in getQuoteInfo")
	}
}

async function stepCompletedNotifyPM(project, step) {
	const { projectManager, accManager } = await getAMPMbyProject(project)
	const subject = `Step completed: ${ step.stepId } ${ project.projectName } (ID I003.0)`
	const messagePM = stepCompletedMessage({ ...project._doc, step }, projectManager)
	const messageAM = stepCompletedMessage({ ...project._doc, step }, accManager)
	try {
		await sendEmail({ to: project.projectManager.email, subject }, messagePM)
		await sendEmail({ to: project.accountManager.email, subject }, messageAM)
	} catch (err) {
		console.log(err)
		console.log("Error in stepCompletedNotifyPM")
	}
}

async function notifyReadyForDr2({ dr2Manager, project, taskId }) {
	const { projectManager, accManager } = await getAMPMbyProject(project)
	const messagePM = await readyForDr2Message({ ...project._doc, dr2Manager, taskId }, projectManager)
	const messageAM = await readyForDr2Message({ ...project._doc, dr2Manager, taskId }, accManager)
	try {
		await managerNotifyMail({ email: project.projectManager.email }, messagePM, `Task is ready for DR2: ${ taskId } - ${ project.projectName } (I008.1)`)
		await managerNotifyMail({ email: project.accountManager.email }, messageAM, `Task is ready for DR2: ${ taskId } - ${ project.projectName } (I008.1)`)
	} catch (err) {
		console.log(err)
		console.log("Error in notifyReadyForDr2")
	}
}

async function taskCompleteNotifyPM(project, task) {
	const { projectManager, accManager } = await getAMPMbyProject(project)
	const messagePM = await getPMnotificationMessage(project, task, projectManager)
	const messageAM = await getPMnotificationMessage(project, task, accManager)
	try {
		await managerNotifyMail({ email: project.projectManager.email }, messagePM, `Task is ready for DR1: ${ task.taskId } - ${ project.projectName } (ID I008.0)`)
		await managerNotifyMail({ email: project.accountManager.email }, messageAM, `Task is ready for DR1: ${ task.taskId } - ${ project.projectName } (ID I008.0)`)
	} catch (err) {
		console.log(err)
		console.log("Error in taskCompleteNotifyPM")
	}
}

async function getPMnotificationMessage(project, task, user) {
	try {
		const service = await getService({ "_id": task.service })
		return managerTaskCompleteNotificationMessage({ ...project._doc, service: service.title, task }, user)
	} catch (err) {
		console.log(err)
		console.log("Error in getPMnotificationMessage")
	}
}

async function notifyClientDeliverablesReady({ project, contacts }) {
	contacts.push({ email: 'am@pangea.global', firstName: 'Account Managers' })
	// const task = project.tasks.find(item => item.taskId === taskId)
	try {
		for (let contact of contacts) {
			const message = taskReadyMessage({
        // task,
        contact,
        project
			})
      // const subject = `Task is ready: ${ taskId } - ${ task.service.title } (ID C006.2)`
			await sendEmail({ to: contact.email, subject: 'In dev' }, message)
		}
	} catch (err) {
		console.log(err)
		console.log("Error in notifyClientDeliverablesReady")
	}
}

  async function sendClientManyDeliveries({ projectId, entitiesForDeliver, user, contacts }) {
    // contacts.push({ email: 'am@pangea.global', firstName: 'Account Managers' })
    let updatedProject = await getProject({ "_id": projectId })

    for ( const { entityId, type } of entitiesForDeliver) {
      updatedProject = await createArchiveForDeliverableItem({type, entityId, projectId, user, tasksDR2: updatedProject.tasksDR2, tasksDeliverables: updatedProject.tasksDeliverables })
    }

    let archiveNumber = 0
    let attachmentsPaths = []
    for ( const { entityId } of entitiesForDeliver) {
      archiveNumber++
      const { path } = updatedProject.tasksDeliverables.find(({ deliverablesId }) => `${ deliverablesId }` === `${entityId}` )
      const filename = `${archiveNumber}-deliverables.zip`
      attachmentsPaths.push({ filename, path })
    }

    const accManager = await User.findOne({ "_id": updatedProject.accountManager.id })
    const subject = `Delivery in dev (ID C006.1)`
    for await (let contact of contacts) {
      const finalAttachments = attachmentsPaths.map(item => ({ filename: item.filename, path: `./dist${ item.path }` }))

      const message = taskDeliveryMessage({ task: '??', contact, accManager, ...updatedProject, id: updatedProject._id })
      await sendEmail({ to: contact.email, attachments: finalAttachments, subject }, message)
    }

    return updatedProject
  }

  async function sendClientDeliveries({ projectId, type, entityId, user, contacts }) {
	// contacts.push({ email: 'am@pangea.global', firstName: 'Account Managers' })
	try {
	  const { tasksDR2, tasksDeliverables } = await getProject({ "_id": projectId })
    const updatedProject = await createArchiveForDeliverableItem({ type, entityId, projectId, user, tasksDR2, tasksDeliverables })

		const accManager = await User.findOne({ "_id": updatedProject.accountManager.id })
    const subject = `Delivery in dev (ID C006.1)`

    const { path } = updatedProject.tasksDeliverables.find(({ deliverablesId }) => `${ deliverablesId }` === `${entityId}` )
		const content = fs.createReadStream(`./dist${ path }`)
		const attachments = [ { filename: "deliverables.zip", content } ]

		for await (let contact of contacts) {
			const finalAttachments = attachments
			 		.filter(item => item.filename === 'deliverables.zip')
			 		.map(item => ({ filename: item.filename, path: `./dist${ path }` }))

			const message = taskDeliveryMessage({ task: '??', contact, accManager, ...updatedProject, id: updatedProject._id })
			await sendEmail({ to: contact.email, attachments: finalAttachments, subject }, message)
		}
    return updatedProject
	} catch (err) {
		console.log(err)
		console.log("Error in sendClientDeliveries")
	}
}

async function notifyDeliverablesDownloaded(taskId, project, user) {
	try {
		const { projectManager, accManager } = await getAMPMbyProject(project)
		const messagePM = deliverablesDownloadedMessage({ manager: projectManager, taskId, projectName: project.projectName, project_id: project.projectId, _id: project._id }, user)
		const messageAM = deliverablesDownloadedMessage({ manager: accManager, taskId, projectName: project.projectName, project_id: project.projectId, _id: project._id }, user)
		await managerNotifyMail({ email: project.projectManager.email, ...projectManager }, messagePM, `Task delivered: ${ taskId } - ${ project.projectName } (ID I010.0)`)
		await managerNotifyMail({ email: project.accountManager.email, ...accManager }, messageAM, `Task delivered: ${ taskId } - ${ project.projectName } (ID I010.0)`)
	} catch (err) {
		console.log(err)
		console.log("Error in notifyDeliverablesDownloaded")
	}
}

async function notifyProjectDelivery(project, template) {
	const notifyContacts = project.clientContacts.map(({ email }) => email)
	const message = template
	const subject = `Delivery: ${ project.projectId } - ${ project.projectName } (ID C006.0)`
	try {
		const deliverables = project.deliverables || await getProjectDeliverables(project)
		const attachments = [ { filename: "deliverables.zip", path: `./dist${ deliverables }` } ]

		for (let contact of notifyContacts) {
			await sendEmail({ to: contact, attachments, subject }, dynamicClientName(message, contact, project))
		}
		await sendEmail({ to: 'am@pangea.global', attachments, subject }, amFirstName(message))

	} catch (err) {
		console.log(err)
		console.log("Error in notifyProjectDelivery")
	}

	function amFirstName(message) {
		const name = `<p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear Account Managers</span></p>`
		return message.replace(`<div id="client-name-row">&nbsp;</div>`, name)
	}
}

async function notifyManagerStepStarted(project, step) {
	const { projectManager, accManager } = await getAMPMbyProject(project)
	const subject = `Step started: ${ step.stepId } - ${ project.projectName } (ID I002.0)`
	const messagePM = stepStartedMessage({ ...project._doc, step }, projectManager)
	const messageAM = stepStartedMessage({ ...project._doc, step }, accManager)
	try {
		await sendEmail({ to: project.projectManager.email, subject }, messagePM)
		await sendEmail({ to: project.accountManager.email, subject }, messageAM)
	} catch (err) {
		console.log(err)
		console.log("Error in notifyManagerStepStarted")
	}
}

async function notifyStepDecisionMade({ project, step, decision }) {
	const { projectManager, accManager } = await getAMPMbyProject(project)
	const messageId = decision === 'accept' ? 'I006.0' : 'I007.0'
	const subject = `Vendor ${ decision === 'accept' ? 'approved' : 'rejected' } the job: ${ step.stepId } - ${ project.projectName } (ID ${ messageId })`
	const messagePM = stepDecisionMessage({ project, step, decision }, projectManager)
	const messageAM = stepDecisionMessage({ project, step, decision }, accManager)
	try {
		await sendEmail({ to: project.projectManager.email, subject }, messagePM)
		await sendEmail({ to: project.accountManager.email, subject }, messageAM)
	} catch (err) {
		console.log(err)
		console.log("Error in notifyManagerStepStarted")
	}
}

async function getAMPMbyProject(project) {
	const { projectManager, accountManager } = project
	return {
		projectManager: await User.findOne({ "_id": projectManager.id }),
		accManager: await User.findOne({ "_id": accountManager._id })
	}
}

async function notifyStepReopened(steps, projectId) {
	try {
		for (let step of steps) {
			const message = stepReopenedMessage(step)
			step["to"] = step.vendor.email
			step.subject = `Step has been reopened: ${ step.stepId } (${ step.serviceStep.title }) (ID V007.0)`
			await sendEmail(step, message)
		}
	} catch (err) {
		console.log(err)
		console.log("Error in notfyStepsReopen")
	}
}

async function notifyVendorStepStart(steps, allSteps, project) {
	const stepIds = steps.length ? steps.map(item => item._id) : steps
	try {
		const notifyingSteps = allSteps.filter(item => {
			if (stepIds.length) {
				return item.status === 'Ready to Start' && stepIds.indexOf(item.id) !== -1
			}
			return item.status === 'Ready to Start'
		})
		if (notifyingSteps.length) {
			for (let step of notifyingSteps) {
				const message = stepReadyToStartMessage({ step, project })
				step["to"] = step.vendor.email
				step.subject = `Step ${ step.stepId }: ${ project.projectName } is ready to start (ID V001.2)`
				await sendEmail(step, message)
			}
		}
	} catch (err) {
		console.log(err)
		console.log("Error in notifyVendorStepStart")
		throw new Error(err.message)
	}
}

module.exports = {
	stepCancelNotifyVendor,
	getMessage,
	taskCompleteNotifyPM,
  notifyClientDeliverablesReady,
	sendClientDeliveries,
	notifyDeliverablesDownloaded,
	notifyProjectDelivery,
	notifyManagerStepStarted,
	stepCompletedNotifyPM,
	notifyStepDecisionMade,
	notifyReadyForDr2,
	notifyStepReopened,
	notifyVendorStepStart,
	sendQuoteMessage,
	getCostMessage,
	sendCostQuoteMessage,
  sendClientManyDeliveries
}
