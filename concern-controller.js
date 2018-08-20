const mongoose = require('mongoose');
const AutomovilModel = require('./concern-model.js');

const Automovil = function Constructor(options) {
  Object.assign(this, options);
  this.Model = AutomovilModel;
  return this;
};


Automovil.prototype.findAll = function ControllerFindAll(options) {
  let result = this.Model.find({})
    .select(options.fieldsToFetch)
    .sort({})
    .limit(options.recordsPerPage || process.env.RECORDS_PER_PAGE || null)
    .exec();

    return result;
};

Automovil.prototype.findOne = function ControllerFindOne(options) {
  let result = this.Model.findOne({ _id: mongoose.Types.ObjectId(options.automovilId) })
    .select(options.fieldsToFetch)
    .sort({})
    .limit(options.recordsPerPage || process.env.RECORDS_PER_PAGE || null)
    .exec();

    return result;
};

Automovil.prototype.addNew = function ControllerCreate(options) {
  const newAutomovilValues = options.automovilValues;
  const newAutomovil = new this.Model(newAutomovilValues);
  return newAutomovil.save();
};

Automovil.prototype.patch = function ControllerPatch(options) {
  delete options.automovilValues.created_at;
  options.automovilValues.updated_at = new Date();
  return this.Model.update({ _id: mongoose.Types.ObjectId(options.automovilId) }, options.automovilValues, {});
};

Automovil.prototype.delete = function ControllerDelete(options) {
  return this.Model.remove({ _id: mongoose.Types.ObjectId(options.automovilId) });
};


module.exports = Automovil;
