const { Router } = require('express');

const adminController = require('../controllers/AdminController');

const router = Router();
const { checkRPtoken, requireAuth } = require('../middleware/Middleware');


router.get('/admin/activeorders/:orderid/downloadproof', adminController.download_proof_get);
router.post('/admin/activeorders/:orderid/updatestatus', adminController.update_delivery_status_post);
router.post('/admin/activeorders/:orderid/rejectproof', adminController.rejectProof_post);


router.get('/admin/pendingorders',adminController.get_pendingOrders_get)
// //admin views list of all pending orders
router.get('/admin/activeorders',adminController.get_activeOrders_get)
// router.get('/admin/pendingorders/:orderid', adminController.get_anorder_get)
// //admin views a specific order from the list of POs

// router.post('/admin/pendingorders/:orderid/reject', adminController.rejectorder_post)

// router.get('/admin/waitingorders', adminController.get_waitingpending_get);
// //admin views a list of orders that are still waiting for a response

// router.get('/admin/waitingorders/:orderid', adminController.get_anorder_get);
// //admin views a specific order that is waiting for a traveler's response

// router.post('/admin/waitingorders/:orderid/revoke', adminController.revoke_order_post)
// //admin can withdraw the order from a traveler if he thinks that the traveler is taking too long to get a response

// router.post('/admin/pendingorders/:orderid/setcost', adminController.setcost_post);
// //If there is no cost by default, admin adds it manually

// router.get('/admin/pendingorders/:orderid/activetravelers', adminController.getActiveTravelers_get)
// //after selecting a PO the admin can ge the list of all active travelers
// //that have not yet provided a pickup location

router.post('/admin/pendingorders/:orderid/activetravelers/:travelerid/assign', adminController.assign_order_post);
// admin selects a specific traveler from the list he got above and assigns them the order

router.post('/admin/:id/accept', adminController.acceptTraveler_post);

//admin + clients
router.get('/admin/home/clients', adminController.getAllClients)

//kel shi khasso b travelers
router.get('/admin/home/travelers',adminController.getTravelers_get)

router.get('/admin/travelers/:travelerid')

router.post('/admin/travelers/:travelerid/revokeaccess', adminController.revoke_access_post)

router.post('/admin/home/travelers/:travelerid/ban', adminController.deleteTraveler);

router.get('admin/home/travelers/revokedtravelers', adminController.getrevoked_list);

router.get('admin/home/travelers/revokedtravelers/:travelerid', adminController.getrevokedTraveler_get);

router.post('admin/home/travelers/revokedtravelers/:travelerid/unrevoke', adminController.unrevoke_post);

router.get('/admin/home/travelers/actvietravelers',adminController.getActiveTravelers_get);

router.post('/admin/home/activeorders/:orderid/markassentout', adminController.markSentOut);

module.exports = router;