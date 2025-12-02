const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const tripItemController = require('../controllers/tripItemController');
const { authenticateToken: authenticate, requireAdmin } = require('../middleware/auth');

// Trip routes
router.post('/', authenticate, requireAdmin, tripController.createTrip);
router.get('/', authenticate, tripController.listTrips);
router.get('/:id', authenticate, tripController.getTripById);
router.put('/:id', authenticate, tripController.updateTrip);
router.delete('/:id', authenticate, requireAdmin, tripController.deleteTrip);
router.post('/:id/close', authenticate, requireAdmin, tripController.closeTrip);

// Trip item routes (both admin and regular users can add/return items)
router.post('/:id/items', authenticate, tripItemController.addItemToTrip);
router.get('/:id/items', authenticate, tripItemController.listTripItems);
router.put('/:id/items/:item_id/return', authenticate, tripItemController.markItemReturned);
router.delete('/:id/items/:item_id', authenticate, tripItemController.removeItemFromTrip);

// Admin-only item status updates
router.put('/:id/items/:item_id/lost', authenticate, requireAdmin, tripItemController.markItemLost);
router.put('/:id/items/:item_id/not-found', authenticate, requireAdmin, tripItemController.markItemNotFound);

module.exports = router;
