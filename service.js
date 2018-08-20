const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const q = require('q');
const Concern = require('./concern.js');

const Service = function Constructor(options) {
  this.numberOfReceivedRequests = 0;
  Object.assign(this, options);
  return this;
};

Service.prototype.validateEnvironment = function validateEnvironment() {
  const deferred = q.defer();

  let err = false;
  const requiredEnvironmentVariables = [
    'DB_HOST',
    'DB_USER',
    'DB_PASS',
    'DB_SCHEMA',
    'NODE_ENV',
    'SERVICE_NAME',
    'PORT'
  ];
  const environmentKeys = Object.keys(process.env);

  requiredEnvironmentVariables.forEach((aRequiredEnvVariable) => {
    if (environmentKeys.indexOf(aRequiredEnvVariable) === -1) {
      err = `Service misconfiguration, missing environment variable: ${aRequiredEnvVariable}`;
    }
  });

  if (err) {
    deferred.reject(err);
  } else {
    this.env = process.env;
    deferred.resolve(this);
  }
  return deferred.promise;
};

Service.prototype.setupLogger = function setupLogger(winston) {
  const deferred = q.defer();
  this.log = new winston.Logger({
    transports: [
      new(winston.transports.DailyRotateFile)({
        handleExceptions: false,
        json: true,
        level: 'debug',
        filename: __dirname + '/logs/' + this.name + '-',
        datePattern: 'yyyyMMdd.log',
        timestamp: true
      })
    ],
    exitOnError: false
  });
  this.log.info(`${this.name}: Logger Initialized.`);
  deferred.resolve(this);
  return deferred.promise;
};

Service.prototype.setupDB = function setupDB(mongoose) {
  const deferred = q.defer();
  const dbConnectionOptions = {
    db: { native_parser: true },
    server: { poolSize: process.env.DB_POOL_SIZE },
    user: '',
    pass: ''
  };
  mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SCHEMA}`, dbConnectionOptions).then((result) => {
    this.log.info(`${this.name}: DB connection initialized.`);
    deferred.resolve(this);
  }).catch((reason) => {
    this.log.error(`${this.name}: DB connection failed.`);
    this.log.error(`${this.name}: ${reason}`);
    deferred.reject(reason);
  });
  deferred.resolve(this);
  return deferred.promise;
};

Service.prototype.setupExpress = function setupExpress() {
  const deferred = q.defer();
  // Express Setup
  const app = express();

  app.use((req, res, next) => {
    res.set('Content-Type', 'application/json');
    next();
  });

  app.use(compression());
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.disable('x-powered-by');


  app.use((req, res, next) => {
    // Some accounting
    this.numberOfReceivedRequests += 1;
    this.log.info(`${this.name}: got request from: ${req.ip} route: '${req.originalUrl}' params: ${JSON.stringify(req.params)}`);
    next();
  });

  app.get('/status', (req, res) => {
    res.send({
      upTime: process.uptime(),
      numberOfReceivedRequests: this.numberOfReceivedRequests
    });
  });

  const port = process.env.PORT || '3000';
  app.set('port', port);

  this.express = app;
  this.log.info(`${this.name}: Express has been configured.`);

  deferred.resolve(this);
  return deferred.promise;
};

Service.prototype.setupConcern = function setupConcern() {
  const deferred = q.defer();
  const concern = new Concern(this);
  this.express.use(concern.routes());
  this.log.info(`${this.name}: Concern has been configured.`);
  deferred.resolve(this);
  return deferred.promise;
};

Service.prototype.setupExpressRouteErrorHandlers = function setupExpressRouteErrorHandlers() {
  const deferred = q.defer();
  this.express.use((req, res, next) => {
    const err = new Error(`${this.name}: Resource Not Available ${req.path}`);
    err.status = 404;
    next(err);
  });

  // error handler
  this.express.use((err, req, res) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.send(err);
  });
  this.log.info(`${this.name}: Registered Express error handling routes.`);
  deferred.resolve(this);
  return deferred.promise;
};

Service.prototype.start = function startService(http) {
  const deferred = q.defer();

  this.server = http.createServer(this.express);
  try {
    this.server.listen(this.express.get('port'));
    this.log.info(`${this.name}: Up and Running`);
    deferred.resolve(this);
  } catch (reason) {
    deferred.reject(reason);
  }
  return deferred.promise;
};

Service.prototype.registerService = function registerService(request) {
  const deferred = q.defer();
  // @TODO add error checking!
  request.get(`http://${process.env.SERVICE_REGISTRY_HOST}:${process.env.SERVICE_REGISTRY_PORT}/serviceRegister/${process.env.SERVICE_NAME}/${process.env.SERVICE_ADDRESS}/${process.env.PORT}`, (error, response, body) => {
    this.log.info(`${this.name}: Service registered with Service Registry.`);
    this.log.info(`${this.name}: Gateway response was. ${body}`);
    deferred.resolve(this);
    return deferred.promise;
  });
};

module.exports = Service;
