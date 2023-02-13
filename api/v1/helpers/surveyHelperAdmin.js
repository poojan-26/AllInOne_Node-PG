const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

/**
 * This SurveyHelper class contains all survey related API's logic and required database operations. This class' functions are called from survey controller.
 */

class SurveyHelper {
    async selectAllSurveys(body) {
        try {
            let selectParams = `survey_id, title, created_date, is_active `,
                where = ` is_deleted = 0 `,
                pagination = ` GROUP BY survey_id ORDER BY modified_date DESC OFFSET ${(Number(body.page_no) - 1) * Number(body.limit)} LIMIT ${body.limit}`
            if (body.search) {
                where += ` AND LOWER(title) LIKE LOWER('%${body.search.replace(/'/g, "''")}%') `
            }
            const surveys = await db.select('survey', selectParams, where + pagination),
                totalCount = await db.select('survey', `COUNT(*)`, where)
            return { surveys, total: totalCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectSingleSurvey(survey_id) {
        try {
            const selectParams = `survey.survey_id, survey.title, survey.title_lang, survey.start_date, survey.end_date, survey.created_date, st.survey_title_id, st.survey_title,
                                st.survey_title_lang, ARRAY_AGG(sq.survey_question_id) AS survey_question_ids,
                                COALESCE(JSON_AGG (
                                    json_build_object(
                                        'survey_question_id', sq.survey_question_id,
                                        'question_text', sq.question_text,
                                        'question_text_lang', sq.question_text_lang,
                                        'question_type', sq.question_type,
                                        'created_date', sq.created_date,
                                        'survey_title_id', sq.survey_title_id
                                    ))) as questions`,
                joins = ` JOIN survey_title st ON survey.survey_id=st.survey_id 
                        LEFT JOIN survey_question sq ON st.survey_title_id=sq.survey_title_id `,
                where = ` st.survey_id='${survey_id}' `,
                pagination = ` GROUP BY survey.survey_id, st.survey_title_id`,
                survey_titles = await db.select('survey' + joins, selectParams, where + pagination),
                selectParamsReason = ` * `,
                whereReason = ` question_id = ANY(array[${survey_titles.reduce((tmp_array, title) => {
                    if (title.survey_question_ids[0]) tmp_array.push(title.survey_question_ids)
                    return tmp_array
                }, [])}]) `,
                survey_reasons = await db.select('mst_survey_reasons', selectParamsReason, whereReason)
            let survey = {
                survey_id: survey_titles[0].survey_id,
                title: survey_titles[0].title,
                title_lang: survey_titles[0].title_lang,
                start_date: survey_titles[0].start_date,
                end_date: survey_titles[0].end_date,
                created_date: survey_titles[0].created_date,
                survey_titles: survey_titles.map(title => ({
                    survey_title_id: title.survey_title_id,
                    survey_title: title.survey_title,
                    survey_title_lang: title.survey_title_lang,
                    questions: title.questions.reduce((tmp_questions, question) => {
                        if (question.survey_question_id) {
                            tmp_questions.push({
                                ...question,
                                reasons: survey_reasons.filter(reason => reason.question_id === question.survey_question_id)
                            })
                        }
                        return tmp_questions
                    }, [])
                }))
            }
            return survey
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertTitle(body) {
        try {
            const data = {
                survey_id: body.survey_id,
                survey_title: body.survey_title,
                survey_title_lang: {
                    en: body.survey_title_en,
                    ar: body.survey_title_ar,
                    fa: body.survey_title_fa,
                    tr: body.survey_title_tr
                },
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            await db.insert('survey_title', data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateTitle(body) {
        try {
            const where = ` survey_title_id=${body.survey_title_id} `,
                data = {
                    survey_id: body.survey_id,
                    survey_title: body.survey_title,
                    survey_title_lang: JSON.stringify({
                        en: body.survey_title_en,
                        ar: body.survey_title_ar,
                        fa: body.survey_title_fa,
                        tr: body.survey_title_tr
                    }),
                    created_date: dateHelper.getCurrentTimeStamp(),
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('survey_title', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertQuestion(body) {
        try {
            const data = {
                survey_id: body.survey_id,
                survey_title_id: body.survey_title_id,
                question_type: 1,
                question_text: body.question_text,
                question_text_lang: {
                    en: body.question_text_en,
                    ar: body.question_text_ar,
                    fa: body.question_text_fa,
                    tr: body.question_text_tr
                },
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            await db.insert('survey_question', data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateQuestion(body) {
        try {
            const where = ` survey_question_id=${body.survey_question_id} `,
                data = {
                    survey_id: body.survey_id,
                    survey_title_id: body.survey_title_id,
                    question_type: 1,
                    question_text: body.question_text,
                    question_text_lang: JSON.stringify({
                        en: body.question_text_en,
                        ar: body.question_text_ar,
                        fa: body.question_text_fa,
                        tr: body.question_text_tr
                    }),
                    created_date: dateHelper.getCurrentTimeStamp(),
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('survey_question', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertReason(body) {
        try {
            const data = {
                question_id: body.survey_question_id,
                reason: body.reason,
                is_active: 1,
                ratings: body.ratings.join(","),
                reason_lang: {
                    en: body.reason_en,
                    ar: body.reason_ar,
                    fa: body.reason_fa,
                    tr: body.reason_tr
                },
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            await db.insert('mst_survey_reasons', data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertSurvey(body) {
        try {
            const data = {
                title: body.title_lang.en,
                title_lang: body.title_lang,
                start_date: body.start_date,
                end_date: body.end_date,
                survey_type: body.survey_type,
                survey_send_date: body.survey_type ? body.survey_send_date : null,
                is_active: 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            },
                reasons_columns = `(reason, is_active, ratings, question_id, reason_lang,
                                    created_date, modified_date)`,
                reasons_data = [],
                survey = await db.insert('survey', data)
            if (body.survey_titles) {
                for (let i = 0; i < body.survey_titles.length; i++) {
                    const title_data = {
                        survey_id: survey.survey_id,
                        survey_title: body.survey_titles[i].survey_title_lang.en,
                        survey_title_lang: body.survey_titles[i].survey_title_lang,
                        created_date: dateHelper.getCurrentTimeStamp(),
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                    const title = await db.insert('survey_title', title_data)
                    for (let j = 0; j < body.survey_titles[i].survey_questions.length; j++) {
                        const question_data = {
                            survey_id: survey.survey_id,
                            question_type: 1,
                            question_text: body.survey_titles[i].survey_questions[j].question_text_lang.en,
                            question_text_lang: body.survey_titles[i].survey_questions[j].question_text_lang,
                            survey_title_id: title.survey_title_id,
                            created_date: dateHelper.getCurrentTimeStamp(),
                            modified_date: dateHelper.getCurrentTimeStamp()
                        }
                        const question = await db.insert('survey_question', question_data)
                        body.survey_titles[i].survey_questions[j].reasons.forEach(reason => {
                            reasons_data.push({
                                reason: reason.reason_lang.en,
                                is_active: 1,
                                reason_lang: reason.reason_lang,
                                ratings: reason.ratings.join(","),
                                question_id: question.survey_question_id,
                                created_date: dateHelper.getCurrentTimeStamp(),
                                modified_date: dateHelper.getCurrentTimeStamp()
                            })
                        })
                    }
                }
            }
            const reasons_data_final = reasons_data.map(data => (
                `('${data.reason}', '${data.is_active}', '${data.ratings}', '${data.question_id}',
                '${JSON.stringify(data.reason_lang)}', ${data.created_date}, ${data.modified_date})`
            )).join(',');
            await db.bulkinsert('mst_survey_reasons', reasons_columns, reasons_data_final, '', '')
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateSurvey(body) {
        try {
            const where = ` survey_id=${body.survey_id} `,
                data = {
                    title: body.title_lang.en,
                    title_lang: JSON.stringify(body.title_lang),
                    start_date: body.start_date,
                    end_date: body.end_date,
                    survey_type: body.survey_type,
                    survey_send_date: body.survey_type ? body.survey_send_date : null,
                    is_active: 1,
                    created_date: dateHelper.getCurrentTimeStamp(),
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('survey', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteSurveyTitle(survey_title_id) {
        try {
            const where = ` survey_title_id=${survey_title_id} `
            await db.delete('survey_title', where)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteSurveyQuestion(survey_question_id) {
        try {
            const where = ` survey_question_id=${survey_question_id}  `
            await db.delete('survey_question', where)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteSurveyReason(survey_reason_id) {
        try {
            const where = ` reason_id=${survey_reason_id}  `
            await db.delete('mst_survey_reasons', where)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateSurveyStatus(body) {
        try {
            const where = ` survey_id=${body.survey_id} `,
                data = {
                    is_active: body.is_active,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('survey', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteSurvey(body) {
        try {
            const where = ` survey_id=${body.survey_id} `,
                data = {
                    is_deleted: 1,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('survey', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectAllSurveyFeedbacks(body) {
        try {
            let selectParams = ` sqf.survey_id, sqf.customer_id, customer.full_name AS customer_name,
                                MAX(sqf.created_date) AS created_date `,
                joins = ` LEFT JOIN customer ON customer.customer_id = sqf.customer_id `,
                where = ` sqf.survey_id=${body.survey_id}`,
                group_by = ` GROUP BY sqf.survey_id, sqf.customer_id, customer.full_name `,
                pagination = ` OFFSET ${(Number(body.page_no) - 1) * Number(body.limit)} LIMIT ${body.limit}`
            if (body.search) {
                where += ` AND LOWER(customer.full_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%') `
            }
            const survey_feedbacks = await db.select('survey_question_feedback sqf' + joins, selectParams, where + group_by + pagination),
                totalCount = await db.select('survey_question_feedback sqf' + joins, `COUNT(*)`, where + group_by)
            return { survey_feedbacks, total: totalCount[0] ? totalCount[0].count : 0 }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectSingleSurveyFeedback(body) {
        try {
            const selectParams = `survey.survey_id, survey.title, MAX(sqf.created_date) AS created_date,
                                COALESCE(JSON_AGG(
                                    json_build_object(
                                        'survey_question', sq.question_text,
                                        'rating', sqf.rating,
                                        'feedback', sqf.feedback ,
                                        'survey_title', st.survey_title,
                                        'survey_title_id', st.survey_title_id,
                                        'reason', msr.reason
                                    ))) as feedbacks `,
                joins = ` LEFT JOIN survey_question_feedback sqf ON sqf.survey_id=survey.survey_id 
                        LEFT JOIN survey_question sq ON sqf.question_id=sq.survey_question_id 
                        LEFT JOIN survey_title st ON sqf.survey_title_id=st.survey_title_id 
                        LEFT JOIN mst_survey_reasons msr ON sqf.reason_id=msr.reason_id `,
                where = ` survey.survey_id=${body.survey_id} AND sqf.customer_id=${body.customer_id} `,
                pagination = ` GROUP BY survey.survey_id`,
                survey_feedback = await db.select('survey' + joins, selectParams, where + pagination)
            return survey_feedback[0]
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new SurveyHelper()