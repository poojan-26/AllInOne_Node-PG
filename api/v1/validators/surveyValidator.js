const db = require('../../utils/db')
const config = require('../../utils/config')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This SurveyValidator class contains all survey related API's validation. This class' functions are called from survey controller.
 */

class SurveyValidator {
    async validateGetSurveyForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                survey_id: joi.required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetSurveyReasons(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                question_id: joi.number().integer().required(),
                ratings: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateSubmitSurvey(body) {
        try {
            const questions_schema = joi.object({
                question_id: joi.number().integer().required(),
                ratings: joi.number().integer().allow(null),
                reason_id: [joi.number().optional(), joi.allow(null)],
                feedback: joi.string().allow(null, "")
            }),
                survey_title_schema = joi.object({
                    survey_title_id: joi.number().integer().required(),
                    questions: joi.array().items(questions_schema).required()
                }),
                schema = joi.object().keys({
                    user_id: joi.required(),
                    survey_id: joi.number().integer().required(),
                    survey_titles: joi.array().items(survey_title_schema).required()
                })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new SurveyValidator()