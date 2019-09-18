const { Projects } = require("../models");
const { getProject, updateProject } = require("./getProjects");
const { storeFiles } = require("./files");
const { createNewXtmCustomer, saveTemplateTasks } = require("../services/xtmApi");
const { getFinanceDataForPackages } = require("../сalculations/packages");
const { getHoursStepFinanceData } = require("../сalculations/hours"); 
const moment = require("moment");

async function createProject(project) {
    let todayStart = new Date();
    todayStart.setUTCHours(0,0,0,0);
    let todayEnd = new Date(todayStart);
    todayEnd.setUTCHours(23,59,59,0);
    try {
        const todaysProjects = await Projects.find({"createdAt" : { $gte : todayStart, $lt: todayEnd }});
        const nextNumber = (todaysProjects.length < 10) ? '[0' + (todaysProjects.length + 1) + ']': '[' + (todaysProjects.length + 1) + ']';
        project.status = project.status || "Draft";
        project.projectId = moment(new Date()).format("YYYY MM DD") + ' ' + nextNumber;
        const createdProject = await Projects.create(project);
        return await getProject({"_id": createdProject.id});
    } catch(err) {
        console.log(err);
        console.log('Error in createProject');
    }
}

async function createTasks({tasksInfo, sourceFiles, refFiles}) {
    const { calculationUnit } = tasksInfo.service;
    try {
        if(calculationUnit === 'Words') {
            return await createTasksWithWordsUnit({tasksInfo, sourceFiles, refFiles});
        } else {
            const stepsDates = JSON.parse(tasksInfo.stepsDates);
            const project = await getProject({"_id": tasksInfo.projectId});
            const taskRefFiles = await storeFiles(refFiles, tasksInfo.projectId);
            const allInfo = {...tasksInfo, taskRefFiles, stepsDates, project};
            return calculationUnit === 'Hours' ? await createTasksWithHoursUnit(allInfo) : await createTasksWithPackagesUnit(allInfo);  
        }
    } catch(err) {
        console.log(err);
        console.log("Error in createTasks");
    }
}


/// Creating tasks for wordcount unit services start ///

async function createTasksWithWordsUnit({tasksInfo, sourceFiles, refFiles}) {
    let newTasksInfo = {...tasksInfo};
    newTasksInfo.stepsDates = tasksInfo.stepsDates ? JSON.parse(tasksInfo.stepsDates) : [];
    newTasksInfo.template = tasksInfo.template || '247336FD';
    newTasksInfo.workflow = tasksInfo.workflow || 2917;
    try {
        newTasksInfo.customerId = tasksInfo.customerId || await createNewXtmCustomer(tasksInfo.customerName);
        newTasksInfo.filesToTranslate = sourceFiles && sourceFiles.length ? await storeFiles(sourceFiles, tasksInfo.projectId): [];
        newTasksInfo.referenceFiles = refFiles && refFiles.length ? await storeFiles(refFiles, tasksInfo.projectId) : [];
        const project = await Projects.findOne({"_id": tasksInfo.projectId});
        await addTasksToXtm({newTasksInfo, project});
        return await getProject({"_id": newTasksInfo.projectId});
    } catch(err) {
        console.log(err);
        console.log("Error in createTasksWithWordsUnit");
    }
}

async function addTasksToXtm({newTasksInfo, project}) {
    try {
        let tasksLength = project.tasks.length + 1;
        for(let target of newTasksInfo.targets) {
            let name = `${project.projectId} - ${project.projectName} (${target.xtm.toUpperCase()})`
            let xtmProject = await saveTemplateTasks({
                customerId: newTasksInfo.customerId,
                name: name,
                source: newTasksInfo.source.xtm,
                target: target.xtm,
                sourceFiles: newTasksInfo.filesToTranslate,
                refFiels: newTasksInfo.referenceFiles,
                templateId: newTasksInfo.template,
                workflowId: newTasksInfo.workflow,
                join: newTasksInfo.join
            });
            xtmProject = JSON.parse(xtmProject);
            let idNumber = tasksLength < 10 ? `T0${tasksLength}` : `T${tasksLength}`; 
            let taskId = project.projectId + ` ${idNumber}`;
            await updateProjectTasks({newTasksInfo, project, xtmProject, taskId, target})
            tasksLength++
        }
    } catch(err) {
        console.log(err);
        console.log("Error in addTasksToXtm");
    }
}

