/*
 * Copyright (c) 2017 Raphael Guntersweiler, All rights reserved!
 */

const STATUS_INDICATOR_CLASSES = {
    'success': 'circle green fa fa-check',
    'warning': 'circle orange fa fa-exclamation-triangle',
    'error': 'circle red fa fa-remove',
    'loading': 'circle fa fa-cog fa-spin',
    'disabled': 'circle fa fa-pause-circle',
    'unknown': 'circle fa fa-question'
};

function setStatus(serviceLine, serviceData) {
    let statusIndicator = $('.circle', serviceLine);
    statusIndicator.removeClass();
    statusIndicator.addClass(STATUS_INDICATOR_CLASSES[serviceData.status]);

    let lastUpdatedField = $('.service-last-updated', serviceLine);
    lastUpdatedField.text(serviceData.lastUpdated);

    if (serviceData.status === 'loading') return;

    let additionalData = $('.service-additional-data', serviceLine);
    if (serviceData.service) {
        additionalData.show();
        switch (serviceData.service.type) {
            case "http":
                additionalData.text('Request time: ' + serviceData.data.timeTaken + ' ms');
                break;
            default:
                additionalData.hide();
                break;
        }
    } else {
        additionalData.hide();
    }
}

function checkService(service) {
    let statusIndicator = $('#service-' + service);
    setStatus(statusIndicator, {status: 'loading', lastUpdated: '...'});
    $.ajax('/service/' + service + '/check')
        .done(function(d) {
            console.log(d);
            setStatus(statusIndicator, d);
        }).fail(function(e) {
            console.log(e);
            setStatus(statusIndicator, {
                status: 'unknown',
                lastUpdated: new Date(),
                service: null
            });
        });
}

function checkAllServices() {
    $('.services a.refresh-service').each(function(i, l) {
        checkService($(l).data('service'));
    });
}

$(document).ready(function() {
    $('.button-collapse').sideNav();
    $('.refresh-service').click(function(e) {
        let service = $(e.currentTarget).data('service');
        checkService(service);
    });
    checkAllServices();
    setInterval(checkAllServices, 10000);
});