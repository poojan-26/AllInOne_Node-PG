const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This BuildingValidator class contains building add edit list related API's validation.
 */


class BuildingValidator {
    async addBuildingValidator(body) {
        try {
            let schema = joi.object().keys({
                building_name_lang: joi.optional(),
                // building_name_lang: joi.object().keys({
                //     en: joi.string().label('Enter building name English').required(),
                //     tr: joi.string().label('Enter building name Turkish').required(),
                //     fa: joi.string().label('Enter building name Farsi').required(),
                //     ar: joi.string().label('Enter building name Arabic').required()
                //   }).required(),

                location: joi.string().trim().required(),
                latitude: joi.number().required(),
                longitude: joi.number().required(),
                has_demo: joi.number().required(),
                Cbuidings :joi.array()             
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }    

    async editBuildingValidator(body) {
        try {
            let schema = joi.object().keys({
                building_id: joi.number().required(),
                building_name_lang: joi.optional(),
                // building_name_lang: joi.object().keys({
                //     en: joi.string().label('Enter building name English').required(),
                //     tr: joi.string().label('Enter building name Turkish').required(),
                //     fa: joi.string().label('Enter building name Farsi').required(),
                //     ar: joi.string().label('Enter building name Arabic').required()
                //   }).required(),
                location: joi.string().trim().required(),
                latitude: joi.number().required(),
                longitude: joi.number().required(),
                has_demo: joi.number().required()                
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }    

    async buildingStatusUpdateValidator(body) {
        try {
            let schema = joi.object().keys({
                building_id: joi.number().required(),
                is_active: joi.number().valid(1,0).required()                                
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }   
    
    
    async getBuildingListValidator(body) {
        try {
            let schema = joi.object().keys({
                search: joi.string().optional(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required(),
                getAllBuildingNameList: joi.boolean().optional(), // With IS NULL 
                getAllList:joi.boolean().optional()               // For all data
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new BuildingValidator()