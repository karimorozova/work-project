const { findFittingVendor } = require('../../сalculations/vendor');
export default {
	methods: {
		extendedVendors(index) {
			const allSteps = this.currentProject.steps;
			const industry = this.currentProject.industry;
			const step = index >= 0 ? allSteps[index] : this.step;
			const languages = this.originallyLanguages;
			const sourceLanguage = languages.find(item => item.symbol === step.sourceLanguage);
			const targetLanguage = languages.find(item => item.symbol === step.targetLanguage);
			const stepId = step.serviceStep.step;
			let vendors = this.vendors;

			return vendors

			filterVendorByNearStep(/(\sS01)/.exec(allSteps[index].stepId), 'last');
			filterVendorByNearStep(/(\sS02)/.exec(allSteps[index].stepId), 'first');

			return findFittingVendor(
					{
						sourceLanguage,
						targetLanguage,
						step: stepId,
						industry: industry._id
					}, vendors, true
			);

			function filterVendorByNearStep(isCurrentStep, neededStepIndex) {
				if(isCurrentStep !== null) {
					const currentSteps = allSteps.filter(item => item.taskId === allSteps[index].taskId);
					const currentStep = neededStepIndex === 'last' ? currentSteps[currentSteps.length - 1] : currentSteps[0];
					vendors = vendors.filter(item => currentStep.vendor !== null && currentStep.vendor.surname !== 'Agency' ? item._id.toString() !== currentStep.vendor._id.toString() : item);
				}
			}
		},
		isMainGroup() {
			return this.userGroup.name === 'Administrators' || this.userGroup.name === 'Developers';
		},
		checkForLanguagePair(vendor, index) {
			const step = index >= 0 ? this.allSteps[index] : this.step;
			const ratesProp = this.getRatesProp(step.serviceStep.calculationUnit);
			if(step.serviceStep.calculationUnit !== 'Packages') {
				return this.isVendorMatchesForDuoRate({ ratesProp, step, vendor });
			} else {
				return this.isVendorMatchesForMonoRate({ ratesProp, step, vendor });
			}
		},
		isVendorMatchesForDuoRate({ ratesProp, step, vendor }) {
			return vendor[ratesProp].find(item => {

				item.source == undefined ? item.source = { symbol: 'EN-GB' } : false

				if(item.source.symbol === step.sourceLanguage &&
						item.target.symbol === step.targetLanguage) {
					return this.hasRateValue({
						stepId: step.serviceStep._id,
						pair: item,
						stepIndustry: this.currentProject.industry._id
					});
				}
			})
		},
		isVendorMatchesForMonoRate({ ratesProp, step, vendor }) {
			return vendor[ratesProp].find(item => {
				if(item.packageSize === step.packageSize &&
						item.target.symbol === step.targetLanguage) {
					return this.hasRateValue({
						stepId: step.serviceStep._id,
						pair: item,
						stepIndustry: this.currentProject.industry._id
					});
				}
			})
		},
		getRatesProp(unit) {
			let prop = "monoRates";
			switch (unit) {
				case "Words":
					prop = "wordsRates";
					break;
				case "Hours":
					prop = "hoursRates";
			}
			return prop;
		},
		hasRateValue({ stepId, pair, stepIndustry }) {
			const index = pair.industries.findIndex(item => item._id === stepIndustry);
			if(index === -1) {
				return false;
			}
			return pair.rates[stepId];
		}
	}
}
