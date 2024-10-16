const { Router } = require('express');
const clientController = require('../controllers/ClientController');
const productController = require('../controllers/ProductController');
const LandingpageController = require('../controllers/LandingpageController');

const { requireAuth, checkUser} = require('../middleware/Middleware');


const router = Router();
router.get("/client/home/searchproduct", requireAuth, (req, res, next) => {
    // You don't need any functionality here, so just call next()
    next();
  });
router.post("/client/home/searchproduct", productController.productsearch_post);

router.post("/client/home/searchproduct/:asin/:quantity", requireAuth, productController.productrequest_post);

router.get('/confirmorder/:token/:orderid', clientController.confirm_order_get);
//Client confirms their order

router.get('/client/home/pendingorders',requireAuth, clientController.getPendingClient_get);
//Client gets list of pending orders

router.get('/client/home/activeorders',requireAuth, clientController.getActiveClient_get);
//Client gets list of active orders

router.get('/client/home/activeorders/:orderid', clientController.getActiveOrder_get)
//Client gets specific active order

router.get('/client/home/profile',requireAuth, clientController.getProfile);
//Client gets their profile

router.put('/client/home/profile/edit',requireAuth, clientController.editProfile);
//Change simple things

router.post('/client/home/profile/edit/changepassword', requireAuth, clientController.changePass_post)


router.post('/client/home/activeorder/:orderid/markascomplete', requireAuth, clientController.complete_order_post);
//Client completes order

router.post('/client/home/activeorder/:orderid/markascomplete/feedback',requireAuth, clientController.giveFeedback_post);

router.post('/getrate', clientController.getRate_get);


//Contact Forms
router.post('/client/home/contactform', requireAuth, clientController.submitContactForm)

router.post('/support', requireAuth, clientController.submitSupportForm)

router.get('/testimonials', LandingpageController.testimonials_get)

module.exports = router;