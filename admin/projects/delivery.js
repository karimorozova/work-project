const fs = require('fs')
const _ = require('lodash')
const { moveFile } = require('../utils/movingFile')

const {
	managerNotifyMail
} = require("../utils")

const {
	managerDr1Reassign,
	managerDr1Assigned,
	rollbackDR1Template,
	severalDr1Assign,
	severalDr1reAssign
} = require("../emailMessages/internalCommunication")

const {
	getProject
} = require("./getProjects")

const { manageDeliveryFile, copyProjectFiles } = require('./files')

const {
	moveProjectFile
} = require("../utils/movingFile")

const {
	notifyClientDeliverablesReady,
	sendClientDeliveries,
	sendClientManyDeliveries
} = require("./emails")

const {
	Projects,
	Languages,
	User
} = require('../models')

const { dr2Instructions, drInstructionsCompliance } = require('../enums/deliveryInstructions')

const {
	getProjectAfterUpdate
} = require('./getProjects')


const rollbackReview = async ({ entityId, taskId, projectId, manager }) => {
	const project = await Projects.findOne({ "_id": projectId })
	const singleLang = project.tasksDR2.singleLang.find(({ _id }) => _id.toString() === entityId.toString())
	const paths = singleLang.files.filter(item => item.taskId === taskId).map(item => item.path)


	for await (path of paths) {
		await removeTaskDR2(projectId, path, entityId)
		await rollbackManagerDR1(path)
	}

	await Projects.updateOne(
			{ "_id": projectId, 'tasks.taskId': taskId },
			{ "tasks.$[i].status": "Pending Approval [DR1]" },
			{ arrayFilters: [ { 'i.taskId': taskId } ] }
	)

	const message = rollbackDR1Template(taskId, projectId)
	await managerNotifyMail(manager, message, 'Task delivery review assignment notification (I016)')

	return await getProject({ "_id": projectId })

	async function rollbackManagerDR1(path) {
		await Projects.updateOne(
				{ "_id": projectId, 'tasksDR1.taskId': taskId, "tasksDR1.files.path": path },
				{ "tasksDR1.$[i].dr1Manager": manager._id, "tasksDR1.$[i].files.$[j].isFileApproved": false, "tasksDR1.$[i].files.$[j].isFilePushedDR2": false },
				{ arrayFilters: [ { 'i.taskId': taskId }, { 'j.path': path } ] }
		)
	}

	async function removeTaskDR2(projectId, path, entityId) {
		await Projects.updateOne(
				{ "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": path },
				{ $pull: { "tasksDR2.singleLang.$[i].files": { path } } },
				{ arrayFilters: [ { 'i._id': entityId } ] }
		)
	}
}

async function changeManagerDR2({ project, prevManager, manager, type, file, entityId }) {
	let { tasksDR2: { multiLang, singleLang } } = project
	const messageToPrev = managerDr1Reassign({ taskId: file.taskId, project, prevManager, manager }, '2')
	const messageToNew = managerDr1Assigned({ taskId: file.taskId, project, manager }, '2')
	try {

		await managerNotifyMail(prevManager, messageToPrev, `DR2 has been reassigned: ${ project.projectId } (I009.0)`)
		await managerNotifyMail(manager, messageToNew, `The DR2 has been assigned to you: ${ project.projectId } (I009.1)`)

		if (type === 'multi') {
			const idx = multiLang.findIndex(({ _id }) => `${ _id }` === `${ entityId }`)
			const fileIdx = multiLang[idx].file.findIndex(({ _id }) => `${ _id }` === `${ file._id }`)
			multiLang[idx].file[fileIdx] = { ...file, dr2Manager: manager, isFileApproved: false }
			return await getProjectAfterUpdate({ "_id": project._id }, { "tasksDR2.multiLang": multiLang })
		} else {
			const idx = singleLang.findIndex(({ _id }) => `${ _id }` === `${ entityId }`)
			const idxFile = singleLang[idx].files.findIndex(({ _id }) => `${ _id }` === `${ file._id }`)
			singleLang[idx].files[idxFile] = { ...file, dr2Manager: manager, isFileApproved: false }
			return await getProjectAfterUpdate({ "_id": project._id }, { "tasksDR2.singleLang": singleLang })
		}
	} catch (err) {
		console.log(err, 'on changeManagerDR2')
	}
}

