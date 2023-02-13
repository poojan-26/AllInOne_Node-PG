const db = require('../../utils/db')
const config = require('../../utils/config')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This SurveyValidator class contains all survey related API's validation. This class' functions are called from survey controller.
 */

class SurveyValidator {
    async validateGetAllSurveysForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                search: joi.string(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetSurveyForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteSurveyTitleForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_title_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteSurveyQuestionForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_question_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteSurveyReasonForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_reason_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateUpdateSurveyStatusForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_id: joi.number().integer().required(),
                is_active: joi.number().valid(0, 1).required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteSurveyForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddSurveyTitleForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_id: joi.number().required(),
                survey_title: joi.string().required(),
                survey_title_en: joi.string().required(),
                survey_title_ar: joi.string().required(),
                survey_title_fa: joi.string().required(),
                survey_title_tr: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateEditSurveyTitleForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_title_id: joi.number().integer().required(),
                survey_id: joi.number().required(),
                survey_title: joi.string().required(),
                survey_title_en: joi.string().required(),
                survey_title_ar: joi.string().required(),
                survey_title_fa: joi.string().required(),
                survey_title_tr: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddSurveyQuestionForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_id: joi.number().required(),
                survey_title_id: joi.number().required(),
                question_type: joi.number().valid(0, 1),
                question_text: joi.string().required(),
                question_text_en: joi.string().required(),
                question_text_ar: joi.string().required(),
                question_text_fa: joi.string().required(),
                question_text_tr: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateEditSurveyQuestionForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_question_id: joi.number().required(),
                survey_id: joi.number().required(),
                survey_title_id: joi.number().required(),
                question_type: joi.number().valid(0, 1),
                question_text: joi.string().required(),
                question_text_en: joi.string().required(),
                question_text_ar: joi.string().required(),
                question_text_fa: joi.string().required(),
                question_text_tr: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddSurveyReasonForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_question_id: joi.number().integer().required(),
                reason: joi.string().required(),
                reason_en: joi.string().required(),
                reason_ar: joi.string().required(),
                reason_fa: joi.string().required(),
                reason_tr: joi.string().required(),
                ratings: joi.array().min(1).required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddSurveyForm(body) {
        try {
            const reasons_schema = joi.object({
                ratings: joi.array().min(1).required(),
                selectedSurveyQuestionIndex: joi.any(),
                reason_lang: joi.object({
                    en: joi.string().required(),
                    ar: joi.string().required(),
                    fa: joi.string().required(),
                    tr: joi.string().required()
                }),
            }),
                questions_schema = joi.object({
                    question_type: joi.number().valid(0, 1),
                    selectedSurveyTitleIndex: joi.any(),
                    question_text_lang: joi.object({
                        en: joi.string().required(),
                        ar: joi.string().required(),
                        fa: joi.string().required(),
                        tr: joi.string().required()
                    }),
                    reasons: joi.array().items(reasons_schema)
                }),
                survey_title_schema = joi.object({
                    survey_title_lang: joi.object({
                        en: joi.string().required(),
                        ar: joi.string().required(),
                        fa: joi.string().required(),
                        tr: joi.string().required()
                    }),
                    survey_questions: joi.array().items(questions_schema)
                }),
                schema = joi.object().keys({
                    user_id: joi.any(),
                    title_lang: joi.object({
                        en: joi.string().trim().required(),
                        tr: joi.string().trim().required(),
                        fa: joi.string().trim().required(),
                        ar: joi.string().trim().required()
                    }),
                    survey_type: joi.number().valid(0, 1).required(),
                    survey_date: joi.string().strict(),
                    start_date: joi.string().strict().required(),
                    end_date: joi.string().strict().required(),
                    survey_titles: joi.array().items(survey_title_schema)
                })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateEditSurveyForm(body) {
        try {
            const schema = joi.object().keys({
                user_id: joi.any(),
                survey_id: joi.number().integer().required(),
                title_lang: joi.object({
                    en: joi.string().trim().required(),
                    tr: joi.string().trim().required(),
                    fa: joi.string().trim().required(),
                    ar: joi.string().trim().required()
                }),
                survey_type: joi.number().valid(0, 1).required(),
                survey_date: joi.string().strict(),
                start_date: joi.string().strict().required(),
                end_date: joi.string().strict().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetAllSurveyFeedbackForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_id: joi.number().integer().required(),
                search: joi.string(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetSingleSurveyFeedbackForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.any(),
                survey_id: joi.number().integer().required(),
                customer_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new SurveyValidator()