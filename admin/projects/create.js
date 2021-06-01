const { Projects, Clients, CurrencyRatio, ClientRequest } = require('../models');
const { getProject } = require('./getProjects');
const { createTasksWithPackagesUnit } = require('./taskForPackages');
const { createTasksAndStepsForCustomUnits } = require('./taskForCommon');
const { storeFiles } = require('./files');
const { getModifiedFiles, createProjectFolder } = require('./helpers');
const { calculateCrossRate } = require('../helpers/commonFunctions')
const { storeRequestFilesForTasksAndSteps, getTaskCopiedFiles,  getClientRequestAfterUpdate, getClientRequestById} = require('../clientRequests')
const fs = require('fs')

const moment = require('moment');


async function createProject(project, user) {
  const { group: { name: role }, _id: roleId }  = user
  let todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  let todayEnd = new Date(todayStart);
  todayEnd.setUTCHours(23, 59, 59, 0);

  try {
    const { USD, GBP } = await CurrencyRatio.findOne();
    const { contacts, billingInfo, projectManager, accountManager, discounts, minPrice, currency } = await Clients.findOne({ '_id': project.customer }).populate('discounts');
    const todayProjects = await Projects.find({ startDate: { $gte: todayStart, $lt: todayEnd } });
    const nextNumber = todayProjects.length < 10 ? "[0" + (todayProjects.length + 1) + "]" : "[" + (todayProjects.length + 1) + "]";

    project.status = project.status || "Draft";
    project.projectId = "Png " + moment(new Date()).format("YYYY MM DD") + " " + nextNumber;
    project.projectManager  = (role === 'Project Managers') ? roleId : projectManager._id
    project.accountManager = accountManager._id;
    project.paymentProfile = billingInfo.hasOwnProperty('paymentType') ? billingInfo.paymentType : '';
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

async function createRequestTasks({ tasksInfo, sourceFiles: sourceUploadFiles, refFiles: refUploadFiles }) {
  try {
    const { requestId: _id } = tasksInfo
    const { projectId, tasksAndSteps } = await getClientRequestById(_id)
    for (let key of [ 'stepsAndUnits', 'stepsDates', 'service', 'source', 'targets' ]) {
      tasksInfo[key] = JSON.parse(tasksInfo[key])
    }

    let [ refFiles, sourceFiles ] = [ [], [] ]
    if(tasksInfo.sourceFilesVault) sourceFiles.push(...getTaskCopiedFiles(_id, JSON.parse(tasksInfo.sourceFilesVault)))
    if(tasksInfo.refFilesVault) refFiles.push(...getTaskCopiedFiles(_id, JSON.parse(tasksInfo.refFilesVault)))

    if(sourceUploadFiles) sourceFiles.push(...await storeRequestFilesForTasksAndSteps(sourceUploadFiles, _id))
    if(refUploadFiles) refFiles.push(...await storeRequestFilesForTasksAndSteps(refUploadFiles, _id))

    delete tasksInfo.refFilesVault
    delete tasksInfo.sourceFilesVault
    delete tasksInfo.requestId

    const tasksAndStepsForSave = tasksInfo.targets.map(item => {
      delete tasksInfo.targets
      return {
        targets: [ item ],
        ...tasksInfo
      }
    }).map(item => {
      return {
        taskId: projectId + `${tasksAndSteps.length < 10 ? ` T0${tasksAndSteps.length + 1}` : ` T${tasksAndSteps.length + 1}`}`,
        taskData: { ...item, },
        refFiles,
        sourceFiles
      }
    })

    return await getClientRequestAfterUpdate({_id}, {
      $push: { "tasksAndSteps": tasksAndStepsForSave }
    })

  } catch (err) {
    console.log(err)
    console.log("Error in createTasks")
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
      const onlyPackages = stepsAndUnits.every(
        ({ unit }) => unit === "Packages"
      );
      if (!onlyPackages) {
        await createTasksAndStepsForCustomUnits(allInfo);
      } else {
        await createTasksWithPackagesUnit(allInfo);
      }
    } else {
      const [{ unit }] = stepsAndUnits;
      if (unit !== "Packages") {
        await createTasksAndStepsForCustomUnits(allInfo);
      } else {
        await createTasksWithPackagesUnit(allInfo);
      }
    }
    return await getProject({ _id: tasksInfo.projectId });
  } catch (err) {
    console.log(err);
    console.log("Error in createTasks");
  }
}


async function createTasksFromRequest ({ project, dataForTasks, isWords }) {
  // const stepsAndUnits = JSON.parse(dataForTasks.stepsAndUnits);
  // let newTasksInfo = { ...dataForTasks };
  // const sourceFiles = getModifiedFiles(project.sourceFiles);
  // const refFiles = getModifiedFiles(project.refFiles);
  // try {
  //   if (isWords) {
  //     newTasksInfo.translateFiles = await storeFiles(sourceFiles, project.id);
  //     newTasksInfo.referenceFiles = refFiles.length
  //       ? await storeFiles(refFiles, project.id)
  //       : [];
  //     return { project, newTasksInfo };
  //   } else {
  //     const taskRefFiles = await storeFiles(refFiles, project.id);
  //     const allInfo = { ...dataForTasks, taskRefFiles, project, stepsAndUnits };
  //     if (stepsAndUnits.length === 2) {
  //       const isOnlyPackages =
  //         stepsAndUnits[0].unit === "Packages" &&
  //         stepsAndUnits[1].unit === "Packages";
  //       if (!isOnlyPackages) {
  //         await createTasksAndStepsForCustomUnits(allInfo);
  //       } else {
  //         await createTasksWithPackagesUnit(allInfo);
  //       }
  //     } else {
  //       const isPackage = stepsAndUnits[0].unit === "Packages";
  //       if (!isPackage) {
  //         await createTasksAndStepsForCustomUnits(allInfo);
  //       } else {
  //         await createTasksWithPackagesUnit(allInfo);
  //       }
  //     }
  //   }
  //   return await getProject({ _id: project.projectId });
  // } catch (err) {
  //   console.log(err);
  //   console.log('Error in createTasksFromRequest');
  // }
}


module.exports = {
  createProject,
  createTasks,
  createTasksFromRequest,
  createRequestTasks
};
