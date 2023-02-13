const executiveHelper = require('../helpers/executiveHelper')
const executiveValidator = require('../validators/executiveValidator')
const responseHelper = require('../../utils/responseHelper')
const S3helper = require('../../utils/S3helper')
const mailHelper = require('../../utils/mailHelper')
/**
 * This Executive class contains Executive Add Edit and status change related APIs
 */


class Executive {

    /**
     * Add Edit and Status Change Related Executive API
     * @param {string} full_name  full name in multiple languages
     * @param {string} country_code  country code
     * @param {string} mobile_number  Mobile number
     * @param {string} password  password
     * @param {string} email  email
     * @param {string} no_of_jobs  no of jobs
     * @param {string} profile_picture  Profile Picture
     * @param {string} id_proof  ID Proof 
     * @param {string} location  location
     * @param {double} latitude  latitude
     * @param {double} longitude longitude
     * @param {integer} building_id building id
     * @returns success response with Complex Detail
     * @date 2020-01-17
     */

    async addEditExecutive(req, res) {
        try {
            delete req.body['user_id'];
            if ('is_active' in req.body) {
                await executiveValidator.complexStatusUpdateValidator(req.body);
            } else {
                await executiveValidator.addEditExecutiveValidator(req.body);
            }
            // console.log("complex_name_lang",JSON.parse(req.body.complex_name_lang))
            if ('name' in req.body) {
                let jsCom = JSON.parse(req.body.name);
                // console.log("complex_name_lang",jsCom.en)
                req.body['full_name'] = jsCom.en;
            }

            if (req.files && req.files !== 'undefined' && Object.keys(req.files).length > 0) {
                req.body['profile_picture'] = await S3helper.uploadImageOnS3("tekoto/executive/profilePicture/", req.files['profile_picture'][0])
                req.body['id_proof'] = await S3helper.uploadImageOnS3("tekoto/executive/idProof/", req.files['id_proof'][0])

            }
            let executiveData = await executiveHelper.isExecutiveExist(req.body, ('service_provider_id' in req.body) ? true : false);
            if (executiveData.length > 0) {
                req.body['created_date'] = executiveData[0].created_date;
                if(!req.body.password) {
                    req.body['enc_pass'] = executiveData[0].password;
                } 
            }
            if ('is_active' in req.body) {
                req.body['full_name'] = executiveData[0].full_name;
                req.body['name_lang'] = executiveData[0].complex_name_lang;
                req.body['no_of_buildings'] = executiveData[0].no_of_buildings;
            }
            console.log('123123123123123123132132123', req.body)
            let lastInsertedId = await executiveHelper.addEditExecutive(req.body);
            req.body['executive_id'] = lastInsertedId.service_provider_id

            if (req.body.supervisor_executive_relation_id) {
                let rel = await executiveHelper.isSupervisor_executiveRelationExist(req.body)
                if (rel.length > 0) {
                    req.body['rel_created_date'] = rel[0].created_date
                }
            }
            await executiveHelper.addEditSupervisor_ExecutiveRelation(req.body);
            if(executiveData.length > 0) {
                // await mailHelper.sendServiceProviderMail(req.body.email)
            } 
            responseHelper.success(res, ('is_active' in req.body) ? 'EXECUTIVE_UPDATED_SUCCESS' : ('service_provider_id' in req.body) ? 'EDIT_EXECUTIVE_SUCCESS' : 'ADD_EXECUTIVE_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async addEditTopSupervisor(req, res) {
        try {
            delete req.body['user_id'];
            if ('is_active' in req.body) {
                await executiveValidator.complexStatusUpdateValidator(req.body);
            } else {
                await executiveValidator.addEditSupervisorValidator(req.body);
            }
            // console.log("complex_name_lang",JSON.parse(req.body.complex_name_lang))
            if ('name' in req.body) {
                let jsCom = JSON.parse(req.body.name);
                // console.log("complex_name_lang",jsCom.en)
                req.body['full_name'] = jsCom.en;
            }

            if (req.files && req.files !== 'undefined' && Object.keys(req.files).length > 0) {
                req.body['profile_picture'] = await S3helper.uploadImageOnS3("tekoto/supervisor/profilePicture/", req.files['profile_picture'][0])
                req.body['id_proof'] = await S3helper.uploadImageOnS3("tekoto/supervisor/idProof/", req.files['id_proof'][0])

            }
            let supervisorData = await executiveHelper.isExecutiveExist(req.body, ('service_provider_id' in req.body) ? true : false);
            if (supervisorData.length > 0) {
                req.body['created_date'] = supervisorData[0].created_date;
                if(!req.body.password) {
                    req.body['enc_pass'] = supervisorData[0].password;
                }
            }
            if ('is_active' in req.body) {
                req.body['full_name'] = supervisorData[0].full_name;
                req.body['name_lang'] = supervisorData[0].complex_name_lang;
                req.body['no_of_buildings'] = supervisorData[0].no_of_buildings;
            }
            let lastInsertedId = await executiveHelper.addEdittopSupervisor(req.body);
            if(supervisorData.length > 0) {
                // await mailHelper.sendServiceProviderMail(req.body.email)
            }
            responseHelper.success(res, ('is_active' in req.body) ? 'SUPERVISOR_UPDATED_SUCCESS' : ('service_provider_id' in req.body) ? 'EDIT_SUPERVISOR_SUCCESS' : 'ADD_SUPERVISOR_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async addEditSupervisor(req, res) {
        try {
            delete req.body['user_id'];
            if ('is_active' in req.body) {
                await executiveValidator.complexStatusUpdateValidator(req.body);
            } else {
                await executiveValidator.addEditSupervisorValidator(req.body);
            }
            // console.log("complex_name_lang",JSON.parse(req.body.complex_name_lang))
            if ('name' in req.body) {
                let jsCom = JSON.parse(req.body.name);
                // console.log("complex_name_lang",jsCom.en)
                req.body['full_name'] = jsCom.en;
            }

            if (req.files && req.files !== 'undefined' && Object.keys(req.files).length > 0) {
                req.body['profile_picture'] = await S3helper.uploadImageOnS3("tekoto/supervisor/profilePicture/", req.files['profile_picture'][0])
                req.body['id_proof'] = await S3helper.uploadImageOnS3("tekoto/supervisor/idProof/", req.files['id_proof'][0])

            }
            let supervisorData = await executiveHelper.isExecutiveExist(req.body, ('service_provider_id' in req.body) ? true : false);
            if (supervisorData.length > 0) {
                req.body['created_date'] = supervisorData[0].created_date;
                if(!req.body.password) {
                    req.body['enc_pass'] = supervisorData[0].password;
                }
            }
            if ('is_active' in req.body) {
                req.body['full_name'] = supervisorData[0].full_name;
                req.body['name_lang'] = supervisorData[0].complex_name_lang;
                req.body['no_of_buildings'] = supervisorData[0].no_of_buildings;
            }
            let lastInsertedId = await executiveHelper.addEditSupervisor(req.body);
            req.body['supervisor_id'] = lastInsertedId.service_provider_id

            if (req.body.topsupervisor_supervisor_relation_id) {
                let rel = await executiveHelper.isSupervisor_topSupervisorRelationExist(req.body)
                if (rel.length > 0) {
                    req.body['rel_created_date'] = rel[0].created_date
                }
            }
            await executiveHelper.addEditSupervisor_topSupervisorRelation(req.body);
            if(supervisorData.length > 0) {
                // await mailHelper.sendServiceProviderMail(req.body.email)
            }
            responseHelper.success(res, ('is_active' in req.body) ? 'SUPERVISOR_UPDATED_SUCCESS' : ('service_provider_id' in req.body) ? 'EDIT_SUPERVISOR_SUCCESS' : 'ADD_SUPERVISOR_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


    /**
     * Get Executive list API
     * @param {string} complex_name  search complex_name
     * @returns success response with All complex details
     * @date 2020-01-20
     */

    async getExecutiveList(req, res) {
        try {
            delete req.body['user_id'];
            await executiveValidator.getExecutiveListValidator(req.body);
            let response = await executiveHelper.getExecutiveList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async getExecutiveListWithRelations(req, res) {
        try {
            delete req.body['user_id'];
            await executiveValidator.getExecutiveListValidator(req.body);
            let response = await executiveHelper.getExecutiveListWithRelations(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async getServiceProviderList(req, res) {
        try {
            delete req.body['user_id'];
            // await executiveValidator.getExecutiveListValidator(req.body);
            let response = await executiveHelper.getServiceProviderList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


    /**
     * Status change for executive Api 
     * @param {integer} executive_id  executive id
    * @param {integer} is_active  is_active
    * @returns success response with executive Status 
    * @date 2020-01-20
    */


    async executiveStatusUpdate(req, res) {
        try {
            delete req.body['user_id'];
            await executiveValidator.executiveStatusUpdateValidator(req.body);
            await executiveHelper.executiveStatusUpdate(req.body.service_provider_id, req.body.is_active, 'is_active');
            responseHelper.success(res, 'EXECUTIVE_STATUS_UPDATED_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async getSupervisors(req, res) {
        try {
            delete req.body['user_id'];
            await executiveValidator.getExecutiveListValidator(req.body);
            let response = await executiveHelper.getSupervisorList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async deleteServiceProvider(req, res) {
        try {
            delete req.body['user_id'];
            await executiveValidator.deleteServiceProviderRequest(req.body);
            let response = await executiveHelper.deleteServiceProvider(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }
}

module.exports = new Executive();