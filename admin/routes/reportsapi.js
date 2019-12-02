const router = require('express').Router();
const { getReport } = require("../reports/get");
const { getXtrfTierReport, getXtrfLqaReport } = require("../reports/xtrf");
const  { upload } = require("../utils");
const { getFilteredJson, fillXtrfLqa, fillXtrfPrices } = require("../services");
const { XtrfTier, XtrfReportLang, XtrfVendor, XtrfLqa } = require("../models");
convertExcel = require('excel-as-json').processFile;

router.get('/languages', async (req, res) => {
    try {
        const langs = await XtrfReportLang.find().sort({lang: 1});
        res.send(langs);
    } catch(err) {
        console.log(err);
        res.status(500).send("Error on getting xtrf languages");
    }
})

router.post('/tier-report', async (req, res) => {
    const { type, filters } = req.body;
    try {
        const reportData = await getReport(type, filters);
        res.send(reportData);
    } catch(err) {
        console.log(err);
        res.status(500).send("Error on getting tier report");
    }
})

router.post('/xtrf-tier', upload.fields([{ name: 'reportFiles' }]), async (req, res) => {
    const { start, end, industry } = req.body;
    const { reportFiles } = req.files;
    convertExcel(reportFiles[0].path, undefined, null, async (err, data) => {
        if(err) {
            res.send(err);
        }
        const languages = getFilteredJson(data);
        try {
            await XtrfTier.create({languages, start: new Date(start), end: new Date(end), industry});
        } catch(err) {
            console.log(err);
            res.status(500).send("Error on saving xtrf tier");
        }
        res.send(data);
    }); 
})

router.post('/xtrf-tier-report', async (req, res) => {
    const { filters } = req.body; 
    try {
        const reports = await getXtrfTierReport(filters);
        res.send(reports);
    } catch(err) {
        console.log(err);
        res.status(500).send("Error on getting reports");
    }
})

router.post('/xtrf-lqa', upload.fields([{ name: 'reportFiles' }]), async (req, res) => {
    const { reportFiles } = req.files;
    try {
        convertExcel(reportFiles[0].path, undefined, null, async (err, data) => {
            if(err) {
                res.send(err);
            }
            try {
                await fillXtrfLqa(data);
            } catch(err) {
                console.log(err);
                res.status(500).send("Error on filling xtrf LQA reports");
            }
            res.send(data);
        });
    } catch(err) {
        console.log(err);
        res.status(500).send("Error on filling xtrf LQA reports");
    }
})

router.post('/xtrf-lqa-report', async (req, res) => {
    const { filters } = req.body; 
    try {
        const reports = await getXtrfLqaReport(filters);
        res.send(reports);
    } catch(err) {
        console.log(err);
        res.status(500).send("Error on getting reports");
    }
})

router.post('/xtrf-prices', upload.fields([{ name: 'reportFiles' }]), async (req, res) => {
    const { reportFiles } = req.files; 
    try {
        convertExcel(reportFiles[0].path, undefined, null, async (err, data) => {
            if(err) {
                res.send(err);
            }
            try {
                await fillXtrfPrices(data);
            } catch(err) {
                console.log(err);
                res.status(500).send("Error on filling xtrf prices");
            }
            res.send(data);
        });
    } catch(err) {
        console.log(err);
        res.status(500).send("Error on getting reports");
    }
})

router.post('/xtrf-vendor-lqa', async (req, res) => {
    const { vendorData } = req.body;
    const key = `${vendorData.lqa}s.${[vendorData.industry]}`;
    const updateQuery = {[key]: vendorData.grade};
    try {
        await XtrfVendor.updateOne({_id: vendorData.vendor._id}, updateQuery);
        res.send("ok");
    } catch(err) {
        console.log(err);
        res.status(500).send("Error on updating vendor's lqa");
    }
})

router.post('/new-xtrf-vendor', async (req, res) => {
    const { industriesData, language, name } = req.body;
    const basicPrices = industriesData.reduce((acc, cur) => {
        acc[cur.industry] = cur.basicPrice;
        return acc;
    }, {})
    const tqis = industriesData.reduce((acc, cur) => {
        acc[cur.industry] = cur.tqi;
        return acc;
    }, {})
    try {
        const xtrfLang = await XtrfReportLang.findOne({lang: language});
        const vendor = await XtrfVendor.create({name, language: xtrfLang, basicPrices, tqis});
        await XtrfLqa.create({vendor, wordcounts: {Finance: 0, iGaming: 0, General: 0}});
        res.send('saved');
    } catch(err) {
        console.log(err);
        res.status(500).send("Error on saving new xtrf vendor");
    }
})

module.exports = router;