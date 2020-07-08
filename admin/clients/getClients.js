const { Clients } = require('../models/');
const { getClientsFilteringQuery } = require('./filter');

async function getClient(obj) {
    const client = await Clients.findOne(obj)
            .populate('industries')
            .populate('nativeLanguage')
            .populate("wordsRates.source")
            .populate("wordsRates.target")
            .populate("wordsRates.industries")
            .populate("hoursRates.source")
            .populate("hoursRates.target")
            .populate("hoursRates.industries")
            .populate("monoRates.target")
            .populate("monoRates.industries")
            .populate('services.sourceLanguage')
            .populate('services.targetLanguage')
            .populate('services.industry')
            .populate('rates.industryMultipliersTable.industry')
            .populate('rates.stepMultipliersTable.step')
            .populate('rates.stepMultipliersTable.unit')
            .populate('rates.basicPricesTable.sourceLanguage')
            .populate('rates.basicPricesTable.targetLanguage')
            .populate('timeZone')
            .populate('services.service');

    return client;
}

async function getClients(obj) {
    const clients = await Clients.find(obj)
            .populate('industries')
            .populate('nativeLanguage')
            .populate("wordsRates.source")
            .populate("wordsRates.target")
            .populate("wordsRates.industries")
            .populate("hoursRates.source")
            .populate("hoursRates.target")
            .populate("hoursRates.industries")
            .populate("monoRates.target")
            .populate("monoRates.industries")
            .populate('services.sourceLanguage')
            .populate('services.targetLanguage')
            .populate('services.industry')
            .populate('rates.industryMultipliersTable.industry')
            .populate('rates.stepMultipliersTable.step')
            .populate('rates.stepMultipliersTable.unit')
            .populate('rates.basicPricesTable.sourceLanguage')
            .populate('rates.basicPricesTable.targetLanguage')
            .populate('timeZone')
            .populate('services.service');
    return clients;
}

async function getClientAfterUpdate(query, update) {
    return await Clients.findOneAndUpdate(query, update, {new: true})
            .populate('industries')
            .populate('nativeLanguage')
            .populate("wordsRates.source")
            .populate("wordsRates.target")
            .populate("wordsRates.industries")
            .populate("hoursRates.source")
            .populate("hoursRates.target")
            .populate("hoursRates.industries")
            .populate("monoRates.target")
            .populate("monoRates.industries")
            .populate('services.sourceLanguage')
            .populate('services.targetLanguage')
            .populate('services.industry')
            .populate('rates.industryMultipliersTable.industry')
            .populate('rates.stepMultipliersTable.step')
            .populate('rates.stepMultipliersTable.unit')
            .populate('rates.basicPricesTable.sourceLanguage')
            .populate('rates.basicPricesTable.targetLanguage')
            .populate('timeZone')
            .populate('services.service');
}

async function gerFilteredClients(filters) {
    try {
        const query = getClientsFilteringQuery(filters);
        const clients = await Clients.find(query).sort({_id: 1}).limit(25);
        return Clients.populate(clients, [
            "industries",
            "wordsRates.source",
            "wordsRates.target",
            "wordsRates.industries",
            "hoursRates.source",
            "hoursRates.target",
            "hoursRates.industries",
            "monoRates.target",
            "monoRates.industries"                      
        ]);
    } catch(err) {
        console.log(err);
        console.log("Error on filtering clients");
    }
}

module.exports = { getClient, getClients, getClientAfterUpdate, gerFilteredClients };