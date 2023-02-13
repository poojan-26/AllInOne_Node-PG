const express = require('express')
const router = express.Router()
// const Multer = require('multer')

const headerValidator = require('../api/utils/headersValidator')
const userAuth = require('../api/v1/controllers/userAuth')
// const buildingDemo = require('../api/v1/controllers/buildingDemo')
// const buildingPlan = require('../api/v1/controllers/buildingPlan')
// const vehicle = require('../api/v1/controllers/vehicles')
// const faq = require('../api/v1/controllers/faq')
// const userSchedule = require('../api/v1/controllers/userSchedule')
// const ratings = require('../api/v1/controllers/ratings')
// const survey = require('../api/v1/controllers/survey')
// const remarks = require('../api/v1/controllers/remarks')


// const multer = Multer({
//     storage: Multer.MemoryStorage,
//     limits: {
//         fileSize: 10 * 1024 * 1024, // Maximum file size is 10MB
//     },
// });


//authentication
router.post('/signup',userAuth.signup)

module.exports = router;
router.post('/resendOTP', headerValidator.nonAuthValidation, userAuth.resendOTP)
// router.post('/verifyOTP', headerValidator.nonAuthValidation, userAuth.verifyOTP)

router.post('/signin', headerValidator.nonAuthValidation, userAuth.signin)


// router.post('/forgotPassword', headerValidator.nonAuthValidation, userAuth.forgotPassword)
// router.post('/resetPassword', headerValidator.nonAuthValidation, userAuth.resetPassword)
// router.post('/checkLink', headerValidator.nonAuthValidation, userAuth.checkLink)
router.post('/changePassword', headerValidator.authValidation, headerValidator.isCustomer,  userAuth.changePassword)
// router.post('/getProfile', headerValidator.authValidation, headerValidator.isCustomer, userAuth.getProfile)
// router.post('/editProfile', headerValidator.authValidation, headerValidator.isCustomer, multer.single('profile_picture'), userAuth.editProfile)
// router.post('/changeMobileNumber', headerValidator.authValidation, headerValidator.isCustomer, userAuth.changeMobileNumber)
// router.post('/verifyOTPForMobileChange', headerValidator.authValidation, headerValidator.isCustomer, userAuth.verifyOTPForMobileChange)
// router.post('/refreshToken', headerValidator.authValidation, userAuth.refreshToken)
// router.post('/deleteUserDeviceRelation', headerValidator.authValidation, headerValidator.isCustomer, userAuth.deleteUserDeviceRelation)

// //Building Demo
// router.post('/getDemoByBuilding', headerValidator.authValidation, headerValidator.isCustomer, buildingDemo.getDemoByBuilding)
// router.post('/setBuildingDemoSchedule', headerValidator.authValidation, headerValidator.isCustomer, buildingDemo.setBuildingDemoSchedule)

// //Subscription Plan
// router.post('/getUserPlanForBuilding', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.getUserPlanForBuilding)
// router.post('/getAllDurationForPlan', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.getAllDurationForPlan)
// router.post('/insertPlanDetails', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.insertPlanDetails)
// router.post('/updatePlanDetails', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.updatePlanDetails)
// router.post('/getUserPlanDetails', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.getUserPlanDetails)
// router.post('/deleteUserPlan', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.deleteUserPlan)
// router.post('/clearUserPlanDetails', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.clearUserPlanDetails)
// router.post('/buyPlan', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.buyPlan)
// router.post('/getCancelPlanReasons', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.getCancelPlanReasons)

// //Summary
// router.post('/getUserSummary', headerValidator.authValidation, headerValidator.isCustomer, userSchedule.getUserSummary)

// //payment
// router.post('/getPaymentHistory', headerValidator.authValidation, headerValidator.isCustomer, buildingPlan.getPaymentHistory)

// //Location
// router.post('/changeCustomerLocation', headerValidator.authValidation, headerValidator.isCustomer, buildingDemo.changeCustomerLocation)
// router.post('/getBuildingByLatitudeLongitude', headerValidator.authValidation, headerValidator.isCustomer, buildingDemo.getBuildingByLatitudeLongitude)
// router.post('/checkCustomerBuilding', headerValidator.authValidation, headerValidator.isCustomer, buildingDemo.checkCustomerBuilding)

