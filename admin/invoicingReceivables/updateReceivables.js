const { InvoicingReceivables } = require('../models')
const { returnMessageAndType } = require('./helper')
const { getReportById } = require('./getReceivables')
const { sendEmail } = require('../utils/mailTemplate')

const updateInvoiceReceivablesStatus = async (reportId, status) => {
	await InvoicingReceivables.update({ _id: reportId }, { status })
}

const sendInvoice = async (reportId) => {
	try {
		await sendInvoiceToClientContacts(reportId)
		await updateInvoiceReceivablesStatus(reportId, 'Sent')

		return returnMessageAndType('Invoice sent', 'success')
	} catch (e) {

	}
}

const sendInvoiceToClientContacts = async (_reportId) => {
	const attachments = []
	const [ report ] = await getReportById(_reportId)
	const { client, clientBillingInfo, total, reportId, lastPaymentDate, invoice } = report
	const { officialName, contacts } = client.billingInfo.find(({ _id }) => `${ _id }` === `${ clientBillingInfo }`)
	const subject = 'INVOICE READY PLS CHECK'

	attachments.push({ filename: invoice.filename, path: invoice.path })
	const finalAttachments = attachments.map(item => ({ filename: item.filename.split('-').pop(), path: `./dist/${ item.path }` }))

	//--------- TODO удалить н=>
	for await (let contact of [ { email: 'maxyplmr@gmail.com' } ]) {
		const message = 'INVOICE READY'
		await sendEmail({ to: contact.email, attachments: finalAttachments, subject }, message)
	}
	//----------------------------------

	// TODO: уже для работы реальных контатов!
	// for await (let contact of contacts) {
	// 	const message = 'INVOICE READY'
	// 	await sendEmail({ to: contact.email, attachments: finalAttachments, subject }, message)
	// }
}


module.exports = {
	sendInvoice,
	updateInvoiceReceivablesStatus,
	sendInvoiceToClientContacts
}