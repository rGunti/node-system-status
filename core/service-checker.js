/*
 * Copyright 2017 Raphael Guntersweiler
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

const debug = require('debug')('node-system-status:');
const http = require('http');
const net = require('net');
const url = require('url');

const ServiceChecker = {
    services: {},
    init: (services) => {
        ServiceChecker.services = services
    },
    checkService: (service, callback) => {
        debug(`${service.name}: Checking service ...`);
        switch (service.type) {
            case "http":
                ServiceChecker.checkHttpService(service, callback);
                break;
            default:
                debug(`${service.name}: Service Type ${service.type} not implemented`);
                if (callback) callback('Not Implemented');
                break;
        }
    },
    checkHttpService: (service, callback) => {
        let srvUrl = url.parse(service.url);
        try {
            let request = http.get({
                host: srvUrl.hostname,
                path: srvUrl.path
            }, (r) => {
                debug(`${service.name}: Service is available`);
                if (callback) callback(null);
            }).on('end', (e) => {
                debug(`${service.name}: Service could not be reached`);
                console.log(e);
                if (callback) callback(e);
            });
            request.on('error', (e) => {
                debug(`${service.name}: Service could not be reached`);
                console.log(e);
                if (callback) callback(e);
            })
        } catch (err) {
            if (callback) callback(err);
        }
    }
};

module.exports = ServiceChecker;
