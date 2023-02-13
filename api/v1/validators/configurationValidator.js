const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')
const language = config.language;


/**
 * This class contains configuration edit related API's validation.
 */


class ConfigurationValidator {
    async editConfigurationValidator(body) {
        try {
            let schema = joi.object().keys({
                maximum_distance_for_executive: joi.number().required(),
                maximum_distance_between_service: joi.number().required(),
                week_day_holiday: joi.number().required(),
                referral_bonus_free_vehicle_wash_count: joi.number().required(),
                minimum_no_of_vehicle_assign: joi.number().required(),
                default_language: joi.number().required(),
                interior_wash_time: joi.number().required(),
                vehicle_interior_start_time: joi.any().required(),
                vehicle_interior_end_time: joi.any().required()                    
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }

    
    async getConfigurationValidator(body) {
        try {
            let schema = joi.object().keys({
                                          
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new ConfigurationValidator();