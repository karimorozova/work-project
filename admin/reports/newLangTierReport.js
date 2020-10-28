const { MemoqProject, Languages, LangTier } = require('../models');

const newLangReport = async () => {
	const languages = await Languages.find();
	let projects = await MemoqProject.find({$and: [ {status:"Closed"},{isTest: false}]});
	projects = projects.filter(item => item.sourceLanguage);
	const reports = [];

	for (let { domain, sourceLanguage, documents } of projects) {
		const industryGroup = findIndustry(domain);
		industryGroup && sourceLanguage && distributeIndustries(industryGroup, sourceLanguage, documents)
		distributeIndustries('All', sourceLanguage, documents)
	}

	function distributeIndustries(industryKey, sourceLanguage, documents) {
		const doesIndustryExists = reports.find(row => row.industry === industryKey);
		if(doesIndustryExists === undefined) {
			reports.push({
				industry: industryKey,
				source: [returnSourceObj(languages, sourceLanguage.memoq, 1, documents)]
			});
		} else {
			const neededReport = reports.findIndex(item => item.industry === industryKey);

			const sameSourceIndex = reports[neededReport].source.findIndex(({ lang }) => (
					lang === findLanguageGroup(languages, sourceLanguage.memoq
					)));

			if(sameSourceIndex === -1) {
				reports[neededReport].source.push(returnSourceObj(languages, sourceLanguage.memoq, 1, documents));
			} else {
				reports[neededReport].source[sameSourceIndex].targets.push(...findAllTargets(documents));
			}
		}
	}

	await LangTier.deleteMany();
	await postReports();

	async function postReports() {
		const result = [];
		for (let report of reports) {
			const { source } = report;
			report.source = source.map(item => {
				let unitedTargets = [];
				for (let { lang, wordcount } of item.targets) {
					const sameTargetIndex = unitedTargets.findIndex(row => row.lang === lang);
					if(sameTargetIndex !== -1) {
						unitedTargets[sameTargetIndex].wordcount += wordcount;
					} else {
						unitedTargets.push({
							lang,
							wordcount
						});
					}
				}
				item.targets = unitedTargets;
				return item;
			});
			result.push(report);
		}
		await LangTier.create(result);
	}

	function returnSourceObj(languages, source, client, targets) {
		return { lang: findLanguageGroup(languages, source), clients: client, targets: findAllTargets(targets) };
	}

	function findLanguageGroup(allLanguages, memoqSymbol) {
		return allLanguages.find(lang => lang.memoq === memoqSymbol) ? allLanguages.find(lang => (
				lang.memoq === memoqSymbol)).group : memoqSymbol;
	}

	function findAllTargets(documents) {
		return documents.map(({ TargetLangCode, TotalWordCount }) => (
				{
					lang: findLanguageGroup(languages, TargetLangCode),
					wordcount: +TotalWordCount
				}
		));
	}

	function findIndustry(domain) {
		switch (domain) {
			case 'Poker':
			case 'eSport':
			case 'iGaming':
			case 'iGaming (Casino, Slot games, Gambling, etc.)':
			case 'Video Games':
				return 'iGaming';
			case 'CFDs and Online Trading':
			case 'ICOs & Cryptocurrency':
			case 'Finance':
				return 'Finance';
		}
	}
};

module.exports = { newLangReport };
