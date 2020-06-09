const { XtrfPrice, TierLqa, LangTier, Languages, MemoqProject, Vendors } = require("../models");

//// Tier report /////

async function getXtrfTierReport(filters, grouped = false) {
  const today = new Date();
  let start = new Date(today.getFullYear(), today.getMonth() - 6, -1);
  start.setHours(0, 0, 0, 0);
  try {
    const filterQuery = filters.targetFilter ? { lang: { $in: filters.targetFilter } } : {};
    const languages = await Languages.find(filterQuery);
    let reports = await LangTier.find();
    let result = getParsedReport(reports, languages);
    if (filters.tierFilter) {
      result = result.filter(item => {
        return item.allTier.tier === filters.tierFilter
          || item.financeTier.tier === filters.tierFilter
          || item.gameTier.tier === filters.tierFilter;
      });
    }
    const groupedLangs = getGroupedLangs(result, 'group');
    return grouped ? groupedLangs : result;
  } catch (err) {
    console.log(err);
    console.log("Error in getXtrfTierReport");
  }
}

function getParsedReport(reports, languages) {
  let result = [];
  for (let { lang, memoq, group } of languages) {
    const langReport = getLangReport(lang, memoq, group, reports);
    result.push(langReport);
  }
  result = result.sort((a, b) => a.target > b.target ? 1 : -1);
  return result;
}

function getGroupedLangs(array, key) {
  const grouped = groupByKey(array, key);
  return Object.keys(grouped).reduce((prev, curr) => ({
    ...prev,
    [curr]: grouped[curr].reduce((prevLang, currLang) => {
      return ({
        target: curr,
        allTier: {
          tier: currLang.allTier.tier,
          wordcount: prevLang.allTier.wordcount + currLang.allTier.wordcount,
          clients: Math.ceil(prevLang.allTier.clients + currLang.allTier.clients),
        },
        financeTier: {
          tier: currLang.financeTier.tier,
          wordcount: prevLang.financeTier.wordcount + currLang.financeTier.wordcount,
          clients: Math.ceil(prevLang.financeTier.clients + currLang.financeTier.clients),
        },
        gameTier: {
          tier: currLang.gameTier.tier,
          wordcount: prevLang.gameTier.wordcount + currLang.gameTier.wordcount,
          clients: Math.ceil(prevLang.gameTier.clients + currLang.gameTier.clients),
        }
      });
    }, {
      allTier: {
        wordcount: 0,
        clients: 0
      },
      financeTier: {
        wordcount: 0,
        clients: 0
      },
      gameTier: {
        wordcount: 0,
        clients: 0
      }
    })
  }), {});
}

function groupByKey(array, key) {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
}

function getLangReport(lang, memoq, group, reports) {
  let result = { target: lang, memoqSymbol: memoq, group };
  result.allTier = getTier(lang, reports, 'General');
  result.financeTier = getTier(lang, reports, 'Finance');
  result.gameTier = getTier(lang, reports, 'iGaming');
  return result;
}

function getTier(lang, reports, industry) {
  let totalWords = 0;
  let totalClients = 0;
  const filteredReports = industry !== 'General' ?
    reports.filter(item => item.industry === industry)
    : reports;
  for (let report of filteredReports) {
    const targetLang = report.languages[lang];
    const { wordcount, clients } = targetLang ? getClientsWordcount(targetLang) : { wordcount: 0, clients: 0 };
    totalWords += wordcount;
    totalClients += clients;
  }
  totalWords = Math.round(totalWords / 6);
  totalClients = +(totalClients / 6).toFixed(1);
  return industry === 'General' ? getAllTier(totalWords, totalClients) : getSpecificTier(totalWords, totalClients);
}

function getClientsWordcount(targetLang) {
  const wordcount = Object.keys(targetLang).reduce((acc, cur) => {
    acc += targetLang[cur];
    return acc;
  }, 0);
  const clients = Object.keys(targetLang).length;
  return { wordcount, clients };
}

function getAllTier(wordcount, clients) {
  let tier = 2;
  if ((wordcount > 55000 && clients > 9) || wordcount > 100000) {
    tier = 1;
  } else if (wordcount < 5000 || (wordcount < 10000 && clients < 5)) {
    tier = 3;
  }
  return { tier, wordcount, clients };
}

