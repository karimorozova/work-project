const router = require('express').Router()
const { upload } = require('../utils')
let apiUrl = process.env.ADMIN_URL
const fse = require('fs-extra')

const {
	getClient,
	getClientWithActions,
	getClients,
	getClientRates,
	updateClientRates,
	getClientAfterUpdate,
	updateClientInfo,
	getClientAfterCombinationsUpdated,
	updateClientService,
	deleteClientService,
	updateRates,
	saveClientDocumentDefault,
	saveClientDocument,
	removeClientDoc,
	syncClientRatesCost,
	updateClientProjectDate,
	updateClientMatrix,
	syncClientMatrix,
	updateTaskDataByCondition,
	updateClientRatesFromSettings,
	getClientServices
} = require('../clients')

const { getRatePricelist, changeMainRatePricelist, bindClientRates } = require('../pricelist')
const { Clients, Pricelist, ClientRequest, Projects, ClientsTasks, ClientsNotes } = require('../models')
const { getProject } = require('../projects')
const { createClientServicesGroup, getClientServicesGroups, deleteClientServiceGroups, editClientServicesGroup } = require("../clients/clientService")
const { createClient, getContactsIdsWithCreate } = require("../clients/createClient")
const { updateClientContact, addClientContact, deleteClientContact } = require("../clients/clientContacts")
const { addContactToBilling, removeContactToBilling } = require("../clients/clientBilling")

router.get('/client', async (req, res) => {
	let { id } = req.query
	try {
		const client = await getClient({ "_id": id })
		res.send(client)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting Client")
	}
})

router.get('/client-with-activities', async (req, res) => {
	let { id } = req.query
	try {
		const client = await getClientWithActions({ "_id": id })
		res.send(client)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting Client")
	}
})

router.post('/client-priceListTable-index', async (req, res) => {
	const { clientId, rateId } = req.body
	try {
		const client = await getClient({ "_id": clientId })
		res.send(client.rates.pricelistTable.find(rate => rate._id.toString() === rateId))
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting priceListTable Client")
	}
})

router.post('/client-rate-by-key', async (req, res) => {
	const { id, key } = req.body
	try {
		const client = await getClient({ "_id": id })
		res.send(client.rates[key])
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting priceListTable Client")
	}
})

router.get('/clients-every', async (req, res) => {
	try {
		const clients = await getClients({})
		res.send(clients)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting Client")
	}
})

router.post('/combination', async (req, res) => {
	const { step, rate } = req.body
	try {
		const project = await getProject({ "steps._id": step._id })
		const updatedClient = await getClientAfterCombinationsUpdated({ project, step, rate })
		res.send(updatedClient)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on adding combination for Client")
	}
})

router.post('/import-rates', async (req, res) => {
	const { clientId, ratesData, prop } = req.body
	try {
		const updatedClient = await importRates({ clientId, ratesData, prop })
		res.send(updatedClient)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on importing rates to Client")
	}
})

router.get("/unique-email", async (req, res) => {
	const { email } = req.query
	try {
		const client = await Clients.findOne({ "contacts.email": email })
		if (client) {
			return res.send("exist")
		}
		res.send("")
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on checking Client's contact email uniqueness.")
	}
})

router.post('/update-client', upload.any(), async (req, res) => {
	let client = JSON.parse(req.body.client)
	let clientId = client._id
	let result
	try {
		if (!client._id) {
			result = await createClient({ client })
		} else {
			result = await updateClientInfo({ clientId, client, files: req.files })
		}
		res.send({ client: await getClientWithActions({ _id: result._id }) })
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating/creating Client')
	}
})

router.get('/get-client-discounts', async (req, res) => {
	const { id } = req.query
	try {
		const discounts = await Clients.findOne({ "_id": id }, { discounts: 1 }).populate('discounts')
		res.send(discounts)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting client\'s discounts')
	}
})

router.post('/update-client-discounts', async (req, res) => {
	const { _id, updatedArray } = req.body
	try {
		const updatedClient = await getClientAfterUpdate({ _id }, { discounts: updatedArray })
		res.send(updatedClient)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating client\'s discounts')
	}
})

router.get('/get-contract', async (req, res) => {
	const { path } = req.query
	try {
		res.send(`${ apiUrl }${ path }`)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting contract')
	}
})

router.get('/get-nda', async (req, res) => {
	const { path } = req.query
	try {
		res.send(`${ apiUrl }${ path }`)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting NDA')
	}
})

router.delete('/deleteclient/:id', async (req, res) => {
	const { id } = req.params
	try {
		await fse.remove('./dist/clientsDocs/' + id, (err) => {
			console.log(err)
		})
		await Clients.deleteOne({ "_id": id })
		res.send('Deleted')
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting Client")
	}
})

