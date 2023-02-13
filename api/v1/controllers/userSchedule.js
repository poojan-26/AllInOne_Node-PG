const userScheduleHelper = require('../helpers/userScheduleHelper')
const userScheduleValidator = require('../validators/userScheduleValidator')
const responseHelper = require('../../utils/responseHelper')
const config = require('../../utils/config')

/**
 * This UserSchedule class contains all vehicle wash related APIs.
 */

class UserSchedule {
    /**
     * API for listing upcoming and latest completed vehicle wash services
     * @returns success response(status code 200) with upcoming and latest completed vehicle wash services
     */
    async getUserVehicleWashList(req, res) {
        try {
            await userScheduleValidator.validateGetUserVehicleWashListAPI(req.body)
            let userSheduleList = await userScheduleHelper.getUserVehicleWashList(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_WASH_LIST_SUCCESS', req.headers.language, userSheduleList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    // async addExecutiveInteriorTimeSlots(req, res) {
    //     try {
    //         await userScheduleHelper.addExecutiveInteriorTimeSlots()
    //         responseHelper.success(res, 'ADD_EXECUTIVE_INTERIOR_SLOTS', req.headers.language)
    //     } catch (error) {
    //         console.log(error)
    //         responseHelper.error(res, error, req.headers.language)
    //     }
    // }
    /**
     * API for retrieving available time slots for interior car wash building wise
     * @param {number} building_id building id
     * @param {string} date interior car wash date
     * @returns success response(status code 200) with all time slots on particular date with availavle and not available status
     */
    async getInteriorTimeSlots(req, res) {
        try {
            await userScheduleValidator.validateGetInteriorTimeSlotsAPI(req.body)
            let final_time_slots = await userScheduleHelper.getInteriorTimeSlots(req.body)
            responseHelper.success(res, 'GET_INTERIOR_TIME_SLOTS_SUCCESS', req.headers.language, final_time_slots)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for scheduling available time slot on particular date for interior car wash
     * @param {number} building_id building id
     * @param {number} vehicle_id vehicle id
     * @param {string} vehicle_wash_date date
     * @param {string} interior_time_slot time slot
     * @param {number} vehicle_wash_id vehicle wash id is_reschedule
     * @param {number} is_reschedule 1: for rescheduling 2: for first time scheduling
     * @returns success response(status code 200) by scheduling time slot on particular date for interior car wash
     */
    async setInteriorTimeSlot(req, res) {
        try {
            await userScheduleValidator.validateSetInteriorTimeSlotAPI(req.body)
            await userScheduleHelper.setInteriorTimeSlot(req.body)
            responseHelper.success(res, 'SET_INTERIOR_TIME_SLOT_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for cancelling interior wash schedule
     * @param {number} vehicle_wash_id vehicle wash id is_reschedule
     * @returns success response(status code 200) by cancelling interior wash schedule
     */
    async cancelInteriorWash(req, res) {
        try {
            await userScheduleValidator.validateCancelInteriorWashAPI(req.body)
            await userScheduleHelper.cancelInteriorWash(req.body)
            responseHelper.success(res, 'CANCEL_INTERIOR_WASH_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for listing vehicle wash history
     * @param {number} page_no page no
     * @param {string} vehicle_wash_date date (filter by date wise)
     * @returns success response(status code 200) by listing vehicle wash history pagination wise or date wise
     */
    async getUserVehicleWashHistoryList(req, res) {
        try {
            await userScheduleValidator.validateGetUserVehicleWashHistoryListAPI(req.body)
            let userSheduleList = await userScheduleHelper.getUserVehicleWashHistoryList(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_WASH_HISTORY_SUCCESS', req.headers.language, { total: Number(userSheduleList.userScheduleHistoryCount), total_page: Math.ceil(userSheduleList.userScheduleHistoryCount / config.paginationCount), userScheduleHistory: userSheduleList.userScheduleHistory })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving details of particular vehicle wash with prewash, postwash and promotions images
     * @param {number} vehicle_wash_id vehicle wash id
     * @returns success response(status code 200) with vehicle wash details
     */
    async getUserVehicleWashDetail(req, res) {
        try {
            await userScheduleValidator.validateGetUserVehicleWashDetailAPI(req.body)
            let userSheduleList = await userScheduleHelper.getUserVehicleWashDetail(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_WASH_DETAIL_SUCCESS', req.headers.language, userSheduleList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for showing summary of all plans details vehicle wise before purchase
     * @returns success response(status code 200) with summary of vehicle and selected plans before purchase
     */
    async getUserSummary(req, res) {
        try {
            await userScheduleValidator.validateGetUserSummaryAPI(req.body)
            let userSheduleList = await userScheduleHelper.getUserSummary(req.body, req.headers.language)
            responseHelper.success(res, 'GET_SUMMARY_SUCCESS', req.headers.language, userSheduleList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    } 
    /**
     * API helps in finding the customers vehicle list and assign them based on the type
     * @return inserts the job detail in the table , building wise     * 
     */
    async setActiveCarsListWeekly(req, res) {
        try {
            let userSheduleList = await userScheduleHelper.setActiveCarsListWeekly(req.body)
            // let userSheduleList = await userScheduleHelper.scheduleExecutiveToUserVehicleRelation(req.body)

            responseHelper.success(res, 'GET_ALL_USER_SUCCESS', req.headers.language, userSheduleList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API helps in inserting Live active subscriber and executive. Here we assign the Executive to the building and vehicles
     * @return it gives how many executive is allocated and what jobs are assigned to them (if flag = 0 then its for allocate to the current week) 
     */
    async scheduleExecutiveToUserVehicleRelation(req, res) {
        try {
            let userSheduleList = await userScheduleHelper.scheduleExecutiveToUserVehicleRelation(req.body, 0)
            responseHelper.success(res, 'GET_ALL_USER_SUCCESS', req.headers.language, userSheduleList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API helps in inserting Live active subscriber and executive. Here we assign the Executive to the building and vehicles
     * @return it gives how many executive is allocated and what jobs are assigned to them (if flag = 1 then its for HR report) 
     */
    async getExecutionAllocationtoHRReport(req, res) {
        try {
            let userSheduleList = await userScheduleHelper.scheduleExecutiveToUserVehicleRelation(req.body,0)
            responseHelper.success(res, 'GET_ALL_USER_SUCCESS', req.headers.language, userSheduleList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new UserSchedule()