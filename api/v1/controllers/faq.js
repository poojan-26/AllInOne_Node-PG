const faqHelper = require('../helpers/faqHelper')
const faqValidator = require('../validators/faqValidator')
const responseHelper = require('../../utils/responseHelper')
const config = require('../../utils/config')

/**
 * This FAQ class contains all FAQ related APIs.
 */

class FAQ {
    /**
     * API for retrieving all FAQs.
     * @param {number} page_no page number
     * @returns success response(status code 200) with all FAQs based on pagination
     * @date 2020-02-20
     */
    async getAllFAQs(req, res) {
        try {
            await faqValidator.validateGetAllFAQsForm(req.body)
            let faqs = await faqHelper.selectFAQs(req.body, req.headers.language)
            responseHelper.success(res, 'GET_ALL_FAQ_SUCCESS', req.headers.language, faqs)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    // async getSingleFAQ(req, res) {
    //     try {
    //         await faqValidator.validateGetSingleFAQForm(req.body)
    //         let faq = await faqHelper.selectFAQ(req.body.faq_id)
    //         responseHelper.success(res, 'GET_SINGLE_FAQ_SUCCESS', req.headers.language, faq)
    //     } catch (error) {
    //         console.log(error)
    //         responseHelper.error(res, error, req.headers.language)
    //     }
    // }
    async addFAQ(req, res) {
        try {
            await faqValidator.validateAddFAQForm(req.body);            
            await faqHelper.insertFAQ(req.body);
            responseHelper.success(res, 'ADD_FAQ_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async editFAQ(req, res) {
        try {
            await faqValidator.validateEditFAQForm(req.body)
            await faqValidator.isFAQExist(req.body.faq_id, req.body.question, req.body.answer)
            await faqHelper.updateFAQ(req.body)
            responseHelper.success(res, 'EDIT_FAQ_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    // async deleteFAQ(req, res) {
    //     try {
    //         await faqValidator.validateDeleteFAQForm(req.body)
    //         await faqHelper.deleteFAQ(req.body)
    //         responseHelper.success(res, 'DELETE_FAQ_SUCCESS', req.headers.language)
    //     } catch (error) {
    //         console.log(error)
    //         responseHelper.error(res, error, req.headers.language)
    //     }
    // }
}

module.exports = new FAQ()