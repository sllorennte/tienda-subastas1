const express    = require('express');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const path       = require('path');
require('dotenv').config();

const usuarioRutas  = require('./rutas/usuarioRutas');
const productoRutas = require('./rutas/productoRutas');
const pujaRutas     = require('./rutas/pujaRutas');
const resenasRutas  = require('./rutas/resenasRutas'); // Rutas de reseñas
const mensajeRutas = require('./rutas/mensajeRutas');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(
  process.env.MONGODB_URI ||
    'mongodb+srv://admin:cD53735F@cluster0.tdsqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('MongoDB Atlas conectado'))
.catch(err => console.error(' Error MongoDB Atlas:', err));

// Montar rutas bajo /api
app.use('/api', usuarioRutas);    // /api/usuarios...
app.use('/api', productoRutas);   // /api/productos...
app.use('/api', pujaRutas);       // /api/pujas...
app.use('/api', resenasRutas);    // /api/resenas...
app.use('/api', mensajeRutas);

// Punto de entrada del front-end
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
