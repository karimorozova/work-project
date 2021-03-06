import Vue from 'vue';
import Vuex from 'vuex';
import state from "./state";
import * as actions from "./actions";
import * as mutations from "./mutations";
import * as getters from "./getters";

Vue.use(Vuex);

const store = () => new Vuex.Store({
  state,
  actions,
  mutations,
  getters
});

export default store
