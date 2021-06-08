export const getIsAlert = state => state.isAlert;
export const getAlertMessage = state => state.alertMessage;
export const getAlertType = state => state.alertType;
export const getToken = state => state.token;
export const getRequestsCount = state => state.currentRequests;
export const getRequestQuoteDetails = state => state.requestQuoteDetails;
export const getAllProjects = state => state.projects;
export const getAllRequests = state => state.requests;
export const getAllServices = state => state.services;
export const getUserInfo = state => state.user;
export const getClientInfo = state => state.clientInfo;
export const getCombinations = state => state.clientLanguages;
export const getSelectedProject = state => state.selectedProject;
export const getOrderDetails = state => state.orderDetails;
export const getClientIndustries = state => state.clientInfo.industries;
export const clientSourceLanguages = state => state.clientInfo.sourceLanguages;
export const clientTargetLanguages = state => state.clientInfo.targetLanguages;
export const allLanguages = state => state.languages;
export const getPreviousLink = state => state.previousLink;
export const getClientRequests = state => state.clientRequests;
