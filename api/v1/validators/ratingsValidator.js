const db = require('../../utils/db')
const config = require('../../utils/config')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This RatingsValidator class contains all ratings related API's validation. This class' functions are called from ratings controller.
 */

class RatingsValidator {
    async validateGetRatingsReasons(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                ratings: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }  
    async validateGiveRatings(body) {
        try {
            let schema
                schema = joi.object().keys({
                    user_id: joi.required(),
                    vehicle_id: joi.number().integer().required(),
                    vehicle_wash_id: joi.number().integer().required(),
                    executive_id: joi.number().integer().required(),
                    supervisor_id: joi.number().integer().required(),
                    top_supervisor_id: joi.number().integer().required(),
                    ratings: joi.number().integer().required(),
                    wash_type: joi.number().integer().required(),
                    vehicle_wash_date: joi.string().regex(config.dateRegex).required(),
                    end_time: joi.string().regex(config.timeRegex).required(),
                    category_id: joi.number().integer().allow('')
                })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }  
}

module.exports = new RatingsValidator()