// //Vehicle Wash
// router.post('/getUserVehicleWashList', headerValidator.authValidation, headerValidator.isCustomer, userSchedule.getUserVehicleWashList)
// router.post('/getUserVehicleWashHistoryList', headerValidator.authValidation, headerValidator.isCustomer, userSchedule.getUserVehicleWashHistoryList)
// router.post('/getUserVehicleWashDetail', headerValidator.authValidation, headerValidator.isCustomer, userSchedule.getUserVehicleWashDetail)
// // router.post('/addExecutiveInteriorTimeSlots', headerValidator.nonAuthValidation, userSchedule.addExecutiveInteriorTimeSlots)
// router.post('/getInteriorTimeSlots', headerValidator.authValidation, headerValidator.isCustomer, userSchedule.getInteriorTimeSlots)
// router.post('/setInteriorTimeSlot', headerValidator.authValidation, headerValidator.isCustomer, userSchedule.setInteriorTimeSlot)
// router.post('/cancelInteriorWash', headerValidator.authValidation, headerValidator.isCustomer, userSchedule.cancelInteriorWash)

// // router.post('/setActiveCarsListWeekly', headerValidator.authValidation, userSchedule.setActiveCarsListWeekly)

// //Vehicles
// router.post('/getVehicleBrands', headerValidator.authValidation, headerValidator.isCustomer, vehicle.getVehicleBrands)
// router.post('/getVehicleModels', headerValidator.authValidation, headerValidator.isCustomer, vehicle.getVehicleModels)
// router.post('/getVehicleTypes', headerValidator.authValidation, headerValidator.isCustomer, vehicle.getVehicleTypes)
// router.post('/getVehicleColors', headerValidator.authValidation, headerValidator.isCustomer, vehicle.getVehicleColors)
// router.post('/insertVehicle', headerValidator.authValidation, headerValidator.isCustomer, multer.single('vehicle_image'), vehicle.addVehicle)
// router.post('/getVehicles', headerValidator.authValidation, headerValidator.isCustomer, vehicle.getAllVehicles)
// router.post('/getSingleVehicle', headerValidator.authValidation, headerValidator.isCustomer, vehicle.getSingleVehicle)
// router.post('/editVehicle', headerValidator.authValidation, headerValidator.isCustomer, multer.single('vehicle_image'), vehicle.editVehicle)
// router.post('/deleteVehicle', headerValidator.authValidation, headerValidator.isCustomer, vehicle.deleteVehicle)

// //FAQs
// router.post('/getFAQs', headerValidator.authValidation, headerValidator.isCustomer, faq.getAllFAQs)

// //Ratings
// router.post('/getRatingsReasons', headerValidator.authValidation, headerValidator.isCustomer, ratings.getRatingsReasons)
// router.post('/giveRatings', headerValidator.authValidation, headerValidator.isCustomer, ratings.giveRatings)

// //Survey
// router.post('/getSurvey', headerValidator.authValidation, headerValidator.isCustomer, survey.getSurvey)
// router.post('/submitSurvey', headerValidator.authValidation, headerValidator.isCustomer, survey.submitSurvey)
// router.post('/getSurveyReasons', headerValidator.authValidation, headerValidator.isCustomer, survey.getSurveyReasons)

// //Remarks
// router.post('/getRemarks', headerValidator.authValidation, headerValidator.isCustomer, remarks.getRemarks)


// // Cron Scheduler for fethching the data for Executive
// router.post('/setActiveCarsListWeekly', headerValidator.authValidation, userSchedule.setActiveCarsListWeekly)
// router.post('/scheduleExecutiveToUserVehicleRelation', headerValidator.authValidation, userSchedule.scheduleExecutiveToUserVehicleRelation)

// // FOR Next Week HR Report
// router.post('/getExecutionAllocationtoHRReport', headerValidator.authValidation, userSchedule.getExecutionAllocationtoHRReport)

// module.exports = router;
