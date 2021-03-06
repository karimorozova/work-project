export const mutations = {
    startRequest(state) {
        state.requestCounter++
    },
    endRequest(state) {
       state.requestCounter-- 
    },
    loadingValue(state, payload) {
        state.isLoading = payload;
    },
    alertingMessage(state, payload) {
        state.alertMessage = payload.message;
        state.isAlert = payload.isShow;
        state.alertType = payload.type;
    },
    setLoggedUser(state, payload) {
        state.user = payload;
    },
    servicesFill(state, payload) {
        state.services = payload
    },
    allProjects(state, payload) {
        state.projects = payload;
    },
    allCustomers(state, payload) {
        state.customers = payload
    },
    allVendors(state, payload) {
        state.vendors = payload.sort((a, b) => {
            return a.firstName > b.firstName;
        })
    },
    // allVendorsForProject(state, payload) {
    //     state.vendorsForProject = payload.sort((a, b) => {
    //         return a.firstName > b.firstName;
    //     })
    // },
    allLangs(state, payload) {
        state.languages = payload.sort((a, b) => {
            return a.lang > b.lang;
        })
    },
    allIndustries(state, payload) {
        state.industries = payload
    },
    allSteps(state, payload) {
        state.steps = payload
    },
    allUnits(state, payload) {
        state.units = payload
    },
    allServices(state, payload) {
        state.services = payload
    },
    allUsers(state, payload) {
        state.users = payload
    },
    customerlangs(state, payload) {
        state.clientLangs = payload
    },
    duoRatesFill(state, payload) {
        state.duoRates = payload
    },
    storeCurrentProject(state, payload) {
        state.currentProject = payload
    },
    // storeVendorsForOptions(state, payload) {
    //     state.vendorsForOptions = payload
    // },
    // storeClientsForOptions(state, payload) {
    //     state.clientsForOptions = payload
    // },
    storeProjectProp(state, payload) {
        const {prop, value} = payload;
        state.currentProject = {...state.currentProject, [prop]: value}
    },
    // stepDateStore(state, payload) {
    //     state.currentProject = { ...state.currentProject, steps };
    // },
    stepVendorDelete(state, payload) {
        state.currentProject.steps[payload.index].vendor = "";
    },
    updateMatrixData(state, payload) {
        const taskIndex = state.currentProject.tasks.findIndex(item => {
            return item.taskId === payload.taskId;
        })
        state.currentProject.tasks[taskIndex][payload.key] = payload.value;
    }
};