function getSpecificTier(wordcount, clients) {
  let tier = 2;
  if ((wordcount > 30000 && clients > 4) || wordcount > 60000) {
    tier = 1;
  } else if (wordcount < 2500 || (wordcount < 5000 && clients < 3)) {
    tier = 3;
  }
  return { tier, wordcount, clients };
}

function getLqaAllTier(wordcount) {
  let tier = 2;
  if (wordcount > 100000) {
    tier = 1;
  } else if(wordcount < 5000) {
    tier = 3;
  }
  return tier;
}

function getLqaSpecificTier(wordcount) {
  let tier = 2;
  if (wordcount > 60000) {
    tier = 1;
  } else if (wordcount < 2500) {
    tier = 3;
  }
  return tier;
}

//// Lqa report /////
async function getXtrfLqaReport(filters) {
  const filterQuery = getFilteringQuery(filters);
  const vendroFilterQuery = getVendorsQuery(filters);
  const { nameFilter } = filters;
  try {
    const tiers = await getXtrfTierReport(filters);
    const vendors = await Vendors.find(vendroFilterQuery);
    for (let vendor of vendors) {
      const { wordCountInfo } = vendor;
      console.log(wordCountInfo);
    }
    const memoqs = await MemoqProject.find(filterQuery);
    const financeDocs = getIndustryDocs(memoqs, 'Finance');
    const gamingDocs = getIndustryDocs(memoqs, 'iGaming');
    const otherDocs = getIndustryDocs(memoqs, 'Other');
    const calculatedTiers = [];
    calculatedTiers.push(tiers.reduce((acc, curr) => {
      acc[curr.group] = acc[curr.group] ?
        {
          ...acc[curr.group],
          allTier: {
            wordcount: acc[curr.group].allTier.wordcount + curr.allTier.wordcount,
          },
          financeTier: {
            wordcount: acc[curr.group].financeTier.wordcount + curr.financeTier.wordcount,
          },
          gameTier: {
            wordcount: acc[curr.group].gameTier.wordcount + curr.gameTier.wordcount,
          }
        } : {
          group: curr.group,
          memoqSymbol: curr.memoqSymbol,
          allTier: {
            wordcount: curr.allTier.wordcount,
          },
          financeTier: {
            wordcount: curr.financeTier.wordcount,
          },
          gameTier: {
            wordcount: curr.gameTier.wordcount,
          }
        };
      return acc;
    }, {}))
    return calculatedTiers.reduce((acc, curr) => {
      acc.push(Object.values(curr).reduce((prevLang, curLang) => {
        prevLang[curLang.group] = prevLang[curLang.group] ?
          {
            ...prevLang[curLang.group],
            finance: {
              vendor: {
                ...prevLang[curLang.group].finance.vendor,
                ...getLqaWordcount(curLang, financeDocs, nameFilter),
              },
              gaming: {
                ...prevLang[curLang.group].gaming.vendor,
                ...getLqaWordcount(curLang, gamingDocs, nameFilter),
              }
            }
          } : {
            target: curLang.group,
            tier: getLqaAllTier(curLang.allTier.wordcount),
            finance: {
              tier: getLqaSpecificTier(curLang.financeTier.wordcount),
              vendor: getLqaWordcount(curLang, financeDocs, nameFilter),
            },
            gaming: {
              tier: getLqaSpecificTier(curLang.gameTier.wordcount),
              vendor: getLqaWordcount(curLang, gamingDocs, nameFilter),
            }
          }
          return prevLang;
      }, {}));
      return acc;
    }, []).map(item => Object.values(item).filter(elem => {
      let financeVendor = elem.finance.vendor;
      let gameVendor = elem.gaming.vendor;
      return Object.keys(financeVendor).length > 0 || Object.keys(gameVendor).length > 0;
    }));
    // FOR FUTURE LQA:
    // let reportsFilter = {target: filterQuery.language};
    // if(filters.tierFilter) {
    //     reportsFilter.tierFilter = filters.tierFilter;
    // }
    // let reports = await getXtrfTierReport(reportsFilter);
    // reports = reports.filter(item => item.financeTier.wordcount || item.gameTier.wordcount)
    //     .map(item => {
    //         return {
    //             target: item.target,
    //             finance: item.financeTier.tier,
    //             game: item.gameTier.tier
    //         }
    //     });
    // const lqas = await getFilteredLqas(filterQuery);
    // return await getFilteredLqaReports({reports, lqas, filters});
  } catch (err) {
    console.log(err);
    console.log("Error in getXtrfLqaReport");
  }
}

