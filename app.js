const envFile = require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');

const Promise = require('bluebird');
fs = Promise.promisifyAll(require('fs'));
const https = require("https");

let expressValue = express();
expressValue = Promise.promisifyAll(expressValue);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        console.log(`\n${new Date()} Recieved File: ${file.originalname}`);
        cb(null, file.originalname)
    }
});

const upload = multer({storage: storage});
let app = {};
app['upload'] = upload;
app['path'] = path;
app['fs'] = fs;
app['https'] = https;

try {
    let apiInfo = {
        host: process.env.apiHost,
        port: process.env.apiPort,
        routes: {
            cors: true
        }
    };
    expressValue.listen(apiInfo);
    console.log('Express Connection Initialized : http://' + process.env.apiHost + ':' + process.env.apiPort);
} catch (e) {
    console.log('Error @ Express Connection Initialization : ' + e)
}
app['express'] = expressValue;

const controller = require('./routes/controller');

class AppServer {
    constructor() {
        const controllerObject = new controller(app);
        controllerObject.init()
    }
}

module.exports = new AppServer();
