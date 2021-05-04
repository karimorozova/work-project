const router = require('express').Router()
const fs = require('fs')

const {
	User,
	Clients,
	Delivery,
	Projects,
	Pricelist,
	Units,
  Languages,
	Vendors,
	Discounts
} = require('../../models')

const {
	getClient
} = require('../../clients')

const {
	setDefaultStepVendors,
	calcCost,
	updateProjectCosts
} = require('../../сalculations/wordcount')

const {
	getAfterPayablesUpdated
} = require('../../сalculations/updates')

const {
	getProject,
	createProject,
	createTasks,
	createTasksForWordcount,
	updateProject,
	getProjectAfterCancelTasks,
	updateProjectStatus,
	getProjectWithUpdatedFinance,
	manageDeliveryFile,
	createTasksFromRequest,
	setStepsStatus,
	getDeliverablesLink,
	getAfterReopenSteps,
	notifyVendorsProjectCancelled,
	getProjectAfterFinanceUpdated,
	updateProjectProgress,
	updateNonWordsTaskTargetFiles,
	storeFiles,
	notifyProjectDelivery,
	notifyReadyForDr2,
	notifyStepReopened,
	getPdf,
	notifyVendorStepStart,
	updateOtherProject,
	getProjectAfterUpdate,
	checkProjectHasMemoqStep,
	assignProjectManagers,
	sendQuoteMessage,
	sendCostQuoteMessage,
	updateProjectFinanceOnDiscountsUpdate,
	generateAndSaveCertificate
} = require('../../projects')

const {
	sendQuotes,
	getMessage,
	getCostMessage
} = require('../../projects/emails')

const {
	upload,
	clientQuoteEmail,
	stepVendorsRequestSending,
	sendEmailToContact,
	stepReassignedNotification,
	managerNotifyMail,
	sendEmail,
	notifyClientProjectCancelled,
	notifyClientTasksCancelled
} = require('../../utils')

const {
	// getProjectAfterApprove,
	setTasksDeliveryStatus,
	getAfterTasksDelivery,
	getAfterProjectDelivery,
	checkPermission,
	changeManager,
	changeReviewStage,
	rollbackReview,
  changeManagerDR2,
  taskApproveDeliver,
  taskApproveNotify,
} = require('../../delivery')

const {
	getStepsWithFinanceUpdated,
	reassignVendor,
	removeVendorFromStep
} = require('../../projectSteps')

const {
	getTasksWithFinanceUpdated
} = require('../../projectTasks')

const {
	getClientRequest,
	updateClientRequest,
	addRequestFile,
	removeRequestFile,
	removeRequestFiles,
	sendNotificationToManager,
	removeClientRequest
} = require('../../clientRequests')

const {
	updateMemoqProjectUsers,
	cancelMemoqDocs,
	setCancelledNameInMemoq
} = require('../../services/memoqs/projects')

const {
	getMemoqUsers
} = require('../../services/memoqs/users')

const {
	projectCancelledMessage,
	projectMiddleCancelledMessage,
	projectDeliveryMessage,
	tasksMiddleCancelledMessage
} = require('../../emailMessages/clientCommunication')

const {
	updatePricelistDiscount,
	checkPricelistLangPairs,
	replenishPricelistLangs
} = require('../../pricelist')

const {
	pushNewLangs
} = require('../../multipliers')


router.get('/project', async (req, res) => {
	const { id } = req.query
	try {
		const project = await getProject({ '_id': id })
		res.send(project)
	} catch (err) {
		console.log(err)
		console.log('Error on getting Project')
	}
})

router.get('/request', async (req, res) => {
	const { id } = req.query
	try {
		const request = await getClientRequest({ '_id': id })
		res.send(request)
	} catch (err) {
		console.log(err)
		console.log('Error on getting Request')
	}
})

//old
router.get('/language-pairs', async (req, res) => {
	const { customerId } = req.query
	try {
		const customer = await getClient({ '_id': customerId })
		const { monoRates, wordsRates, hoursRates } = customer
		res.send({ monoRates, wordsRates, hoursRates })
	} catch (err) {
		console.log(err)
		console.log('Error on getting Project')
	}
})

router.post('/new-project', async (req, res) => {
	let { project, user } = req.body
	try {
		const result = await createProject(project, user)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on creating a project!')
	}
})

router.post('/remove-reference-files', async (req, res) => {
	try {
		const { projectId, checkedTasksId, filePath } = req.body
		let { _id, tasks } = await getProject({ '_id': projectId })

		fs.unlink(filePath, (err) => {
			if (err) throw(err)
		})

		const taskIndex = tasks.findIndex(({ taskId }) => taskId === checkedTasksId)
		tasks[taskIndex].refFiles = tasks[taskIndex].refFiles.filter(item => item !== filePath)

		const updatedProject = await updateProject({ '_id': _id }, { tasks })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on adding tasks ref files')
	}
})

router.post('/upload-reference-files', upload.fields([ { name: 'refFiles' } ]), async (req, res) => {
	try {
		const { refFiles } = req.files
		const { projectId, checkedTasks } = req.body
		let { _id, tasks } = await getProject({ '_id': projectId })
		const taskRefFiles = await storeFiles(refFiles, _id)

		for (let itemTasksId of JSON.parse(checkedTasks).map(({ taskId }) => taskId)) {
			const taskIndex = tasks.findIndex(({ taskId }) => taskId === itemTasksId)
			if (taskIndex !== -1) {
				if (tasks[taskIndex].hasOwnProperty('refFiles')) {
					tasks[taskIndex].refFiles.push(...taskRefFiles)
				} else {
					tasks[taskIndex].refFiles = []
					tasks[taskIndex].refFiles.push(...taskRefFiles)
				}
			}
		}

		const updatedProject = await updateProject({ '_id': _id }, { tasks })
		res.send(updatedProject)

	} catch (err) {
		console.log(err)
		res.status(500).send('Error on adding tasks ref files')
	}
})

