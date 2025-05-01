const { sequelize } = require('../config/dbConfig');

// Get all routes with pagination and search
exports.getAllRoutes = async (req, res) => {
    try {
        let { page, limit, search } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        const result = await sequelize.query(
            'SELECT * FROM route_get_all(:limit, :offset, :search)',
            {
                replacements: { limit, offset, search: search || null },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (!result || result.length === 0) {
            return res.status(200).json({
                status: true,
                message: 'No routes found',
                data: [],
                meta: {
                    currentPage: page,
                    numberOfPages: 0,
                }
            });
        }

        const totalCount = parseInt(result[0].total_count);
        const numberOfPages = Math.ceil(totalCount / limit);

        // Transform the data to match the expected format
        const routes = result.map(route => ({
            id: route.id,
            fromCity: route.from_city,
            toCity: route.to_city,
            adultFare: parseFloat(route.adult_fare),
            adultComm: parseFloat(route.adult_comm),
            adultInfantFare: parseFloat(route.adult_infant_fare),
            adultInfantComm: parseFloat(route.adult_infant_comm),
            childFare: parseFloat(route.child_fare),
            childComm: parseFloat(route.child_comm),
            adultReturnDiscount: parseFloat(route.adult_return_discount),
            adultInfantReturnDiscount: parseFloat(route.adult_infant_return_discount),
            childReturnDiscount: parseFloat(route.child_return_discount),
            createdAt: route.created_at,
            updatedAt: route.updated_at
        }));

        res.status(200).json({
            status: true,
            message: 'Routes retrieved successfully',
            data: routes,
            meta: {
                currentPage: page,
                numberOfPages: numberOfPages,
            }
        });
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({
            status: false,
            message: 'An unexpected error occurred while retrieving routes'
        });
    }
};

// Get a single route by ID
exports.getRouteById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                status: false,
                message: 'Invalid route ID'
            });
        }

        const result = await sequelize.query(
            'SELECT * FROM route_get_one(:id)',
            {
                replacements: { id: parseInt(id) },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (!result || result.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Route not found'
            });
        }

        // Transform the data to match the expected format
        const route = {
            id: result[0].id,
            fromCity: result[0].from_city,
            toCity: result[0].to_city,
            adultFare: parseFloat(result[0].adult_fare),
            adultComm: parseFloat(result[0].adult_comm),
            adultInfantFare: parseFloat(result[0].adult_infant_fare),
            adultInfantComm: parseFloat(result[0].adult_infant_comm),
            childFare: parseFloat(result[0].child_fare),
            childComm: parseFloat(result[0].child_comm),
            adultReturnDiscount: parseFloat(result[0].adult_return_discount),
            adultInfantReturnDiscount: parseFloat(result[0].adult_infant_return_discount),
            childReturnDiscount: parseFloat(result[0].child_return_discount),
            createdAt: result[0].created_at,
            updatedAt: result[0].updated_at
        };

        res.status(200).json({
            status: true,
            message: 'Route fetched successfully',
            data: route
        });
    } catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({
            status: false,
            message: 'An unexpected error occurred while fetching route'
        });
    }
};

// Create a new route
exports.createRoute = async (req, res) => {
    try {
        const {
            fromCity,
            toCity,
            adultFare,
            adultComm,
            adultInfantFare,
            adultInfantComm,
            childFare,
            childComm,
            adultReturnDiscount,
            adultInfantReturnDiscount,
            childReturnDiscount
        } = req.body;

        // Validate required fields
        if (!fromCity || !toCity) {
            return res.status(400).json({
                status: false,
                message: 'From city and to city are required'
            });
        }

        const result = await sequelize.query(
            'SELECT route_create(:fromCity, :toCity, :adultFare, :adultComm, :adultInfantFare, :adultInfantComm, :childFare, :childComm, :adultReturnDiscount, :adultInfantReturnDiscount, :childReturnDiscount)',
            {
                replacements: {
                    fromCity,
                    toCity,
                    adultFare: parseFloat(adultFare || 0),
                    adultComm: parseFloat(adultComm || 0),
                    adultInfantFare: parseFloat(adultInfantFare || 0),
                    adultInfantComm: parseFloat(adultInfantComm || 0),
                    childFare: parseFloat(childFare || 0),
                    childComm: parseFloat(childComm || 0),
                    adultReturnDiscount: parseFloat(adultReturnDiscount || 0),
                    adultInfantReturnDiscount: parseFloat(adultInfantReturnDiscount || 0),
                    childReturnDiscount: parseFloat(childReturnDiscount || 0)
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const newRouteId = result[0].route_create;

        res.status(201).json({
            status: true,
            message: 'Route created successfully',
            data: { id: newRouteId }
        });
    } catch (error) {
        console.error('Error creating route:', error);
        
        if (error.message.includes('Route already exists')) {
            return res.status(400).json({
                status: false,
                message: 'Route already exists for these cities'
            });
        }
        
        res.status(500).json({
            status: false,
            message: 'An unexpected error occurred while creating the route'
        });
    }
};

// Update a route
exports.updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fromCity,
            toCity,
            adultFare,
            adultComm,
            adultInfantFare,
            adultInfantComm,
            childFare,
            childComm,
            adultReturnDiscount,
            adultInfantReturnDiscount,
            childReturnDiscount
        } = req.body;

        // Validate required fields
        if (!fromCity || !toCity) {
            return res.status(400).json({
                status: false,
                message: 'From city and to city are required'
            });
        }

        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                status: false,
                message: 'Invalid route ID'
            });
        }

        const result = await sequelize.query(
            'SELECT route_update(:id, :fromCity, :toCity, :adultFare, :adultComm, :adultInfantFare, :adultInfantComm, :childFare, :childComm, :adultReturnDiscount, :adultInfantReturnDiscount, :childReturnDiscount)',
            {
                replacements: {
                    id: parseInt(id),
                    fromCity,
                    toCity,
                    adultFare: parseFloat(adultFare || 0),
                    adultComm: parseFloat(adultComm || 0),
                    adultInfantFare: parseFloat(adultInfantFare || 0),
                    adultInfantComm: parseFloat(adultInfantComm || 0),
                    childFare: parseFloat(childFare || 0),
                    childComm: parseFloat(childComm || 0),
                    adultReturnDiscount: parseFloat(adultReturnDiscount || 0),
                    adultInfantReturnDiscount: parseFloat(adultInfantReturnDiscount || 0),
                    childReturnDiscount: parseFloat(childReturnDiscount || 0)
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const updated = result[0].route_update;

        if (!updated) {
            return res.status(404).json({
                status: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            status: true,
            message: 'Route updated successfully'
        });
    } catch (error) {
        console.error('Error updating route:', error);
        
        if (error.message.includes('Route already exists')) {
            return res.status(400).json({
                status: false,
                message: 'Route already exists for these cities'
            });
        }
        
        res.status(500).json({
            status: false,
            message: 'An unexpected error occurred while updating the route'
        });
    }
};

// Delete a route
exports.deleteRoute = async (req, res) => {
    try {
        const { id } = req.params;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                status: false,
                message: 'Invalid route ID'
            });
        }

        const result = await sequelize.query(
            'SELECT route_delete(:id)',
            {
                replacements: { id: parseInt(id) },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const deleted = result[0].route_delete;

        if (!deleted) {
            return res.status(404).json({
                status: false,
                message: 'Route not found'
            });
        }

        res.status(200).json({
            status: true,
            message: 'Route deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({
            status: false,
            message: 'An unexpected error occurred while deleting the route'
        });
    }
};