const express = require('express');
const router = express.Router();
const BackupController = require('../controllers/BackupController');
const { autenticar, autorizar } = require('../middleware/auth');

const soAdmin = [autenticar, autorizar('admin')];

router.get('/info', ...soAdmin, BackupController.info);
router.get('/download', ...soAdmin, BackupController.download);
router.post('/servidor', ...soAdmin, BackupController.salvarServidor);
router.post('/restore', ...soAdmin, BackupController.uploadRestore, BackupController.restore);

module.exports = router;