router.post('/project-tasks', upload.fields([ { name: 'sourceFiles' }, { name: 'refFiles' } ]), async (req, res) => {
	try {
		let tasksInfo = { ...req.body }
		if (tasksInfo.source) {
			tasksInfo.source = JSON.parse(tasksInfo.source)
		}
		tasksInfo.targets = JSON.parse(tasksInfo.targets)
		tasksInfo.service = JSON.parse(tasksInfo.service)
		const { sourceFiles, refFiles } = req.files
		const updatedProject = await createTasks({ tasksInfo, sourceFiles, refFiles })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on adding project tasks')
	}
})

router.post('/project-words-tasks', async (req, res) => {
	const { tasksInfo, docs } = req.body
	try {
		const result = await createTasksForWordcount(tasksInfo, docs)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on adding project\'s words tasks')
	}
})

router.post('/update-project', async (req, res) => {
	const project = { ...req.body }
	try {
		const savedProject = await updateProject({ '_id': project.id }, {
			steps: project.steps,
			tasks: project.tasks,
			isMetricsExist: project.isMetricsExist
		})
		res.send(savedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating project')
	}
})

router.post('/update-progress', async (req, res) => {
	const { projectId, isCatTool } = req.body
	try {
		const project = await getProject({ '_id': projectId })
		const result = await updateProjectProgress(project, isCatTool)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting metrics ')
	}
})

router.post('/update-matrix', async (req, res) => {
	const { projectId, taskId, step, key, value, prop } = req.body
	const { rate, costName } = prop === 'client' ? { rate: step.clientRate, costName: 'receivables' }
			: { rate: step.vendorRate, costName: 'payables' }
	try {
		let project = await getProject({ '_id': projectId })
		let taskIndex = project.tasks.findIndex(item => {
			return item.taskId === taskId
		})
		let stepIndex = project.steps.findIndex(item => {
			return item.name === step.name && item.taskId === step.taskId
		})
		let tasks = [ ...project.tasks ]
		let steps = [ ...project.steps ]
		tasks[taskIndex].metrics[key][prop] = +value / 100
		const cost = calcCost(tasks[taskIndex].metrics, prop, rate)
		steps[stepIndex].finance.Price[costName] = cost
		tasks[taskIndex].finance.Price[costName] = steps.filter(item => item.taskId === taskId).reduce((init, cur) => {
			return init + +cur.finance.Price[costName]
		}, 0)
		let updatedProject = { ...project._doc, id: projectId, tasks, steps }
		const result = await updateProjectCosts(updatedProject)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating value of matrix')
	}
})

router.get('/all-managers', async (req, res) => {
	const { groupFilters } = req.query
	try {
		const users = await User.find({}, { firstName: 1, lastName: 1, group: 1 }).populate('group')
		const filteredUsers = groupFilters ? users.filter(item => groupFilters.split(',').indexOf(item.group.name) !== -1) : users
		res.send(filteredUsers)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting managers ')
	}
})

router.put('/project-prop', async (req, res) => {
	const { projectId, prop, value } = req.body
	try {
		const result = await updateProject({ '_id': projectId }, { [prop]: value })
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Internal server error / Cannot change Project\'s property')
	}
})

router.put('/other-project-prop', async (req, res) => {
	const { projectId, prop, value } = req.body
	try {
		const result = await updateOtherProject({ '_id': projectId }, { [prop]: value })
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Internal server error / Cannot change Project\'s property')
	}
})

router.put('/project-status', async (req, res) => {
	const { id, status, reason } = req.body
	try {
		const result = await updateProjectStatus(id, status, reason)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Internal server error / Cannot change Project\'s status')
	}
})

router.put('/send-cancel-message', async (req, res) => {
	const { id, message } = req.body
	try {
		const project = await getProject({ '_id': id })
		await notifyClientProjectCancelled(project, message)

		if (project.status === 'Cancelled') {
			const wordsTasks = project.tasks.filter(item => item.service.title === 'Translation')
			if (wordsTasks.length) {
				await cancelMemoqDocs(wordsTasks)
				await setCancelledNameInMemoq(wordsTasks, `${ project.projectId } - ${ project.projectName }`)
			}
		}

		res.send('Message sent')
	} catch (err) {
		console.log(err)
		res.status(500).send('Internal server error / Cannot change Project\'s status')
	}
})

router.put('/project-date', async (req, res) => {
	const { projectId, date } = req.body
	try {
		const result = await updateProject({ '_id': projectId }, date)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Internal server error / Cannot change Project\'s deadline')
	}
})

router.get('/project-details', async (req, res) => {
	const { projectId } = req.query
	try {
		const message = await getMessage(projectId, 'details')
		res.send({ message })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting project details')
	}
})

router.post('/project-details', async (req, res) => {
	const { id, message } = req.body
	try {
		const project = await getProject({ '_id': id })
		await clientQuoteEmail({
			...project.customer._doc,
			subject: `Project details (ID C006, ${ project.projectId } - ${ project.projectName })`
		}, message)
		res.send('Project details sent')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on sending project details')
	}
})

router.get('/quote-message', async (req, res) => {
	const { projectId } = req.query
	try {
		const message = await getMessage(projectId, 'quote')
		res.send({ message })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting quote message')
	}
})

router.get('/quote-cost-message', async (req, res) => {
	const { projectId } = req.query
	try {
		const message = await getCostMessage(projectId, 'quote')
		res.send({ message })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting quote message')
	}
})

