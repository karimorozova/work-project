const { Vendors, Pricelist } = require('../models');
const {
  getPricelistCombinations,
  replaceOldItem,
  changePricelistTable,
  getStepMultipliersCombinations
} = require('../clients');
const { tableKeys } = require('../enums');

/**
 *
 * @param {String} vendorId - updating subject's id
 * @param {String} newData - updated example from frontend
 * @param {String} oldData - old example from database
 * @return nothing - updates vendor's rates
 */
const updateVendorRatesFromCompetence = async (vendorId, newData, oldData) => {
  const vendor = await Vendors.findOne({ _id: vendorId });
  const defaultPricelist = await Pricelist.findOne({ isDefault: true });
  const sourceLangDifference = compareIds(newData.sourceLanguage, oldData.sourceLanguage);
  const targetLangDifference = compareIds(newData.targetLanguage, oldData.targetLanguage);
  const stepDifference = compareIds(newData.step, oldData.step);
  const industryDifference = compareIds(newData.industry, oldData.industry);
  if (sourceLangDifference || targetLangDifference) {
    await updateVendorLangPairs(
      oldData,
      sourceLangDifference,
      targetLangDifference,
      vendor,
      defaultPricelist
    );
  }
  if (stepDifference) {
    await updateVendorStepMultipliers(oldData, stepDifference, vendor, defaultPricelist);
  }
  if (industryDifference) {
    await updateIndustryMultipliers(oldData, industryDifference, vendor, defaultPricelist);
  }

  function compareIds(obj1, obj2) {
    return obj1._id.toString() !== obj2._id.toString() ? obj1 : undefined;
  }
};

/**
 *
 * @param {Object} oldData - old example from database
 * @param {Object} newSourceLang - new source language value of rate row
 * @param {Object} newTargetLang - new target language value of rate row
 * @param {Object} vendor - current vendor's data
 * @param {Object} defaultPricelist - default pricelist data
 * @return nothing - updates vendor's rates
 */
const updateVendorLangPairs = async (
  oldData,
  newSourceLang,
  newTargetLang,
  vendor,
  defaultPricelist
) => {
  const { _id, competencies, rates } = vendor;
  const { sourceLanguage, targetLanguage } = oldData;
  let { basicPricesTable, stepMultipliersTable, industryMultipliersTable, pricelistTable } = rates;
  if (newSourceLang) {
    const sameLangPairRow = findSameLangPairRow(basicPricesTable, newSourceLang._id, targetLanguage._id);
    if (!sameLangPairRow) {
      basicPricesTable = pushNewBasicPriceItem(
        basicPricesTable,
        defaultPricelist,
        newSourceLang._id,
        targetLanguage._id
      );
      pricelistTable = await getPricelistCombinations(
        basicPricesTable,
        stepMultipliersTable,
        industryMultipliersTable,
        pricelistTable
      );
    }
    const isNotLastLangPairInCompetence = findSameLangPairRow(competencies, sourceLanguage._id, targetLanguage._id);
    if (!isNotLastLangPairInCompetence) {
      basicPricesTable = filterRedundantLangPair(basicPricesTable, sourceLanguage._id, targetLanguage._id);
      pricelistTable = filterRedundantLangPair(pricelistTable, sourceLanguage._id, targetLanguage._id);
    }
  }
  if (newTargetLang) {
    const sameLangPairRow = findSameLangPairRow(basicPricesTable, sourceLanguage._id, newTargetLang._id);
    if (!sameLangPairRow) {
      basicPricesTable = pushNewBasicPriceItem(
        basicPricesTable,
        defaultPricelist,
        sourceLanguage,
        newTargetLang._id
      );
      pricelistTable = await getPricelistCombinations(
        basicPricesTable,
        stepMultipliersTable,
        industryMultipliersTable,
        pricelistTable
      );
    }
    const isNotLastLangPairInCompetence = findSameLangPairRow(competencies, sourceLanguage._id, targetLanguage._id);
    if (!isNotLastLangPairInCompetence) {
      basicPricesTable = filterRedundantLangPair(basicPricesTable, sourceLanguage._id, targetLanguage._id);
      pricelistTable = filterRedundantLangPair(pricelistTable, sourceLanguage._id, targetLanguage._id);
    }
  }
  await Vendors.updateOne({ _id }, {
    rates: {
      basicPricesTable,
      stepMultipliersTable,
      industryMultipliersTable,
      pricelistTable
    }
  });

  function findSameLangPairRow(arr, sourceLangId, targetLangId) {
    return arr.find(item => (
      `${item.sourceLanguage} ${item.targetLanguage}` === `${sourceLangId} ${targetLangId}`
    ));
  }

  function filterRedundantLangPair(arr, sourceLangId, targetLangId) {
    return arr.filter(item => (
      `${item.sourceLanguage} ${item.targetLanguage}` !== `${sourceLangId} ${targetLangId}`
    ));
  }

  function pushNewBasicPriceItem(basicPricesTable, defaultPricelist, sourceLanguage, targetLanguage) {
    const neededLangRow = defaultPricelist.basicPricesTable.find(item => (
      `${item.sourceLanguage} ${item.targetLanguage}` === `${sourceLanguage} ${targetLanguage}`
    ));
    const basicPrice = neededLangRow ? neededLangRow.basicPrice : 1;
    basicPricesTable.push({
      type: sourceLanguage.toString() === targetLanguage.toString() ? 'Mono' : 'Duo',
      sourceLanguage,
      targetLanguage,
      basicPrice
    });
    return basicPricesTable;
  }
};

