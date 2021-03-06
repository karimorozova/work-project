const { Projects, Languages, Vendors } = require('../models')
const htmlToPdf = require('html-pdf')
let apiUrl = process.env.ADMIN_URL
const { archiveMultipleFiles } = require('../utils/archiving')
const { moveProjectFile, moveFile } = require('../utils/movingFile')
const { getProject, getProjectAfterUpdate } = require('./getProjects')
const { getPdfOfQuote } = require("../emailMessages/clientCommunication")
const { generatePO } = require('../emailMessages/vendorCommunication')
const { getCertificateTemplate } = require('../emailMessages/complianceCecertificate')
const fs = require('fs')

const pdfConfig = {
	type: 'pdf',
	width: '814',
	height: '1054',
	orientation: "landscape",
	base: apiUrl,
	border: 0
}

async function storeFiles(filesArr, projectId) {
	try {
		let storedFiles = []
		if (filesArr && filesArr.length) {
			for (let file of filesArr) {
				const additionFileInfo = `${ Math.floor(Math.random() * 1000000) }`
				const newPath = `./dist/projectFiles/${ projectId }/${ additionFileInfo }-${ file.filename.replace(/( *[^\w\.]+ *)+/g, '_') }`
				await moveProjectFile(file, newPath)
				storedFiles.push(newPath)
			}
		}
		return storedFiles
	} catch (err) {
		console.log(err)
		console.log("Error in storeFiels")
	}
}

const createArchiveForDeliverableItem = async ({ type, projectId, entityId, user, tasksDR2, tasksDeliverables }) => {
	const outputPath = `/projectFiles/${ projectId }/${ Math.floor(Math.random() * 1000000) }-deliverables.zip`
	const qProject = { "_id": projectId }

	if (type === 'multi') {
		const { file } = tasksDR2.multiLang.find(({ _id }) => `${ _id }` === `${ entityId }`)
		await archiveMultipleFiles({ outputPath: `./dist${ outputPath }`, files: getParsedFiles(file) })
		await setDeliveredStatus('multiLang')

	}
	if (type === 'single') {
		const { files } = tasksDR2.singleLang.find(({ _id }) => `${ _id }` === `${ entityId }`)
		await archiveMultipleFiles({ outputPath: `./dist${ outputPath }`, files: getParsedFiles(files) })
		await setDeliveredStatus('singleLang')
	}

	const idx = tasksDeliverables.findIndex(({ deliverablesId }) => `${ deliverablesId }` === `${ entityId }`)
	const newDeliverable = { deliverablesId: entityId, path: outputPath, deliveredBy: user, deliveredAt: new Date() }
	idx === -1 ? tasksDeliverables.push(newDeliverable) : tasksDeliverables.splice(idx, 1, newDeliverable)

	return await getProjectAfterUpdate(qProject, { tasksDeliverables })

	function getParsedFiles(files) {
		return files.reduce((acc, cur) => [ ...acc, { name: cur.fileName, path: cur.path.indexOf('./dist') === 0 ? cur.path : `./dist${ cur.path }` } ], [])
	}

	async function setDeliveredStatus(entity) {
		const qEntity = `tasksDR2.${ entity }._id`
		const qEntityStatus = `tasksDR2.${ entity }.$[i].status`
		const qEntityTime = `tasksDR2.${ entity }.$[i].timestamp`
		await Projects.updateOne(
				{ ...qProject, [qEntity]: entityId },
				{
					[qEntityStatus]: 'Delivered',
					[qEntityTime]: new Date()
				},
				{ arrayFilters: [ { 'i._id': entityId } ] }
		)
	}
}

async function manageDeliveryFile({ fileData, file }) {
	const { path, projectId } = fileData

	const additionFileInfo = `${ Math.floor(Math.random() * 1000000) }`
	try {
		const newPath = `/projectFiles/${ projectId }/${ additionFileInfo }-${ file.filename.replace(/['"]/g, '_').replace(/\s+/, '_') }`
		await moveFile(file, `./dist${ newPath }`)
		if (!!path && path !== newPath) {
			if (await fs.existsSync(`./dist${ path }`)) {
				fs.unlink(`./dist${ path }`, (err) => {
					if (err) throw(err)
				})
			}

			return newPath
		} else {
			return newPath
		}
	} catch (err) {
		console.log(err)
		console.log("Error in manageDeliveryFile")
	}
}

async function getPdf(allUnits, allSettingsSteps, project, tasksIds = []) {
	try {
		const html = await getPdfOfQuote(project, tasksIds, allUnits, allSettingsSteps)
		var options = { width: '820', height: '1141', orientation: "landscape", base: apiUrl }
		return new Promise((resolve, reject) => {
			htmlToPdf.create(html, options).toFile('./dist/uploads/htmlpdf.pdf', function (err, res) {
				if (err) {
					console.log(err)
					reject(err)
				}
				resolve('./dist/uploads/htmlpdf.pdf')
			})
		})
	} catch (err) {
		console.log(err)
		console.log("Error in getPdf")
	}
}

const generatePOFile = async (requestInfo, project) => {
	const { vendor } = requestInfo
	const fullVendor = await Vendors.findOne({ "_id": vendor._id })
	const template = await generatePO(requestInfo, fullVendor, project)
	const conf = { ...pdfConfig }
	conf.width = '882'
	conf.height = '1130'

	return new Promise((resolve, reject) => {
		htmlToPdf.create(
				template,
				{
					...conf
				})
				.toFile(`./dist/vendorsDocs/${ vendor._id }/PO.pdf`, function (err, res) {
					if (err) {
						console.log(err)
						reject(err)
					}
					resolve(`./dist/vendorsDocs/${ vendor._id }/PO.pdf`)
				})
	})
}

const generateAndSaveCertificate = async ({ project, tasks, deliveryData }) => {
	const allLanguages = await Languages.find()
	const template = getCertificateTemplate({ project, allLanguages, tasks, deliveryData })
	return new Promise((resolve, reject) => {
		htmlToPdf.create(
				template,
				{
					type: 'pdf',
					width: '814',
					height: '1054',
					orientation: "landscape",
					base: apiUrl,
					border: 0
				})
				.toFile('./dist/uploads/preCertificatePdf.pdf', function (err, res) {
					if (err) {
						console.log(err)
						reject(err)
					}
					resolve('./dist/uploads/preCertificatePdf.pdf')
				})
	})
}

const generateReceivablesReportsByTemplate = async (_reportId, filename, template) => {
	const conf = { ...pdfConfig }
	conf.width = '882'
	conf.height = '1130'

	return new Promise((resolve, reject) => {
		htmlToPdf.create(
				template,
				{
					...conf
				})
				.toFile(`./dist/clientReportsFiles/${ _reportId }/${ filename }.pdf`, function (err, res) {
					if (err) {
						console.log(err)
						reject(err)
					}
					resolve(`./dist/clientReportsFiles/${ _reportId }/${ filename }.pdf`)
				})
	})
}

const copyProjectFiles = (project, originalFile) => {
	const copiedName = originalFile.path.split("/").pop()
	const additional = `${ Math.floor(Math.random() * 1000000) }-${ copiedName }`
	const newPath = `./dist/projectFiles/${ project._id }/${ additional }`

	fs.copyFile(`./dist/${ originalFile.path }`, newPath, (err) => {
		if (err) throw err
	})

	return newPath
}

module.exports = {
	generateReceivablesReportsByTemplate,
	generatePOFile,
	storeFiles,
	createArchiveForDeliverableItem,
	copyProjectFiles,
	manageDeliveryFile,
	getPdf,
	generateAndSaveCertificate
}
