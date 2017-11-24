/*
 * Copyright (c) 2017 Raphael Guntersweiler, All rights reserved!
 */

const STATUS_INDICATOR_CLASSES = {
    'success': 'circle green fa fa-check',
    'warning': 'circle orange fa fa-exclamation-triangle',
    'error': 'circle red fa fa-remove',
    'loading': 'circle indigo fa fa-cog fa-spin',
    'disabled': 'circle fa fa-pause-circle',
    'unknown': 'circle fa fa-question'
};
const BADGE_CLASSES = {
    'warning': 'new badge orange',
    'error': 'new badge red',
    'success': 'new badge green',
    'loading': 'new badge indigo',
    'disabled': 'new badge grey',
    'unknown': 'new badge grey'
};
const STATUS_LEVEL = {
    'unknown': 0,
    'disabled': 1,
    'loading': 2,
    'success': 3,
    'warning': 4,
    'error': 5
};
let categories = {};

function getCategoryStatus(category) {
    let maxLevel = 0;
    let maxStatus = 'unknown';
    for (let service in categories[category]) {
        let state = categories[category][service];

        if (maxLevel < STATUS_LEVEL[state]) {
            maxStatus = state;
            maxLevel = STATUS_LEVEL[state];
        }
    }
    return maxStatus;
}

function setCategoryStatus(category) {
    if (!category) return;
    let status = getCategoryStatus(category);
    console.log(category, status);
    let badge = $('#category-' + category +'-badge');
    badge.removeClass();
    badge.addClass(BADGE_CLASSES[status]);
}

function setCachedServiceStatus(serviceName, categoryName, state) {
    if (!(categoryName in categories)) {
        categories[categoryName] = {};
    }
    categories[categoryName][serviceName] = state;
}

function setStatus(serviceLine, serviceData) {
    let statusIndicator = $('.circle', serviceLine);
    statusIndicator.removeClass();
    statusIndicator.addClass(STATUS_INDICATOR_CLASSES[serviceData.status]);
    setCachedServiceStatus(
        serviceLine.data('service'),
        serviceData.service.category,
        serviceData.status);
    setCategoryStatus(serviceData.service.category);


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
    let serviceLine = $('#service-' + service);
    let serviceCategory = serviceLine.parents().data('category');
    setStatus(serviceLine, {status: 'loading', service:{category: serviceCategory}});
    $.ajax('/service/' + service + '/check')
        .done(function(d) {
            console.log(d);
            setStatus(serviceLine, d);
        }).fail(function(e) {
            console.log(e);
            setStatus(serviceLine, {
                status: 'unknown',
                lastUpdated: new Date(),
                service: {
                    category: serviceCategory
                }
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