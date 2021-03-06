const { Pricelist, Step, Units, Languages, Industries, CurrencyRatio, Vendors, Clients } = require('../models')
const { getFilteredBasicPrices } = require('./basicPrice')
const { getFilteredStepMultiplier } = require('./stepMultipiers')
const lodash = require('lodash')

const getPercentage = (number, percentage) => number * (percentage / 100)
const multiplyPrices = (basicPrice, firstPercentMultiplier, secondPercentMultiplier) =>
		+(getPercentage(basicPrice, firstPercentMultiplier) * (secondPercentMultiplier / 100)).toFixed(4)

const { differenceOperationType } = require('../enums/differenceOperationType')
const { getVendor } = require('../vendors/getVendors')
const { getClient } = require('../clients/getClients')


const setHideAndShowOption = async ({ entityId, entityType, tableName, tableRow }) => {
	const { _id, isActive, step, unit } = tableRow
	const query = { "_id": entityId }

	const { rates } = entityType === 'Vendor' ?
			await Vendors.findOne(query, { rates: 1 }) :
			await Clients.findOne(query, { rates: 1 })

	const tableIndex = rates[tableName].findIndex(i => `${ i._id }` === `${ _id }`)
	rates[tableName][tableIndex].isActive = isActive

	rates.pricelistTable.forEach((item, index) => {
		if (`${ item.step }` === `${ step._id }` && `${ item.unit }` === `${ unit._id }`) rates.pricelistTable[index].isActive = isActive
	})

	entityType === 'Vendor' ?
			await Vendors.updateOne(query, { rates }) :
			await Clients.updateOne(query, { rates })

	return entityType === 'Vendor' ?
			await getVendor(query) :
			await getClient(query)
}


const getPricelistCombinations = async (priceListId, filters) => {
	const { countFilter, industryFilter } = filters
	const getAllIndustries = await Industries.find({ isActive: true })
	const basicPricesTable = await getFilteredBasicPrices(filters, priceListId, false)
	const stepMultipliersTable = await getFilteredStepMultiplier(filters, priceListId, false)
	const { industryMultipliersTable } = await Pricelist.findOne({ _id: priceListId }, { industryMultipliersTable: 1 }).populate('industryMultipliersTable.industry')
	const industryMultipliers = industryFilter ? industryMultipliersTable.filter(({ industry }) => industry.name === industryFilter) : industryMultipliersTable
	const priceListCombinations = []

	stepMultipliersTable.forEach(({ step, unit, multiplier: stepMultiplierValue, euroMinPrice, usdMinPrice, gbpMinPrice }) => {
		basicPricesTable.forEach(({ sourceLanguage, targetLanguage, euroBasicPrice, usdBasicPrice, gbpBasicPrice }) => {
			industryMultipliers.forEach(({ industry, multiplier: industryMultiplierValue }) => {
				priceListCombinations.push({
					sourceLanguage,
					targetLanguage,
					step,
					unit,
					industry: industry.name,
					eurPrice: multiplyPrices(euroBasicPrice, stepMultiplierValue, industryMultiplierValue),
					euroMinPrice,
					usdPrice: multiplyPrices(usdBasicPrice, stepMultiplierValue, industryMultiplierValue),
					usdMinPrice,
					gbpPrice: multiplyPrices(gbpBasicPrice, stepMultiplierValue, industryMultiplierValue),
					gbpMinPrice,
					isGrouped: false
				})
			})
		})
	})

	if (industryFilter) {
		return priceListCombinations.splice(countFilter, 25)
	}

	// TODO SHOW GROUPED (MAX R)
	// const groupedPriceLists = groupPriceList(priceListCombinations, getAllIndustries)
	// return groupedPriceLists.splice(countFilter, 25)

	return priceListCombinations.splice(countFilter, 25)
}


