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

const debug = require('debug')('node-system-status:ServiceChecker');
const http = require('http');
const net = require('net');
const url = require('url');
const ps = require('ps-node');
const ping = require('ping');

const ServiceChecker = {
    services: {},
    results: {},
    init: (services) => {
        ServiceChecker.services = services;
        Object.keys(services).map((key, index) => {
            let service = services[key];
            if (!service.enabled) return;

            debug(`Initializing Service Checker Interval for ${key}`);
            ServiceChecker.checkServiceInterval(key);

            setInterval(() => {
                debug(`Checking Service '${key}' now ...`);
                ServiceChecker.checkServiceInterval(key);
            }, service.interval || 60000);
        });
    },
    getServiceStatus: (serviceName, callback) => {
        let serviceExists = (serviceName in ServiceChecker.services);
        let cachedResultExists = (serviceName in ServiceChecker.results);

        let result = null;
        if (serviceExists && cachedResultExists) {
            result = ServiceChecker.results[serviceName];
        } else if (serviceExists) {
            let service = ServiceChecker.services[serviceName];
            return ServiceChecker.checkService(service, (error, status, data) => {
                let serviceData = {
                    error: error,
                    status: status,
                    data: data,
                    lastUpdated: new Date()
                };
                ServiceChecker.results[serviceName] = serviceData;
                if (callback) callback(serviceData);
            });
        } else {
            result = {
                error: 'Invalid Service',
                status: 'unknown',
                data: data,
                lastUpdated: new Date()
            }
        }
        if (callback) callback(result);
    },
    checkAllServices: () => {
        Object.keys(ServiceChecker.services).map((key, index) => {
            let service = ServiceChecker.services[key];
            ServiceChecker.checkService(service, (error, status, data) => {
                ServiceChecker.results[key] = {
                    error: error,
                    status: status,
                    data: data,
                    lastUpdated: new Date()
                }
            });
        });
    },
    checkServiceInterval: (key) => {
        let service = ServiceChecker.services[key];
        ServiceChecker.checkService(service, (error, status, data) => {
            ServiceChecker.results[key] = {
                error: error,
                status: status,
                data: data,
                lastUpdated: new Date()
            }
        });
    },
    checkService: (service, callback) => {
        debug(`${service.name}: Checking service ...`);
        switch (service.type) {
            case "http":
                ServiceChecker.checkHttpService(service, callback);
                break;
            case "process":
                ServiceChecker.checkProcessService(service, callback);
                break;
            case "ping":
                ServiceChecker.checkPingService(service, callback);
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
            let startDate = new Date();
            let request = http.get({
                host: srvUrl.hostname,
                path: srvUrl.path
            }, (r) => {
                let timeTaken = new Date() - startDate;
                debug(`${service.name}: Service is available, took ${timeTaken} ms`);
                if (callback) callback(null, (timeTaken > (service.warningTimeout || 5000)) ? 'warning' : 'success', { timeTaken: timeTaken });
            }).on('end', (e) => {
                debug(`${service.name}: Service could not be reached`);
                console.log(e);
                if (callback) callback(e, 'error');
            });
            request.on('error', (e) => {
                debug(`${service.name}: Service could not be reached`);
                console.log(e);
                if (callback) callback(e, 'error');
            })
        } catch (err) {
            if (callback) callback(err, 'error');
        }
    },
    checkProcessService: (service, callback) => {
        ps.lookup({
            command: service.process,
            arguments: service.arguments,
            psargs: 'aux'  // or else can't find processes which don't belong to the executing user
        }, (err, result) => {
            if (err) {
                debug(`${service.name}: Service unavailable due to an error`);
                if (callback) callback(err, 'error');
                return;
            } else if (result.length === 0) {
                debug(`${service.name}: Service unavailable`);
                if (callback) callback('Empty', 'error');
                return;
            }
            result.forEach((p) => {
                if (p) {
                    debug(`${service.name}: Process found: PID=${p.pid}, ${p.command} ${p.arguments}`)
                }
            });
            if (callback) callback(null, 'success');
        });
    },
    checkPingService: (service, callback) => {
        ping.promise.probe(service.host, { timeout: (service.timeout / 1000) || 10 })
            .then((response) => {
                debug(`${service.name}: Ping response: Alive=${response.alive}, AvgTime=${response.avg}ms`);

                let state = (response.alive) ? (response.avg > service.warningTimeout ? 'warning' : 'success') : 'error';
                if (callback) callback(null, state, response);
            }).catch((err) => {
                if (callback) callback(err, 'error');
            });
    }
};

module.exports = ServiceChecker;