async function updateProjectTasks({newTasksInfo, project, xtmProject, taskId, target}) {
    try {
        await Projects.updateOne({"_id": project._id}, 
            {$set: {sourceFiles: newTasksInfo.filesToTranslate, refFiles: newTasksInfo.referenceFiles, isMetricsExist: false}, 
            $push: {tasks: {taskId: taskId, xtmJobs: xtmProject.jobs, service: newTasksInfo.service, projectId: xtmProject.projectId, 
                start: project.createdAt, deadline: project.deadline, stepsDates: newTasksInfo.stepsDates, sourceLanguage: newTasksInfo.source.symbol, targetLanguage: target.symbol, 
                status: "Created", cost: "", sourceFiles: newTasksInfo.filesToTranslate, refFiles: newTasksInfo.referenceFiles, check: false, 
                finance: {'Wordcount': {receivables: 0, payables: 0}, 'Price': {receivables: 0, payables: 0}}}}}
            );
    } catch(err) {
        console.log(err);
        console.log("Error in updateProjectTasks");
    }
}

/// Creating tasks for wordcount unit services end ///

/// Creating tasks for hours unit services start ///

async function createTasksWithHoursUnit(allInfo) {
    const { project } = allInfo;
    try {
        let tasksWithoutFinance = getTasksForHours({...allInfo, projectId: project.projectId});
        const steps = await getStepsForHours({...allInfo, tasks: tasksWithoutFinance});
        const tasks = tasksWithoutFinance.map(item => getHoursTaskWithFinance(item, steps));
        const projectFinance = getProjectFinance(tasks, project.finance); 
        return updateProject({"_id": project.id}, { finance: projectFinance, $push: {tasks: tasks, steps: steps} });
    } catch(err) {
        console.log(err);
        console.log("Error in createTasksWithHoursUnit");
    }
}

function getHoursTaskWithFinance(task, steps) {
    const taskSteps = steps.filter(item => item.taskId === task.taskId);
    const receivables = +taskSteps.reduce((acc, cur) => {
        acc += +cur.finance.Price.receivables;
        return acc;
    }, 0).toFixed(2)
    const payables = +taskSteps.reduce((acc, cur) => {
        acc += +cur.finance.Price.payables;
        return acc;
    }, 0).toFixed(2)
    return {...task, 
        finance: {Price: {receivables, payables}, Wordcount: {receivables: "", payables: ""}}
    }
}

function getTasksForHours(tasksInfo) {
    const { projectId, service, targets, source, stepsDates, taskRefFiles } = tasksInfo;
    let tasks = [];
    for(let i = 0; i < targets.length; i++) {
        const idNumber = i+1 < 10 ? `T0${i+1}` : `T${i+1}`; 
        const taskId = projectId + ` ${idNumber}`;
        tasks.push({
            taskId,
            targetLanguage: targets[i].symbol,
            sourceLanguage: source.symbol,
            refFiles: taskRefFiles,
            service,
            projectId,
            start: stepsDates[0].start,
            deadline: stepsDates[stepsDates.length-1].deadline,
            status: 'Created'
        })
    }
    return tasks;
}

async function getStepsForHours(stepsInfo) {
    const { tasks } = stepsInfo;
    try {
        const steps = await Promise.all(tasks.map(item => {
            return getHoursTaskSteps(item, stepsInfo);
        }))
        return steps.reduce((acc, cur) => {
            acc.push(...cur);
            return acc;
        }, [])
    } catch(err) {
        console.log(err);
        console.log("Error in getStepsForHours");
    }
}