router.post('/addContact', upload.any(), async (req, res) => {
	const { id, contact } = req.body
	try {
		const result = await addClientContact(id, JSON.parse(contact), req.files)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting contact of Client")
	}
})

router.post('/updateContact', upload.any(), async (req, res) => {
	const { id, contact } = req.body
	try {
		const result = await updateClientContact(id, JSON.parse(contact), req.files)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting contact of Client")
	}
})

router.post('/add-contact-to-bill', async (req, res) => {
	const { clientId, billingId, contactsIds } = req.body
	try {
		console.log(clientId, billingId, contactsIds)
		const result = await addContactToBilling(clientId, billingId, contactsIds)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting contact of Client")
	}
})

router.post('/remove-contact-to-bill', async (req, res) => {
	const { clientId, billingId, contactId } = req.body
	try {
		const result = await removeContactToBilling(clientId, billingId, contactId)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting contact of Client")
	}
})

router.post('/deleteContact', async (req, res) => {
	const { id, contactId } = req.body
	try {
		const result = await deleteClientContact(id, contactId)
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting contact of Client")
	}
})

router.post('/update-matrix', async (req, res) => {
	const { id, matrix } = req.body
	try {
		const result = await getClientAfterUpdate({ "_id": id }, { matrix: matrix })
		res.send({ updatedClient: result })
	} catch (err) {
		res.status(500).send("Error on updating matrix")
	}
})
router.get('/any-doc', async (req, res) => {
	const { id } = req.query
	try {
		const request = await ClientRequest.findOne({ customer: id })
		if (request) {
			return res.send(request)
		}
		const project = await Projects.findOne({ "customer": id })
		res.send(project)
	} catch (err) {
		res.status(500).send("Error on getting any document of client")
	}
})

router.post('/update-client-status', async (req, res) => {
	const { id, isTest } = req.body
	try {
		await Clients.updateOne({ "_id": id }, { "isTest": isTest })
		const client = await getClient({ "_id": id })
		res.send(client)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on updating Client status")
	}
})

router.post('/update-client-leadContact', async (req, res) => {
	const { id, contactId } = req.body
	try {
		await Clients.updateOne({ "_id": id, 'contacts._id': contactId }, { 'contacts.$[].leadContact': false })
		await Clients.updateOne({ "_id": id, 'contacts._id': contactId }, { 'contacts.$.leadContact': true })
		const client = await Clients.findOne({ "_id": id }, { contacts: 1 })
		res.send(client.contacts)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on updating Client status")
	}
})

router.get('/rates/:id', async (req, res) => {
	const { id: clientId } = req.params
	try {
		const { rates } = await getClientRates({ _id: clientId })
		res.send(rates)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting client rates')
	}
})

router.post('/rates/:id', async (req, res) => {
	const { id: clientId } = req.params
	const { itemIdentifier, updatedItem } = req.body
	try {
		await updateClientRates(clientId, itemIdentifier, updatedItem)
		res.send('Updated')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on editing client rates')
	}
})

router.post('/rates/bind-rates', async (req, res) => {
	const { id: clientId } = req.params
	const { defaultPricelistId, objToBind, key } = req.body
	try {
		await bindClientRates(clientId, defaultPricelistId, objToBind, key)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on binding multipliers')
	}
})

router.post('/rates', async (req, res) => {
	const { oldMultiplier, key } = req.body
	try {
		await updateRates(key, oldMultiplier)
		res.send('Saved')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating rates')
	}
})

router.post('/rates/change-pricelist/:id', async (req, res) => {
	const { id: clientId } = req.params
	try {
		await changeMainRatePricelist(clientId, req.body)
		res.send('Saved')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on changing pricelist')
	}
})

router.post('/rates/sync-cost/:id', async (req, res) => {
	const { id: clientId } = req.params
	const { tableKey, row } = req.body
	try {
		await syncClientRatesCost(clientId, tableKey, row)
		res.send('Synced')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on syncing client\'s rates')
	}
})

router.post('/rates/rate-combinations/:id', async (req, res) => {
	const { id: clientId } = req.params
	try {
		const ratePricelist = await getRatePricelist(clientId, req.body)
		res.send(ratePricelist)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on getting client rate\'s combinations')
	}
})

router.put('/toggle-ignore-min-price', async (req, res) => {
	const { _id, value } = req.body
	try {
		await Clients.updateOne({ _id }, { ignoreMinPrice: value })
		res.send('Saved')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on setting client\'s ignoreMinPrice value')
	}
})

router.put('/set-min-price', async (req, res) => {
	const { _id, value } = req.body
	try {
		await Clients.updateOne({ _id }, { minPrice: value })
		res.send('Saved')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on setting client\'s min price')
	}
})