async function changeManager({ taskId, prevManager, manager, prop, isAdmin, status, project }) {
	const DRNumber = prop === "dr1Manager" ? '1' : '2'
	const messageToPrev = managerDr1Reassign({ taskId, project, prevManager, manager }, DRNumber)
	const messageToNew = managerDr1Assigned({ taskId, project, manager }, DRNumber)
	try {
		const updatedProject = await getProjectAfterUpdate({ "_id": project._id, "tasksDR1.taskId": taskId }, { $set: { [`tasksDR1.$.${ prop }`]: manager } })
		const isDr1 = prop === "dr1Manager"
		const isDr2 = status === "dr2" && prop === "dr2Manager"
		if (isAdmin && (isDr1 || isDr2)) {
			await managerNotifyMail(prevManager, messageToPrev, `DR${ DRNumber } has been reassigned: ${ taskId } (I009.0)`)
			await managerNotifyMail(manager, messageToNew, `The DR${ DRNumber } has been assigned to you: ${ taskId } (I009.1)`)
		}
		return updatedProject
	} catch (err) {
		console.log(err, 'on changeManager')
	}
}

const taskApproveDeliverMany = async ({ projectId, entitiesForDeliver, user, contacts, comment }) => {
	return await sendClientManyDeliveries({ projectId, entitiesForDeliver, user, contacts, comment })
}

const taskApproveDeliver = async ({ projectId, type, entityId, user, contacts, comment }) => {
	return await sendClientDeliveries({ projectId, type, entityId, user, contacts, comment })
}

const taskApproveNotify = async ({ projectId, type, entityId, contacts }) => {
	const project = await getProject({ '_id': projectId })
	await notifyClientDeliverablesReady({ project, contacts, type, entityId })
	return await taskApproveReady({ projectId, type, entityId })
}

const taskApproveReady = async ({ projectId, type, entityId }) => {
	const qProject = { "_id": projectId }
	if (type === 'single') {
		await Projects.updateOne(
				{ ...qProject, "tasksDR2.singleLang._id": entityId },
				{
					"tasksDR2.singleLang.$[i].status": 'Ready for Delivery',
					"tasksDR2.singleLang.$[i].timestamp": new Date()
				},
				{ arrayFilters: [ { 'i._id': entityId } ] }
		)
	} else {
		await Projects.updateOne(
				{ ...qProject, "tasksDR2.multiLang._id": entityId },
				{
					"tasksDR2.multiLang.$[i].status": 'Ready for Delivery',
					"tasksDR2.multiLang.$[i].timestamp": new Date()
				},
				{ arrayFilters: [ { 'i._id': entityId } ] }
		)
	}
	return await getProject(qProject)
}