/**
 *
 * @param {Object} oldData - old example from database
 * @param {Object} newStep - new step value of rate row
 * @param {Object} vendor - current vendor's data
 * @param {Object} defaultPricelist - default pricelist data
 * @return nothing - updates vendor's rates
 */
const updateVendorStepMultipliers = async (oldData, newStep, vendor, defaultPricelist) => {
  const { _id, competencies, rates } = vendor;
  let { basicPricesTable, stepMultipliersTable, industryMultipliersTable, pricelistTable } = rates;
  const sameStep = stepMultipliersTable.find(item => item.step._id.toString() === newStep._id.toString());
  const isNotLastStepInCompetence = competencies.find(item => item.step.toString() === oldData.step._id.toString());
  if (!sameStep) {
    stepMultipliersTable.push(...await getStepMultipliersCombinations(newStep, defaultPricelist));
    pricelistTable = await getPricelistCombinations(basicPricesTable, stepMultipliersTable, industryMultipliersTable, pricelistTable);
  }
  if (!isNotLastStepInCompetence) {
    stepMultipliersTable = filterRedundantSteps(stepMultipliersTable, oldData.step._id);
    pricelistTable = filterRedundantSteps(pricelistTable, oldData.step._id);
  }
  await Vendors.updateOne({ _id }, {
    rates: {
      basicPricesTable,
      stepMultipliersTable,
      industryMultipliersTable,
      pricelistTable
    }
  });

  function filterRedundantSteps(arr, stepId) {
    return arr.filter(item => item.step.toString() !== stepId.toString());
  }
};

/**
 *
 * @param {Object} oldData - old example from database
 * @param {Object} newIndustry - new industry of rate row
 * @param {Object} vendor - current vendor's data
 * @param {Object} defaultPricelist - default pricelist data
 * @return nothing - updates vendor's rates
 */