router.post('/task-quote-message', async (req, res) => {
	const { projectId, tasks } = req.body
	try {
		const message = await getMessage(projectId, 'task', tasks)
		res.send({ message })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting task quote message')
	}
})
router.post('/send-cost-quote', async (req, res) => {
	const { id, message, arrayOfEmails } = req.body
	try {
		const project = await getProjectAfterUpdate({ _id: id }, { status: 'Cost Quote' })
		await sendCostQuoteMessage(project, message, arrayOfEmails)
		res.send(project)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on sending the Quote')
	}
})
router.post('/send-quote', async (req, res) => {
	const { id, message, arrayOfEmails } = req.body
	try {
		const project = await getProject({ _id: id })
		const projectTasks = project.tasks.map((task) => {
			if (task.status === 'Created' || task.status === 'Rejected') task.status = 'Quote sent'
			return task
		})
		await sendQuoteMessage(project, message, arrayOfEmails)
		const updatedProject = await getProjectAfterUpdate({ _id: id }, {
			status: 'Quote sent',
			isClientOfferClicked: false,
			tasks: projectTasks
		})
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on sending the Quote')
	}
})

router.post('/send-task-quote', async (req, res) => {
	const { projectId, message, arrayOfEmails, tasksIds } = req.body
	try {
		const project = await getProject({ '_id': projectId })
		let { tasks } = project
		tasks = tasks.map(task => {
			if (tasksIds.includes(task.taskId)) task.status = 'Quote sent'
			return task
		})
		await sendQuoteMessage(project, message, arrayOfEmails, tasksIds)
		const updatedProject = await updateProject({ '_id': projectId }, { tasks })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on sending the Quote')
	}
})

router.post('/contact-mailing', async (req, res) => {
	const { projectId, contact } = req.body
	try {
		const project = await getProject({ '_id': projectId })
		await sendEmailToContact(project, contact)
		res.send('Email has been sent')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on contact-mailing')
	}
})

router.post('/vendor-request', async (req, res) => {
	const { projectId, checkedSteps } = req.body
	try {
		const project = await getProject({ '_id': projectId })
		const updatedSteps = await stepVendorsRequestSending(project, checkedSteps)
		const updatedProject = await updateProject({ '_id': project.id }, { steps: updatedSteps })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on sending the Request Confirmation')
	}
})

router.post('/vendor-assignment', async (req, res) => {
	const { step } = req.body
	try {
		const project = await getProject({ 'steps._id': step._id })
		await stepReassignedNotification(step)
		await updateMemoqProjectUsers(project.steps)
		res.send('messages sent')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on sending emails to vendors')
	}
})

router.post('/reassign-vendor', async (req, res) => {
	const reassignData = { ...req.body }
	try {
		const project = await getProject({ 'steps._id': reassignData.step._id })
		const { steps, tasks } = await reassignVendor(project, reassignData)
		const updatedProject = await getProjectAfterFinanceUpdated({ project, steps, tasks })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on sending emails to vendors')
	}
})

router.get('/costs', async (req, res) => {
	const { projectId } = req.query
	try {
		let project = await getProject({ _id: projectId })
		const updatedProject = await updateProjectCosts(project)
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting costs')
	}
})

router.post('/step-payables', async (req, res) => {
	let { projectId, step, index } = req.body
	try {
		const updatedProject = await getAfterPayablesUpdated({ projectId, step, index })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting step payables')
	}
})

router.post('/cancel-tasks', async (req, res) => {
	const { tasks, projectId } = req.body
	try {
		const project = await getProject({ '_id': projectId })
		const updatedProject = await getProjectAfterCancelTasks(tasks, project)
		const wordsCancelledTasks = tasks.filter(item => item.hasOwnProperty('metrics'))
		if (wordsCancelledTasks.length) {
			await cancelMemoqDocs(wordsCancelledTasks)
		}
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on cancelling tasks / cancel-tasks')
	}
})

router.post('/send-task-cancel-message', async (req, res) => {
	const { id, message } = req.body
	try {
		const project = await getProject({ '_id': id })
		await notifyClientTasksCancelled(project, message)
		res.send('Message sent')
	} catch (err) {
		console.log(err)
		res.status(500).send('Internal server error / Cannot change Project\'s status')
	}
})

router.post('/step-status', async (req, res) => {
	const { id, status, steps } = req.body
	try {
		const project = await getProject({ '_id': id })
		const updatedSteps = setStepsStatus({ steps, status, project })
		const memoqAssignResult = await updateMemoqProjectUsers(updatedSteps)
		if (memoqAssignResult) throw memoqAssignResult
		await notifyVendorStepStart(steps, updatedSteps, project)
		const updatedProject = await updateProject({ '_id': id }, { steps: updatedSteps })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send(err.message)
	}
})

