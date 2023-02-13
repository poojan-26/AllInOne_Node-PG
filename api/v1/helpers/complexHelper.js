const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')

/**
 * This ComplexHelper class contains complex add edit retrieve and status changes related API's logic and required database operations.
*/

class ComplexHelper {

    async getComplexList(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(complex_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            let data = await db.select('complex', selectParams, where + pagination),
                totalCount = await db.select('complex', `COUNT(*)`, where)
            return { data, total: totalCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async insertComplexBuilding(body) {
        try {

            console.log("insertBuilding insertBuilding Data :::: ",body)
            let data = {
                complex_name: body.building_name,
                location: body.location,
                latitude: +body.latitude,
                longitude: +body.longitude,
                has_demo: +body.has_demo,
                is_active: 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }

            console.log("Insert Data :::: ", data);
            let brand = await db.insert('complex', data)

           let Cbuidings = body.Cbuidings;
            let cnt
            if(Cbuidings.length > 0){
                console.log(Cbuidings)
                for(cnt=0;cnt<Cbuidings.length;cnt++)
                { 
                    let Cdatas = {
                        complex_id : brand.insertId,
                        building_name : smallAnswerText[cnt],
                        location : smallAnswerText[cnt],
                        latitude : smallAnswerText[cnt],
                        longitude : smallAnswerText[cnt],
                        largeAnswerText : largeAnswerText[cnt],
                        createdDate: dateHelper.getCurrentTimeStamp(),
                        modifiedDate: dateHelper.getCurrentTimeStamp()
                    }
                    await db.insert('building', Cdatas)
        
                } 
            }
            
            let priority_data = {
                priority: brand.insertId
            }
            let datas = await db.insert('job_company', data)
            return brand
        } catch (error) {
            return promise.reject(error)
        }
    }
    async addEditComplex(body) {
        try {
            let jsoBu = JSON.parse(body.complex_name_lang);

            let data = {
                complex_name: jsoBu.en,
                complex_name_lang: JSON.stringify(jsoBu),
                location: body.location,
                latitude: body.latitude,
                longitude: body.longitude,
                is_active: ('is_active') in body ? body.is_active : 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp(),
                no_of_buildings: ('is_active' in body) ? body.no_of_buildings : ('buildings' in body)? body.buildings.length : 0
            }
            if ('complex_id' in body) {
                data['complex_id'] = body.complex_id;
                data['created_date'] = body.created_date;
            }
            let complex = await db.upsert('complex', data, 'complex_id');
            console.log("\n\n\n\n\n\n==========================================complex :::", complex);
            return complex
        } catch (error) {
            return promise.reject(error)
        }
    }

    async isComplexExist(body, flag) { // true = edit complex , false = add complex
        try {
            console.log("\n\n\n\n\n", flag == true ? 'Edit complex' : 'Add complex');
            let selectParams = "*",
                where = ` complex_name = '${body.complex_name}' `;

            if (flag) {
                where = ` complex_name = '${body.complex_name}' AND complex_id <> ${body.complex_id} `;
            }
            let complex = await db.select('complex', selectParams, where)
            console.log("complex ::: ", complex);
            if (complex.length > 0) {
                throw 'COMPLEX_EXIST'
            } else if (flag == false && complex.length == 0) {
                return [];
            }
            else {
                where = ` complex_id = ${body.complex_id} `;
                complex = await db.select('complex', selectParams, where);
                console.log("Return :::::::: ", complex[0]);
                return complex;
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async unbindBuildingsFromComplex(body) {
        try {
            let complex = await db.custom(`UPDATE building SET complex_id = NULL WHERE complex_id = ${body.complex_id}`)
            return complex
        } catch (error) {
            return promise.reject(error)
        }
    }


    async bindBuildingsWithComplexId(body) {
        try {
            console.log("Before ::: ", body.buildings);
            let filterData = '(';
            for (let i = 0; i < body.buildings.length; i++) {
                if (i > 0) {
                    filterData += ', ';
                }
                filterData += body.buildings[i];
            }
            filterData += ')';
            console.log("filterData ::: ", filterData);
            // let buildings = body.buildings.toString().split(/[\{\[]/).join('(').split(/[\}\]]/).join(')');
            let complex = await db.custom(`UPDATE building SET complex_id = ${body.complex_id} , modified_date = ${dateHelper.getCurrentTimeStamp()} WHERE building_id IN ${filterData}`)
            return complex
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getBindBuildingIds(body){
        try {
            let selectParams = ` building_id `,
            condition = ` complex_id = ${body.complex_id} `
            let data = await db.select('building', selectParams, condition)
            return {data};
        } catch (error) {
            return promise.reject(error)
        }
    }

    async insertBuilding(body) {
        try {
            let data = {
                building_name: body.building_name,
                location: body.location,
                latitude: +body.latitude,
                longitude: +body.longitude,
                has_demo: +body.has_demo,
                is_active: 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            console.log("Insert Data :::: ", data);
            let brand = await db.insert('building', data)
            return brand
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateBuilding(body) {
        try {
            let condition = ` building_id = ${body.building_id}`,
                data = {
                    building_name: body.building_name,
                    location: body.location,
                    latitude: +body.latitude,
                    longitude: +body.longitude,
                    has_demo: +body.has_demo,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            let result = await db.update('building', condition, data)
            if (result.rowCount === 0) {
                throw 'BUILDING_DATA_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async buildingStatusUpdate(building_id, flag, key) {
        try {
            let where = ` building_id = ${building_id} `,
                data = {
                    [key]: flag,
                    modified_date: dateHelper.getCurrentTimeStamp()
                },
                result = await db.update('building', where, data)
            if (result.rowCount === 0) {
                throw 'BUILDING_DATA_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }

    async getBuildingList(body) {
        try {
            let selectParams = `building_id, building_name, complex_id, location, latitude, longitude, 
                                has_demo, is_active, demo_id `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(building_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            let data = await db.select('building', selectParams, where + pagination),
                totalCount = await db.select('building', `COUNT(*)`, where)
            return { data, total: totalCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }

}

module.exports = new ComplexHelper()