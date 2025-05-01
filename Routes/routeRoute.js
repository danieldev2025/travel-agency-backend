const express = require('express');
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.get('/', routeController.getAllRoutes);
router.post('/', routeController.createRoute);
router.get('/:id', routeController.getRouteById);
router.put('/:id', routeController.updateRoute);
router.delete('/:id', routeController.deleteRoute);

module.exports = router;