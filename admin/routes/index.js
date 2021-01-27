const router = require('express').Router();
const { requiresLogin } = require('../middleware');

const apiRouter = require('./api');
const reportsapi = require('./reportsapi');
const admin = require('./admin');
const vendorRouter = require('./vendors/vendor');
const pmareaRouter = require('./pmArea/pm-manage');
const pricelistsRouter = require('./pricelists/prices');
const currencyRatioRouter = require('./pricelists/currencyRatio');
const vendorApplicationRouter = require('./vendors/application');
const portalRouter = require('./portal');
const industryRouter = require('./industry');
const serviceRouter = require('./service');
const zohoRouter = require('./zoho');
const clientsapiRouter = require('./clientsapi');
const vendorsapiRouter = require('./vendorsapi');
const projectsRouter = require('./projectsapi');
const memoqapiRouter = require('./memoqapi');
const multipliers = require('./pricelists/multipliers');
const settings  = require('./settings')

router.use('/', admin);
router.use('/api', apiRouter);
router.use('/reportsapi', requiresLogin, reportsapi);
router.use('/vendor', vendorRouter);
router.use('/portal', portalRouter);
router.use('/pm-manage', requiresLogin, pmareaRouter);
router.use('/prices', requiresLogin, pricelistsRouter);
router.use('/currency', requiresLogin, currencyRatioRouter);
router.use('/pricelists', requiresLogin, multipliers);
router.use('/industry', industryRouter);
router.use('/service', serviceRouter);
router.use('/zoho', zohoRouter);
router.use('/clientsapi', requiresLogin, clientsapiRouter);
router.use('/vendorsapi', requiresLogin, vendorsapiRouter);
router.use('/vendors/application', vendorApplicationRouter);
router.use('/projectsapi', requiresLogin, projectsRouter);
router.use('/memoqapi', memoqapiRouter);

//ADMIN
router.use('/api-settings', requiresLogin, settings)
//ADMIN


module.exports = router;
