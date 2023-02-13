const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const common = require('../../utils/codeHelper')

class VehiclePartHelper {
    async getVehicleParts(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(vehicle_part) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            };
            let data = await db.select('mst_vehicle_parts', selectParams, where + pagination);
            let totalCount = await db.select('mst_vehicle_parts', `COUNT(*)`, where);
            return { data, total: totalCount[0].count }
        } catch (error) {
            throw error
        }
    }

    async addEditVehiclePart(body) {
        try {
            console.log(body)
            let data = {
                vehicle_part: body.vehicle_part_lang.en,
                vehicle_part_lang: JSON.stringify(body.vehicle_part_lang),
                is_car	: 1,
                vehicle_part_type: body.vehicle_part_type,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if (body.vehicle_part_id) {
                data.created_date = body.created_date
                data.vehicle_part_id = body.vehicle_part_id;
            }
            let result = await db.upsert('mst_vehicle_parts', data, 'vehicle_part_id');
            return result;
        } catch (error) {
            throw error
        }
    }

    async isVehiclePartExist(body) {
        try {
            let selectParams = ` * `,
                where = ` vehicle_part_id = ${body.vehicle_part_id} `;
            let data = await db.select('mst_vehicle_parts', selectParams, where);
            return data
        } catch (error) {
            throw error
        }
    }
}

module.exports = new VehiclePartHelper()