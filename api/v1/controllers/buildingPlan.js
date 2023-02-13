const buildingPlanHelper = require('../helpers/buildingPlanHelper')
const buildingPlanValidator = require('../validators/buildingPlanValidator')
const responseHelper = require('../../utils/responseHelper')

/**
 * This BuildingPlan class contains all subscription plans related APIs.
 */

class BuildingPlan {
    /**
     * API for retrieving active plans building wise which are set by admin 
     * @param {number} building_id building id
     * @returns success response(status code 200) with active plan details in given building
     */
    async getUserPlanForBuilding(req, res) {
        try {
            await buildingPlanValidator.validateGetUserPlanForBuildingAPI(req.body)
            let userPlan = await buildingPlanHelper.getUserPlanForBuilding(req.body, req.headers.language)
            responseHelper.success(res, 'PLAN_LIST', req.headers.language, userPlan)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving active plans building wise which are set by admin 
     * @param {number} subscription_plan_id subscription plan id (1: ED, 2: 3W, 3: 1W)
     * @param {number} vehicle_id vehicle id
     * @returns success response(status code 200) with active plan's durations, promotions(which are set by admin) and prices of all combinations of given plan with all active durations
     */
    async getAllDurationForPlan(req, res) {
        try {
            await buildingPlanValidator.validateGetAllDurationForPlanAPI(req.body)
            let userPlan = await buildingPlanHelper.getAllDurationForPlan(req.body, req.headers.language)
            responseHelper.success(res, 'GET_PLAN_DURATION', req.headers.language, userPlan)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for inserting plan details
     * @param {number} subscription_plan_id subscription plan id (1: ED, 2: 3W, 3: 1W)
     * @param {number} subscription_plan_duration_id subscription plan duration id (1: 1 month, 2: 3 months, 3: 6 months, 4: 12 months)
     * @param {string} subscription_start_date_by_customer subscription start date when customer wants to start service (it can be blank)
     * @param {number} building_id building id 
     * @param {number} customer_subscription_relation_id customer subscription relation id if user wants to update subscription plan from summary screen otherwise it can be blank
     * @param {number} vehicle_id vehicle id if user wants to purchase subscription plan for particular vehicle
     * @returns success response(status code 200)
     */
    async insertPlanDetails(req, res) {
        try {
            await buildingPlanValidator.validateInsertPlanDetailsAPI(req.body)
            let userPlan = await buildingPlanHelper.insertPlanDetails(req.body, req.headers.language)
            responseHelper.success(res, 'INSERT_PLAN', req.headers.language, userPlan)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * This api is used from insertPlanDetails api
     */
    async updatePlanDetails(req, res) {
        try {
            await buildingPlanValidator.validateUpdatePlanDetailsAPI(req.body)
            let userPlan = await buildingPlanHelper.updatePlanDetails(req.body, req.headers.language)
            responseHelper.success(res, 'UPDATE_PLAN', req.headers.language, userPlan)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving active plan details for particular vehicle
     * @param {number} vehicle_id vehicle id
     * @returns success response(status code 200) with vehicle details and active plan details for that vehicle
     */
    async getUserPlanDetails(req, res) {
        try {
            await buildingPlanValidator.validateGetUserPlanDetails(req.body)
            let userPlan = await buildingPlanHelper.getUserPlanDetails(req.body, req.headers.language)
            responseHelper.success(res, 'GET_USER_PLAN', req.headers.language, userPlan)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for deleting plan details for particular vehicle from summary screen before purchase
     * @param {number} customer_subscription_relation_id customer subscription relation id
     * @returns success response(status code 200) by deleting selected plans vehicle wise before purchase
     */
    async deleteUserPlan(req, res) {
        try {
            await buildingPlanValidator.validateDeleteUserPlanAPI(req.body)
            await buildingPlanHelper.deleteUserPlan(req.body)
            responseHelper.success(res, 'DELETED_PLAN', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for removing all plan details for all vehicles which are not purchased 
     * @returns success response(status code 200) by removing all plans which are not purchased 
     */
    async clearUserPlanDetails(req, res) {
        try {
            await buildingPlanValidator.validateClearUserPlanDetailsAPI(req.body)
            await buildingPlanHelper.clearUserPlanDetails(req.body)
            responseHelper.success(res, 'CLEAR_PLAN_DETAILS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for purchasing subscription plan after summary screen
     * @param has_any_active_plan 1: if user purchases any plan 0: otherwise
     * @param customer_subscription_relation_id subscription plan relation id from summary which user buys
     * @returns success response(status code 200) by updating has_any_active_plan status
     */
    async buyPlan(req, res) {
        try {
            await buildingPlanValidator.validateBuyPlanAPI(req.body)
            await buildingPlanHelper.buyPlan(req.body)
            responseHelper.success(res, 'BUY_PLAN', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for getting reasons for cancelling subscription plan
     * @returns success response(status code 200) with listing all reasons for cancelling subscription plan
     */
    async getCancelPlanReasons(req, res) {
        try {
            let reasons = await buildingPlanHelper.getCancelPlanReasons(req.body, req.headers.language)
            responseHelper.success(res, 'GET_CANCEL_PLAN_REASONS', req.headers.language, reasons)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for getting payment history
     * @returns success response(status code 200) with listing all successful payments with vehicle and subscription details
     */
    async getPaymentHistory(req, res) {
        try {
            let payment_history = await buildingPlanHelper.getPaymentHistory(req.body, req.headers.language)
            responseHelper.success(res, 'GET_PAYMENT_HISTORY', req.headers.language, payment_history)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new BuildingPlan()