const db = require('../../utils/db')
const bcrypt = require('bcryptjs');
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

class RemarkValidator {

	async validateGetRemarksRequest(body) {
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
    
    async validateAddEditRemarkRequest(body) {
        try {
            let keys = {				
				remark_id: joi.number().optional(),
				// vehicle_part: joi.string().strict().trim().required(),
                remark_type: joi.number().required(),
                remark_name_lang: joi.object().required()
			}
			let schema = joi.object().keys(keys)
			await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
	}
	
	async validateUpdateRemarkStatusRequest (body) {
		try {
            let keys = {				
				remark_id: joi.number().required(),
				// vehicle_part: joi.string().strict().trim().required(),
                is_active: joi.number().required(),
			}
			let schema = joi.object().keys(keys)
			await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
	}

}

module.exports = new RemarkValidator()