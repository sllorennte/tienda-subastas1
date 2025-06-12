const Mensaje = require('../modelos/Mensaje');

exports.listarMensajes = async (req, res) => {
  try {
    // el usuario autenticado ve todos los mensajes donde sea destinatario
    const userId = req.user.id;
    const msgs = await Mensaje.find({ destinatario: userId })
                              .sort({ fecha: -1 });
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar mensajes' });
  }
};

exports.responderMensaje = async (req, res) => {
  try {
    // Podrías reenviar email aquí con nodemailer si quieres
    // O simplemente guardar como un nuevo Mensaje intercambiando remitente/destinatario
    const userId = req.user.id;
    const { texto } = req.body;
    const orig = await Mensaje.findById(req.params.id);
    if (!orig) return res.status(404).json({ error: 'Mensaje no encontrado' });

    const resp = new Mensaje({
      remitente: userId,
      destinatario: orig.remitente,
      texto
    });
    await resp.save();
    res.status(201).json(resp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al responder mensaje' });
  }
};

exports.crearMensaje = async (req, res) => {
  try {
    const remitente = req.user.id;
    const { destinatario, texto } = req.body;

    if (!destinatario || !texto) {
      return res.status(400).json({ error: 'Faltan destinatario o texto' });
    }

    const nuevoMensaje = new Mensaje({
      remitente,
      destinatario,
      texto,
      fecha: new Date()
    });

    await nuevoMensaje.save();
    res.status(201).json(nuevoMensaje);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
};
