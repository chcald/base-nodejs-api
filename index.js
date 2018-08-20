const mongoose = require('mongoose');
const AutomovilModel = require('./concern-model.js');

  this.Model = AutomovilModel;



  let result = this.Model.find({})

  console.log(result);