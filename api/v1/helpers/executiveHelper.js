const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const md5 = require('md5')

/**
 * This ComplexHelper class contains complex add edit retrieve and status changes related API's logic and required database operations.
*/

class ExecutiveHelper {

    async getExecutiveList(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 and provider_type = ${body.type}`,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(full_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            let data = await db.select('service_provider', selectParams, where + pagination),
                totalCount = await db.select('service_provider', `COUNT(*)`, where)
            return { data, total: totalCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getExecutiveListWithRelations(body) {
        try {
            let selectParams = ` a.*, b.supervisor_executive_relation_id, c.full_name as boss_full_name, c.service_provider_id as boss_id `,
                join = ` JOIN supervisor_executive_relation as b on a.service_provider_id = b.executive_id JOIN service_provider as c on c.service_provider_id = b.supervisor_id `,
                where = ` 1=1 and a.provider_type = ${body.type}`,
                pagination = ` ORDER BY a.created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(a.full_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            let data = await db.select('service_provider as a' + join, selectParams, where + pagination),
                totalCount = await db.select('service_provider as a ' + join, `COUNT(*)`, where)
            return { data, total: totalCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getSupervisorList(body) {
        try {
            let selectParams = ` a.*, b.topsupervisor_supervisor_relation_id, c.full_name as boss_full_name, c.service_provider_id as boss_id `,
                join = ` JOIN topsupervisor_supervisor_relation as b on a.service_provider_id = b.supervisor_id JOIN service_provider as c on c.service_provider_id = b.top_supervisor_id `,
                where = ` 1=1 and a.provider_type = ${body.type}`,
                pagination = ` ORDER BY a.created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(a.full_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            let data = await db.select('service_provider as a' + join, selectParams, where + pagination),
                totalCount = await db.select('service_provider as a ' + join, `COUNT(*)`, where)
            return { data, total: totalCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getServiceProviderList(body) {
        try {
            let selectParams = ` service_provider_id, full_name, email `,
                where = ` 1=1 and provider_type = ${body.type}`;
            let data = await db.select('service_provider', selectParams, where)
            return data
        } catch (error) {
            return promise.reject(error)
        }
    }

    async addEditExecutive(body) {
        try {
            
            let data = {
                full_name: body.full_name,
                full_name_lang: (body.name),
                country_code: body.country_code,
                phone_number: body.phone_number,
                password: body.password != undefined ? md5(body.password) : body.enc_pass,
                email: body.email,
                has_vehicle: body.has_vehicle,
                no_of_jobs: body.no_of_jobs,
                // profile_picture:body.profile_picture,
                // id_proof:body.id_proof,
                location: body.location,
                latitude: body.latitude,
                longitude: body.longitude,
                provider_type: body.type ? body.type : 1,
                is_active: ('is_active') in body ? body.is_active : 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp(),
            }

            if ('profile_picture' in body) {
                data['profile_picture'] = body.profile_picture;
            }
            if ('id_proof' in body) {
                data['id_proof'] = body.id_proof;
            }

            if ('service_provider_id' in body) {
                data['service_provider_id'] = body.service_provider_id;
                data['created_date'] = body.created_date;

            }
            let service_provider_id = await db.upsert('service_provider', data, 'service_provider_id');
            return { service_provider_id: service_provider_id.rows[0].service_provider_id || body.service_provider_id }
        } catch (error) {

            return promise.reject(error)
        }
    }

    async addEditSupervisor(body) {
        try {

            let data = {
                full_name: body.full_name,
                full_name_lang: (body.name),
                country_code: body.country_code,
                phone_number: body.phone_number,
                password: body.password != undefined ? md5(body.password) : body.enc_pass,
                email: body.email,
                has_vehicle: body.has_vehicle,
                // no_of_jobs :null,
                // profile_picture:body.profile_picture,
                // id_proof:body.id_proof,
                // location: null,
                // latitude: null,
                // longitude: null,
                provider_type: 2,
                is_active: ('is_active') in body ? body.is_active : 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp(),
            }

            if ('profile_picture' in body) {
                data['profile_picture'] = body.profile_picture;
            }
            if ('id_proof' in body) {
                data['id_proof'] = body.id_proof;
            }

            if ('service_provider_id' in body) {
                console.log('\n\nSERVICE PROVIDER ID=>>>>>>>>>. ', body.service_provider_id)
                data['service_provider_id'] = body.service_provider_id;
                data['created_date'] = body.created_date;
            }

            let service_provider_id = await db.upsert('service_provider', data, 'service_provider_id');
            return { service_provider_id: service_provider_id.rows[0].service_provider_id || body.service_provider_id }
        } catch (error) {

            return promise.reject(error)
        }
    }

    async addEdittopSupervisor(body) {
        try {
            console.log(body);
            let data = {
                full_name: body.full_name,
                full_name_lang: (body.name),
                country_code: body.country_code,
                phone_number: body.phone_number,
                password: body.password != undefined ? md5(body.password) : body.enc_pass,
                email: body.email,
                has_vehicle: body.has_vehicle,
                // no_of_jobs :null,
                // profile_picture:body.profile_picture,
                // id_proof:body.id_proof,
                // location: null,
                // latitude: null,
                // longitude: null,
                provider_type: 3,
                is_active: ('is_active') in body ? body.is_active : 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp(),
            }

            if ('profile_picture' in body) {
                data['profile_picture'] = body.profile_picture;
            }
            if ('id_proof' in body) {
                data['id_proof'] = body.id_proof;
            }

            if ('service_provider_id' in body) {
                data['service_provider_id'] = body.service_provider_id;
                data['created_date'] = body.created_date;
            }

            let service_provider_id = await db.upsert('service_provider', data, 'service_provider_id');
            return service_provider_id
        } catch (error) {
            return promise.reject(error)
        }
    }

    async isExecutiveExist(body, flag) { // true = edit complex , false = add complex
        try {
            console.log("\n\n\n\n\n", flag == true ? 'Edit Executive' : 'Add Executive');
            let selectParams = "*",
                where = ` full_name = '${body.full_name}' `;

            if (flag) {
                where = ` full_name = '${body.full_name}' AND service_provider_id <> ${body.service_provider_id} `;
            }
            let service_provider = await db.select('service_provider', selectParams, where)
            console.log("service_provider ::: ", service_provider);
            if (service_provider.length > 0) {
                throw 'EXECUTIVE_EXIST'
            } else if (flag == false && service_provider.length == 0) {
                return [];
            }
            else {
                where = ` service_provider_id = ${body.service_provider_id} `;
                service_provider = await db.select('service_provider', selectParams, where);
                console.log("Return :::::::: ", service_provider[0]);
                return service_provider;
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async executiveStatusUpdate(service_provider_id, flag, key) {
        try {
            let where = ` service_provider_id = ${service_provider_id} `,
                data = {
                    [key]: flag,
                    modified_date: dateHelper.getCurrentTimeStamp()
                },
                result = await db.update('service_provider', where, data)
            if (result.rowCount === 0) {
                throw 'EXECUTIVE_DATA_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }

    async addEditSupervisor_topSupervisorRelation(body) {
        try {
            console.log("====>>>>>", body)
            let data = {
                supervisor_id: body.supervisor_id,
                top_supervisor_id: body.boss_id,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if ('topsupervisor_supervisor_relation_id' in body) {
                data.created_date = body.rel_created_date,
                    data.topsupervisor_supervisor_relation_id = body.topsupervisor_supervisor_relation_id
            }
            let response = await db.upsert('topsupervisor_supervisor_relation', data, 'topsupervisor_supervisor_relation_id');
            return response
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }

    async addEditSupervisor_ExecutiveRelation(body) {
        try {
            console.log("====>>>>>", body)
            let data = {
                supervisor_id: body.boss_id,
                executive_id: body.executive_id,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if ('supervisor_executive_relation_id' in body) {
                data.created_date = body.rel_created_date,
                    data.supervisor_executive_relation_id = body.supervisor_executive_relation_id
            }
            let response = await db.upsert('supervisor_executive_relation', data, 'supervisor_executive_relation_id');
            return response
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }

    async isSupervisor_topSupervisorRelationExist(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 and topsupervisor_supervisor_relation_id = ${body.topsupervisor_supervisor_relation_id} `;
            let data = await db.select('topsupervisor_supervisor_relation', selectParams, where)
            console.log('\n\n\n\n=================================================== RELATION')
            console.log(data);
            console.log('\n\n============================================\n\n');
            return data
        } catch (error) {
            throw error
        }
    }

    async isSupervisor_executiveRelationExist(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 and supervisor_executive_relation_id = ${body.supervisor_executive_relation_id} `;
            let data = await db.select('supervisor_executive_relation', selectParams, where)
            console.log('\n\nRELATION\n\n'.data);
            return data
        } catch (error) {
            throw error
        }
    }

    async deleteServiceProvider(body) {
        try {
            let where = ` 1=1 and service_provider_id = ${body.service_provider_id} `;
            let data = await db.delete('service_provider', where)
            console.log('\n\nRELATION\n\n'.data);
            return data
        } catch (error) {
            throw error
        }
    }

}

module.exports = new ExecutiveHelper()