router.post('/steps-reopen', async (req, res) => {
	const { steps } = req.body
	try {
		const project = await getProject({ 'steps._id': steps[0]._id })
		const updateProject = await getAfterReopenSteps(steps, project)
		await notifyStepReopened(steps, project.projectId)
		res.send(updateProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on reopening steps')
	}
})

router.get('/review-status', async (req, res) => {
	const { group, projectId, taskId, userId } = req.query
	try {
		if (group === 'Administrators' || group === 'Developers') {
			return res.send('available')
		}
		const reviewStatus = await checkPermission({ projectId, taskId, userId })
		res.send(reviewStatus)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on checking delivery review status')
	}
})

router.post('/change-manager', async (req, res) => {
	const { projectId, taskId, manager, prop, isAdmin, status } = req.body
	try {
		const project = await getProject({ '_id': projectId })
    const prevManager = await User.find( { "_id": project.tasksDR1.find(item => item.taskId === taskId)[prop] } ).populate('group')
		const updatedProject = await changeManager({ taskId, manager, prevManager, prop, isAdmin, status, project })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on changing review manager')
	}
})

router.post('/change-manager-dr2', async (req, res) => {
  const { projectId, taskId, manager, prop, isAdmin, status, deliveryData, type } = req.body
  const { dr2Manager } = deliveryData
  try {
    const project = await getProject({ '_id': projectId })
    let prevManager = await User.findOne( { "_id": dr2Manager } ).populate('group')
    const updatedProject = await changeManagerDR2({ taskId, manager, prevManager, prop, isAdmin, status, project, deliveryData, type })
    res.send(updatedProject)
  } catch (err) {
    console.log(err)
    res.status(500).send('Error on changing review manager')
  }
})

router.post('/approve-instruction', async (req, res) => {
	const { taskId, projectId, instruction } = req.body
	try {
    await Projects.updateOne(
      { "_id": projectId, 'tasksDR1.taskId': taskId, "tasksDR1.instructions.text": instruction.text },
      {
        "tasksDR1.$[i].instructions.$[j].isChecked": instruction.isChecked,
        "tasksDR1.$[i].instructions.$[j].isNotRelevant": instruction.isNotRelevant
      },
      { arrayFilters: [ { 'i.taskId': taskId }, { 'j.text': instruction.text } ]}
    )
    const updatedProject = await getProject({"_id": projectId})
    res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on approve files')
	}
})

router.post('/approve-instruction-dr2', async (req, res) => {
  const { entityId, projectId, instruction, type } = req.body
  try {
    if(type === 'single'){
      await Projects.updateOne(
        { "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.instructions.text": instruction.text },
        {
          "tasksDR2.singleLang.$[i].instructions.$[j].isChecked": instruction.isChecked,
          "tasksDR2.singleLang.$[i].instructions.$[j].isNotRelevant": instruction.isNotRelevant
        },
        { arrayFilters: [ { 'i._id': entityId }, { 'j.text': instruction.text } ]}
      )
    }else{
      await Projects.updateOne(
        { "_id": projectId, 'tasksDR2.multiLang._id': entityId, "tasksDR2.multiLang.instructions.text": instruction.text },
        {
          "tasksDR2.multiLang.$[i].instructions.$[j].isChecked": instruction.isChecked,
          "tasksDR2.multiLang.$[i].instructions.$[j].isNotRelevant": instruction.isNotRelevant
        },
        { arrayFilters: [ { 'i._id': entityId }, { 'j.text': instruction.text } ]}
      )
    }

    const updatedProject = await getProject({"_id": projectId})
    res.send(updatedProject)
  } catch (err) {
    console.log(err)
    res.status(500).send('Error on approve files')
  }
})

router.post('/approve-files-dr2', async (req, res) => {
  const { type, entityId, projectId, isFileApproved, paths } = req.body
  try {
    if(type === 'single'){
      await Projects.updateOne(
        { "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": { $in: paths } },
        { "tasksDR2.singleLang.$[i].files.$[j].isFileApproved": isFileApproved },
        { arrayFilters: [ { 'i._id': entityId }, { 'j.path': { $in: paths } } ]}
      )
    }else{
      await Projects.updateOne(
        { "_id": projectId, 'tasksDR2.multiLang._id': entityId },
        { "tasksDR2.multiLang.$[i].file.isFileApproved": isFileApproved },
        { arrayFilters: [ { 'i._id': entityId } ]}
      )
    }
    const updatedProject = await getProject({"_id": projectId})
    res.send(updatedProject)
  } catch (err) {
    console.log(err)
    res.status(500).send('Error on approve files')
  }
})

router.post('/approve-files', async (req, res) => {
	const { projectId, taskId, isFileApproved, paths } = req.body
	try {
    await Projects.updateOne(
      { "_id": projectId, 'tasksDR1.taskId': taskId, "tasksDR1.files.path": { $in: paths } },
      { "tasksDR1.$[i].files.$[j].isFileApproved": isFileApproved },
      { arrayFilters: [ { 'i.taskId': taskId }, { 'j.path': { $in: paths } } ]}
    )
    const updatedProject = await getProject({"_id": projectId})
    res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on approve files')
	}
})

router.post('/is-file-pushed-dr2', async (req, res) => {
  const { projectId, taskId, isFilePushedDR2, paths } = req.body
  try {
    await Projects.updateOne(
      { "_id": projectId, 'tasksDR1.taskId': taskId, "tasksDR1.files.path": { $in: paths } },
      { "tasksDR1.$[i].files.$[j].isFilePushedDR2": isFilePushedDR2 },
      { arrayFilters: [ { 'i.taskId': taskId }, { 'j.path': { $in: paths } } ]}
    )
    const updatedProject = await getProject({"_id": projectId})
    res.send(updatedProject)
  } catch (err) {
    console.log(err)
    res.status(500).send('Error on approve files')
  }
})

router.post('/delivery-comments', async (req, res) => {
	const { projectId, taskId, comment } = req.body
  try{
    const updatedProject = await getProjectAfterUpdate(
      {"_id": projectId, "tasksDR1.taskId": taskId},
      { $set: {"tasksDR1.$.comment": comment}}
    )
    res.send(updatedProject)
  }catch(err){
    console.log(err)
    res.status(500).send('Error on delivery-comments')
  }
})

router.post('/delivery-comments-dr2', async (req, res) => {
  const { projectId, entityId, type, comment } = req.body
  try{
    if(type === 'single'){
      const updatedProject = await getProjectAfterUpdate(
        {"_id": projectId, 'tasksDR2.singleLang._id': entityId,},
        { $set: {"tasksDR2.singleLang.$.comment": comment}}
      )
      res.send(updatedProject)
    }else{
      const updatedProject = await getProjectAfterUpdate(
        {"_id": projectId, 'tasksDR2.multiLang._id': entityId,},
        { $set: {"tasksDR2.multiLang.$.comment": comment}}
      )
      res.send(updatedProject)
    }
  }catch(err){
    console.log(err)
    res.status(500).send('Error on delivery-comments')
  }
})

router.post('/generate-certificate', async (req, res) => {
	const { project, task } = req.body
	try {
		await generateAndSaveCertificate({ project, task })
		res.send('done')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on generate certificate')
	}
})

router.post('/target', upload.fields([ { name: 'targetFile' } ]), async (req, res) => {
	const fileData = { ...req.body }
  console.log(fileData)
	try {
		const files = req.files['targetFile']
		const newPath = await manageDeliveryFile({ fileData, file: files[0] })
    const fileName = newPath.split("/").pop()
		if (!!fileData.path) {
      await Projects.updateOne(
        { "_id": fileData.projectId, 'tasksDR1.taskId': fileData.taskId, "tasksDR1.files.path": fileData.path  },
        { "tasksDR1.$[i].files.$[j]": {isFileApproved: false, fileName: fileName, path: newPath }},
        { arrayFilters: [ { 'i.taskId': fileData.taskId }, { 'j.path': fileData.path } ] }
      )
		} else {
      await Projects.updateOne(
        { "_id": fileData.projectId, 'tasksDR1.taskId': fileData.taskId },
        { $push: { 'tasksDR1.$.files': { isFileApproved: false, isOriginal: false, fileName: fileName, path: newPath }}}
      )
		}
    const updatedProject = await getProject({"_id": fileData.projectId})
    res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on uploading target file')
	}
})

router.post('/target-dr2', upload.fields([ { name: 'targetFile' } ]), async (req, res) => {
  const fileData = { ...req.body }
  const files = req.files['targetFile']
  const { projectId, path, type, entityId } =  fileData
  const project = await getProject({"_id": projectId})
  const allLanguages = await Languages.find()
  if(type === 'single'){
    try {
      const singleLang = project.tasksDR2.singleLang.find(({_id}) => _id.toString() === entityId)
      const { sourceLanguage, targetLanguage } = singleLang
      const newPath = await manageDeliveryFile({ fileData, file: files[0] })
      const fileName = newPath.split("/").pop()
      if (!!path) {
        const { taskId } = singleLang.files.find(item => item.path === path)
        if(taskId !== 'Loaded in DR2'){
          await Projects.updateOne(
            { "_id": projectId, 'tasksDR1.taskId': taskId, "tasksDR1.files.path": path  },
            { "tasksDR1.$[i].files.$[j]": {isFileApproved: true, isFilePushedDR2: true, fileName: fileName, path: newPath }},
            { arrayFilters: [ { 'i.taskId': taskId }, { 'j.path': path } ] }
          )
          await Projects.updateOne(
            { "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": path  },
            { "tasksDR2.singleLang.$[i].files.$[j]": {isFileApproved: false, fileName: fileName, path: newPath, taskId }},
            { arrayFilters: [ { 'i._id': entityId }, { 'j.path': path } ] }
          )
        }else{
          await Projects.updateOne(
            { "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": path  },
            { "tasksDR2.singleLang.$[i].files.$[j]": {isFileApproved: false, pair: getLanguagesPairsSymbols(sourceLanguage, targetLanguage), fileName: fileName, path: newPath, taskId: 'Loaded in DR2' }},
            { arrayFilters: [ { 'i._id': entityId }, { 'j.path': path } ] }
          )
        }
      } else {
        await Projects.updateOne(
          { "_id": projectId, 'tasksDR2.singleLang._id': entityId, },
          { $push: { 'tasksDR2.singleLang.$.files': { isFileApproved: false, pair: getLanguagesPairsSymbols(sourceLanguage, targetLanguage), fileName: fileName, path: newPath, taskId: 'Loaded in DR2' }}}
        )
      }

    } catch (err) {
      console.log(err)
      res.status(500).send('Error on uploading target file dr2')
    }
  }else{

  }
  const updatedProject = await getProject({"_id": projectId})
  res.send(updatedProject)

  function getLanguagesPairsSymbols(source, target){
    return `${allLanguages.find(({_id}) => `${_id}` === `${source}`).symbol} >> ${allLanguages.find(({_id}) => `${_id}` === `${target}`).symbol}`
  }
})

router.post('/remove-dr-file', async (req, res) => {
	const { taskId, path, projectId } = req.body
	try {
    await Projects.updateOne(
      { "_id": projectId, 'tasksDR1.files.path': path },
      { $pull: { 'tasksDR1.$[i].files': { path } }},
      { arrayFilters: [ { 'i.taskId': taskId } ] }
    )
    fs.unlink(`./dist${ path }`, (err) => {
      if (err) throw(err)
    })
    const updatedProject = await getProject({"_id": projectId})
    res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on removing dr file')
	}
})

router.post('/remove-dr2-file', async (req, res) => {
  console.log(req.body)
  const { type, taskId, projectId, path, entityId } = req.body
  try {
    if(type === 'single'){
      if(taskId !== 'Loaded in DR2'){
        await Projects.updateOne(
          { "_id": projectId, 'tasksDR1.files.path': path },
          { $pull: { 'tasksDR1.$[i].files': { path } }},
          { arrayFilters: [ { 'i.taskId': taskId } ] }
        )
      }
      await Projects.updateOne(
        { "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": path },
        { $pull: { "tasksDR2.singleLang.$[i].files": { path } }},
        { arrayFilters: [ { 'i._id': entityId }] }
      )
      fs.unlink(`./dist${ path }`, (err) => {
        if (err) throw(err)
      })
    }
    // else{
    //   await Projects.updateOne(
    //     { "_id": projectId, 'tasksDR2.multiLang._id': entityId },
    //     {  "tasksDR2.multiLang.$[i].file": {} },
    //     { arrayFilters: [ { 'i._id': entityId }] }
    //   )
    //   // fs.unlink(`./dist${ path }`, (err) => {
    //   //   if (err) throw(err)
    //   // })
    // }
    const updatedProject = await getProject({"_id": projectId})
    res.send(updatedProject)
  } catch (err) {
    console.log(err)
    res.status(500).send('Error on removing dr file')
  }
})

router.post('/assign-dr2', async (req, res) => {
	const { taskId, projectId, dr2Manager } = req.body
	try {
		await changeReviewStage({ taskId, projectId })
		const updatedProject = await updateProject({
			'_id': projectId,
			'tasks.taskId': taskId
		}, { 'tasks.$.status': 'Pending Approval [DR2]' })
		await notifyReadyForDr2({ dr2Manager, project: updatedProject, taskId })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on approving deliverable')
	}
})

router.post('/rollback-review', async (req, res) => {
	const { entityId, taskId, projectId, manager } = req.body
  const project = await Projects.findOne({ "_id": projectId })
  const singleLang = project.tasksDR2.singleLang.find(({_id}) => _id.toString() === entityId.toString())
  const paths = singleLang.files.filter(item => item.taskId === taskId).map(item => item.path)

  try {
    for await (path of paths) {
      await removeTaskDR2(projectId, path, entityId)
      await rollbackManagerDR1(path)
    }

    const message = `Delivery review of the task ${ taskId } is assigned to you.`
    await managerNotifyMail(manager, message, 'Task delivery review assignment notification (I016)')

    const updatedProject = await getProject({"_id": projectId})
    res.send(updatedProject)
  } catch (err) {
    console.log(err)
    res.status(500).send('Error on rollback-review')
  }

  async function rollbackManagerDR1(path){
    await Projects.updateOne(
      { "_id": projectId, 'tasksDR1.taskId': taskId, "tasksDR1.files.path": path },
      { "tasksDR1.$[i].dr1Manager" : manager._id, "tasksDR1.$[i].files.$[j].isFileApproved": false, "tasksDR1.$[i].files.$[j].isFilePushedDR2": false },
      { arrayFilters: [ { 'i.taskId': taskId }, { 'j.path': path } ]}
    )
  }

  async function removeTaskDR2(projectId, path, entityId){
    await Projects.updateOne(
      { "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": path },
      { $pull: { "tasksDR2.singleLang.$[i].files": { path } }},
      { arrayFilters: [ { 'i._id': entityId }] }
    )
  }

})

router.post('/tasks-approve-notify', async (req, res) => {
	const { taskId, isDeliver, contacts, user } = req.body
	try {
		const project = await getProject({ 'tasks.taskId': taskId })
		const updatedProject = await taskApproveNotify({ taskId, project, isDeliver, contacts, user })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on approving deliverable')
	}
})

router.post('/tasks-approve-deliver', async (req, res) => {
  const { taskId, isDeliver, contacts, user } = req.body
  try {
    const project = await getProject({ 'tasks.taskId': taskId })
    const updatedProject = await taskApproveDeliver({ taskId, project, isDeliver, contacts, user })
    res.send(updatedProject)
  } catch (err) {
    console.log(err)
    res.status(500).send('Error on approving deliverable')
  }
})

router.post('/tasks-approve', async (req, res) => {
  console.log('/tasks-approve')
	// const { taskId } = req.body
	try {
		// const project = await getProject({ 'tasks.taskId': taskId })
		// const updatedProject = await setTasksDeliveryStatus({ taskId, project, status: 'Ready for Delivery' })
		res.send('updatedProject')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on approving deliverable')
	}
})

// router.post('/delivery-data', async (req, res) => {
// 	const { taskId, projectId } = req.body
// 	try {
// 		const projectDelivery = await Delivery.findOne(
// 				{ projectId, 'tasks.taskId': taskId },
// 				{ 'tasks.$': 1 })
// 				.populate('tasks.dr1Manager')
// 				.populate('tasks.dr2Manager')
// 		const result = projectDelivery.tasks[0]
// 		res.send(result)
// 	} catch (err) {
// 		console.log(err)
// 		res.status(500).send('Error on getting delivery data')
// 	}
// })

router.get('/deliverables', async (req, res) => {
	const { taskId } = req.query
	try {
		const project = await getProject({ 'tasks.taskId': taskId })
		const task = project.tasks.find(({ taskId: tId }) => tId === taskId)
		const review = await Delivery.findOne({ projectId: project.id, 'tasks.taskId': taskId }, { 'tasks.$': 1 })
		if (task.deliverables) {
			res.send({ link: task.deliverables })
		} else {
			const link = await getDeliverablesLink({ taskId, projectId: project.id, taskFiles: review.tasks[0].files })
			if (link) {
				await Projects.updateOne({ 'tasks.taskId': taskId }, { 'tasks.$.deliverables': link })
			}
			res.send({ link })
		}
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on downloading deliverables')
	}
})

router.post('/deliver', async (req, res) => {
	const { tasks, user } = req.body
	try {
		const updatedProject = await getAfterTasksDelivery(tasks, user)
		if (updateProject.status === 'Delivered' || updateProject.status === 'Closed') {
			await notifyProjectDelivery(updatedProject)
		}
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on delivering tasks')
	}
})

router.post('/project-delivery', async (req, res) => {
	const { _id, message } = req.body
	try {
		const updatedProject = await getAfterProjectDelivery(_id, message)
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on delivering tasks')
	}
})

router.post('/step-finance', async (req, res) => {
	const { step } = req.body
	try {
		const project = await getProject({ 'steps._id': step._id })
		const steps = await getStepsWithFinanceUpdated(step, project)
		const tasks = getTasksWithFinanceUpdated(step, { ...project._doc, steps })
		const updatedProject = await getProjectAfterFinanceUpdated({ project, steps, tasks })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on changing Step finance')
	}
})

router.post('/request-file', upload.fields([ { name: 'newFile' } ]), async (req, res) => {
	const { id, oldFile } = req.body
	const files = req.files['newFile']
	const existingFile = JSON.parse(oldFile)
	const prop = existingFile.type === 'Source File' ? 'sourceFiles' : 'refFiles'
	try {
		let request = await getClientRequest({ '_id': id })
		const requestFiles = await addRequestFile({ request, files, existingFile, prop })
		request[prop] = requestFiles
		await request.save()
		res.send(request)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving request file')
	}
})

router.post('/remove-request-file', async (req, res) => {
	const { id, prop, path } = req.body
	try {
		let request = await getClientRequest({ '_id': id })
		request[prop] = await removeRequestFile({ path, files: request[prop] })
		await request.save()
		res.send(request)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on removing request file')
	}
})

router.post('/delete-request-files', async (req, res) => {
	const { id, sourceFiles, refFiles } = req.body
	try {
		let request = await getClientRequest({ '_id': id })
		if (sourceFiles.length) {
			request.sourceFiles = await removeRequestFiles(sourceFiles, request.sourceFiles)
		}
		if (refFiles.length) {
			request.refFiles = await removeRequestFiles(refFiles, request.refFiles)
		}
		await request.save()
		res.send(request)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on removing request file')
	}
})

router.post('/file-approvement', async (req, res) => {
	const { id, file, prop } = req.body
	try {
		let request = await getClientRequest({ '_id': id })
		request[prop] = request[prop].map(item => {
			if (item.fileName === file.fileName && item.path === file.path) {
				return { ...item, isApproved: file.isApproved }
			}
			return item
		})
		await request.save()
		res.send(request)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on approvement of request file')
	}
})

router.post('/prop-approvement', async (req, res) => {
	const { id, prop } = req.body
	try {
		let request = await getClientRequest({ '_id': id })
		request[prop] = !request[prop]
		request.save()
		res.send(request)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on approvement of request file')
	}
})

router.post('/request-value', async (req, res) => {
	const { id, prop, value, isEmail } = req.body
	let updateQuery = prop === 'accountManager' ? { [prop]: value, isAssigned: false } : { [prop]: value }
	try {
		const updatedRequest = await updateClientRequest({ '_id': id }, updateQuery)
		if (isEmail) {
			await sendNotificationToManager(updatedRequest, prop)
		}
		res.send(updatedRequest)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving request property value')
	}
})

router.post('/project-value', async (req, res) => {
	const { id, prop, value } = req.body
	try {
		if (prop === 'projectManager') {
			const memoqSteps = await checkProjectHasMemoqStep(id)
			if (memoqSteps.length) {
				for (let memoqProjectId of memoqSteps) {
					await assignProjectManagers({ manager: value._id, memoqProjectId })
				}
			}
		}
		const updatedProject = await updateProject({ '_id': id }, { [prop]: value })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving project property value')
	}
})

router.post('/request-tasks', async (req, res) => {
	const { dataForTasks, request, isWords } = req.body
	const { _id, service, style, type, structure, tones, seo, designs, packageSize, isBriefApproved, isDeadlineApproved, ...project } = request
	try {
		const updatedProject = await createProject(project)
		const newProject = await createTasksFromRequest({ project: updatedProject, dataForTasks, isWords })
		await removeClientRequest(_id)
		res.send(newProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on adding tasks')
	}
})

router.post('/step-target', upload.fields([ { name: 'targetFile' } ]), async (req, res) => {
	const { jobId } = req.body
	try {
		const project = await getProject({ 'steps._id': jobId })
		const { targetFile } = req.files
		const paths = await storeFiles(targetFile, project.id)
		const updatedProject = await updateNonWordsTaskTargetFiles({
			project,
			path: paths[0],
			jobId,
			fileName: targetFile[0].filename
		})
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error / Cannot add Target file to the Steps array of Project')
	}
})

function getAccManagerAndContact(project) {
	const accManager = project.accountManager
	const contact = project.customer.contacts.find(item => item.leadContact)
	return { accManager, contact }
}

router.post('/making-cancel-message', async (req, res) => {
	const { cancelStatus } = req.body
	const { accManager, contact } = getAccManagerAndContact(req.body)
	try {
		const message = cancelStatus === 'Cancelled Halfway' ?
				await projectMiddleCancelledMessage({ ...req.body, accManager, contact })
				: await projectCancelledMessage({ ...req.body, accManager, contact })
		res.send({ message })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on making project cancelled message')
	}
})

router.post('/making-delivery-message', async (req, res) => {
	const { accManager, contact } = getAccManagerAndContact(req.body)
	try {
		const message = await projectDeliveryMessage({ ...req.body, accManager, contact })
		res.send({ message })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on making delivery message')
	}
})

router.post('/making-tasks-cancel-message', async (req, res) => {
	const { project, tasks, reason, isPay } = req.body
	const { accManager, contact } = getAccManagerAndContact(project)
	try {
		const message = await tasksMiddleCancelledMessage({ project, tasks, accManager, contact, reason, isPay })
		res.send({ message })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on making tasks cancelled message')
	}
})

router.post('/urgent', async (req, res) => {
	const { projectId, isUrgent } = req.body
	try {
		const project = await getProjectAfterUpdate({ _id: projectId }, { isUrgent })
		res.send(project)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating project urgent')
	}
})

router.post('/payment-profile', async (req, res) => {
	const { projectId, paymentProfile } = req.body
	try {
		const project = await getProjectAfterUpdate({ _id: projectId }, { paymentProfile })
		res.send(project)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating payment profile')
	}
})

router.post('/client-contact', async (req, res) => {
	const { projectId, contact, oldContact: { _id: oldContact } } = req.body
	try {
		let { clientContacts } = await Projects.findOne({ _id: projectId })
		if (oldContact) {
			const oldIdxContact = clientContacts.findIndex(item => item._id.toString() === oldContact.toString())
			clientContacts.splice(oldIdxContact, 1, contact)
		} else {
			clientContacts.push(contact)
		}
		const project = await getProjectAfterUpdate({ _id: projectId }, { clientContacts })
		res.send(project)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating/creating client contact')
	}
})

router.delete('/client-contact/:projectId/:contactId', async (req, res) => {
	const { projectId, contactId } = req.params
	try {
		const { clientContacts } = await Projects.findOne({ _id: projectId })
		const contactToDeleteIndex = clientContacts.findIndex(item => item._id.toString() === contactId.toString())
		clientContacts.splice(contactToDeleteIndex, 1)
		const project = await getProjectAfterUpdate({ _id: projectId }, { clientContacts })
		res.send(project)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on deleting client contact')
	}
})

router.post('/contact-email', async (req, res) => {
	const { projectId, contactId, template } = req.body
	try {
		const { clientContacts } = await Projects.findOne({ _id: projectId })
		const { email } = clientContacts.find(contact => contact._id.toString() === contactId.toString())
		const subject = 'Pangea translation services'
		await sendEmail({ to: email, subject }, template, true)
		res.send(true)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on sending message to client\'s contact')
	}
})

router.post('/update-discount/:id', async (req, res) => {
	const { id } = req.params
	const { updatedRowObj } = req.body
	try {
		const { discountChart } = await updatePricelistDiscount(id, updatedRowObj)
		res.send(discountChart)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating pricelist\'s discount table')
	}
})