function getIndustryDocs(arr, industry) {
  const industryMemoq = arr.filter(item => item.domain === industry);
  return industryMemoq.reduce((acc, cur) => [...acc, ...cur.documents], []);
}

function getLqaWordcount(tier, arr, vendorName) {
  return arr.reduce((acc, cur) => {
    if (Object.keys(cur.UserAssignments).length && cur.TargetLangCode === tier.memoqSymbol) {
      const { TranslationDocumentUserRoleAssignmentDetails } = cur.UserAssignments;
      const translator = TranslationDocumentUserRoleAssignmentDetails[0];
      if (translator) {
        if (!vendorName || vendorName && translator.UserInfoHeader.FullName.match(RegExp(`${vendorName}`))) {
          acc[translator.UserInfoHeader.FullName] = acc[translator.UserInfoHeader.FullName] ?
            {
              ...acc[translator.UserInfoHeader.FullName],
              wordCount: acc[translator.UserInfoHeader.FullName].wordCount + +cur.TotalWordCount
            }
            : {
              id: translator.UserInfoHeader.UserGuid,
              name: translator.UserInfoHeader.FullName,
              wordCount: +cur.TotalWordCount,
              langCode: cur.TargetLangCode,
            };
        }
      }
    }
    return acc;
  }, {});
}

function getUpcomingWordcount(tiers, arr, vendorName, industry) {
  return arr.reduce((acc, cur) => {
    const tier = tiers.find(tier => tier && tier.memoqSymbol === cur.TargetLangCode);
    if (Object.keys(cur.UserAssignments).length && !!tier) {
      const { TranslationDocumentUserRoleAssignmentDetails } = cur.UserAssignments;
      const translator = TranslationDocumentUserRoleAssignmentDetails[0];
      const reportProp = industry === 'Finance' ? 'financeTier' : 'gameTier';
      if (translator) {
        if (!vendorName || vendorName && translator.UserInfoHeader.FullName.match(RegExp(`${vendorName}`))) {
          acc[translator.UserInfoHeader.FullName] = acc[translator.UserInfoHeader.FullName] ?
            {
              ...acc[translator.UserInfoHeader.FullName],
              wordCount: acc[translator.UserInfoHeader.FullName].wordCount + +cur.TotalWordCount
            }
            : {
              id: translator.UserInfoHeader.UserGuid,
              name: translator.UserInfoHeader.FullName,
              wordCount: +cur.TotalWordCount,
              tier: tier[reportProp].tier,
              langCode: cur.TargetLangCode,
            };
        }
      }
    }
    return acc;
  }, {});
}

async function getFilteredLqaReports({ reports, lqas, filters }) {
  let result = [];
  try {
    const tierLqas = await TierLqa.find();
    for (let report of reports) {
      let finance = getIndustriesLqas({ lqas, tierLqas, report, reportProp: "finance", filters, prop: "Finance" });
      let gaming = getIndustriesLqas({ lqas, tierLqas, report, reportProp: "game", filters, prop: "iGaming" });
      if (finance.length || gaming.length) {
        let price = await getLanguagePrices(report.target);
        const prices = price.length ? price[0].prices : null;
        if (!filters.industryFilter) {
          result.push({
            ...report,
            prices,
            financeVendors: finance,
            gamingVendors: gaming
          });
        } else {
          let filteredReport = getFilteredByIndustry({ report, finance, gaming, filters });
          result = filteredReport ? [...result, { ...filteredReport, prices }] : result;
        }
      }
    }
    return result;
  } catch (err) {
    console.log(err);
    console.log("Error in getFilteredLqaReports");
  }
}

