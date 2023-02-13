const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const common = require('../../utils/codeHelper')

class RemarkHelper {
    async getRemarks(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(remark_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            };
            let data = await db.select('mst_remark', selectParams, where + pagination);
            let totalCount = await db.select('mst_remark', `COUNT(*)`, where);
            return { data, total: totalCount[0].count }
        } catch (error) {
            throw error
        }
    }

    async addEditRemark(body) {
        try {
            let data = {
                remark_name: body.remark_name_lang.en,
                remark_name_lang: JSON.stringify(body.remark_name_lang),
                is_active	: 1,
                remark_type: body.remark_type,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if (body.remark_id) {
                data.created_date = body.created_date
                data.remark_id = body.remark_id;
            }
            let result = await db.upsert('mst_remark', data, 'remark_id');
            return result;
        } catch (error) {
            throw error
        }
    }

    async isRemarkExist(body) {
        try {
            let selectParams = ` * `,
                where = ` remark_id = ${body.remark_id} `;
            let data = await db.select('mst_remark', selectParams, where);
            return data
        } catch (error) {
            throw error
        }
    }

    async updateRemarkStatus(body) {
        try {
            let data = {
                is_active: body.is_active,
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let condition = ` remark_id = ${body.remark_id}`;
            let result = await db.update('mst_remark', condition, data);
            return result;
        } catch (error) {
            throw error
        }
    }
}

module.exports = new RemarkHelper()