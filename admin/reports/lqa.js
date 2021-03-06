const { Languages } = require("../models");

/**
 *
 * @param projects
 * @param filters
 * @returns {Promise<[]>}
 */
async function getLqaReport(projects, filters) {
  const steps = projects.reduce((acc, cur) => {
    if(cur.steps.length) {
      const stepsWithindustry = cur.steps
        .filter(step => getFilteredSteps(step, filters))
        .map(item => {
          item.industry = cur.industry;
          return item;
        });
      acc.push(...stepsWithindustry);
    }
    return acc;
  }, []);
  const projectLangs = new Set(steps.map(item => item.targetLanguage));
  try {
    const langs = await Languages.find({symbol: {$nin: ["EN", "EN-GB", "EN-US"], $in: [...projectLangs]}});
    return getParsedReport({steps, langs});
  } catch(err) {
    console.log(err);
    console.log("Error in getLqaReport");
  }
}

/**
 *
 * @param {Object} step
 * @param {Array} filters
 * @returns {Boolean}
 */
function getFilteredSteps(step, filters) {
  const { vendor, serviceStep, sourceLanguage } = step;
  if(serviceStep.symbol !== 'translation' || sourceLanguage !== 'EN-GB') return false;
  const { nameFilter } = filters;
  return vendor && `${vendor.firstName} ${vendor.surname}`.toLowerCase().indexOf(nameFilter.toLowerCase()) !== -1;
}

/**
 *
 * @param {Array} steps
 * @param {Array} langs
 * @returns {Array} - returns collected data
 */
function getParsedReport({steps, langs}) {
  let reportData = [];
  for(let lang of langs) {
    const langSteps = steps.filter(item => item.targetLanguage === lang.symbol);
    const report = getLangReport(langSteps);
    const key = `${lang.lang} [${lang.symbol}]`;
    reportData.push({ [key]: {...report} })
  }
  return reportData;
}

/**
 *
 * @param {Array} langSteps
 * @returns {Array} - return updated report
 */
function getLangReport(langSteps) {
  return langSteps.reduce((acc, cur) => {
    acc[cur.industry.name] = acc[cur.industry.name] || [{vendor: cur.vendor, wordcount: cur.progress.wordsDone}];
    const sameVendorIndex = acc[cur.industry.name].findIndex(item => item.vendor.id === cur.vendor.id);
    if(sameVendorIndex !== -1) {
      acc[cur.industry.name][sameVendorIndex].wordcount += cur.progress.wordsDone;
    } else {
      acc[cur.industry.name].push({
        vendor: cur.vendor,
        wordcount: cur.progress.wordsDone
      })
    }
    return acc;
  }, {})
}

module.exports = { getLqaReport }
