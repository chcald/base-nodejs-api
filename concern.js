const express = require('express');
const _ = require('lodash');
const mongoose = require('mongoose');
const ConcernController = require('./concern-controller.js');
const AutomovilModel = require('./concern-model.js');

const Controller = new ConcernController({});

const router = express.Router();

const Concern = function Concern(service) {
  this.service = service;
};

Concern.prototype.routes = function concernRoutes() {

  router.get('/automoviles', (req, res) => {
    Controller
      .findAll({
        fieldsToFetch: req.fieldsToFetch,
        recordsPerPage: parseInt(req.query.records_per_page, 10)
      })
      .then((automoviles) => {
        if (automoviles.length === 0) {
          res.status(404).send(automoviles);
        } else {
          res.status(200).send(automoviles);
        }
      })
      .catch((reason) => {
        this.service.log.error(`${this.service.name}: error when serving ${JSON.stringify(req.method)} ${req.path}`);
        this.service.log.error(`${this.service.name}: ${reason}`);
        res.status(500).send({ error: true, result: null, msg: reason });
      });

  });

  router.get('/automoviles/:id', (req, res) => {
    Controller
      .findOne({
        fieldsToFetch: req.fieldsToFetch,
        recordsPerPage: parseInt(req.query.records_per_page, 10),
        automovilId: req.params.id
      })
      .then((automovil) => {
        if (automovil === null) {
          res.status(404).send(automovil);
        } else {
          res.status(200).send(automovil);
        }
      })
      .catch((reason) => {
        this.service.log.error(`${this.service.name}: error when serving ${JSON.stringify(req.method)} ${req.path}`);
        this.service.log.error(`${this.service.name}: ${reason}`);
        res.status(500).send({ error: true, result: null, msg: reason });
      });
  });

  router.post('/automoviles', (req, res) => {
    Controller
      .addNew({
        automovilValues: req.body
      })
      .then((savedautomovil) => {
        res.status(201).send(savedautomovil);
      })
      .catch((reason) => {
        this.service.log.error(`${this.service.name}: error when serving ${JSON.stringify(req.method)} ${req.path}`);
        this.service.log.error(`${this.service.name}: ${reason}`);
        const errorBody = {
          errors: [{
            source: { pointer: `http://${process.env.GATEWAY_HOST}:8080/automoviles` },
            detail: reason.errors
          }]
        };
        res.status(400).send(errorBody);
      });
  });

  router.patch('/automoviles/:id', (req, res) => {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(422).send({
        errors: [{
          source: { pointer: `http://${process.env.GATEWAY_HOST}:8080/automoviles` },
          detail: '_missing_data_member_in_document_body_'
        }]
      });
    } else if (!req.body) {
      const errorBody = {
        errors: [{
          source: { pointer: `http://${process.env.GATEWAY_HOST}:8080/automoviles` },
          detail: '_missing_data_member_in_document_body_'
        }]
      };
      res.status(422).send(errorBody);
    } else {
      Controller
        .patch({
          automovilValues: req.body,
          automovilId: req.params.id
        })
        .then((savedautomovil) => {
          res.status(200).send();
        })
        .catch((reason) => {
          this.service.log.error(`${this.service.name}: error when serving ${JSON.stringify(req.method)} ${req.path}`);
          this.service.log.error(`${this.service.name}: ${reason}`);
          const errorBody = {
            errors: [{
              source: { pointer: `http://${process.env.GATEWAY_HOST}:8080/automoviles` },
              detail: reason.errors
            }]
          };
          res.status(500).send(errorBody);
        });
    }
  });

  router.delete('/automoviles/:id', (req, res) => {
    Controller.delete({ _id: mongoose.Types.ObjectId(req.params.id) })
      .then((result) => {
        res.status(200).send({ deleteResult: result });
      })
      .catch((reason) => {
        res.send({
          errors: [{
            source: { pointer: `http://${process.env.GATEWAY_HOST}:8080/automoviles` },
            detail: reason.errors[0].message
          }]
        });
      });
  });

  return router;
};
module.exports = Concern;
