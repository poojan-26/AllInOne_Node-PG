const promise = require('bluebird')
const joi = require('joi')

const db = require('../../utils/db')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')

/**
 * This LeaveValidator class contains all leave related API's validation. This class' functions are called from leave controller.
 */

class LeaveValidator {
    async validateSingleLeaveForm(body) {
        try {
            const schema = joi.object().keys({
                user_id: joi.required(),
                leave_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddLeaveForm(body) {
        try {
            const schema = joi.object().keys({
                user_id: joi.required(),
                applied_leave_date: joi.string().regex(config.dateRegex).required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateApproveRejectLeaveForm(body) {
        try {
            const schema = joi.object().keys({
                user_id: joi.required(),
                leave_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAssignJobToSubstituteForm(body) {
        try {
            const schema = joi.object().keys({
                user_id: joi.required(),
                leave_id: joi.number().integer().required(),
                substitute_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAssignJobToAvailableExecutiveForm(body) {
        try {
            const job_schema = joi.object({
                building_id: joi.number().integer().required(),
                executive_id: joi.number().integer().required(),
                assigned_jobs: joi.number().integer().required()
            }),
                schema = joi.object().keys({
                    user_id: joi.required(),
                    leave_id: joi.number().integer().required(),
                    jobs: joi.array().items(job_schema).required(),
                })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isLeaveAlreadyExists(body) {
        try {
            const condition = ` applied_leave_date='${body.applied_leave_date}' AND executive_id=${body.user_id} `,
                leave = await db.select('executive_leaves', 'leave_id', condition)
            if (leave && leave.length > 0) {
                throw 'LEAVE_ALREADY_EXISTS'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isLeaveExists(leave_id) {
        try {
            const condition = ` leave_id='${leave_id}' `,
                leave = await db.select('executive_leaves', `*,to_char(applied_leave_date,'dd Mon, YYYY') AS applied_leave_date`, condition)
            if (leave && leave.length > 0) {
                return leave[0]
            } else {
                throw 'LEAVE_WITH_ID_NOT_FOUND'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isCurrentWeekLeave(leave) {
        try {
            const query = ` SELECT CASE WHEN '${leave.applied_leave_date}' >= (current_date - extract(dow from current_date)::int) 
                        AND '${leave.applied_leave_date}' < (current_date + (abs(extract(dow from current_date) - 7) - 1)::int) 
                        THEN true ELSE false END AS is_current_week_leave `,
                custom_result = await db.custom(query)
            return custom_result.rows[0].is_current_week_leave
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new LeaveValidator()