const complexHelper = require('../helpers/complexHelper')
const complexValidator = require('../validators/complexValidator')
const responseHelper = require('../../utils/responseHelper')

/**
 * This Complex class contains Complex Add Edit and status change related APIs
 */


class Complex {

    /**
     * Add complex API
     * @param {string} complex_name_lang  complex name in multiple languages
     * @param {string} location  location
     * @param {double} latitude  latitude
     * @param {double} longitude longitude
     * @param {integer} building_id building id
     * @returns success response with Complex Detail
     * @date 2020-01-06
     */

    async addComplex(req, res) {
        try {            
            delete req.body['user_id'];
            await complexValidator.addEditComplexValidator(req.body);
            // await buildingHelper.isBuildingExist(req.body);                                              
            await complexHelper.insertComplexBuilding(req.body);
            responseHelper.success(res, 'ADD_BUILDING_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


    /**
     * Add Edit and Status Change Related Bike Brand API
     * @param {string} complex_name_lang  complex name in multiple languages
     * @param {string} location  location
     * @param {double} latitude  latitude
     * @param {double} longitude longitude
     * @param {integer} building_id building id
     * @returns success response with Complex Detail
     * @date 2020-01-06
     */

    async addEditComplex(req, res) {
        try {
            delete req.body['user_id'];
            if ('is_active' in req.body) {
                await complexValidator.complexStatusUpdateValidator(req.body);
            } else {
                await complexValidator.addEditComplexValidator(req.body);
            }
            // console.log("complex_name_lang",JSON.parse(req.body.complex_name_lang))
            if(req.body.complex_name_lang){
                let jsCom = JSON.parse(req.body.complex_name_lang);
                // console.log("complex_name_lang",jsCom.en)
                req.body['complex_name'] = jsCom.en;
            }
           
            let complexData = await complexHelper.isComplexExist(req.body, ('complex_id' in req.body) ? true : false);
            console.log("complexData ::: ", complexData);
            if (complexData.length > 0) {
                req.body['created_date'] = complexData[0].created_date;
            }
            if ('is_active' in req.body) {
                req.body['complex_name'] = complexData[0].complex_name;
                req.body['complex_name_lang'] = complexData[0].complex_name_lang;
                req.body['no_of_buildings'] = complexData[0].no_of_buildings;
            }
            let lastInsertedId = await complexHelper.addEditComplex(req.body);
            console.log("====================================lastInsertedId", lastInsertedId);
            req.body['complex_id'] = lastInsertedId.rows[0].complex_id;
            if (req.body.hasChangeInBuildings === true && 'complex_id' in req.body) {
                await complexHelper.unbindBuildingsFromComplex(req.body);
                await complexHelper.bindBuildingsWithComplexId(req.body);
            }
            if ('complex_id' in req.body && !"is_active" in req.body) {
                await complexHelper.bindBuildingsWithComplexId(req.body);
            }
            responseHelper.success(res, ('is_active' in req.body) ? 'COMPLEX_UPDATED_SUCCESS' : ('complex_id' in req.body) ? 'EDIT_COMPLEX_SUCCESS' : 'ADD_COMPLEX_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


    /**
     * Get Complex list API
     * @param {string} complex_name  search complex_name
     * @returns success response with All complex details
     * @date 2020-01-06
     */

    async getComplexList(req, res) {
        try {
            delete req.body['user_id'];
            await complexValidator.getComplexListValidator(req.body);
            let response = await complexHelper.getComplexList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    
    /**
     * Complex bind in building API
     * @param {string} complex_id  complex id
     * @returns success response with changes complex data
     * @date 2020-01-06
     */

    async getBindBuildingIds(req, res) {
        try {
            delete req.body['user_id'];
            await complexValidator.getBindBuildingIds(req.body);
            let response = await complexHelper.getBindBuildingIds(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', '');
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

}

module.exports = new Complex();