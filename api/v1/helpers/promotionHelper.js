const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const common = require('../../utils/codeHelper')

class PromotionHelper {
    async addEditPromotions(body) {
        try {
            console.log('\n\n', body.promotion_lang, '\n\n');
            let data = {
                promotional_text: body.promotion_lang.en,
                promotional_text_lang: JSON.stringify(body.promotion_lang),
                is_active: 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if (body.promotional_id) {
                data.created_date = body.created_date
                data.promotional_id = body.promotional_id;
                // data.created_date = body.created_date;

            }
            let result = await db.upsert('mst_promotional', data, 'promotional_id');
            return result;
        } catch (error) {
            throw error;
        }
    }

    async promotionStatusUpdate(body) {
        try {
            let data = {
                is_active: body.is_active,
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let condition = ` promotional_id = ${body.promotional_id}`;
            let result = await db.update('mst_promotional', condition, data);
            return result;
        } catch (error) {
            throw error
        }
    }


    async getPromotions(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(promotional_text) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            };
            let data = await db.select('mst_promotional', selectParams, where + pagination);
            let totalCount = await db.select('mst_promotional', `COUNT(*)`, where);
            return { data, total: totalCount[0].count }
        } catch (error) {
            throw error
        }
    }

    async isPromotionExist(body) {
        try {
            let selectParams = ` * `,
                where = ` promotional_id = ${body.promotional_id} `;
            let data = await db.select('mst_promotional', selectParams, where);
            console.log('-------->>>>>>>>>>>>>\n\n', data);
            return data
        } catch (error) {
            throw error
        }
    }
}

module.exports = new PromotionHelper()