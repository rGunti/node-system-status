/*
 * Copyright (c) 2017 Raphael Guntersweiler, All rights reserved!
 */

let express = require('express');
let router = express.Router();
let HandleRender = require('../ui/handlebar-renderer');
let ServiceChecker = require('../core/service-checker');

/* GET home page. */
router.get('/', function(req, res) {
    let services = ServiceChecker.services;
    HandleRender.render(res, 'index', 'System Status', {services: services})
});
router.get('/service/:service/check', (req, res) => {
    let serviceName = req.params.service;
    if (serviceName in ServiceChecker.services) {
        let service = ServiceChecker.services[serviceName];
        if (!service.enabled) {
            return res.json({
                ok: true,
                error: null,
                status: 'disabled',
                data: null,
                lastUpdated: 'never',
                service: service
            })
        } else {
            ServiceChecker.getServiceStatus(serviceName, (data) => {
                res.json({
                    ok: true,
                    error: data.error,
                    status: data.status,
                    data: data.data,
                    lastUpdated: data.lastUpdated,
                    service: service
                });
            });
        }
    } else {
        res.status(404);
        return res.json({ ok: false })
    }
});

module.exports = router;
