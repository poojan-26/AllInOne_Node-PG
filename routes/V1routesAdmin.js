const express = require('express')
const router = express.Router()
const Multer = require('multer')
const headerValidator = require('../api/utils/headersValidator')
const adminAuth = require('../api/v1/controllers/adminAuth')
const buildingController = require('../api/v1/controllers/building');
const car = require('../api/v1/controllers/car');
const bike = require('../api/v1/controllers/bike');
const complex = require('../api/v1/controllers/complex');
const executive = require('../api/v1/controllers/executive');
const configuration = require('../api/v1/controllers/configuration');
const customer = require('../api/v1/controllers/customer');
const plan = require('../api/v1/controllers/plans');
const promotions = require('../api/v1/controllers/promotions');
const subscription = require('../api/v1/controllers/subscription');
const vehicleParts = require('../api/v1/controllers/vehicleParts');
const remark = require('../api/v1/controllers/remark');
const demoGuide = require('../api/v1/controllers/demoGuide');
// const users = require('../api/v1/controllers/complex');
const surveyAdmin = require('../api/v1/controllers/surveyAdmin');
const demoRequest=require('../api/v1/controllers/demoRequest');
const carServiceManagement=require('../api/v1/controllers/carServiceManagement');
const faq = require('../api/v1/controllers/faq');

const multer = Multer({
    storage: Multer.MemoryStorage,
    limits: {
        fileSize: 100 * 1024 * 1024, // Maximum file size is 100 MB
    },
});

//authentication
router.post('/signin', headerValidator.nonAuthValidation, adminAuth.signin);

router.get('/refreshToken', headerValidator.authValidation, adminAuth.refreshToken);

//Buildings
router.post('/addBuilding', headerValidator.authValidation, buildingController.addBuilding);

router.post('/editBuilding', headerValidator.authValidation, buildingController.editBuilding);

router.post('/buildingStatusUpdate', headerValidator.authValidation, buildingController.buildingStatusUpdate);

router.post('/getBuildingList', headerValidator.authValidation, buildingController.getBuildingList);

//complex
router.post('/addComplex', headerValidator.authValidation, complex.addComplex);

// router.post('/editBuilding', headerValidator.authValidation, buildingController.editBuilding);

// router.post('/buildingStatusUpdate', headerValidator.authValidation, buildingController.buildingStatusUpdate);

// router.post('/getBuildingList', headerValidator.authValidation, buildingController.getBuildingList);

//Car Type
router.post('/addEditCarType', headerValidator.authValidation, car.addEditCarType);
router.post('/getCarTypeList', headerValidator.authValidation, car.getCarTypeList);
//Car
router.post('/addEditCarBrand', headerValidator.authValidation, multer.single('brand_image'), car.addEditCarBrand);

router.post('/getBrandList', headerValidator.authValidation, car.getBrandList);

//Models
router.post('/addEditCarModel', headerValidator.authValidation, car.addEditCarModel);

router.post('/getModelList', headerValidator.authValidation, car.getModelList);

//Bike
router.post('/addEditBikeBrand', headerValidator.authValidation, multer.single('brand_image'), bike.addEditBikeBrand);

router.post('/getBikeBrandList', headerValidator.authValidation, bike.getBikeBrandList);

//Bike Models
router.post('/addEditBikeModel', headerValidator.authValidation, bike.addEditBikeModel);

router.post('/getBikeModelList', headerValidator.authValidation, bike.getBikeModelList);

// sachin Complex
router.post('/addEditComplex', headerValidator.authValidation, complex.addEditComplex);

router.post('/getComplexList', headerValidator.authValidation, complex.getComplexList);

router.post('/getBindBuildingIds', headerValidator.authValidation, complex.getBindBuildingIds);

