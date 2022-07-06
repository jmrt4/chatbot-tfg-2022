const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conocimientoSchema = new Schema({
    categoria: String,
    descripcion: String,
    enlace: String
});

// Crear modelo
const Conocimiento = mongoose.model('Conocimiento', conocimientoSchema);

module.exports = Conocimiento;