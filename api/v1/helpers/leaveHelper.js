const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')

/**
 * This LeaveHelper class contains all leave related API's logic and required database operations. This class' functions are called from leave controller.
 */

class LeaveHelper {
    async selectLeaves(executive_id, supervisor_id, language) {
        try {
            const selectParams = `executive_leaves.leave_id, to_char(executive_leaves.applied_date,'dd Mon, YYYY') applied_date, 
                                to_char(executive_leaves.applied_leave_date,'dd Mon, YYYY') applied_leave_date, 
                                executive_leaves.leave_status, sp.full_name_lang->>'${language}' AS full_name `,
                joins = ` LEFT JOIN service_provider sp ON sp.service_provider_id = executive_leaves.executive_id `,
                condition = executive_id ? ` executive_leaves.executive_id=${executive_id} ORDER BY executive_leaves.applied_leave_date DESC` : ` executive_leaves.supervisor_id=${supervisor_id} ORDER BY executive_leaves.leave_status`,
                leaves = await db.select('executive_leaves' + joins, selectParams, condition)
            return leaves
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectLeave(leave_id, language) {
        try {
            const selectParams = `executive_leaves.leave_id, executive_leaves.executive_id, to_char(executive_leaves.applied_date,'dd Mon, YYYY') applied_date, 
                                to_char(executive_leaves.applied_leave_date,'dd Mon, YYYY') applied_leave_date,
                                executive_leaves.leave_status, MAX(sp.full_name_lang->>'${language}') AS full_name, 
                                ARRAY_AGG(DISTINCT building.building_id) AS building_ids,
                                ARRAY_AGG(DISTINCT building.building_name) AS building_names,
                                ARRAY_AGG(vwaw.building_id) AS assigned_building_ids `,
                joins = ` LEFT JOIN service_provider sp ON sp.service_provider_id = executive_leaves.executive_id 
                        LEFT JOIN vehicle_wash_active_week vwaw ON (vwaw.executive_id = executive_leaves.executive_id 
                        AND vwaw.vehicle_wash_date = executive_leaves.applied_leave_date)
                        LEFT JOIN building ON building.building_id = vwaw.building_id     `,
                condition = ` leave_id=${leave_id} `,
                pagination = ` GROUP BY executive_leaves.leave_id, sp.full_name `,
                leaves = await db.select('executive_leaves' + joins, selectParams, condition + pagination)
            leaves[0].buildings = []
            if (leaves && leaves.length > 0) {
                leaves[0].building_ids.forEach((building_id, index) => {
                    if (building_id) {
                        let tm_count = 0
                        leaves[0].assigned_building_ids.forEach(b_id => {
                            if (building_id === b_id) {
                                tm_count += 1
                            }
                        })
                        leaves[0].buildings.push(
                            {
                                building_id: building_id,
                                building_name: leaves[0].building_names[index],
                                total_jobs: tm_count
                            }
                        )
                    }
                })
                leaves[0].total_jobs = leaves[0].assigned_building_ids.filter(building_id => building_id).length
                delete leaves[0].building_names
                delete leaves[0].assigned_building_ids
                return leaves[0]
            } else {
                throw 'NO_LEAVE_FOUND_WITH_ID'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectSubstituteExecutives(supervisor_id, leave, language) {
        try {
            const selectParams = ` DISTINCT supervisor_executive_relation.*, sp.full_name_lang->>'${language}' AS full_name, 
                                CASE WHEN sla.* IS NULL OR sla.date!='${leave.applied_leave_date}' THEN false ELSE true END AS is_assigned `,
                joins = ` LEFT JOIN service_provider sp ON sp.service_provider_id = supervisor_executive_relation.executive_id
                        LEFT JOIN substitute_leave_assign sla ON sla.substitute_id = supervisor_executive_relation.executive_id `,
                condition = ` supervisor_executive_relation.supervisor_id=${supervisor_id} AND sp.provider_type=4 `,
                substitute_executives = await db.select('supervisor_executive_relation' + joins, selectParams, condition)
            return substitute_executives
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectAvailableExecutives(supervisor_id, leave, language) {
        try {
            const selectParams = ` ser.*, MAX(sp.full_name_lang->>'${language}') AS full_name, 
                                ARRAY_AGG(DISTINCT to_char(el.applied_leave_date,'dd Mon, YYYY')) AS applied_leave_date, 
                                ejar.building_id, COUNT(vwaw.building_id) filter (where vwaw.vehicle_wash_date = '${leave.applied_leave_date}') as total_jobs`,
                joins = ` JOIN executive_job_assign_relation ejar ON (ejar.executive_id = ser.executive_id AND ejar.building_id=ANY(array[${leave.building_ids && leave.building_ids.length > 0 && leave.building_ids[0] ? leave.building_ids : 0}]))
                        LEFT JOIN vehicle_wash_active_week vwaw ON vwaw.executive_id = ser.executive_id
                        LEFT JOIN service_provider sp ON sp.service_provider_id = ser.executive_id
                        LEFT JOIN executive_leaves el ON ser.executive_id = el.executive_id`,
                condition = ` ser.supervisor_id=${supervisor_id} AND ser.executive_id != ${leave.executive_id}`,
                pagination = ` GROUP BY ser.supervisor_executive_relation_id,sp.full_name,ejar.building_id `
            let available_executives = await db.select('supervisor_executive_relation ser' + joins, selectParams, condition + pagination),
                final_response = []
            if (leave && leave.building_ids) {
                leave.buildings.forEach(building => {
                    if (building.building_id) {
                        final_response.push(
                            {
                                building_id: building.building_id,
                                building_name: building.building_name,
                                data: available_executives.filter(executive => executive.building_id === building.building_id)
                            }
                        )
                    }
                })
            }
            return final_response
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertLeave(body, supervisor_id) {
        try {
            const data = {
                executive_id: body.user_id,
                applied_date: dateHelper.getFormattedDate(),
                applied_leave_date: body.applied_leave_date,
                supervisor_id: supervisor_id,
                leave_status: 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let leave = await db.insert('executive_leaves', data)
            return leave
        } catch (error) {
            return promise.reject(error)
        }
    }
    async assignJobToSubstitute(body, leave) {
        try {
            const condition = ` executive_id=${leave.executive_id} AND vehicle_wash_date = '${leave.applied_leave_date}' `,
                data = {
                    executive_id: body.substitute_id,
                    executive_type: 4,
                    modified_date: dateHelper.getCurrentTimeStamp()
                },
                dataSubstistute = {
                    executive_id: leave.executive_id,
                    substitute_id: body.substitute_id,
                    date: leave.applied_leave_date
                },
                conditionLeave = ` leave_id=${leave.leave_id} `,
                dataLeave = {
                    leave_status: 4,
                    substitute_executive_id: body.substitute_id,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('vehicle_wash_active_week', condition, data)
            await db.update('executive_leaves', conditionLeave, dataLeave)
            await db.insert('substitute_leave_assign', dataSubstistute)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async assignJobToAvailableExecutive(body, leave) {
        try {
            const conditionLeave = ` leave_id=${leave.leave_id} `,
                dataLeave = {
                    leave_status: 4
                }
            for (let i = 0; i < body.jobs.length; i++) {
                const condition = ` vehicle_wash_id IN ( 
                        SELECT vehicle_wash_id FROM vehicle_wash_active_week 
                        WHERE executive_id=${leave.executive_id} AND building_id=${body.jobs[i].building_id} AND
                        vehicle_wash_date='${leave.applied_leave_date}' 
                        LIMIT ${body.jobs[i].assigned_jobs} 
                    ) `,
                    data = {
                        executive_id: body.jobs[i].executive_id,
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                await db.update('vehicle_wash_active_week', condition, data)
            }
            await db.update('executive_leaves', conditionLeave, dataLeave)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateLeaveStatus(leave_id, flag) {
        try {
            const condition = ` leave_id=${leave_id} `,
                data = {
                    leave_status: flag,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('executive_leaves', condition, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getAssociatedSupervisor(executive_id) {
        try {
            const selectParams = 'supervisor_id',
                condition = ` executive_id=${executive_id} `,
                supervisor = await db.select('supervisor_executive_relation', selectParams, condition)
            return supervisor[0]
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new LeaveHelper()