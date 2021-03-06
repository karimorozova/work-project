const router = require('express').Router()
const axios = require('axios')
// const unirest = require('unirest')
const { upload } = require('../utils/')
const fs = require('fs')
const {
	Languages,
	Industries,
	Timezones,
	LeadSource,
	Group,
	Step,
	Instruction,
	CancelReason,
	User,
	ClientRequest,
	TierLqa,
	Vendors,
	Units,
	Projects
} = require('../models')
const { getFilteredProjects, getPdf } = require('../projects/')
const { getFilteredClientRequests } = require('../clientRequests')
const { getServices } = require('../services/')
// const reqq = require('request')
const { getAllCountries } = require('../helpers/countries')
const { insertUnitIntoStep, deleteUnitFromStep, changeUnitsInSteps } = require('../units')
const { insertStepsIntoUnits, changeStepsInUnits } = require('../steps')
const { ObjectId } = require("mongoose/lib/types")
const moment = require("moment")
const { createClient } = require("../clients/createClient")
const { getAllPaymentMethods } = require("../settings")
const _ = require("lodash")

router.get('/payment-methods', async (req, res) => {
	try {
		const paymentsMethods = await getAllPaymentMethods()
		res.json(paymentsMethods)
	} catch (err) {
		console.log(err)
		res.status(500).send('Error on vendor-payment-benchmark')
	}
})

router.get('/languages', async (req, res) => {
	try {
		const languages = await Languages.find({})
		res.send(languages)
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong with DB / Cannot get languages')
	}
})

router.get('/services', async (req, res) => {
	try {
		const { filter } = req.query
		let services = await getServices()
		if (filter) {
			services = services.filter(item => item.active)
		}
		res.send(services)
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong with DB / Cannot get Services')
	}
})

router.get('/industries', async (req, res) => {
	try {
		const industries = await Industries.find({})
		const lastIndustryIndex = industries.findIndex(item => item.isLast)
		const lastIndustry = industries.splice(lastIndustryIndex, 1)
		const sortedIndustries = industries.sort((a, b) => {
			if (a.name < b.name) return -1
			if (a.name > b.name) return 1
		})
		sortedIndustries.push(lastIndustry[0])
		res.send(sortedIndustries)
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong with DB / Cannot get Industries')
	}
})

router.get('/timezones', async (req, res) => {
	try {
		const timezones = await Timezones.find({})
		res.send(timezones)
	} catch (err) {
		console.log(err)
		res.status(500).send('Something wrong with DB / Cannot get Timezones')
	}
})

router.get('/countries', (req, res) => {
	try {
		const countries = getAllCountries()
		res.send(countries)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting countries")
	}
})

router.get('/leadsources', async (req, res) => {
	try {
		const leadsources = await LeadSource.find({})
		leadsources.sort((a, b) => {
			if (a.source > b.source) return 1
			if (a.source < b.source) return -1
		})
		res.send(leadsources)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting lead sources from DB")
	}
})

router.post('/leadsource', async (req, res) => {
	const { leadSource } = req.body
	try {
		if (leadSource._id) {
			await LeadSource.updateOne({ "_id": leadSource._id }, leadSource)
			return res.send("Updated")
		}
		await LeadSource.create(leadSource)
		res.send("New lead source created")
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on updating/creating a lead source")
	}
})

router.delete('/leadsource/:id', async (req, res) => {
	const { id } = req.params
	if (!id) {
		return res.send('Deleted unsaved lead source')
	}
	try {
		await LeadSource.deleteOne({ "_id": id })
		res.send('Deleted')
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting lead source")
	}
})

router.get('/groups', async (req, res) => {
	try {
		const groups = await Group.find({})
		groups.sort((a, b) => {
			if (a.name > b.name) return 1
			if (a.name < b.name) return -1
		})
		res.send(groups)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting groups from DB")
	}
})

router.post('/group', async (req, res) => {
	const { group } = req.body
	try {
		if (group._id) {
			await Group.updateOne({ "_id": group._id }, group)
			return res.send("Updated")
		}
		await Group.create(group)
		res.send("New group created")
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on updating/creating a group")
	}
})

router.delete('/group/:id', async (req, res) => {
	const { id } = req.params
	if (!id) {
		return res.send('Deleted unsaved group')
	}
	try {
		await Group.deleteOne({ "_id": id })
		res.send('Deleted')
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting group")
	}
})

