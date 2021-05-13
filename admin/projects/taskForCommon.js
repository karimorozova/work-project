const { updateProject } = require("./getProjects");
const { getFittingVendor, checkIsSameVendor } = require('../сalculations/vendor');
const { getStepFinanceData } = require('../сalculations/finance');
const { gatherServiceStepInfo, getFinanceForCustomUnits, getProjectFinance } = require('./helpers');
const ObjectId = require('mongodb').ObjectID;

/**
 *
 * @param {Object} allInfo
 * @returns {Object} - returns an updated project
 */
async function createTasksAndStepsForCustomUnits (allInfo) {
  const {
    project,
    stepsAndUnits,
  } = allInfo;
  try {
    const { customer: { _id: customer }, _id, industry, discounts, finance, projectId, minimumCharge } = project;
    let steps = [];
    let tasksWithoutFinanceOriginal = await getTasksForCustomUnits({
      ...allInfo,
      projectId,
    });

    let tasksWithoutFinance = JSON.parse(JSON.stringify(tasksWithoutFinanceOriginal))

    if (stepsAndUnits.length === 2) {
      steps = await getStepsForDuoUnits(
        { ...allInfo, customer, industry, tasks: tasksWithoutFinance, discounts });
    } else {
      steps = await getStepsForMonoUnits(
        { ...allInfo, customer, industry, tasks: tasksWithoutFinance, discounts });
    }
    steps = checkIsSameVendor(steps);

    const tasks = tasksWithoutFinanceOriginal.map(item =>
      getFinanceForCustomUnits(item, steps)
    );
    const { projectFinance, roi } = getProjectFinance(tasks, finance, minimumCharge);

    return await updateProject(
      { _id }, { finance: projectFinance, roi, $push: { tasks, steps } }
    );
  } catch (err) {
    console.log(err);
    console.log("Error in createTasksWithHoursUnit");
  }
}

/**
 *
 * @param {Object} tasksInfo
 * @returns {Array} - returns array of new tasks
 */
async function getTasksForCustomUnits (tasksInfo) {
  const {
    stepsAndUnits,
    projectId,
    service,
    targets,
    source,
    stepsDates,
    taskRefFiles,
  } = tasksInfo;
  let tasks = [];
  let tasksLength = tasksInfo.project.tasks.length + 1;
  for (let i = 0; i < targets.length; i++) {
    const idNumber = tasksLength < 10 ? `T0${tasksLength}` : `T${tasksLength}`;
    const taskId = projectId + ` ${idNumber}`;
    tasks.push({
      taskId,
      targetLanguage: targets[i].symbol,
      sourceLanguage: source.symbol,
      languageForm: service.languageForm,
      refFiles: taskRefFiles,
      service,
      stepsAndUnits,
      projectId,
      start: stepsDates[0].start,
      deadline: stepsDates[stepsDates.length - 1].deadline,
      finance: {
        Wordcount: { receivables: '', payables: '' },
        Price: { receivables: '', payables: '' }
      },
      status: 'Created'
    });
    tasksLength++;
  }
  return tasks;
}

/**
 *
 * @param {Object} allInfo
 * @returns {Array} - returns array of new steps
 */
async function getStepsForDuoUnits (allInfo) {
  const { tasks, stepsAndUnits, stepsDates, industry, customer, discounts, projectId } = allInfo;
  const steps = [];
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks.length > 1 ? tasks[i] : tasks[0];
    const firstStepIdCounter = i + 1 < 10 ? `S0${i + 1}` : `S${i + 1}`;
    const secondStepIdCounter = i + 2 < 10 ? `S0${i + 2}` : `S${i + 2}`;
    const firstStepId = `${task.taskId} ${firstStepIdCounter}`;
    const secondStepId = `${task.taskId} ${secondStepIdCounter}`;
    const firstServiceStep = stepsAndUnits[0];
    const secondServiceStep = stepsAndUnits[1];
    const firstStep = await createStepForTask(firstServiceStep, task, firstStepId);
    const secondStep = await createStepForTask(secondServiceStep, task, secondStepId);
    steps.push(firstStep, secondStep);
  }
  return steps;

  async function createStepForTask (serviceStep, task, stepId) {
    serviceStep = await gatherServiceStepInfo(serviceStep);
    const { title, step } = serviceStep;
    const stepName = title;
    const { sourceLanguage, targetLanguage } = task;
    const key = serviceStep.hasOwnProperty('quantity') ? 'quantity' : 'hours';
    const quantity = serviceStep[key];
    const vendorId = await getFittingVendor({ sourceLanguage, targetLanguage, step, industry });
    const { finance, clientRate, vendorRate, vendor, defaultStepPrice, nativeFinance, nativeVendorRate } = await getStepFinanceData({
      customer, industry, serviceStep, task, vendorId, quantity, discounts, projectId
    });
    return {
      ...task,
      stepId,
      serviceStep,
      name: stepName,
      start: stepsDates[0].start,
      deadline: stepsDates[0].deadline,
      [key]: quantity,
      size: serviceStep.size || 1,
      vendor: ObjectId(vendor),
      vendorRate,
      clientRate,
      finance,
      defaultStepPrice,
      progress: 0,
      // check: false,
      vendorsClickedOffer: [],
      isVendorRead: false,
      nativeFinance,
      nativeVendorRate,
    };
  }
}

/**
 *
 * @param {Object} allInfo
 * @param {Boolean}common
 * @returns {Array} - returns array of new steps
 */
async function getStepsForMonoUnits (allInfo, common = false) {
  let { tasks, stepsDates, industry, customer, discounts, projectId } = allInfo;
  const steps = [];
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    let { stepsAndUnits, sourceLanguage, targetLanguage } = task;
    !stepsAndUnits.hasOwnProperty('hours') || (stepsAndUnits[0].hours = 1);
    let serviceStep = stepsAndUnits.find(item => item.hours);
    serviceStep = await gatherServiceStepInfo(serviceStep);
    const { step, hours, size, title } = serviceStep;
    const stepName = title;
    const vendorId = await getFittingVendor({ sourceLanguage, targetLanguage, step, industry });
    const { finance, clientRate, vendorRate, vendor, defaultStepPrice, nativeFinance, nativeVendorRate } = await getStepFinanceData({
      customer, industry, serviceStep, task, vendorId, quantity: hours, discounts, projectId
    });
    steps.push({
      ...task,
      start: common ? stepsDates[1].start : stepsDates[0].start,
      deadline: common ? stepsDates[1].deadline : stepsDates[0].deadline,
      stepId: `${tasks[i].taskId} S01`,
      serviceStep,
      name: stepName,
      vendor: ObjectId(vendor),
      vendorRate,
      clientRate,
      hours,
      size: size || 1,
      finance,
      defaultStepPrice,
      progress: 0,
      // check: false,
      vendorsClickedOffer: [],
      isVendorRead: false,
      nativeFinance,
      nativeVendorRate,
    });
  }
  return steps;
}



module.exports = { createTasksAndStepsForCustomUnits, getStepsForDuoUnits, getTasksForCustomUnits };
