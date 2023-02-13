const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This BuildingPlanValidator class contains all subscription plans related API's validation. This class' functions are called from buildingPlan controller.
 */

class BuildingPlanValidator {
    async validateGetUserPlanForBuildingAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                building_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetAllDurationForPlanAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                subscription_plan_id: joi.number().integer().required(),
                vehicle_id: joi.number().integer().allow('')
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
        
    async validateInsertPlanDetailsAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                subscription_plan_id: joi.number().integer().required(),
                subscription_plan_duration_id: joi.number().integer().required(),
               // price : joi.string().required(),
               // vehicle_ids : joi.string().required(),
                subscription_start_date_by_customer: joi.string().allow(''),
                customer_subscription_relation_id : joi.allow(""),
                vehicle_id : joi.allow(""),
                building_id: joi.number().integer().required()

            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateUpdatePlanDetailsAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                subscription_plan_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetUserPlanDetails(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_id : joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteUserPlanAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                customer_subscription_relation_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateClearUserPlanDetailsAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateBuyPlanAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                has_any_active_plan: joi.number().integer().required(),
                customer_subscription_relation_id: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new BuildingPlanValidator()