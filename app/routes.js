var home = require('../controllers/home'),
    unearthed = require('../controllers/unearthed'),
    triplej = require('../controllers/triplej'),
    doublej = require('../controllers/doublej');

module.exports.initialize = function(app) {
    app.get('/', home.index);
    app.get('/triplej', home.index);
    app.get('/unearthed', home.index);
    app.get('/doublej', home.index);

    // unearthed
    app.get('/api/unearthed', unearthed.tracks);
    app.get('/api/unearthed/new', unearthed.new);
    app.get('/api/unearthed/artist', unearthed.artist);
    app.get('/api/unearthed/track', unearthed.track);
    app.get('/api/unearthed/featured', unearthed.featured);
    app.get('/api/unearthed/recent', unearthed.recent);

    // triple j
    app.get('/api/triplej', triplej.tracks);
    app.get('/api/triplej/recent', triplej.recent);

    // double j
    app.get('/api/doublej', doublej.tracks);
    app.get('/api/doublej/track', doublej.track);
    app.get('/api/doublej/recent', doublej.recent);
};