async function addDR2({ projectId, taskId, dr1Manager, dr2Manager, files }) {
	const allLang = await Languages.find({})
	const { projectId: strId, projectName, tasks, tasksDR2: { singleLang, multiLang } } = await Projects.findOne({ _id: projectId })

	const { sourceLanguage, targetLanguage, service } = tasks.find(({ taskId: tId }) => tId === taskId)
	const sourceLang = allLang.find(({ symbol }) => sourceLanguage === symbol)
	const targetLang = allLang.find(({ symbol }) => targetLanguage === symbol)

	let fileInfo = []
	for (const { _id, isFilePushedDR2, isChecked, ...fileWithoutId } of files) {
		fileInfo.push({
			...fileWithoutId,
			isFileApproved: false,
			taskId,
			dr1Manager,
			dr2Manager
		})
	}

	if (singleLang.length > 0) {
		const singleLangIndex = singleLang
				.findIndex(({ sourceLanguage, targetLanguage }) => `${ sourceLanguage }-${ targetLanguage }` === `${ sourceLang._id }-${ targetLang._id }`)

		const status = singleLangIndex > -1 ? singleLang[singleLangIndex].status : ''

		if (singleLangIndex > -1 && status !== 'Delivered') singleLang[singleLangIndex].files = [ ...singleLang[singleLangIndex].files, ...fileInfo ]
		else pushFile(sourceLang, targetLang, fileInfo)

	} else {
		pushFile(sourceLang, targetLang, fileInfo)
	}

	await sendNotificationToDR2(projectId, taskId, dr2Manager)

	return await getProjectAfterUpdate({ "_id": projectId }, { "tasksDR2.singleLang": singleLang })

	function pushFile(sourceLang, targetLang, fileInfo) {
		const instructions = service.title === 'Compliance' ? drInstructionsCompliance : dr2Instructions
		singleLang.push({
			deliveryInternalId: returnNewDeliveryId(strId, singleLang, multiLang),
			deliveryName: projectName,
			status: 'Pending Approval [DR2]',
			sourceLanguage: sourceLang._id,
			targetLanguage: targetLang._id,
			files: fileInfo,
			instructions
		})
	}
}

const sendNotificationToDR2 = async (projectId, taskIds, accountManager) => {
	const project = await Projects.findOne({ _id: projectId })
	const allUsers = await User.find().populate('group')
	const messageToNew = managerDr1Assigned({ taskId: taskIds, project, manager: allUsers.find(({ _id }) => `${ _id }` === `${ accountManager }`) }, '2')
	await managerNotifyMail(allUsers.find(({ _id }) => `${ _id }` === `${ accountManager }`), messageToNew, `The DR2 has been assigned to you: ${ project.projectId } (I009.1)`)
}

const changeNameLang = async ({ projectId, deliveryId, deliveryName, type }) => {
	const deliveryType = type === 'single' ? 'singleLang' : 'multiLang'
	await Projects.updateOne(
			{ "_id": projectId, [`tasksDR2.${ deliveryType }._id`]: deliveryId },
			{ [`tasksDR2.${ deliveryType }.$[i].deliveryName`]: deliveryName },
			{ arrayFilters: [ { 'i._id': deliveryId } ] }
	)
	return await getProject({ _id: projectId })
}


function returnNewDeliveryId(projectId, singleLang, multiLang) {
	if (!singleLang.length && !multiLang.length) return `${ projectId } D01`

	let arrayOfDeliveryIds = []
	if (singleLang.length) for (let { deliveryInternalId } of singleLang) arrayOfDeliveryIds.push(deliveryInternalId)
	if (multiLang.length) for (let { deliveryInternalId } of multiLang) arrayOfDeliveryIds.push(deliveryInternalId)

	return findAndReturnBiggestId(arrayOfDeliveryIds)

	function findAndReturnBiggestId(arr) {
		const formattedArr = arr.map(item => /\d*$/ig.exec(item)[0]).map(item => {
			const [ first, ...rest ] = item
			return +rest[0]
		})
		const maxNumberInArray = Math.max.apply(null, formattedArr)
		return `${ projectId } D0${ maxNumberInArray + 1 }`
	}
}

const removeDR2 = async ({ projectId, taskId, path, sourceLanguage: source, targetLanguage: target }) => {
	const allLang = await Languages.find()
	let { tasksDR2: { singleLang } } = await Projects.findOne({ _id: projectId })

	const idx = singleLang
			.findIndex(({ sourceLanguage, targetLanguage }) => `${ sourceLanguage }-${ targetLanguage }` === `${ langId(source) }-${ langId(target) }`)

	const { files: notFilteredFiles } = singleLang[idx]

	singleLang[idx].files = notFilteredFiles
			.filter(file => file.path.toString() !== path.toString())

	if (!singleLang[idx].files.length) singleLang.splice(idx, 1)

	return await getProjectAfterUpdate({ "_id": projectId }, { "tasksDR2.singleLang": singleLang })

	function langId(langSymbol) {
		return allLang.find(({ symbol }) => langSymbol === symbol)._id
	}
}

