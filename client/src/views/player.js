var Marionette = require('backbone.marionette');

module.exports = itemView = Marionette.ItemView.extend({
    className: 'player',
    template: require('../../templates/player.hbs'),

    initialize: function() {
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(App.core.vent, 'tracks:stop', this.on_stop);
    },

    events: {
        'click': 'stop'
    },

    onRender: function() {
        this.$el.toggleClass('playing', this.model.get('is_playing'));
    },

    on_stop: function() {
        var playing = App.data.tracks.where({is_playing: true});
        if (playing.length) return;

        this.model.stop();
    },

    stop: function() {
        App.core.vent.trigger('tracks:stop');
    }
});