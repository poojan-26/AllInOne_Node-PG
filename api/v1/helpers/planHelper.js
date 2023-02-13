const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const common = require('../../utils/codeHelper')

class PlanHelper {
    async getPlans(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(subscription_plan) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            };
            let data = await db.select('mst_subscription_plan', selectParams, where + pagination),
                totalCount = await db.select('mst_subscription_plan', `COUNT(*)`, where);
            console.log("totalCount =========", totalCount);
            return { data, total: totalCount[0].count }
        } catch (error) {
            throw error
        }
    }

    async addEditPlan(body) {
        try {
            let data = {
                subscription_plan: JSON.parse(body.subscription_plan_lang).en,
                subscription_details: JSON.parse(body.subscription_details_lang).en,
                interior_wash_details: JSON.parse(body.interior_wash_details_lang).en,
                subscription_plan_lang: body.subscription_plan_lang,
                subscription_details_lang: body.subscription_details_lang,
                interior_wash_details_lang: body.interior_wash_details_lang,
                exterior_wash_counts: body.exterior_wash_counts,
                interior_wash_counts: body.interior_wash_counts,
                is_active: 1,
                subscription_type: body.subscription_type,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if (body.subscription_plan_id) {
                data.created_date = body.created_date;
                data.subscription_plan_id = body.subscription_plan_id;
            }
            let result = await db.upsert('mst_subscription_plan', data, 'subscription_plan_id');
            return result;
        } catch (error) {
            throw error;
        }
    }


    async planStatusUpdate(body) {
        try {
            let data = {
                is_active: body.is_active,
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let condition = ` subscription_plan_id = ${body.subscription_plan_id}`;
            let result = await db.update('mst_subscription_plan', condition, data);
            return result;
        } catch (error) {
            throw error;
        }
    }

    /* 
        This function used to fetch last type id value if request comes for add a new plan else edit request. 
        If req comes for edit the send the type value based on respective id. 
    */
    async getLastSubscriptionTypeOrById(flag, body) { // 0 = add , 1 = edit
        try {
            let condition;
            if (flag === 0) {
                condition = ` 1=1 order by subscription_type DESC limit 1`;
            } else {
                condition = ` subscription_plan_id = ${body.subscription_plan_id} `;
            }
            let data = await db.select('mst_subscription_plan', flag === 0 ? 'subscription_type' : 'subscription_type, created_date', condition);
            return data;
        } catch (error) {
            throw error
        }
    }


    async getDurationList(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(duration_title) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            };
            let data = await db.select('mst_subscription_plan_duration', selectParams, where + pagination);                            
            return data           
        } catch (error) {
            throw error
        }
    }

    async addEditDuration(reqData) {
        try {
            console.log("addEditDuration === ", reqData);
            let data = {
                duration_title: reqData.duration_title_lang.en,
                duration_month: +reqData.duration_month,
                duration_title_lang: JSON.stringify(reqData.duration_title_lang),
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if (reqData.subscription_plan_duration_id) {
                data.created_date = reqData.created_date
                data.subscription_plan_duration_id = reqData.subscription_plan_duration_id
            }
            return await db.upsert('mst_subscription_plan_duration', data, 'subscription_plan_duration_id')
        } catch (error) {
            throw error
        }
    }

    async durationStatusUpdate(body) {
        try {
            let data = {
                is_active: body.is_active,
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let condition = ` subscription_plan_duration_id = ${body.subscription_plan_duration_id}`;
            let result = await db.update('mst_subscription_plan_duration', condition, data);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getDurationDetails(body) {
        try {
            let condition = ` subscription_plan_duration_id = ${body.subscription_plan_duration_id} `;
            let data = await db.select('mst_subscription_plan_duration', '*', condition);
            return data;
        } catch (error) {
            throw error
        }
    }

    async durationStatusUpdate(body) {
        try {
            let data = {
                is_active: body.is_active,
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let condition = ` subscription_plan_duration_id = ${body.subscription_plan_duration_id}`
            let result = await db.update('mst_subscription_plan_duration', condition, data)
            return result
        } catch (error) {
            throw error
        }
    }
}

module.exports = new PlanHelper()