const { TripItem, Trip, Item, ItemImage, User } = require('../models');

// POST /api/v1/trips/:id/items - Add item to trip (scan item)
exports.addItemToTrip = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const { item_id, qr_code_id, notes } = req.body;
    const userId = req.user.id === 'super-admin' ? null : req.user.id;

    // Find trip
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' }
      });
    }

    // Check if trip is closed
    if (trip.status === 'closed') {
      return res.status(400).json({
        error: { code: 'TRIP_CLOSED', message: 'Cannot add items to closed trip' }
      });
    }

    // Find item by ID or QR code
    let item;
    if (item_id) {
      item = await Item.findByPk(item_id);
    } else if (qr_code_id) {
      item = await Item.findOne({ where: { qr_code_id } });
    } else {
      return res.status(400).json({
        error: { code: 'MISSING_ITEM_IDENTIFIER', message: 'Either item_id or qr_code_id is required' }
      });
    }

    if (!item) {
      return res.status(404).json({
        error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' }
      });
    }

    // Check if item already in trip (duplicate prevention)
    const existing = await TripItem.findOne({
      where: { trip_id: tripId, item_id: item.id }
    });

    if (existing) {
      return res.status(409).json({
        error: {
          code: 'ITEM_ALREADY_IN_TRIP',
          message: `Item "${item.name}" is already in this trip`,
          item: {
            id: item.id,
            name: item.name,
            qr_code_id: item.qr_code_id
          }
        }
      });
    }

    // Add item to trip
    const tripItem = await TripItem.create({
      trip_id: tripId,
      item_id: item.id,
      status: 'taken',
      added_at: new Date(),
      added_by: userId,
      notes_when_added: notes
    });

    // Fetch complete trip item with relations
    const createdTripItem = await TripItem.findByPk(tripItem.id, {
      include: [
        {
          model: Item,
          as: 'item',
          include: [{ model: ItemImage, as: 'images', where: { is_primary: true }, required: false }]
        },
        {
          model: User,
          as: 'adder',
          attributes: ['id', 'name']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: `Item "${item.name}" added to trip`,
      trip_item: createdTripItem
    });
  } catch (error) {
    console.error('Error adding item to trip:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to add item to trip' }
    });
  }
};

// PUT /api/v1/trips/:id/items/:item_id/return - Mark item as returned/lost/not_found
exports.markItemReturned = async (req, res) => {
  try {
    const { id: tripId, item_id } = req.params;
    const { notes, status = 'returned', qr_code_id } = req.body;
    const userId = req.user.id === 'super-admin' ? null : req.user.id;

    // Validate status
    const validStatuses = ['returned', 'lost', 'not_found'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: { 
          code: 'INVALID_STATUS', 
          message: `Status must be one of: ${validStatuses.join(', ')}` 
        }
      });
    }

    // IMPORTANT: 'returned' status requires QR code verification
    if (status === 'returned' && !qr_code_id) {
      return res.status(400).json({
        error: { 
          code: 'QR_CODE_REQUIRED', 
          message: 'QR code scan is required to mark item as returned. Use lost or not_found status for manual updates.' 
        }
      });
    }

    // Check admin permission for lost/not_found
    if ((status === 'lost' || status === 'not_found') && req.user.role !== 'admin') {
      return res.status(403).json({
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Only admin can mark items as lost or not found' 
        }
      });
    }

    const tripItem = await TripItem.findOne({
      where: { trip_id: tripId, item_id },
      include: [{ model: Item, as: 'item' }]
    });

    if (!tripItem) {
      return res.status(404).json({
        error: { code: 'ITEM_NOT_IN_TRIP', message: 'Item not found in this trip' }
      });
    }

    // Verify QR code matches the item if provided (for returned status)
    if (qr_code_id && tripItem.item.qr_code_id !== qr_code_id) {
      return res.status(400).json({
        error: { 
          code: 'QR_CODE_MISMATCH', 
          message: 'Scanned QR code does not match the item in this trip' 
        }
      });
    }

    // Allow status changes from 'taken' or from 'not_found' to 'returned' (marking as found)
    const allowedTransitions = {
      'taken': ['returned', 'lost', 'not_found'],
      'not_found': ['returned'], // Allow marking not_found items as found
      'lost': [], // Lost items cannot be changed
      'returned': [] // Returned items cannot be changed
    };

    const allowedStatuses = allowedTransitions[tripItem.status] || [];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: { 
          code: 'INVALID_STATUS_TRANSITION', 
          message: `Cannot change status from '${tripItem.status}' to '${status}'` 
        }
      });
    }

    // Update status
    tripItem.status = status;
    tripItem.notes_when_returned = notes;
    
    // Only set returned_at and returned_by for 'returned' status
    if (status === 'returned') {
      tripItem.returned_at = new Date();
      tripItem.returned_by = userId;
    }
    
    await tripItem.save();

    const updatedTripItem = await TripItem.findByPk(tripItem.id, {
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'adder', attributes: ['id', 'name'] },
        { model: User, as: 'returner', attributes: ['id', 'name'] }
      ]
    });

    return res.json({
      success: true,
      message: `Item "${tripItem.item.name}" marked as ${status}`,
      trip_item: updatedTripItem
    });
  } catch (error) {
    console.error('Error updating item status:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update item status' }
    });
  }
};

