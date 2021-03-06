const { InvoicingPayables, InvoicingPayablesArchive } = require("../models")
const fs = require('fs')
const { getPayable, getPayableByVendorId } = require("./getPayables")

const {
	removeFile,
	addFile,
	createBillZohoRequest
} = require("./zohoBilling")

const moment = require("moment")
const _ = require('lodash')
const {
	invoiceFileUploading,
	getVendorAndCheckPaymentTerms,
	updatePayableReport,
	getReportsTotal
} = require("./helpers")
const ObjectId = require("mongodb").ObjectID

const setPayablesNextStatus = async (reportsIds, nextStatus) => {
	await InvoicingPayables.updateMany({ _id: { $in: reportsIds } }, { status: nextStatus })
}
const invoiceReloadFile = async ({ reportId, invoiceFile, oldPath }) => {
	await fs.unlink(`./dist${ oldPath }`, (err) => {
		if (err) console.log("Error in removeOldInvoiceFile")
	})
	const { fileName, newPath } = await invoiceFileUploading(invoiceFile[0], reportId)
	const { status, zohoBillingId } = await InvoicingPayables.findOneAndUpdate({ _id: reportId }, {
		'paymentDetails.file': { fileName, path: newPath }
	})
	// TODO ZOHO API (soon)
	// if (status === 'Invoice Ready' && !!zohoBillingId) {
	// 	await removeFile(zohoBillingId)
	// 	await addFile(zohoBillingId, newPath)
	// }
}

const invoicePaymentMethodResubmission = async ({ reportId, vendorId, paymentMethod }) => {
	let vendorReportsAll = await getPayableByVendorId(vendorId)

	const [ { paymentDetails: currentPaymentDetails } ] = await getPayable(reportId)

	let sameVendorReports = vendorReportsAll.filter(({ status, _id, paymentDetails }) =>
			(status === 'Invoice on-hold' || status === 'Invoice Ready')
			&& `${ reportId }` !== `${ _id }`
			&& paymentDetails.paymentMethod
			&& currentPaymentDetails.paymentMethod?.name === paymentDetails.paymentMethod.name
	)
	const vendor = await getVendorAndCheckPaymentTerms(vendorId)

	await InvoicingPayables.updateMany({ _id: { $in: [ reportId, ...sameVendorReports.map(i => `${ i._id }`) ] } }, { "paymentDetails.paymentMethod": paymentMethod })

	vendorReportsAll = (await getPayableByVendorId(vendorId)).filter(({ status }) => status === 'Invoice on-hold' || status === 'Invoice Ready')

	const groupedReportsByPaymentName = _.groupBy(vendorReportsAll, 'paymentDetails.paymentMethod.name')

	for await (const paymentGroup of Object.values(groupedReportsByPaymentName)) {
		const status = getReportsTotal(paymentGroup) >= paymentGroup[0].paymentDetails.paymentMethod.minimumAmount
				? 'Invoice Ready'
				: 'Invoice on-hold'

		const expectedPaymentDate = status === 'Invoice Ready'
				? new Date(moment().add(vendor.billingInfo.paymentTerm.value, 'days').format('YYYY-MM-DD'))
				: ''

		await InvoicingPayables.updateMany({ _id: { $in: [ ...paymentGroup.map(i => `${ i._id }`) ] } }, { status, "paymentDetails.expectedPaymentDate": expectedPaymentDate })
	}
}

const invoiceSubmission = async ({ reportId, vendorId, invoiceFile, paymentMethod }) => {
	let vendorReportsAll = await getPayableByVendorId(vendorId)

	const [ { paymentDetails, total } ] = await getPayable(reportId)

	const vendor = await getVendorAndCheckPaymentTerms(vendorId)
	const { fileName, newPath: path } = await invoiceFileUploading(invoiceFile[0], reportId)

	{
		paymentDetails.paymentMethod = typeof paymentMethod === 'string' ? JSON.parse(paymentMethod) : paymentMethod
		paymentDetails.expectedPaymentDate = new Date(moment().add(vendor.billingInfo.paymentTerm.value, 'days').format('YYYY-MM-DD'))
		paymentDetails.file = { fileName, path }
	}

	let vendorReports = vendorReportsAll.filter(({ status, _id, paymentDetails: paymentDetailsReport }) =>
			(status === 'Invoice on-hold' || status === 'Invoice Ready')
			&& `${ reportId }` !== `${ _id }`
			&& paymentDetailsReport.paymentMethod
			&& paymentDetailsReport.paymentMethod.name === paymentDetails.paymentMethod.name
	)

	switch (true) {
		case (!vendorReports.length && paymentDetails.paymentMethod.minimumAmount > +total):
		case (vendorReports.length && (getReportsTotal(vendorReports) + +total) < paymentDetails.paymentMethod.minimumAmount): {
			paymentDetails.expectedPaymentDate = ''
			await updatePayableReport(reportId, { status: 'Invoice on-hold', paymentDetails })
			break
		}
		case (!vendorReports.length && paymentDetails.paymentMethod.minimumAmount <= +total): {
			await updatePayableReport(reportId, { status: 'Invoice Ready', paymentDetails })
			break
		}
		case (vendorReports.length && (getReportsTotal(vendorReports) + +total) > paymentDetails.paymentMethod.minimumAmount): {
			for await (let id of [ reportId, ...vendorReports.map(({ _id }) => _id.toString()) ]) {
				await updatePayableReport(id, { status: 'Invoice Ready', paymentDetails })
			}
			break
		}
	}
}

const clearZohoLink = async (id) => {
	await InvoicingPayablesArchive.findByIdAndUpdate(id, {zohoBillingId: ''})
}

// TODO ZOHO API (soon)
// const zohoBillCreation = async (_id) => {
// 	const [ { vendor, reportId: billNumber, total, lastPaymentDate, paymentDetails: { expectedPaymentDate, file: { path } } } ] = await getPayable(_id)
// 	const vendorName = vendor.firstName + ' ' + vendor.surname
// 	const monthAndYear = moment(lastPaymentDate).format("MMMM YYYY")
//
// 	const lineItems = [ {
// 		"name": `TS ${ monthAndYear }`,
// 		"account_id": "335260000002330131",
// 		"rate": total,
// 		"quantity": 1
// 	} ]
//
// 	const { bill } = await createBillZohoRequest(expectedPaymentDate, vendorName, vendor.email, billNumber, lineItems)
// 	const zohoBillingId = bill.bill_id
// 	await updatePayableReport(_id, { zohoBillingId })
// 	await addFile(zohoBillingId, path)
// }

module.exports = {
	setPayablesNextStatus,
	invoiceSubmission,
	invoiceReloadFile,
	invoicePaymentMethodResubmission,
	clearZohoLink
}