router.post('/check-pricelist-langs', async (req, res) => {
	const { pricelistId, langPairs } = req.body
	try {
		const newLangPairs = await checkPricelistLangPairs(pricelistId, langPairs)
		if (newLangPairs.length) {
			await replenishPricelistLangs(pricelistId, newLangPairs)
			res.send('Replenished!')
		} else {
			res.send('Doesn\'t need to update!')
		}
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on checking pricelist languages!')
	}
})

router.get('/pricelist-new-langs/:id', async (req, res) => {
	const { id } = req.params
	try {
		const { newLangPairs } = await Pricelist.findOne({ _id: id })
				.populate('newLangPairs.source', [ 'lang' ])
				.populate('newLangPairs.target', [ 'lang' ])

		res.send(newLangPairs)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting pricelist\'s new languages!')
	}
})

router.post('/add-new-langs', async (req, res) => {
	const { pricelistId, langArr } = req.body
	try {
		await pushNewLangs(pricelistId, langArr)
		const updatedPricelist = await Pricelist.findOne({ _id: pricelistId })
		res.send(updatedPricelist.newLangPairs)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on adding new languages')
	}
})

router.get('/discounts', async (req, res) => {
	try {
		const discounts = await Discounts.find()
		res.send(discounts)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting discounts')
	}
})

