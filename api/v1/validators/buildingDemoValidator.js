const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This BuildingDemoValidator class contains building demo and location(or building) related API's validation. This class' functions are called from buildingDemo controller.
 */

class BuildingDemoValidator {
    async validateGetDemoByBuildingAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                building_id: joi.number().integer().required(),                
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateSetBuildingDemoScheduleAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                schedule_date: joi.date().required(),
                schedule_time: joi.required(),
                building_id: joi.number().integer().required(),                
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateChangeCustomerLocationAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                location : joi.string().required(),
                latitude : joi.number().required(),
                longitude : joi.number().required(),
                building_id: joi.number().integer().required(),
                building_name: joi.required(),
                is_update: joi.number().integer().allow('')
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateCheckCustomerBuildingAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                building_id : joi.number().integer().required(),
                change_building_id: joi.number().integer().required(),
                location : joi.string().required(),
                latitude : joi.number().required(),
                longitude : joi.number().required()              
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetBuildingByLatitudeLongitudeAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                latitude : joi.number().required(),
                longitude : joi.number().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }  
}

module.exports = new BuildingDemoValidator()