async function addMultiLangDR2({ projectId, taskIds, refFiles, filesFromVault }) {
	const { projectId: strId, projectName, tasksDR2: { singleLang, multiLang: projectMultiLang }, projectManager, accountManager, tasksDR2 } = await Projects.findOne({ _id: projectId })

	let files = []
	if (refFiles) {
		for await (let file of Array.from(refFiles)) {
			const path = await storeFile(file, projectId)
			files.push({
				fileName: path.split('/').pop(),
				path,
				isFileApproved: false,
				dr1Manager: projectManager,
				dr2Manager: accountManager
			})
		}
	}

	if (filesFromVault.length) {
		for (let file of filesFromVault) {
			let path = copyProjectFiles({ _id: projectId }, file)
			if (path.includes('dist')) path = path.replace('./dist', '')

			files.push({
				fileName: path.split('/').pop(),
				path,
				isFileApproved: false,
				dr1Manager: projectManager,
				dr2Manager: accountManager
			})
		}
	}

	let multiLang = {
		deliveryInternalId: returnNewDeliveryId(strId, singleLang, projectMultiLang),
		deliveryName: projectName,
		tasks: taskIds,
		instructions: dr2Instructions,
		status: 'Pending Approval [DR2]',
		file: files
	}

	await sendNotificationToDR2(projectId, taskIds, accountManager)

	return await getProjectAfterUpdate({ "_id": projectId }, { "tasksDR2.multiLang": [ ...tasksDR2.multiLang, multiLang ] })

	async function storeFile(file, projectId) {
		try {
			const additionFileInfo = `${ Math.floor(Math.random() * 1000000) }`
			if (file) {
				const newPath = `/projectFiles/${ projectId }/${ additionFileInfo }-${ file.filename.replace(/['"]/g, '_').replace(/\s+/, '_') }`
				await moveProjectFile(file, `./dist${ newPath }`)
				return newPath
			}
		} catch (err) {
			console.log(err)
			console.log("Error in storeFiles")
		}
	}
}

async function removeMultiDR2({ projectId, type, dr2Id }) {

	const qProject = { "_id": projectId }
	const { tasksDR2: { multiLang, singleLang } } = await Projects.findOne(qProject)

	if (type === 'multi') {
		const newMultiLang = multiLang.filter(({ _id }) => `${ _id }` !== `${ dr2Id }`)
		const removedMultiLang = multiLang.filter(({ _id }) => `${ _id }` === `${ dr2Id }`)[0]
		for await (let item of removedMultiLang.file) {
			await fs.unlink(`${ './dist' + item.path }`, (err) => {
				if (err) console.log(err)
			})
		}

		return await getProjectAfterUpdate(qProject, { "tasksDR2.multiLang": newMultiLang })
	} else {
		const newSingleLang = singleLang.filter(({ _id }) => `${ _id }` !== `${ dr2Id }`)
		return await getProjectAfterUpdate(qProject, { "tasksDR2.singleLang": newSingleLang })

	}
}