// TODO > NEED ?
const groupPriceList = (arr, allIndustries) => {
	let result = []

	let source = lodash.groupBy(arr, function (item) {
		return item.sourceLanguage.lang
	})
	lodash.forEach(source, function (value, target) {
		source[target] = lodash.groupBy(source[target], function (item) {
			return item.targetLanguage.lang
		})
		lodash.forEach(source[target], function (value, step) {
			source[target][step] = lodash.groupBy(source[target][step], function (item) {
				return item.step.title
			})
			lodash.forEach(source[target][step], function (value, size) {
				source[target][step][size] = lodash.groupBy(source[target][step][size], function (item) {
					return item.size
				})
				lodash.forEach(source[target][step][size], function (value, unit) {
					source[target][step][size][unit] = lodash.groupBy(source[target][step][size][unit], function (item) {
						return item.unit.type
					})
					for (const key in source[target][step][size][unit]) {
						if (source[target][step][size][unit].hasOwnProperty(key)) {
							const elements = source[target][step][size][unit][key]
							let exceptionsCounter = 0
							let currentArray = []
							let bigGroupCount = 0
							let exceptions = []

							const counter = elements.reduce(function (acc, cur) {
								if (!acc.hasOwnProperty(cur.eurPrice)) {
									acc[cur.eurPrice] = 0
								}
								acc[cur.eurPrice]++
								return acc
							}, {})

							let groupedResult = Object.keys(counter).map(function (elem) {
								return { sum: counter[elem], eurPrice: elem }
							})

							for (let i = 0; i < groupedResult.length; i++) {
								if (bigGroupCount < groupedResult[i].sum) {
									bigGroupCount = groupedResult[i].sum
								}
							}

							let ifDoubleBiggest = groupedResult.filter(item => item.sum == bigGroupCount)

							if (ifDoubleBiggest.length > 1) {
								currentArray.push(elements)
							} else {
								let findBigGroupData = elements.find(item => item.eurPrice == groupedResult.find(i => i.sum == bigGroupCount).eurPrice)
								findBigGroupData.count = groupedResult.find(item => item.sum == bigGroupCount).sum
								currentArray.push(findBigGroupData)

								let anotherAmmount = groupedResult.filter(item => item.sum !== bigGroupCount).map(item => item.eurPrice)

								anotherAmmount.forEach(element => {
									let childElements = elements.filter(item => item.eurPrice == element)
									for (let i = 0; i < childElements.length; i++) {
										childElements[i].count = 0
										currentArray.push(childElements[i])
									}
								})

								let countElentsInGroup
								let allCountElements = allIndustries.filter(item => item.active).length

								currentArray.filter(item => {
									if (item.count == bigGroupCount) {
										countElentsInGroup = item.count
									}
								})

								if (allCountElements * 0.65 > countElentsInGroup) {
									currentArray.push(...elements)
								} else {
									currentArray = currentArray.map(item => {
										if (item.count == bigGroupCount) {
											item.industry = 'All'
										}
										return item
									})

									currentArray.forEach(element => {
										element.industry !== 'All' && exceptions.push(element.industry)
										element.industry !== 'All' && exceptionsCounter++
									})

									currentArray.forEach((element) => {
										let allExeptions = ''
										if (exceptions.length) {
											for (const industry of exceptions) {
												allExeptions += ' ' + industry + ', '
											}
										}
										if (element.industry == 'All') {
											element.industry = allExeptions.length ? `All, except: ${ allExeptions }` : 'All'
										}
									})
								}
							}
							result.push(...currentArray)
						}
					}
				})
			})
		})
	})
	return result
}


const addNewMultiplier = async (key, newMultiplierId) => {
	try {
		const pricelists = await Pricelist.find()
		const currencyRatio = await CurrencyRatio.find()
		let newMultiplier
		let newMultiplierCombinations = []

		switch (key) {
			default:
			case 'Step':
				newMultiplier = await Step.findOne({ _id: newMultiplierId })
				newMultiplierCombinations = await getMultiplierCombinations(newMultiplier, 'Step', currencyRatio[0])
				for (let { _id, stepMultipliersTable } of pricelists) {
					await Pricelist.updateOne({ _id }, { stepMultipliersTable: [ ...stepMultipliersTable, ...newMultiplierCombinations ] })
				}
				break
			case 'Unit':
				newMultiplier = await Units.findOne({ _id: newMultiplierId })
				newMultiplierCombinations = await getMultiplierCombinations(newMultiplier, 'Unit', currencyRatio[0])
				for (let { _id, stepMultipliersTable } of pricelists) {
					await Pricelist.updateOne({ _id }, { stepMultipliersTable: [ ...stepMultipliersTable, ...newMultiplierCombinations ] })
				}
				break
			case 'Industry':
				newMultiplier = await Industries.findOne({ _id: newMultiplierId })
				for (let { _id, industryMultipliersTable } of pricelists) {
					industryMultipliersTable.push({ industry: newMultiplier._id })
					await Pricelist.updateOne({ _id }, { industryMultipliersTable })
				}
				break
			case 'LanguagePair':
				newMultiplier = await Languages.findOne({ _id: newMultiplierId })
		}

	} catch (err) {
		console.log(err)
		console.log('Error in addNewMultiplier')
	}
}


const updatePriceMultiplier = async (lang, value) => {
	const pricelists = await Pricelist.find()
	for (let { _id, basicPricesTable } of pricelists) {
		basicPricesTable = basicPricesTable.map(row => {
			if (row.sourceLanguage.toString() === lang.toString() || row.targetLanguage.toString() === lang.toString()) {
				row.isActive = !!value
			}
			return row
		})
		await Pricelist.updateOne({ _id }, { basicPricesTable })
	}
}


