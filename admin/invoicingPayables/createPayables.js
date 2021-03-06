const { InvoicingPayables, InvoicingPayablesArchive, Projects } = require("../models")
const moment = require("moment")
const { INVOICING_STATUSES } = require("./enum")
const { getPayablesProjectsAndSteps, getPayablesDateRange } = require("./getPayables")
const { createDir } = require("./PayablesFilesAndDirecrory")

const payablesAddSteps = async (reportId, stepsId) => {
	try {
		for (const stepId of stepsId) {
			let { total } = await InvoicingPayables.findOne({ _id: reportId })
			const { steps } = await Projects.findOne({ 'steps._id': stepId })
			const { nativeFinance: { Price: { payables } } } = steps.find(({ _id }) => `${ _id }` === `${ stepId }`)
			await InvoicingPayables.updateOne({ _id: reportId }, { $set: { total: +(total + payables).toFixed(2) }, $push: { 'steps': stepId } })
		}

		const [ updatedPayableReport ] = await getPayablesProjectsAndSteps(reportId)
		const { firstPaymentDate, lastPaymentDate } = getPayablesDateRange(updatedPayableReport.steps)
		await InvoicingPayables.updateOne(
				{ _id: reportId },
				{ $set: { firstPaymentDate, lastPaymentDate } }
		)
		await Projects.updateMany(
				{ 'steps._id': { $in: stepsId } },
				{ 'steps.$[i].isInReportPayables': true },
				{ arrayFilters: [ { 'i._id': { $in: stepsId } } ] }
		)
	} catch (e) {
		console.log(e)
	}
}


const addStepsToPayables = async (projects, createdBy) => {
	let groupedProjectsByVendor = {}

	// const stepsVendors = projects.map(({ currentVendor }) => currentVendor._id)
	// const existsVendors = (await InvoicingPayables.find({ vendor: { $in: stepsVendors }, $or: [ { status: 'Created' }, { status: 'Sent' } ] }, {
	// 	vendor: 1,
	// 	firstPaymentDate: 1,
	// 	lastPaymentDate: 1,
	// 	total: 1
	// }, { lean: 'toObject' }))

	const lastIndex = await InvoicingPayables.findOne().sort({ 'reportId': -1 })
	const lastIndexInArchive = await InvoicingPayablesArchive.findOne().sort({ 'reportId': -1 })

	const lastIntIndex = lastIndex != null ? parseInt(lastIndex.reportId.split('_v').pop()) : 100
	const lastIntIndexFromArchive = lastIndexInArchive != null ? parseInt(lastIndexInArchive.reportId.split('_v').pop()) : 100
	let lastMaxIndex = Math.max(isNaN(lastIntIndexFromArchive) ? 100 : lastIntIndexFromArchive, isNaN(lastIntIndex) ? 100 : lastIntIndex)

	let allSteps = []
	for (const project of projects) {
		const projectVendorId = project.currentVendor._id
		allSteps.push(project.steps._id)

		if (groupedProjectsByVendor.hasOwnProperty(projectVendorId)) {
			const currentProject = groupedProjectsByVendor[projectVendorId]
			currentProject.steps.push(project.steps._id)
			currentProject.firstPaymentDate = moment.min(moment(currentProject.firstPaymentDate), moment(project.deadline)).toISOString()
			currentProject.lastPaymentDate = moment.max(moment(currentProject.lastPaymentDate), moment(project.deadline)).toISOString()
			currentProject.total += +project.steps.nativeFinance.Price.payables
		} else {
			groupedProjectsByVendor[projectVendorId] = {
				total: +project.steps.nativeFinance.Price.payables,
				vendor: projectVendorId,
				status: INVOICING_STATUSES.CREATED,
				steps: [ project.steps._id ],
				firstPaymentDate: project.deadline,
				lastPaymentDate: project.deadline,
				file: {},
				createdBy: createdBy,
				updatedBy: createdBy,
				createdAt: moment().toISOString(),
				updatedAt: moment().toISOString()
			}
		}
	}


	for await (const report of Object.values(groupedProjectsByVendor)) {
		// const foundInDB = existsVendors.find(({ vendor }) => vendor.toString() === report.vendor.toString())
		const DIR = './dist/vendorReportsFiles/'
		// if (foundInDB && foundInDB.hasOwnProperty('_id')) {
		// 	const firstPaymentDate = moment.min(moment(foundInDB.firstPaymentDate), moment(report.firstPaymentDate)).toISOString()
		// 	const lastPaymentDate = moment.max(moment(foundInDB.lastPaymentDate), moment(report.lastPaymentDate)).toISOString()
		// 	const total = +(foundInDB.total + report.total).toFixed(2)
		// 	await InvoicingPayables.updateOne({ _id: foundInDB._id }, { $set: { lastPaymentDate, firstPaymentDate, total }, $push: { steps: { $each: report.steps } } })
		// } else {
		const { _id } = await InvoicingPayables.create({ ...report, reportId: 'RPT_v' + (++lastMaxIndex + '').padStart(6, "0") })
		await createDir(DIR, _id.toString())
		// }
		await Projects.updateMany(
				{ 'steps._id': { $in: allSteps } },
				{ 'steps.$[i].isInReportPayables': true },
				{ arrayFilters: [ { 'i._id': { $in: allSteps } } ] }
		)
	}
}

module.exports = { payablesAddSteps, addStepsToPayables }
