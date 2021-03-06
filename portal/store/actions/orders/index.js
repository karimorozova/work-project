import { appendData } from "../../../utils/order";

export const setOrderDetails = ({commit}, payload) => {
    commit('SET_ORDER_DETAILS', payload);
}

export const setOrderDetail = ({commit}, payload) => {
    commit('SET_DETAIL', payload);
}

export const setOrderNestedDetail = ({commit}, payload) => {
    commit('SET_NESTED_DETAIL', payload);
}

export const removeFile = ({commit}, payload) => {
    commit('REMOVE_FILE', payload);
}

export const createWordsRequest = async function ({commit, dispatch, state}, payload) {
    let orderDetails = {...state.orderDetails,
        source: JSON.stringify(state.orderDetails.source),
        targets: JSON.stringify(state.orderDetails.targets),
        startDate: new Date(),
        customer: state.clientInfo._id,
        projectManager: state.clientInfo.projectManager._id,
        accountManager: state.clientInfo.accountManager._id,
        salesManager: state.clientInfo.salesManager._id,
        status: 'Requested',
        service: payload.service._id,
        serviceTitle: payload.service.title,
    }
    try {
        const details = appendData(orderDetails);
        const newRequest = await this.$axios.post('/portal/request', details);
        const requests = [...state.requests, newRequest.data];
        commit('SET_REQUESTS', requests);
    } catch(err) {
        dispatch('alertToggle', {message: err.message, isShow: true, type: "error"});
    }
}

export const createPackagesRequest = async function ({commit, dispatch, state}, payload) {
    let orderDetails = {...state.orderDetails,
        packageSize: JSON.stringify(state.orderDetails.packageSize),
        targets: JSON.stringify(state.orderDetails.targets),
        genBrief: JSON.stringify(state.orderDetails.genBrief),
        tones: JSON.stringify(state.orderDetails.tones),
        designs: state.orderDetails.designs ? JSON.stringify(state.orderDetails.designs) : "",
        startDate: new Date(),
        customer: state.clientInfo._id,
        projectManager: state.clientInfo.projectManager._id,
        accountManager: state.clientInfo.accountManager._id,
        salesManager: state.clientInfo.salesManager._id,
        status: 'Requested',
        service: payload.service._id,
        serviceTitle: payload.service.title
    }
    try {
        const details = appendData(orderDetails);
        const newRequest = await this.$axios.post('/portal/request', details);
        const requests = [...state.requests, newRequest.data];
        commit('SET_REQUESTS', requests);
    } catch(err) {
        dispatch('alertToggle', {message: err.message, isShow: true, type: "error"});
    }
}
