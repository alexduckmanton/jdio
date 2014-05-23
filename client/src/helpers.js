var Handlebars = require('hbsfy/runtime');

module.exports = Helpers = function Helpers() {
    Handlebars.registerHelper('track_info', require('../templates/info.hbs'));
    Handlebars.registerHelper('loading', require('../templates/loading.hbs'));
    Handlebars.registerHelper('clock', require('../templates/clock.hbs'));

    Handlebars.registerHelper('time', function(options) {
        var current = new Date(),
            site = options.hash.site,
            local = new Date(options.hash.local),
            utc = new Date(options.hash.utc),
            track = site == 'unearthed' ? local : utc,
            diff = current.getTime() - track.getTime(),
            text = 'mins ago';

        // get whole minutes
        diff = Math.floor( diff / 1000 / 60 );

        // don't show "1 mins ago" like an idiot
        if (diff == 1) text = 'min ago';

        return new Handlebars.SafeString('<strong>' + diff + '</strong>' + ' ' + text);
    });
};
