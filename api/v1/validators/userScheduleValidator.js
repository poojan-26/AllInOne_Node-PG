const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')

/**
 * This UserScheduleValidator class contains all vehicle wash related API's validation. This class' functions are called from userSchedule controller.
 */

class UserScheduleValidator {
    async validateGetUserVehicleWashListAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetInteriorTimeSlotsAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                building_id: joi.number().integer().required(), 
                date: joi.string().regex(config.dateRegex).required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateSetInteriorTimeSlotAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_id: joi.number().integer().required(),
                building_id: joi.number().integer().required(), 
                vehicle_wash_date: joi.string().regex(config.dateRegex).required(),
                interior_time_slot: joi.string().regex(config.timeRegex).required(),
                vehicle_wash_id: joi.number().integer().required(),
                is_reschedule: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateCancelInteriorWashAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_wash_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetUserVehicleWashHistoryListAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                page_no: joi.number().integer(),
                vehicle_wash_date: joi.string().regex(config.dateRegex).allow('')
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetUserVehicleWashDetailAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_wash_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetUserSummaryAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
             //   vehicle_id: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new UserScheduleValidator()