const updateMultiplier = async (key, oldMultiplier) => {
	let value
	switch (key) {
		default:
		case 'Step':
			const oldStep = oldMultiplier
			const updatedStep = await Step.findOne({ _id: oldStep._id }).populate('calculationUnit')
			const unitDifferences = getArrayDifference(oldStep.calculationUnit, updatedStep.calculationUnit, 'type')
			value = activityChange(oldStep, updatedStep, 'isActive')
			if (value) {
				await updateRowActivity(value, oldStep._id, 'stepMultipliersTable', 'step')
			}
			if (unitDifferences) {
				await checkStepDifference(unitDifferences, oldStep)
			}
			break

		case 'Unit':
			const oldUnit = oldMultiplier
			const updatedUnit = await Units.findOne({ _id: oldUnit._id }).populate('steps')
			const stepDifferences = getArrayDifference(oldUnit.steps, updatedUnit.steps, 'title')
			value = activityChange(oldUnit, updatedUnit, 'active')
			if (value) {
				await updateRowActivity(value, oldUnit._id, 'stepMultipliersTable', 'unit')
			}
			if (stepDifferences) {
				await checkUnitDifference(stepDifferences, oldUnit)
			}
			break

		case 'Industry':
			const oldIndustry = oldMultiplier
			const updatedIndustry = await Industries.findOne({ _id: oldIndustry._id })
			value = activityChange(oldIndustry, updatedIndustry, 'active')
			if (value) {
				await updateRowActivity(value, oldIndustry._id, 'industryMultipliersTable', 'industry')
			}
	}
}

const activityChange = (oldExample, updatedExample, activityKey) => {
	if (oldExample[activityKey] === updatedExample[activityKey]) {
		return false
	} else {
		if (oldExample[activityKey] && !updatedExample[activityKey]) {
			return 'Not active'
		} else if (!oldExample[activityKey] && updatedExample[activityKey]) {
			return 'Active'
		}
	}
}


const updateRowActivity = async (value, rowId, tableName, prop) => {
	const pricelists = await Pricelist.find()
	for (let pricelist of pricelists) {
		let neededTable = pricelist[tableName]
		neededTable = neededTable.map(row => {
			if (row[prop].toString() === rowId) {
				row.isActive = value === 'Active'
			}
			return row
		})
		await Pricelist.updateOne({ _id: pricelist._id }, { [tableName]: neededTable })
	}
}


const checkUnitDifference = async (stepDifferences, oldUnit) => {
	const pricelists = await Pricelist.find()
	const currencyRatio = await CurrencyRatio.find()
	const { USD, GBP } = currencyRatio[0]
	const { difference, itemsToAdd, itemsToDelete } = stepDifferences
	switch (difference) {
		default:

		case differenceOperationType.DeleteAndReplace || differenceOperationType.JustReplace || differenceOperationType.AddAndReplace:
			for (let { _id, stepMultipliersTable } of pricelists) {
				for (let stepToReplace of itemsToAdd) {
					const stepId = stepToReplace._id
					const { calculationUnit } = await Step.findOne({ _id: stepId })
					if (calculationUnit.length) {
						for (let unitId of calculationUnit) {
							stepToReplace = {
								euroMinPrice: 0,
								usdMinPrice: 0,
								gbpMinPrice: 0,
								step: stepId,
								unit: unitId
							}
							stepMultipliersTable.push(stepToReplace)
						}
					}
				}
				for (let stepToDelete of itemsToDelete) {
					stepMultipliersTable = stepMultipliersTable.filter(item => `${ item.step } ${ item.unit }` !== `${ stepToDelete._id } ${ oldUnit._id }`)
				}
				await Pricelist.updateOne({ _id }, { stepMultipliersTable })
			}
			break

		case differenceOperationType.JustDelete:
			for (let { _id, stepMultipliersTable } of pricelists) {
				for (let stepToDelete of itemsToDelete) {
					stepMultipliersTable = stepMultipliersTable.filter(item => `${ item.step } ${ item.unit }` !== `${ stepToDelete._id } ${ oldUnit._id }`)
				}
				await Pricelist.updateOne({ _id }, { stepMultipliersTable })
			}
			break

		case differenceOperationType.JustAdd:
			const newMultiplierCombinations = []
			for (let stepToReplace of itemsToAdd) {
				const { _id } = stepToReplace
				const { calculationUnit } = await Step.findOne({ _id })
				const neededUnit = calculationUnit.find(unit => unit.toString() === oldUnit._id.toString())
				let sameCombination
				for (let { stepMultipliersTable } of pricelists) {
					sameCombination = stepMultipliersTable.find(item => `${ item.step } ${ item.unit }` === `${ _id } ${ oldUnit._id }`)
				}
				if (!sameCombination) {
					newMultiplierCombinations.push({
						euroMinPrice: 0,
						usdMinPrice: 0,
						gbpMinPrice: 0,
						step: _id,
						unit: neededUnit
					})
				}
				for (let { _id, stepMultipliersTable } of pricelists) {
					await Pricelist.updateOne({ _id }, { stepMultipliersTable: [ ...stepMultipliersTable, ...newMultiplierCombinations ] })
				}
			}
			break
	}
}

