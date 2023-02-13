const db = require('../../utils/db')
const bcrypt = require('bcryptjs');
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

class PromotionValidator {

	async validateGetPromotionsRequest(body) {
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

	async validateAddEditPromotionRequest(body) {
		try {
			let keys = {				
				promotional_id: joi.number().optional(),
				promotion_lang:  joi.object().keys({
					en: joi.string().trim().label('Duration in english').required(),
					tr: joi.string().trim().label('Duration in turkish').required(),
					fa: joi.string().trim().label('Duration in farsi').required(),
					ar: joi.string().trim().label('Duration in arabic').required(),
				}).required()
			}
			let schema = joi.object().keys(keys)
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
    }
    
    async validatePromotionStatusUpdateRequest(body) {
        try {
            let keys = {
                promotional_id: joi.number().required(),
                is_active: joi.number().valid([0,1]).required()
            }

        } catch (error) {
            return promise.reject(error)
        }
    }

}

module.exports = new PromotionValidator()