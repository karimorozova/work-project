const { Units, Step } = require('../models');

async function insertStepsIntoUnits(step, stepId) {
  const { calculationUnit, ...stepData } = step;
  try {
    for (let { _id } of calculationUnit) {
      const unit = await Units.findOne({ _id });
      unit.steps.push({
        _id: stepId.toString(),
        ...stepData
      });
      await Units.updateOne({ _id }, unit, { upsert: true });
    }
  } catch (err) {
    console.log(err);
    console.log('Error in insertStepsIntoUnits');
  }
}

async function deleteStepsFromUnits(stepId) {
  try {
    const units = await Units.find();
    for (let unit of units) {
      const { steps } = unit;
      unit.steps = steps.filter(step => step._id !== stepId);
      await Units.updateOne({ _id: unit._id }, unit, { upsert: true });
    }
  } catch (err) {
    console.log(err);
    console.log('Error in deleteStepsFromUnits');
  }
}

async function changeStepsInUnits(stepToUpdate) {
  const { _id, ...step } = stepToUpdate;
  try {
    const units = await Units.find({ 'steps._id': _id });
    if (!step.calculationUnit.length) {
      await deleteStepsFromUnits(_id);
    }
    for (let { _id: id } of step.calculationUnit) {
      const redundantUnits = units.filter(item => item._id !== id);
      if (redundantUnits.length) {
        for (let unit of redundantUnits) {
          unit.steps = unit.steps.filter(step => step._id !== _id);
          await Units.updateOne({ _id: unit._id }, unit);
        }
      }
    }
    if (step.calculationUnit.length) {
      for (let { _id: id } of step.calculationUnit) {
        const unit = await Units.findOne({ _id: id });
        const isExists = unit.steps.find(item => item._id === _id);
        if (!isExists) {
          unit.steps.push({
            _id,
            title: step.title,
            symbol: step.symbol,
            isStage1: step.isStage1,
            isStage2: step.isStage2,
            isEditor: step.isEditor,
            isActive: step.isActive,
          });
        }
        await Units.updateOne({ _id: id }, unit);
      }
    }
    return await Step.updateOne({ _id }, step, { upsert: true });
  } catch (err) {
    console.log(err);
    console.log('Error in changeStepsInUnits');
  }
}

module.exports = { insertStepsIntoUnits, deleteStepsFromUnits, changeStepsInUnits };