const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')
const language = config.language;

class DemoGuideValidator {
    async addEditDemoGuideValidator(body) {
        try {
            let schema = joi.object().keys({
                demo_id: joi.number().optional(),
                demo_data:joi.any().optional(),
                is_active:joi.number().valid(0,1).optional(),
                demo_type:joi.number().optional(),
                old_image:joi.string().optional(),
                videoThumb:joi.any().optional()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetAllDemoForm(body) {
        try {
            let schema = joi.object().keys({
                demo_id: joi.optional(),
                page_no: joi.number().integer()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}
module.exports = new DemoGuideValidator();