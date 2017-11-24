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
    if (serviceData.lastUpdated) {
        let lastUpdated = moment(serviceData.lastUpdated);
        if (lastUpdated.isValid()) {
            lastUpdatedField.text(lastUpdated.format('L LTS'));
        } else {
            lastUpdatedField.text(serviceData.lastUpdated);
        }
    }

    let lastClientUpdatedField = $('.service-last-updated-client', serviceLine);
    if (serviceData.status !== 'loading')
        lastClientUpdatedField.text(moment().format('L LTS'));

    let additionalData = $('.service-additional-data', serviceLine);
    if (serviceData.status === 'loading') {
        return;
    } else if (serviceData.service) {
        additionalData.show();
        switch (serviceData.service.type) {
            case "http":
                if (serviceData.data.timeTaken)
                    additionalData.text('Response time: ' + serviceData.data.timeTaken + ' ms');
                else
                    additionalData.text('...');
                break;
            case "ping":
                if (serviceData.data) {
                    additionalData.text('Average Ping: ' + Math.round(serviceData.data.avg) + ' ms');
                } else {
                    additionalData.text('...');
                }
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
    setStatus(statusIndicator, {status: 'loading'});
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
    moment.locale(window.navigator.userLanguage || window.navigator.language);

    $('.button-collapse').sideNav();
    $('.refresh-service').click(function(e) {
        let service = $(e.currentTarget).data('service');
        checkService(service);
    });
    $('.refresh-button').click(function(e) {
        checkAllServices();
        $('.button-collapse').sideNav('hide');
    });
    $('.refresh-service').hide();
    PullToRefresh.init({
        mainElement: 'body',
        iconArrow: '<span class="fa fa-fw fa-arrow-down"></span>',
        iconRefreshing: '<span class="fa fa-fw fa-hourglass-half"></span>',
        refreshTimeout: 1000,
        onRefresh: function() {
            checkAllServices();
        }
    });

    checkAllServices();
});