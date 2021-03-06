const express = require("express")
const router = express.Router()
const { User } = require("../models")

const {
	getLayoutProjects,
	getReceivablesSteps,
	getLayoutVendors, getReceivablesAdditionsSteps,
} = require("../layoutsGetters")


router.post('/update-user-layouts-setting-presets', async (req, res) => {
	const { userId, prop, value } = req.body
	const query = { _id: userId }
	try {
		const { layoutsSettings } = await User.findOne(query)
		const { presets, ...rest } = layoutsSettings[prop]
		await User.updateOne(query, { layoutsSettings: { [prop]: { ...rest, presets: value } } })
		const updatedUser = await User.findOne(query).populate('groups')
		res.send(updatedUser)
	} catch (err) {
		console.log(err)
		res.status(500).send(err.message || err || 'Error on saving settings!')
	}
})

router.post('/update-user-layouts-setting', async (req, res) => {
	const { userId, prop, value } = req.body
	try {
		await User.updateOne({ _id: userId }, { layoutsSettings: { [prop]: value } })
		const updatedUser = await User.findOne({ _id: userId }).populate('groups')
		res.send(updatedUser)
	} catch (err) {
		console.log(err)
		res.status(500).send(err.message || err || 'Error on saving settings!')
	}
})

router.post('/project', async (req, res) => {
	try {
		const { countToSkip, countToGet, sort, query } = req.body
		const data = await getLayoutProjects({ countToSkip, countToGet, sort, query })
		res.send(data)
	} catch (e) {
		res.status(500).send(e.message || e || 'Error to get a projects!')
	}
})

router.post('/vendor', async (req, res) => {
	try {
		const { countToSkip, countToGet, sort, query } = req.body
		const data = await getLayoutVendors({ countToSkip, countToGet, sort, query })
		res.send(data)
	} catch (e) {
		res.status(500).send(e.message || e || 'Error to get a projects!')
	}
})


router.post('/receivables-reports-steps', async (req, res) => {
	try {
		const { countToSkip, countToGet, sort, query } = req.body
		const steps = await getReceivablesSteps({ countToSkip, countToGet, sort, query })
		const additionsSteps = await getReceivablesAdditionsSteps({ countToSkip, countToGet, sort, query })
		res.json({ steps, additionsSteps })
	} catch (e) {
		res.status(500).send(e.message || e || 'Error to get a projects!')
	}
})


module.exports = router