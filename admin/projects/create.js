const { Projects, Clients, CurrencyRatio, ClientRequest } = require('../models');
const { getProject } = require('./getProjects');
const { createTasksWithPackagesUnit } = require('./taskForPackages');
const { createTasksAndStepsForCustomUnits } = require('./taskForCommon');
const { storeFiles } = require('./files');
const { getModifiedFiles, createProjectFolder } = require('./helpers');
const { calculateCrossRate } = require('../helpers/commonFunctions')
const { storeRequestFilesForTasksAndSteps, getTaskCopiedFiles, getTaskCopiedFilesFromRequestToProject,  getClientRequestAfterUpdate, getClientRequestById} = require('../clientRequests')
const fs = require('fs')
const { createMemoqProjectWithTemplate, getProjectTranslationDocs } = require('../services/memoqs/projects')
const { addProjectFile } = require('../services/memoqs/files')
const { assignProjectManagers } = require('./updates')
const { createTasksForWordcount } = require('./taskForWordcount')
const { updateProjectMetricsAndCreateSteps } = require('./metrics')
const { updateProjectCosts } = require('../сalculations/wordcount')

const moment = require('moment');

async function createProject(project, user) {
  const { group: { name: role }, _id: roleId }  = user
  let todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  let todayEnd = new Date(todayStart);
  todayEnd.setUTCHours(23, 59, 59, 0);

  try {
    const { USD, GBP } = await CurrencyRatio.findOne();
    const { contacts, projectManager, accountManager, discounts, minPrice, currency } = await Clients.findOne({ '_id': project.customer }).populate('discounts');
    const todayProjects = await Projects.find({ startDate: { $gte: todayStart, $lte: todayEnd } });

    const currNumber = getNextProjectNumber(todayProjects)
    const projectNumber = currNumber < 9 ? "[0" + (currNumber + 1) + "]" : "[" + (currNumber + 1) + "]";

    project.status = project.status || "Draft";
    project.projectId = "Png " + moment(new Date()).format("YYYY MM DD") + " " + projectNumber;
    project.projectManager  = (role === 'Project Managers') ? roleId : projectManager._id
    project.accountManager = accountManager._id;
    project.paymentProfile = project.clientBillingInfo.paymentType;
    project.clientContacts = [contacts.find(({ leadContact }) => leadContact)];
    project.discounts = discounts;
    project.minimumCharge = { value: minPrice, toIgnore: false };
    project.crossRate = calculateCrossRate(USD, GBP);
    project.projectCurrency = currency;

    const createdProject = await Projects.create({
      ...project,
      startDate: new Date()
    });

    await createProjectFolder(createdProject.id);
    return await getProject({ _id: createdProject.id });

  } catch (err) {
    console.log(err);
    console.log("Error in createProject");
  }
}

const createProjectFromRequest = async (requestId) => {
  let todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  let todayEnd = new Date(todayStart)
  todayEnd.setUTCHours(23, 59, 59, 0)

  const request = await getClientRequestById(requestId)
  const { projectManager, accountManager, paymentProfile, clientContacts, projectName, clientBillingInfo, isUrgent, brief, notes, deadline, billingDate, industry, customer, createdBy } = request
  const { _id,  minPrice, currency } = customer
  const { discounts } = await Clients.findOne({ '_id': _id }).populate('discounts');

  const { USD, GBP } = await CurrencyRatio.findOne()
  const todayProjects = await Projects.find({ startDate: { $gte: todayStart, $lt: todayEnd } })

  const currNumber = getNextProjectNumber(todayProjects)
  const projectNumber = currNumber < 9 ? "[0" + (currNumber + 1) + "]" : "[" + (currNumber + 1) + "]";

  let project = {
    requestId: request._id,
    projectName,
    industry,
    customer,
    startDate: new Date(),
    deadline,
    billingDate,
    notes,
    brief,
    isUrgent,
    status: "Draft",
    projectId: "Png " + moment(new Date()).format("YYYY MM DD") + " " + projectNumber,
    projectManager,
    accountManager,
    clientBillingInfo,
    paymentProfile,
    clientContacts,
    discounts,
    minimumCharge: { value: minPrice, toIgnore: false },
    crossRate: calculateCrossRate(USD, GBP),
    projectCurrency: currency,
    createdBy,
  }

  const createdProject = await Projects.create({
    ...project
  })

  await createProjectFolder(createdProject.id)
  await ClientRequest.updateOne( { _id: requestId }, { status: 'Closed' } )
  return await getProject({ _id: createdProject.id })
}