router.post('/create-discount', async (req, res) => {
	const { newDiscountObj } = req.body
	try {
		await Discounts.create(newDiscountObj)
		const discounts = await Discounts.find()
		res.send(discounts)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on creating new discount')
	}
})

router.post('/update-discounts', async (req, res) => {
	const { _id, values } = req.body
	try {
		await Discounts.updateOne({ _id }, { ...values })
		const updatedDiscounts = await Discounts.find()
		res.send(updatedDiscounts)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating discounts')
	}
})

router.post('/delete-discount', async (req, res) => {
	const { _id } = req.body
	try {
		await Discounts.deleteOne({ _id })
		const discounts = await Discounts.find()
		res.send(discounts)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on deleting discount')
	}
})

router.get('/get-project-discounts', async (req, res) => {
	const { id } = req.query
	try {
		const discounts = await Projects.findOne({ "_id": id }, { discounts: 1 })
		res.send(discounts)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting project discounts')
	}
})

router.post('/update-project-discounts', async (req, res) => {
	const { _id, updatedArray } = req.body
	try {
		const updatedProject = await updateProjectFinanceOnDiscountsUpdate(_id, updatedArray)
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating project\'s discounts')
	}
})

router.post('/update-minimum-charge', async (req, res) => {
	const { _id, value, toIgnore } = req.body
	try {
		const updatedProject = await getProjectAfterUpdate({ _id }, { minimumCharge: { value, toIgnore } })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating project\'s minimum charge!')
	}
})

router.post('/remove-vendor-from-step', async (req, res) => {
	const { stepId, projectId } = req.body
	try {
		const step = await removeVendorFromStep({ stepId, projectId })
		const project = await getProject({ '_id': projectId })
		const steps = await getStepsWithFinanceUpdated(step, project)
		const tasks = getTasksWithFinanceUpdated(step, { ...project._doc, steps })
		const updatedProject = await getProjectAfterFinanceUpdated({ project, steps, tasks })
		res.send(updatedProject)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on remove-vendor-from-step!')
	}
})

router.get('/vendors-for-project', async (req, res) => {
	try {
		const result = await Vendors.find({ status: "Active" }, { "firstName": 1, "surname": 1, "rates.pricelistTable": 1 })
				.populate('rates.pricelistTable.sourceLanguage', [ 'lang' ])
				.populate('rates.pricelistTable.targetLanguage', [ 'lang' ])
				.populate('rates.pricelistTable.step', [ 'title' ])
				.populate('rates.pricelistTable.unit', [ 'type' ])
				.populate('rates.pricelistTable.industry', [ 'name' ])
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on vendors-for-project!')
	}
})
module.exports = router
