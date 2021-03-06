const { Projects } = require('../models')
const { getProject, updateProject } = require("./getProjects")
const { getProjectAnalysis } = require("../services/memoqs/projects")
const { setTaskMetrics } = require("../сalculations/wordcount")
const { getNewStepFinanceData, calculateProjectTotal, recalculateStepFinance } = require("../сalculations/finance")

async function createTasksForWordcount(tasksInfo) {
	const {
		source,
		targets,
		service,
		stepsAdditions,
		stepsAndUnits,
		projectId: _id,
		internalProjectId: projectId,
		refFiles,
		translateFiles,
		memoqProjectId,
		memoqFiles,
		docs
	} = tasksInfo

	const { tasks: projectsTasks, isSkipProgress, customer: { matrix } } = await getProject({ _id })
	const analysis = await tryToGetMemoqMetrics(memoqProjectId, undefined)

	const currTargets = targets.map(i => i.memoq)
	const memoqDocs = Array.isArray(docs)
			? docs.filter(({ TargetLangCode }) => currTargets.includes(TargetLangCode))
			: [ docs ]

	try {
		const tasks = await generateTasksForCATMemoqUnit({
			projectsTasks,
			projectId,
			source,
			targets,
			service,
			stepsAndUnits,
			refFiles,
			translateFiles,
			memoqFiles,
			memoqDocs,
			analysis,
			matrix,
			memoqProjectId,
			isSkipProgress
		})
		let { steps, additions } = await generateStepsForCATMemoqUnit({ tasks, stepsAdditions })
		await updateProject({ _id }, { $push: { tasks, steps, additionsSteps: additions } })
		await recalculateStepFinance(_id)
		return await calculateProjectTotal(_id)

	} catch (err) {
		console.log(err)
		console.log("Error in createTasksForWordcount")
	}

}

async function generateTasksForCATMemoqUnit(
		{ projectsTasks, projectId, source, targets, service, stepsAndUnits, refFiles, translateFiles, memoqFiles, memoqDocs, analysis, matrix, memoqProjectId, isSkipProgress }
) {
	const tasks = []
	let tasksLength = projectsTasks.length + 1

	for (const item of targets) {
		const idNumber = tasksLength < 10 ? `T0${ tasksLength }` : `T${ tasksLength }`
		const taskId = projectId + ` ${ idNumber }`

		let task = {
			projectId,
			taskId,
			service,
			stepsAndUnits,
			memoqSource: source.memoq,
			memoqTarget: item.memoq,
			sourceLanguage: source.symbol,
			targetLanguage: item.symbol,
			fullSourceLanguage: source,
			fullTargetLanguage: item,
			refFiles,
			sourceFiles: translateFiles,
			memoqFiles,
			memoqDocs: memoqDocs.filter(i => `${ i.TargetLangCode }` === `${ item.memoq }`),
			memoqProjectId,
			...(isSkipProgress && { status: 'Completed' })
		}

		task.metrics = getTaskMetrics({ task, matrix, analysis })

		tasks.push(task)
		tasksLength++
	}

	return tasks
}


async function generateStepsForCATMemoqUnit({ tasks, stepsAdditions }) {
	const steps = []
	const additions = []

	for (const task of tasks) {
		const {
			projectId,
			taskId,
			service,
			stepsAndUnits,
			memoqDocs,
			memoqSource,
			memoqTarget,
			sourceLanguage,
			targetLanguage,
			fullSourceLanguage,
			fullTargetLanguage,
			metrics,
			status
		} = task
		for (let i = 0; i < stepsAndUnits.length; i++) {

			const { finance, nativeFinance, defaultStepPrice, clientRate, vendorRate, nativeVendorRate } =
					await getNewStepFinanceData({
						projectId,
						fullSourceLanguage,
						fullTargetLanguage,
						metrics,
						step: stepsAndUnits[i].step,
						receivablesUnit: stepsAndUnits[i].receivables.unit,
						receivablesQuantity: 0,
						payablesQuantity: 0
					}, true)

			if (stepsAndUnits[i].hasOwnProperty('isReceivableVisible') && !stepsAndUnits[i].isReceivableVisible) {
				finance.Quantity.receivables = 0
				finance.Wordcount.receivables = 0
			}

			steps.push({
				stepNumber: i + 1,
				projectId,
				stepId: `${ taskId } ${ i + 1 < 10 ? `S0${ i + 1 }` : `S${ i + 1 }` }`,
				taskId,
				service,
				memoqDocIds: memoqDocs.map(({ DocumentGuid }) => DocumentGuid),
				step: stepsAndUnits[i].step,
				receivablesUnit: stepsAndUnits[i].receivables.unit,
				payablesUnit: stepsAndUnits[i].payables.unit,
				progress: setStepsProgress(service, memoqDocs),
				memoqSource,
				memoqTarget,
				sourceLanguage,
				targetLanguage,
				fullSourceLanguage,
				fullTargetLanguage,
				start: stepsAndUnits[i].start,
				deadline: stepsAndUnits[i].deadline,
				stepAndUnit: stepsAndUnits[i],
				isReceivableVisible: stepsAndUnits[i].isReceivableVisible,
				memoqAssignmentRole: i,
				finance,
				nativeFinance,
				defaultStepPrice,
				clientRate,
				vendorRate,
				nativeVendorRate,
				totalWords: metrics.totalWords,
				...(status && { status: 'Completed' })
			})
		}

		for (let i = 0; i < stepsAdditions.length; i++) {
			additions.push({
				taskId,
				projectId,
				title: stepsAdditions[i].title,
				finance: {
					Price: {
						receivables: stepsAdditions[i].value
					}
				}
			})
		}

	}
	return { steps, additions }
}

