const { Projects } = require("../models")
const moment = require('moment')
const { ObjectID: ObjectId } = require('mongodb')

const tasksFiltersQuery = ({ clients, sourceLanguages, targetLanguages, to, from, service }, allLanguages) => {
	const q = {}
	if (clients) {
		q["customer"] = { $in: clients.split(',').map(item => ObjectId(item)) }
	}
	if (sourceLanguages) {
		q["tasks.sourceLanguage"] = { $in: sourceLanguages.split(',').map(item => allLanguages.find(({ _id }) => _id.toString() === item.toString()).symbol) }
	}
	if (targetLanguages) {
		q["tasks.targetLanguage"] = { $in: targetLanguages.split(',').map(item => allLanguages.find(({ _id }) => _id.toString() === item.toString()).symbol) }
	}
	if (service) {
		q["tasks.service.title"] = service
	}
	if (!to) to = moment().add(1, 'days').format('YYYY-MM-DD')
	if (!from) from = '1970-01-01'

	q["billingDate"] = { $gte: new Date(`${ from }T00:00:00.000Z`), $lt: new Date(`${ to }T24:00:00.000Z`) }

	return q
}

const getAllTasks = async (countToSkip, countToGet, queryForStep) => {
	const queryPipeline = [
		{ $match: { status: "Closed" } },
		{ $unwind: "$tasks" },
		{ $match: { $or: [ { "tasks.isInReports": false }, { "tasks.isInReports": { $exists: false } } ], "tasks.status": "Completed", ...queryForStep } },
		{
			$lookup:
					{
						from: "clients",
						localField: "customer",
						foreignField: "_id",
						as: "customer"
					}
		},
		{
			$project: {
				'tasks': 1,
				"projectId": 1,
				'projectName': 1,
				'deadline': 1,
				'startDate': 1,
				'billingDate': 1,
				'projectCurrency': 1,
				'customer': { $arrayElemAt: [ "$customer", 0 ] }
			}
		},
		{
			$unset: [
				'customer.rates',
				'customer.services'
			]
		},
		{ $skip: countToSkip }
	]
	if (countToGet > 0) {
		queryPipeline.push({ $limit: countToGet })
	}
	return (await Projects.aggregate(queryPipeline))
}

module.exports = { tasksFiltersQuery, getAllTasks }
