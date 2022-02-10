const { InvoicingPayables, InvoicingPayablesArchive } = require("../models")
const { moveProjectFile } = require('../utils/movingFile')
const fs = require('fs')
const { getPayable } = require("./getPayables")

const {
	removeFile,
	addFile,
	createBillZohoRequest
} = require("./zohoBilling")

const moment = require("moment")
const {
	invoiceFileUploading,
	getVendorAndCheckPaymentTerms
} = require("./helpers")
const ObjectId = require("mongodb").ObjectID

const setPayablesNextStatus = async (reportsIds, nextStatus) => {
	await InvoicingPayables.updateMany({ _id: { $in: reportsIds } }, { status: nextStatus })
}
const invoiceReloadFile = async ({ reportId, invoiceFile, oldPath }) => {
	await fs.unlink(`./dist${ oldPath }`, (err) => {
		if (err) console.log("Error in removeOldInvoiceFile")
	})
	const { newPath } = await invoiceFileUploading(invoiceFile[0])
	const { status, zohoBillingId } = await InvoicingPayables.findOneAndUpdate({ _id: reportId }, {
		'paymentDetails.file': { fileName, path: newPath }
	})
	if (status === 'Invoice Ready') {
		await removeFile(zohoBillingId)
		await addFile(zohoBillingId, newPath)
	}
}

const zohoBillCreation = async (_id) => {
	const [ { vendor, reportId: billNumber, lastPaymentDate, paymentDetails: { expectedPaymentDate, file: { path } }, steps } ] = await getPayable(_id)
	const vendorName = vendor.firstName + ' ' + vendor.surname
	const monthAndYear = moment(lastPaymentDate).format("MMMM YYYY")

	const rate = steps.reduce((acc, { nativeFinance }) => {
		acc += nativeFinance.Price.payables
		return acc
	}, 0)

	const lineItems = [ {
		"name": `TS ${ monthAndYear }`,
		"account_id": "335260000002330131",
		"rate": rate,
		"quantity": 1
	} ]
	const { bill } = await createBillZohoRequest(expectedPaymentDate, vendorName, vendor.email, billNumber, lineItems)
	const zohoBillingId = bill.bill_id
	await updatePayable(_id, { zohoBillingId })
	await addFile(zohoBillingId, path)
}


const invoiceSubmission = async ({ reportId, vendorId, invoiceFile, paymentMethod }) => {
	const [ { paymentDetails } ] = await getPayable(reportId)
	const vendor = await getVendorAndCheckPaymentTerms(vendorId)
	const { fileName, newPath } = await invoiceFileUploading(invoiceFile[0])
	paymentDetails.paymentMethod = paymentMethod
	paymentDetails.expectedPaymentDate = new Date(moment().add(vendor.billingInfo.paymentTerm.value, 'days').format('YYYY-MM-DD'))

	//TODO HOLD CHECK

	// await InvoicingPayables.updateOne(
	// 		{ _id: reportId },
	// 		{ status: 'SOON ASDASDASD', 'paymentDetails.file': { fileName, path: newPath } }
	// )
}

const paidOrAddPaymentInfo = async (reportId, zohoPaymentId, data) => {
	const status = data.unpaidAmount <= 0 ? "Paid" : "Partially Paid"

	await InvoicingPayables.updateOne({ _id: reportId }, { $set: { status: status }, $push: { paymentInformation: { ...data, zohoPaymentId } } })

	if ("Paid" === status) {
		await InvoicingPayables.aggregate([
			{ "$match": { "_id": ObjectId(reportId) } },
			{
				"$merge": {
					"into": {
						"db": "pangea",
						"coll": "invoicingpayablesarchives"
					}
				}
			}
		])
		await InvoicingPayables.remove({ _id: reportId })
		return "Moved"
	}

	return 'Success'
}

const updatePayable = async (reportId, obj) => {
	await InvoicingPayables.updateOne({ _id: reportId }, obj)
	return await getPayable(reportId)
}

module.exports = { setPayablesNextStatus, paidOrAddPaymentInfo, invoiceSubmission, invoiceReloadFile, updatePayable }