router.post('/updated-retest-from-settings', async (req, res) => {
	const { clientId } = req.body
	try {
		const updatedClient = await updateClientRatesFromSettings(clientId)
		res.send(updatedClient)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating Client rates from settings')
	}
})


router.get('/client-services/:id', async (req, res) => {
	const { id } = req.params
	try {
		const services = await getClientServices(id)
		res.send(services)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving Client services')
	}
})
router.get('/client-group/:clientId', async (req, res) => {
	const { clientId } = req.params
	try {
		const { servicesGroups = [] } = await getClientServicesGroups(clientId)
		console.log(servicesGroups)
		res.send(servicesGroups)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving Client services')
	}
})

router.delete('/client-group/:clientId/:id', async (req, res) => {
	const { id, clientId } = req.params
	try {
		await deleteClientServiceGroups(clientId, id)
		const { servicesGroups = [] } = await getClientServicesGroups(clientId)
		console.log(servicesGroups)
		res.send(servicesGroups)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving Client services')
	}
})

router.post('/client-group/:clientId', async (req, res) => {
	const { clientId } = req.params
	const { groupName, industry, service, source, target } = req.body

	try {
		await createClientServicesGroup({ clientId, groupName, industry, service, source, target })
		const { servicesGroups = [] } = await getClientServicesGroups(clientId)
		res.send(servicesGroups)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving Client services')
	}
})

router.post('/client-group/:clientId/:id', async (req, res) => {
	const { clientId, id } = req.params
	const { groupName, industry, service, source, target } = req.body

	try {
		await editClientServicesGroup(clientId, id, { groupName, industry, service, source, target })
		const { servicesGroups = [] } = await getClientServicesGroups(clientId)
		res.send(servicesGroups)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving Client services')
	}
})

router.post('/services', async (req, res) => {
	const { clientId, currentData, oldData } = req.body
	try {
		const updatedClient = await updateClientService(clientId, currentData, oldData)
		res.send(updatedClient)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on saving Client services')
	}
})

router.delete('/services/:clientId/:serviceId', async (req, res) => {
	const { clientId, serviceId } = req.params
	try {
		const client = await deleteClientService(clientId, serviceId)
		res.send(client)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on deleting Client services')
	}
})

router.post('/client-document-default', async (req, res) => {
	const { clientId, category } = req.body
	try {
		const updatedClient = await saveClientDocumentDefault({
			clientId, category
		})
		res.send(updatedClient)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on adding client documents")
	}
})

router.post('/client-document', upload.fields([ { name: 'documentFile' } ]), async (req, res) => {
	const { clientId, category, oldFilePath, oldName, oldCategory } = req.body
	const files = req.files["documentFile"] || []
	try {
		const updatedClient = await saveClientDocument({
			clientId, file: files[0], category, oldFilePath, oldName, oldCategory
		})
		res.send(updatedClient)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on adding client document")
	}
})

router.post('/remove-client-doc', async (req, res) => {
	const { clientId, docFile } = req.body
	try {
		const updatedVendor = await removeClientDoc({
			clientId, ...docFile
		})
		res.send(updatedVendor)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on removing client document")
	}
})

router.post('/client-project-date', async (req, res) => {
	const { clientId, date } = req.body
	try {
		await updateClientProjectDate(clientId, date)
		res.send('Updated')
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on updating client\'s project date')
	}
})

router.post("/update-matrix/:id", async (req, res) => {
	const { id } = req.params
	const { updatedRowObj } = req.body
	try {
		const { matrix } = await updateClientMatrix(id, updatedRowObj)
		res.send(matrix)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on updating Client discount table")
	}
})

router.post('/sync-matrix/:id', async (req, res) => {
	const { id } = req.params
	const { key } = req.body
	try {
		const { matrix } = await syncClientMatrix(id, key)
		res.send(matrix)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on syncing client\'s matrix')
	}
})

router.get('/client-languages', async (req, res) => {
	let { id } = req.query
	try {
		const client = await Clients
				.findOne({ "_id": id }, { sourceLanguages: 1, targetLanguages: 1 })
				.populate('sourceLanguages')
				.populate('targetLanguages')

		res.send(client)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting Client")
	}
})

router.get('/all-clients-emails', async (req, res) => {
	try {
		const clients = await Clients.find({}, { email: 1 })
		res.send(clients)
	} catch {
		console.log(err)
		res.status(500).send("Error on getting Clients in /all-clients-emails")
	}
})

router.post('/update-notes', async (req, res) => {
	const { user, notesId, message, clientId } = req.body
	try {
		const [ client ] = await Clients.find({ "_id": clientId })
		if (!notesId) {
			client.notes.push({ user, message })
		} else {
			const currNoteInx = client.notes.findIndex(({ _id }) => _id.toString() === notesId.toString())
			const { user: oldUser } = client.notes[currNoteInx]
			client.notes.splice(currNoteInx, 1, { user: oldUser, message, updatedAT: Date.now() })
		}
		const updatedClient = await getClientAfterUpdate({ "_id": clientId }, { notes: client.notes })
		res.send(updatedClient)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on client notes')
	}
})