async function getHoursTaskSteps(task, stepsInfo) {
    let steps = [];
    try {
        for(let i = 0; i < stepsInfo.stepsDates.length; i++) {
            const stepsIdCounter = i+1 < 10 ? `S0${i+1}` : `S${i+1}`;
            const serviceStep = task.service.steps[i].step;
            const hours = +stepsInfo[`${serviceStep.symbol}-hours`];
            const quantity = +stepsInfo[`${serviceStep.symbol}-quantity`];
            const financeData = await getHoursStepFinanceData({
                task, serviceStep, project: stepsInfo.project, multiplier: hours*quantity
            });
            steps.push({
                ...task,
                stepId: `${task.taskId} ${stepsIdCounter}`,
                serviceStep,
                name: task.service.steps[i].step.title,
                start: stepsInfo.stepsDates[i].start,
                deadline: stepsInfo.stepsDates[i].deadline,
                hours,
                quantity,
                vendor: financeData.vendor,
                vendorRate: financeData.vendorRate,
                clientRate: financeData.clientRate,
                finance: {
                    Price: {receivables: financeData.receivables, payables: financeData.payables},
                    Wordcount: {receivables: "", payables: ""}},
                progress: 0,
                check: false,
                vendorsClickedOffer: [],
                isVendorRead: false
            })
        }
        return steps;
    } catch(err) {
        console.log(err);
        console.log("Error in getHoursTaskSteps");
    }
}

/// Creating tasks for wordcount unit services end ///

/// Creating tasks for packages unit services start ///

async function createTasksWithPackagesUnit(allInfo) {
    const { project, service, targets, packageSize } = allInfo;
    try {
        const {vendor, vendorRate, clientRate, payables, receivables} = await getFinanceDataForPackages({project, service, packageSize, target: targets[0]});
        const finance = {Wordcount: {receivables: "", payables: ""}, Price: {receivables, payables}};
        const tasks = getTasksForPackages({...allInfo, projectId: project.projectId, finance});
        const steps = getStepsForPackages({tasks, vendor, vendorRate, clientRate});
        const projectFinance = getProjectFinance(tasks, project.finance);
        return updateProject({"_id": project.id}, { finance: projectFinance, $push: {tasks: tasks, steps: steps} });
    } catch(err) {
        console.log(err);
        console.log("Error in createTasksWithPackagesUnit");
    }
}

function getTasksForPackages(tasksInfo) {
    const { projectId, service, targets, packageSize, quantity, stepsDates, taskRefFiles, finance } = tasksInfo;
    let tasks = [];
    for(let i = 0; i < quantity; i++) {
        const idNumber = i+1 < 10 ? `T0${i+1}` : `T${i+1}`; 
        const taskId = projectId + ` ${idNumber}`;
        tasks.push({
            taskId,
            targetLanguage: targets[0].symbol,
            packageSize,
            refFiles: taskRefFiles,
            service,
            projectId,
            start: stepsDates[0].start,
            deadline: stepsDates[0].deadline,
            finance,
            status: 'Created'
        })
    }
    return tasks;
}

function getStepsForPackages({tasks, vendor, vendorRate, clientRate}) {
    let counter = 1;
    return tasks.reduce((acc, cur) => {
        const stepsIdCounter = counter < 10 ? `S0${counter}` : `S${counter}`;
        acc.push({
            ...cur,
            stepId: `${cur.taskId} ${stepsIdCounter}`,
            serviceStep: cur.service.steps[0].step,
            name: cur.service.steps[0].step.title,
            vendor,
            progress: 0,
            clientRate,
            vendorRate,
            check: false,
            vendorsClickedOffer: [],
            isVendorRead: false
        })
        return [...acc];
    }, [])
}

/// Creating tasks for packages unit services end ///


function getProjectFinance(tasks, projectFinance) {
    const currentReceivables = projectFinance.Price.receivables || 0;
    const currentPayables = projectFinance.Price.payables || 0;
    const receivables = tasks.reduce((acc,cur) => acc + cur.finance.Price.receivables, 0) + currentReceivables;
    const payables = tasks.reduce((acc,cur) => acc + cur.finance.Price.payables, 0) + currentPayables;
    return {
        Price: {receivables, payables},
        Wordcount: {...projectFinance.Wordcount}
    }
}

module.exports = { createProject, createTasks }