//Executive
router.post('/getExecutiveList', headerValidator.authValidation, executive.getExecutiveList);
router.post('/getExecutiveListWithRelations', headerValidator.authValidation, executive.getExecutiveListWithRelations);
router.post('/getServiceProviderList', headerValidator.authValidation, executive.getServiceProviderList);
router.post('/executiveStatusUpdate', headerValidator.authValidation, executive.executiveStatusUpdate);
router.post('/getSupervisorList', headerValidator.authValidation, executive.getSupervisors);
router.post('/deleteServiceProvider', headerValidator.authValidation, executive.deleteServiceProvider);

router.post('/addEditExecutive', headerValidator.authValidation, multer.fields([{ name: 'profile_picture', maxCount: 5 }, { name: 'id_proof', maxCount: 1 }]), executive.addEditExecutive);
router.post('/addEditTopSupervisor', headerValidator.authValidation, multer.fields([{ name: 'profile_picture', maxCount: 5 }, { name: 'id_proof', maxCount: 1 }]), executive.addEditTopSupervisor);
router.post('/addEditSupervisor', headerValidator.authValidation, multer.fields([{ name: 'profile_picture', maxCount: 5 }, { name: 'id_proof', maxCount: 1 }]), executive.addEditSupervisor);

//Configuration
router.post('/editConfiguration', headerValidator.authValidation, configuration.editConfiguration);

router.get('/getConfiguration', headerValidator.authValidation, configuration.getConfiguration);

//Customer 
router.post('/getCustomerList', headerValidator.authValidation, customer.getCustomerList);

router.post('/customerStatusUpdate', headerValidator.authValidation, customer.customerStatusUpdate);

router.post('/sendMessage', headerValidator.authValidation, customer.sendMessage);

//Plans
router.post('/getPlans', headerValidator.authValidation, plan.getPlans);

router.post('/addEditPlan', headerValidator.authValidation, plan.addEditPlan);

router.post('/planStatusUpdate', headerValidator.authValidation, plan.planStatusUpdate);

//Duration 
router.post('/addEditDuration', headerValidator.authValidation, plan.addEditDuration);

router.post('/getDurations', headerValidator.authValidation, plan.getDurations);

router.post('/durationStatusUpdate', headerValidator.authValidation, plan.durationStatusUpdate);

router.post('/getPromotions', headerValidator.authValidation, promotions.getPromotions);

router.post('/addEditPromotions', headerValidator.authValidation, promotions.addEditPromotions);

router.post('/promotionStatusUpdate', headerValidator.authValidation, promotions.promotionStatusUpdate);

router.post('/getSubscriptions', headerValidator.authValidation, subscription.getSubscriptions);

router.post('/getAddSubscriptionData', headerValidator.authValidation, subscription.getAddSubscriptionsData);

router.post('/addEditSubscription', headerValidator.authValidation, subscription.addEditSubscription);

router.post('/durationStatusUpdate', headerValidator.authValidation, plan.durationStatusUpdate);

router.post('/getVehicleParts', headerValidator.authValidation, vehicleParts.getVehicleParts);

router.post('/addEditVehiclePart', headerValidator.authValidation, vehicleParts.addEditVehiclePart);

router.post('/getRemarks', headerValidator.authValidation, remark.getRemarks);

router.post('/addEditRemark', headerValidator.authValidation, remark.addEditRemark);

router.post('/updateRemarkStatus', headerValidator.authValidation, remark.updateRemarkStatus);


