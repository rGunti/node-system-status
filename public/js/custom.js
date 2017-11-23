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

function setStatus(statusIndicator, status) {
    statusIndicator.removeClass();
    statusIndicator.addClass(STATUS_INDICATOR_CLASSES[status]);
}

function checkService(service) {
    let statusIndicator = $('#service-' + service + ' .circle');
    setStatus(statusIndicator, 'loading');
    $.ajax('/service/' + service + '/check')
        .done(function(d) {
            console.log(d);
            setStatus(statusIndicator, d.status);
        }).fail(function(e) {
            console.log(e);
            setStatus(statusIndicator, 'unknown');
        });
}

$(document).ready(function() {
    $('.button-collapse').sideNav();
    $('.refresh-service').click(function(e) {
        let service = $(e.currentTarget).data('service');
        checkService(service);
    });
    $('.services a.refresh-service').each(function(i, l) {
        checkService($(l).data('service'));
    });
});