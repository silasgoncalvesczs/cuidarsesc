const express = require('express');
const router = express.Router();
const IdosoController = require('../controllers/IdosoController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/', autenticar, autorizar('admin', 'gestor'), IdosoController.index);
router.post('/', autenticar, autorizar('admin', 'gestor'), IdosoController.create);

module.exports = router;