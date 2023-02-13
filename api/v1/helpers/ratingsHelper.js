const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')
const codeHelper = require('../../utils/codeHelper')
const notificationHelperApp = require('../../utils/notificationHelperApp')

/**
 * This RatingsHelper class contains all ratings related API's logic and required database operations. This class' functions are called from ratings controller.
 */

class RatingsHelper {
    async getRatingsReasons(body, language) {
        try {
            let selectParams = `category_id, category_name_lang->>'${language}' AS category_name `,
                where = ` '${body.ratings}' = ANY (string_to_array(ratings,',')) and is_active = 1 `
            let reasons = await db.select('mst_ticket_categories', selectParams, where)
            return reasons
        } catch (error) {
            return promise.reject(error)
        }
    }
    async giveRatings(body) {
        try {
            let data = {
                customer_id: body.user_id,
                vehicle_id: body.vehicle_id,
                vehicle_wash_id: body.vehicle_wash_id,
                executive_id: body.executive_id,
                supervisor_id: body.supervisor_id,
                top_supervisor_id: body.top_supervisor_id,
                ratings: body.ratings,
                wash_type: body.wash_type,
                vehicle_wash_date: body.vehicle_wash_date,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if (body.ratings < 5 && body.category_id != '') {
                data.category_id = body.category_id
            }
            let review = await db.insert('vehicle_wash_review', data)
            data = {
                has_reviewed: 1,
                vehicle_wash_review_id: review.vehicle_wash_review_id,
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let where = ` vehicle_wash_id = ${body.vehicle_wash_id}`
            await db.update('vehicle_wash_active_week', where, data)
            await db.custom(`UPDATE service_provider SET total_ratings = total_ratings + ${body.ratings}, no_of_ratings = no_of_ratings + 1 WHERE service_provider_id = ${body.executive_id}`)
            // let supervisor = await db.select('supervisor_executive_relation', 'supervisor_id', `executive_id = ${body.executive_id}`)
            await db.custom(`UPDATE service_provider SET total_ratings = total_ratings + ${body.ratings}, no_of_ratings = no_of_ratings + 1 WHERE service_provider_id = ${body.supervisor_id}`)
            // let top_supervisor = await db.select('topsupervisor_supervisor_relation', 'top_supervisor_id', `supervisor_id = ${supervisor[0].supervisor_id}`)
            await db.custom(`UPDATE service_provider SET total_ratings = total_ratings + ${body.ratings}, no_of_ratings = no_of_ratings + 1 WHERE service_provider_id = ${body.top_supervisor_id}`)
            return review
        } catch (error) {
            return promise.reject(error)
        }
    }
    async generateTicket(body, language) {
        try {
            if (body.ratings < 5 && body.wash_type == 1) {  // generate ticket only for exterior wash because can't assign ticket for interior wash
                let vehicle_wash_date_time = new Date(body.vehicle_wash_date + ' ' + body.end_time),
                    vehicle_wash_timestamp = vehicle_wash_date_time.getTime() / 1000,
                    current_timestamp = dateHelper.getCurrentTimeStamp(),
                    diffTime = current_timestamp - vehicle_wash_timestamp
                // console.log("0000>>>", vehicle_wash_date_time)
                // console.log("1111>>>", vehicle_wash_timestamp)
                // console.log("2222>>>", current_timestamp)
                // console.log("3333>>>", diffTime)
                if (diffTime <= 24 * 60 * 60) {   // If review time is under 1 day of vehicle wash time, then generate ticket
                    console.log(":::Generate Ticket:::")
                    let data = {
                        // category_id: body.category_id,
                        is_resolved: 0,
                        vehicle_wash_id: body.vehicle_wash_id,
                        customer_id: body.user_id,
                        executive_id: body.executive_id,
                        supervisor_id: body.supervisor_id,
                        top_supervisor_id: body.top_supervisor_id,
                        ratings: body.ratings,
                        created_date: dateHelper.getCurrentTimeStamp(),
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                    if(body.category_id != '') {
                        data.category_id = body.category_id
                    }
                    let ticket = await db.insert('user_ticket', data)
                    data = {
                        ticket_id: ticket.ticket_id,
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                    let where = ` vehicle_wash_id = ${body.vehicle_wash_id}`
                    await db.update('vehicle_wash_active_week', where, data)
                    //-------------- Notification------------------
                    let unique_id = codeHelper.getUniqueCode()
                    let notification_data = notificationHelperApp.insertNotification(ticket.ticket_id, 'TICKET_RAISED_TITLE', 'TICKET_RAISED_TEXT', body.user_id, body.supervisor_id, 4, unique_id, language, 'service_provider_notifications', 1)
                    notificationHelperApp.sendNotification(notification_data, 'service_provider_notifications', 'service_provider_notification_id', 'service_provider_device_relation', 'service_provider_id')
                    //---------------------------------------------
                    return true
                } else {
                    console.log(":::Don't Generate Ticket:::")
                    return true
                }
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new RatingsHelper()