const express = require('express');
const router = express.Router();
const IdosoController = require('../controllers/IdosoController');
const { autenticar, autorizar } = require('../middleware/auth');

const podeGestao = [autenticar, autorizar('admin', 'gestor')];

router.get('/', ...podeGestao, IdosoController.index);
router.post('/', ...podeGestao, IdosoController.create);
router.get('/:id', ...podeGestao, IdosoController.show);
router.put('/:id', ...podeGestao, IdosoController.update);
router.patch('/:id/status', ...podeGestao, IdosoController.atualizarStatus);
router.delete('/:id', ...podeGestao, IdosoController.remove);

module.exports = router;
