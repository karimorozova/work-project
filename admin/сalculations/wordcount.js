const { getVendors } = require('../vendors/getVendors');
const { getClient } = require('../clients/getClients');
const { updateProject } = require('../projects/getProjects');
const { hasActiveRateValue } = require('./general');

function setTaskMetrics({metrics, matrix, prop}) {
    let taskMetrics = {...metrics};
    for(let key in matrix) {
        taskMetrics[key][prop] = matrix[key].rate;
    }
    return taskMetrics;
}

async function receivablesCalc({task, project, step}) {
    try {
        if(step.serviceStep.symbol !== "translation") {
            const { cost, rate } = await calcProofingStep({step, task, project, words: task.metrics.totalWords});
            return {cost, rate};
        } 
        const metrics = task.metrics;
        const rate = await getCustomerRate({step, industryId: project.industry.id, customerId: project.customer.id, task});;
        const cost = calcCost(metrics, 'client', rate).toFixed(2);
        return { cost: +cost, rate };
    } catch(err) {
        console.log(err);
        console.log("Error in receivablesCalc");
    }
}

async function getAfterWordcountPayablesUpdated({project, step}) {
    try {
        let { tasks, steps } = project;
        const taskIndex = tasks.findIndex(item => item.taskId == step.taskId);
        const stepIndex = steps.findIndex(item => item.taskId == step.taskId && item.stepId === step.stepId);
        if(steps[stepIndex].serviceStep.symbol === 'translation') {
            tasks[taskIndex].metrics = setTaskMetrics({metrics: tasks[taskIndex].metrics, matrix: step.vendor.matrix, prop: 'vendor'});
        }
        steps[stepIndex] = payablesCalc({metrics: tasks[taskIndex].metrics, project, step});
        const taskSteps = steps.filter(item => item.taskId === tasks[taskIndex].taskId && item.finance.Wordcount.payables);
        tasks[taskIndex].finance.Price.payables = +(taskSteps.reduce((acc, cur) => acc + +cur.finance.Price.payables, 0).toFixed(2));
        tasks[taskIndex].finance.Wordcount.payables = taskSteps.reduce((acc, cur) => acc + +cur.finance.Wordcount.payables, 0);
        return await updateProjectCosts({...project._doc, id: project.id, tasks, steps});
      } catch(err) {
        console.log(err);
        console.log('Error in getAfterWordcountPayablesUpdated');
      }
}

function payablesCalc({metrics, project, step}) {
    try {
        const rate = getRate({step, project});
        return getStepPayables({rate, metrics, step});
    } catch(err) {
        console.log(err);
        console.log("Error in payablesCalc");
    }
}

function getStepPayables({rate, metrics, step}) {
    let { finance } = step;
    const rateValue = rate ? rate.value : 0; 
    const payables = step.serviceStep.symbol !== "translation" ? 
        +(metrics.totalWords*rateValue) : calcCost(metrics, 'vendor', rate);
    finance.Price.payables = +(payables.toFixed(2));
    finance.Wordcount.payables = step.serviceStep.symbol !== "translation" ? +metrics.totalWords : calculatePayableWords(metrics);
    return {...step, finance, vendorRate: rate};
}

function calculatePayableWords(metrics) {
    const payables = Object.keys(metrics).filter(item => item !== "totalWords")
        .reduce((acc, cur) => {
            return acc + metrics[cur].value*metrics[cur].vendor;
        }, 0);
    return Math.round(payables);
}

function getRate({step, project}) {
    try {
        const comb = getCombination({combs: step.vendor.wordsRates, step, industryId: project.industry.id});
        const rate = comb ? comb.rates[step.serviceStep._id] : "";
        return rate || "";
    } catch(err) {
        console.log(err);
        console.log("Error in getRate");
    }
}

function calcCost(metrics, field, rate) {
    let cost = 0;
    let wordsSum = 0;
    const rateValue = rate ? rate.value : 0;
    for(let key in metrics) {
        if(key !== 'totalWords') {
            cost+= metrics[key].value*metrics[key][field]*rateValue;
            wordsSum += metrics[key].value;
        }
    }
    cost += (metrics.totalWords - wordsSum)*rateValue;
    if(rate && cost < rate.min) {
        cost = rate.min;
    }
    return cost;
}

async function getCustomerRate({step, industryId, customerId}) {
    try {
        const customer = await getClient({"_id": customerId});
        const comb = getCombination({combs: customer.wordsRates, step, industryId});
        const rate = comb ? comb.rates[step.serviceStep._id] : "";
        const customerRate = rate || "";
        return customerRate;
    } catch(err) {
        console.log(err);
        console.log("Error in getCustomerRate");
    }
}

