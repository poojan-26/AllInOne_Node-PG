const userAuthHelper = require('../helpers/userAuthHelper')
const userAuthValidator = require('../validators/userAuthValidator')
const responseHelper = require('../../utils/responseHelper')
const codeHelper = require('../../utils/codeHelper')
const mailHelper = require('../../utils/mailHelper')
const config = require('../../utils/config')
const smsHelper = require('../../utils/smsHelper')
const messages = require('../../utils/messages.json')
const S3helper = require('../../utils/S3helper')

/**
 * This UserAuth class contains Customer account related APIs.
 */

class UserAuth {
    /**
     * Customer's signup(registration) API
     * @param {string} full_name customer's full name 
     * @param {string} iso country's iso code
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @param {string} password password in md5 format
     * @param {string} email email(otpional)
     * @param {string} referral_code any other customer's referral code(otptional)
     * @returns success response(status code 200) with customer's details
     * @date 2019-12-18
     */
    async signup(req, res) {
        try {            
            console.log("SignUp Req ::: ", req.body);
            await userAuthValidator.validateSignupForm(req.body)                                   
            responseHelper.success(res, 'SIGNUP_SUCCESS', req.headers.language, { code: 1, message: 'Success', data: req.body })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Resend OTP API
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @returns success response(status code 200) by sending new otp for verification
     * @date 2019-12-18
     */
    async resendOTP(req, res) {
        try {
            await userAuthValidator.validateResendOTPForm(req.body)
            let user = await userAuthValidator.isUserWithPhoneExist(req.body, false)
            let otp = await codeHelper.getOTP()
            otp = '1234'   // this is only for testing purpose
            await userAuthHelper.updateOTP(user.customer_id, otp)
            let phone_number = req.body.country_code.substring(1) + req.body.phone_number
            smsHelper.sendSMS(phone_number, messages[req.headers.language]['VERIFICATION_OTP'].replace('@@OTP@@', otp))
            responseHelper.success(res, 'OTP_SENT', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language, {})
        }
    }
    /**
     * Mobile verification API
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @param {number} otp 4 digit otp
     * @returns success response(status code 200) for verification
     * @date 2019-12-18
     */
    async verifyOTP(req, res) {
        try {
            await userAuthValidator.validateVerifyOTPForm(req.body)
            let token,
                user = await userAuthValidator.isUserWithPhoneExist(req.body, false)
            if (user.otp == Number(req.body.otp)) {
                await userAuthHelper.updateVerificationStatus(user)
                token = await codeHelper.getJwtToken(user.customer_id, config.customer_flag)
                user.is_verified = 1
                delete user.password
                delete user.otp
            } else {
                throw 'WRONG_OTP'
            }
            // await userAuthHelper.addOrUpdateUserDeviceRelation(user, req.headers)
            responseHelper.success(res, 'OTP_VERIFIED', req.headers.language, user, { auth_token: token })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Customer signin API
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @param {string} password password
     * @returns success response(status code 200) with customer's details
     * @date 2019-12-19
     */
    async signin(req, res) {
        try {
            await userAuthValidator.validateSigninForm(req.body)
            let token,
                user = await userAuthValidator.isUserWithPhoneExist(req.body, false)
            await userAuthValidator.validatePassword(user.password, req.body.password)
            if (user.is_verified) {
                token = await codeHelper.getJwtToken(user.customer_id, config.customer_flag)
            } 
            // else {
            //     let otp = await codeHelper.getOTP()
            //     otp = '1234'   // this is only for testing purpose
            //     await userAuthHelper.updateOTP(user.customer_id, otp)
            //     let phone_number = req.body.country_code.substring(1) + req.body.phone_number
            //     smsHelper.sendSMS(phone_number, messages[req.headers.language]['VERIFICATION_OTP'].replace('@@OTP@@', otp))
            // }
            // delete user.password
            // delete user.otp
            // await userAuthHelper.addOrUpdateUserDeviceRelation(user, req.headers)
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
     * @date 2019-12-23
     * @changeDate 2019-12-30
     */
    async forgotPassword(req, res) {
        try {
            await userAuthValidator.validateForgotPasswordForm(req.body)
            let user = await userAuthValidator.isUserWithPhoneExist(req.body, false)
            let guid = await userAuthHelper.getCustomerGUID(req.body)
            if (guid == '') {
                guid = await userAuthHelper.updateGuid(req.body)
            }
            req.body.guid = guid
            let otp = await codeHelper.getOTP()
            otp = '1234'   // this is only for testing purpose
            await userAuthHelper.updateOTP(user.customer_id, otp)
            let phone_number = req.body.country_code.substring(1) + req.body.phone_number
            smsHelper.sendSMS(phone_number, messages[req.headers.language]['VERIFICATION_OTP'].replace('@@OTP@@', otp))
            // smsHelper.sendSMS(phone_number, messages[req.headers.language]['RESET_PASSWORD_LINK'].replace('@@LINK@@', config.reset_password_link))
            responseHelper.success(res, 'FORGOT_PASSWORD_MSG_SENT', req.headers.language)
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
     * @date 2019-12-23
     * @changeDate 2019-12-30
     */
    async resetPassword(req, res) {
        try {
            await userAuthValidator.validateResetPasswordForm(req.body)
            let user = await userAuthValidator.isUserWithPhoneExist(req.body, false)
            if (user.otp == Number(req.body.otp)) {
                await userAuthHelper.resetPassword(user, req.body)
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
     * Check reset password link API
     * @param {string} guid customer's unique guid
     * @returns success response(status code 200) for verifing reset password link
     * @date 2019-12-23
     */
    async checkLink(req, res) {
        try {
            await userAuthValidator.validateCheckLinkForm(req.body)
            let customer = await userAuthHelper.checkLink(req.body);
            if (customer.length > 0 && customer[0].customer_id != '') {
                responseHelper.success(res, 'SUCCESS', req.headers.language, {})
            } else {
                responseHelper.error(res, 'LINK_EXPIRED', req.headers.language, {})
            }
        } catch (error) {
            responseHelper.error(res, error, req.headers.language, {})
        }
    }
    /**
     * Change password API
     * @param {string} old_password old password
     * @param {string} new_password new password
     * @returns success response(status code 200) for changing password
     * @date 2019-12-19
     */
    async changePassword(req, res) {
        try {
            await userAuthValidator.validateChnagePasswordForm(req.body)
            let user = await userAuthHelper.getCustomerProfile(req.body.user_id)
            await userAuthValidator.validateOldPassword(user[0].password, req.body.old_password)
            await userAuthHelper.changePassword(req.body)
            responseHelper.success(res, 'CHANGE_PASSWORD_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language, {})
        }
    }
    /**
     * Retrieving customer's profile API
     * @returns success response(status code 200) with customer's details
     * @date 2019-12-19
     */
    async getProfile(req, res) {
        try {
            let user = await userAuthHelper.getUser(req.body.user_id)
            responseHelper.success(res, 'GET_PROFILE_SUCCESS', req.headers.language, user)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Customer's edit profile API
     * @param {string} full_name customer's full name 
     * @param {string} email email(otpional)
     * @param {number} age age in years(otpional)
     * @param {number} gender 1: Male 2: Female (otpional)
     * @param {file} profile_picture image file
     * @returns success response(status code 200) with customer's details
     * @date 2019-12-19
     */
    async editProfile(req, res) {
        try {
            req.body.user_id = req.user_id
            await userAuthValidator.validateEditProfileForm(req.body)
            let user = await userAuthHelper.getUser(req.body.user_id)
            if (req.file) {
                req.body.profile_picture = await S3helper.uploadImageOnS3("tekoto/customers/", req.file)
                if (user.profile_picture != null || user.profile_picture != '') {
                    S3helper.deleteImageFromS3(user.profile_picture)
                }
            }
            user = await userAuthHelper.updateUser(req.body, user)
            responseHelper.success(res, 'EDIT_PROFILE_SUCCESS', req.headers.language, user)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Change mobile number API
     * @param {string} iso country's iso code
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @returns success response(status code 200) by sending new otp for verification
     * @date 2020-01-10
     */
    async changeMobileNumber(req, res) {
        try {
            await userAuthValidator.validateChangeMobileNumberForm(req.body)
            await userAuthValidator.isUserWithPhoneExist(req.body, true)
            req.body.otp = await codeHelper.getOTP()
            req.body.otp = '1234'   // this is only for testing purpose
            let phone_number = req.body.country_code.substring(1) + req.body.phone_number
            smsHelper.sendSMS(phone_number, messages[req.headers.language]['VERIFICATION_OTP'].replace('@@OTP@@', req.body.otp))
            await userAuthHelper.updateOTP(req.body.user_id, req.body.otp)
            responseHelper.success(res, 'OTP_SENT', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * OTP verification for changing mobile number API
     * @param {string} iso country's iso code
     * @param {string} country_code country code
     * @param {string} phone_number phone number
     * @param {number} otp 4 digit otp
     * @returns success response(status code 200) for verification
     * @date 2020-01-10
     */
    async verifyOTPForMobileChange(req, res) {
        try {
            await userAuthValidator.verifyOTPForMobileChangeForm(req.body)
            await userAuthValidator.isUserWithPhoneExist(req.body, true)
            let user = await userAuthHelper.getUser(req.body.user_id)
            if (user.otp == Number(req.body.otp)) {
                await userAuthHelper.updateVerificationStatus(user)
                await userAuthHelper.changeMobileNumber(req.body)
                responseHelper.success(res, 'VERIFY_OTP_MOBILE_CHANGE_SUCCESS', req.headers.language)
            } else {
                throw 'WRONG_OTP'
            }
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Refresh token after session expired API
     * @param {string} auth_token customer's auth token
     * @param {string} refresh_token specified refresh token
     * @returns success response(status code 200) with new auth token
     * @date 2020-01-10
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
     * API for deleting customer's device relation
     * @param {string} device_id device id
     * @returns success response(status code 200) with deleting customer's device relation
     */
    async deleteUserDeviceRelation(req, res) {
        try {
            await userAuthValidator.validateDeleteUserDeviceRelationForm(req.body)
            await userAuthHelper.deleteUserDeviceRelation(req.body)
            responseHelper.success(res, 'DELETE_DEVICE_RELATION_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new UserAuth()