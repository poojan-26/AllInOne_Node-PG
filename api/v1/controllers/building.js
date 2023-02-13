const buildingHelper = require('../helpers/buildingHelper')
const buildingValidator = require('../validators/buildingValidator')
const responseHelper = require('../../utils/responseHelper')

/**
 * This Building class contains Building Add Edit Update and Status change related APIs
 */

class Building { 

    /**
     * Add Building API
     * @param {string} building_name_lang  building name in multiple languages
     * @param {string} location  location
     * @param {integer} latitude  latitude
     * @param {integer} longitude  longitude
     * @param {integer} has_demo  has_demo
     * @returns success response with Building Detail
     * @date 2020-01-10
     */

    async addBuilding(req, res) {
       
        try {            
            delete req.body['user_id'];
            await buildingValidator.addBuildingValidator(req.body);
            await buildingHelper.isBuildingExist(req.body);
            await buildingHelper.insertBuilding(req.body);
            responseHelper.success(res, 'ADD_BUILDING_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }  
    
    /**
     * Update Building API
     * @param {string} building_name_lang  building name in multiple languages
     * @param {string} location  location
     * @param {integer} latitude  latitude
     * @param {integer} longitude  longitude
     * @param {integer} has_demo  has_demo
     * @returns success response with Building Updated Detail
     * @date 2020-01-10
     */

    async editBuilding(req, res) {
        try {
            delete req.body['user_id'];
            await buildingValidator.editBuildingValidator(req.body);
            await buildingHelper.isBuildingExistById(req.body);
            await buildingHelper.updateBuilding(req.body);
            responseHelper.success(res, 'EDIT_BUILDING_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }  
    
    /**
     * Status change for building Api 
     * @param {integer} building_id  building_id
     * @param {integer} is_active  is_active
     * @returns success response with Building Status 
     * @date 2020-01-10
     */

    async buildingStatusUpdate(req, res) {
        try {
            delete req.body['user_id'];
            await buildingValidator.buildingStatusUpdateValidator(req.body);
            await buildingHelper.isBuildingExistById(req.body);
            await buildingHelper.buildingStatusUpdate(req.body.building_id, req.body.is_active, 'is_active');
            responseHelper.success(res, 'BUILDING_STATUS_UPDATED_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    } 
    
     /**
     * Get  building list API
     * @param {string} building_name  search building_name
     * @returns success response with All building details
     * @date 2020-01-09
     */

    async getBuildingList(req, res) {
        try {
            delete req.body['user_id'];
            await buildingValidator.getBuildingListValidator(req.body);
            let response = await buildingHelper.getBuildingList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

}

module.exports = new Building()