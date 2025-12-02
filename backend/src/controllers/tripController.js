const { Trip, TripItem, Item, ItemImage, User } = require('../models');
const { Op } = require('sequelize');

// POST /api/v1/trips - Create new trip
exports.createTrip = async (req, res) => {
  try {
    const { name, start_date, end_date, location, notes } = req.body;
    const userId = req.user.id === 'super-admin' ? null : req.user.id;

    // Validate required fields
    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Name, start_date, and end_date are required'
        }
      });
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Start date must be before or equal to end date'
        }
      });
    }

    // Create trip (no single active trip constraint)
    const trip = await Trip.create({
      name,
      start_date,
      end_date,
      location,
      notes,
      status: 'open',
      created_by: userId
    });

    // Fetch complete trip with creator info
    const createdTrip = await Trip.findByPk(trip.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });

    return res.status(201).json(createdTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map(e => ({ field: e.path, message: e.message }))
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create trip',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

// GET /api/v1/trips - List all trips
exports.listTrips = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, location } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (status) {
      where.status = status;
    }

    if (location) {
      where.location = {
        [Op.iLike]: `%${location}%`
      };
    }

    const { count, rows } = await Trip.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: TripItem,
          as: 'trip_items',
          attributes: ['id', 'status']
        }
      ],
      order: [['start_date', 'DESC']],
      distinct: true
    });

    // Add item counts to each trip
    const tripsWithCounts = rows.map(trip => {
      const tripData = trip.toJSON();
      const totalItems = tripData.trip_items.length;
      const returnedItems = tripData.trip_items.filter(ti => ti.status === 'returned').length;
      const lostItems = tripData.trip_items.filter(ti => ti.status === 'lost' || ti.status === 'not_found').length;
      
      return {
        ...tripData,
        item_counts: {
          total: totalItems,
          returned: returnedItems,
          lost: lostItems,
          pending: totalItems - returnedItems - lostItems
        }
      };
    });

    return res.json({
      trips: tripsWithCounts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error listing trips:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to list trips',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

// GET /api/v1/trips/:id - Get trip details
exports.getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: TripItem,
          as: 'trip_items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                {
                  model: ItemImage,
                  as: 'images',
                  where: { is_primary: true },
                  required: false
                }
              ]
            },
            {
              model: User,
              as: 'adder',
              attributes: ['id', 'name']
            },
            {
              model: User,
              as: 'returner',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!trip) {
      return res.status(404).json({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    // Calculate statistics
    const tripData = trip.toJSON();
    const totalItems = tripData.trip_items.length;
    const returnedItems = tripData.trip_items.filter(ti => ti.status === 'returned').length;
    const lostItems = tripData.trip_items.filter(ti => ti.status === 'lost' || ti.status === 'not_found').length;
    const pendingItems = totalItems - returnedItems - lostItems;

    return res.json({
      ...tripData,
      statistics: {
        total_items: totalItems,
        returned_items: returnedItems,
        lost_items: lostItems,
        pending_items: pendingItems,
        return_percentage: totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch trip',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

// PUT /api/v1/trips/:id - Update trip
exports.updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, location, notes } = req.body;
    const userId = req.user.id;

    const trip = await Trip.findByPk(id);

    if (!trip) {
      return res.status(404).json({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    // Check authorization (only admin or creator can update)
    if (trip.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to update this trip'
        }
      });
    }

    // Validate date range if dates are being updated
    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Start date must be before or equal to end date'
        }
      });
    }

    // Update fields
    if (name) trip.name = name;
    if (start_date) trip.start_date = start_date;
    if (end_date) trip.end_date = end_date;
    if (location !== undefined) trip.location = location;
    if (notes !== undefined) trip.notes = notes;

    await trip.save();

    // Fetch updated trip
    const updatedTrip = await Trip.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });

    return res.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map(e => ({ field: e.path, message: e.message }))
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update trip',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

// DELETE /api/v1/trips/:id - Delete trip
exports.deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findByPk(id);

    if (!trip) {
      return res.status(404).json({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    // Check authorization (only admin or creator can delete)
    if (trip.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to delete this trip'
        }
      });
    }

    // Get trip items count before deletion
    const tripItemsCount = await TripItem.count({ where: { trip_id: id } });

    // Delete trip (CASCADE will delete trip_items)
    await trip.destroy();

    return res.json({
      success: true,
      message: 'Trip deleted successfully',
      deleted_trip_id: id,
      deleted_trip_items_count: tripItemsCount
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete trip',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

// POST /api/v1/trips/:id/close - Close trip (admin only)
exports.closeTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findByPk(id, {
      include: [{
        model: TripItem,
        as: 'trip_items'
      }]
    });

    if (!trip) {
      return res.status(404).json({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    // Only admin can close trips
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only admin can close trips'
        }
      });
    }

    // Check if already closed
    if (trip.status === 'closed') {
      return res.status(400).json({
        error: {
          code: 'TRIP_ALREADY_CLOSED',
          message: 'Trip is already closed'
        }
      });
    }

    // Calculate final statistics
    const totalItems = trip.trip_items.length;
    const returnedItems = trip.trip_items.filter(ti => ti.status === 'returned').length;
    const lostItems = trip.trip_items.filter(ti => ti.status === 'lost' || ti.status === 'not_found').length;

    // Close the trip
    trip.status = 'closed';
    await trip.save();

    const updatedTrip = await Trip.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });

    return res.json({
      ...updatedTrip.toJSON(),
      final_statistics: {
        total_items: totalItems,
        returned_items: returnedItems,
        lost_items: lostItems,
        return_percentage: totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error closing trip:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to close trip',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};