const targetFileDR2 = async (fileData, files) => {
	const { projectId, path, type, entityId, dr1Manager, user } = fileData
	const project = await getProject({ "_id": projectId })
	const allLanguages = await Languages.find()
	if (type === 'single') {
		const singleLang = project.tasksDR2.singleLang.find(({ _id }) => _id.toString() === entityId)
		const { sourceLanguage, targetLanguage } = singleLang
		const newPath = await manageDeliveryFile({ fileData, file: files[0] })
		const fileName = newPath.split("/").pop()
		if (!!path) {
			const { taskId } = singleLang.files.find(item => item.path === path)
			if (taskId !== 'Loaded in DR2') {
				await Projects.updateOne(
						{ "_id": projectId, 'tasksDR1.taskId': taskId, "tasksDR1.files.path": path },
						{ "tasksDR1.$[i].files.$[j]": { isFileApproved: true, isFilePushedDR2: true, fileName: fileName, path: newPath } },
						{ arrayFilters: [ { 'i.taskId': taskId }, { 'j.path': path } ] }
				)
				await Projects.updateOne(
						{ "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": path },
						{
							"tasksDR2.singleLang.$[i].files.$[j]": {
								isFileApproved: false,
								pair: getLanguagesPairsSymbols(sourceLanguage, targetLanguage),
								fileName: fileName,
								path: newPath,
								taskId,
								dr1Manager,
								dr2Manager: user
							}
						},
						{ arrayFilters: [ { 'i._id': entityId }, { 'j.path': path } ] }
				)
			} else {
				await Projects.updateOne(
						{ "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": path },
						{
							"tasksDR2.singleLang.$[i].files.$[j]": {
								isFileApproved: false,
								pair: getLanguagesPairsSymbols(sourceLanguage, targetLanguage),
								fileName: fileName,
								path: newPath,
								taskId: 'Loaded in DR2',
								dr1Manager,
								dr2Manager: user
							}
						},
						{ arrayFilters: [ { 'i._id': entityId }, { 'j.path': path } ] }
				)
			}
		} else {
			await Projects.updateOne(
					{ "_id": projectId, 'tasksDR2.singleLang._id': entityId },
					{
						$push: {
							'tasksDR2.singleLang.$.files': {
								isFileApproved: false,
								pair: getLanguagesPairsSymbols(sourceLanguage, targetLanguage),
								fileName: fileName,
								path: newPath,
								taskId: 'Loaded in DR2',
								dr1Manager,
								dr2Manager: user
							}
						}
					}
			)
		}
	} else {
		// const { file } = project.tasksDR2.multiLang.find(({ _id }) => _id.toString() === entityId)
		let filesRedyToPush = []
		if (!!path) {
			const newPath = await manageDeliveryFile({ fileData, file: files[0] })
			const fileName = newPath.split("/").pop()
			await Projects.updateOne(
					{ "_id": projectId, 'tasksDR2.multiLang._id': entityId, "tasksDR2.multiLang.file.path": path },
					{
						"tasksDR2.multiLang.$[i].file.$[j]": {
							isFileApproved: false,
							// pair: getLanguagesPairsSymbols(sourceLanguage, targetLanguage),
							fileName: fileName,
							path: newPath,
							// taskId,
							dr1Manager,
							dr2Manager: user
						}
					},
					{ arrayFilters: [ { 'i._id': entityId }, { 'j.path': path } ] }
			)
		} else {
			for (let i = 0; i < files.length; i++) {
				const newPath = await manageDeliveryFile({ fileData, file: files[i] })
				const fileName = newPath.split("/").pop()
				filesRedyToPush.push({
					fileName: fileName,
					path: newPath,
					isFileApproved: false,
					dr1Manager: project.projectManager._id,
					dr2Manager: user
				})
			}
			await Projects.updateOne(
					{ "_id": projectId, 'tasksDR2.multiLang._id': entityId },
					{ $push: { "tasksDR2.multiLang.$[i].file": filesRedyToPush } },
					{ arrayFilters: [ { 'i._id': entityId } ] }
			)

		}

	}

	return await getProject({ "_id": projectId })

	function getLanguagesPairsSymbols(source, target) {
		return `${ allLanguages.find(({ _id }) => `${ _id }` === `${ source }`).symbol } >> ${ allLanguages.find(({ _id }) => `${ _id }` === `${ target }`).symbol }`
	}

}

const changeTaskStatus = async ({ taskId, projectId }) => {
	const tasksDR1Info = await Projects.findOne({ _id: projectId, "tasksDR1.taskId": taskId }, { "tasksDR1.$": 1 })
	const isAllChecklist = tasksDR1Info.tasksDR1[0].instructions.every(({ isChecked, isNotRelevant }) => isChecked || isNotRelevant)
	const isAllFiles = tasksDR1Info.tasksDR1[0].files.every(({ isFileApproved }) => isFileApproved)

	if (isAllChecklist && isAllFiles) {
		await changeTaskStatus(projectId, taskId, 'Pending Approval [DR1]', "Completed", new Date())
	} else {
		await changeTaskStatus(projectId, taskId, "Completed", 'Pending Approval [DR1]', null)
	}

	return await getProject({ "_id": projectId })

	async function changeTaskStatus(projectId, taskId, withStatus, changeStatusTo, completedAtDate) {
		await Projects.updateOne(
				{ "_id": projectId, 'tasks': { $elemMatch: { 'taskId': taskId, 'status': withStatus } } },
				{
					"tasks.$[i].status": changeStatusTo,
					"tasksDR1.$[i].timestamp": completedAtDate
				},
				{ arrayFilters: [ { 'i.taskId': taskId } ] }
		)
	}
}