router.post('/addSurvey', headerValidator.authValidation, surveyAdmin.addSurvey);
router.post('/editSurvey', headerValidator.authValidation, surveyAdmin.editSurvey);
router.post('/getAllSurveys', headerValidator.authValidation, surveyAdmin.getAllSurveys);
router.post('/getSingleSurvey', headerValidator.authValidation, surveyAdmin.getSingleSurvey);
router.post('/addSurveyTitle', headerValidator.authValidation, surveyAdmin.addSurveyTitle);
router.post('/editSurveyTitle', headerValidator.authValidation, surveyAdmin.editSurveyTitle);
router.post('/deleteSurveyTitle', headerValidator.authValidation, surveyAdmin.deleteSurveyTitle);
router.post('/addSurveyQuestion', headerValidator.authValidation, surveyAdmin.addSurveyQuestion);
router.post('/editSurveyQuestion', headerValidator.authValidation, surveyAdmin.editSurveyQuestion);
router.post('/deleteSurveyQuestion', headerValidator.authValidation, surveyAdmin.deleteSurveyQuestion);
router.post('/addSurveyReason', headerValidator.authValidation, surveyAdmin.addSurveyReason);
router.post('/deleteSurveyReason', headerValidator.authValidation, surveyAdmin.deleteSurveyReason);
router.post('/updateSurveyStatus', headerValidator.authValidation, surveyAdmin.updateSurveyStatus);
router.post('/deleteSurvey', headerValidator.authValidation, surveyAdmin.deleteSurvey);

router.post('/getAllSurveyFeedbacks', headerValidator.authValidation, surveyAdmin.getAllSurveyFeedbacks);
router.post('/getSingleSurveyFeedback', headerValidator.authValidation, surveyAdmin.getSingleSurveyFeedback);

router.post('/sendForgotPasswordMail', headerValidator.nonAuthValidation, adminAuth.sendForgotPasswordMail)


//FAQs
// router.post('/getAllFAQs', headerValidator.authValidation, headerValidator.isAdmin, faq.getAllFAQs)
router.post('/addFAQ', headerValidator.authValidation, headerValidator.isAdmin, faq.addFAQ)
// router.post('/editFAQ', headerValidator.authValidation, headerValidator.isAdmin, faq.editFAQ)
// router.post('/deleteFAQ', headerValidator.authValidation, headerValidator.isAdmin, faq.deleteFAQ)

// router.post('/getModelList', headerValidator.authValidation, car.getModelList);
// router.post('/addEditCar', headerValidator.authValidation, buildingController.addEditCar);

// router.post('/changePassword', headerValidator.authValidation, headerValidator.isAdmin, headerValidator.isAdmin, adminAuth.changePassword)
// router.post('/resetPassword', headerValidator.authValidation, headerValidator.isAdmin, adminAuth.resetPassword)
// //dashboard
// router.get('/getCounts', headerValidator.authValidation, headerValidator.isAdmin, adminAuth.getCounts)

// //users
// router.post('/getAllUsers', headerValidator.authValidation, headerValidator.isAdmin, users.getAllUsers)
// router.post('/updateActiveStatusOfUser', headerValidator.authValidation, headerValidator.isAdmin, users.updateActiveStatusOfUser)

// //vehicles
// router.post('/getSingleVehicle', headerValidator.authValidation, headerValidator.isAdmin, vehicles.getSingleVehicle)

// //vehicle types
// router.post('/getAllVehicleTypes', headerValidator.authValidation, headerValidator.isAdmin, vehicleTypes.getAllVehicleTypes)
// router.post('/getSingleVehicleType', headerValidator.authValidation, headerValidator.isAdmin, vehicleTypes.getSingleVehicleType)
// router.post('/addVehicleType', headerValidator.authValidation, headerValidator.isAdmin, vehicleTypes.addVehicleType)
// router.post('/editVehicleType', headerValidator.authValidation, headerValidator.isAdmin, vehicleTypes.editVehicleType)
// router.post('/updateActiveStatusOfVehicleType', headerValidator.authValidation, headerValidator.isAdmin, vehicleTypes.updateActiveStatusOfVehicleType)

// //brands
// router.post('/getAllBrands', headerValidator.authValidation, headerValidator.isAdmin, brands.getAllBrands)
// router.post('/getSingleBrand', headerValidator.authValidation, headerValidator.isAdmin, brands.getSingleBrand)
// router.post('/addBrand', headerValidator.authValidation, headerValidator.isAdmin, multer.single('brand_image'), brands.addBrand)
// router.post('/editBrand', headerValidator.authValidation, headerValidator.isAdmin, multer.single('brand_image'), brands.editBrand)
// router.post('/updateActiveStatusOfBrand', headerValidator.authValidation, headerValidator.isAdmin, brands.updateActiveStatusOfBrand)
// router.post('/updatePopularStatusOfBrand', headerValidator.authValidation, headerValidator.isAdmin, brands.updatePopularStatusOfBrand)

