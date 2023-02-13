const promise = require('bluebird')
const db = require('../../utils/db')
const dateHelper = require('../../utils/dateHelper');

/**
 * This class contains configuration  edit, get related API's business logig.
*/

class CustomerHelper {

    async getCustomerList(body) {
        try {
            let selectParams = ` customer_id, full_name, phone_number, email, created_date, has_any_active_plan, is_active`,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`;
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(full_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%') OR phone_number LIKE '%${body.search.replace(/'/g, "''")}%'`
            };
            let data = await db.select('customer', selectParams, where + pagination),
                totalCount = await db.select('customer', `COUNT(*)`, where)
            return { data, total: totalCount[0].count };
        } catch (error) {
            return promise.reject(error)
        }
    }

    async customerStatusUpdate(body) {
        try {
            let condition = ` customer_id = ${body.customer_id}`,
                data = {
                    is_active: +body.is_active,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            let result = await db.update('customer', condition, data)
            if (result.rowCount === 0) {
                throw 'CUSOTMER_DATE_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async sendMessage(body) {
        try {
            let timestamp = dateHelper.getCurrentTimeStamp();
            let obj = {
                title: body.title,
                message: body.message,
                type: +body.type,
                created_date: timestamp,
                modified_date: timestamp
            }
            let messageData = await db.insert('admin_sent_messages', obj);                               
            const columns = '(message_id, customer_id, is_read, created_date, modified_date)',
            customerData = Array.isArray(body.customer_id) ? body.customer_id : JSON.parse(body.customer_id),
            values = customerData.map(customer_id =>(
                `(${messageData.message_id}, ${customer_id}, 0, ${timestamp}, ${timestamp})`
            )).join(',');            
            await db.bulkinsert('admin_message_customer_relation', columns, values, "","");
            return true;
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getCustomerData(customers){
        let qry = `SELECT customer_id, full_name, phone_number FROM customer WHERE customer_id in(${customers})`;
        console.log(qry);
        let data = await db.custom(qry);
        return data;
    }
}

module.exports = new CustomerHelper()