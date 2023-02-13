const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

/**
 * This FAQHelper class contains all FAQ related API's logic and required database operations. This class' functions are called from faq controller.
 */

class FAQHelper {
    async selectFAQs(body, language) {
        try {
            let selectParams = `faq_question_lang->>'${language}' AS faq_question, faq_answer_lang->>'${language}' AS faq_answer, created_date, modified_date`,
                where = ` is_active = 1 ORDER BY faq_id ASC`
            let faqs = await db.select('mst_faq', selectParams, where)
            return faqs
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectFAQ(faq_id) {
        try {
            let selectParams = "*",
                where = ` id=${faq_id} `,
                faq = await db.select('faqs', selectParams, where)
            if (faq.length === 0) {
                throw 'FAQ_WITH_ID_NOT_FOUND'
            } else {
                return faq[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertFAQ(body) {
        try {
            let data = {
                faq_question: body.faq_question_lang.en,
                faq_answer: body.faq_answer_lang.en,
                is_active:1,
                faq_question_lang: body.faq_question_lang,
                faq_answer_lang: body.faq_answer_lang,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let faqs = await db.insert('mst_faq', data);
            return faqs
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateFAQ(body) {
        try {
            let condition = ` id=${body.faq_id}`,
                data = {
                    question: body.question ? body.question : undefined,
                    answer: body.answer ? body.answer : undefined,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            let result = await db.update('faqs', condition, data)
            if (result.rowCount === 0) {
                throw 'FAQ_WITH_ID_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteFAQ(body) {
        try {
            let condition = ` id=${body.faq_id}`,
                result = await db.delete('faqs', condition)
            if (result.rowCount === 0) {
                throw 'FAQ_WITH_ID_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new FAQHelper()