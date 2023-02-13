const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This FAQValidator class contains all FAQ related API's validation. This class' functions are called from faq controller.
 */

class FAQValidator {
    async validateGetAllFAQsForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetSingleFAQForm(body) {
        try {
            let schema = joi.object().keys({
                faq_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddFAQForm(body) {
        try {
            let schema = joi.object().keys({                
                faq_question_lang: joi.object().keys({
                    en: joi.string().label('Faq question in english is required').required(),
                    tr: joi.string().label('Faq question in turkish is required').required(),
                    fa: joi.string().label('Faq question in farsi is required').required(),
                    ar: joi.string().label('Faq question in arabic is required').required()
                }).required(),
                faq_answer_lang: joi.object().keys({
                    en: joi.string().label('Faq answer in english is required').required(),
                    tr: joi.string().label('Faq answer in turkish is required').required(),
                    fa: joi.string().label('Faq answer in farsi is required').required(),
                    ar: joi.string().label('Faq answer in arabic is required').required()
                }).required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateEditFAQForm(body) {
        try {
            let schema = joi.object().keys({
                faq_id: joi.number().integer().required(),
                faq_question_lang: joi.object().keys({
                    en: joi.string().label('Faq question in english is required').required(),
                    tr: joi.string().label('Faq question in turkish is required').required(),
                    fa: joi.string().label('Faq question in farsi is required').required(),
                    ar: joi.string().label('Faq question in arabic is required').required()
                }).required(),
                faq_answer_lang: joi.object().keys({
                    en: joi.string().label('Faq answer in english is required').required(),
                    tr: joi.string().label('Faq answer in turkish is required').required(),
                    fa: joi.string().label('Faq answer in farsi is required').required(),
                    ar: joi.string().label('Faq answer in arabic is required').required()
                }).required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteFAQForm(body) {
        try {
            let schema = joi.object().keys({
                faq_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isFAQExist(faq_id, question, answer) {
        try {
            let selectParams = '*',
                where = ` question='${question}' AND answer='${answer}' `
            if (faq_id) {
                where += ` AND id!='${faq_id}' `
            }
            let faq = await db.select('faqs', selectParams, where)
            if (faq.length > 0) {
                throw 'FAQ_ALREADY_EXISTS'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new FAQValidator()