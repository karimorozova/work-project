const router = require('express').Router()
const { createInvoice, getInvoices, getInvoice, updateInvoice,  createInvoiceItem } = require('../invoicing')

router.post("/create-invoice", async (req, res) => {
	const { customerId, clientBillingInfoId } = req.body
	try {
		const invoice = await createInvoice(customerId, clientBillingInfoId)
		res.json({ id: invoice._id })
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong on invoicing')
	}
})

router.post("/invoices-list", async (req, res) => {
	try {
		const { page, limit } = req.query
		const { filters } = req.body
		const invoices = await getInvoices({}, page, limit, filters)
		res.json(invoices)
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong on invoicing')
	}
})

router.get("/invoice/:id", async (req, res) => {
	try {
		const { id } = req.params
		const invoice = await getInvoice(id)
		res.json(invoice)
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong on invoicing')
	}
})

router.post("/invoice/:id", async (req, res) => {
	try {
		const { id } = req.params
		await updateInvoice(id, req.body)
		res.json(await getInvoice(id))
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong on invoicing')
	}
})

// router.get("/invoice/:id/item", async (req, res) => {
// 	try {
// 		const { id } = req.params
// 		const invoice = await getInvoice(id)
// 		res.json(invoice)
// 	} catch (err) {
// 		console.log(err)
// 		res.status(500).send('Something wrong on invoicing')
// 	}
// })
//
router.post("/invoice/:id/item", async (req, res) => {
	try {
		const { id } = req.params
		const invoice = await createInvoiceItem(id, req.body)
		res.json(invoice)
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong on invoicing')
	}
})


module.exports = router