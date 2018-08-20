'use strict';

require('dotenv').config({ path: process.env.NODE_ENV ? `${__dirname}/envs/.env.${process.env.NODE_ENV}` : `${__dirname}/envs/.env.development` });
const mongoose = require('mongoose');
const winston = require('winston');
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');
const http = require('http');
const request = require('request');
const Service = require('./service.js');

console.log(`BOOTSTRAPING SERVICE USING ENVIRONMENT: '${process.env.NODE_ENV}'`);
const service = new Service({ name: process.env.SERVICE_NAME });

service.validateEnvironment()
  .then(() => service.setupLogger(winston))
  .then(() => service.setupDB(mongoose))
  .then(() => service.setupExpress())
  .then(() => service.setupConcern())
  .then(() => service.setupExpressRouteErrorHandlers())
  .then(() => service.registerService(request))
  .then(() => service.start(http))
  .catch((reason) => {
    winston.error('Error during service bootstraping!');
    winston.error(reason);
  });