const targetFileDR1 = async (fileData, files) => {
	try {
		const newPath = await manageDeliveryFile({ fileData, file: files[0] })
		const fileName = newPath.split("/").pop()
		if (!!fileData.path) {
			await Projects.updateOne(
					{ "_id": fileData.projectId, 'tasksDR1.taskId': fileData.taskId, "tasksDR1.files.path": fileData.path },
					{ "tasksDR1.$[i].files.$[j]": { isFileApproved: false, fileName: fileName, path: newPath } },
					{ arrayFilters: [ { 'i.taskId': fileData.taskId }, { 'j.path': fileData.path } ] }
			)
		} else {
			await Projects.updateOne(
					{ "_id": fileData.projectId, 'tasksDR1.taskId': fileData.taskId },
					{ $push: { 'tasksDR1.$.files': { isFileApproved: false, fileName: fileName, path: newPath } } }
			)
		}
		return await getProject({ "_id": fileData.projectId })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on uploading target file')
	}
}

const approveInstructionDR2 = async ({ entityId, projectId, instruction, type }) => {
	if (type === 'single') {
		await Projects.updateOne(
				{ "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.instructions.text": instruction.text },
				{
					"tasksDR2.singleLang.$[i].instructions.$[j].isChecked": instruction.isChecked,
					"tasksDR2.singleLang.$[i].instructions.$[j].isNotRelevant": instruction.isNotRelevant
				},
				{ arrayFilters: [ { 'i._id': entityId }, { 'j.text': instruction.text } ] }
		)
	} else {
		await Projects.updateOne(
				{ "_id": projectId, 'tasksDR2.multiLang._id': entityId, "tasksDR2.multiLang.instructions.text": instruction.text },
				{
					"tasksDR2.multiLang.$[i].instructions.$[j].isChecked": instruction.isChecked,
					"tasksDR2.multiLang.$[i].instructions.$[j].isNotRelevant": instruction.isNotRelevant
				},
				{ arrayFilters: [ { 'i._id': entityId }, { 'j.text': instruction.text } ] }
		)
	}

	return await getProject({ "_id": projectId })
}

const approveFilesDR2 = async ({ type, entityId, projectId, isFileApproved, paths }) => {
	if (type === 'single') {
		await Projects.updateOne(
				{ "_id": projectId, 'tasksDR2.singleLang._id': entityId, "tasksDR2.singleLang.files.path": { $in: paths } },
				{ "tasksDR2.singleLang.$[i].files.$[j].isFileApproved": isFileApproved },
				{ arrayFilters: [ { 'i._id': entityId }, { 'j.path': { $in: paths } } ] }
		)
	} else {
		await Projects.updateOne(
				{ "_id": projectId, 'tasksDR2.multiLang._id': entityId, "tasksDR2.multiLang.file.path": { $in: paths } },
				{ "tasksDR2.multiLang.$[i].file.$[j].isFileApproved": isFileApproved },
				{ arrayFilters: [ { 'i._id': entityId }, { 'j.path': { $in: paths } } ] }
		)
		// await Projects.updateOne(
		// 		{ "_id": projectId, 'tasksDR2.multiLang._id': entityId },
		// 		{ "tasksDR2.multiLang.$[i].file.isFileApproved": isFileApproved },
		// 		{ arrayFilters: [ { 'i._id': entityId } ] }
		// )
	}
	return await getProject({ "_id": projectId })
}

