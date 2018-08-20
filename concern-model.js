const mongoose = require('mongoose');
const validate = require('mongoose-validator');


const Schema = mongoose.Schema;

const automovilSchema = new Schema({
  crated_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  id: { type: Number },
  name: { type: String },
  opcionales: [String]
});


module.exports = mongoose.model('Automovil', automovilSchema);
