const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')

class CarServiceManagementHelper {
    async  getAllCarData(body, language) {
        try {
            let currentDate = dateHelper.getFormattedDate();
            let selectParams = `cvr.vehicle_relation_id, cvr.is_car, cvr.vehicle_number, 
            cvr.vehicle_image,cvr.is_active, CASE cvr.is_car WHEN 1 THEN cb.brand_id ELSE bb.brand_id END brand_id,
            CASE cvr.is_car WHEN 1 THEN cb.brand_name_lang->>'${language}' ELSE bb.brand_name_lang->>'${language}' END brand_name, 
            CASE cvr.is_car WHEN 1 THEN cm.model_id ELSE bm.model_id END model_id,
            CASE cvr.is_car WHEN 1 THEN cm.model_name_lang->>'${language}' ELSE bm.model_name_lang->>'${language}' END model_name, c.color_id, 
            c.color_name_lang->>'${language}' AS color_name, c.color_hexcode,vt.type_id,vt.type_name_lang->>'${language}' AS type_name,to_char(cvr.subscription_validity, 'YYYY-mm-dd') subscription_validity,
            cus.full_name,cus.phone_number`,

                join = ` LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand 
            LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model 
            LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand 
            LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model
            LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type
            LEFT JOIN color c ON c.color_id = cvr.vehicle_color 
            LEFT JOIN customer cus ON cus.customer_id = cvr.customer_id `,

                where = ` cvr.subscription_id IS NOT NULL AND cvr.subscription_validity >= '${currentDate}' `,

                pagination = ` ORDER BY cvr.created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`

            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(cus.full_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%') OR LOWER(cvr.vehicle_number) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            };

            let data = await db.select('customer_vehicle_relation cvr' + join, selectParams, where + pagination);
            let totalCount = await db.select('customer_vehicle_relation cvr' + join, `COUNT(*)`, where);
            return { data, total: totalCount[0].count }
        } catch (error) {
            throw error
        }
    }
    async updateVehicleStatus(body) {
        try {
            let condition = ` vehicle_relation_id = ${body.vehicle_relation_id}`,
                data = {
                    is_active: +body.is_active,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            let result = await db.update('customer_vehicle_relation', condition, data)
            return result
        } catch (error) {
            return promise.reject(error)
        }
    }
}
module.exports = new CarServiceManagementHelper()