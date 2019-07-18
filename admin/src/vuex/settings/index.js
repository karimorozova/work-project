import * as actions from './actions';
import * as getters from './getters';
import { mutations } from './mutations';

const state = {
    steps: []
};

export const settings = {
    state,
    actions,
    mutations,
    getters
}