const updateRequestTasks = async ({ tasksInfo, sourceFiles: sourceUploadFiles, refFiles: refUploadFiles }) => {
  const { requestId: _id, taskIdForUpdate } = tasksInfo
  const { projectId, tasksAndSteps } = await getClientRequestById(_id)
  for (let key of [ 'stepsAndUnits', 'stepsDates', 'service', 'source', 'targets' ]) {
    tasksInfo[key] = JSON.parse(tasksInfo[key])
  }
  const currIdx  = tasksAndSteps.findIndex(item => item.taskId === taskIdForUpdate)
  let { refFiles, sourceFiles } = tasksAndSteps[currIdx]

  const { targets, source, template, stepsAndUnits, workflow, stepsDates, service } = tasksInfo

  await setFiles(sourceUploadFiles, sourceFiles)
  await setFiles(refUploadFiles, refFiles)
  copyFiles(tasksInfo.sourceFilesVault, sourceFiles)
  copyFiles(tasksInfo.refFilesVault, refFiles)

  delete tasksInfo.refFilesVault
  delete tasksInfo.sourceFilesVault
  delete tasksInfo.requestId
  delete tasksInfo.taskIdForUpdate

  const tasksAndStepsForSave = {
    taskId: taskIdForUpdate,
    refFiles,
    sourceFiles,
    taskData: {
      targets,
      template,
      stepsAndUnits,
      workflow,
      stepsDates,
      service,
      source
    },
  }

  tasksAndSteps.splice(currIdx, 1, tasksAndStepsForSave)

  return await getClientRequestAfterUpdate({_id}, { tasksAndSteps })

  function copyFiles(key, arr) {
    if(key) arr.push(...getTaskCopiedFiles(_id, JSON.parse(key)))
  }
  async function setFiles(key, arr) {
    if(key) arr.push(...await storeRequestFilesForTasksAndSteps(key, _id))
  }
}

const createRequestTasks = async ({ tasksInfo, sourceFiles: sourceUploadFiles, refFiles: refUploadFiles }) => {
    const { requestId: _id } = tasksInfo
    const { projectId, tasksAndSteps } = await getClientRequestById(_id)
    for (let key of [ 'stepsAndUnits', 'stepsDates', 'service', 'source', 'targets' ]) {
      tasksInfo[key] = JSON.parse(tasksInfo[key])
    }

    const { targets, source, template, stepsAndUnits, workflow, stepsDates, service } = tasksInfo

    let [ refFiles, sourceFiles ] = [ [], [] ]
    copyFiles(tasksInfo.sourceFilesVault, sourceFiles)
    copyFiles(tasksInfo.refFilesVault, refFiles)
    await setFiles(sourceUploadFiles, sourceFiles)
    await setFiles(refUploadFiles, refFiles)

    delete tasksInfo.refFilesVault
    delete tasksInfo.sourceFilesVault
    delete tasksInfo.requestId

    let existingTasksIds = tasksAndSteps.map(item => item.taskId).map(item => /\d*$/ig.exec(item)[0]).map(item => {
      const [first, ...rest] = item;
      return +rest[0]
    })

  const id = !existingTasksIds.length ? 1 : req(1)
  const taskId = projectId +  `${id < 10 ? ` T0${id}` : ` T${id}`}`
  const tasksAndStepsForSave = {
      taskId,
      refFiles,
      sourceFiles,
      taskData: {
          targets,
          template,
          stepsAndUnits,
          workflow,
          stepsDates,
          service,
          source
        },
  }

    return await getClientRequestAfterUpdate({_id}, {
      $push: { "tasksAndSteps": tasksAndStepsForSave }
    })

    function req(num){
      if(existingTasksIds.includes(num)) return req(num+1)
      else return num
    }
    function copyFiles(key, arr) {
      if(key) arr.push(...getTaskCopiedFiles(_id, JSON.parse(key)))
    }
    async function setFiles(key, arr) {
      if(key) arr.push(...await storeRequestFilesForTasksAndSteps(key, _id))
    }
}

async function createTasks ({ tasksInfo, refFiles }) {
  try {
    const stepsAndUnits = JSON.parse(tasksInfo.stepsAndUnits);
    const stepsDates = JSON.parse(tasksInfo.stepsDates);
    const project = await getProject({ _id: tasksInfo.projectId });
    const taskRefFiles = await storeFiles(refFiles, tasksInfo.projectId);
    const allInfo = {
      ...tasksInfo,
      taskRefFiles,
      stepsAndUnits,
      stepsDates,
      project
    };

    if (stepsAndUnits.length === 2) {
      const onlyPackages = stepsAndUnits.every(({ unit }) => unit === "Packages");
      if (!onlyPackages) await createTasksAndStepsForCustomUnits(allInfo);
       else await createTasksWithPackagesUnit(allInfo);
    } else {
      const [{ unit }] = stepsAndUnits;
      if (unit !== "Packages") await createTasksAndStepsForCustomUnits(allInfo);
      else await createTasksWithPackagesUnit(allInfo);
    }

    return await getProject({ _id: tasksInfo.projectId });
  } catch (err) {
    console.log(err);
    console.log("Error in createTasks");
  }
}

