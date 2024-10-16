const { Router } = require('express');
const authController = require('../controllers/AuthController');
const rpfpController = require('../controllers/PassresetController');
const tauthController = require('../controllers/TravelerauthContoller');
const { checkRPtoken, requireAuth } = require('../middleware/Middleware');
// const trpfpController = require('../controllers/TpassresetController');

const router = Router();

//User
//login+signup
// router.get("/signup", authController.singup_get);
router.post("/signup", authController.singup_post);
// router.get("/login", authController.login_get);
router.post("/login", authController.login_post);
router.post('/logout', requireAuth, authController.logout_post);

//forgot-password
// router.get("/forgot-password", rpfpController.fp_get);
router.post("/forgot-password", rpfpController.fp_post);
router.get("/reset-password/:id/:token", checkRPtoken, rpfpController.rp_get);
router.post("/reset-password/:id/:token", checkRPtoken, rpfpController.rp_post);

//Traveler
//login+signup
// router.get("/travelersignup", tauthController.tsingup_get);
router.post("/travelersignup", tauthController.tsignup_post);
// router.get("/travelerlogin", tauthController.tlogin_get);
// router.post("/travelerlogin", tauthController.tlogin_post);
// router.get('/travelerlogout', tauthController.tlogout_get);

//forgot-password
// router.get("/travelerforgot-password", trpfpController.tfp_get);
// router.post("/travelerforgot-password", trpfpController.tfp_post);
// router.get("/travelerreset-password/:id/:token", trpfpController.trp_get);
// router.post("/travelerreset-password/:id/:token", trpfpController.trp_post);

//Email Verification
router.get("/confirm-email/:id/:token", authController.confirmEmail_get);




module.exports = router;