(function () {
    'use strict';

    var Account = Lampa.Account;
    var Manifest = Lampa.Manifest;
    var Storage = Lampa.Storage;
    var Utils = Lampa.Utils;
    var TMDB = Lampa.TMDB;
    var Settings = Lampa.Settings;
    var Arrays = Lampa.Arrays;
    function ImageMirror() {
      var stat = [];
      var mirrors = ['imagetmdb.com/', 'nl.imagetmdb.com/', 'de.imagetmdb.com/', 'pl.imagetmdb.com/', 'lampa.byskaz.ru/tmdb/img/'];
      if (Account.hasPremium()) Arrays.insert(mirrors, 0, 'imagetmdb.' + Manifest.cub_domain + '/');
      mirrors.forEach(function (mirror) {
        stat[mirror] = {
          errors: [],
          banned: false
        };
      });
      this.current = function () {
        var free = mirrors.filter(function (mirror) {
          return !stat[mirror].banned;
        });
        var last = Storage.get('tmdb_img_mirror', '');
        if (free.indexOf(last) > -1) {
          return last;
        } else if (free.length) {
          Storage.set('tmdb_img_mirror', free[0]);
          return free[0];
        }
        return free.length ? free[0] : mirrors[0];
      };
      this.broken = function (url) {
        mirrors.forEach(function (mirror) {
          if (url && url.indexOf('://' + mirror) !== -1) {
            var now = Date.now();
            var s = stat[mirror];
            s.errors.push(now);
            s.errors = s.errors.filter(function (t) {
              return now - t < 10000;
            });
            console.log('TMDB-Proxy', 'mirror', mirror, 'errors', s.errors.length);
            if (s.errors.length >= 20) {
              s.banned = true;
              s.errors = [];
              console.warn('TMDB-Proxy', 'mirror', mirror, 'banned');
            }
          }
        });
      };
    }
    function init() {
      var tmdb_proxy = {
        name: 'TMDB Proxy',
        version: '1.0.6',
        description: 'Проксирование постеров и API сайта TMDB',
        path_api: 'apitmdb.' + Manifest.cub_domain + '/3/',
        path_api_backup: 'lampa.byskaz.ru/tmdb/api/3/'
      };
      var IMG = new ImageMirror();
      function filter(u) {
        var s = u.slice(0, 8);
        var e = u.slice(8).replace(/\/+/g, '/');
        return s + e;
      }
      function email() {
        return Storage.get('account', '{}').email || '';
      }
      TMDB.image = function (url) {
        var base = Utils.protocol() + 'image.tmdb.org/' + url;
        return Utils.addUrlComponent(filter(Storage.field('proxy_tmdb') ? Utils.protocol() + IMG.current() + url : base), 'email=' + encodeURIComponent(email()));
      };
      TMDB.api = function (url) {
        var base = Utils.protocol() + 'api.themoviedb.org/3/' + url;
        return Utils.addUrlComponent(filter(Storage.field('proxy_tmdb') ? Utils.protocol() + tmdb_proxy.path_api + url : base), 'email=' + encodeURIComponent(email()));
      };
      TMDB.broken = function (url) {
        IMG.broken(url);
      };
      Settings.listener.follow('open', function (e) {
        if (e.name == 'tmdb') {
          e.body.find('[data-parent="proxy"]').remove();
        }
      });
      console.log('TMDB-Proxy', 'init');
      console.log('TMDB-Proxy', Storage.field('proxy_tmdb') ? 'enabled' : 'disabled');
    }
    init();

})();
