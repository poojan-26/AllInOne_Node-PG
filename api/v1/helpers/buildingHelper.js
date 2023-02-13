const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')

/**
 * This BuildingHelper class contains Building add edit retrieve and status changes related API's logic and required database operations.
 */
class BuildingHelper {

    async selectBrands(body, is_admin) {
        try {
            let selectParams = "brands.*, vehicle_types.vehicle_type",
                joins = ` LEFT JOIN vehicle_types ON vehicle_types.id = brands.vehicle_type_id `,
                where = ` 1=1 `,
                pagination = ` ORDER BY brands.brand `
            if (body.for_drop_down || !is_admin) {
                where += ` AND brands.is_active=true `
            }
            if (body.page_no && body.limit) {
                pagination += ` LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            } else {
                where += ` AND brands.is_active=true `
            }
            if (body.vehicle_type_id) {
                where += ` AND brands.vehicle_type_id='${body.vehicle_type_id}' `
            }
            if (body.vehicle_type_id_array) {
                where += ` AND brands.vehicle_type_id IN (${body.vehicle_type_id_array.join(',')}) `
            }
            if (body.query_string && body.query_string.trim().length > 0) {
                where += ` AND LOWER(brand) LIKE LOWER('%${body.query_string.replace(/'/g, "''")}%') `
            }
            let brands = await db.select('brands' + joins, selectParams, where + pagination),
                brandsCount = await db.select('brands', `COUNT(*)`, where)
            return { brands, brandsCount: brandsCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectBrand(brand_id) {
        try {
            let selectParams = "*",
                where = ` id=${brand_id} `,
                brand = await db.select('brands', selectParams, where)
            if (brand.length === 0) {
                throw 'BRAND_WITH_ID_NOT_FOUND'
            } else {
                return brand[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertBuilding(body) {
        try {
            let jsoBu = JSON.parse(body.building_name_lang);
            let data = {
                building_name: jsoBu.en,
                building_name_lang: jsoBu,
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
            let jsoBu = JSON.parse(body.building_name_lang);
            let condition = ` building_id = ${body.building_id}`,
                data = {
                    building_name: jsoBu.en,
                    building_name_lang: JSON.stringify(jsoBu),
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

    async isBuildingExist(body) {
        try {
            let selectParams = "*",
                where = ` building_name = '${body.building_name}' AND latitude = ${body.latitude} AND longitude = ${body.longitude} `,
                building = await db.select('building', selectParams, where)
            if (building.length > 0) {
                throw 'BUILDING_ALREADY_EXIST'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async isBuildingExistById(body) {
        try {
            let selectParams = "*",
                where = ` building_id = ${body.building_id} `,
                building = await db.select('building', selectParams, where)
            if (building.length === 0) {
                throw 'BUILDING_DATA_NOT_FOUND'
            } else {
                return building[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getBuildingList(body) {
        try {
            let selectParams = `building_id, building_name, complex_id, location, latitude, longitude, 
                                has_demo, is_active, demo_id,building_name_lang `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(building_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            if ('getAllBuildingNameList' in body) {
                selectParams = ` building_id, building_name, complex_id `;
                where = ` complex_id IS NULL `;
                if('getAllList' in body){
                    where = '';
                }
                let data = await db.select('building', selectParams, where);                    
                return { data }
            } else {
                let data = await db.select('building', selectParams, where + pagination),
                    totalCount = await db.select('building', `COUNT(*)`, where)
                return { data, total: totalCount[0].count }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

}

module.exports = new BuildingHelper()