router.get('/group-user', async (req, res) => {
	const { id } = req.query
	try {
		const user = await User.findOne({ group: id }, { firstName: 1 })
		res.send(user)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting any user of group")
	}
})

router.get('/steps', async (req, res) => {
	try {
		const steps = await Step.find({})
				.populate('calculationUnit')
		res.send(steps)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting steps from DB")
	}
})

router.post('/step', async (req, res) => {
	const { step } = req.body
	try {
		if (step._id) {
			await changeStepsInUnits(step)
			return res.send('Updated')
		}
		const { _id } = await Step.create(step)
		await insertStepsIntoUnits(step, _id)
		res.send(_id)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on updating/creating a step")
	}
})

router.get('/instructions', async (req, res) => {
	try {
		const instructions = await Instruction.find({})
		res.send(instructions)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting instructions from DB")
	}
})

router.post('/instructions', async (req, res) => {
	const { instruction } = req.body
	try {
		if (instruction._id) {
			await Instruction.updateOne({ "_id": instruction._id }, instruction)
			return res.send('Updated')
		}
		await Instruction.create(instruction)
		res.send('New instruction saved.')
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on updating/creating a instruction")
	}
})

router.delete('/instructions/:id', async (req, res) => {
	const { id } = req.params
	try {
		await Instruction.deleteOne({ "_id": id })
		res.send("Package deleted")
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting instruction")
	}
})

router.get('/reasons', async (req, res) => {
	try {
		const reasons = await CancelReason.find({})
		reasons.sort((a, b) => {
			if (a.reason > b.reason) return 1
			if (a.reason < b.reason) return -1
		})
		res.send(reasons)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting reasons from DB")
	}
})

router.post('/reason', async (req, res) => {
	const { reason } = req.body
	try {
		if (reason._id) {
			await CancelReason.updateOne({ "_id": reason._id }, { ...reason })
			return res.send("Updated")
		}
		await CancelReason.create(reason)
		res.send("New reason created")
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on updating/creating a reason")
	}
})

router.delete('/reason/:id', async (req, res) => {
	const { id } = req.params
	if (!id) {
		return res.send('Deleted unsaved reason')
	}
	try {
		await CancelReason.deleteOne({ "_id": id })
		res.send('Deleted')
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting reason")
	}
})

router.get('/tier-lqas', async (req, res) => {
	try {
		const result = await TierLqa.find()
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting tier lqas")
	}
})

router.get('/pdf-file', async (req, res) => {
	try {
		const result = await getPdf()
		res.send(result)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting tier lqas")
	}
})

router.get('/units', async (req, res) => {
	try {
		const units = await Units.find()
				.populate('steps')

		res.send(units)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting units")
	}
})

router.post('/units', async (req, res) => {
	const { unit } = req.body
	try {
		if (unit._id) {
			await changeUnitsInSteps(unit)
			return res.send("Updated")
		}
		const { _id } = await Units.create(unit)
		await insertUnitIntoStep(unit, _id)
		res.send(_id)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on creating unit")
	}
})

router.delete('/units/:id', async (req, res) => {
	const { id } = req.params
	if (!id) {
		return res.send("Id has not been provided")
	}
	try {
		await Units.deleteOne({ _id: id })
		await deleteUnitFromStep(id)
		res.send("Deleted")
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on deleting unit")
	}
})