// //years
// router.post('/getAllYears', headerValidator.authValidation, headerValidator.isAdmin, years.getAllYears)
// router.post('/getSingleYear', headerValidator.authValidation, headerValidator.isAdmin, years.getSingleYear)
// router.post('/addYear', headerValidator.authValidation, headerValidator.isAdmin, years.addYear)
// router.post('/editYear', headerValidator.authValidation, headerValidator.isAdmin, years.editYear)
// router.post('/updateActiveStatusOfYear', headerValidator.authValidation, headerValidator.isAdmin, years.updateActiveStatusOfYear)

// //models
// router.post('/getAllModels', headerValidator.authValidation, headerValidator.isAdmin, models.getAllModels)
// router.post('/getSingleModel', headerValidator.authValidation, headerValidator.isAdmin, models.getSingleModel)
// router.post('/addModel', headerValidator.authValidation, headerValidator.isAdmin, models.addModel)
// router.post('/editModel', headerValidator.authValidation, headerValidator.isAdmin, models.editModel)
// router.post('/updateActiveStatusOfModel', headerValidator.authValidation, headerValidator.isAdmin, models.updateActiveStatusOfModel)

// //News
// router.post('/getAllNews', headerValidator.authValidation, headerValidator.isAdmin, news.getAllNews)
// router.post('/getSingleNews', headerValidator.authValidation, headerValidator.isAdmin, news.getSingleNews)
// router.post('/addNews', headerValidator.authValidation, headerValidator.isAdmin, multer.single('news_image'), news.addNews)
// router.post('/editNews', headerValidator.authValidation, headerValidator.isAdmin, multer.single('news_image'), news.editNews)
// router.post('/deleteNews', headerValidator.authValidation, headerValidator.isAdmin, news.deleteNews)

// //Pages
// router.get('/getAllPages', headerValidator.authValidation, headerValidator.isAdmin, pages.getAllPages)
// router.post('/updatePages', headerValidator.authValidation, headerValidator.isAdmin, pages.updatePages)

// //importExcelSheet
// router.post('/importExcelSheet', headerValidator.authValidation, headerValidator.isAdmin, multer.single('excel_sheet'), excelSheet.importExcelSheet)


router.post('/addEditDemoGuide', headerValidator.authValidation, headerValidator.isAdmin, multer.fields([{ name: 'demo_data', maxCount: 5 }, { name: 'videoThumb', maxCount: 1 }]), demoGuide.addEditDemoGuide);

router.post('/editDemoGuide', headerValidator.authValidation, headerValidator.isAdmin, multer.fields([{ name: 'demo_data', maxCount: 5 }, { name: 'videoThumb', maxCount: 1 }]), demoGuide.editDemoGuide);

router.post('/deleteDemoGuide', headerValidator.authValidation, headerValidator.isAdmin, demoGuide.deleteDemoGuide);

router.post('/getAllDemo', headerValidator.authValidation, headerValidator.isAdmin, demoGuide.getAllDemo);

router.post('/getDemoRequestList', headerValidator.authValidation, headerValidator.isAdmin, demoRequest.getDemoRequestList);

router.post('/assignDemoToCustomer', headerValidator.authValidation, headerValidator.isAdmin, demoRequest.assignDemoToCustomer);

router.post('/getAllCarData', headerValidator.authValidation, headerValidator.isAdmin, carServiceManagement.getAllCarData);

router.post('/updateVehicleStatus', headerValidator.authValidation, headerValidator.isAdmin, carServiceManagement.updateVehicleStatus);


module.exports = router