const surveyHelper = require('../helpers/surveyHelper')
const surveyValidator = require('../validators/surveyValidator')
const responseHelper = require('../../utils/responseHelper')

/**
 * This Survey class contains all survey related APIs.
 */

class Survey {
     /**
     * API for retrieving survey form which is sent by admin
     * @param {number} survey_id survey id
     * @returns success response(status code 200) with survey form
     */
    async getSurvey(req, res) {
        try {
            await surveyValidator.validateGetSurveyForm(req.body)
            let survey = await surveyHelper.getSurvey(req.body.survey_id, req.headers.language)
            responseHelper.success(res, 'GET_SURVEY_SUCCESS', req.headers.language, survey)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
     /**
     * API for retrieving reasons based on given ratings. This API is only if ratings are 4 or less than 4.
     * @param {number} ratings ratings between 1 to 4
     * @param {number} question_id question_id
     * @returns success response(status code 200) with reasons based on ratings
     */
    async getSurveyReasons(req, res) {
        try {
            await surveyValidator.validateGetSurveyReasons(req.body)
            let reasons = await surveyHelper.getSurveyReasons(req.body, req.headers.language)
            responseHelper.success(res, 'GET_SURVEY_REASONS_SUCCESS', req.headers.language, reasons)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for submitting survey.
     * @param {JSON} json survey response json
     * @returns success response(status code 200) with submitting survey response
     */
    async submitSurvey(req, res) {
        try {
            await surveyValidator.validateSubmitSurvey(req.body)
            await surveyHelper.submitSurvey(req.body)
            responseHelper.success(res, 'SUBMIT_SURVEY_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new Survey()