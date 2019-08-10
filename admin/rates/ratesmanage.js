const { Industries } = require("../models");
const { getUpdatedPricelist, getPricelist } = require("./getPrices");

async function getAfterRatesSaved(rateInfo, pricelist) {
    const { prop, packageSize, industries, source, target, rates } = rateInfo;
    try {
        let updatedRates = [];
        if(prop === 'monoRates') {
            updatedRates = await manageMonoPairRates({
                packageSize, industries, target, rates, priceRates: pricelist[prop]
            });
        } else {
            updatedRates = await manageDuoPairRates({
                source, target, industries, rates, priceRates: pricelist[prop]
            });
        }
        return await getUpdatedPricelist({"_id": pricelist.id}, {[prop]: updatedRates});
    } catch(err) {
        console.log(err);
        console.log("Error in getAfterRatesSaved");
    }
}

async function getAfterAddSeveralRates({priceId, ratesData, prop}) {
    try {
        if(prop === 'monoRates') {
            return await getAfterAddSeveralMono(priceId, ratesData);
        }
        return await getAfterAddSeveralDuo({priceId, ratesData, prop});
    } catch(err) {
        console.log(err);
        console.log("Error in getAfterAddSeveralRates");
    }
}

/////// Mono rates managing start ///////

async function manageMonoPairRates({packageSize, industries, target, rates, priceRates, entity}) {
    try {
        const allIndustries = entity ? entity.industries : await Industries.find();
        if(industries[0].name === 'All') {
            if(!priceRates.length) {
                return [{packageSize, industries: allIndustries, target, rates}]
            }
            let updatedRates = priceRates.filter(item => {
                if(item.target.lang === target.lang && item.packageSize === packageSize) return false;
                return true;
            });
            updatedRates.push({target, packageSize, industries: allIndustries, rates});
            return updatedRates;
        } else {
            if(!priceRates.length) {
                return [{packageSize, industries, target, rates}]
            }
            return manageMonoNotAllIndustriesRate({packageSize, industries, target, rates, priceRates})
        }
    } catch(err) {
        console.log(err);
        console.log("Error in manageMonoPairRates");
    }
}

function manageMonoNotAllIndustriesRate({packageSize, industries, target, rates, priceRates}) {
    const industriesIds = industries.map(item => item._id);
    let updatedRates = priceRates.filter(item => {
        if(item.target.lang === target.lang && item.packageSize === packageSize) return false;
        return true;
    });
    let samePairs = priceRates.filter(item => item.packageSize === packageSize && target.lang === item.target.lang);
    if(samePairs.length) {
        updatedRates.push(...manageSamePairs({samePairs, rates, industriesIds, form: 'mono'}));
    } else {
        updatedRates.push({target, packageSize, industries, rates});  
    }
    return updatedRates.filter(item => item.industries.length);
}

async function getAfterAddSeveralMono(priceId, ratesData) {
    let { copyRates, industries, stepsIds, packages, targets } = ratesData;
    if(industries[0] === 'All') {
        industries = [{name: 'All'}]
    }
    const targetsIds = targets.map(item => item._id);
    const allAvailablePairs = copyRates.filter(item => packages.indexOf(item.packageSize) !== -1 && targetsIds.indexOf(item.target._id)!== -1);
    try {
        const price = await getPricelist({"_id": priceId});
        let monoRates = price.monoRates.length ? [...price.monoRates] : [];
        for(let pair of allAvailablePairs) {
            let copiedRates = getRatesToCopy(pair.rates, stepsIds);
            const { packageSize, target } = pair;
            monoRates = await manageMonoPairRates({
                packageSize, industries, target, rates: copiedRates, priceRates: monoRates
            });
        }
        return await getUpdatedPricelist({"_id": priceId}, { monoRates });
    } catch(err) {
        console.log(err);
        console.log("Error in getAfterAddSeveralMono");
    }
}

/////// Mono rates managing end ///////

/////// Duo rates managing start ///////