const updateIndustryMultipliers = async (oldData, newIndustry, vendor, defaultPricelist) => {
  const { _id, competencies, rates } = vendor;
  let { basicPricesTable, stepMultipliersTable, industryMultipliersTable, pricelistTable } = rates;
  const sameIndustry = industryMultipliersTable.find(item => item.industry.toString() === newIndustry._id.toString());
  const isNotLastIndustryInCompetence = competencies.find(item => item.industry.toString() === oldData.industry._id.toString());
  if (!sameIndustry) {
    const boundIndustry = defaultPricelist.industryMultipliersTable.find(item => item.industry.toString() === newIndustry._id.toString());
    const multiplier = boundIndustry ? boundIndustry.multiplier : 100;
    industryMultipliersTable.push({
      industry: newIndustry._id,
      multiplier
    });
    pricelistTable = await getPricelistCombinations(basicPricesTable, stepMultipliersTable, industryMultipliersTable, pricelistTable);
  }
  if (!isNotLastIndustryInCompetence) {
    industryMultipliersTable = industryMultipliersTable.filter(item => item.industry.toString() !== oldData.industry._id.toString());
    pricelistTable = pricelistTable.filter(item => item.industry.toString() !== oldData.industry._id.toString());
  }
  await Vendors.updateOne({ _id }, {
    rates: {
      basicPricesTable,
      stepMultipliersTable,
      industryMultipliersTable,
      pricelistTable
    }
  });
};

/**
 *
 * @param {String} vendorId - updating subject's id
 * @param {String} itemIdentifier - updating table identifier string
 * @param {Object} updatedItem - updated example from frontend
 * @return nothing - updates vendor's rates
 */
const updateVendorsRatePrices = async (vendorId, itemIdentifier, updatedItem) => {
  const vendor = await Vendors.findOne({ _id: vendorId });
  const defaultPricelist = await Pricelist.findOne({ isDefault: true });
  const { basicPricesTable, stepMultipliersTable, industryMultipliersTable, pricelistTable } = vendor.rates;
  let updatedPricelistTable;
  switch (itemIdentifier) {
    default:
    case tableKeys.basicPricesTable:
      const { basicPrice } = basicPricesTable.find(item => item._id.toString() === updatedItem._id.toString());
      if (basicPrice === Number(updatedItem.basicPrice)) return;
      const updatedBasicPricesTable = replaceOldItem(
        basicPricesTable,
        updatedItem,
        defaultPricelist,
        tableKeys.basicPricesTable,
        'Vendor');
      updatedPricelistTable = changePricelistTable(
        pricelistTable,
        updatedItem,
        itemIdentifier,
        basicPrice
      );
      vendor.rates.basicPricesTable = updatedBasicPricesTable;
      vendor.rates.pricelistTable = updatedPricelistTable;
      await Vendors.updateOne({ _id: vendorId }, { rates: vendor.rates });
      break;
    case tableKeys.stepMultipliersTable:
      const { multiplier: stepMultiplier } = stepMultipliersTable.find(item => item._id.toString() === updatedItem._id.toString());
      if (stepMultiplier === Number(updatedItem.multiplier)) return;
      const updatedStepMultipliersTable = replaceOldItem(
        stepMultipliersTable,
        updatedItem,
        defaultPricelist,
        tableKeys.stepMultipliersTable,
        'Vendor'
      );
      updatedPricelistTable = changePricelistTable(
        pricelistTable,
        updatedItem,
        itemIdentifier,
        stepMultiplier
      );
      vendor.rates.stepMultipliersTable = updatedStepMultipliersTable;
      vendor.rates.pricelistTable = updatedPricelistTable;
      await Vendors.updateOne({ _id: vendorId }, { rates: vendor.rates });
      break;
    case tableKeys.industryMultipliersTable:
      const { multiplier: industryMultiplier } = industryMultipliersTable.find(item => item._id.toString() === updatedItem._id.toString());
      if (industryMultiplier === Number(updatedItem.multiplier)) return;
      const updatedIndustryMultipliersTable = replaceOldItem(
        industryMultipliersTable,
        updatedItem,
        defaultPricelist,
        tableKeys.industryMultipliersTable,
        'Vendor'
      );
      updatedPricelistTable = changePricelistTable(
        pricelistTable,
        updatedItem,
        itemIdentifier,
        industryMultiplier
      );
      vendor.rates.industryMultipliersTable = updatedIndustryMultipliersTable;
      vendor.rates.pricelistTable = updatedPricelistTable;
      await Vendors.updateOne({ _id: vendorId }, { rates: vendor.rates });
      break;
  }
};

module.exports = {
  updateVendorRatesFromCompetence,
  updateVendorsRatePrices
};
