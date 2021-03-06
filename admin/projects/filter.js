const ObjectId = require('mongodb').ObjectID
const reg = /[.*+?^${}()|[\]\\]/g

const getFilteredVendorPortalProjectsQuery = (filters, allLanguages, allSteps) => {
	let query = {}

	const {
		jobId,
		projectName,
		sourceLanguages,
		targetLanguages,
		industry,
		services,
		startDateFrom,
		startDateTo,
		deadlineFrom,
		deadlineTo,
		lastDate
	} = filters

	if (jobId) {
		const filter = jobId.replace(reg, '\\$&')
		query['steps.stepId'] = { "$regex": new RegExp(filter, 'g') }
	}
	if (projectName) {
		const filter = projectName.replace(reg, '\\$&')
		query['projectName'] = { "$regex": new RegExp(filter, 'gi') }
	}
	if (lastDate) {
		query['startDate'] = { $lte: new Date(lastDate) }
	}
	if (sourceLanguages) {
		query["steps.sourceLanguage"] = { $in: sourceLanguages.split(',').map(item => allLanguages.find(({ _id }) => _id.toString() === item.toString()).symbol) }
	}
	if (targetLanguages) {
		query["steps.targetLanguage"] = { $in: targetLanguages.split(',').map(item => allLanguages.find(({ _id }) => _id.toString() === item.toString()).symbol) }
	}
	if (services) {
		query["steps.step"] = { $in: services.split(',').map(item => ObjectId(item)) }
	}
	if (industry) {
		query["industry"] = ObjectId(industry)
	}
	if (startDateFrom && startDateTo) {
		query["startDate"] = { $gte: new Date(+startDateFrom), $lt: new Date(+startDateTo) }
	}
	if (deadlineFrom && deadlineTo) {
		query["deadline"] = { $gte: new Date(+deadlineFrom), $lt: new Date(+deadlineTo) }
	}

	return query
}

function getFilteredPortalProjectsQuery(filters, allLanguages, allServices) {
	let query = {}
	const {
		projectId,
		projectName,
		createdBy,
		sourceLanguages,
		targetLanguages,
		industry,
		services,
		startDateFrom,
		startDateTo,
		deadlineFrom,
		deadlineTo,
		status,
		lastDate
	} = filters

	if (projectId) {
		const filter = projectId.replace(reg, '\\$&')
		query['projectId'] = { "$regex": new RegExp(filter, 'g') }
	}
	if (projectName) {
		const filter = projectName.replace(reg, '\\$&')
		query['projectName'] = { "$regex": new RegExp(filter, 'gi') }
	}
	if (lastDate) {
		query['startDate'] = { $lte: new Date(lastDate) }
	}
	if (sourceLanguages) {
		query["tasks.sourceLanguage"] = { $in: sourceLanguages.split(',').map(item => allLanguages.find(({ _id }) => _id.toString() === item.toString()).symbol) }
	}
	if (targetLanguages) {
		query["tasks.targetLanguage"] = { $in: targetLanguages.split(',').map(item => allLanguages.find(({ _id }) => _id.toString() === item.toString()).symbol) }
	}
	if (industry) {
		query["industry"] = ObjectId(industry)
	}
	if (services) {
		query["tasks.service.title"] = { $in: services.split(',').map(item => allServices.find(({ _id }) => _id.toString() === item.toString()).title) }
	}
	if (status) {
		query["status"] = { $in: [ status ] }
	} else {
		query["status"] = { $ne: 'Draft' }
	}
	if (startDateFrom && startDateTo) {
		query["startDate"] = { $gte: new Date(+startDateFrom), $lt: new Date(+startDateTo) }
	}
	if (deadlineFrom && deadlineTo) {
		query["deadline"] = { $gte: new Date(+deadlineFrom), $lt: new Date(+deadlineTo) }
	}
	if (createdBy) {
		const filter = projectId.replace(reg, '\\$&')
		query['createdBy.fistName'] = { "$regex": new RegExp(filter, 'i') }
	}
	return query
}


function getFilterdProjectsQuery(filters, allLanguages, allServices, allRequests) {
	let query = {}

	const {
		status,
		projectId,
		projectName,
		lastDate,
		clientName,
		projectManager,
		accountManager,
		startDateFrom,
		startDateTo,
		deadlineFrom,
		deadlineTo,
		sourceLanguages,
		targetLanguages,
		industry,
		services,
		isTest,
		projectCurrency,
		paymentProfile,
		vendors,
		tasksStatuses,
		requestId
	} = filters

	if (status !== 'All') query["status"] = status

	if (projectId) {
		const filter = projectId.replace(reg, '\\$&')
		query['projectId'] = { "$regex": new RegExp(filter, 'i') }
	}
	if (projectName) {
		const filter = projectName.replace(reg, '\\$&')
		query['projectName'] = { "$regex": new RegExp(filter, 'gi') }
	}
	if (lastDate) {
		query['startDate'] = { $lt: new Date(lastDate) }
	}
	if (clientName) {
		const filter = clientName.replace(reg, '\\$&')
		query["customer.name"] = { "$regex": new RegExp(filter, 'i') }
	}
	if (projectManager) {
		query["projectManager"] = ObjectId(projectManager)
	}
	if (accountManager) {
		query["accountManager"] = ObjectId(accountManager)
	}
	if (!!startDateFrom && !!startDateTo) {
		query["startDate"] = { $gte: new Date(+startDateFrom), $lt: new Date(+startDateTo) }
	}
	if (!!deadlineFrom && !!deadlineTo) {
		query["deadline"] = { $gte: new Date(+deadlineFrom), $lt: new Date(+deadlineTo) }
	}
	if (sourceLanguages) {
		query["tasks.sourceLanguage"] = { $in: sourceLanguages.split(',').map(item => allLanguages.find(({ _id }) => _id.toString() === item.toString()).symbol) }
	}
	if (targetLanguages) {
		query["tasks.targetLanguage"] = { $in: targetLanguages.split(',').map(item => allLanguages.find(({ _id }) => _id.toString() === item.toString()).symbol) }
	}
	if (industry) {
		query["industry"] = ObjectId(industry)
	}
	if (services) {
		query["tasks.service"] = { $in: services.split(',').map(i => ObjectId(i)) }
	}
	if (vendors) {
		query["steps.vendor"] = { $in: vendors.split(',').map(item => ObjectId(item)) }
	}
	if (tasksStatuses) {
		const tasksStatusesArr = tasksStatuses.split(',')
		if (tasksStatusesArr.includes('In progress') && !tasksStatusesArr.includes('Started')) tasksStatusesArr.push('Started')
		query["tasks.status"] = { $in: tasksStatusesArr }
	}
	if (isTest) {
		query["isTest"] = isTest === "Yes"
	}
	if (projectCurrency) {
		query["projectCurrency"] = projectCurrency
	}
	if (paymentProfile) {
		query["paymentProfile"] = paymentProfile
	}
	if (requestId) {
		const request = allRequests.find(({ projectId }) => projectId === requestId)
		if (request) query['requestId'] = ObjectId(request._id)
	}

	return query
}

module.exports = { getFilterdProjectsQuery, getFilteredPortalProjectsQuery, getFilteredVendorPortalProjectsQuery }