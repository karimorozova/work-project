const router = require('express').Router();
const { getProjectsFinanceInfo }  = require('../dashboard/overallView/projectFinance')


router.post("/finance-view", async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const result = await getProjectsFinanceInfo(startDate, endDate)
    res.send(result)
    } catch(err) {
      console.log(err);
      res.status(500).send('Something wrong on Finance getting');
    }
});

module.exports = router;