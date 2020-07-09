import * as actions from './actions';
import * as getters from './getters';
import { mutations } from './mutations';

const state = {
    currentClient: {},
    clientDocuments: [],
}

export const clients = {
    state,
    actions,
    mutations,
    getters
}