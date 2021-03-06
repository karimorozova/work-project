const router = require("express").Router()
const { requiresLogin } = require("../middleware")

// TODO: not used (refactoring soon...)
// const zohoRouter = require('./zoho')
router.use('/zoho',  require('./zoho'))

//--- TODO: перенести в общий роут с насройками
router.use("/industry", require("./industry"))
router.use("/service", require("./service"))
// --------------------------------------------


//SYSTEM API  =======================================================================
router.use("/clientsapi", requiresLogin, require("./clientsapi"))
router.use("/vendorsapi", requiresLogin, require("./vendorsapi"))
router.use("/memoqapi", requiresLogin, require("./memoqapi"))
router.use("/currency", requiresLogin, require("./pricelists/currencyRatio"))
router.use("/pricelists", requiresLogin, require("./pricelists/multipliers"))
router.use("/api-settings", requiresLogin, require("./settings"))
router.use("/dashboard-api", requiresLogin, require("./dashboard"))
router.use("/service-login", requiresLogin, require("./autoLogin"))
router.use("/prices", requiresLogin, require("./pricelists/prices"))
router.use("/delivery", requiresLogin, require("./pmArea/delivery"))
router.use("/clients-requests", requiresLogin, require("./pmArea/clientsRequests"))
router.use("/pm-manage", requiresLogin, require("./pmArea/pm-manage"))
router.use("/reportsapi", requiresLogin, require("./reportsapi"))
router.use("/invoicing-payables", requiresLogin, require("./invoicingPayables"))
router.use("/invoicing-receivables", requiresLogin, require("./invoicingReceivables"))
router.use("/invoicing", requiresLogin, require("./invoicingLocal"))
router.use("/layouts-api", requiresLogin, require("./layoutsGetters"))

//Open API ==========================================================================
router.use("/open-pangea", require("./OpenPangea"))
router.use("/quotesApi", require("./quotesApi"))
// TODO: refactoring routes in api route. (hide half of them)
router.use("/api", require("./api"))
// TODO: refactoring routes in admin route. (not protected)
router.use("/", require("./admin"))


//VENDOR PORTAL ROUTE ==============================================================
router.use("/vendor", require("./vendors/vendor"))
router.use("/vendors/application", require("./vendors/application"))


//CLIENT PORTAL ROUTE ==============================================================
router.use("/portal", require("./portal"))


module.exports = router