function getCombination({combs, step, industryId}) {
    const filtered = combs.filter(item => {
        if(step.serviceStep.calcualtionUnit !== 'Packages') {
        return item.source.symbol === step.sourceLanguage &&
                    item.target.symbol === step.targetLanguage
        }
        return item.target.symbol === step.targetLanguage &&
        item.packageSize === step.packageSize
    })
    return filtered.find(item => {
        const index = item.industries.findIndex(indus => indus.id === industryId || indus._id === industryId);
        return index !== -1;
    })
}

async function calcProofingStep({step, task, project, words}) {
    try {
        const rate = await getCustomerRate({task, step, industryId: project.industry.id, customerId: project.customer.id});
        let cost = 0;
        if(rate) {
            const value = +(words*rate.value).toFixed(2);
            cost = rate.min && value < rate.min ? rate.min : value;
        }
        return { cost, rate }
    } catch(err) {
        console.log(err);
        console.log('Error in calcProofingStep');
    }
}

async function setDefaultStepVendors(project) {
    try {
        let { steps, tasks } = project;
        const activeVendors = await getVendors({status: 'Active'});
        for(let i = 0; i < steps.length; i++) {
            if(steps[i].serviceStep.calculationUnit === 'Words' && !steps[i].vendor) {
                let taskIndex = tasks.findIndex(item => item.taskId === steps[i].taskId);
                let matchedVendors = getMatchedVendors({activeVendors, steps, index: i, project});
                if(matchedVendors.length === 1) {
                    steps[i].vendor = matchedVendors[0];
                    tasks[taskIndex].metrics = steps[i].serviceStep.symbol !== "translation" ? tasks[taskIndex].metrics
                        : setTaskMetrics({metrics: tasks[taskIndex].metrics, matrix: matchedVendors[0].matrix, prop: 'vendor'});          
                    steps[i] = payablesCalc({metrics: tasks[taskIndex].metrics, project, step: steps[i]._doc});
                    tasks[taskIndex].finance.Price.payables = +(tasks[taskIndex].finance.Price.payables+steps[i].finance.Price.payables).toFixed(2);
                    const taskSteps = steps.filter(item => item.taskId === tasks[taskIndex].taskId && item.finance.Wordcount.payables);
                    tasks[taskIndex].finance.Wordcount.payables = taskSteps.reduce((acc, cur) => acc + +cur.finance.Wordcount.payables, 0);
                }
            }
        }
        return { steps, tasks };
    } catch(err) {
        console.log(err);
        console.log("Error in setDefaultStepVendors");
    }
}

function getMatchedVendors({activeVendors, steps, index, project}) {
    const step = steps[index];
    let availableVendors = [...activeVendors];
    if(index > 0 && step.taskId === steps[index-1].taskId) {
        availableVendors = availableVendors.filter(item => {
            if(steps[index-1].vendor) {
                return item.id !== steps[index-1].vendor.id;
            }
            return item;
        })
    }
    let matchedVendors = [];
    for(let vendor of availableVendors) {
        const isMatching = checkForLanguages({vendor, step, project});
        if(isMatching) {
            matchedVendors.push(vendor);
        }
    }
    return matchedVendors;
}

function checkForLanguages({vendor, step, project}) {
    return vendor.wordsRates.find(item => {
        if(item.source && item.source.symbol === step.sourceLanguage && 
            item.target.symbol === step.targetLanguage) {
                return hasActiveRateValue({
                        step, 
                        pair: item, 
                        stepIndustry: project.industry.id
                    });
        }
    })
}

async function updateProjectCosts(project) {
    let finance = {
        Wordcount: getProjectFinanceData(project, "Wordcount"),
        Price: getProjectFinanceData(project, "Price")
    };
    let discount = {};
    if(project.finance.Discount) {
        discount = {...project.finance.Discount};
        discount.receivables = (receivables/100*discount.value).toFixed(2);
        finance.Price.receivables -= discount.receivables;
        finance.Discount = discount;
    }
    try {
        return await updateProject({"_id": project.id}, { ...project, finance });
    } catch(err) {
        console.log(err);
        console.log("Error in updateProjectCosts");
    }
}

function getProjectFinanceData(project, prop) {
    return project.tasks.reduce((acc, cur) => {
        acc.receivables = acc.receivables ? +(acc.receivables + +cur.finance[prop].receivables).toFixed(2) : +cur.finance[prop].receivables;
        acc.payables = acc.payables ? +(acc.payables + +cur.finance[prop].payables).toFixed(2) : +cur.finance[prop].payables;
        return acc;
    },{})
}

module.exports = { receivablesCalc, payablesCalc, setDefaultStepVendors, 
    updateProjectCosts, calcCost, setTaskMetrics, getAfterWordcountPayablesUpdated };