function getIndustriesLqas({ lqas, tierLqas, report, reportProp, filters, prop }) {
  const tierLqaWords = tierLqas.find(item => item.category == report[reportProp]);
  const withLqaVendors = lqas.map(item => {
    const isLqa1 = +item.wordcounts[prop] >= +tierLqaWords.lqa1 && !item.vendor.lqa1s[prop];
    const isLqa2 = +item.wordcounts[prop] >= +tierLqaWords.lqa2 && !isLqa1 && !item.vendor.lqa2s[prop];
    const isLqa3 = +item.wordcounts[prop] >= +tierLqaWords.lqa3 && !isLqa1 && !isLqa2 && !item.vendor.lqa3s[prop];
    return {
      ...item,
      tier: report[reportProp],
      industry: prop,
      isLqa1,
      isLqa2,
      isLqa3
    };
  });
  return withLqaVendors.filter(item => {
    let isFit = item.vendor.language.lang === report.target && item.vendor.tqis[prop];
    isFit = isFit && filters.tierFilter ? report[reportProp] === filters.tierFilter : isFit;
    if (isFit) {
      const lqaProp = item[`isLqa${filters.lqaFilter}`];
      isFit = filters.lqaFilter ? lqaProp : isFit;
    }
    return isFit;
  });
}

function getFilteredByIndustry({ report, finance, gaming, filters }) {
  if (filters.industryFilter === 'Finance' && finance.length) {
    return {
      ...report,
      financeVendors: finance,
      gamingVendors: []
    };
  } else if (filters.industryFilter === 'iGaming' && gaming.length) {
    return {
      ...report,
      financeVendors: [],
      gamingVendors: gaming
    };
  }
}

function getFilteringQuery(filters) {
  let query = { $and: [ { documents: { $ne: null }, creationTime: { $gte: new Date('2020-04-01T00:00:00Z') } }] };
  if (filters.nameFilter) {
    query[
      'documents.UserAssignments.TranslationDocumentUserRoleAssignmentDetails.UserInfoHeader.FullName'
      ] = { '$regex': new RegExp(`${filters.nameFilter}`, 'i') };
  }
  if (filters.industryFilter) {
    query.domain = { '$regex': new RegExp(`${filters.industryFilter}`, 'i') };
  }
  if (filters.targetLanguage) {
    query['targetLanguages.lang'] = { $in: filters.targetLanguage };
  }
  return query;
}

function getVendorsQuery(filters) {
  let query = { $and: [{ status: 'Active' }, {wordCountInfo: { $ne: [] }}] };

  if (filters.nameFilter) {
    query.firstName = { '$regex': new RegExp(`${filters.nameFilter}`, 'i') };
  }
  if (filters.industryFilter) {
    query['wordCountInfo.industry.name'] = { '$regex': new RegExp(`${filters.industryFilter}`, 'i') };
  }
  if (filters.targetLanguage) {
    query['wordCountInfo.targetLanguage.group'] = { $in: filters.targetLanguage };
  }
  return query;
}

async function getLanguagePrices(target) {
  try {
    return await XtrfPrice.aggregate([
      {
        $lookup:
          {
            from: "xtrfreportlangs",
            localField: "language",
            foreignField: "_id",
            as: "language"
          }
      },
      {
        $unwind: {
          path: "$language"
        }
      },
      {
        $match: {
          "language.lang": target
        }
      }
    ]);
  } catch (err) {
    console.log(err);
    console.log("Error in getLanguagePrices");
  }
}

// Upcoming LQA
async function getXtrfUpcomingReport(filters) {
  const filterQuery = getFilteringQuery(filters);
  const { nameFilter } = filters;
  try {
    const tiers = await getXtrfTierReport(filters);
    const memoqs = await MemoqProject.find(filterQuery);
    const financeDocs = getIndustryDocs(memoqs, 'Finance');
    const gamingDocs = getIndustryDocs(memoqs, 'iGaming');
    const financeReports = getUpcomingWordcount(tiers, financeDocs, nameFilter, 'Finance');
    const gamingReports = getUpcomingWordcount(tiers, gamingDocs, nameFilter, 'iGaming');
    return {
      financeReports,
      gamingReports,
    };
  } catch (err) {
    console.log(err);
    console.log("Error in getXtrfUpcomingReport");
  }
}

module.exports = { getXtrfTierReport, getXtrfLqaReport, getXtrfUpcomingReport };
