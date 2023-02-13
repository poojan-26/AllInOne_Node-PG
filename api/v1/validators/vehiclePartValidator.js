const db = require('../../utils/db')
const bcrypt = require('bcryptjs');
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

class VehiclePartValidator {

	async validateGetVehiclePartsRequest(body) {
		try {
			let schema = joi.object().keys({
				limit: joi.number().required(),
				page_no: joi.number().required(),
				search: joi.string().optional()
			})
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
    }
    
    async validateAddEditVehiclePartRequest(body) {
        try {
            let keys = {				
				vehicle_part_id: joi.number().optional(),
				// vehicle_part: joi.string().strict().trim().required(),
                vehicle_part_type: joi.number().required(),
                vehicle_part_lang: joi.object().required()
			}
			let schema = joi.object().keys(keys)
			await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }

}

module.exports = new VehiclePartValidator()