const changeManagersDR1 = async ({ projectId, checkedTasksId, manager }) => {
	const allUsers = await User.find().populate('group')
	let project = await getProject({ '_id': projectId })

	const message = severalDr1Assign({ manager, project, checkedTasksId })
	await managerNotifyMail(manager, message, `DR1 has been assigned to you ${ project.projectId } (I009.1)`)

	let tasksAndManagersForReassign = []
	let finalManagerTasks = []

	for (let taskId of checkedTasksId) {
		const { tasksDR1 } = project
		const { dr1Manager } = tasksDR1.find(item => item.taskId === taskId)
		tasksAndManagersForReassign.push({ taskId, manager: dr1Manager })
	}

	const managersTasks = _.chain(tasksAndManagersForReassign).groupBy("manager").value()
	for (let manager in managersTasks) {
		finalManagerTasks.push({
			manager: allUsers.find(({ _id }) => `${ _id }` === `${ manager }`),
			checkedTasksId: managersTasks[manager].map(({ taskId }) => taskId)
		})
	}

	for (let item of finalManagerTasks) {
		const message = severalDr1reAssign({ prevManager: item.manager, manager, project, checkedTasksId: item.checkedTasksId })
		await managerNotifyMail(item.manager, message, `DR1 has been assigned to you ${ project.projectId } (I009.1)`)
	}

	await Projects.updateOne(
			{ "_id": projectId, 'tasksDR1.taskId': { $in: checkedTasksId } },
			{ "tasksDR1.$[i].dr1Manager": manager._id },
			{ arrayFilters: [ { 'i.taskId': { $in: checkedTasksId } } ] }
	)

	return await getProject({ "_id": projectId })
}

const saveCertificateTODR1Files = async (project, type, deliveryData) => {
	const additionFileInfo = `${ Math.floor(Math.random() * 1000000) }`
	const fileName = `${ additionFileInfo }-alpha-certificate.pdf`
	const newPath = `/projectFiles/${ project._id }/${ fileName }`
	try {
		await moveFile({ path: './dist/uploads/preCertificatePdf.pdf' }, `./dist${ newPath }`)

		if (type === 'single') {
			const allLanguages = await Languages.find()
			const file = {
				isFileApproved: false,
				pair: `${ allLanguages.find(item => item._id.toString() === deliveryData.sourceLanguage).symbol } >> ${ allLanguages.find(item => item._id.toString() === deliveryData.targetLanguage).symbol }`,
				fileName,
				path: newPath,
				taskId: 'Loaded in DR2',
				dr1Manager: project.projectManager._id,
				dr2Manager: project.accountManager._id
			}

			await Projects.updateOne(
					{ "_id": project._id, 'tasksDR2.singleLang._id': deliveryData._id },
					{ $push: { "tasksDR2.singleLang.$[i].files": file } },
					{ arrayFilters: [ { 'i._id': deliveryData._id } ] }
			)
		}

		if (type === 'multi') {
			const file = {
				fileName,
				path: newPath,
				isFileApproved: false,
				dr1Manager: project.projectManager._id,
				dr2Manager: project.accountManager._id
			}

			await Projects.updateOne(
					{ "_id": project._id, 'tasksDR2.multiLang._id': deliveryData._id },
					{ $push: { "tasksDR2.multiLang.$[i].file": file } },
					{ arrayFilters: [ { 'i._id': deliveryData._id } ] }
			)
		}
	} catch (err) {
		console.log(err)
		console.log("Error in saveCertificateTODR1Files")
	}
	return await getProject({ _id: project._id })
}

module.exports = {
	saveCertificateTODR1Files,
	changeManagersDR1,
	approveFilesDR2,
	approveInstructionDR2,
	targetFileDR1,
	changeTaskStatus,
	taskApproveNotify,
	taskApproveDeliver,
	taskApproveReady,
	addDR2,
	addMultiLangDR2,
	removeDR2,
	removeMultiDR2,
	taskApproveDeliverMany,
	changeManagerDR2,
	changeManager,
	rollbackReview,
	targetFileDR2,
	changeNameLang
}
