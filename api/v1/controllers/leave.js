const leavesHelper = require('../helpers/leaveHelper')
const leavesValidator = require('../validators/leaveValidator')
const responseHelper = require('../../utils/responseHelper')
const codeHelper = require('../../utils/codeHelper')
const notificationHelperApp = require('../../utils/notificationHelperApp')

/**
 * This Leave class contains all leave related APIs.
 */

class Leave {
    /**
     * API for applying leave.(executive side)
     * @param applied_leave_date leave date
     * @returns success response(status code 200) with leave's listing
     */
    async addLeave(req, res) {
        try {
            await leavesValidator.validateAddLeaveForm(req.body)
            await leavesValidator.isLeaveAlreadyExists(req.body)
            const supervisor = await leavesHelper.getAssociatedSupervisor(req.body.user_id)
            let leave = await leavesHelper.insertLeave(req.body, supervisor.supervisor_id)
            //-------------- Notification------------------
            let unique_id = codeHelper.getUniqueCode()
            let notification_data = notificationHelperApp.insertNotification(leave.leave_id, 'LEAVE_REQUEST_TITLE', 'LEAVE_REQUEST_TEXT', req.body.user_id, supervisor.supervisor_id, 5, unique_id, req.headers.language, 'service_provider_notifications', 0)
            notificationHelperApp.sendNotification(notification_data, 'service_provider_notifications', 'service_provider_notification_id', 'service_provider_device_relation', 'service_provider_id')
            //---------------------------------------------
            responseHelper.success(res, 'ADD_LEAVE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for retrieving all leaves.(executive side)
    * @returns success response(status code 200) with leave's listing
    */
    async getExecutiveLeaves(req, res) {
        try {
            const leaves = await leavesHelper.selectLeaves(req.body.user_id, undefined, req.headers.language)
            responseHelper.success(res, 'GET_LEAVES_SUCCESS', req.headers.language, leaves)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for retrieving all leaves.(supervisor side)
    * @returns success response(status code 200) with leave's listing
    */
    async getSupervisorLeaves(req, res) {
        try {
            const leaves = await leavesHelper.selectLeaves(undefined, req.body.user_id, req.headers.language)
            responseHelper.success(res, 'GET_LEAVES_SUCCESS', req.headers.language, leaves)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async getSingleLeaveWithExecutives(req, res) {
        try {
            await leavesValidator.validateSingleLeaveForm(req.body)
            const response = {}
            response.leave = await leavesHelper.selectLeave(req.body.leave_id, req.headers.language)
            response.is_current_week_leave = await leavesValidator.isCurrentWeekLeave(response.leave)
            if (response.leave.total_jobs > 0) {
                response.substitute_executives = await leavesHelper.selectSubstituteExecutives(req.body.user_id, response.leave, req.headers.language)
                if (response.is_current_week_leave) {
                    response.available_executives = await leavesHelper.selectAvailableExecutives(req.body.user_id, response.leave, req.headers.language)
                }
            }
            responseHelper.success(res, 'GET_EXECUTIVES_SUCCESS', req.headers.language, response)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async rejectLeave(req, res) {
        try {
            await leavesValidator.validateApproveRejectLeaveForm(req.body)
            let leave = await leavesValidator.isLeaveExists(req.body.leave_id)
            await leavesHelper.updateLeaveStatus(req.body.leave_id, 3)
            //-------------- Notification------------------
            let unique_id = codeHelper.getUniqueCode()
            let notification_data = notificationHelperApp.insertNotification(req.body.leave_id, 'LEAVE_REJECT_TITLE', 'LEAVE_REJECT_TEXT', req.body.user_id, leave.executive_id, 2, unique_id, req.headers.language, 'service_provider_notifications', 0)
            notificationHelperApp.sendNotification(notification_data, 'service_provider_notifications', 'service_provider_notification_id', 'service_provider_device_relation', 'service_provider_id')
            //---------------------------------------------
            responseHelper.success(res, 'REJECT_LEAVE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async approveLeave(req, res) {
        try {
            await leavesValidator.validateApproveRejectLeaveForm(req.body)
            let leave = await leavesValidator.isLeaveExists(req.body.leave_id)
            await leavesHelper.updateLeaveStatus(req.body.leave_id, 2)
            //-------------- Notification------------------
            let unique_id = codeHelper.getUniqueCode()
            let notification_data = notificationHelperApp.insertNotification(req.body.leave_id, 'LEAVE_APRROVE_TITLE', 'LEAVE_APRROVE_TEXT', req.body.user_id, leave.executive_id, 1, unique_id, req.headers.language, 'service_provider_notifications', 0)
            notificationHelperApp.sendNotification(notification_data, 'service_provider_notifications', 'service_provider_notification_id', 'service_provider_device_relation', 'service_provider_id') 
            //---------------------------------------------
            responseHelper.success(res, 'APPROVE_LEAVE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async assignJobToSubstitute(req, res) {
        try {
            await leavesValidator.validateAssignJobToSubstituteForm(req.body)
            const leave = await leavesValidator.isLeaveExists(req.body.leave_id)
            await leavesHelper.assignJobToSubstitute(req.body, leave)
            responseHelper.success(res, 'JOB_ASSIGN_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async assignJobToAvailableExecutive(req, res) {
        try {
            await leavesValidator.validateAssignJobToAvailableExecutiveForm(req.body)
            const leave = await leavesValidator.isLeaveExists(req.body.leave_id),
                isCurrentWeek = await leavesValidator.isCurrentWeekLeave(leave)
            if (isCurrentWeek) {
                await leavesHelper.assignJobToAvailableExecutive(req.body, leave)
            } else {
                throw 'LEAVE_IS_NOT_FROM_CURRENT_WEEK'
            }
            responseHelper.success(res, 'JOB_ASSIGN_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new Leave()