var Marionette = require('backbone.marionette'),
    TracksView = require('../views/tracks'),
    TracksCollection = require('../collections/tracks');

module.exports = layout = Marionette.Layout.extend({
    className: 'site',
    tagName: 'section',
    template: require('../../templates/site.hbs'),

    events: {
        'click .radio': 'toggle_radio',
        'click .toggle_played': 'toggle_played',
        // 'touchstart .tracks': 'init_touch',
        'click': 'navigate'
        // 'touchleave': 'navigate'
        // 'touchmove': 'navigate'
    },

    initialize: function() {
        this.listenTo(App.core.vent, 'track:play', this.update_ui_for_player);
        this.listenTo(this.model, 'change:active', this.toggle_active);

        this.toggle_active();
        this.listenToOnce(this.model, 'change:active', this.get_tracks);

        // if (App.data.window.width <= 700) {
            var name = this.model.get('name');
            this.listenTo(App.core.vent, name+':played:show', this.toggle_tray);
            this.listenTo(App.core.vent, name+':played:hide', this.toggle_tray);
        // }
    },

    onRender: function() {
        this.$el.addClass(this.model.get('name'));

        this.init_played();
        this.init_tracks();

        this.$header = this.$el.children('header');
        this.$tracks = this.$el.children('.tracks');
        this.$played = this.$el.children('.played');

        if (App.data.window.width > 700)
            this.get_played();
            // this.listenToOnce(this.model, 'change:active', this.get_played);
    },

    navigate: function() {
        if (this.model.get('active')) return;

        App.router.navigate(this.model.get('name'), {trigger: true});
    },

    toggle_active: function() {
        this.$el.toggleClass('active', this.model.get('active'));
    },

    init_touch: function(e) {
        var name = this.model.get('name'),
            scroll_pos = $(window).scrollTop(),
            touch_pos = e.originalEvent.pageY,
            tracks = this.$el.find('.tracks');

        if (!App.views[name].playedView.collection.active && !App.views.playerView.model.get('is_playing')) {
            // do clock and get played tracks
            this.model.set('init_touch', touch_pos);
            tracks.on('touchmove', '', {context:this}, this.drag);
            tracks.one('touchend', '', {context:this}, this.end_touch);
        }
    },

    drag: function(e) {
        var self = e.data.context,
            scroll_pos = $(window).scrollTop(),
            init_touch = self.model.get('init_touch'),
            new_touch = e.originalEvent.pageY,
            diff = init_touch - new_touch;

        // update the clock
        if (scroll_pos <= 0 && new_touch > init_touch) self.rotate_clock(init_touch, new_touch);
        // if (diff < -100) $('.played').addClass('active');

        self.model.set('prev_touch', new_touch);
    },

    end_touch: function(e) {
        var self = e.data.context,
            tracks = self.$el.find('.tracks'),
            clock = self.$el.find('.clock'),
            init_touch = self.model.get('init_touch'),
            prev_touch = self.model.get('prev_touch'),
            diff = init_touch - prev_touch;

        // clear styles from dragging
        clock.attr('style', '');
        clock.children().attr('style', '');

        // unbind touch events
        tracks.off('touchmove');

        // load played tracks if dragged far enough
        if (diff < -100) self.toggle_played();
    },

    rotate_clock: function(init_touch, new_touch) {
        var diff = init_touch - new_touch,
            clock = this.$el.find('.clock'),
            hour = clock.children('.hour'),
            minute = clock.children('.minute'),
            second = clock.children('.second'),
            hour_r = 120,
            minute_r = 0,
            second_r = 225,
            hour_m = 0.5,
            minute_m = hour_m * 12,
            second_m = minute_m * 2,
            clock_bg = Math.min( Math.abs(diff/100)/2 , 0.5 );

        hour.css  ('-webkit-transform', 'rotate('+ (hour_r + diff) * hour_m +'deg)');
        minute.css('-webkit-transform', 'rotate('+ (minute_r + diff) * minute_m +'deg)');
        second.css('-webkit-transform', 'rotate('+ (second_r + diff) * second_m +'deg)');
        clock.css('background', 'rgba(0,0,0,'+ clock_bg +')');

        // need to force a repaint for ios while scrolling
        this.repaint(hour[0]);
        this.repaint(minute[0]);
        this.repaint(second[0]);
        this.repaint(clock[0]);
    },

    repaint: function(element) {
        // weird hack to force a repaint in ios
        element.style.display='none';
        var temp = element.offsetHeight; // no need to store this anywhere, the reference is enough
        element.style.display='inline-block';
    },

    init_tracks: function() {
        var name = this.model.get('name'),
            tracks = new TracksCollection();

        tracks.site = name;

        App.views[name].tracksView = new TracksView({
            collection: tracks
        });
        this.$el.children('header').after(App.views[name].tracksView.render().el);
    },

    get_tracks: function() {
        var self = this,
            name = this.model.get('name'),
            tracks = App.views[name].tracksView.collection,
            include_tracks = true;

        // should do this by checking track src, but that happens after loading the track into the page to prevent blocking
        // removing it after the fact looks weird, so best to do it here for any browser that doesn't support m3u8/hls
        if (name == 'doublej' && document.createElement('video').canPlayType('application/vnd.apple.mpegURL') === '') include_tracks = false;

        this.$tracks.before( require('../../templates/loading.hbs') );

        tracks.fetch({
            url: this.model.get('tracks_api'),
            data: {include_tracks: include_tracks},
            success: function() {
                App.data.tracks = tracks;
                self.remove_loader();
            }
        });
    },

    remove_loader: function() {
        var self = this,
            loader = this.$el.find('.site_loading');

        loader.addClass('loaded');

        loader.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {
            self.$el.find('.site_loading').remove();
        });
    },

    init_played: function() {
        var name = this.model.get('name');

        App.views[name].playedView = new TracksView({
            collection: new TracksCollection(),
            className: 'played',
            parent_name: name
        });
        this.$el.prepend(App.views[name].playedView.render().el);
    },

    get_played: function() {
        var self = this,
            name = this.model.get('name'),
            played = App.views[name].playedView.collection;

        this.toggle_played_loading();

        played.fetch({
            url: this.model.get('played_api'),
            success: function() {
                played.type = 'played';
                played.models.reverse();

                // store data and views in the app
                App.data.played = played;
                App.views[name].playedView.collection = App.data.played;

                // render
                self.toggle_played_loading();
                App.views[name].playedView.render();
                self.bind_played_events();
                App.core.vent.trigger(name+':played:show');
            }
        });
    },

    toggle_played: function() {
        var name = this.model.get('name'),
            played = App.views[name].playedView;

        if (!played.collection.active) {
            this.$el.find('.toggle_played').addClass('active');
            this.get_played();
        } else {
            App.core.vent.trigger(name+':played:hide');
        }
    },

    toggle_tray: function() {
        this.$el.toggleClass('show_tray');
        this.$el.find('.toggle_played').removeClass('active');
    },

    toggle_played_loading: function() {
        this.$el.find('.toggle_played').toggleClass('loading');
    },

    bind_played_events: function() {
        this.listenTo(App.core.vent, this.model.get('name')+':played:show', this.scroll_played);
    },

    scroll_played: function() {
        var $played = this.$el.children('.played'),
            $tracks = $played.children('.track'),
            track_height = $tracks.first().outerHeight(),
            played_height = $tracks.length * track_height;

        // snap scroll played tracks to bottom
        App.core.vent.trigger('scroll:pos', {
            pos: played_height,
            timing: 0,
            elem: $played
        });
    },

    toggle_radio: function() {
        var player = App.views.playerView.model,
            player_src = player.get('track').src,
            radio_src = this.model.get('src'),
            is_playing = player.get('is_playing');

        if (is_playing && player_src == radio_src) {
            App.core.vent.trigger('tracks:stop');
        } else {
            App.core.vent.trigger('track:play', this.model.attributes);
        }
    },

    update_ui_for_player: function(track) {
        var name = this.model.get('name');

        if (App.views[name].playedView.collection.active) this.toggle_played();
    }

});
