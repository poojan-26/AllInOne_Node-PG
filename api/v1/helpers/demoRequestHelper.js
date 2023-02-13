const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')

class DemoRequestHelper {
    async getDemoRequestList(body) {
        try {
            let selectParams = ` customer_demo_request.*,c.full_name AS customer_name,b.building_name `,
                join = ` LEFT JOIN customer c ON c.customer_id = customer_demo_request.customer_id LEFT JOIN building b ON b.building_id=customer_demo_request.building_id `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(c.full_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            };
            if ('is_assigned' in body && body.is_assigned != '') {
                where += ` AND is_assigned=${+body.is_assigned}`
            };
            let data = await db.select('customer_demo_request' + join, selectParams, where + pagination);
            let totalCount = await db.select('customer_demo_request' + join, `COUNT(*)`, where);
            return { data, total: totalCount[0].count }
        } catch (error) {
            throw error
        }
    }
    async assignDemoToCustomer(body) {
        try {
            let condition = ` demo_request_id = ${body.demo_request_id}`,
                data = {
                    final_date: body.final_date,
                    final_time: body.final_time,
                    is_assigned: 1,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            let result = await db.update('customer_demo_request', condition, data)
            return result
        } catch (error) {
            return promise.reject(error)
        }
    }
}
module.exports = new DemoRequestHelper()