const autoCreatingTaskInProject = async (project, requestId) => {
  try {
    const { tasksAndSteps, industry, customer } = await getClientRequestById(requestId)
    let iterator = 0
    for await (let { refFiles, sourceFiles, taskData } of tasksAndSteps){
      const { stepsAndUnits, stepsDates, workflow, service, source, targets: allTargets } = taskData

      for(let targets of allTargets ){
        const taskRefFiles = [
          ...await getTaskCopiedFilesFromRequestToProject(project._id, requestId, sourceFiles),
          ...await getTaskCopiedFilesFromRequestToProject(project._id, requestId, refFiles)
        ]
        const allInfo = {
          taskRefFiles,
          stepsAndUnits,
          stepsDates,
          workflow,
          service,
          source,
          targets: [targets],
          customerName: customer.name,
          projectName: project.projectName,
          projectId: project._id,
          industry: industry.name,
          projectManager: (project.projectManager._id).toString(),
          project
        }

        if (stepsAndUnits.length === 2) {
          const onlyPackages = stepsAndUnits.every(({ unit }) => unit === "Packages");
          if (!onlyPackages) await createTasksAndStepsForCustomUnits(allInfo, iterator);
          else await createTasksWithPackagesUnit(allInfo, iterator);
        } else {
          const [{ unit }] = stepsAndUnits;
          if (unit !== "Packages") await createTasksAndStepsForCustomUnits(allInfo, iterator);
          else await createTasksWithPackagesUnit(allInfo, iterator);
        }
        iterator++
      }
    }

    return await getProject({ _id: project._id });
  } catch (err) {
    console.log(err);
    console.log("Error in autoCreatingTaskInProject");
  }
}

function getNextProjectNumber(todayProjects){
  let currNumber = 0
  if(todayProjects.length){
    const pa = new RegExp(/(\[(?<num>\d.*)\])/)
    const lastProject = todayProjects[todayProjects.length - 1]
    const res = pa.exec(lastProject.projectId)
    if(res) currNumber = parseFloat(res.groups.num)
  }
  return currNumber
}

const manageMemoqProjectName = (projectId, projectName) => {
  projectName =  projectId + ' ' + projectName.replace(/( *[^\w\s\.]+ *)+/g, ' ').trim()
  if(!projectName.trim().length) projectName = "Png"
  if(Number.isInteger(+projectName.charAt(0))) projectName = 'Png ' + projectName
  return projectName
}

const autoCreatingTranslationTaskInProject = async (project, requestId, creatorUserForMemoqId) =>{
  const { projectName, projectId, _id } = project
  const { tasksAndSteps, industry, customer, projectManager } = await getClientRequestById(requestId)

  for await (let { refFiles, sourceFiles, taskData: { source, targets, template, service, stepsAndUnits, stepsDates } } of tasksAndSteps){
    const tasksInfo = {
      projectId: _id,
      memoqFiles: [],
      targets,
      source,
      service,
      stepsAndUnits,
      stepsDates,
      translateFiles: [ ...await getTaskCopiedFilesFromRequestToProject(project._id, requestId, sourceFiles) ],
      referenceFiles: [ ...await getTaskCopiedFilesFromRequestToProject(project._id, requestId, refFiles) ],
      memoqProjectId: await createMemoqProjectWithTemplate({
        customerName: customer.name,
        creatorUserId: creatorUserForMemoqId,
        industry: industry.name.replace('&', 'and'),
        projectName: manageMemoqProjectName(projectId, projectName),
        source,
        targets,
        template
      })
    }

    await assignProjectManagers({ manager: projectManager, memoqProjectId: tasksInfo.memoqProjectId });

    for await (let filePath of tasksInfo.translateFiles) {
      const addFileResult = await addProjectFile(tasksInfo.memoqProjectId, filePath)
      tasksInfo.memoqFiles.push({ name: filePath.split("/").pop(), fileGuid: addFileResult.data });
    }

    const listProjectTranslationDocuments = await getProjectTranslationDocs(tasksInfo.memoqProjectId);

    const tasks = await createTasksForWordcount(tasksInfo, listProjectTranslationDocuments);

    let updatedProject = await updateProjectMetricsAndCreateSteps(_id, tasks)

    updatedProject = await updateProjectCosts(updatedProject)
  }

}

module.exports = {
  autoCreatingTranslationTaskInProject,
  updateRequestTasks,
  createProject,
  createTasks,
  createRequestTasks,
  createProjectFromRequest,
  autoCreatingTaskInProject
};
