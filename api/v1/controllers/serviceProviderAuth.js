const serviceProviderAuthHelper = require('../helpers/serviceProviderAuthHelper')
const serviceProviderAuthValidator = require('../validators/serviceProviderAuthValidator')
const responseHelper = require('../../utils/responseHelper')
const codeHelper = require('../../utils/codeHelper')
const config = require('../../utils/config')
const smsHelper = require('../../utils/smsHelper')
const messages = require('../../utils/messages.json')
const S3helper = require('../../utils/S3helper')
const notificationHelperApp = require('../../utils/notificationHelperApp')

/**
 * This ServiceProviderAuth class contains Service Providers(Executive, Supervisor, Top-supervisor) account related APIs.
 */

class ServiceProviderAuth {
    /**
     * Service Provider signin API
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @param {string} password password
     * @returns success response(status code 200) with service provider's details
     */
    async signin(req, res) {
        try {
            let token_flag
            await serviceProviderAuthValidator.validateSigninForm(req.body)
            let user = await serviceProviderAuthValidator.isUserWithPhoneExist(req.body, false)
            await serviceProviderAuthValidator.validatePassword(user.password, req.body.password)
            if (user.provider_type == 1) {  // 1: executive
                token_flag = config.executive_flag
            } else if (user.provider_type == 2) {  // 2: Supervisor
                token_flag = config.supervisor_flag
            } else if (user.provider_type == 3) {  // 3: Top-supervisor
                token_flag = config.top_supervisor_flag
            } else if (user.provider_type == 4) {  //  4: sub executive
                token_flag = config.sub_executive_flag
            }
            let token = await codeHelper.getJwtToken(user.service_provider_id, token_flag)
            delete user.password
            delete user.otp
            delete user.full_name_lang
            delete user.id_proof
            // await serviceProviderAuthHelper.addOrUpdateUserDeviceRelation(user, req.headers)
            responseHelper.success(res, 'SIGNIN_SUCCESS', req.headers.language, user, { auth_token: token })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Forgot password API
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @returns success response(status code 200) by sending otp on registered mobile number
     */
    async forgotPassword(req, res) {
        try {
            await serviceProviderAuthValidator.validateForgotPasswordForm(req.body)
            let user = await serviceProviderAuthValidator.isUserWithPhoneExist(req.body, false)
            let otp = await codeHelper.getOTP()
            otp = '1234'   // this is only for testing purpose
            await serviceProviderAuthHelper.updateOTP(user.service_provider_id, otp)
            let phone_number = req.body.country_code.substring(1) + req.body.phone_number
            smsHelper.sendSMS(phone_number, messages[req.headers.language]['VERIFICATION_OTP'].replace('@@OTP@@', otp))
            responseHelper.success(res, 'FORGOT_PASSWORD_MSG_SENT', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language, {})
        }
    }
    /**
     * Resend OTP API
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @returns success response(status code 200) by sending new otp for verification
     */
    async resendOTP(req, res) {
        try {
            await serviceProviderAuthValidator.validateResendOTPForm(req.body)
            let user = await serviceProviderAuthValidator.isUserWithPhoneExist(req.body, false)
            let otp = await codeHelper.getOTP()
            otp = '1234'   // this is only for testing purpose
            await serviceProviderAuthHelper.updateOTP(user.service_provider_id, otp)
            let phone_number = req.body.country_code.substring(1) + req.body.phone_number
            smsHelper.sendSMS(phone_number, messages[req.headers.language]['VERIFICATION_OTP'].replace('@@OTP@@', otp))
            responseHelper.success(res, 'OTP_SENT', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language, {})
        }
    }
    /**
     * Reset password API
     * @param {string} new_password new password
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @param {string} otp otp which received after forgot password
     * @returns success response(status code 200) for resetting password
     */
    async resetPassword(req, res) {
        try {
            await serviceProviderAuthValidator.validateResetPasswordForm(req.body)
            let user = await serviceProviderAuthValidator.isUserWithPhoneExist(req.body, false)
            if (user.otp == Number(req.body.otp)) {
                await serviceProviderAuthHelper.resetPassword(user, req.body)
            } else {
                throw 'WRONG_OTP'
            }
            responseHelper.success(res, 'RESET_PASSWORD_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language, {})
        }
    }
    /**
     * Change password API
     * @param {string} old_password old password
     * @param {string} new_password new password
     * @returns success response(status code 200) for changing password
     */
    async changePassword(req, res) {
        try {
            await serviceProviderAuthValidator.validateChnagePasswordForm(req.body)
            let user = await serviceProviderAuthHelper.getServiceProviderProfile(req.body.user_id)
            await serviceProviderAuthValidator.validateOldPassword(user[0].password, req.body.old_password)
            await serviceProviderAuthHelper.changePassword(req.body)
            responseHelper.success(res, 'CHANGE_PASSWORD_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language, {})
        }
    }
    /**
     * Retrieving service provider's profile API
     * @returns success response(status code 200) with service provider's details
     */
    async getProfile(req, res) {
        try {
            let user = await serviceProviderAuthHelper.getUser(req.body.user_id, req.user_type)
            responseHelper.success(res, 'GET_PROFILE_SUCCESS', req.headers.language, user)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for listing of minimum number of wash jobs can be assigned to executive
     * @returns success response(status code 200) with listing of minimum number of wash jobs can be assigned to executive
     */
    async getMinimumExteriorJobs(req, res) {
        try {
            let jobNumbers = await serviceProviderAuthHelper.getMinimumExteriorJobs()
            responseHelper.success(res, 'GET_MINIMUM_EXTERIOR_JOBS_SUCCESS', req.headers.language, jobNumbers)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for setting of minimum number of wash jobs can be assigned to executive
     * @param {number} minimum_exterior_jobs number of minimum exterior jobs
     * @returns success response(status code 200) with setting of minimum number of wash jobs can be assigned to executive
     */
    async setMinimumExteriorJobs(req, res) {
        try {
            await serviceProviderAuthValidator.validateSetMinimumExteriorJobsForm(req.body)
            await serviceProviderAuthHelper.setMinimumExteriorJobs(req.body)
            responseHelper.success(res, 'SET_MINIMUM_EXTERIOR_JOBS_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Refresh token after session expired API
     * @param {string} auth_token service_provider's auth token
     * @param {string} refresh_token specified refresh token
     * @returns success response(status code 200) with new auth token
     */
    async refreshToken(req, res) {
        try {
            let auth_token = await codeHelper.refreshToken(req.headers.auth_token, req.headers.refresh_token, 0)
            responseHelper.success(res, 'TOKEN_REFRESHED', req.headers.language, { new_token: auth_token })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Executive/Supervisor/Top Supervisor dashboard API
     * @returns success response(status code 200) with required dashboard details
     */
    async dashboard(req, res) {
        try {
            let dashboard = await serviceProviderAuthHelper.dashboard(req.body, req.user_type)
            responseHelper.success(res, 'DASHBOARD_SUCCESS', req.headers.language, dashboard)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving all executives' or sub executives' details
     * @returns success response(status code 200) with required executives details
     */
    async getAllExecutives(req, res) {
        try {
            const executives = await serviceProviderAuthHelper.selectAllExecutives(req.body.user_id, req.headers.language)
            responseHelper.success(res, 'GET_ALL_EXECUTIVES_SUCCESS', req.headers.language, executives)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for displaying executive side dashboard
     * @param {number} executive_id executive id
     * @returns success response(status code 200) with required executive details
     */
    async getSingleExecutive(req, res) {
        try {
            await serviceProviderAuthValidator.validateGetSingleExecutiveForm(req.body)
            const executive = await serviceProviderAuthHelper.selectExecutive(req.body.executive_id, req.headers.language)
            responseHelper.success(res, 'GET_SINGLE_EXECUTIVE_SUCCESS', req.headers.language, executive)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for displaying customer's details
     * @param {number} customer_id customer id
     * @returns success response(status code 200) with required customer details
     */
    async getSingleCustomer(req, res) {
        try {
            await serviceProviderAuthValidator.validateGetSingleCustomerForm(req.body)
            const customer = await serviceProviderAuthHelper.selectCustomer(req.body, req.headers.language)
            responseHelper.success(res, 'GET_SINGLE_CUSTOMER_SUCCESS', req.headers.language, customer)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for displaying executives' details and live locations
    * @param {number} latitude latitude
    * @param {number} longitude longitude
    * @returns success response(status code 200) with required executives details
    */
    async getExecutivesByLatitudeLongitude(req, res) {
        try {
            await serviceProviderAuthValidator.validateGetExecutivesByLatitudeLongitudeForm(req.body)
            const executives = await serviceProviderAuthHelper.selectExecutivesByLatitudeLongitude(req.body, req.headers.language)
            responseHelper.success(res, 'GET_ALL_EXECUTIVES_SUCCESS', req.headers.language, executives)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for retrieving all supervisors' details
    * @returns success response(status code 200) with required supervisors details
    */
    async getAllSupervisors(req, res) {
        try {
            const supervisors = await serviceProviderAuthHelper.selectAllSupervisors(req.body.user_id, req.headers.language)
            responseHelper.success(res, 'GET_ALL_SUPERVISORS_SUCCESS', req.headers.language, supervisors)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for displaying supervisor side dashboard
     * @param {number} supervisor_id supervisor id
     * @returns success response(status code 200) with required supervisor details
     */
    async getSingleSupervisor(req, res) {
        try {
            await serviceProviderAuthValidator.validateGetSingleSupervisorForm(req.body)
            const supervisor = await serviceProviderAuthHelper.selectSupervisor(req.body.supervisor_id, req.headers.language)
            responseHelper.success(res, 'GET_SINGLE_SUPERVISOR_SUCCESS', req.headers.language, supervisor)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for deleting service provider's device relation
     * @param {string} device_id device id
     * @returns success response(status code 200) with deleting service provider's device relation
     */
    async deleteUserDeviceRelation(req, res) {
        try {
            await serviceProviderAuthValidator.validateDeleteUserDeviceRelationForm(req.body)
            await serviceProviderAuthHelper.deleteUserDeviceRelation(req.body)
            responseHelper.success(res, 'DELETE_DEVICE_RELATION_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for reading notification
     * @param {number} type 1: single notification read 2: all notifications read
     * @param {string} unique_id notification's unique id
     * @returns success response(status code 200) with updating is_read status of notifications
     */
    async readNotification(req, res) {
        try {
            await serviceProviderAuthValidator.validateReadNotificationForm(req.body)
            await notificationHelperApp.readNotification(req.body, 'service_provider_notifications')
            responseHelper.success(res, 'READ_NOTIFICATION_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for reading notification
     * @param {number} type 1: single notification read 2: all notifications read
     * @param {string} unique_id notification's unique id
     * @returns success response(status code 200) with updating is_read status of notifications
     */
    async getNotification(req, res) {
        try {
            await serviceProviderAuthValidator.validateGetNotificationForm(req.body)
            await notificationHelperApp.getNotification(req.body, 'service_provider_notifications', 'service_provider_notification_id')
            responseHelper.success(res, 'GET_NOTIFICATION_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new ServiceProviderAuth()