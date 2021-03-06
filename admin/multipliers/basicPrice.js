const { Pricelist, Languages, CurrencyRatio } = require('../models')
const ObjectId = require('mongodb').ObjectID
const { tableKeys } = require('../enums')
const { postNotifications } = require('./relatedUsersNotifications')

const getFilteredBasicPrice = async (filteredBasicPrices, filters, needToSplice) => {
	const { countFilter } = filters
	if (filters.sourceFilter) {
		const lang = await Languages.findOne({ lang: filters.sourceFilter })
		filteredBasicPrices = filteredBasicPrices.filter(({ sourceLanguage }) => sourceLanguage._id.toString() === lang._id.toString())
	}
	if (filters.targetFilter) {
		const lang = await Languages.findOne({ lang: filters.targetFilter })
		filteredBasicPrices = filteredBasicPrices.filter(({ targetLanguage }) => (
				targetLanguage._id.toString() === lang._id.toString()
		))
	}
	if (filters.typeFilter) {
		filteredBasicPrices = filteredBasicPrices.filter(({ type }) => type === filters.typeFilter)
	}
	if (needToSplice) filteredBasicPrices = filteredBasicPrices.splice(countFilter, 25)
	return filteredBasicPrices.filter(row => row.isActive === true)
}

const getFilteredBasicPrices = async (filters, priceListId, needToSplice = true) => {
	try {
		const { basicPricesTable } = await Pricelist.findOne({ _id: priceListId }, {
			_id: 0,
			basicPricesTable: 1
		}).populate('basicPricesTable.sourceLanguage').populate('basicPricesTable.targetLanguage')
		return await getFilteredBasicPrice(basicPricesTable, filters, needToSplice)
	} catch (err) {
		console.log(err)
		console.log('Error in getFilteredBasicPrices')
		throw new Error(err.message)
	}
}

const updateBasicPrices = async (basicPriceToUpdate, priceListId) => {
	try {
		const { basicPricesTable } = await Pricelist.findOne({ _id: priceListId }, { _id: 0, basicPricesTable: 1 })
		const basicPriceIndex = basicPricesTable.findIndex(basicPrice => basicPrice._id.toString() === basicPriceToUpdate._id)
		basicPriceToUpdate.altered = true
		fixedPrice4()
		await basicPricesTable.splice(basicPriceIndex, 1, basicPriceToUpdate)
		await postNotifications(priceListId, basicPriceToUpdate, tableKeys.basicPricesTable)
		await Pricelist.updateOne({ _id: priceListId }, { basicPricesTable })
	} catch (err) {
		console.log(err)
		console.log('Error in updateBasicPrices')
	}

	function fixedPrice4() {
		basicPriceToUpdate.usdBasicPrice = +parseFloat(basicPriceToUpdate.usdBasicPrice).toFixed(4)
		basicPriceToUpdate.euroBasicPrice = +parseFloat(basicPriceToUpdate.euroBasicPrice).toFixed(4)
		basicPriceToUpdate.gbpBasicPrice = +parseFloat(basicPriceToUpdate.gbpBasicPrice).toFixed(4)
	}
}

const updateBasicPriceValue = async ({ USD, GBP }) => {
	try {
		const priceLists = await Pricelist.find()
		for (let { basicPricesTable, _id } of priceLists) {
			let updatedBasicPrices = []
			for (let { euroBasicPrice, usdBasicPrice, gbpBasicPrice, _id: basicPriceId, type, sourceLanguage, targetLanguage } of basicPricesTable) {
				usdBasicPrice = +(euroBasicPrice * Number(USD)).toFixed(4)
				gbpBasicPrice = +(euroBasicPrice * Number(GBP)).toFixed(4)
				updatedBasicPrices.push({
					euroBasicPrice,
					usdBasicPrice,
					gbpBasicPrice,
					_id: basicPriceId,
					type,
					sourceLanguage,
					targetLanguage
				})
			}
			await Pricelist.updateOne({ _id }, { basicPricesTable: updatedBasicPrices })
		}
	} catch (err) {
		console.log(err)
		console.log('Error in updateBasicPriceValue')
	}
}

const pushNewLangs = async (pricelistId, newLangs) => {
	let { basicPricesTable, newLangPairs } = await Pricelist.findOne({ _id: pricelistId })
	const currencyRatio = await CurrencyRatio.find()
	const { USD, GBP } = currencyRatio
	for (let { source, target } of newLangs) {
		const rowToDeleteIndex = newLangPairs.findIndex(row => row.source.toString() === source._id && row.target.toString() === target._id)
		newLangPairs.splice(rowToDeleteIndex, 1)
		const type = source._id.toString() === target._id.toString() ? 'Mono' : 'Duo'
		basicPricesTable.push({
			sourceLanguage: ObjectId(source._id),
			targetLanguage: ObjectId(target._id),
			type,
			usdBasicPrice: USD,
			gbpBasicPrice: GBP
		})
	}
	return await Pricelist.updateOne({ _id: pricelistId }, { basicPricesTable, newLangPairs })
}

module.exports = { getFilteredBasicPrices, updateBasicPrices, updateBasicPriceValue, pushNewLangs }
