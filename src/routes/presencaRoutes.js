const express = require('express');
const router = express.Router();
const PresencaController = require('../controllers/PresencaController');

// Rota que vai receber o rosto e devolver o nome
router.post('/reconhecer', PresencaController.reconhecer);

module.exports = router;