const express       = require('express');
const router        = express.Router();
const ctrl          = require('../controladores/mensajeController');
const { verifyToken } = require('../middlewares/auth');

router.get('/mensajes', verifyToken, ctrl.listarMensajes);
router.post('/mensajes/:id', verifyToken, ctrl.responderMensaje);

module.exports = router;
