import { setApplicationData, SET_VENDOR, SET_NEW_PASSWORD,
        SET_CONFIRMED_PASSWORD, SET_ACCOUNT_INFO, SET_ACCOUNT_PROP,
        SET_JOBS, SELECT_JOB } from './set';
import { SET_APPLICATION_DATA } from '../../mutation-types';

export default {
    [SET_APPLICATION_DATA]: setApplicationData,
    SET_VENDOR,
    SET_NEW_PASSWORD,
    SET_CONFIRMED_PASSWORD,
    SET_ACCOUNT_INFO,
    SET_ACCOUNT_PROP,
    SET_JOBS,
    SELECT_JOB
}