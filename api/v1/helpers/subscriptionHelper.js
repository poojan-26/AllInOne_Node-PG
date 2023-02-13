const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const common = require('../../utils/codeHelper')

class Subscriptionhelper {

    async getSubscriptions(body) {
        try {
            // let selectParams = ` * `,
            let selectParams = ` plan.subscription_plan, due.duration_title, veh.type_name, sub.* `,
                where = ` 1=1 `,
                join = ' JOIN mst_subscription_plan as plan ON plan.subscription_plan_id = sub.subscription_plan_id JOIN mst_subscription_plan_duration as due ON due.subscription_plan_duration_id = sub.subscription_duration_id JOIN vehicle_type as veh ON veh.type_id = sub.type_id',
                pagination = ` ORDER BY sub.subscription_promotional_relation_id LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(veh.type_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%') OR LOWER(due.duration_title) LIKE LOWER('%${body.search.replace(/'/g, "''")}%') OR LOWER(plan.subscription_plan) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            };
            let data = await db.select('subscription_promotional_relation as sub' + join, selectParams, where + pagination);
            let totalCount = await db.select('subscription_promotional_relation as sub' + join, `COUNT(*)`, where);
            return { data, total: totalCount[0].count }
        } catch (error) {
            throw error
        }
    }

    async getAddSubscriptionsData() {
        try {
            let condition = 'is_active = 1 '
            let plans = await db.select('mst_subscription_plan', 'subscription_plan_id, subscription_plan', condition + 'ORDER BY subscription_plan_id ASC')
            let durations = await db.select('mst_subscription_plan_duration', 'subscription_plan_duration_id, duration_title', condition + 'ORDER BY subscription_plan_duration_id ASC')
            let promotions = await db.select('mst_promotional', 'promotional_id, promotional_text', condition + 'ORDER BY promotional_id ASC')
            let vehicleTypes = await db.select('vehicle_type', 'type_id, type_name', condition + 'ORDER BY type_id ASC')
            // console.log(plans, durations, promotions)
            return { plans, durations, promotions, vehicleTypes }
        } catch (error) {
            throw error
        }
    }

    async addEditsubscription(body) {
        try {
            console.log('\n\n', body.promotional_ids, '\n\n');
            let promArr = body.promotional_ids.join(',').toString()
            console.log('\n\n\n\n', typeof (promArr), '\n\n\n\n');
            let data = {
                type_id: body.type_id,
                subscription_plan_id: body.subscription_plan_id,
                subscription_duration_id: body.subscription_duration_id,
                promotional_ids: promArr,
                original_price: body.original_price,
                promotional_price: body.promotional_price,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if ('subscription_promotional_relation_id' in body) {
                data.created_date = body.created_date;
                data.subscription_promotional_relation_id = body.subscription_promotional_relation_id;
            }
            let result = await db.upsert('subscription_promotional_relation', data, 'subscription_promotional_relation_id');
            console.log("\n\n\nadded_success\n\n\n", result);
            return result;
        } catch (error) {
            throw error
        }
    }


    async isSubscriptionExist(body) {
        try {
            // let selectParams = ` * `,
            let selectParams = ` * `,
                where = ` subscription_promotional_relation_id = ${body.subscription_promotional_relation_id} `;
            let data = await db.select('subscription_promotional_relation', selectParams, where);
            return data
        } catch (error) {
            throw error
        }
    }
}

module.exports = new Subscriptionhelper()