const surveyHelperAdmin = require('../helpers/surveyHelperAdmin')
const surveyValidatorAdmin = require('../validators/surveyValidatorAdmin')
const responseHelper = require('../../utils/responseHelper')

/**
 * This SurveyAdmin class contains all admin side survey related APIs .
 */

class SurveyAdmin {
    /**
    * API for retrieving all surveys
    * @param {number} page_no page no
    * @param {number} limit limit
    * @param {string} search search keyword
    * @returns success response(status code 200) with survey list
    */
    async getAllSurveys(req, res) {
        try {
            await surveyValidatorAdmin.validateGetAllSurveysForm(req.body)
            let surveys = await surveyHelperAdmin.selectAllSurveys(req.body)
            responseHelper.success(res, 'GET_ALL_SURVEY_SUCCESS', req.headers.language, surveys.surveys, '', surveys.total)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving single survey with specified id 
     * @param {number} survey_id survey id
     * @returns success response(status code 200) with survey details
     */
    async getSingleSurvey(req, res) {
        try {
            await surveyValidatorAdmin.validateGetSurveyForm(req.body)
            let survey = await surveyHelperAdmin.selectSingleSurvey(req.body.survey_id)
            responseHelper.success(res, 'GET_SURVEY_SUCCESS', req.headers.language, survey)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for add survey title 
     * @returns success response(status code 200)
     */
    async addSurveyTitle(req, res) {
        try {
            await surveyValidatorAdmin.validateAddSurveyTitleForm(req.body)
            await surveyHelperAdmin.insertTitle(req.body)
            responseHelper.success(res, 'ADD_SURVEY_TITLE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for add survey title 
     * @returns success response(status code 200)
     */
    async editSurveyTitle(req, res) {
        try {
            await surveyValidatorAdmin.validateEditSurveyTitleForm(req.body)
            await surveyHelperAdmin.updateTitle(req.body)
            responseHelper.success(res, 'EDIT_SURVEY_TITLE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for survey question 
     * @returns success response(status code 200)
     */
    async addSurveyQuestion(req, res) {
        try {
            await surveyValidatorAdmin.validateAddSurveyQuestionForm(req.body)
            await surveyHelperAdmin.insertQuestion(req.body)
            responseHelper.success(res, 'ADD_SURVEY_QUESTION_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for survey question 
     * @returns success response(status code 200)
     */
    async editSurveyQuestion(req, res) {
        try {
            await surveyValidatorAdmin.validateEditSurveyQuestionForm(req.body)
            await surveyHelperAdmin.updateQuestion(req.body)
            responseHelper.success(res, 'EDIT_SURVEY_QUESTION_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for survey reason 
     * @returns success response(status code 200)
     */
    async addSurveyReason(req, res) {
        try {
            await surveyValidatorAdmin.validateAddSurveyReasonForm(req.body)
            await surveyHelperAdmin.insertReason(req.body)
            responseHelper.success(res, 'ADD_SURVEY_REASON_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for add survey 
     * @returns success response(status code 200) with survey details
     */
    async addSurvey(req, res) {
        try {
            console.log(JSON.stringify(req.body))
            await surveyValidatorAdmin.validateAddSurveyForm(req.body)
            await surveyHelperAdmin.insertSurvey(req.body)
            responseHelper.success(res, 'ADD_SURVEY_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for edit survey 
    * @returns success response(status code 200) with survey details
    */
    async editSurvey(req, res) {
        try {
            console.log(JSON.stringify(req.body))
            await surveyValidatorAdmin.validateEditSurveyForm(req.body)
            await surveyHelperAdmin.updateSurvey(req.body)
            responseHelper.success(res, 'EDIT_SURVEY_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for delete survey title
    * @returns success response(status code 200)
    */
    async deleteSurveyTitle(req, res) {
        try {
            console.log(JSON.stringify(req.body))
            await surveyValidatorAdmin.validateDeleteSurveyTitleForm(req.body)
            await surveyHelperAdmin.deleteSurveyTitle(req.body.survey_title_id)
            responseHelper.success(res, 'DELETE_SURVEY_TITLE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for delete survey question
    * @returns success response(status code 200)
    */
    async deleteSurveyQuestion(req, res) {
        try {
            await surveyValidatorAdmin.validateDeleteSurveyQuestionForm(req.body)
            await surveyHelperAdmin.deleteSurveyQuestion(req.body.survey_question_id)
            responseHelper.success(res, 'DELETE_SURVEY_QUESTION_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for delete survey reason
    * @returns success response(status code 200)
    */
    async deleteSurveyReason(req, res) {
        try {
            await surveyValidatorAdmin.validateDeleteSurveyReasonForm(req.body)
            await surveyHelperAdmin.deleteSurveyReason(req.body.survey_reason_id)
            responseHelper.success(res, 'DELETE_SURVEY_REASON_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for update survey status
    * @returns success response(status code 200)
    */
    async updateSurveyStatus(req, res) {
        try {
            await surveyValidatorAdmin.validateUpdateSurveyStatusForm(req.body)
            await surveyHelperAdmin.updateSurveyStatus(req.body)
            responseHelper.success(res, 'EDIT_SURVEY_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for delete survey
    * @returns success response(status code 200)
    */
    async deleteSurvey(req, res) {
        try {
            await surveyValidatorAdmin.validateDeleteSurveyForm(req.body)
            await surveyHelperAdmin.deleteSurvey(req.body)
            responseHelper.success(res, 'DELETE_SURVEY_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for retrieving all surveys feedbacks
    * @param {number} survey_id survey id
    * @param {number} page_no page no
    * @param {number} limit limit
    * @param {string} search search keyword
    * @returns success response(status code 200) with survey feedback list
    */
    async getAllSurveyFeedbacks(req, res) {
        try {
            await surveyValidatorAdmin.validateGetAllSurveyFeedbackForm(req.body)
            const survey_feedbacks = await surveyHelperAdmin.selectAllSurveyFeedbacks(req.body)
            responseHelper.success(res, 'GET_ALL_SURVEY_SUCCESS', req.headers.language, survey_feedbacks.survey_feedbacks, '', survey_feedbacks.total)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for retrieving all surveys feedback details
    * @param {number} customer_id customer id
    * @param {number} survey_id survey id
    * @returns success response(status code 200) with survey feedback details
    */
    async getSingleSurveyFeedback(req, res) {
        try {
            await surveyValidatorAdmin.validateGetSingleSurveyFeedbackForm(req.body)
            const survey_feedback = await surveyHelperAdmin.selectSingleSurveyFeedback(req.body)
            responseHelper.success(res, 'GET_SINGLE_SURVEY_SUCCESS', req.headers.language, survey_feedback)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new SurveyAdmin()