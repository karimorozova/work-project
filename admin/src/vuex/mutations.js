export const mutations = {
    LOGIN(state) {
        state.pending = true;
    },
    LOGIN_SUCCESS(state) {
        state.isLoggedIn = true;
        state.pending = false;
    },
    LOGOUT(state) {
        state.isLoggedIn = false;
    },
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
    servicesFill(state, payload) {
        state.services = payload
    },
    allProjects(state, payload) {
        state.projects = payload;
    },
    allCustomers(state, payload) {
        state.customers = payload
    },
    allXtmCustomers(state, payload) {
        state.xtmCustomers = payload
    },
    allVendors(state, payload) {
        state.vendors = payload
    },
    allLangs(state, payload) {
        state.languages = payload
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
    storeProjectValue(state, payload) {
        state.currentProject[payload.prop] = payload.value;
    },
    stepVendorStore(state, payload) {
        state.currentProject.steps[payload.index].vendor = payload.value;
    },
    stepDateStore(state, payload) {
        state.currentProject.steps[payload.index][payload.prop] = payload.value;
        if(payload.prop === 'deadline' && 
            state.currentProject.steps[payload.index].taskId === state.currentProject.steps[payload.index + 1].taskId) {
            state.currentProject.steps[payload.index + 1].start = payload.value;
        }
    },
    stepVendorDelete(state, payload) {
        state.currentProject.steps[payload.index].vendor = "";
    },
    updateMatrixData(state, payload) {
        const taskIndex = state.currentProject.tasks.findIndex(item => {
            return item.id === payload.taskId;
        })
        state.currentProject.tasks[taskIndex][payload.key] = payload.value;
    }
};