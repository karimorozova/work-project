const { Projects, InvoicingClientReports } = require("../models")

const getShortReportList = async () => {
	const reports = await InvoicingClientReports.aggregate([
		{
			$project: {
				_id: 1,
				reportId: 1,
				client: 1,
				invoice: 1,
				total: 1
			}
		},
		{
			$sort: { _id: -1 }
		}
	])
	return InvoicingClientReports.populate(reports, [
		{ path: 'client', select: [ 'name', 'currency' ] },
		{ path: 'invoice', select: [ 'status' ] }
	])
}

const getAllReportsFromDb = async (countToSkip, countToGet, query, projectFields, unsetFields = []) => {
	const reports = await InvoicingClientReports.aggregate([
		{ $match: { ...query } },
		{
			$lookup: {
				from: "projects",
				let: { 'steps': '$stepsAndProjects.step' },
				pipeline: [
					{ $unwind: "$steps" },
					{ $match: { "$expr": { "$in": [ "$steps._id", "$$steps" ] } } },
					{ $addFields: { "steps.type": 'Classic' } },
					...generateExtraFieldForSteps('steps'),
					{ $replaceRoot: { newRoot: '$steps' } }
				],
				as: "stepsClassic"
			}
		},
		{
			$lookup: {
				from: "projects",
				let: { 'additionsSteps': '$stepsAndProjects.step' },
				pipeline: [
					{ $unwind: "$additionsSteps" },
					{ $match: { "$expr": { "$in": [ "$additionsSteps._id", "$$additionsSteps" ] } } },
					{ $addFields: { "additionsSteps.type": 'Extra' } },
					...generateExtraFieldForSteps('additionsSteps'),
					{ $replaceRoot: { newRoot: '$additionsSteps' } }
				],
				as: "stepsExtra"
			}
		},
		{ $addFields: { "stepsWithProject": { $concatArrays: [ '$stepsClassic', '$stepsExtra' ] } } },
		// { $addFields: { "total": { $sum: '$stepsWithProject.finance.Price.receivables' } } },
		{ $unset: [ 'stepsClassic', 'stepsExtra', ...unsetFields ] },
		...(!!projectFields ? [ { $project: projectFields } ] : []),
		{ $sort: { reportId: -1 } },
		{ $skip: countToSkip },
		{ $limit: countToGet }
	])

	return await InvoicingClientReports.populate(reports, [
				{ path: 'client', select: [ 'name', 'billingInfo', 'currency' ] },
				{ path: 'invoice', select: [ 'invoiceId', 'status' ] }
			]
	)

	function generateExtraFieldForSteps(key) {
		return [
			{ "$addFields": { [`${ key }` + ".projectNativeId"]: '$_id' } },
			{ "$addFields": { [`${ key }` + ".projectName"]: '$projectName' } },
			{ "$addFields": { [`${ key }` + ".projectId"]: '$projectId' } },
			{ "$addFields": { [`${ key }` + ".projectCurrency"]: '$projectCurrency' } },
			{ "$addFields": { [`${ key }` + ".start"]: '$startDate' } },
			{ "$addFields": { [`${ key }` + ".deadline"]: '$deadline' } },
			{ "$addFields": { [`${ key }` + ".billingDate"]: '$billingDate' } },
			{ "$addFields": { [`${ key }` + ".PO"]: '$PO' } }
		]
	}
}

const getAllSteps = async (countToSkip, countToGet, queryForStep) => {
	const matchProject = {
		$match: {
			clientBillingInfo: { $exists: true, $ne: null }
		}
	}
	if ('customer' in queryForStep) {
		matchProject.$match.customer = queryForStep.customer
		delete queryForStep.customer
	}
  if('clientBillingInfo' in queryForStep){
    matchProject.$match.clientBillingInfo = queryForStep.clientBillingInfo
    delete queryForStep.clientBillingInfo
  }
	if('billingDate' in queryForStep ){
		matchProject.$match.billingDate = queryForStep.billingDate
		delete queryForStep.billingDate
	}
	if('projectId' in queryForStep ){
		matchProject.$match._id =  queryForStep.projectId
		delete queryForStep.projectId
	}

  const lookup = {
		$lookup:
				{
					from: "clients",
					localField: "customer",
					foreignField: "_id",
					as: "customer"
				}
	}
	const addFields1 = getExtraFieldStructure('Classic')
	const addFields2 = getExtraFieldStructure('Extra')
	const unset = {
		$unset: [
			'customer.rates',
			'customer.services',
			'additionsSteps'
		]
	}
	const neededFields = {
		"projectId": 1,
		'projectName': 1,
		'deadline': 1,
		'startDate': 1,
		'billingDate': 1,
		'projectCurrency': 1,
		'clientBillingInfo': 1
	}

	const queryPipelineClassicSteps = [
		matchProject,
		lookup,
		{
			$project: {
				'steps': 1,
				...neededFields,
				'customer': { $arrayElemAt: [ "$customer", 0 ] }
			}
		},
		addFields1,
		{ $unwind: "$steps" },
		{
			$match: {
        $and: [
          {$or: [ { "steps.isInReportReceivables": false }, { "steps.isInReportReceivables": { $exists: false } } ]},
          {$or: [ {"steps.isReceivableVisible": true,}, {"steps.isReceivablesVisible": true,} ]}
        ],
				"steps.status": { $in: [ 'Completed', 'Cancelled Halfway', 'Created'] },
				"steps.finance.Price.receivables": { $gt: 0 },
				...queryForStep
			}
		},
		unset
	]

	const queryPipelineExtraSteps = [
		matchProject,
		lookup,
		{
			$project: {
				'additionsSteps': 1,
				...neededFields,
				'customer': { $arrayElemAt: [ "$customer", 0 ] }
			}
		},
		addFields2,
		{ $unwind: "$additionsSteps" },
		{
			$match: {
				$or: [ { "additionsSteps.isInReportReceivables": false }, { "additionsSteps.isInReportReceivables": { $exists: false } } ],
				"additionsSteps.finance.Price.receivables": { $gt: 0 },
				...queryForStep
			}
		},
		{
			$addFields: {
				"steps": "$additionsSteps"
			}
		},
		unset
	]

	const classicSteps = await Projects.aggregate(queryPipelineClassicSteps)
	const extraSteps = await Projects.aggregate(queryPipelineExtraSteps)

	return classicSteps.concat(extraSteps).slice(countToSkip, countToSkip + countToGet)

	function getExtraFieldStructure(type) {
		return {
			$addFields: {
				"type": type,
				"selectedBillingInfo": {
					$arrayElemAt: [
						{
							$filter: {
								input: "$customer.billingInfo",
								cond: { $eq: [ "$$this._id", "$clientBillingInfo" ] }
							}
						},
						0
					]
				}
			}
		}
	}
}

module.exports = {
	getShortReportList,
	getAllReportsFromDb,
	getAllSteps
}
