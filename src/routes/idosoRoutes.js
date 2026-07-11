const express = require('express');
const router = express.Router();
const IdosoController = require('../controllers/IdosoController');

router.get('/', IdosoController.index);
router.post('/', IdosoController.create);

module.exports = router;