router.get('/cc-stat-requests', async (req, res) => {
	try {
		const m1 = moment()
		const todayDay = m1.date()
		const todayMonth = m1.month() + 1
		const todayYear = m1.year()

		const m2 = moment().subtract(1, 'd')
		const yesterdayDay = m2.date()
		const yesterdayMonth = m2.month() + 1
		const yesterdayYear = m2.year()

		const requestsToday = await Projects.find({
			"customer": '60c3757bb9a00961d7bb5e07',
			"startDate": {
				$gte: new Date(`${ todayYear }-${ todayMonth < 10 ? '0' + todayMonth : todayMonth }-${ todayDay < 10 ? '0' + todayDay : todayDay }T00:00:00.000Z`),
				$lte: new Date(`${ todayYear }-${ todayMonth < 10 ? '0' + todayMonth : todayMonth }-${ todayDay < 10 ? '0' + todayDay : todayDay }T24:00:00.000Z`)
			}
		}).populate('accountManager ', [ 'firstName' ])
		const projectsYesterday = await Projects.find({
			"customer": '60c3757bb9a00961d7bb5e07',
			"startDate": {
				$gte: new Date(`${ yesterdayYear }-${ yesterdayMonth < 10 ? '0' + yesterdayMonth : yesterdayMonth }-${ yesterdayDay < 10 ? '0' + yesterdayDay : yesterdayDay }T00:00:00.000Z`),
				$lte: new Date(`${ yesterdayYear }-${ yesterdayMonth < 10 ? '0' + yesterdayMonth : yesterdayMonth }-${ yesterdayDay < 10 ? '0' + yesterdayDay : yesterdayDay }T24:00:00.000Z`)
			}
		}).populate('accountManager ', [ 'firstName' ])

		const html1 = Object.entries(_.groupBy(requestsToday, 'accountManager')).reduce((acc, curr) => {
			const regex = /'.+'/gm
			const user = regex.exec(curr[0])[0]
			return acc += `${ user } - ${ curr[1].length }` + '<br>'
		}, '')
		const html2 = Object.entries(_.groupBy(projectsYesterday, 'accountManager')).reduce((acc, curr) => {
			const regex = /'.+'/gm
			const user = regex.exec(curr[0])[0]
			return acc += `${ user } - ${ curr[1].length }` + '<br>'
		}, '')

		res.send(`<b>Today:</b><br>${ html1 }<br><b>Yesterday:</b><br>${ html2 }<br>`)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting stats")
	}
})

router.get('/cc-stat', async (req, res) => {
	try {
		const m1 = moment()
		const todayDay = m1.date()
		const todayMonth = m1.month() + 1
		const todayYear = m1.year()

		const m2 = moment().subtract(1, 'd')
		const yesterdayDay = m2.date()
		const yesterdayMonth = m2.month() + 1
		const yesterdayYear = m2.year()

		const projectsToday = await Projects.find({
			"customer": '60c3757bb9a00961d7bb5e07',
			"startDate": {
				$gte: new Date(`${ todayYear }-${ todayMonth < 10 ? '0' + todayMonth : todayMonth }-${ todayDay < 10 ? '0' + todayDay : todayDay }T00:00:00.000Z`),
				$lte: new Date(`${ todayYear }-${ todayMonth < 10 ? '0' + todayMonth : todayMonth }-${ todayDay < 10 ? '0' + todayDay : todayDay }T24:00:00.000Z`)
			}
		})
		const projectsYesterday = await Projects.find({
			"customer": '60c3757bb9a00961d7bb5e07',
			"startDate": {
				$gte: new Date(`${ yesterdayYear }-${ yesterdayMonth < 10 ? '0' + yesterdayMonth : yesterdayMonth }-${ yesterdayDay < 10 ? '0' + yesterdayDay : yesterdayDay }T00:00:00.000Z`),
				$lte: new Date(`${ yesterdayYear }-${ yesterdayMonth < 10 ? '0' + yesterdayMonth : yesterdayMonth }-${ yesterdayDay < 10 ? '0' + yesterdayDay : yesterdayDay }T24:00:00.000Z`)
			}
		})
		res.send(`<br><ul style="font-family: Arial; font-size: 14px;">
				<p>Today: <strong>${ projectsToday.length } / ${ projectsToday.filter(item => item.status === 'Closed').length }</strong> </p>
				<p>Yesterday: <strong>${ projectsYesterday.length } / ${ projectsYesterday.filter(item => item.status === 'Closed').length }</strong> </p>
			</ul>`)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting stats")
	}
})

router.get('/cc-stat-custom/:from/:to', async (req, res) => {
	try {
		const { from, to } = req.params
		const project = await Projects.find({
			"customer": '60c3757bb9a00961d7bb5e07',
			"startDate": {
				$gte: from, $lte: to
			}
		})
		res.send(`<br><ul style="font-family: Arial; font-size: 14px;">
				<p> ${ moment(from).format('YYYY-MM-DD HH:mm') }</p>
				<p>${ moment(to).format('YYYY-MM-DD HH:mm') }</p>
				<p> Projects: <strong>${ project.length } / ${ project.filter(item => item.status === 'Closed').length }</strong> </p>
			</ul>`)
	} catch (err) {
		console.log(err)
		res.status(500).send("Error on getting stats")
	}
})

module.exports = router
