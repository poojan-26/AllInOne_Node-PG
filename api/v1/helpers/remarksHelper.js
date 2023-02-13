const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

/**
 * This RemarksHelper class contains all remarks related API's logic and required database operations. This class' functions are called from remarks controller.
 */

class RemarksHelper {
    async getVehicleParts(body, language) {
        try {
            const selectParams = `vehicle_part_id, vehicle_part_lang->>'${language}' AS vehicle_part, vehicle_part_type `,
                where = ` vehicle_part_type=${body.vehicle_part_type} AND is_car=${body.is_car} `,
                vehicle_parts = await db.select('mst_vehicle_parts', selectParams, where)
            return vehicle_parts
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getRemarkNames(body, language) {
        try {
            const selectParams = `remark_id, remark_name_lang->>'${language}' AS remark_name, remark_type `,
                where = ` remark_type=${body.remark_type} AND is_active=1 `,
                remark_names = await db.select('mst_remark', selectParams, where)
            return remark_names
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertRemark(body) {
        try {
            let data = {
                executive_id: body.user_id,
                vehicle_id: body.vehicle_id,
                customer_id: body.customer_id,
                remark_id: body.remark_ids,
                date_clicked: 'now()',
                vehicle_part_id: body.vehicle_part_id,
                image: body.image,
                is_deleted: 0,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            },
                remarks = await db.insert('vehicle_remark_relation', data)
            return remarks
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteRemark(remark_id) {
        try {
            let where = `vehicle_remark_relation_id='${remark_id}'`,
                data = {
                    is_deleted: 1,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('vehicle_remark_relation', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getRemarks(body, language) {
        try {
            let selectParams = `vehicle_remark_relation.vehicle_remark_relation_id, vehicle_remark_relation.created_date,
                                vehicle_remark_relation.modified_date,to_char(vehicle_remark_relation.date_clicked,'dd Mon, YYYY') as date_clicked,
                                CAST(mst_vehicle_parts.vehicle_part_lang AS jsonb)->>'${language}' AS vehicle_part, vehicle_remark_relation.image,
                                ARRAY_AGG(mst_remark.remark_name_lang->>'${language}') AS remarks`,
                joins = ` LEFT JOIN mst_vehicle_parts ON mst_vehicle_parts.vehicle_part_id=vehicle_remark_relation.vehicle_part_id
                          LEFT JOIN mst_remark ON CAST(mst_remark.remark_id AS VARCHAR) = ANY (string_to_array(vehicle_remark_relation.remark_id,',')) `,
                where = ` vehicle_id=${body.vehicle_id} AND is_deleted=0 `,
                pagination = ` GROUP BY vehicle_remark_relation.vehicle_remark_relation_id, CAST(mst_vehicle_parts.vehicle_part_lang AS jsonb) `
            let remarks = await db.select('vehicle_remark_relation' + joins, selectParams, where + pagination)
            return remarks
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new RemarksHelper()