// PUT /api/v1/trips/:id/items/:item_id/lost - Mark item as lost (admin only)
exports.markItemLost = async (req, res) => {
  try {
    const { id: tripId, item_id } = req.params;
    const { notes } = req.body;

    // Only admin can mark items as lost
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: { code: 'UNAUTHORIZED', message: 'Only admin can mark items as lost' }
      });
    }

    const tripItem = await TripItem.findOne({
      where: { trip_id: tripId, item_id },
      include: [{ model: Item, as: 'item' }]
    });

    if (!tripItem) {
      return res.status(404).json({
        error: { code: 'ITEM_NOT_IN_TRIP', message: 'Item not found in this trip' }
      });
    }

    // Mark as lost
    tripItem.status = 'lost';
    if (notes) {
      tripItem.notes_when_returned = notes;
    }
    await tripItem.save();

    const updatedTripItem = await TripItem.findByPk(tripItem.id, {
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'adder', attributes: ['id', 'name'] }
      ]
    });

    return res.json({
      success: true,
      message: `Item "${tripItem.item.name}" marked as lost`,
      trip_item: updatedTripItem
    });
  } catch (error) {
    console.error('Error marking item as lost:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to mark item as lost' }
    });
  }
};

// PUT /api/v1/trips/:id/items/:item_id/not-found - Mark item as not found (admin only)
exports.markItemNotFound = async (req, res) => {
  try {
    const { id: tripId, item_id } = req.params;
    const { notes } = req.body;

    // Only admin can mark items as not found
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: { code: 'UNAUTHORIZED', message: 'Only admin can mark items as not found' }
      });
    }

    const tripItem = await TripItem.findOne({
      where: { trip_id: tripId, item_id },
      include: [{ model: Item, as: 'item' }]
    });

    if (!tripItem) {
      return res.status(404).json({
        error: { code: 'ITEM_NOT_IN_TRIP', message: 'Item not found in this trip' }
      });
    }

    // Mark as not found
    tripItem.status = 'not_found';
    if (notes) {
      tripItem.notes_when_returned = notes;
    }
    await tripItem.save();

    const updatedTripItem = await TripItem.findByPk(tripItem.id, {
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'adder', attributes: ['id', 'name'] }
      ]
    });

    return res.json({
      success: true,
      message: `Item "${tripItem.item.name}" marked as not found`,
      trip_item: updatedTripItem
    });
  } catch (error) {
    console.error('Error marking item as not found:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to mark item as not found' }
    });
  }
};

// DELETE /api/v1/trips/:id/items/:item_id - Remove item from trip
exports.removeItemFromTrip = async (req, res) => {
  try {
    const { id: tripId, item_id } = req.params;
    const userId = req.user.id === 'super-admin' ? null : req.user.id;

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found' }
      });
    }

    // Check if trip is closed
    if (trip.status === 'closed') {
      return res.status(400).json({
        error: { code: 'TRIP_CLOSED', message: 'Cannot remove items from closed trip' }
      });
    }

    // Only admin or trip creator can remove items
    if (trip.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: { code: 'UNAUTHORIZED', message: 'Not authorized to remove items from this trip' }
      });
    }

    const tripItem = await TripItem.findOne({
      where: { trip_id: tripId, item_id },
      include: [{ model: Item, as: 'item' }]
    });

    if (!tripItem) {
      return res.status(404).json({
        error: { code: 'ITEM_NOT_IN_TRIP', message: 'Item not found in this trip' }
      });
    }

    const itemName = tripItem.item.name;
    await tripItem.destroy();

    return res.json({
      success: true,
      message: `Item "${itemName}" removed from trip`
    });
  } catch (error) {
    console.error('Error removing item from trip:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to remove item from trip' }
    });
  }
};

// GET /api/v1/trips/:id/items - List trip items
exports.listTripItems = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const { status } = req.query;

    const where = { trip_id: tripId };
    if (status) {
      where.status = status;
    }

    const tripItems = await TripItem.findAll({
      where,
      include: [
        {
          model: Item,
          as: 'item',
          include: [{ model: ItemImage, as: 'images', where: { is_primary: true }, required: false }]
        },
        { model: User, as: 'adder', attributes: ['id', 'name'] },
        { model: User, as: 'returner', attributes: ['id', 'name'] }
      ],
      order: [['added_at', 'DESC']]
    });

    return res.json({
      trip_items: tripItems,
      count: tripItems.length
    });
  } catch (error) {
    console.error('Error listing trip items:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to list trip items' }
    });
  }
};