router.post('/delete-notes', async (req, res) => {
	const { index, clientId } = req.body
	try {
		const [ client ] = await Clients.find({ "_id": clientId })
		client.notes.splice(index, 1)
		const updatedClient = await getClientAfterUpdate({ "_id": clientId }, { notes: client.notes })
		res.send(updatedClient)
	} catch (e) {
		console.log(e)
		res.status(500).send('Error on client notes')
	}
})

// Activities

// Task
router.post('/activity/task/', async (req, res) => {
	try {
		const { data } = req.body
		await ClientsTasks.create(data)

		const tasks = await ClientsTasks.find({ "client": data.client })
				.populate('assignedTo', [ 'firstName', 'lastName' ])

		res.send(tasks)

	} catch (e) {
		res.status(500).send('Error on client created')
	}

})

router.post('/activity/task/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { data } = req.body
		await ClientsTasks.updateOne({ _id: id }, updateTaskDataByCondition(data))
		const tasks = await ClientsTasks.find({ "client": data.client }).populate('assignedTo', [ 'firstName', 'lastName' ])
		res.send(tasks)
	} catch (e) {
		res.status(500).send('Error on client update')
	}

})

router.get('/activity/task/:id', async (req, res) => {
	try {
		const { id } = req.params
		const task = await ClientsTasks.find({ _id: id })
		res.send(task)
	} catch (e) {
		res.status(500).send('Error on client get')
	}

})

router.delete('/activity/task/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { client } = req.query
		await ClientsTasks.deleteOne({ _id: id })
		const tasks = await ClientsTasks.find({ "client": client }).populate('assignedTo', [ 'firstName', 'lastName' ])
		res.send(tasks || [])
	} catch (e) {
		res.status(500).send('Error on client delete')
	}

})

// End Task

// Notes
router.post('/activity/note/', async (req, res) => {
	try {
		const { data } = req.body
		await ClientsNotes.create(data)

		const activityNote = await ClientsNotes.find({ "client": data.client })
				.populate('assignedTo', [ 'firstName', 'lastName' ])

		res.send(activityNote)

	} catch (e) {
		res.status(500).send('Error on client created')
	}

})

router.post('/activity/note/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { data } = req.body
		await ClientsNotes.updateOne({ _id: id }, updateTaskDataByCondition(data))
		const activityNotes = await ClientsNotes.find({ "client": data.client }).populate('assignedTo', [ 'firstName', 'lastName' ])
		res.send(activityNotes)
	} catch (e) {
		res.status(500).send('Error on client update')
	}

})

router.get('/activity/note/:id', async (req, res) => {
	try {
		const { id } = req.params
		const activityNote = await ClientsNotes.find({ _id: id })
		res.send(activityNote)
	} catch (e) {
		res.status(500).send('Error on client get')
	}

})

router.delete('/activity/note/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { client } = req.query
		await ClientsNotes.deleteOne({ _id: id })
		const activityNotes = await ClientsNotes.find({ "client": client }).populate('assignedTo', [ 'firstName', 'lastName' ])
		res.send(activityNotes || [])
	} catch (e) {
		res.status(500).send('Error on client delete')
	}

})

// End Notes
// End Activities

// router.post('/get-billing-info/:_id', async (req, res) => {
// 	try {
// 		const { _id } = req.params
// 		const billingInfo = await getClientAfterUpdate() Clients.findOne({ _id }, { billingInfo: 1 })
// 		res.send(billingInfo.billingInfo)
// 	} catch (err) {
// 		console.log(err)
// 		res.status(500).send('Error on get /deleting | payment-terms')
// 	}
// })


router.post('/update-billing-info/:_id', async (req, res) => {
	try {
		const { _id } = req.params
		let { billingInfo } = req.body

		if (!billingInfo._id) {
			await Clients.updateOne({ _id }, { $push: { billingInfo: billingInfo } })
		} else {
			await Clients.updateOne({ _id }, { $set: { "billingInfo.$[i]": { ...billingInfo } } }, { arrayFilters: [ { 'i._id': billingInfo._id } ] })
		}
		res.send(await getClientWithActions({ _id: _id }))
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on get /deleting | payment-terms')
	}
})

router.post('/delete-billing-info/:_id', async (req, res) => {
	try {
		const { _id } = req.params
		const { billingInfoId } = req.body
		const updated = await Clients.updateOne({ _id }, { $pull: { "billingInfo": { _id: billingInfoId } } })
		res.send(updated)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on get /deleting | payment-terms')
	}
})

module.exports = router