async function manageDuoPairRates({source, target, industries, rates, priceRates, entity}) {
    try {
        const allIndustries = entity ? entity.industries : await Industries.find();
        if(industries[0].name === 'All') {
            if(!priceRates.length) {
                return [{source, target, industries: allIndustries, rates}]
            }
            let updatedRates = priceRates.filter(item => {
                if(item.source.lang === source.lang && item.target.lang === target.lang) return false;
                return true;
            });
            updatedRates.push({source, target, industries: allIndustries, rates});
            return updatedRates;
        } else {
            if(!priceRates.length) {
                return [{source, target, industries, rates}]
            }
            return manageDuoNotAllIndustriesRate({source, target, industries, rates, priceRates})
        }
    } catch(err) {
        console.log(err);
        console.log("Error in manageDuoPairRates");
    }
}

function manageDuoNotAllIndustriesRate({source, target, industries, rates, priceRates}) {
    const industriesIds = industries.map(item => item._id);
    let updatedRates = priceRates.filter(item => {
        if(item.source.lang === source.lang && item.target.lang === target.lang) return false;
        return true;
    });
    let samePairs = priceRates.filter(item => item.source.lang === source.lang && target.lang === item.target.lang);
    if(samePairs.length) {
        updatedRates.push(...manageSamePairs({samePairs, rates, industriesIds, form: 'duo'}));
    } else {
        updatedRates.push({source, target, industries, rates});  
    }
    return updatedRates.filter(item => item.industries.length);
}

async function getAfterAddSeveralDuo({priceId, ratesData, prop}) {
    let { copyRates, industries, stepsIds, sources, targets } = ratesData;
    if(industries[0] === 'All') {
        industries = [{name: 'All'}]
    }
    const sourcesIds = sources.map(item => item._id);
    const targetsIds = targets.map(item => item._id);
    const allAvailablePairs = copyRates.filter(item => sourcesIds.indexOf(item.source._id) !== -1 && targetsIds.indexOf(item.target._id)!== -1);
    try {
        const price = await getPricelist({"_id": priceId});
        let updatedRates = price[prop].length ? [...price[prop]] : [];
        for(let pair of allAvailablePairs) {
            let copiedRates = getRatesToCopy(pair.rates, stepsIds);
            const { source, target } = pair;
            updatedRates = await manageDuoPairRates({
                source, industries, target, rates: copiedRates, priceRates: updatedRates
            });
        }
        return await getUpdatedPricelist({"_id": priceId}, { [prop]: updatedRates });
    } catch(err) {
        console.log(err);
        console.log("Error in getAfterAddSeveralDuo");
    }
}

/////// Duo rates manage end ///////

function manageSamePairs({samePairs, rates, industriesIds, form}) {
    let sameRateIndex = samePairs.findIndex(item => areEqual(item.rates, rates));
    let managedRates = samePairs.map((item, index) => {
        let industries = [];
        if(sameRateIndex === index) {
            industries = item.industries.map(industry => industry.id);
            industries.push(industriesIds);
            industries = industries.filter((value, index, self) => self.indexOf(value) === index);    
        } else {
            industries = item.industries.filter(industry => industriesIds.indexOf(industry.id) === -1);
        }
        item.industries = industries;
        return item;
    })
    if(sameRateIndex === -1) {
        form === 'mono' ? managedRates.push({target: samePairs[0].target, packageSize: samePairs[0].packageSize, industries: industriesIds, rates})
            : managedRates.push({source: samePairs[0].source, target: samePairs[0].target, industries: industriesIds, rates})
    }
    return managedRates;
}

function areEqual(itemRates, rates) {
    for(let key in itemRates) {
        if(JSON.stringify(itemRates[key]) !== JSON.stringify(rates[key])) {
            return false
        }
    }
    return true;
}

function getRatesToCopy(pairRates, stepsIds) {
    return Object.keys(pairRates).reduce((prev, cur) => {
        if(stepsIds.indexOf(cur) !== -1) {
            prev[cur] = pairRates[cur]
        } else {
            prev[cur] = {value: 0, min: 5, active: false}
        }
        return {...prev}
    }, {})
}

module.exports = { getAfterRatesSaved, getAfterAddSeveralRates, manageMonoPairRates, manageDuoPairRates }