const getArrayDifference = (oldArray, updatedArray, key) => {
	let itemsToAdd = arrayComparer(updatedArray, oldArray, key)
	let itemsToDelete = arrayComparer(oldArray, updatedArray, key)
	if (oldArray.length > updatedArray.length) {
		if (itemsToAdd.length) {
			return { difference: differenceOperationType.DeleteAndReplace, itemsToAdd, itemsToDelete }
		} else {
			return { difference: differenceOperationType.JustDelete, itemsToDelete }
		}

	} else if (oldArray.length === updatedArray.length && itemsToAdd.length) {
		return { difference: differenceOperationType.JustReplace, itemsToAdd, itemsToDelete }
	} else if (updatedArray.length > oldArray.length) {
		if (itemsToAdd.length && itemsToDelete.length === 0) {
			return { difference: differenceOperationType.JustAdd, itemsToAdd }
		} else {
			return { difference: differenceOperationType.AddAndReplace, itemsToAdd, itemsToDelete }
		}
	}
}

const arrayComparer = (oldCondition, newCondition, key) => oldCondition.filter(({ [key]: keyFromOld }) => (
		!newCondition.some(({ [key]: keyFromChanged }) => keyFromOld === keyFromChanged))
)


const checkStepDifference = async (unitDifferences, oldStep) => {
	const pricelists = await Pricelist.find()
	const currencyRatio = await CurrencyRatio.find()
	const { USD, GBP } = currencyRatio[0]
	const { difference, itemsToAdd, itemsToDelete } = unitDifferences
	switch (difference) {
		default:
		case differenceOperationType.DeleteAndReplace || differenceOperationType.JustReplace || differenceOperationType.AddAndReplace:
			for (let { _id, stepMultipliersTable } of pricelists) {
				for (let unitToReplace of itemsToAdd) {
					const { _id } = await Units.findOne({ _id: unitToReplace._id })
					unitToReplace = {
						euroMinPrice: 0,
						usdMinPrice: 0,
						gbpMinPrice: 0,
						step: oldStep._id,
						unit: _id
					}
					stepMultipliersTable.push(unitToReplace)
				}
				for (let unitToDelete of itemsToDelete) {
					stepMultipliersTable = stepMultipliersTable.filter(item => `${ item.step } ${ item.unit }` !== `${ oldStep._id } ${ unitToDelete._id }`)
				}
				await Pricelist.updateOne({ _id }, { stepMultipliersTable })
			}
			break
		case differenceOperationType.JustDelete:
			for (let { _id, stepMultipliersTable } of pricelists) {
				for (let unitToDelete of itemsToDelete) {
					stepMultipliersTable = stepMultipliersTable.filter(item => `${ item.step } ${ item.unit }` !== `${ oldStep._id } ${ unitToDelete._id }`)
				}
				await Pricelist.updateOne({ _id }, { stepMultipliersTable })
			}
			break
		case differenceOperationType.JustAdd:
			const newMultiplierCombinations = []
			for (let unitToReplace of itemsToAdd) {
				const { _id: unitId } = unitToReplace
				newMultiplierCombinations.push({
					euroMinPrice: 0,
					usdMinPrice: 0,
					gbpMinPrice: 0,
					step: oldStep._id,
					unit: unitId
				})
				for (let { _id, stepMultipliersTable } of pricelists) {
					await Pricelist.updateOne({ _id }, { stepMultipliersTable: [ ...stepMultipliersTable, ...newMultiplierCombinations ] })
				}
			}
			break
	}
}


const getMultiplierCombinations = async (newMultiplier, key, { USD, GBP }) => {
	let combinations = []
	if (key === 'Step') {
		const { _id, calculationUnit } = newMultiplier
		if (calculationUnit.length) {
			for (let unitId of calculationUnit) {
				combinations.push({
					euroMinPrice: 0,
					usdMinPrice: 0,
					gbpMinPrice: 0,
					step: _id,
					unit: unitId
				})
			}
		}
	}
	if (key === 'Unit') {
		const { _id, steps } = newMultiplier
		steps.forEach(step => {
			combinations.push({
				euroMinPrice: 0,
				usdMinPrice: 0,
				gbpMinPrice: 0,
				step: step._id,
				unit: _id
			})
		})
	}
	return combinations
}

module.exports = {
	getPricelistCombinations,
	getArrayDifference,
	addNewMultiplier,
	updateMultiplier,
	getPercentage,
	multiplyPrices,
	// getSizeDifference,
	activityChange,
	arrayComparer,
	updatePriceMultiplier,
	setHideAndShowOption
}
