const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

/**
 * This SurveyHelper class contains all survey related API's logic and required database operations. This class' functions are called from survey controller.
 */

class SurveyHelper {
    async getSurvey(survey_id, language) {
        try {
            let selectParams = `survey_title.survey_title_id, survey_title.survey_title_lang->>'${language}' AS "survey_title",
                                COALESCE(JSON_AGG(
                                    json_build_object(
                                        'survey_question_id',survey_question_id,
                                        'question_type',question_type,
                                        'question_text',question_text_lang->>'${language}'
                                    ))) as data`,
                joins = ` JOIN survey ON survey.survey_id=survey_title.survey_id 
                        LEFT JOIN survey_question ON survey_title.survey_title_id=survey_question.survey_title_id`,
                where = ` survey_title.survey_id='${survey_id}' and survey.is_active = 1 `,
                pagination = ` GROUP BY survey_title.survey_title_id`
            let survey = await db.select('survey_title' + joins, selectParams, where + pagination)
            return survey
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getSurveyReasons(body, language) {
        try {
            let selectParams = `reason_id, reason_lang->>'${language}' AS reason, is_active, created_date `,
                where = ` '${body.ratings}' = ANY (string_to_array(ratings,',')) 
                        AND question_id='${body.question_id}' and is_active = 1 `
            let reasons = await db.select('mst_survey_reasons', selectParams, where)
            return reasons
        } catch (error) {
            return promise.reject(error)
        }
    }
    async submitSurvey(body) {
        try {
            const columns = '(question_id, survey_id, rating, reason_id,feedback, created_date, modified_date, customer_id, survey_title_id)',
                values = body.survey_titles.map(title => (
                    title.questions.map(question => (
                        `(${question.question_id},${body.survey_id},${question.ratings},${question.reason_id},
                        ${question.feedback !== null ? "'" + question.feedback + "'" : null},${dateHelper.getCurrentTimeStamp()},
                        ${dateHelper.getCurrentTimeStamp()},${body.user_id},${title.survey_title_id})`
                    )).join(',')
                )).join(',')
            await db.bulkinsert('survey_question_feedback', columns, values, "", "")
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new SurveyHelper()