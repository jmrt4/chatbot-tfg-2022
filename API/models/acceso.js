const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accesoSchema = new Schema({
    medio: String,
    fecha: String,
    contador: Number
});

// Crear modelo
const Acceso = mongoose.model('Acceso', accesoSchema);

module.exports = Acceso;