async function tryToGetMemoqMetrics(memoqProjectId, analysis) {
	return new Promise(async (resolve, reject) => {
		if (analysis) {
			resolve(analysis)
		} else {
			analysis = await getProjectAnalysis(memoqProjectId)
			setTimeout(async () => {
				resolve(await tryToGetMemoqMetrics(memoqProjectId, analysis))
			}, 400)
		}
	})
}

function getTaskMetrics({ task, matrix, analysis }) {
	const { AnalysisResultForLang } = analysis
	let targetMetrics = AnalysisResultForLang
	if (Array.isArray(AnalysisResultForLang)) targetMetrics = AnalysisResultForLang.find(({ TargetLangCode }) => TargetLangCode === task.memoqTarget)
	const { Summary } = targetMetrics

	const metrics = Object.keys(Summary).reduce((acc, cur) => {
		const { SourceWordCount } = Summary[cur]
		return cur !== 'Fragments' ? { ...acc, [cur]: +SourceWordCount } : acc
	}, {})

	const memoqFilledMetrics = getFilledMemoqMetrics(metrics)
	let taskMetrics = setTaskMetrics({ metrics: memoqFilledMetrics, matrix, prop: "client" })
	return { ...taskMetrics, totalWords: metrics.All }
}

function getFilledMemoqMetrics(metrics) {
	const { Hit50_74, Hit101, Hit100, NoMatch, Repetition, Hit75_84, Hit85_94, XTranslated, Hit95_99 } = metrics

	return {
		xTranslated: { text: "X translated", value: +XTranslated },
		repeat: { text: "Repetition", value: +Repetition },
		contextMatch: { text: "Context match", value: +Hit101 },
		repeat100: { text: "100%", value: +Hit100 },
		repeat50: { text: "50-74%", value: +Hit50_74 },
		repeat75: { text: "75-84%", value: +Hit75_84 },
		repeat85: { text: "85-94%", value: +Hit85_94 },
		repeat95: { text: "95-99%", value: +Hit95_99 },
		noMatch: { text: "No match", value: +NoMatch }
	}
}

function setStepsProgress(service, memoqDocs) {
	const { title } = service
	const prop = title === 'Translation' || title === 'Post-Editing' ? 'ConfirmedWordCount' : 'Reviewer1ConfirmedWordCount'

	const totalProgress = memoqDocs.reduce((acc, cur) => {
		acc.wordsDone = acc.wordsDone ? acc.wordsDone + +cur[prop] : +cur[prop]
		const { TotalWordCount } = cur
		acc.totalWordCount = acc.totalWordCount ? acc.totalWordCount + +TotalWordCount : +TotalWordCount
		return acc
	}, {})

	let stepProgress = {}
	for (let doc of memoqDocs) {
		const { DocumentGuid, TotalWordCount, DocumentName } = doc
		stepProgress[DocumentGuid] = {
			wordsDone: +doc[prop],
			totalWordCount: +TotalWordCount,
			fileName: DocumentName
		}
	}
	return { ...stepProgress, ...totalProgress }
}

module.exports = { createTasksForWordcount, getTaskMetrics }
