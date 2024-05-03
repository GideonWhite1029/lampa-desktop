(function () {
  'use strict';

  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }

  var Utils = /*#__PURE__*/function () {
    function Utils() {
      _classCallCheck(this, Utils);
    }
    return _createClass(Utils, null, [{
      key: "clear",
      value: function clear(str) {
        return str.replace(/\&quot;/g, '"').replace(/\&#039;/g, "'").replace(/\&amp;/g, "&").replace(/\&.+?;/g, '');
      }
    }, {
      key: "isHD",
      value: function isHD(name) {
        var math = name.toLowerCase().match(' .hd$| .нd$| .hd | .нd | hd$| нd&| hd | нd ');
        return math ? math[0].trim() : '';
      }
    }, {
      key: "clearHDSD",
      value: function clearHDSD(name) {
        return name.replace(/ hd$| нd$| .hd$| .нd$/gi, '').replace(/ sd$/gi, '').replace(/ hd | нd | .hd | .нd /gi, ' ').replace(/ sd /gi, ' ');
      }
    }, {
      key: "clearMenuName",
      value: function clearMenuName(name) {
        return name.replace(/^\d+\. /gi, '').replace(/^\d+ /gi, '');
      }
    }, {
      key: "clearChannelName",
      value: function clearChannelName(name) {
        return this.clearHDSD(this.clear(name));
      }
    }, {
      key: "hasArchive",
      value: function hasArchive(channel) {
        if (channel.catchup) {
          var days = parseInt(channel.catchup.days);
          if (!isNaN(days) && days > 0) return days;
        }
        return 0;
      }
    }, {
      key: "canUseDB",
      value: function canUseDB() {
        return DB.db && Lampa.Storage.get('iptv_use_db', 'indexdb') == 'indexdb';
      }
    }]);
  }();

  var favorites = [];
  var Favorites = /*#__PURE__*/function () {
    function Favorites() {
      _classCallCheck(this, Favorites);
    }
    return _createClass(Favorites, null, [{
      key: "load",
      value: function load() {
        var _this = this;
        return new Promise(function (resolve, reject) {
          if (Utils.canUseDB()) {
            DB.getData('favorites').then(function (result) {
              favorites = result || [];
            })["finally"](resolve);
          } else {
            _this.nosuport();
            resolve();
          }
        });
      }
    }, {
      key: "nosuport",
      value: function nosuport() {
        favorites = Lampa.Storage.get('iptv_favorite_channels', '[]');
      }
    }, {
      key: "list",
      value: function list() {
        return favorites;
      }
    }, {
      key: "key",
      value: function key() {
        return Lampa.Storage.get('iptv_favotite_save', 'url');
      }
    }, {
      key: "find",
      value: function find(favorite) {
        var _this2 = this;
        return favorites.find(function (a) {
          return a[_this2.key()] == favorite[_this2.key()];
        });
      }
    }, {
      key: "remove",
      value: function remove(favorite) {
        var _this3 = this;
        return new Promise(function (resolve, reject) {
          var find = favorites.find(function (a) {
            return a[_this3.key()] == favorite[_this3.key()];
          });
          if (find) {
            if (Utils.canUseDB()) {
              DB.deleteData('favorites', favorite[_this3.key()]).then(function () {
                Lampa.Arrays.remove(favorites, find);
                resolve();
              })["catch"](reject);
            } else {
              Lampa.Arrays.remove(favorites, find);
              Lampa.Storage.set('iptv_favorite_channels', favorites);
              resolve();
            }
          } else reject();
        });
      }
    }, {
      key: "add",
      value: function add(favorite) {
        var _this4 = this;
        return new Promise(function (resolve, reject) {
          if (!favorites.find(function (a) {
            return a[_this4.key()] == favorite[_this4.key()];
          })) {
            Lampa.Arrays.extend(favorite, {
              view: 0,
              added: Date.now()
            });
            if (Utils.canUseDB()) {
              DB.addData('favorites', favorite[_this4.key()], favorite).then(function () {
                favorites.push(favorite);
                resolve();
              })["catch"](reject);
            } else {
              favorites.push(favorite);
              Lampa.Storage.set('iptv_favorite_channels', favorites);
              resolve();
            }
          } else reject();
        });
      }
    }, {
      key: "update",
      value: function update(favorite) {
        var _this5 = this;
        return new Promise(function (resolve, reject) {
          if (favorites.find(function (a) {
            return a[_this5.key()] == favorite[_this5.key()];
          })) {
            Lampa.Arrays.extend(favorite, {
              view: 0,
              added: Date.now()
            });
            if (Utils.canUseDB()) DB.updateData('favorites', favorite[_this5.key()], favorite).then(resolve)["catch"](reject);else {
              Lampa.Storage.set('iptv_favorite_channels', favorites);
              resolve();
            }
          } else reject();
        });
      }
    }, {
      key: "toggle",
      value: function toggle(favorite) {
        return this.find(favorite) ? this.remove(favorite) : this.add(favorite);
      }
    }]);
  }();

  var locked = [];
  var Locked = /*#__PURE__*/function () {
    function Locked() {
      _classCallCheck(this, Locked);
    }
    return _createClass(Locked, null, [{
      key: "load",
      value: function load() {
        var _this = this;
        return new Promise(function (resolve, reject) {
          if (Utils.canUseDB()) {
            DB.getData('locked').then(function (result) {
              locked = result || [];
            })["finally"](resolve);
          } else {
            _this.nosuport();
            resolve();
          }
        });
      }
    }, {
      key: "nosuport",
      value: function nosuport() {
        locked = Lampa.Storage.get('iptv_locked_channels', '[]');
      }
    }, {
      key: "list",
      value: function list() {
        return locked;
      }
    }, {
      key: "find",
      value: function find(key) {
        return locked.find(function (a) {
          return a == key;
        });
      }
    }, {
      key: "format",
      value: function format(type, element) {
        return type == 'channel' ? 'channel:' + element[Lampa.Storage.get('iptv_favotite_save', 'url')] : type == 'group' ? 'group:' + element : 'other:' + element;
      }
    }, {
      key: "remove",
      value: function remove(key) {
        return new Promise(function (resolve, reject) {
          var find = locked.find(function (a) {
            return a == key;
          });
          if (find) {
            if (Utils.canUseDB()) {
              DB.deleteData('locked', key).then(function () {
                Lampa.Arrays.remove(locked, find);
                resolve();
              })["catch"](reject);
            } else {
              Lampa.Arrays.remove(locked, find);
              Lampa.Storage.set('iptv_locked_channels', locked);
              resolve();
            }
          } else reject();
        });
      }
    }, {
      key: "add",
      value: function add(key) {
        return new Promise(function (resolve, reject) {
          if (!locked.find(function (a) {
            return a == key;
          })) {
            if (Utils.canUseDB()) {
              DB.addData('locked', key, key).then(function () {
                locked.push(key);
                resolve();
              })["catch"](reject);
            } else {
              locked.push(key);
              Lampa.Storage.set('iptv_locked_channels', locked);
              resolve();
            }
          } else reject();
        });
      }
    }, {
      key: "update",
      value: function update(key) {
        return new Promise(function (resolve, reject) {
          if (locked.find(function (a) {
            return a == key;
          })) {
            if (Utils.canUseDB()) DB.updateData('locked', key, key).then(resolve)["catch"](reject);else {
              Lampa.Storage.set('iptv_locked_channels', locked);
              resolve();
            }
          } else reject();
        });
      }
    }, {
      key: "toggle",
      value: function toggle(key) {
        return this.find(key) ? this.remove(key) : this.add(key);
      }
    }]);
  }();

  var DB = new Lampa.DB('cub_iptv', ['playlist', 'params', 'epg', 'favorites', 'other', 'epg_channels', 'locked'], 6);
  DB.logs = true;
  DB.openDatabase().then(function () {
    Favorites.load();
    Locked.load();
  })["catch"](function () {
    Favorites.nosuport();
    Locked.nosuport();
  });

  function fixParams(params_data) {
    var params = params_data || {};
    Lampa.Arrays.extend(params, {
      update: 'none',
      update_time: Date.now(),
      loading: 'cub'
    });
    return params;
  }
  var Params = /*#__PURE__*/function () {
    function Params() {
      _classCallCheck(this, Params);
    }
    return _createClass(Params, null, [{
      key: "get",
      value: function get(id) {
        return new Promise(function (resolve) {
          if (Utils.canUseDB()) {
            DB.getDataAnyCase('params', id).then(function (params) {
              resolve(fixParams(params));
            });
          } else {
            resolve(fixParams(Lampa.Storage.get('iptv_playlist_params_' + id, '{}')));
          }
        });
      }
    }, {
      key: "set",
      value: function set(id, params) {
        if (Utils.canUseDB()) {
          return DB.rewriteData('params', id, fixParams(params));
        } else {
          return new Promise(function (resolve) {
            Lampa.Storage.set('iptv_playlist_params_' + id, fixParams(params));
            resolve();
          });
        }
      }
    }, {
      key: "value",
      value: function value(params, name) {
        return Lampa.Lang.translate('iptv_params_' + params[name]);
      }
    }]);
  }();

  var Api = /*#__PURE__*/function () {
    function Api() {
      _classCallCheck(this, Api);
    }
    return _createClass(Api, null, [{
      key: "get",
      value: function get(method) {
        var _this = this;
        return new Promise(function (resolve, reject) {
          var account = Lampa.Storage.get('account', '{}');
          if (!account.token) return resolve();
          _this.network.silent(_this.api_url + method, resolve, resolve, false, {
            headers: {
              token: account.token,
              profile: account.profile.id
            }
          });
        });
      }
    }, {
      key: "time",
      value: function time(call) {
        this.network.silent(this.api_url + 'time', call, function () {
          call({
            time: Date.now()
          });
        });
      }
    }, {
      key: "m3u",
      value: function m3u(url) {
        var _this2 = this;
        return new Promise(function (resolve, reject) {
          var account = Lampa.Storage.get('account', '{}');
          if (!account.token) return reject();
          _this2.network.timeout(20000);
          _this2.network.silent(url, function (str) {
            var file = new File([str], "playlist.m3u", {
              type: "text/plain"
            });
            var formData = new FormData($('<form></form>')[0]);
            formData.append("file", file, "playlist.m3u");
            $.ajax({
              url: _this2.api_url + 'lampa',
              type: 'POST',
              data: formData,
              async: true,
              cache: false,
              contentType: false,
              timeout: 20000,
              enctype: 'multipart/form-data',
              processData: false,
              headers: {
                token: account.token,
                profile: account.profile.id
              },
              success: function success(j) {
                if (j.secuses) resolve(j);else reject();
              },
              error: reject
            });
          }, reject, false, {
            headers: {
              token: account.token,
              profile: account.profile.id
            },
            dataType: 'text'
          });
        });
      }
    }, {
      key: "list",
      value: function list() {
        var _this3 = this;
        return new Promise(function (resolve, reject) {
          Promise.all([_this3.get('list'), DB.getDataAnyCase('playlist', 'list')]).then(function (result) {
            if (result[0]) DB.rewriteData('playlist', 'list', result[0]);
            var playlist = result[0] || result[1] || {
              list: []
            };
            playlist.list = playlist.list.concat(Lampa.Storage.get('iptv_playlist_custom', '[]'));
            resolve(playlist);
          })["catch"](reject);
        });
      }
    }, {
      key: "playlist",
      value: function playlist(data) {
        var _this4 = this;
        var id = data.id;
        return new Promise(function (resolve, reject) {
          Promise.all([DB.getDataAnyCase('playlist', id), Params.get(id)]).then(function (result) {
            var playlist = result[0];
            var params = result[1];
            if (playlist && params) {
              var time = {
                'always': 0,
                'hour': 1000 * 60 * 60,
                'hour12': 1000 * 60 * 60 * 12,
                'day': 1000 * 60 * 60 * 24,
                'week': 1000 * 60 * 60 * 24 * 7,
                'none': 0
              };
              if (params.update_time + time[params.update] > Date.now() || params.update == 'none') return resolve(playlist);
            }
            var secuses = function secuses(result) {
              DB.rewriteData('playlist', id, result)["finally"](function () {
                if (params) params.update_time = Date.now();
                Params.set(id, params)["finally"](resolve.bind(resolve, result));
              });
            };
            var error = function error() {
              playlist ? resolve(playlist) : reject();
            };
            if (params && params.loading == 'lampa') {
              _this4.m3u(data.url).then(secuses)["catch"](error);
            } else {
              _this4.get('playlist/' + id).then(secuses)["catch"](function () {
                _this4.m3u(data.url).then(secuses)["catch"](error);
              });
            }
          })["catch"](reject);
        });
      }
    }, {
      key: "program",
      value: function program(data) {
        var _this5 = this;
        return new Promise(function (resolve, reject) {
          var days = Lampa.Storage.field('iptv_guide_custom') ? Lampa.Storage.field('iptv_guide_save') : 3;
          var tvg_id = data.tvg && data.tvg.id ? data.tvg.id : data.channel_id;
          var tvg_name = data.tvg && data.tvg.name ? data.tvg.name : '';
          var loadCUB = function loadCUB() {
            var id = Lampa.Storage.field('iptv_guide_custom') ? tvg_id : data.channel_id;
            _this5.network.timeout(5000);
            _this5.network.silent(_this5.api_url + 'program/' + data.channel_id + '/' + data.time + '?full=true', function (result) {
              DB.rewriteData('epg', id, result.program)["finally"](resolve.bind(resolve, result.program));
            }, function (a) {
              if (a.status == 500) DB.rewriteData('epg', id, [])["finally"](resolve.bind(resolve, []));else reject();
            });
          };
          var loadEPG = function loadEPG(id, call) {
            DB.getDataAnyCase('epg', id, 60 * 24 * days).then(function (epg) {
              if (epg) resolve(epg);else call();
            });
          };
          if (tvg_id) {
            loadEPG(tvg_id, function () {
              DB.getDataAnyCase('epg_channels', (tvg_name || data.name).toLowerCase()).then(function (gu) {
                if (gu) loadEPG(gu.id, loadCUB);else loadCUB();
              });
            });
          } else reject();
        });
      }
    }]);
  }();
  _defineProperty(Api, "network", new Lampa.Reguest());
  _defineProperty(Api, "api_url", Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/api/iptv/');

  var Pilot = /*#__PURE__*/function () {
    function Pilot() {
      _classCallCheck(this, Pilot);
    }
    return _createClass(Pilot, null, [{
      key: "notebook",
      value: function notebook(param_name, param_set) {
        var book = Lampa.Storage.get('iptv_pilot_book', '{}');
        Lampa.Arrays.extend(book, {
          playlist: '',
          channel: -1,
          category: ''
        });
        if (typeof param_set !== 'undefined') {
          book[param_name] = param_set;
          Lampa.Storage.set('iptv_pilot_book', book);
        } else return book[param_name];
      }
    }]);
  }();

  var PlaylistItem = /*#__PURE__*/function () {
    function PlaylistItem(playlist) {
      var _this = this;
      _classCallCheck(this, PlaylistItem);
      this.playlist = playlist;
      this.item = Lampa.Template.js('cub_iptv_playlist_item');
      this.footer = this.item.find('.iptv-playlist-item__footer');
      this.params = {};
      Params.get(playlist.id).then(function (params) {
        _this.params = params;
        _this.drawFooter();
      });
      var name = playlist.name || '---';
      this.item.find('.iptv-playlist-item__url').text(playlist.url);
      this.item.find('.iptv-playlist-item__name-text').text(name);
      this.item.find('.iptv-playlist-item__name-ico span').text(name.slice(0, 1).toUpperCase());
      this.item.on('hover:long', this.displaySettings.bind(this)).on('hover:enter', function () {
        if (_this.deleted) return;
        Pilot.notebook('playlist', playlist.id);
        DB.rewriteData('playlist', 'active', playlist.id)["finally"](function () {
          _this.listener.send('channels-load', playlist);
        });
      });
      this.item.on('update', function () {
        Params.get(playlist.id).then(function (params) {
          _this.params = params;
          _this.drawFooter();
        });
      });
    }
    return _createClass(PlaylistItem, [{
      key: "displaySettings",
      value: function displaySettings() {
        var _this2 = this;
        if (this.deleted) return;
        var params = {
          update: ['always', 'hour', 'hour12', 'day', 'week', 'none'],
          loading: ['cub', 'lampa']
        };
        var menu = [];
        menu = menu.concat([{
          title: Lampa.Lang.translate('iptv_update'),
          subtitle: Params.value(this.params, 'update'),
          name: 'update'
        }, {
          title: Lampa.Lang.translate('iptv_loading'),
          subtitle: Params.value(this.params, 'loading'),
          name: 'loading'
        }, {
          title: Lampa.Lang.translate('iptv_remove_cache'),
          subtitle: Lampa.Lang.translate('iptv_remove_cache_descr')
        }]);
        if (this.playlist.custom) {
          menu = menu.concat([{
            title: Lampa.Lang.translate('more'),
            separator: true
          }, {
            title: Lampa.Lang.translate('iptv_playlist_change_name'),
            name: 'change',
            value: 'name'
          }, {
            title: Lampa.Lang.translate('extensions_change_link'),
            name: 'change',
            value: 'url'
          }, {
            title: Lampa.Lang.translate('extensions_remove'),
            name: 'delete'
          }]);
        }
        Lampa.Select.show({
          title: Lampa.Lang.translate('title_settings'),
          items: menu,
          onSelect: function onSelect(a) {
            if (a.name == 'change') {
              Lampa.Input.edit({
                title: Lampa.Lang.translate('iptv_playlist_add_set_' + a.value),
                free: true,
                nosave: true,
                value: _this2.playlist[a.value]
              }, function (value) {
                if (value) {
                  var list = Lampa.Storage.get('iptv_playlist_custom', '[]');
                  var item = list.find(function (n) {
                    return n.id == _this2.playlist.id;
                  });
                  if (item && item[a.value] !== value) {
                    item[a.value] = value;
                    _this2.playlist[a.value] = value;
                    Lampa.Storage.set('iptv_playlist_custom', list);
                    _this2.item.find('.iptv-playlist-item__' + (a.value == 'name' ? 'name-text' : 'url')).text(value);
                    Lampa.Noty.show(Lampa.Lang.translate('iptv_playlist_' + a.value + '_changed'));
                  }
                }
                Lampa.Controller.toggle('content');
              });
            } else if (a.name == 'delete') {
              Lampa.Modal.open({
                title: '',
                align: 'center',
                html: $('<div class="about">' + Lampa.Lang.translate('iptv_confirm_delete_playlist') + '</div>'),
                buttons: [{
                  name: Lampa.Lang.translate('settings_param_no'),
                  onSelect: function onSelect() {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                  }
                }, {
                  name: Lampa.Lang.translate('settings_param_yes'),
                  onSelect: function onSelect() {
                    var list = Lampa.Storage.get('iptv_playlist_custom', '[]');
                    Lampa.Arrays.remove(list, list.find(function (n) {
                      return n.id == _this2.playlist.id;
                    }));
                    Lampa.Storage.set('iptv_playlist_custom', list);
                    Lampa.Noty.show(Lampa.Lang.translate('iptv_playlist_deleted'));
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                    _this2.item.style.opacity = 0.3;
                    _this2.deleted = true;
                  }
                }]
              });
            } else if (a.name) {
              var keys = params[a.name];
              var items = [];
              keys.forEach(function (k) {
                items.push({
                  title: Lampa.Lang.translate('iptv_params_' + k),
                  selected: _this2.params[a.name] == k,
                  value: k
                });
              });
              Lampa.Select.show({
                title: Lampa.Lang.translate('title_settings'),
                items: items,
                onSelect: function onSelect(b) {
                  _this2.params[a.name] = b.value;
                  Params.set(_this2.playlist.id, _this2.params).then(_this2.drawFooter.bind(_this2))["catch"](function (e) {
                    Lampa.Noty.show(e);
                  })["finally"](_this2.displaySettings.bind(_this2));
                },
                onBack: _this2.displaySettings.bind(_this2)
              });
            } else {
              DB.deleteData('playlist', _this2.playlist.id)["finally"](function () {
                Lampa.Noty.show(Lampa.Lang.translate('iptv_cache_clear'));
              });
              Lampa.Controller.toggle('content');
            }
          },
          onBack: function onBack() {
            Lampa.Controller.toggle('content');
          }
        });
      }
    }, {
      key: "drawFooter",
      value: function drawFooter() {
        var _this3 = this;
        this.footer.removeClass('hide');
        function label(where, name, value) {
          var leb_div = document.createElement('div');
          var leb_val = document.createElement('span');
          leb_div.addClass('iptv-playlist-item__label');
          if (name) leb_div.text(name + ' - ');
          leb_val.text(value);
          leb_div.append(leb_val);
          where.append(leb_div);
        }
        DB.getDataAnyCase('playlist', 'active').then(function (active) {
          var details_left = _this3.item.find('.details-left').empty();
          var details_right = _this3.item.find('.details-right').empty();
          if (active && active == _this3.playlist.id) label(details_left, '', Lampa.Lang.translate('iptv_active'));
          label(details_left, Lampa.Lang.translate('iptv_update'), Params.value(_this3.params, 'update'));
          label(details_left, Lampa.Lang.translate('iptv_loading'), Params.value(_this3.params, 'loading'));
          label(details_right, Lampa.Lang.translate('iptv_updated'), Lampa.Utils.parseTime(_this3.params.update_time).briefly);
        });
      }
    }, {
      key: "render",
      value: function render() {
        return this.item;
      }
    }]);
  }();

  var Playlist = /*#__PURE__*/function () {
    function Playlist(listener) {
      _classCallCheck(this, Playlist);
      this.listener = listener;
      this.html = Lampa.Template.js('cub_iptv_list');
      this.scroll = new Lampa.Scroll({
        mask: true,
        over: true
      });
      this.html.find('.iptv-list__title').text(Lampa.Lang.translate('iptv_select_playlist'));
      this.html.find('.iptv-list__items').append(this.scroll.render(true));
    }
    return _createClass(Playlist, [{
      key: "item",
      value: function item(data) {
        var _this = this;
        var item = new PlaylistItem(data);
        item.listener = this.listener;
        var elem = item.render();
        elem.on('hover:focus', function () {
          _this.last = elem;
          _this.scroll.update(_this.last);
        }).on('hover:hover hover:touch', function () {
          _this.last = elem;
          Navigator.focused(elem);
        });
        return item;
      }
    }, {
      key: "list",
      value: function list(playlist) {
        var _this2 = this;
        this.scroll.clear();
        this.scroll.reset();
        this.html.find('.iptv-list__text').html(Lampa.Lang.translate('iptv_select_playlist_text'));
        var add = Lampa.Template.js('cub_iptv_list_add_custom');
        add.find('.iptv-playlist-item__title').text(Lampa.Lang.translate('iptv_playlist_add_new'));
        add.on('hover:enter', function () {
          Lampa.Input.edit({
            title: Lampa.Lang.translate('iptv_playlist_add_set_url'),
            free: true,
            nosave: true,
            value: ''
          }, function (value) {
            if (value) {
              var data = {
                id: Lampa.Utils.uid(),
                custom: true,
                url: value,
                name: ''
              };
              Lampa.Storage.add('iptv_playlist_custom', data);
              var item = _this2.item(data);
              add.parentNode.insertBefore(item.render(), add.nextSibling);
            }
            Lampa.Controller.toggle('content');
          });
        });
        add.on('hover:focus', function () {
          _this2.last = add;
          _this2.scroll.update(_this2.last);
        });
        this.scroll.append(add);
        playlist.list.reverse().forEach(function (data) {
          var item = _this2.item(data);
          _this2.scroll.append(item.render());
        });
        this.listener.send('display', this);
      }
    }, {
      key: "main",
      value: function main() {
        Api.list().then(this.list.bind(this))["catch"](this.empty.bind(this));
      }
    }, {
      key: "load",
      value: function load() {
        var _this3 = this;
        Promise.all([Api.list(), DB.getDataAnyCase('playlist', 'active')]).then(function (result) {
          var playlist = result[0];
          var active = result[1] || Pilot.notebook('playlist');
          if (playlist) {
            if (active) {
              var find = playlist.list.find(function (l) {
                return l.id == active;
              });
              if (find) {
                _this3.listener.send('channels-load', find);
              } else _this3.list(playlist);
            } else _this3.list(playlist);
          } else _this3.empty();
        })["catch"](this.empty.bind(this));
      }
    }, {
      key: "empty",
      value: function empty() {
        this.scroll.clear();
        this.scroll.reset();
        this.html.find('.iptv-list__text').html(Lampa.Lang.translate('iptv_playlist_empty'));
        var empty = Lampa.Template.js('cub_iptv_list_empty');
        empty.find('.iptv-list-empty__text').html(Lampa.Lang.translate('empty_title'));
        this.scroll.append(empty);
        this.listener.send('display', this);
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this4 = this;
        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(_this4.html);
            Lampa.Controller.collectionFocus(_this4.last, _this4.html);
          },
          left: function left() {
            Lampa.Controller.toggle('menu');
          },
          down: Navigator.move.bind(Navigator, 'down'),
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          back: function back() {
            Lampa.Activity.backward();
          }
        });
        Lampa.Controller.toggle('content');
      }
    }, {
      key: "render",
      value: function render() {
        return this.html;
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.scroll.destroy();
        this.html.remove();
      }
    }]);
  }();

  var Icons = /*#__PURE__*/function () {
    function Icons(listener) {
      var _this = this;
      _classCallCheck(this, Icons);
      this.listener = listener;
      this.position = 0;
      this.scroll = new Lampa.Scroll({
        mask: !window.iptv_mobile,
        over: true,
        end_ratio: 2,
        horizontal: window.iptv_mobile
      });
      this.html = document.createElement('div');
      this.html.addClass('iptv-channels');
      this.scroll.append(this.html);
      if (!window.iptv_mobile) this.scroll.minus();
      this.scroll.onEnd = function () {
        _this.position++;
        _this.next();
      };
      this.listener.follow('icons-load', function (data) {
        _this.icons = data.icons;
        if (data.menu.favorites) {
          _this.icons.sort(function (a, b) {
            var ta = a.added || 0;
            var tb = b.added || 0;
            return ta < tb ? -1 : ta > tb ? 1 : 0;
          });
          _this.sort();
        }
        _this.icons_clone = Lampa.Arrays.clone(_this.icons);
        _this.html.empty();
        _this.scroll.reset();
        _this.position = 0;
        _this.last = false;
        _this.next();
        var channel = Pilot.notebook('channel');
        if (channel >= 0 && channel <= _this.icons.length && window.lampa_settings.iptv) {
          setTimeout(function () {
            _this.listener.send('play', {
              position: channel,
              total: _this.icons.length
            });
          }, 1000);
        }
      });
    }
    return _createClass(Icons, [{
      key: "sort",
      value: function sort() {
        var sort_type = Lampa.Storage.field('iptv_favotite_sort');
        if (Lampa.Account.hasPremium() && sort_type !== 'add') {
          this.icons.sort(function (a, b) {
            if (sort_type == 'name') {
              return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
            } else if (sort_type == 'view') {
              var va = a.view || 0;
              var vb = b.view || 0;
              return va < vb ? 1 : va > vb ? -1 : 0;
            }
          });
        }
      }
    }, {
      key: "active",
      value: function active(item) {
        var active = this.html.find('.active');
        if (active) active.removeClass('active');
        item.addClass('active');
      }
    }, {
      key: "icon",
      value: function icon(item, element) {
        var icons = item.find('.iptv-channel__icons');
        icons.empty();
        if (Favorites.find(element)) icons.append(Lampa.Template.js('cub_iptv_icon_fav'));
        if (Locked.find(Locked.format('channel', element))) icons.append(Lampa.Template.js('cub_iptv_icon_lock'));
      }
    }, {
      key: "next",
      value: function next() {
        var _this2 = this;
        var views = 10;
        var start = this.position * views;
        this.icons.slice(start, start + views).forEach(function (element, index) {
          delete element.target;
          var item = document.createElement('div');
          var body = document.createElement('div');
          var img = document.createElement('img');
          var chn = document.createElement('div');
          var icn = document.createElement('div');
          var position = start + index;
          chn.text((position + 1).pad(3));
          item.addClass('iptv-channel selector layer--visible layer--render');
          body.addClass('iptv-channel__body');
          img.addClass('iptv-channel__ico');
          chn.addClass('iptv-channel__chn');
          icn.addClass('iptv-channel__icons');
          body.append(img);
          item.append(body);
          item.append(chn);
          item.append(icn);
          _this2.icon(item, element);
          _this2.listener.follow('update-channel-icon', function (channel) {
            if (channel.name == element.name) _this2.icon(item, element);
          });
          item.on('visible', function () {
            img.onerror = function () {
              var simb = document.createElement('div');
              simb.addClass('iptv-channel__simb');
              simb.text(element.name.length <= 3 ? element.name.toUpperCase() : element.name.replace(/[^a-z|а-я|0-9]/gi, '').toUpperCase()[0]);
              var text = document.createElement('div');
              text.addClass('iptv-channel__name');
              text.text(Utils.clear(element.name));
              body.append(simb);
              body.append(text);
            };
            img.onload = function () {
              item.addClass('loaded');
              if (element.logo.indexOf('epg.it999') == -1) {
                item.addClass('small--icon');
              }
            };
            if (element.logo) img.src = element.logo;else img.onerror();
          });
          item.on('hover:focus', function () {
            _this2.active(item);
            _this2.scroll.update(item);
            if (_this2.last !== item) _this2.listener.send('details-load', element);
            _this2.last = item;
          }).on('hover:hover hover:touch', function () {
            Navigator.focused(item);
            _this2.active(item);
            if (_this2.last !== item) _this2.listener.send('details-load', element);
            _this2.last = item;
          }).on('hover:long', function () {
            Lampa.Select.show({
              title: Lampa.Lang.translate('title_action'),
              items: [{
                title: Lampa.Lang.translate(Favorites.find(element) ? 'iptv_remove_fav' : 'iptv_add_fav'),
                type: 'favorite'
              }, {
                title: Lampa.Lang.translate(Locked.find(Locked.format('channel', element)) ? 'iptv_channel_unlock' : 'iptv_channel_lock'),
                type: 'locked'
              }],
              onSelect: function onSelect(a) {
                _this2.toggle();
                if (a.type == 'favorite') {
                  Favorites.toggle(element)["finally"](function () {
                    _this2.icon(item, element);
                    _this2.listener.send('update-favorites');
                  });
                } else if (a.type == 'locked') {
                  if (Lampa.Manifest.app_digital >= 204) {
                    if (Locked.find(Locked.format('channel', element))) {
                      Lampa.ParentalControl.query(function () {
                        _this2.toggle();
                        Locked.remove(Locked.format('channel', element))["finally"](function () {
                          _this2.icon(item, element);
                        });
                      }, _this2.toggle.bind(_this2));
                    } else {
                      Locked.add(Locked.format('channel', element))["finally"](function () {
                        _this2.icon(item, element);
                      });
                    }
                  } else {
                    Lampa.Noty.show(Lampa.Lang.translate('iptv_need_update_app'));
                  }
                }
              },
              onBack: _this2.toggle.bind(_this2)
            });
          }).on('hover:enter', function () {
            _this2.listener.send('play', {
              position: position,
              total: _this2.icons.length
            });
          });
          _this2.html.append(item);
          if (Lampa.Controller.own(_this2)) Lampa.Controller.collectionAppend(item);
        });
        setTimeout(function () {
          Lampa.Layer.visible(_this2.html);
        }, 300);
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this3 = this;
        Lampa.Controller.add('content', {
          link: this,
          toggle: function toggle() {
            if (_this3.html.find('.selector')) {
              Lampa.Controller.collectionSet(_this3.html);
              Lampa.Controller.collectionFocus(_this3.last, _this3.html);
            } else _this3.listener.send('toggle', 'menu');
          },
          left: function left() {
            _this3.listener.send('toggle', 'menu');
          },
          right: function right() {
            _this3.listener.send('toggle', 'details');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            _this3.listener.send('back');
          }
        });
        Lampa.Controller.toggle('content');
      }
    }, {
      key: "render",
      value: function render() {
        return this.scroll.render(true);
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.scroll.destroy();
        this.html.remove();
      }
    }]);
  }();

  var EPG = /*#__PURE__*/function () {
    function EPG() {
      _classCallCheck(this, EPG);
    }
    return _createClass(EPG, null, [{
      key: "init",
      value: function init() {
        var _this = this;
        var ts = new Date().getTime();
        Api.time(function (json) {
          var te = new Date().getTime();
          _this.time_offset = json.time < ts || json.time > te ? json.time - te : 0;
        });
      }
    }, {
      key: "time",
      value: function time(channel) {
        var timeshift = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var date = new Date(),
          time = date.getTime() + this.time_offset,
          ofst = parseInt((localStorage.getItem('time_offset') == null ? 'n0' : localStorage.getItem('time_offset')).replace('n', ''));
        date = new Date(time + ofst * 1000 * 60 * 60);
        var offset = channel.name.match(/([+|-]\d)$/);
        if (offset) {
          date.setHours(date.getHours() + parseInt(offset[1]));
        }
        var result = date.getTime();
        result -= timeshift;
        return result;
      }
    }, {
      key: "position",
      value: function position(channel, list, timeshift) {
        var tim = this.time(channel, timeshift);
        var now = list.find(function (p) {
          return tim > p.start && tim < p.stop;
        });
        return now ? list.indexOf(now) : list.length - 1;
      }
    }, {
      key: "timeline",
      value: function timeline(channel, program, timeshift) {
        var time = this.time(channel, timeshift);
        var total = program.stop - program.start;
        var less = program.stop - time;
        return Math.min(100, Math.max(0, (1 - less / total) * 100));
      }
    }, {
      key: "list",
      value: function list(channel, _list) {
        var size = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;
        var position = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        var day_lst = '';
        var day_prg = '';
        var day_now = new Date(Date.now()).getDate();
        var day_nam = {};
        var display = [];
        day_nam[day_now - 1] = Lampa.Lang.translate('iptv_yesterday');
        day_nam[day_now] = Lampa.Lang.translate('iptv_today');
        day_nam[day_now + 1] = Lampa.Lang.translate('iptv_tomorrow');
        var watch = _list[this.position(channel, _list)];
        _list.slice(position, position + size).forEach(function (elem) {
          day_prg = new Date(elem.start).getDate();
          if (day_lst !== day_prg) {
            day_lst = day_prg;
            display.push({
              type: 'date',
              date: day_nam[day_prg] ? day_nam[day_prg] : Lampa.Utils.parseTime(elem.start)["short"]
            });
          }
          display.push({
            type: 'program',
            program: elem,
            watch: watch == elem
          });
        });
        return display;
      }
    }]);
  }();
  _defineProperty(EPG, "time_offset", 0);

  var Details = /*#__PURE__*/function () {
    function Details(listener) {
      var _this = this;
      _classCallCheck(this, Details);
      this.listener = listener;
      this.html = Lampa.Template.js('cub_iptv_details');
      this.title = this.html.find('.iptv-details__title');
      this.play = this.html.find('.iptv-details__play');
      this.progm = this.html.find('.iptv-details__program');
      this.progm_image = false;
      this.empty_html = Lampa.Template.js('cub_iptv_details_empty');
      this.listener.follow('details-load', this.draw.bind(this));
      if (window.iptv_mobile) this.html.removeClass('layer--wheight');
      this.timer = setInterval(function () {
        if (_this.timeline) _this.timeline();
      }, 1000 * 5);
    }
    return _createClass(Details, [{
      key: "draw",
      value: function draw(channel) {
        var _this2 = this;
        this.title.text(Utils.clearChannelName(channel.name));
        this.group(channel, Utils.clearMenuName(channel.group || Lampa.Lang.translate('player_unknown')));
        this.wait_for = channel.name;
        if (channel.id) {
          this.progm.text(Lampa.Lang.translate('loading') + '...');
          Api.program({
            name: channel.name,
            channel_id: channel.id,
            time: EPG.time(channel),
            tvg: channel.tvg
          }).then(function (program) {
            if (_this2.wait_for == channel.name) {
              if (program.length) _this2.program(channel, program);else _this2.empty();
            }
          })["catch"](function (e) {
            _this2.empty();
          });
        } else {
          this.empty();
        }
      }
    }, {
      key: "group",
      value: function group(channel, title) {
        this.play.empty();
        var group = document.createElement('span');
        group.text(title);
        if (Utils.hasArchive(channel)) {
          var archive = document.createElement('span');
          archive.addClass('lb').text('A');
          this.play.append(archive);
        }
        var hd = Utils.isHD(channel.name);
        if (hd) {
          var hd_lb = document.createElement('span');
          hd_lb.addClass('lb').text(hd.toUpperCase());
          this.play.append(hd_lb);
        }
        this.play.append(group);
      }
    }, {
      key: "empty",
      value: function empty() {
        this.timeline = false;
        this.progm.empty().append(this.empty_html);
      }
    }, {
      key: "buildProgramList",
      value: function buildProgramList(channel, program, params) {
        var _this3 = this;
        var stime = EPG.time(channel);
        var start = EPG.position(channel, program);
        var archive = Utils.hasArchive(channel);
        if (!params && program[start]) {
          this.group(channel, Lampa.Utils.shortText(Utils.clear(program[start].title), 50));
        }
        return new Lampa.Endless(function (position) {
          if (position >= program.length) return _this3.endless.to(position - 1);
          var wrap = document.createElement('div');
          var list = EPG.list(channel, program, 10, position);
          wrap.addClass('iptv-details__list');
          list.forEach(function (elem, index) {
            var item = document.createElement('div');
            if (elem.type == 'date') item.addClass('iptv-program-date').text(elem.date);else {
              item.addClass('iptv-program selector');
              var head, icon_wrap, icon_img, head_body;
              var time = document.createElement('div');
              time.addClass('iptv-program__time').text(Lampa.Utils.parseTime(elem.program.start).time);
              var body = document.createElement('div');
              body.addClass('iptv-program__body');
              var title = document.createElement('div');
              title.addClass('iptv-program__title').text(Utils.clear(elem.program.title));
              if (elem.program.icon && index == 1) {
                head = document.createElement('div');
                head_body = document.createElement('div');
                icon_wrap = document.createElement('div');
                icon_img = document.createElement('img');
                head.addClass('iptv-program__head');
                head_body.addClass('iptv-program__head-body');
                icon_wrap.addClass('iptv-program__icon-wrap');
                icon_img.addClass('iptv-program__icon-img');
                icon_wrap.append(icon_img);
                head.append(icon_wrap);
                head.append(head_body);
                head_body.append(title);
                body.append(head);
                if (_this3.progm_image && _this3.progm_image.waiting) _this3.progm_image.src = '';
                icon_img.onload = function () {
                  icon_img.waiting = false;
                  icon_wrap.addClass('loaded');
                };
                icon_img.error = function () {
                  icon_wrap.addClass('loaded-error');
                  icon_img.src = './img/img_broken.svg';
                };
                icon_img.waiting = true;
                icon_img.src = elem.program.icon;
                _this3.progm_image = icon_img;
              } else {
                body.append(title);
              }
              if (elem.watch) {
                var timeline = document.createElement('div');
                timeline.addClass('iptv-program__timeline');
                var div = document.createElement('div');
                div.style.width = EPG.timeline(channel, elem.program) + '%';
                timeline.append(div);
                if (!params) {
                  _this3.timeline = function () {
                    var percent = EPG.timeline(channel, elem.program);
                    div.style.width = percent + '%';
                    if (percent == 100) {
                      var next = EPG.position(channel, program);
                      if (start !== next) _this3.program(channel, program);
                    }
                  };
                }
                if (archive) {
                  item.on('hover:enter', function () {
                    var data = {
                      program: elem.program,
                      position: position,
                      channel: channel,
                      playlist: program.slice(Math.max(0, position - 40), start)
                    };
                    if (params) params.onPlay(data);else _this3.listener.send('play-archive', data);
                  });
                }
                item.addClass('played');
                if (elem.program.icon && head_body) {
                  head_body.append(timeline);
                } else {
                  body.append(timeline);
                }
              }
              if (index == 1 && elem.program.desc) {
                var text = Utils.clear(elem.program.desc);
                if (text.length > 300) text = text.slice(0, 300) + '...';
                var descr = document.createElement('div');
                descr.addClass('iptv-program__descr').text(text);
                body.append(descr);
              }
              if (archive) {
                var minus = stime - archive * 1000 * 60 * 60 * 24;
                if (elem.program.start > minus && elem.program.stop < stime) {
                  item.addClass('archive');
                  item.on('hover:enter', function () {
                    var data = {
                      program: elem.program,
                      position: position,
                      channel: channel,
                      timeshift: stime - elem.program.start,
                      playlist: program.slice(Math.max(0, position - 40), start)
                    };
                    if (params) params.onPlay(data);else _this3.listener.send('play-archive', data);
                  });
                }
              }
              item.append(time);
              item.append(body);
            }
            wrap.append(item);
          });
          return wrap;
        }, {
          position: start
        });
      }

      /**
       * Программа в плеере
       */
    }, {
      key: "playlist",
      value: function playlist(channel, program) {
        var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        return this.buildProgramList(channel, program, params);
      }

      /**
       * Программа в главном интерфейсе
       */
    }, {
      key: "program",
      value: function program(channel, _program) {
        if (this.endless) this.endless.destroy();
        this.timeline = false;
        this.endless = this.buildProgramList(channel, _program);
        this.progm.empty().append(this.endless.render());
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this4 = this;
        Lampa.Controller.add('content', {
          link: this,
          toggle: function toggle() {
            if (_this4.html.find('.selector')) {
              Lampa.Controller.collectionSet(_this4.html);
              Lampa.Controller.collectionFocus(false, _this4.html);
            } else _this4.listener.send('toggle', 'icons');
          },
          left: function left() {
            _this4.listener.send('toggle', 'icons');
          },
          up: function up() {
            if (_this4.endless) {
              _this4.endless.move(-1);
              Lampa.Controller.collectionSet(_this4.html);
              Lampa.Controller.collectionFocus(false, _this4.html);
            }
          },
          down: function down() {
            if (_this4.endless) {
              _this4.endless.move(1);
              Lampa.Controller.collectionSet(_this4.html);
              Lampa.Controller.collectionFocus(false, _this4.html);
            }
          },
          back: function back() {
            _this4.listener.send('back');
          }
        });
        Lampa.Controller.toggle('content');
      }
    }, {
      key: "render",
      value: function render() {
        return this.html;
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.html.remove();
        clearInterval(this.timer);
        this.wait_for = false;
      }
    }]);
  }();

  var last_query = '';
  var Search = /*#__PURE__*/function () {
    function Search() {
      _classCallCheck(this, Search);
    }
    return _createClass(Search, null, [{
      key: "find",
      value: function find(channels, call) {
        var controller = Lampa.Controller.enabled().name;
        Lampa.Input.edit({
          value: last_query,
          free: true,
          nosave: true
        }, function (new_value) {
          last_query = new_value;
          Lampa.Controller.toggle(controller);
          call({
            channels: channels.filter(function (c) {
              return c.name.toLowerCase().indexOf(new_value.toLowerCase()) >= 0;
            }),
            query: new_value
          });
        });
      }
    }]);
  }();

  var Menu = /*#__PURE__*/function () {
    function Menu(listener) {
      _classCallCheck(this, Menu);
      this.listener = listener;
      this.html = Lampa.Template.js('cub_iptv_menu');
      this.menu = this.html.find('.iptv-menu__list');
      this.scroll = new Lampa.Scroll({
        mask: !window.iptv_mobile,
        over: true,
        horizontal: window.iptv_mobile
      });
      if (!window.iptv_mobile) this.scroll.minus();
      this.scroll.append(this.html);
    }
    return _createClass(Menu, [{
      key: "favorites",
      value: function favorites(channels) {
        var favorites = Favorites.list();
        if (Lampa.Storage.get('iptv_favotite_save', 'url') == 'name') {
          favorites = favorites.filter(function (f) {
            return channels.find(function (c) {
              return c.name == f.name;
            });
          });
          favorites.forEach(function (f) {
            f.url = channels.find(function (c) {
              return c.name == f.name;
            }).url;
          });
        }
        return favorites;
      }
    }, {
      key: "build",
      value: function build(data) {
        var _this = this;
        this.menu.empty();
        var search_item = {
          name: Lampa.Lang.translate('search'),
          count: 0,
          search: true
        };
        this.html.find('.iptv-menu__title').text(data.name || Lampa.Lang.translate('player_playlist'));
        this.html.find('.iptv-menu__search').on('hover:enter', function () {
          Search.find(data.playlist.channels, search_item.update);
        });
        Lampa.Arrays.insert(data.playlist.menu, 0, search_item);
        var favorites = this.favorites(data.playlist.channels);
        var category = Pilot.notebook('category');
        Lampa.Arrays.insert(data.playlist.menu, 0, {
          name: Lampa.Lang.translate('settings_input_links'),
          count: favorites.length,
          favorites: true
        });
        var first;
        var first_item;
        var pilot;
        if (window.iptv_mobile) {
          var mobile_seacrh_button = Lampa.Template.js('iptv_menu_mobile_button_search');
          mobile_seacrh_button.on('hover:enter', function () {
            Search.find(data.playlist.channels, search_item.update);
          });
          this.menu.append(mobile_seacrh_button);
        }
        data.playlist.menu.forEach(function (menu) {
          if (menu.count == 0 && !(menu.favorites || menu.search)) return;
          var li = document.createElement('div');
          var co = document.createElement('span');
          var nm = document.createElement('div');
          var ic = document.createElement('div');
          li.addClass('iptv-menu__list-item selector');
          ic.addClass('iptv-menu__list-item-icon');
          nm.text(Utils.clearMenuName(menu.name || Lampa.Lang.translate('iptv_all_channels')));
          co.text(menu.count);
          li.append(ic);
          li.append(nm);
          li.append(co);
          var icon_name = 'group';
          if (menu.favorites) icon_name = 'fav';
          if (menu.search) icon_name = 'searched';
          if (!menu.name) icon_name = 'all';
          ic.append(Lampa.Template.js('cub_iptv_icon_' + icon_name));
          if (menu.favorites) {
            li.addClass('favorites--menu-item');
            _this.listener.follow('update-favorites', function () {
              favorites = Favorites.list();
              menu.count = favorites.length;
              co.text(menu.count);
            });
          } else if (menu.search) {
            li.addClass('search--menu-item');
            menu.update = function (result) {
              menu.find = result.channels;
              menu.count = result.channels.length;
              co.text(result.channels.length);
              if (menu.count) Lampa.Utils.trigger(li, 'hover:enter');else {
                Lampa.Noty.show(Lampa.Lang.translate('iptv_search_no_result') + ' (' + result.query + ')');
                if (first_item) Lampa.Utils.trigger(first_item, 'hover:enter');
              }
            };
          } else {
            if (!first_item) {
              first_item = li;
            }
            if (menu.name) {
              var updateIcon = function updateIcon() {
                ic.empty();
                ic.append(Lampa.Template.js('cub_iptv_icon_' + (Locked.find(Locked.format('group', menu.name)) ? 'lock' : 'group')));
              };
              updateIcon();
              li.on('hover:long', function () {
                Lampa.Select.show({
                  title: Lampa.Lang.translate('title_action'),
                  items: [{
                    title: Lampa.Lang.translate(Locked.find(Locked.format('group', menu.name)) ? 'iptv_channel_unlock' : 'iptv_channel_lock'),
                    type: 'locked'
                  }],
                  onSelect: function onSelect(a) {
                    _this.toggle();
                    if (a.type == 'locked') {
                      if (Lampa.Manifest.app_digital >= 204) {
                        if (Locked.find(Locked.format('group', menu.name))) {
                          Lampa.ParentalControl.query(function () {
                            _this.toggle();
                            Locked.remove(Locked.format('group', menu.name))["finally"](updateIcon);
                          }, _this.toggle.bind(_this));
                        } else {
                          Locked.add(Locked.format('group', menu.name))["finally"](updateIcon);
                        }
                      } else {
                        Lampa.Noty.show(Lampa.Lang.translate('iptv_need_update_app'));
                      }
                    }
                  },
                  onBack: _this.toggle.bind(_this)
                });
              });
            }
          }
          li.on('hover:enter', function () {
            if (menu.count == 0) return;
            var load = function load() {
              Pilot.notebook('category', menu.name || 'all');
              _this.listener.send('icons-load', {
                menu: menu,
                icons: menu.name ? data.playlist.channels.filter(function (a) {
                  return a.group == menu.name;
                }) : data.playlist.channels
              });
            };
            var toggle = function toggle() {
              var active = _this.menu.find('.active');
              if (active) active.removeClass('active');
              li.addClass('active');
              _this.last = li;
              _this.listener.send('toggle', 'icons');
            };
            if (menu.favorites) {
              Pilot.notebook('category', '');
              _this.listener.send('icons-load', {
                menu: menu,
                icons: favorites
              });
            } else if (menu.search) {
              Pilot.notebook('category', '');
              _this.listener.send('icons-load', {
                menu: menu,
                icons: menu.find
              });
            } else {
              if (Lampa.Manifest.app_digital >= 204 && Locked.find(Locked.format('group', menu.name))) {
                return Lampa.ParentalControl.query(function () {
                  load();
                  toggle();
                }, _this.toggle.bind(_this));
              } else load();
            }
            toggle();
          });
          li.on('hover:focus', function () {
            _this.scroll.update(li, true);
            _this.last = li;
          });
          if (!first && menu.count !== 0) first = li;
          if (menu.name == category && category || !menu.name && category == 'all') pilot = li;
          _this.menu.append(li);
        });
        if (pilot) Lampa.Utils.trigger(pilot, 'hover:enter');else if (first) Lampa.Utils.trigger(first, 'hover:enter');
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this2 = this;
        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(_this2.html);
            Lampa.Controller.collectionFocus(_this2.last, _this2.html);
          },
          left: function left() {
            Lampa.Controller.toggle('menu');
          },
          right: function right() {
            _this2.listener.send('toggle', 'icons');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            _this2.listener.send('back');
          }
        });
        Lampa.Controller.toggle('content');
      }
    }, {
      key: "render",
      value: function render() {
        return this.scroll.render(true);
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.scroll.destroy();
        this.html.remove();
      }
    }]);
  }();

  function strReplace(str, key2val) {
    for (var key in key2val) {
      str = str.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), key2val[key]);
    }
    return str;
  }
  function tf(t, format, u, tz) {
    format = format || '';
    tz = parseInt(tz || '0');
    var thisOffset = EPG.time_offset;
    thisOffset += tz;
    if (!u) thisOffset += parseInt(Lampa.Storage.get('time_offset', 'n0').replace('n', '')) * 60 - new Date().getTimezoneOffset();
    var d = new Date((t + thisOffset) * 1000);
    var r = {
      yyyy: d.getUTCFullYear(),
      MM: ('0' + (d.getUTCMonth() + 1)).substr(-2),
      dd: ('0' + d.getUTCDate()).substr(-2),
      HH: ('0' + d.getUTCHours()).substr(-2),
      mm: ('0' + d.getUTCMinutes()).substr(-2),
      ss: ('0' + d.getUTCSeconds()).substr(-2),
      UTF: t
    };
    return strReplace(format, r);
  }
  function unixtime$1() {
    return Math.floor((new Date().getTime() + EPG.time_offset) / 1000);
  }
  var Url = /*#__PURE__*/function () {
    function Url() {
      _classCallCheck(this, Url);
    }
    return _createClass(Url, null, [{
      key: "prepareUrl",
      value: function prepareUrl(url, program) {
        var m = [],
          val = '',
          r = {
            start: unixtime$1,
            offset: 0
          };
        if (program) {
          var start = Math.floor(program.start / 1000);
          var end = Math.floor(program.stop / 1000);
          var duration = end - start;
          r = {
            start: start,
            utc: start,
            end: end,
            utcend: end,
            offset: unixtime$1() - start,
            duration: duration,
            durationfs: end > unixtime$1() ? 'now' : duration,
            now: unixtime$1,
            lutc: unixtime$1,
            timestamp: unixtime$1,
            d: function d(m) {
              return strReplace(m[6] || '', {
                M: Math.floor(duration / 60),
                S: duration,
                h: Math.floor(duration / 60 / 60),
                m: ('0' + Math.floor(duration / 60) % 60).substr(-2),
                s: '00'
              });
            },
            b: function b(m) {
              return tf(start, m[6], m[4], m[5]);
            },
            e: function e(m) {
              return tf(end, m[6], m[4], m[5]);
            },
            n: function n(m) {
              return tf(unixtime$1(), m[6], m[4], m[5]);
            }
          };
        }
        while (!!(m = url.match(/\${(\((([a-zA-Z\d]+?)(u)?)([+-]\d+)?\))?([^${}]+)}/))) {
          if (!!m[2] && typeof r[m[2]] === "function") val = r[m[2]](m);else if (!!m[3] && typeof r[m[3]] === "function") val = r[m[3]](m);else if (m[6] in r) val = typeof r[m[6]] === "function" ? r[m[6]]() : r[m[6]];else val = m[1];
          url = url.replace(m[0], encodeURIComponent(val));
        }
        return url;
      }
    }, {
      key: "catchupUrl",
      value: function catchupUrl(url, type, source) {
        type = (type || '').toLowerCase();
        source = source || '';
        if (!type) {
          if (!!source) {
            if (source.search(/^https?:\/\//i) === 0) type = 'default';else if (source.search(/^[?&/][^/]/) === 0) type = 'append';else type = 'default';
          } else if (url.indexOf('${') < 0) type = 'shift';else type = 'default';
          console.log('IPTV', 'Autodetect catchup-type "' + type + '"');
        }
        var newUrl = '';
        switch (type) {
          case 'append':
            if (source) {
              newUrl = (source.search(/^https?:\/\//i) === 0 ? '' : url) + source;
              break; // так и задумано
            }
          case 'timeshift': // @deprecated
          case 'shift':
            // + append
            newUrl = source || url;
            newUrl += (newUrl.indexOf('?') >= 0 ? '&' : '?') + 'utc=${start}&lutc=${timestamp}';
            return newUrl;
          case 'flussonic':
          case 'flussonic-hls':
          case 'flussonic-ts':
          case 'fs':
            // Example stream and catchup URLs
            // stream:  http://ch01.spr24.net/151/mpegts?token=my_token
            // catchup: http://ch01.spr24.net/151/timeshift_abs-{utc}.ts?token=my_token
            // stream:  http://list.tv:8888/325/index.m3u8?token=secret
            // catchup: http://list.tv:8888/325/timeshift_rel-{offset:1}.m3u8?token=secret
            // stream:  http://list.tv:8888/325/mono.m3u8?token=secret
            // catchup: http://list.tv:8888/325/mono-timeshift_rel-{offset:1}.m3u8?token=secret
            // stream:  http://list.tv:8888/325/live?token=my_token
            // catchup: http://list.tv:8888/325/{utc}.ts?token=my_token
            // See doc: https://flussonic.ru/doc/proigryvanie/vosproizvedenie-hls/
            return url.replace(/\/(video\d*|mono\d*)\.(m3u8|ts)(\?|$)/, '/$1-\${start}-\${durationfs}.$2$3').replace(/\/(index|playlist)\.(m3u8|ts)(\?|$)/, '/archive-\${start}-\${durationfs}.$2$3').replace(/\/mpegts(\?|$)/, '/timeshift_abs-\${start}.ts$1').replace(/\/live(\?|$)/, '/\${start}.ts$1');
          case 'xc':
            // Example stream and catchup URLs
            // stream:  http://list.tv:8080/my@account.xc/my_password/1477
            // catchup: http://list.tv:8080/timeshift/my@account.xc/my_password/{duration}/{Y}-{m}-{d}:{H}-{M}/1477.ts
            // stream:  http://list.tv:8080/live/my@account.xc/my_password/1477.m3u8
            // catchup: http://list.tv:8080/timeshift/my@account.xc/my_password/{duration}/{Y}-{m}-{d}:{H}-{M}/1477.m3u8
            newUrl = url.replace(/^(https?:\/\/[^/]+)(\/live)?(\/[^/]+\/[^/]+\/)([^/.]+)\.m3u8?$/, '$1/timeshift$3\${(d)M}/\${(b)yyyy-MM-dd:HH-mm}/$4.m3u8').replace(/^(https?:\/\/[^/]+)(\/live)?(\/[^/]+\/[^/]+\/)([^/.]+)(\.ts|)$/, '$1/timeshift$3\${(d)M}/\${(b)yyyy-MM-dd:HH-mm}/$4.ts');
            break;
          case 'default':
            newUrl = source || url;
            break;
          case 'disabled':
            return false;
          default:
            console.log('IPTV', 'Err: no support catchup-type="' + type + '"');
            return false;
        }
        if (newUrl.indexOf('${') < 0) return this.catchupUrl(newUrl, 'shift');
        return newUrl;
      }
    }]);
  }();

  var HUDMenu = /*#__PURE__*/function () {
    function HUDMenu(listener, channel) {
      _classCallCheck(this, HUDMenu);
      this.listener = listener;
      this.channel = channel;
      this.original = channel.original;
      this.html = document.createElement('div');
    }
    return _createClass(HUDMenu, [{
      key: "create",
      value: function create() {
        var _this = this;
        var info = $("\n            <div class=\"iptv-hud-menu-info\">\n                <div class=\"iptv-hud-menu-info__group\">".concat(this.channel.group, "</div>\n                <div class=\"iptv-hud-menu-info__name\">").concat(this.channel.name, "</div>\n            </div>\n        "))[0];
        var favorite = this.button(Lampa.Template.get('cub_iptv_icon_favorite', {}, true), Lampa.Lang.translate('settings_input_links'), function () {
          Favorites.toggle(_this.original)["finally"](function () {
            favorite.toggleClass('active', Boolean(Favorites.find(_this.original)));
            _this.listener.send('action-favorite', _this.original);
          });
        });
        var locked = this.button(Lampa.Template.get('cub_iptv_icon_lock', {}, true), Lampa.Lang.translate(Locked.find(Locked.format('channel', this.original)) ? 'iptv_channel_unlock' : 'iptv_channel_lock'), function () {
          var name = Lampa.Controller.enabled().name;
          if (Lampa.Manifest.app_digital >= 204) {
            if (Locked.find(Locked.format('channel', _this.original))) {
              Lampa.ParentalControl.query(function () {
                Lampa.Controller.toggle(name);
                Locked.remove(Locked.format('channel', _this.original))["finally"](function () {
                  locked.toggleClass('active', Boolean(Locked.find(Locked.format('channel', _this.original))));
                  _this.listener.send('action-locked', _this.original);
                });
              }, function () {
                Lampa.Controller.toggle(name);
              });
            } else {
              Locked.add(Locked.format('channel', _this.original))["finally"](function () {
                locked.toggleClass('active', Boolean(Locked.find(Locked.format('channel', _this.original))));
                _this.listener.send('action-locked', _this.original);
              });
            }
          } else {
            Lampa.Noty.show(Lampa.Lang.translate('iptv_need_update_app'));
          }
        });
        favorite.toggleClass('active', Boolean(Favorites.find(this.original)));
        locked.toggleClass('active', Boolean(Locked.find(Locked.format('channel', this.original))));
        this.html.append(info);
        this.html.append(favorite);
        this.html.append(locked);
      }
    }, {
      key: "button",
      value: function button(icon, text, call) {
        var button = $("\n            <div class=\"iptv-hud-menu-button selector\">\n                <div class=\"iptv-hud-menu-button__icon\">".concat(icon, "</div>\n                <div class=\"iptv-hud-menu-button__text\">").concat(text, "</div>\n            </div>\n        "));
        button.on('hover:enter', call);
        return button[0];
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this2 = this;
        Lampa.Controller.add('player_iptv_hud_menu', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(_this2.render());
            Lampa.Controller.collectionFocus(false, _this2.render());
          },
          up: function up() {
            Navigator.move('up');
          },
          down: function down() {
            Navigator.move('down');
          },
          right: function right() {
            _this2.listener.send('toggle_program');
          },
          gone: function gone() {
            var focus = _this2.html.find('.focus');
            if (focus) focus.removeClass('focus');
          },
          back: function back() {
            _this2.listener.send('close');
          }
        });
        Lampa.Controller.toggle('player_iptv_hud_menu');
      }
    }, {
      key: "render",
      value: function render() {
        return this.html;
      }
    }, {
      key: "destroy",
      value: function destroy() {}
    }]);
  }();

  var HUDProgram = /*#__PURE__*/function () {
    function HUDProgram(listener, channel, program) {
      _classCallCheck(this, HUDProgram);
      this.listener = listener;
      this.channel = channel;
      this.html = document.createElement('div');
    }
    return _createClass(HUDProgram, [{
      key: "create",
      value: function create() {
        var _this = this;
        this.listener.follow('set_program_endless', function (event) {
          _this.endless = event.endless;
          _this.html.append(event.endless.render());
        });
        this.listener.send('get_program_endless');
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this2 = this;
        Lampa.Controller.add('player_iptv_hud_program', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(_this2.render());
            Lampa.Controller.collectionFocus(false, _this2.render());
          },
          up: function up() {
            _this2.endless.move(-1);
            Lampa.Controller.collectionSet(_this2.render());
            Lampa.Controller.collectionFocus(false, _this2.render());
          },
          down: function down() {
            _this2.endless.move(1);
            Lampa.Controller.collectionSet(_this2.render());
            Lampa.Controller.collectionFocus(false, _this2.render());
          },
          left: function left() {
            _this2.listener.send('toggle_menu');
          },
          gone: function gone() {
            var focus = _this2.html.find('.focus');
            if (focus) focus.removeClass('focus');
          },
          back: function back() {
            _this2.listener.send('close');
          }
        });
        Lampa.Controller.toggle('player_iptv_hud_program');
      }
    }, {
      key: "render",
      value: function render() {
        return this.html;
      }
    }, {
      key: "destroy",
      value: function destroy() {}
    }]);
  }();

  var HUD = /*#__PURE__*/function () {
    function HUD(channel, program) {
      _classCallCheck(this, HUD);
      this.listener = Lampa.Subscribe();
      this.menu = new HUDMenu(this.listener, channel, program);
      this.program = new HUDProgram(this.listener, channel, program);
      this.hud = Lampa.Template.js('cub_iptv_hud');
      this.hud.find('.iptv-hud__menu').append(this.menu.render());
      this.hud.find('.iptv-hud__program').append(this.program.render());
      document.body.find('.player').append(this.hud);
      this.listen();
    }
    return _createClass(HUD, [{
      key: "create",
      value: function create() {
        this.menu.create();
        this.program.create();
        this.menu.toggle();
      }
    }, {
      key: "listen",
      value: function listen() {
        var _this = this;
        this.listener.follow('toggle_menu', function () {
          _this.menu.toggle();
        });
        this.listener.follow('toggle_program', function () {
          _this.program.toggle();
        });
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.menu.destroy();
        this.program.destroy();
        this.hud.remove();
      }
    }]);
  }();

  var Channels = /*#__PURE__*/function () {
    function Channels(listener) {
      var _this = this;
      _classCallCheck(this, Channels);
      this.listener = listener;
      this.html = Lampa.Template.js('cub_iptv_content');
      this.inner_listener = Lampa.Subscribe();
      this.menu = new Menu(this.inner_listener);
      this.icons = new Icons(this.inner_listener);
      this.details = new Details(this.inner_listener);
      this.inner_listener.follow('toggle', function (name) {
        _this[name].toggle();
        _this.active = _this[name];
      });
      this.inner_listener.follow('back', function () {
        _this.listener.send('playlist-main');
      });
      this.inner_listener.follow('play', this.playChannel.bind(this));
      this.inner_listener.follow('play-archive', this.playArchive.bind(this));
      this.active = this.menu;
      this.html.find('.iptv-content__menu').append(this.menu.render());
      this.html.find('.iptv-content__channels').append(this.icons.render());
      this.html.find('.iptv-content__details').append(this.details.render());
    }
    return _createClass(Channels, [{
      key: "build",
      value: function build(data) {
        this.empty = false;
        this.menu.build(data);
        this.listener.send('display', this);
      }
    }, {
      key: "addToHistory",
      value: function addToHistory(channel) {
        var board = Lampa.Storage.cache('iptv_play_history_main_board', 20, []);
        var find = board.find(function (a) {
          return a.url == channel.url;
        });
        if (find) Lampa.Arrays.remove(board, find);
        board.push(channel);
        Lampa.Storage.set('iptv_play_history_main_board', board);
      }
    }, {
      key: "playArchive",
      value: function playArchive(data) {
        var convert = function convert(p) {
          var item = {
            title: Lampa.Utils.parseTime(p.start).time + ' - ' + Lampa.Utils.capitalizeFirstLetter(p.title)
          };
          item.url = Url.catchupUrl(data.channel.url, data.channel.catchup.type, data.channel.catchup.source);
          item.url = Url.prepareUrl(item.url, p);
          item.need_check_live_stream = true;
          return item;
        };
        Lampa.Player.runas(Lampa.Storage.field('player_iptv'));
        Lampa.Player.play(convert(data.program));
        Lampa.Player.playlist(data.playlist.map(convert));
      }
    }, {
      key: "playChannel",
      value: function playChannel(data) {
        var _this2 = this;
        var cache = {};
        cache.none = [];
        var time;
        var update;
        var start_channel = Lampa.Arrays.clone(this.icons.icons_clone[data.position]);
        start_channel.original = this.icons.icons_clone[data.position];
        data.url = Url.prepareUrl(start_channel.url);
        if (this.archive && this.archive.channel == start_channel.original) {
          data.url = Url.catchupUrl(this.archive.channel.url, this.archive.channel.catchup.type, this.archive.channel.catchup.source);
          data.url = Url.prepareUrl(data.url, this.archive.program);
        } else {
          this.addToHistory(Lampa.Arrays.clone(start_channel));
        }
        data.locked = Boolean(Locked.find(Locked.format('channel', start_channel.original)));
        data.onGetChannel = function (position) {
          var original = _this2.icons.icons_clone[position];
          var channel = Lampa.Arrays.clone(original);
          var timeshift = _this2.archive && _this2.archive.channel == original ? _this2.archive.timeshift : 0;
          channel.name = Utils.clearChannelName(channel.name);
          channel.group = Utils.clearMenuName(channel.group);
          channel.url = Url.prepareUrl(channel.url);
          channel.icons = [];
          channel.original = original;
          if (timeshift) {
            channel.shift = timeshift;
            channel.url = Url.catchupUrl(original.url, channel.catchup.type, channel.catchup.source);
            channel.url = Url.prepareUrl(channel.url, _this2.archive.program);
          }
          if (Locked.find(Locked.format('channel', original))) {
            channel.locked = true;
          }
          if (Boolean(Favorites.find(channel))) {
            channel.icons.push(Lampa.Template.get('cub_iptv_icon_fav', {}, true));
          }
          if (Boolean(Locked.find(Locked.format('channel', channel)))) {
            channel.icons.push(Lampa.Template.get('cub_iptv_icon_lock', {}, true));
          }
          update = false;
          if (channel.id) {
            if (!cache[channel.id]) {
              cache[channel.id] = [];
              Api.program({
                name: channel.name,
                channel_id: channel.id,
                tvg: channel.tvg,
                time: EPG.time(channel, timeshift)
              }).then(function (program) {
                cache[channel.id] = program;
              })["finally"](function () {
                Lampa.Player.programReady({
                  channel: channel,
                  position: EPG.position(channel, cache[channel.id], timeshift),
                  total: cache[channel.id].length
                });
              });
            } else {
              Lampa.Player.programReady({
                channel: channel,
                position: EPG.position(channel, cache[channel.id], timeshift),
                total: cache[channel.id].length
              });
            }
          } else {
            Lampa.Player.programReady({
              channel: channel,
              position: 0,
              total: 0
            });
          }
          return channel;
        };
        data.onMenu = function (channel) {
          _this2.hud = new HUD(channel);
          _this2.hud.listener.follow('close', function () {
            _this2.hud = _this2.hud.destroy();
            Lampa.Controller.toggle('player_tv');
          });
          _this2.hud.listener.follow('get_program_endless', function () {
            var program = cache[channel.id || 'none'];
            var endless = _this2.details.playlist(channel, program, {
              onPlay: function onPlay(param) {
                Lampa.Player.close();
                _this2.playArchive(param);
              }
            });
            _this2.hud.listener.send('set_program_endless', {
              endless: endless
            });
          });
          _this2.hud.listener.follow('action-favorite', function (orig) {
            Lampa.PlayerIPTV.redrawChannel();
            _this2.inner_listener.send('update-favorites');
            _this2.inner_listener.send('update-channel-icon', orig);
          });
          _this2.hud.listener.follow('action-locked', function (orig) {
            Lampa.PlayerIPTV.redrawChannel();
            _this2.inner_listener.send('update-channel-icon', orig);
          });
          _this2.hud.create();
        };

        //устарело, потом удалить
        data.onPlaylistProgram = function (channel) {
          var program = cache[channel.id || 'none'];
          if (!program.length) return;
          var html = document.createElement('div');
          html.style.lineHeight = '1.4';
          Lampa.Modal.open({
            title: '',
            size: 'medium',
            html: $(html)
          });
          var endless = _this2.details.playlist(channel, program, {
            onPlay: function onPlay(param) {
              Lampa.Modal.close();
              Lampa.Player.close();
              _this2.playArchive(param);
            }
          });
          html.append(endless.render());
          Lampa.Controller.add('modal', {
            invisible: true,
            toggle: function toggle() {
              Lampa.Controller.collectionSet(html);
              Lampa.Controller.collectionFocus(false, html);
            },
            up: function up() {
              endless.move(-1);
              Lampa.Controller.collectionSet(html);
              Lampa.Controller.collectionFocus(false, html);
            },
            down: function down() {
              endless.move(1);
              Lampa.Controller.collectionSet(html);
              Lampa.Controller.collectionFocus(false, html);
            },
            back: function back() {
              Lampa.Modal.close();
              Lampa.Controller.toggle('player_tv');
            }
          });
          Lampa.Controller.toggle('modal');
        };
        data.onPlay = function (channel) {
          Pilot.notebook('channel', _this2.icons.icons_clone.indexOf(channel.original));
          if (channel.original.added) {
            channel.original.view++;
            Favorites.update(channel.original);
          }
        };
        data.onGetProgram = function (channel, position, container) {
          update = false;
          var timeshift = channel.shift || 0;
          var program = cache[channel.id || 'none'];
          var noprog = document.createElement('div');
          noprog.addClass('player-panel-iptv-item__prog-load');
          noprog.text(Lampa.Lang.translate('iptv_noprogram'));
          container[0].empty().append(noprog);
          if (program.length) {
            var start = EPG.position(channel, program, timeshift);
            var list = program.slice(position, position + 2);
            var now = program[start];
            if (list.length) container[0].empty();
            list.forEach(function (prog) {
              var item = document.createElement('div');
              item.addClass('player-panel-iptv-item__prog-item');
              var span = document.createElement('span');
              span.html(Lampa.Utils.parseTime(prog.start).time + (now == prog ? ' - ' + Lampa.Utils.parseTime(prog.stop).time : '') + ' &nbsp; ' + Utils.clear(prog.title));
              item.append(span);
              if (now == prog) {
                item.addClass('watch');
                var timeline = document.createElement('div');
                timeline.addClass('player-panel-iptv-item__prog-timeline');
                var div = document.createElement('div');
                div.style.width = EPG.timeline(channel, prog, timeshift) + '%';
                timeline.append(div);
                update = function update() {
                  var percent = EPG.timeline(channel, prog, timeshift);
                  div.style.width = percent + '%';
                  if (percent == 100) {
                    var next = EPG.position(channel, program, timeshift);
                    if (start !== next) {
                      Lampa.Player.programReady({
                        channel: channel,
                        position: next,
                        total: cache[channel.id].length
                      });
                    }
                  }
                };
                item.append(timeline);
              }
              container[0].append(item);
            });
          }
        };
        Lampa.Player.iptv(data);
        time = setInterval(function () {
          if (update) update();
        }, 1000 * 10);
        var destroy = function destroy() {
          Lampa.Player.listener.remove('destroy', destroy);
          cache = null;
          update = null;
          _this2.archive = false;
          if (_this2.hud) _this2.hud = _this2.hud.destroy();
          Pilot.notebook('channel', -1);
          clearInterval(time);
        };
        Lampa.Player.listener.follow('destroy', destroy);
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this3 = this;
        if (this.empty) {
          Lampa.Controller.add('content', {
            invisible: true,
            toggle: function toggle() {
              Lampa.Controller.clear();
            },
            left: function left() {
              Lampa.Controller.toggle('menu');
            },
            up: function up() {
              Lampa.Controller.toggle('head');
            },
            back: function back() {
              _this3.listener.send('playlist-main');
            }
          });
          Lampa.Controller.toggle('content');
        } else this.active.toggle();
      }
    }, {
      key: "render",
      value: function render() {
        return this.empty ? this.empty.render(true) : this.html;
      }
    }, {
      key: "load",
      value: function load(playlist) {
        var _this4 = this;
        this.listener.send('loading');
        Api.playlist(playlist).then(this.build.bind(this))["catch"](function (e) {
          _this4.empty = new Lampa.Empty({
            descr: '<div style="width: 60%; margin:0 auto; line-height: 1.4">' + Lampa.Lang.translate('iptv_noload_playlist') + '</div>'
          });
          _this4.listener.send('display', _this4);
        });
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.menu.destroy();
        this.icons.destroy();
        this.details.destroy();
        this.inner_listener.destroy();
        this.active = false;
        this.epg_cache = null;
        this.html.remove();
      }
    }]);
  }();

  function Component() {
    var html = document.createElement('div');
    var listener;
    var playlist;
    var channels;
    var initialized;
    window.iptv_mobile = window.innerWidth < 768;
    if (Lampa.Manifest.app_digital >= 185) {
      listener = Lampa.Subscribe();
      playlist = new Playlist(listener);
      channels = new Channels(listener);
    }
    this.create = function () {
      return this.render();
    };
    this.initialize = function () {
      var _this = this;
      this.activity.loader(true);
      if (Lampa.Manifest.app_digital >= 185) {
        listener.follow('display', function (controller) {
          _this.active = controller;
          _this.display(controller.render());
        });
        listener.follow('loading', this.loading.bind(this));
        listener.follow('channels-load', channels.load.bind(channels));
        listener.follow('playlist-main', playlist.main.bind(playlist));
        playlist.load();
      } else {
        var old = Lampa.Template.get('cub_iptv_list');
        old.find('.iptv-list__title').text(Lampa.Lang.translate('iptv_update_app_title'));
        old.find('.iptv-list__text').text(Lampa.Lang.translate('iptv_update_app_text'));
        $(html).append(old);
        this.activity.loader(false);
      }
      if (window.iptv_mobile) html.addClass('iptv-mobile');
    };
    this.playlist = function () {
      playlist.main();
    };
    this.loading = function () {
      this.activity.loader(true);
      this.active = false;
      this.start();
    };
    this.display = function (render) {
      html.empty().append(render);
      Lampa.Layer.update(html);
      Lampa.Layer.visible(html);
      this.activity.loader(false);
      this.start();
    };
    this.background = function () {
      Lampa.Background.immediately('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAZCAYAAABD2GxlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHASURBVHgBlZaLrsMgDENXxAf3/9XHFdXNZLm2YZHQymPk4CS0277v9+ffrut62nEcn/M8nzb69cxj6le1+75f/RqrZ9fatm3F9wwMR7yhawilNke4Gis/7j9srQbdaVFBnkcQ1WrfgmIIBcTrvgqqsKiTzvpOQbUnAykVW4VVqZXyyDllYFSKx9QaVrO7nGJIB63g+FAq/xhcHWBYdwCsmAtvFZUKE0MlVZWCT4idOlyhTp3K35R/6Nzlq0uBnsKWlEzgSh1VGJxv6rmpXMO7EK+XWUPnDFRWqitQFeY2UyZVryuWlI8ulLgGf19FooAUwC9gCWLcwzWPb7Wa60qdlZxjx6ooUuUqVQsK+y1VoAJyBeJAVsLJeYmg/RIXdG2kPhwYPBUQQyYF0XC8lwP3MTCrYAXB88556peCbUUZV7WccwkUQfCZC4PXdA5hKhSVhythZqjZM0J39w5m8BRadKAcrsIpNZsLIYdOqcZ9hExhZ1MH+QL+ciFzXzmYhZr/M6yUUwp2dp5U4naZDwAF5JRSefdScJZ3SkU0nl8xpaAy+7ml1EqvMXSs1HRrZ9bc3eZUSXmGa/mdyjbmqyX7A9RaYQa9IRJ0AAAAAElFTkSuQmCC');
    };
    this.start = function () {
      var _this2 = this;
      if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;
      if (!initialized) {
        initialized = true;
        this.initialize();
      }
      this.background();
      Lampa.Controller.add('content', {
        invisible: true,
        toggle: function toggle() {
          if (_this2.active) _this2.active.toggle();else {
            Lampa.Controller.collectionSet(html);
            Lampa.Controller.collectionFocus(false, html);
          }
        },
        left: function left() {
          Lampa.Controller.toggle('menu');
        },
        up: function up() {
          Lampa.Controller.toggle('head');
        },
        back: function back() {
          Lampa.Activity.backward();
        }
      });
      Lampa.Controller.toggle('content');
    };
    this.pause = function () {};
    this.stop = function () {};
    this.render = function () {
      return html;
    };
    this.destroy = function () {
      if (playlist) playlist.destroy();
      if (channels) channels.destroy();
      listener.destroy();
      html.remove();
    };
  }

  var UnpackStream = function () {
    var t = {},
      n = Uint8Array,
      i = Uint16Array,
      e = Uint32Array,
      r = new n(0),
      a = new n([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]),
      s = new n([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]),
      o = new n([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]),
      h = function h(t, n) {
        for (var r = new i(31), a = 0; a < 31; ++a) r[a] = n += 1 << t[a - 1];
        for (var s = new e(r[30]), o = 1; o < 30; ++o) for (var h = r[o]; h < r[o + 1]; ++h) s[h] = h - r[o] << 5 | o;
        return [r, s];
      },
      f = h(a, 2),
      l = f[0],
      p = f[1];
    l[28] = 258, p[258] = 28;
    var v,
      u = h(s, 0)[0],
      d = new i(32768);
    for (v = 0; v < 32768; ++v) {
      var c = (43690 & v) >>> 1 | (21845 & v) << 1;
      c = (61680 & (c = (52428 & c) >>> 2 | (13107 & c) << 2)) >>> 4 | (3855 & c) << 4, d[v] = ((65280 & c) >>> 8 | (255 & c) << 8) >>> 1;
    }
    var g = function g(t, n, e) {
        for (var r = t.length, a = 0, s = new i(n); a < r; ++a) t[a] && ++s[t[a] - 1];
        var o,
          h = new i(n);
        for (a = 0; a < n; ++a) h[a] = h[a - 1] + s[a - 1] << 1;
        if (e) {
          o = new i(1 << n);
          var f = 15 - n;
          for (a = 0; a < r; ++a) if (t[a]) for (var l = a << 4 | t[a], p = n - t[a], v = h[t[a] - 1]++ << p, u = v | (1 << p) - 1; v <= u; ++v) o[d[v] >>> f] = l;
        } else for (o = new i(r), a = 0; a < r; ++a) t[a] && (o[a] = d[h[t[a] - 1]++] >>> 15 - t[a]);
        return o;
      },
      w = new n(288);
    for (v = 0; v < 144; ++v) w[v] = 8;
    for (v = 144; v < 256; ++v) w[v] = 9;
    for (v = 256; v < 280; ++v) w[v] = 7;
    for (v = 280; v < 288; ++v) w[v] = 8;
    var y = new n(32);
    for (v = 0; v < 32; ++v) y[v] = 5;
    var m = g(w, 9, 1),
      b = g(y, 5, 1),
      T = function T(t) {
        for (var n = t[0], i = 1; i < t.length; ++i) t[i] > n && (n = t[i]);
        return n;
      },
      E = function E(t, n, i) {
        var e = n / 8 | 0;
        return (t[e] | t[e + 1] << 8) >> (7 & n) & i;
      },
      k = function k(t, n) {
        var i = n / 8 | 0;
        return (t[i] | t[i + 1] << 8 | t[i + 2] << 16) >> (7 & n);
      },
      C = function C(t, r, a) {
        (null == r || r < 0) && (r = 0), (null == a || a > t.length) && (a = t.length);
        var s = new (2 === t.BYTES_PER_ELEMENT ? i : 4 === t.BYTES_PER_ELEMENT ? e : n)(a - r);
        return s.set(t.subarray(r, a)), s;
      };
    t.FlateErrorCode = {
      UnexpectedEOF: 0,
      InvalidBlockType: 1,
      InvalidLengthLiteral: 2,
      InvalidDistance: 3,
      StreamFinished: 4,
      NoStreamHandler: 5,
      InvalidHeader: 6,
      NoCallback: 7,
      InvalidUTF8: 8,
      ExtraFieldTooLong: 9,
      InvalidDate: 10,
      FilenameTooLong: 11,
      StreamFinishing: 12,
      InvalidZipData: 13,
      UnknownCompressionMethod: 14
    };
    var F = ["unexpected EOF", "invalid block type", "invalid length/literal", "invalid distance", "stream finished", "no stream handler", "invalid header", "no callback", "invalid UTF-8 data", "extra field too long", "date not in range 1980-2099", "filename too long", "stream finishing", "invalid zip data", "determined by unknown compression method"],
      S = function S(t, n, i) {
        var e = new Error(n || F[t]);
        if (e.code = t, !i) throw e;
        return e;
      },
      x = function () {
        function t(t) {
          this.s = {}, this.p = new n(0), this.ondata = t;
        }
        return t.prototype.e = function (t) {
          this.ondata || S(5), this.d && S(4);
          var i = this.p.length,
            e = new n(i + t.length);
          e.set(this.p), e.set(t, i), this.p = e;
        }, t.prototype.c = function (t) {
          this.d = this.s.i = t || !1;
          var i = this.s.b,
            e = function (t, i, e) {
              var r = t.length;
              if (!r || e && e.f && !e.l) return i || new n(0);
              var h = !i || e,
                f = !e || e.i;
              e || (e = {}), i || (i = new n(3 * r));
              var p = function p(t) {
                  var e = i.length;
                  if (t > e) {
                    var r = new n(Math.max(2 * e, t));
                    r.set(i), i = r;
                  }
                },
                v = e.f || 0,
                d = e.p || 0,
                c = e.b || 0,
                w = e.l,
                y = e.d,
                F = e.m,
                x = e.n,
                I = 8 * r;
              do {
                if (!w) {
                  v = E(t, d, 1);
                  var U = E(t, d + 1, 3);
                  if (d += 3, !U) {
                    var D = 4 + ((d + 7) / 8 | 0),
                      L = t[D - 4] | t[D - 3] << 8,
                      z = D + L;
                    if (z > r) {
                      f && S(0);
                      break;
                    }
                    h && p(c + L), i.set(t.subarray(D, z), c), e.b = c += L, e.p = d = 8 * z, e.f = v;
                    continue;
                  }
                  if (1 === U) w = m, y = b, F = 9, x = 5;else if (2 === U) {
                    var B = E(t, d, 31) + 257,
                      M = E(t, d + 10, 15) + 4,
                      N = B + E(t, d + 5, 31) + 1;
                    d += 14;
                    var _,
                      A = new n(N),
                      G = new n(19);
                    for (_ = 0; _ < M; ++_) G[o[_]] = E(t, d + 3 * _, 7);
                    d += 3 * M;
                    var H = T(G),
                      O = (1 << H) - 1,
                      P = g(G, H, 1);
                    for (_ = 0; _ < N;) {
                      var R = P[E(t, d, O)];
                      d += 15 & R;
                      var Y = R >>> 4;
                      if (Y < 16) A[_++] = Y;else {
                        var Z = 0,
                          j = 0;
                        for (16 === Y ? (j = 3 + E(t, d, 3), d += 2, Z = A[_ - 1]) : 17 === Y ? (j = 3 + E(t, d, 7), d += 3) : 18 === Y && (j = 11 + E(t, d, 127), d += 7); j--;) A[_++] = Z;
                      }
                    }
                    var q = A.subarray(0, B),
                      J = A.subarray(B);
                    F = T(q), x = T(J), w = g(q, F, 1), y = g(J, x, 1);
                  } else S(1);
                  if (d > I) {
                    f && S(0);
                    break;
                  }
                }
                h && p(c + 131072);
                for (var K = (1 << F) - 1, Q = (1 << x) - 1, V = d;; V = d) {
                  var W = w[k(t, d) & K],
                    X = W >>> 4;
                  if ((d += 15 & W) > I) {
                    f && S(0);
                    break;
                  }
                  if (W || S(2), X < 256) i[c++] = X;else {
                    if (256 === X) {
                      V = d, w = null;
                      break;
                    }
                    var $ = X - 254;
                    if (X > 264) {
                      var tt = X - 257,
                        nt = a[tt];
                      $ = E(t, d, (1 << nt) - 1) + l[tt], d += nt;
                    }
                    var it = y[k(t, d) & Q],
                      et = it >>> 4;
                    it || S(3), d += 15 & it;
                    var rt = u[et];
                    if (et > 3) {
                      var at = s[et];
                      rt += k(t, d) & (1 << at) - 1, d += at;
                    }
                    if (d > I) {
                      f && S(0);
                      break;
                    }
                    h && p(c + 131072);
                    for (var st = c + $; c < st; c += 4) i[c] = i[c - rt], i[c + 1] = i[c + 1 - rt], i[c + 2] = i[c + 2 - rt], i[c + 3] = i[c + 3 - rt];
                    c = st;
                  }
                }
                e.l = w, e.p = V, e.b = c, e.f = v, w && (v = 1, e.m = F, e.d = y, e.n = x);
              } while (!v);
              return c === i.length ? i : C(i, 0, c);
            }(this.p, this.o, this.s);
          this.ondata(C(e, i, this.s.b), this.d), this.o = C(e, this.s.b - 32768), this.s.b = this.o.length, this.p = C(this.p, this.s.p / 8 | 0), this.s.p &= 7;
        }, t.prototype.push = function (t, n) {
          this.e(t), this.c(n);
        }, t;
      }();
    t.Inflate = x;
    var I = function () {
      function t(t) {
        this.ondata = t;
      }
      return t.prototype.push = function (t, n) {
        this.ondata(t, n);
      }, t;
    }();
    t.TextBytes = I;
    var U = function () {
      function t(t) {
        this.v = 1, x.call(this, t);
      }
      return t.prototype.push = function (t, n) {
        if (x.prototype.e.call(this, t), this.v) {
          var i = this.p.length > 3 ? function (t) {
            31 === t[0] && 139 === t[1] && 8 === t[2] || S(6, "invalid gzip data");
            var n = t[3],
              i = 10;
            4 & n && (i += t[10] | 2 + (t[11] << 8));
            for (var e = (n >> 3 & 1) + (n >> 4 & 1); e > 0;) e -= !t[i++];
            return i + (2 & n);
          }(this.p) : 4;
          if (i >= this.p.length && !n) return;
          this.p = this.p.subarray(i), this.v = 0;
        }
        n && (this.p.length < 8 && S(6, "invalid gzip data"), this.p = this.p.subarray(0, -8)), x.prototype.c.call(this, n);
      }, t;
    }();
    t.Gunzip = U, t.Decompress = function () {
      function t(t) {
        this.G = U, this.I = x, this.T = I, this.ondata = t;
      }
      return t.prototype.push = function (t, i) {
        if (this.ondata || S(5), this.s) this.s.push(t, i);else {
          if (this.p && this.p.length) {
            var e = new n(this.p.length + t.length);
            e.set(this.p), e.set(t, this.p.length);
          } else this.p = t;
          if (this.p.length > 2) {
            var r = this,
              a = function a() {
                r.ondata.apply(r, arguments);
              };
            this.s = 31 === this.p[0] && 139 === this.p[1] && 8 === this.p[2] ? new this.G(a) : new this.T(a), this.s.push(this.p, i), this.p = null;
          }
        }
      }, t;
    }();
    var D = "undefined" != typeof TextDecoder && new TextDecoder(),
      L = 0;
    try {
      D.decode(r, {
        stream: !0
      }), L = 1;
    } catch (t) {}
    return t.DecodeUTF8 = function () {
      function t(t) {
        this.ondata = t, L ? this.t = new TextDecoder() : this.p = r;
      }
      return t.prototype.push = function (t, i) {
        if (this.ondata || S(5), i = !!i, this.t) return this.ondata(this.t.decode(t, {
          stream: !0
        }), i), void (i && (this.t.decode().length && S(8), this.t = null));
        this.p || S(4);
        var e = new n(this.p.length + t.length);
        e.set(this.p), e.set(t, this.p.length);
        var r = function (t) {
            for (var n = "", i = 0;;) {
              var e = t[i++],
                r = (e > 127) + (e > 223) + (e > 239);
              if (i + r > t.length) return [n, C(t, i - 1)];
              r ? 3 === r ? (e = ((15 & e) << 18 | (63 & t[i++]) << 12 | (63 & t[i++]) << 6 | 63 & t[i++]) - 65536, n += String.fromCharCode(55296 | e >> 10, 56320 | 1023 & e)) : n += 1 & r ? String.fromCharCode((31 & e) << 6 | 63 & t[i++]) : String.fromCharCode((15 & e) << 12 | (63 & t[i++]) << 6 | 63 & t[i++]) : n += String.fromCharCode(e);
            }
          }(e),
          a = r[0],
          s = r[1];
        i ? (s.length && S(8), this.p = null) : this.p = s, this.ondata(a, i);
      }, t;
    }(), t;
  }();

  var cur_time = 0;
  var channel = {};
  // Распаковываем по 32 КБ gzip, обычно при сжатии чанк по умолчанию 16 КБ, поэтому меньше нет смысла ставить.
  var maxChunkSize = 4 * 1024;
  var string_data = '';
  var percent = -1;
  var this_res = null;
  var load_end = false;
  var chunk_parse = false;
  var dcmpStrm = function dcmpStrm() {};
  var content_type = '';
  var cur_pos = 0;
  var content_length = 0;
  var listener = Lampa.Subscribe();
  function nextChunk() {
    if (chunk_parse || this_res === null) return;
    chunk_parse = true;
    var len = this_res.responseText.length;
    var maxPos = Math.min(cur_pos + maxChunkSize, len);
    if (maxPos > cur_pos) {
      var finish = load_end && maxPos === len;
      dcmpStrm.push(str2ab(this_res.responseText.substring(cur_pos, maxPos)), finish);
      cur_pos = maxPos;
      percent = content_length ? cur_pos * 100 / content_length : load_end ? cur_pos * 100 / len : -1;
      listener.send('percent', {
        percent: percent
      });
      if (finish) {
        parseFinish();
        listener.send('end', {
          time: unixtime() - cur_time,
          channel: channel
        });
        channel = {};
      }
    }
    chunk_parse = false;
    requestFrame();
  }
  function parseChannel(attr, string) {
    if (!attr['id']) return; // todo не парсить каналы которых нет в листе

    string = string.replace(/\n/g, '');
    var names = [];
    var m_name = string.match(/<display-name[^>]+>(.*?)</g);
    var m_icon = string.match(/<icon src="(.*?)"/);
    if (m_name) {
      names = m_name.map(function (n) {
        return n.slice(0, -1).split('>')[1];
      });
    }
    channel[attr.id] = {
      id: attr.id,
      names: names,
      icon: m_icon ? m_icon[1] : '',
      program: []
    };
    listener.send('channel', {
      channel: channel[attr.id]
    });
  }
  function parseProgramme(attr, string) {
    if (!attr['channel'] || !attr['start'] || !attr['stop'] || !channel[attr.channel]) return;
    var start = parseDate(attr.start);
    var stop = parseDate(attr.stop);
    string = string.replace(/\n/g, '');
    var m_title = string.match(/<title\s+lang="ru">(.*?)</);
    var m_category = string.match(/<category\s+lang="ru">(.*?)</);
    var m_desc = string.match(/<desc\s+lang="ru">(.*?)</);
    var m_icon = string.match(/<icon src="(.*?)"/);
    if (!m_title) m_title = string.match(/<title[^>]+>(.*?)</);
    if (!m_category) m_category = string.match(/<category[^>]+>(.*?)</);
    if (!m_desc) m_desc = string.match(/<desc[^>]+>(.*?)</);
    var title = m_title ? m_title[1] : '';
    var category = m_category ? m_category[1] : '';
    var desc = m_desc ? m_desc[1] : '';
    var icon = m_icon ? m_icon[1] : '';
    var prog = {
      start: start * 1000,
      stop: stop * 1000,
      title: title,
      category: category,
      desc: desc,
      icon: icon
    };
    listener.send('program', {
      program: prog,
      id: attr.channel,
      channel: channel[attr.channel]
    });
  }
  function parseDate(s) {
    return Date.parse(s.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s+([+-]\d{2})(\d{2})$/, '$1-$2-$3T$4:$5:$6$7:$8')) / 1000;
  }
  function parseParams(s) {
    var o = {},
      m,
      mm;
    if (!!(m = s.match(/([^\s=]+)=((["'])(.*?)\3|\S+)/g))) {
      for (var i = 0; i < m.length; i++) {
        if (!!(mm = m[i].match(/([^\s=]+)=((["'])(.*?)\3|\S+)/))) {
          o[mm[1].toLowerCase()] = mm[4] || mm[2];
        }
      }
    }
    return o;
  }
  function unixtime() {
    return Math.floor(new Date().getTime() / 1000);
  }
  function str2ab(str) {
    var buf = new ArrayBuffer(str.length),
      bufView = new Uint8Array(buf),
      i = 0;
    for (; i < str.length; i++) bufView[i] = str.charCodeAt(i) & 0xff;
    return bufView;
  }
  function parseFinish() {
    //clearInterval(interval)

    string_data = '';
    percent = -1;
    this_res = null;
    load_end = false;
    chunk_parse = false;
    dcmpStrm = function dcmpStrm() {};
    content_type = '';
    cur_pos = 0;
    content_length = 0;
  }
  function requestFrame() {
    requestAnimationFrame(nextChunk);
  }
  function parseStart(url) {
    parseFinish();
    channel = {};
    var chOrProgRegExp;
    try {
      chOrProgRegExp = new RegExp('\\s*<(programme|channel)(\\s+([^>]+)?)?>(.*?)<\\/\\1\\s*>\\s*', 'gs');
    } catch (e) {
      chOrProgRegExp = new RegExp('\\s*<(programme|channel)(\\s+([^>]+)?)?>((.|\\n)*?)<\\/\\1\\s*>\\s*', 'g');
    }
    cur_time = unixtime();
    listener.send('start');
    var xhr = new XMLHttpRequest();
    var utfDecode = new UnpackStream.DecodeUTF8(function (data, _final) {
      string_data += data;
      var lenStart = string_data.length;
      string_data = string_data.replace(chOrProgRegExp, function (match, p1, p2, p3, p4) {
        if (p1 === 'channel') parseChannel(parseParams(p3), p4);else parseProgramme(parseParams(p3), p4);
        return '';
      });
      if (lenStart === string_data.length && lenStart > 204800) {
        var text = 'Bad xml.gz file';
        console.log('IPTV', text, string_data.substring(0, 4096) + '...');
        if (!load_end) xhr.abort();
        parseFinish();
        listener.send('error', {
          text: text
        });
      }
    });
    dcmpStrm = new UnpackStream.Decompress(function (chunk, _final2) {
      utfDecode.push(chunk, _final2);
    });
    xhr.open('get', url);
    xhr.responseType = 'text';
    xhr.overrideMimeType('text\/plain; charset=x-user-defined');
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 2) {
        // получаем заголовки
        content_type = xhr.getResponseHeader('content-type') || content_type;
        content_length = xhr.getResponseHeader('content-length') || content_length;
        console.log('IPTV', 'Content-Type', content_type);
        console.log('IPTV', 'Content-Length', content_length);
        requestFrame();
        //interval = setInterval(nextChunk, intervalTime)
      }
    };
    xhr.onload = xhr.onprogress = function (e) {
      this_res = this;
      load_end = e.type === 'load';
    };
    xhr.onerror = function () {
      // происходит, только когда запрос совсем не получилось выполнить
      parseFinish();
      listener.send('error', {
        text: 'Error connect (CORS or bad URL)'
      });
    };
    xhr.onabort = function () {
      parseFinish();
      listener.send('error', {
        text: 'Load abort'
      });
    };
    xhr.ontimeout = function () {
      parseFinish();
      listener.send('error', {
        text: 'Load timeout'
      });
    };
    xhr.send();
  }
  var Parser = {
    listener: listener,
    start: parseStart
  };

  var Guide = /*#__PURE__*/function () {
    function Guide() {
      _classCallCheck(this, Guide);
    }
    return _createClass(Guide, null, [{
      key: "init",
      value: function init() {
        var _this = this;
        if (Lampa.Storage.field('iptv_guide_update_after_start')) this.update();
        setInterval(function () {
          var lastupdate = Lampa.Storage.get('iptv_guide_updated_status', '{}').time || 0;
          if (Lampa.Storage.field('iptv_guide_interval') > 0 && lastupdate + 1000 * 60 * 60 * Lampa.Storage.field('iptv_guide_interval') < Date.now()) _this.update();
        }, 1000 * 60);
      }
    }, {
      key: "update",
      value: function update(status_elem) {
        var url = Lampa.Storage.get('iptv_guide_url');
        if (Lampa.Storage.field('iptv_guide_custom') && url) {
          if (!window.iptv_guide_update_process) {
            window.iptv_guide_update_process = Parser.listener;
            var last_id = -1;
            var program = [];
            Parser.listener.follow('program', function (data) {
              if (last_id == data.id) program.push(data.program);else {
                DB.rewriteData('epg', last_id, program)["finally"](function () {});
                last_id = data.id;
                program = [data.program];
              }
            });
            Parser.listener.follow('channel', function (data) {
              data.channel.names.forEach(function (name) {
                DB.addData('epg_channels', name.toLowerCase(), {
                  id: data.channel.id,
                  ic: data.channel.icon
                })["catch"](function () {});
              });
            });
            if (Lampa.Processing) {
              Parser.listener.follow('percent', function (data) {
                Lampa.Processing.push('iptv', data.percent);
              });
            }
            Parser.listener.follow('end', function (data) {
              program = [];
              var count = Lampa.Arrays.getKeys(data.channel).length;
              Lampa.Storage.set('iptv_guide_updated_status', {
                type: 'finish',
                channels: count,
                time: Date.now()
              });
              Parser.listener.send('finish', {
                count: count,
                time: Date.now()
              });
              window.iptv_guide_update_process.destroy();
              window.iptv_guide_update_process = false;
            });
            Parser.listener.follow('error', function (data) {
              window.iptv_guide_update_process.destroy();
              window.iptv_guide_update_process = false;
              Lampa.Storage.set('iptv_guide_updated_status', {
                type: 'error',
                text: data.text,
                time: Date.now()
              });
            });
            if (DB.clearTable) {
              DB.clearTable('epg')["finally"](function () {});
              DB.clearTable('epg_channels')["finally"](function () {});
            }
            setTimeout(function () {
              Parser.start(url);
            }, 100);
          }
        } else if (status_elem) {
          Lampa.Noty.show(Lampa.Lang.translate('iptv_guide_error_link'));
        }
      }
    }]);
  }();

  function init$2() {
    Lampa.Template.add('cub_iptv_content', "\n        <div class=\"iptv-content\">\n            <div class=\"iptv-content__menu\"></div>\n            <div class=\"iptv-content__channels\"></div>\n            <div class=\"iptv-content__details\"></div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_menu', "\n        <div class=\"iptv-menu\">\n            <div class=\"iptv-menu__body\">\n                <div class=\"iptv-menu__head\">\n                    <div class=\"iptv-menu__title\"></div>\n                    <div class=\"iptv-menu__search selector\">\n                        <svg width=\"23\" height=\"22\" viewBox=\"0 0 23 22\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                            <circle cx=\"9.9964\" cy=\"9.63489\" r=\"8.43556\" stroke=\"currentColor\" stroke-width=\"2.4\"></circle>\n                            <path d=\"M20.7768 20.4334L18.2135 17.8701\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"></path>\n                        </svg>\n                    </div>\n                </div>\n                <div class=\"iptv-menu__list\"></div>\n            </div>\n        </div>\n    ");
    Lampa.Template.add('iptv_menu_mobile_button_search', "\n        <div class=\"iptv-menu__search-mobile selector\">\n            <svg width=\"23\" height=\"22\" viewBox=\"0 0 23 22\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <circle cx=\"9.9964\" cy=\"9.63489\" r=\"8.43556\" stroke=\"currentColor\" stroke-width=\"2.4\"></circle>\n                <path d=\"M20.7768 20.4334L18.2135 17.8701\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"></path>\n            </svg>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_channels', "\n        <div class=\"iptv-channels\">\n            \n        </div>\n    ");
    Lampa.Template.add('cub_iptv_details', "\n        <div class=\"iptv-details layer--wheight\">\n            <div class=\"iptv-details__play\"></div>\n            <div class=\"iptv-details__title\"></div>\n\n            <div class=\"iptv-details__program\">\n\n            </div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_details_empty', "\n        <div class=\"iptv-details-epmty endless endless-up\">\n            <div><span></span><span style=\"width: 60%\"></span></div>\n            <div><span></span><span style=\"width: 70%\"></span></div>\n            <div><span></span><span style=\"width: 40%\"></span></div>\n            <div><span></span><span style=\"width: 55%\"></span></div>\n            <div><span></span><span style=\"width: 30%\"></span></div>\n            <div><span></span><span style=\"width: 55%\"></span></div>\n            <div><span></span><span style=\"width: 30%\"></span></div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_playlist_item', "\n        <div class=\"iptv-playlist-item selector layer--visible layer--render\">\n            <div class=\"iptv-playlist-item__body\">\n                <div class=\"iptv-playlist-item__name\">\n                    <div class=\"iptv-playlist-item__name-ico\"><span></span></div>\n                    <div class=\"iptv-playlist-item__name-text\">est</div>\n                </div>\n                <div class=\"iptv-playlist-item__url\"></div>\n            </div>\n\n            <div class=\"iptv-playlist-item__footer hide\">\n                <div class=\"iptv-playlist-item__details details-left\"></div>\n                <div class=\"iptv-playlist-item__details details-right\"></div>\n            </div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_list_add_custom', "\n        <div class=\"iptv-playlist-item selector layer--visible\">\n            <div class=\"iptv-playlist-item__title\">\n                \n            </div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_list', "\n        <div class=\"iptv-list layer--wheight\">\n            <div class=\"iptv-list__ico\">\n                <svg height=\"36\" viewBox=\"0 0 38 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect x=\"2\" y=\"8\" width=\"34\" height=\"21\" rx=\"3\" stroke=\"white\" stroke-width=\"3\"/>\n                    <line x1=\"13.0925\" y1=\"2.34874\" x2=\"16.3487\" y2=\"6.90754\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                    <line x1=\"1.5\" y1=\"-1.5\" x2=\"9.31665\" y2=\"-1.5\" transform=\"matrix(-0.757816 0.652468 0.652468 0.757816 26.197 2)\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                    <line x1=\"9.5\" y1=\"34.5\" x2=\"29.5\" y2=\"34.5\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                </svg>\n            </div>\n            <div class=\"iptv-list__title\"></div>\n            <div class=\"iptv-list__text\"></div>\n            <div class=\"iptv-list__items\"></div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_list_empty', "\n        <div class=\"iptv-list-empty selector\">\n            <div class=\"iptv-list-empty__text\"></div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_param_lock', "\n        <div class=\"iptv-param-lock\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"512\" height=\"512\" viewBox=\"0 0 401.998 401.998\" xml:space=\"preserve\"><path d=\"M357.45 190.721c-5.331-5.33-11.8-7.993-19.417-7.993h-9.131v-54.821c0-35.022-12.559-65.093-37.685-90.218C266.093 12.563 236.025 0 200.998 0c-35.026 0-65.1 12.563-90.222 37.688-25.126 25.126-37.685 55.196-37.685 90.219v54.821h-9.135c-7.611 0-14.084 2.663-19.414 7.993-5.33 5.326-7.994 11.799-7.994 19.417V374.59c0 7.611 2.665 14.086 7.994 19.417 5.33 5.325 11.803 7.991 19.414 7.991H338.04c7.617 0 14.085-2.663 19.417-7.991 5.325-5.331 7.994-11.806 7.994-19.417V210.135c.004-7.612-2.669-14.084-8.001-19.414zm-83.363-7.993H127.909v-54.821c0-20.175 7.139-37.402 21.414-51.675 14.277-14.275 31.501-21.411 51.678-21.411 20.179 0 37.399 7.135 51.677 21.411 14.271 14.272 21.409 31.5 21.409 51.675v54.821z\" fill=\"currentColor\"></path></svg>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_icon_favorite', "\n        <svg width=\"65\" height=\"87\" viewBox=\"0 0 65 87\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <path d=\"M36.1884 47.9221L32.5 42.6448L28.8116 47.9221L5.40983 81.4046C5.33938 81.5054 5.28461 81.5509 5.25807 81.5702C5.23028 81.5904 5.2049 81.6024 5.17705 81.611C5.11471 81.6301 4.99693 81.6414 4.84985 81.5951C4.70278 81.5488 4.61273 81.472 4.57257 81.4207C4.55463 81.3977 4.54075 81.3733 4.52953 81.3408C4.51882 81.3098 4.5 81.2411 4.5 81.1182V13C4.5 8.30558 8.30558 4.5 13 4.5H52C56.6944 4.5 60.5 8.30558 60.5 13V81.1182C60.5 81.2411 60.4812 81.3098 60.4705 81.3408C60.4593 81.3733 60.4454 81.3977 60.4274 81.4207C60.3873 81.472 60.2972 81.5488 60.1502 81.5951C60.0031 81.6414 59.8853 81.6301 59.8229 81.611C59.7951 81.6024 59.7697 81.5904 59.7419 81.5702C59.7154 81.5509 59.6606 81.5054 59.5902 81.4046L36.1884 47.9221Z\" stroke=\"currentColor\" stroke-width=\"9\"/>\n            <path class=\"active-layer\" d=\"M0 13C0 5.8203 5.8203 0 13 0H52C59.1797 0 65 5.8203 65 13V81.1182C65 86.0086 58.7033 87.9909 55.9018 83.9825L32.5 50.5L9.09823 83.9825C6.29666 87.9909 0 86.0086 0 81.1182V13Z\" fill=\"currentColor\"/>\n        </svg>\n    ");
    Lampa.Template.add('cub_iptv_icon_lock', "\n        <svg width=\"420\" height=\"512\" viewBox=\"0 0 420 512\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n        <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M384.532 232.729C394.233 232.729 402.472 236.121 409.262 242.91C416.053 249.698 419.457 257.941 419.452 267.636V477.092C419.452 486.786 416.053 495.033 409.271 501.822C402.48 508.608 394.242 512 384.541 512H35.4568C25.7632 512 17.5189 508.604 10.7304 501.822C3.9432 495.033 0.54895 486.786 0.54895 477.092V267.64C0.54895 257.937 3.94192 249.693 10.7304 242.91C17.5189 236.121 25.7632 232.729 35.4568 232.729H47.0915V162.907C47.0915 118.301 63.0871 80.0023 95.0886 48.0009C127.085 16.0007 165.388 0 209.999 0C254.61 0 292.906 16.0007 324.905 48.0021C356.907 80.0023 372.902 118.302 372.902 162.907V232.729H384.532ZM116.91 162.907V232.729H303.088V162.907C303.088 137.212 293.996 115.269 275.82 97.092C257.635 78.9095 235.703 69.8221 210.003 69.8221C184.304 69.8221 162.367 78.9108 144.183 97.092C126.002 115.271 116.91 137.212 116.91 162.907ZM62 293C53.7157 293 47 299.716 47 308V445C47 453.284 53.7157 460 62 460H358C366.284 460 373 453.284 373 445V308C373 299.716 366.284 293 358 293H62Z\" fill=\"currentColor\"/>\n        <rect class=\"active-layer\" x=\"33\" y=\"275\" width=\"354\" height=\"203\" rx=\"15\" fill=\"currentColor\"/>\n        </svg>\n    ");
    Lampa.Template.add('cub_iptv_icon_fav', "\n        <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\" xml:space=\"preserve\">\n            <path fill=\"currentColor\" d=\"M391.416,0H120.584c-17.778,0-32.242,14.464-32.242,32.242v460.413c0,7.016,3.798,13.477,9.924,16.895\n            c2.934,1.638,6.178,2.45,9.421,2.45c3.534,0,7.055-0.961,10.169-2.882l138.182-85.312l138.163,84.693\n            c5.971,3.669,13.458,3.817,19.564,0.387c6.107-3.418,9.892-9.872,9.892-16.875V32.242C423.657,14.464,409.194,0,391.416,0z\n            M384.967,457.453l-118.85-72.86c-6.229-3.817-14.07-3.798-20.28,0.032l-118.805,73.35V38.69h257.935V457.453z\"></path>\n        </svg>\n    ");
    Lampa.Template.add('cub_iptv_icon_all', "\n        <svg height=\"30\" viewBox=\"0 0 38 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"1.5\" y=\"1.5\" width=\"35\" height=\"27\" rx=\"1.5\" stroke=\"currentColor\" stroke-width=\"3\"></rect>\n            <rect x=\"6\" y=\"7\" width=\"25\" height=\"3\" fill=\"currentColor\"></rect>\n            <rect x=\"6\" y=\"13\" width=\"13\" height=\"3\" fill=\"currentColor\"></rect>\n            <rect x=\"6\" y=\"19\" width=\"19\" height=\"3\" fill=\"currentColor\"></rect>\n        </svg>\n    ");
    Lampa.Template.add('cub_iptv_icon_group', "\n        <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 512 512\" xml:space=\"preserve\">\n            <path fill=\"currentColor\" d=\"M478.354,146.286H33.646c-12.12,0-21.943,9.823-21.943,21.943v321.829c0,12.12,9.823,21.943,21.943,21.943h444.709\n                c12.12,0,21.943-9.823,21.943-21.943V168.229C500.297,156.109,490.474,146.286,478.354,146.286z M456.411,468.114H55.589V190.171\n                h400.823V468.114z\"></path>\n            <path fill=\"currentColor\" d=\"M441.783,73.143H70.217c-12.12,0-21.943,9.823-21.943,21.943c0,12.12,9.823,21.943,21.943,21.943h371.566\n                c12.12,0,21.943-9.823,21.943-21.943C463.726,82.966,453.903,73.143,441.783,73.143z\"></path>\n            <path fill=\"currentColor\" d=\"M405.211,0H106.789c-12.12,0-21.943,9.823-21.943,21.943c0,12.12,9.823,21.943,21.943,21.943h298.423\n                c12.12,0,21.943-9.823,21.943-21.943C427.154,9.823,417.331,0,405.211,0z\"></path>\n        </svg>\n    ");
    Lampa.Template.add('cub_iptv_icon_searched', "\n        <svg height=\"34\" viewBox=\"0 0 28 34\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"1.5\" y=\"1.5\" width=\"25\" height=\"31\" rx=\"2.5\" stroke=\"currentColor\" stroke-width=\"3\"></rect>\n            <rect x=\"6\" y=\"7\" width=\"16\" height=\"3\" rx=\"1.5\" fill=\"currentColor\"></rect>\n            <rect x=\"6\" y=\"13\" width=\"16\" height=\"3\" rx=\"1.5\" fill=\"currentColor\"></rect>\n        </svg>\n    ");
    Lampa.Template.add('cub_iptv_hud', "\n        <div class=\"iptv-hud\">\n            <div class=\"iptv-hud__content\">\n                <div class=\"iptv-hud__menu\"></div>\n                <div class=\"iptv-hud__program\"></div>\n            </div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_channel_main_board', "\n        <div class=\"iptv-channel iptv-channel--main selector layer--visible layer--render\">\n            <div class=\"iptv-channel__body\">\n                <img class=\"iptv-channel__ico\">\n            </div>\n        </div>\n    ");
    Lampa.Template.add('settings_iptv_guide', "<div>\n        <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"iptv_guide_custom\" data-children=\"use_custom_guide\">\n            <div class=\"settings-param__name\">#{iptv_param_guide_custom_title}</div>\n            <div class=\"settings-param__value\"></div>\n            <div class=\"settings-param__descr\">#{iptv_param_guide_custom_descr}</div>\n        </div>\n        <div data-parent=\"use_custom_guide\">\n            <div class=\"settings-param selector\" data-type=\"input\" data-name=\"iptv_guide_url\" placeholder=\"#{torrent_parser_set_link}\">\n                <div class=\"settings-param__name\">#{settings_parser_jackett_link}</div>\n                <div class=\"settings-param__value\"></div>\n                <div class=\"settings-param__descr\">#{iptv_param_guide_url_descr}</div>\n            </div>\n            <div class=\"settings-param selector\" data-type=\"select\" data-name=\"iptv_guide_save\">\n                <div class=\"settings-param__name\">#{iptv_param_guide_save_title}</div>\n                <div class=\"settings-param__value\"></div>\n                <div class=\"settings-param__descr\">#{iptv_param_guide_save_descr}</div>\n            </div>\n            <div class=\"settings-param selector\" data-type=\"select\" data-name=\"iptv_guide_interval\">\n                <div class=\"settings-param__name\">#{iptv_param_guide_interval_title}</div>\n                <div class=\"settings-param__value\"></div>\n                <div class=\"settings-param__descr\">#{iptv_param_guide_interval_descr}</div>\n            </div>\n            <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"iptv_guide_update_after_start\">\n                <div class=\"settings-param__name\">#{iptv_param_guide_update_after_start}</div>\n                <div class=\"settings-param__value\"></div>\n            </div>\n            <div class=\"settings-param selector settings-param--button update-guide-now\" data-static=\"true\">\n                <div class=\"settings-param__name\">#{iptv_param_guide_update_now}</div>\n            </div>\n            <div class=\"settings-param update-guide-status\" data-static=\"true\">\n                <div class=\"settings-param__name\">#{iptv_guide_status_finish}</div>\n                <div class=\"settings-param__value\">#{iptv_guide_status_noupdates}</div>\n            </div>\n        </div>\n    </div>");
    if (window.lampa_settings.iptv) {
      Lampa.Template.add('about', "<div class=\"about\">\n            <div>#{iptv_about_text}</div>\n        \n            <div class=\"overhide\">\n                <div class=\"about__contacts\">\n                    <div>\n                        <small>#{about_channel}</small><br>\n                        @lampa_channel\n                    </div>\n        \n                    <div>\n                        <small>#{about_group}</small><br>\n                        @lampa_group\n                    </div>\n        \n                    <div>\n                        <small>#{about_version}</small><br>\n                        <span class=\"version_app\"></span>\n                    </div>\n        \n                    <div class=\"hide platform_android\">\n                        <small>#{about_version} Android</small><br>\n                        <span class=\"version_android\"></span>\n                    </div>\n                </div>\n            </div>\n        </div>");
    }
    Lampa.Template.add('cub_iptv_style', "\n        <style>\n        .iptv-list{padding:1.5em;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;padding-bottom:1em}.iptv-list__ico{width:4.5em;margin-bottom:2em;height:4.5em}.iptv-list__ico>svg{width:4.5em;height:4.5em}.iptv-list__title{font-size:1.9em;margin-bottom:1em}.iptv-list__text{font-size:1.2em;line-height:1.4;margin-bottom:1em;text-align:center;width:60%;margin:0 auto;margin-bottom:2em}@media screen and (max-width:767px){.iptv-list__text{width:100%}}.iptv-list__items{width:80%;margin:0 auto}.iptv-list__items .scroll{height:22em}@media screen and (max-width:767px){.iptv-list__items{width:100%}}.iptv-list__item{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;padding:1em;background-color:rgba(255,255,255,0.1);font-size:1.3em;line-height:1.3;-webkit-border-radius:.3em;border-radius:.3em;margin:1em}.iptv-list__item-name{width:40%;padding-right:1em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap;text-align:left}.iptv-list__item-url{width:60%;padding-left:1em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap;text-align:right}.iptv-list__item.focus{background-color:#fff;color:black}.iptv-playlist-item{padding:1em;background-color:rgba(255,255,255,0.1);line-height:1.3;margin:1em;-webkit-border-radius:1em;border-radius:1em;position:relative}.iptv-playlist-item__body{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center}.iptv-playlist-item__url{width:60%;padding-left:1em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap;text-align:right}.iptv-playlist-item__title{text-align:center;padding:1em;font-size:1.3em}.iptv-playlist-item__name{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;width:40%}.iptv-playlist-item__name-ico{background-color:#fff;-webkit-border-radius:.5em;border-radius:.5em;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;padding:.3em .5em;color:#000;min-width:2.3em;text-align:center}.iptv-playlist-item__name-ico>span{font-size:1.2em;font-weight:900}.iptv-playlist-item__name-text{font-weight:600;padding-left:1em}.iptv-playlist-item__footer{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;margin-top:1em;-webkit-box-pack:justify;-webkit-justify-content:space-between;-ms-flex-pack:justify;justify-content:space-between}@media screen and (max-width:480px){.iptv-playlist-item__footer{display:block}}.iptv-playlist-item__details{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}.iptv-playlist-item__details+div{margin-left:2em}@media screen and (max-width:480px){.iptv-playlist-item__details+div{margin-left:0;margin-top:1em}}.iptv-playlist-item__label{color:rgba(255,255,255,0.5)}.iptv-playlist-item__label>span{color:#fff}.iptv-playlist-item__label+.iptv-playlist-item__label:before{content:'|';display:inline-block;margin:0 1em;font-size:.7em;margin-top:-0.4em}.iptv-playlist-item.focus::after,.iptv-playlist-item.hover::after{content:'';position:absolute;top:-0.5em;left:-0.5em;right:-0.5em;bottom:-0.5em;border:.3em solid #fff;-webkit-border-radius:1.4em;border-radius:1.4em;z-index:-1;pointer-events:none}.iptv-content{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;padding:0 1.5em;line-height:1.3}.iptv-content>div{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.iptv-content__menu{width:30%;padding-right:4em}@media screen and (max-width:900px){.iptv-content__menu{width:28%}}.iptv-content__channels{width:25%}@media screen and (max-width:900px){.iptv-content__channels{width:27%}}.iptv-content__details{width:45%;padding-left:4em}.iptv-menu__head{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;margin-bottom:2.4em;-webkit-box-align:start;-webkit-align-items:flex-start;-ms-flex-align:start;align-items:flex-start}.iptv-menu__search{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;padding:.5em;margin-top:.6em;margin-right:.6em}.iptv-menu__search>svg{width:1.5em !important;height:1.5em !important}.iptv-menu__search.focus{-webkit-border-radius:100%;border-radius:100%;background-color:#fff;color:#000}.iptv-menu__search-mobile{padding:.5em}.iptv-menu__search-mobile>svg{width:1.5em !important;height:1.5em !important}.iptv-menu__title{font-size:2.4em;font-weight:300;padding-right:1em;margin-right:auto}.iptv-menu__list-item{font-size:1.4em;font-weight:300;position:relative;padding:.5em .8em;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;opacity:.6}.iptv-menu__list-item>div{word-break:break-all}.iptv-menu__list-item-icon{margin-right:.5em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.iptv-menu__list-item-icon>svg{width:1em !important;height:1em !important}.iptv-menu__list-item>span{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;padding-left:1em;margin-left:auto}.iptv-menu__list-item.active{color:#fff;background-color:rgba(255,255,255,0.1);-webkit-border-radius:.8em;border-radius:.8em;opacity:1}.iptv-menu__list-item.focus{color:#000;background-color:#fff;-webkit-border-radius:.8em;border-radius:.8em;opacity:1}.iptv-menu__list>div+div{margin-top:.3em}.iptv-channels{padding:1em;padding-left:5em}.iptv-channel{background-color:#464646;-webkit-border-radius:1em;border-radius:1em;padding-bottom:72%;position:relative}.iptv-channel__body{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;padding:1em;text-align:center}.iptv-channel__ico{width:80%;opacity:0;max-height:100%}.iptv-channel__icons{position:absolute;top:.6em;right:.6em;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}.iptv-channel__icons>svg{width:1.2em !important;height:1.2em !important;margin-left:.5em}.iptv-channel__name{text-align:center;font-size:1.2em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical;max-height:1.4em}.iptv-channel__simb{font-size:4em;font-weight:900;line-height:.7;margin-bottom:.4em}.iptv-channel__chn{position:absolute;top:50%;right:100%;margin-right:.5em;font-size:1.9em;font-weight:600;margin-top:-0.7em;opacity:.5}.iptv-channel.loaded .iptv-channel__ico{opacity:1}.iptv-channel.full--icon .iptv-channel__body{padding:0;overflow:hidden;-webkit-border-radius:1em;border-radius:1em}.iptv-channel.full--icon .iptv-channel__ico{max-width:105%;width:105%;height:105%}.iptv-channel.small--icon .iptv-channel__ico{width:6em;-webkit-border-radius:.7em;border-radius:.7em}.iptv-channel.favorite::after{content:'';position:absolute;top:.3em;right:.2em;background-image:url(./img/icons/menu/like.svg);background-repeat:no-repeat;background-position:50% 50%;-webkit-background-size:55% 55%;background-size:55%;-webkit-border-radius:100%;border-radius:100%;width:1.8em;height:1.8em;margin-left:-0.9em}.iptv-channel.focus::before,.iptv-channel.active::before{content:'';position:absolute;top:-0.5em;left:-0.5em;right:-0.5em;bottom:-0.5em;border:.3em solid #fff;-webkit-border-radius:1.4em;border-radius:1.4em;opacity:.4}.iptv-channel.focus::before{opacity:1}.iptv-channel+.iptv-channel{margin-top:1em}.iptv-channel--main{width:12.75em;padding-bottom:0;height:9em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.iptv-channel--main+.iptv-channel{margin-top:0;margin-left:1em}.iptv-details{padding-top:3.5em;-webkit-mask-image:-webkit-gradient(linear,left top,left bottom,from(white),color-stop(92%,white),to(rgba(255,255,255,0)));-webkit-mask-image:-webkit-linear-gradient(top,white 0,white 92%,rgba(255,255,255,0) 100%);mask-image:-webkit-gradient(linear,left top,left bottom,from(white),color-stop(92%,white),to(rgba(255,255,255,0)));mask-image:linear-gradient(to bottom,white 0,white 92%,rgba(255,255,255,0) 100%)}.iptv-details__play{font-size:1.3em;margin-bottom:.5em}.iptv-details__play .lb{background:rgba(255,255,255,0.3);-webkit-border-radius:.2em;border-radius:.2em;padding:0 .4em;margin-right:.7em}.iptv-details__play span:last-child{opacity:.5}.iptv-details__title{font-size:3.3em;font-weight:700}.iptv-details__program{padding-top:3em}.iptv-details__list>div+div{margin-top:1.6em}.iptv-details-epmty>div{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}.iptv-details-epmty>div span{background-color:rgba(255,255,255,0.18);-webkit-border-radius:.2em;border-radius:.2em;height:1em}.iptv-details-epmty>div span:first-child{width:8%;margin-right:3.2em}.iptv-details-epmty>div+div{margin-top:2em}.iptv-program{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;font-size:1.2em;font-weight:300;position:relative}.iptv-program-date{font-size:1.2em;padding-left:4.9em;margin-bottom:1em;opacity:.5}.iptv-program__head{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center}.iptv-program__head-body{-webkit-box-flex:1;-webkit-flex-grow:1;-ms-flex-positive:1;flex-grow:1;padding-left:1em}.iptv-program__title{overflow:hidden;-o-text-overflow:'.';text-overflow:'.';display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical}.iptv-program__icon-wrap{width:35%;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;-webkit-border-radius:1em;border-radius:1em;background-color:#464646;position:relative;padding-bottom:25%}.iptv-program__icon-wrap.loaded .iptv-program__icon-img{opacity:1}.iptv-program__icon-img{width:100%;height:100%;position:absolute;top:0;left:0;opacity:0;-webkit-transition:opacity .1s;-o-transition:opacity .1s;transition:opacity .1s;-webkit-border-radius:1em;border-radius:1em}.iptv-program__time{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;width:5em;position:relative}.iptv-program__descr{opacity:.5;margin-top:.7em}.iptv-program__timeline{-webkit-border-radius:1em;border-radius:1em;background:rgba(255,255,255,0.1);margin-top:.9em}.iptv-program__timeline>div{height:.1em;-webkit-border-radius:1em;border-radius:1em;background:#fff;min-height:2px}.iptv-program__body{-webkit-box-flex:1;-webkit-flex-grow:1;-ms-flex-positive:1;flex-grow:1}.iptv-program.archive::after{content:'';position:absolute;top:.2em;left:3.1em;width:1em;height:1em;background:url('./img/icons/menu/time.svg') no-repeat 50% 50%;-webkit-background-size:contain;background-size:contain}.iptv-program.played::after{content:'';position:absolute;top:.2em;left:3.1em;width:1em;height:1em;background:url('./img/icons/player/play.svg') no-repeat 50% 50%;-webkit-background-size:contain;background-size:contain}.iptv-program.focus .iptv-program__time::after{content:'';position:absolute;top:0;width:2.4em;left:0;background-color:rgba(255,255,255,0.2);height:1.4em;-webkit-border-radius:.2em;border-radius:.2em}.iptv-hud{position:absolute;top:0;left:0;width:100%;height:100%;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;line-height:1.3}.iptv-hud__content{width:100%;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;padding-left:1.5em;padding-right:1.5em;padding-top:7em;padding-bottom:14em}.iptv-hud__menu,.iptv-hud__program{background-color:rgba(0,0,0,0.6);-webkit-border-radius:.5em;border-radius:.5em;padding:1em;overflow:hidden;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}.iptv-hud__menu>div,.iptv-hud__program>div{width:100%;overflow:hidden}.iptv-hud__menu{width:22%;margin-right:1.5em}.iptv-hud__program{width:40%}.iptv-hud-menu-info{margin-bottom:1em}.iptv-hud-menu-info__group{opacity:.5}.iptv-hud-menu-info__name{line-height:1.6;font-size:1.8em}.iptv-hud-menu-button{padding:1em;-webkit-border-radius:.3em;border-radius:.3em;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;background-color:rgba(255,255,255,0.06)}.iptv-hud-menu-button__icon{margin-right:1em}.iptv-hud-menu-button__icon>svg{width:1.6em !important;height:1.6em !important}.iptv-hud-menu-button__icon .active-layer{opacity:0}.iptv-hud-menu-button__text{font-size:1.3em}.iptv-hud-menu-button.focus{background-color:#fff;color:#000}.iptv-hud-menu-button.active .active-layer{opacity:1}.iptv-hud-menu-button+.iptv-hud-menu-button{margin-top:.5em}.iptv-list-empty{border:.2em dashed rgba(255,255,255,0.5);display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;height:12em;-webkit-border-radius:1em;border-radius:1em}.iptv-link{display:inline-block;padding:.1em .5em;-webkit-border-radius:.2em;border-radius:.2em;background-color:rgba(255,255,255,0.1)}.iptv-param-lock{position:absolute;top:50%;right:1.5em;margin-top:-1em;opacity:.5}.iptv-param-lock>svg{width:2em;height:2em}body.platform--orsay .iptv-menu__list-item{padding-right:2.7em}body.platform--orsay .iptv-menu__list-item>span{position:absolute;top:.5em;right:1em}body.light--version .iptv-content{font-size:.9em}body.light--version .iptv-channel{-webkit-border-radius:.3em;border-radius:.3em}body.light--version .iptv-channel::before{-webkit-border-radius:.6em;border-radius:.6em}.iptv-mobile .iptv-content{display:block;padding:0}.iptv-mobile .iptv-content__menu,.iptv-mobile .iptv-content__channels,.iptv-mobile .iptv-content__details{width:100%;padding:0}.iptv-mobile .iptv-menu__list{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center}.iptv-mobile .iptv-menu__list>div+div{margin:0;margin-left:.5em}.iptv-mobile .iptv-menu__list-item{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.iptv-mobile .iptv-menu__head{display:none}.iptv-mobile .iptv-channels{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;padding:0}.iptv-mobile .iptv-channel{padding-bottom:0;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;width:14em;height:10em}@media screen and (max-width:400px){.iptv-mobile .iptv-channel{width:11em;height:8em}.iptv-mobile .iptv-channel .iptv-channel__simb{font-size:3.2em}}.iptv-mobile .iptv-channel__chn{display:none}.iptv-mobile .iptv-channel+.iptv-channel{margin:0;margin-left:1em}.iptv-mobile .iptv-content__details{padding:0 1.5em}.iptv-mobile .iptv-details{padding-top:0;height:48vh}@media screen and (max-width:500px){.iptv-mobile .iptv-details__title{font-size:2.5em}}body.platform--browser .iptv-hud__menu,body.platform--browser .iptv-hud__program,body.platform--nw .iptv-hud__menu,body.platform--nw .iptv-hud__program{background-color:rgba(0,0,0,0.3);-webkit-backdrop-filter:blur(1em);backdrop-filter:blur(1em)}body.glass--style-opacity--medium .iptv-hud__menu,body.glass--style-opacity--medium .iptv-hud__program{background-color:rgba(0,0,0,0.6)}body.glass--style-opacity--blacked .iptv-hud__menu,body.glass--style-opacity--blacked .iptv-hud__program{background-color:rgba(0,0,0,0.85)}\n        </style>\n    ");
  }
  var Templates = {
    init: init$2
  };

  function init$1() {
    Lampa.Params.trigger('iptv_guide_update_after_start', false);
    Lampa.Params.trigger('iptv_guide_custom', false);
    Lampa.Params.select('iptv_guide_url', '', '');
    Lampa.Params.select('iptv_guide_interval', {
      '0': '#{iptv_param_guide_update_custom}',
      '1': '1',
      '2': '2',
      '3': '3',
      '5': '5',
      '8': '8',
      '12': '12',
      '18': '18',
      '24': '24 / 1',
      '48': '48 / 2',
      '72': '72 / 3',
      '96': '96 / 4',
      '120': '120 / 5',
      '144': '144 / 6',
      '168': '168 / 7'
    }, '24');
    Lampa.Params.select('iptv_guide_save', {
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '14': '14'
    }, '3');
    Lampa.Settings.listener.follow('open', function (e) {
      if (e.name == 'iptv') {
        if (!Lampa.Account.hasPremium()) {
          var body = e.body.find('.scroll__body > div');
          var info = $("<div class=\"settings-param selector\" data-type=\"button\" data-static=\"true\">\n                    <div class=\"settings-param__name\">".concat(Lampa.Lang.translate('account_premium_more'), "</div>\n                    <div class=\"settings-param__descr\">").concat(Lampa.Lang.translate('iptv_premium'), "</div>\n                </div>"));
          info.on('hover:enter', Lampa.Account.showCubPremium);
          body.prepend('<div class="settings-param-title"><span>' + Lampa.Lang.translate('title_settings') + '</span></div>');
          body.prepend(info);
        }
      }
      if (e.name == 'iptv_guide') {
        var status = e.body.find('.update-guide-status');
        var parser = window.iptv_guide_update_process;
        var listen = function listen() {
          if (!parser) return;
          parser.follow('start', function () {
            status.find('.settings-param__name').text(Lampa.Lang.translate('iptv_guide_status_update'));
            status.find('.settings-param__value').text(Lampa.Lang.translate('iptv_guide_status_parsing') + ' 0%');
          });
          parser.follow('percent', function (data) {
            status.find('.settings-param__value').text(Lampa.Lang.translate('iptv_guide_status_parsing') + ' ' + data.percent.toFixed(2) + '%');
          });
          parser.follow('finish', function (data) {
            status.find('.settings-param__name').text(Lampa.Lang.translate('iptv_guide_status_finish'));
            status.find('.settings-param__value').text(Lampa.Lang.translate('iptv_guide_status_channels') + ' - ' + data.count + ', ' + Lampa.Lang.translate('iptv_guide_status_date') + ' - ' + Lampa.Utils.parseTime(data.time).briefly);
          });
          parser.follow('error', function (data) {
            status.find('.settings-param__name').text(Lampa.Lang.translate('title_error'));
            status.find('.settings-param__value').text(data.text);
          });
        };
        e.body.find('.update-guide-now').on('hover:enter', function () {
          if (window.iptv_guide_update_process) return Lampa.Noty.show(Lampa.Lang.translate('iptv_guide_status_update_wait'));
          Guide.update(status);
          parser = window.iptv_guide_update_process;
          listen();
        });
        var last_status = Lampa.Storage.get('iptv_guide_updated_status', '{}');
        if (last_status.type) {
          if (last_status.type == 'error') {
            status.find('.settings-param__name').text(Lampa.Lang.translate('title_error'));
            status.find('.settings-param__value').text(last_status.text);
          }
          if (last_status.type == 'finish') {
            status.find('.settings-param__value').text(Lampa.Lang.translate('iptv_guide_status_channels') + ' - ' + last_status.channels + ', ' + Lampa.Lang.translate('iptv_guide_status_date') + ' - ' + Lampa.Utils.parseTime(last_status.time).briefly);
          }
        }
        if (parser) listen();
      }
    });
    Lampa.SettingsApi.addComponent({
      component: 'iptv',
      icon: "<svg height=\"36\" viewBox=\"0 0 38 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"2\" y=\"8\" width=\"34\" height=\"21\" rx=\"3\" stroke=\"white\" stroke-width=\"3\"/>\n            <line x1=\"13.0925\" y1=\"2.34874\" x2=\"16.3487\" y2=\"6.90754\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n            <line x1=\"1.5\" y1=\"-1.5\" x2=\"9.31665\" y2=\"-1.5\" transform=\"matrix(-0.757816 0.652468 0.652468 0.757816 26.197 2)\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n            <line x1=\"9.5\" y1=\"34.5\" x2=\"29.5\" y2=\"34.5\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n        </svg>",
      name: 'IPTV'
    });
    if (Lampa.Manifest.app_digital >= 200) {
      Lampa.SettingsApi.addParam({
        component: 'iptv',
        param: {
          type: 'button'
        },
        field: {
          name: Lampa.Lang.translate('iptv_param_guide')
        },
        onChange: function onChange() {
          Lampa.Settings.create('iptv_guide', {
            onBack: function onBack() {
              Lampa.Settings.create('iptv');
            }
          });
        }
      });
    }
    Lampa.SettingsApi.addParam({
      component: 'iptv',
      param: {
        type: 'title'
      },
      field: {
        name: Lampa.Lang.translate('more')
      }
    });
    Lampa.SettingsApi.addParam({
      component: 'iptv',
      param: {
        name: 'iptv_view_in_main',
        type: 'trigger',
        "default": true
      },
      field: {
        name: Lampa.Lang.translate('iptv_param_view_in_main')
      }
    });
    Lampa.SettingsApi.addParam({
      component: 'iptv',
      param: {
        name: 'iptv_use_db',
        type: 'select',
        values: {
          indexdb: 'IndexedDB',
          storage: 'LocalStorage'
        },
        "default": 'indexdb'
      },
      field: {
        name: Lampa.Lang.translate('iptv_param_use_db')
      },
      onChange: function onChange() {
        Favorites.load().then(function () {
          document.querySelectorAll('.iptv-playlist-item').forEach(function (element) {
            Lampa.Utils.trigger(element, 'update');
          });
        });
      }
    });
    Lampa.SettingsApi.addParam({
      component: 'iptv',
      param: {
        name: 'iptv_favotite_save',
        type: 'select',
        values: {
          url: '#{iptv_param_save_favorite_url}',
          name: '#{iptv_param_save_favorite_name}'
        },
        "default": 'url'
      },
      field: {
        name: Lampa.Lang.translate('iptv_param_save_favorite')
      }
    });
    Lampa.SettingsApi.addParam({
      component: 'iptv',
      param: {
        name: 'iptv_favotite_sort',
        type: 'select',
        values: {
          add: '#{iptv_param_sort_add}',
          name: '#{iptv_param_sort_name}',
          view: '#{iptv_param_sort_view}'
        },
        "default": 'add'
      },
      field: {
        name: Lampa.Lang.translate('iptv_param_sort_favorite')
      },
      onRender: function onRender(item) {
        if (!Lampa.Account.hasPremium()) {
          item.removeClass('selector');
          item.append(Lampa.Template.get('cub_iptv_param_lock'));
        }
      },
      onChange: function onChange() {}
    });
  }
  var Settings = {
    init: init$1
  };

  function init() {
    var domain = Lampa.Manifest.cub_domain;
    Lampa.Lang.add({
      iptv_noprogram: {
        ru: 'Нет программы',
        en: 'No program',
        uk: 'Немає програми',
        be: 'Няма праграмы',
        zh: '没有节目',
        pt: 'Nenhum programa',
        bg: 'Няма програми'
      },
      iptv_noload_playlist: {
        ru: 'К сожалению, загрузка плейлиста не удалась. Возможно, ваш провайдер заблокировал загрузку из внешних источников.',
        en: 'Unfortunately, the playlist download failed. Your ISP may have blocked downloads from external sources.',
        uk: 'На жаль, завантаження плейлиста не вдалося. Можливо, ваш провайдер заблокував завантаження із зовнішніх джерел.',
        be: 'Нажаль, загрузка плэйліста не атрымалася. Магчыма, ваш правайдэр заблакаваў загрузку са знешніх крыніц.',
        zh: '不幸的是，播放列表下载失败。 您的 ISP 可能已阻止从外部来源下载。',
        pt: 'Infelizmente, o download da lista de reprodução falhou. Seu ISP pode ter bloqueado downloads de fontes externas.',
        bg: 'За съжаление, свалянето на плейлистата се провали. Вашият доставчик може да блокира сваляне от външни източници.'
      },
      iptv_select_playlist: {
        ru: 'Выберите плейлист',
        en: 'Choose a playlist',
        uk: 'Виберіть плейлист',
        be: 'Выберыце плэйліст',
        zh: '选择一个播放列表',
        pt: 'Escolha uma lista de reprodução',
        bg: 'Изберете плейлист'
      },
      iptv_all_channels: {
        ru: 'Все каналы',
        en: 'All channels',
        uk: 'Усі канали',
        be: 'Усе каналы',
        zh: '所有频道',
        pt: 'Todos os canais',
        bg: 'Всички канали'
      },
      iptv_add_fav: {
        ru: 'Добавить в избранное',
        en: 'Add to favorites',
        uk: 'Додати в обране',
        be: 'Дадаць у абранае',
        zh: '添加到收藏夹',
        pt: 'Adicionar aos favoritos',
        bg: 'Добави в избрани'
      },
      iptv_remove_fav: {
        ru: 'Убрать из избранного',
        en: 'Remove from favorites',
        uk: 'Прибрати з вибраного',
        be: 'Прыбраць з абранага',
        zh: '从收藏夹中删除',
        pt: 'Remover dos favoritos',
        bg: 'Премахни от избрани'
      },
      iptv_playlist_empty: {
        ru: 'К сожалению, на данный момент вы не добавили ни одного плейлиста. Чтобы начать просмотр контента, пожалуйста, перейдите на страницу <span class="iptv-link">' + domain + '/iptv</span> и добавьте хотя бы один плейлист.',
        en: 'Sorry, you haven\'t added any playlist yet. To start watching content, please go to <span class="iptv-link">' + domain + '/iptv</span> and add at least one playlist.',
        uk: 'На жаль, на даний момент ви не додали жодного плейлиста. Щоб розпочати перегляд контенту, будь ласка, перейдіть на сторінку <span class="iptv-link">' + domain + '/iptv</span> і додайте хоча б один плейлист.',
        be: 'Нажаль, на дадзены момант вы не дадалі ніводнага плэйліста. Каб пачаць прагляд кантэнту, калі ласка, перайдзіце на старонку <span class="iptv-link">' + domain + '/iptv</span> і дадайце хаця б адзін плэйліст.',
        zh: '抱歉，您还没有添加任何播放列表。 要开始观看内容，请转到 <span class="iptv-link">' + domain + '/iptv</span> 并添加至少一个播放列表。',
        pt: 'Desculpe, você ainda não adicionou nenhuma lista de reprodução. Para começar a assistir o conteúdo, acesse <span class="iptv-link">' + domain + '/iptv</span> e adicione pelo menos uma lista de reprodução.',
        bg: 'Съжалявам, още не сте добавили никаква листа. За да почнете да гледате, моля идете на <span class="iptv-link">' + domain + '/iptv</span> и добавете поне една листа.'
      },
      iptv_select_playlist_text: {
        ru: 'Для того чтобы добавить свой плейлист, вам необходимо перейти на сайт <span class="iptv-link">' + domain + '/iptv</span> и добавить плейлист от вашего провайдера.',
        en: 'In order to add your playlist, you need to go to <span class="iptv-link">' + domain + '/iptv</span> and add a playlist from your provider.',
        uk: 'Щоб додати свій плейлист, вам необхідно перейти на сайт <span class="iptv-link">' + domain + '/iptv</span> і додати плейлист від вашого провайдера.',
        be: 'Для таго каб дадаць свой плэйліст, вам неабходна перайсці на сайт <span class="iptv-link">' + domain + '/iptv</span> і дадаць плэйліст ад вашага правайдэра.',
        zh: '要添加您的播放列表，您需要前往 <span class="iptv-link">' + domain + '/iptv</span> 并添加来自您的提供商的播放列表。',
        pt: 'Para adicionar sua lista de reprodução, você precisa acessar <span class="iptv-link">' + domain + '/iptv</span> e adicionar uma lista de reprodução do seu provedor.',
        bg: 'За да добавите ваша листа, трябва да отидете на <span class="iptv-link">' + domain + '/iptv</span> и да добавите листа от вашият доставчик на телевизия.'
      },
      iptv_updated: {
        ru: 'Обновлено',
        en: 'Updated',
        uk: 'Оновлено',
        be: 'Абноўлена',
        zh: '更新',
        pt: 'Atualizada',
        bg: 'Обновено'
      },
      iptv_update: {
        ru: 'Обновление',
        en: 'Update',
        uk: 'Оновлення',
        be: 'Абнаўленне',
        zh: '更新',
        pt: 'Atualizar',
        bg: 'Обновяване'
      },
      iptv_active: {
        ru: 'Активно',
        en: 'Actively',
        uk: 'Активно',
        be: 'Актыўна',
        zh: '积极地',
        pt: 'Ativamente',
        bg: 'Активно'
      },
      iptv_yesterday: {
        ru: 'Вчера',
        en: 'Yesterday',
        uk: 'Вчора',
        be: 'Учора',
        zh: '昨天',
        pt: 'Ontem',
        bg: 'Вчера'
      },
      iptv_today: {
        ru: 'Сегодня',
        en: 'Today',
        uk: 'Сьогодні',
        be: 'Сёння',
        zh: '今天',
        pt: 'Hoje',
        bg: 'Днес'
      },
      iptv_tomorrow: {
        ru: 'Завтра',
        en: 'Tomorrow',
        uk: 'Завтра',
        be: 'Заўтра',
        zh: '明天',
        pt: 'Amanhã',
        bg: 'Утре'
      },
      iptv_loading: {
        ru: 'Метод загрузки',
        en: 'Download method',
        uk: 'Метод завантаження',
        be: 'Метад загрузкі',
        zh: '下载方式',
        pt: 'Método de download',
        bg: 'Метод на зареждане'
      },
      iptv_params_cub: {
        ru: 'CUB',
        en: 'CUB',
        uk: 'CUB',
        be: 'CUB',
        zh: 'CUB',
        pt: 'CUB',
        bg: 'CUB'
      },
      iptv_params_lampa: {
        ru: 'Lampa',
        en: 'Lampa',
        uk: 'Lampa',
        be: 'Lampa',
        zh: 'Lampa',
        pt: 'Lampa',
        bg: 'Lampa'
      },
      iptv_remove_cache: {
        ru: 'Удалить кеш',
        en: 'Delete cache',
        uk: 'Видалити кеш',
        be: 'Выдаліць кэш',
        zh: '删除缓存',
        pt: 'Excluir cache',
        bg: 'Изтриване на кеш'
      },
      iptv_remove_cache_descr: {
        ru: 'Удалить плейлист из кеша',
        en: 'Delete playlist from cache',
        uk: 'Видалити плейлист з кешу',
        be: 'Выдаліць плэйліст з кэшу',
        zh: '从缓存中删除播放列表',
        pt: 'Excluir lista de reprodução do cache',
        bg: 'Изтрий плейлиста от кеша'
      },
      iptv_params_always: {
        ru: 'Всегда',
        en: 'Always',
        uk: 'Завжди',
        be: 'Заўсёды',
        zh: '总是',
        pt: 'Sempre',
        bg: 'Винаги'
      },
      iptv_params_hour: {
        ru: 'Каждый час',
        en: 'Each hour',
        uk: 'Кожну годину',
        be: 'Кожную гадзіну',
        zh: '每小时',
        pt: 'Cada hora',
        bg: 'Всеки час'
      },
      iptv_params_hour12: {
        ru: 'Каждые 12 часов',
        en: 'Every 12 hours',
        uk: 'Кожні 12 годин',
        be: 'Кожныя 12 гадзін',
        zh: '每12小时',
        pt: 'A cada 12 horas',
        bg: 'Всеки 12 часа'
      },
      iptv_params_day: {
        ru: 'Ежедневно',
        en: 'Daily',
        uk: 'Щодня',
        be: 'Штодня',
        zh: '日常的',
        pt: 'Diário',
        bg: 'Ежедневно'
      },
      iptv_params_week: {
        ru: 'Еженедельно',
        en: 'Weekly',
        uk: 'Щотижня',
        be: 'Штотыдзень',
        zh: '每周',
        pt: 'Semanalmente',
        bg: 'Седмично'
      },
      iptv_params_none: {
        ru: 'Никогда',
        en: 'Never',
        uk: 'Ніколи',
        be: 'Ніколі',
        zh: '绝不',
        pt: 'Nunca',
        bg: 'Никога'
      },
      iptv_update_app_title: {
        ru: 'Обновите приложение',
        en: 'Update the app',
        uk: 'Оновлення програми',
        be: 'Абнавіце дадатак',
        zh: '更新应用程序',
        pt: 'Atualize o aplicativo',
        bg: 'Обновни приложение'
      },
      iptv_update_app_text: {
        ru: 'К сожалению, для работы плагина необходимо обновить вашу лампу путем ее перезагрузки. Она устарела и без этой процедуры плагин не будет функционировать.',
        en: 'Unfortunately, for the plugin to work, you need to update your lamp by rebooting it. It is outdated and without this procedure the plugin will not function.',
        uk: 'На жаль, для роботи плагіна необхідно оновити лампу шляхом її перезавантаження. Вона застаріла і без цієї процедури плагін не функціонуватиме.',
        be: 'Нажаль, для працы плагіна неабходна абнавіць вашу лямпу шляхам яе перазагрузкі. Яна састарэлая і без гэтай працэдуры плягін не будзе функцыянаваць.',
        zh: '不幸的是，要使插件正常工作，您需要通过重新启动来更新灯泡。 它已过时，如果没有此程序，插件将无法运行。',
        pt: 'Infelizmente, para que o plug-in funcione, você precisa atualizar sua lâmpada reiniciando-a. Está desatualizado e sem este procedimento o plugin não funcionará.',
        bg: 'За съжаление, за да работи добавка, трябва да обновите вашата Lampa и да я рестартирате. Приложението не е актуално и без тази процедура добавката не може да работи'
      },
      iptv_param_sort_add: {
        ru: 'По добавлению',
        en: 'By addition',
        uk: 'За додаванням',
        be: 'Па даданні',
        zh: '按添加时间',
        pt: 'Por adição',
        bg: 'По добавяне'
      },
      iptv_param_sort_name: {
        ru: 'По названию',
        en: 'By name',
        uk: 'За назвою',
        be: 'Па назве',
        zh: '按名称',
        pt: 'Por nome',
        bg: 'По име'
      },
      iptv_param_sort_view: {
        ru: 'По просмотрам',
        en: 'By views',
        uk: 'За переглядами',
        be: 'Па праглядах',
        zh: '按观看次数',
        pt: 'Por visualizações',
        bg: 'По прегледи'
      },
      iptv_param_sort_favorite: {
        ru: 'Сортировать избранное',
        en: 'Sort by favorite',
        uk: 'Сортувати в обраному',
        be: 'Сартаваць па выбраным',
        zh: '按收藏排序',
        pt: 'Classificar por favoritos',
        bg: 'Сортиране по избрани'
      },
      iptv_premium: {
        ru: 'Доступ к некоторым функциям возможен только при наличии подписки <b>CUB Premium</b>',
        en: 'Some features are only available with a <b>CUB Premium</b> subscription',
        uk: 'Доступ до деяких функцій можливий лише за наявності передплати <b>CUB Premium</b>',
        be: 'Доступ да некаторых функцый магчымы толькі пры наяўнасці падпіскі <b>CUB Premium</b>',
        zh: '某些功能仅适用于 <b>CUB Premium</b> 订阅',
        pt: 'Alguns recursos estão disponíveis apenas com uma assinatura <b>CUB Premium</b>',
        bg: 'Достъпът до някои функции е наличен само чрез <b>CUB Premium</b> абонамент'
      },
      iptv_param_save_favorite: {
        ru: 'Метод хранения избранного',
        en: 'Favorite storage method',
        uk: 'Спосіб зберігання обраного',
        be: 'Метад захоўвання абранага',
        zh: '收藏存储方法',
        pt: 'Método de armazenamento favorito',
        bg: 'Начин на сърханение на фаворити'
      },
      iptv_param_save_favorite_url: {
        ru: 'По адресу канала',
        en: 'By channel URL',
        uk: 'За URL-адресою каналу',
        be: 'Па URL-адрэсе канала',
        zh: '按频道网址',
        pt: 'Por URL do canal',
        bg: 'По URL на канала'
      },
      iptv_param_save_favorite_name: {
        ru: 'По названию канала',
        en: 'By channel name',
        uk: 'За назвою каналу',
        be: 'Па назве канала',
        zh: '按频道名称',
        pt: 'Por nome do canal',
        bg: 'По име на канала'
      },
      iptv_param_use_db: {
        ru: 'Использовать базу данных',
        en: 'Use database',
        uk: 'Використовувати базу даних',
        be: 'Выкарыстоўваць базу дадзеных',
        zh: '使用数据库',
        pt: 'Utilizar banco de dados',
        bg: 'Използвайки база данни'
      },
      iptv_param_guide: {
        ru: 'Телегид',
        en: 'TV Guide',
        uk: 'Телегід',
        be: 'Тэлегід',
        zh: '电视指南',
        pt: 'Guia de TV',
        bg: 'Телевизионен справочник'
      },
      iptv_search_no_result: {
        ru: 'Нет результатов по запросу',
        en: 'No results found',
        uk: 'Немає результатів за запитом',
        be: 'Няма вынікаў па запыце',
        zh: '未找到结果',
        pt: 'Nenhum resultado encontrado',
        bg: 'Няма намерени резултати'
      },
      iptv_guide_status_update_wait: {
        ru: 'Идет процесс обновления, подождите...',
        en: 'Updating process in progress, please wait...',
        uk: 'Йде процес оновлення, зачекайте...',
        be: 'Ідзе працэс абнаўлення, калі ласка, пачакайце...',
        zh: '更新过程正在进行，请稍等...',
        pt: 'Processo de atualização em andamento, aguarde...',
        bg: 'Процесът на актуализация е в ход, моля изчакайте...'
      },
      iptv_guide_status_update: {
        ru: 'Идет обновление',
        en: 'Update in progress',
        uk: 'Йде оновлення',
        be: 'Ідзе абнаўленне',
        zh: '更新进行中',
        pt: 'Atualização em andamento',
        bg: 'Актуализация в ход'
      },
      iptv_guide_status_parsing: {
        ru: 'Парсинг',
        en: 'Parsing',
        uk: 'Аналіз',
        be: 'Аналіз',
        zh: '解析中',
        pt: 'Analisando',
        bg: 'Анализ'
      },
      iptv_guide_status_finish: {
        ru: 'Статус последнего обновления',
        en: 'Status of the last update',
        uk: 'Статус останнього оновлення',
        be: 'Статус апошняга абнаўлення',
        zh: '最后更新状态',
        pt: 'Estado da última atualização',
        bg: 'Състояние на последното обновление'
      },
      iptv_guide_status_channels: {
        ru: 'Каналов',
        en: 'Channels',
        uk: 'Каналів',
        be: 'Каналаў',
        zh: '频道',
        pt: 'Canais',
        bg: 'Канали'
      },
      iptv_guide_status_date: {
        ru: 'обновлено',
        en: 'updated',
        uk: 'оновлено',
        be: 'абноўлена',
        zh: '已更新',
        pt: 'atualizado',
        bg: 'обновено'
      },
      iptv_guide_status_noupdates: {
        ru: 'Еще нет обновлений',
        en: 'No updates yet',
        uk: 'Ще немає оновлень',
        be: 'Яшчэ няма абнаўленняў',
        zh: '暂无更新',
        pt: 'Ainda sem atualizações',
        bg: 'Все още няма актуализации'
      },
      iptv_guide_error_link: {
        ru: 'Укажите ссылку на телегид',
        en: 'Specify the TV guide link',
        uk: 'Вкажіть посилання на телегід',
        be: 'Пакажыце спасылку на тэлегід',
        zh: '请指定电视指南链接',
        pt: 'Indique o link do guia de TV',
        bg: 'Посочете връзката към телегида'
      },
      iptv_param_guide_custom_title: {
        ru: 'Использовать свою ссылку',
        en: 'Use your own link',
        uk: 'Використовуйте своє посилання',
        be: 'Выкарыстоўвайце сваю спасылку',
        zh: '使用您自己的链接',
        pt: 'Use seu próprio link',
        bg: 'Използвайте своята връзка'
      },
      iptv_param_guide_custom_descr: {
        ru: 'Укажите свою ссылку на телегид, если не хотите использовать телегид от CUB',
        en: 'Specify your TV guide link if you do not want to use the CUB TV guide',
        uk: 'Вкажіть своє посилання на телегід, якщо ви не хочете використовувати телегід від CUB',
        be: 'Пакажыце сваю спасылку на тэлегід, калі вы не хочаце выкарыстоўваць тэлегід ад CUB',
        zh: '如果您不想使用CUB电视指南，请指定您的电视指南链接',
        pt: 'Especifique seu link do guia de TV se não quiser usar o guia de TV da CUB',
        bg: 'Уточнете своята връзка към телегида, ако не искате да използвате този на CUB'
      },
      iptv_param_guide_url_descr: {
        ru: 'Укажите свою ссылку на телегид EPG',
        en: 'Specify your EPG TV guide link',
        uk: 'Вкажіть своє посилання на телегід EPG',
        be: 'Пакажыце сваю спасылку на тэлегід EPG',
        zh: '请指定您的电视指南EPG链接',
        pt: 'Especifique seu link do guia de TV EPG',
        bg: 'Уточнете своята връзка към телегида EPG'
      },
      iptv_param_guide_interval_title: {
        ru: 'Интервал обновления',
        en: 'Update Interval',
        uk: 'Інтервал оновлення',
        be: 'Інтэрвал абнаўлення',
        zh: '更新间隔',
        pt: 'Intervalo de atualização',
        bg: 'Интервал за актуализация'
      },
      iptv_param_guide_interval_descr: {
        ru: 'Через сколько часов обновлять телегид',
        en: 'How many hours to update the TV guide',
        uk: 'Через скільки годин оновлювати телегід',
        be: 'Праз колькі гадзін абнаўляць тэлегід',
        zh: '多少小时更新电视指南',
        pt: 'Quantas horas para atualizar o guia de TV',
        bg: 'През колко часа да актуализира телевизионния справочник'
      },
      iptv_param_guide_update_after_start: {
        ru: 'Обновить при запуске приложения',
        en: 'Update on application startup',
        uk: 'Оновити при запуску додатка',
        be: 'Абнавіць пры запуску прыкладання',
        zh: '启动应用时更新',
        pt: 'Atualizar ao iniciar o aplicativo',
        bg: 'Актуализация при стартиране на приложението'
      },
      iptv_param_guide_update_now: {
        ru: 'Обновить телегид',
        en: 'Update TV Guide Now',
        uk: 'Оновити телегід зараз',
        be: 'Абнавіць тэлегід зараз',
        zh: '立即更新电视指南',
        pt: 'Atualizar guia de TV agora',
        bg: 'Актуализирайте телевизионния справочник сега'
      },
      iptv_param_guide_save_title: {
        ru: 'Число дней хранения',
        en: 'Number of Days to Keep',
        uk: 'Кількість днів зберігання',
        be: 'Колькасць дзён захоўвання',
        zh: '保存天数',
        pt: 'Número de dias para manter',
        bg: 'Брой дни за запазване'
      },
      iptv_param_guide_save_descr: {
        ru: 'Сколько дней хранить телегид в кэше',
        en: 'How many days to keep the TV guide in the cache',
        uk: 'Скільки днів зберігати телегід у кеші',
        be: 'Колькі дзён захоўваць тэлегід у кэшы',
        zh: '在缓存中保存多少天的电视指南',
        pt: 'Quantos dias manter o guia de TV no cache',
        bg: 'За колко дни да се запази телевизионния справочник в кеша'
      },
      iptv_param_guide_update_custom: {
        ru: 'Вручную',
        en: 'Manual',
        uk: 'Вручну',
        be: 'Адзіначку',
        zh: '手动',
        pt: 'Manual',
        bg: 'Ръчно'
      },
      iptv_need_update_app: {
        ru: 'Обновите приложение до последней версии',
        en: 'Update the application to the latest version',
        uk: 'Оновіть програму до останньої версії',
        be: 'Абновіце прыкладанне да апошняй версіі',
        zh: '升级应用程序到最新版本',
        pt: 'Atualize o aplicativo para a versão mais recente',
        bg: 'Актуализирайте приложението до последната версия'
      },
      iptv_channel_lock: {
        ru: 'Заблокировать',
        en: 'Lock',
        uk: 'Заблокувати',
        be: 'Заблакаваць',
        zh: '锁定',
        pt: 'Bloquear',
        bg: 'Заключване'
      },
      iptv_channel_unlock: {
        ru: 'Разблокировать',
        en: 'Unlock',
        uk: 'Розблокувати',
        be: 'Разблакаваць',
        zh: '解锁',
        pt: 'Desbloquear',
        bg: 'Отключване'
      },
      iptv_about_text: {
        ru: 'Удобное приложение IPTV – откройте доступ к множеству каналов, фильмам и сериалам прямо на вашем телевизоре. Интуитивный интерфейс, легкая навигация, и безграничные возможности развлечений на вашем большом экране. Ваш личный портал в мир цифрового телевидения!',
        en: 'Convenient IPTV application - access a variety of channels, movies, and series directly on your television. Intuitive interface, easy navigation, and unlimited entertainment possibilities on your big screen. Your personal portal to the world of digital television!',
        uk: 'Зручний додаток IPTV - отримайте доступ до безлічі каналів, фільмів і серіалів прямо на вашому телевізорі. Інтуїтивний інтерфейс, легка навігація та необмежені можливості розваг на вашому великому екрані. Ваш особистий портал у світ цифрового телебачення!',
        be: 'Зручнае прыкладанне IPTV - атрымайце доступ да шматліканальнага тэлебачання, фільмаў і серыялаў проста на вашым тэлевізары. Інтуітыўны інтэрфейс, лёгкая навігацыя і неабмежаваныя магчымасці разваг на вашым вялікім экране. Ваш асабісты партал у свет цыфравага тэлебачання!',
        zh: '方便的IPTV应用程序-直接在您的电视上访问各种频道，电影和系列。直观的界面，简单的导航以及在您的大屏幕上无限的娱乐可能性。您数字电视世界的个人门户！',
        pt: 'Aplicativo IPTV conveniente - acesse uma variedade de canais, filmes e séries diretamente na sua televisão. Interface intuitiva, navegação fácil e possibilidades de entretenimento ilimitadas na sua tela grande. Seu portal pessoal para o mundo da televisão digital!',
        bg: 'Удобно приложение за IPTV - отворете достъп до множество канали, филми и сериали директно на вашия телевизор. Интуитивен интерфейс, лесна навигация и неограничени възможности за забавления на големия ви екран. Вашият личен портал към света на цифровата телевизия!'
      },
      iptv_confirm_delete_playlist: {
        ru: 'Вы точно хотите удалить плейлист?',
        en: 'Are you sure you want to delete the playlist?',
        uk: 'Ви точно хочете видалити плейлист?',
        be: 'Вы ўпэўненыя, што хочаце выдаліць плейліст?',
        zh: '您确定要删除播放列表吗？',
        pt: 'Tem certeza de que deseja excluir a lista de reprodução?',
        bg: 'Сигурни ли сте, че искате да изтриете списъка с канали?'
      },
      iptv_cache_clear: {
        ru: 'Кеш удален',
        en: 'Cache cleared',
        uk: 'Кеш видалено',
        be: 'Кеш выдалены',
        zh: '缓存已清除',
        pt: 'Cache limpo',
        bg: 'Кешът е изчистен'
      },
      iptv_playlist_deleted: {
        ru: 'Плейлист удален',
        en: 'Playlist deleted',
        uk: 'Плейлист видалено',
        be: 'Плейліст выдалены',
        zh: '播放列表已删除',
        pt: 'Lista de reprodução excluída',
        bg: 'Плейлистът е изтрит'
      },
      iptv_playlist_add_set_url: {
        ru: 'Укажите URL плейлиста',
        en: 'Enter the playlist URL',
        uk: 'Вкажіть URL плейлиста',
        be: 'Укажыце URL плейліста',
        zh: '请输入播放列表的 URL',
        pt: 'Insira o URL da lista de reprodução',
        bg: 'Въведете URL адреса на плейлиста'
      },
      iptv_playlist_add_new: {
        ru: 'Добавить новый плейлист',
        en: 'Add new playlist',
        uk: 'Додати новий плейлист',
        be: 'Дадаць новы плейліст',
        zh: '添加新播放列表',
        pt: 'Adicionar nova lista de reprodução',
        bg: 'Добавяне на нов списък с канали'
      },
      iptv_playlist_url_changed: {
        ru: 'Ссылка изменена',
        en: 'Link changed',
        uk: 'Посилання змінено',
        be: 'Спасылка зменена',
        zh: '链接已更改',
        pt: 'Link alterado',
        bg: 'Връзката е променена'
      },
      iptv_playlist_add_set_name: {
        ru: 'Укажите название плейлиста',
        en: 'Enter the playlist name',
        uk: 'Вкажіть назву плейлиста',
        be: 'Укажыце назву плейліста',
        zh: '请输入播放列表名称',
        pt: 'Insira o nome da lista de reprodução',
        bg: 'Въведете име на плейлиста'
      },
      iptv_playlist_name_changed: {
        ru: 'Название изменено',
        en: 'Name changed',
        uk: 'Назва змінена',
        be: 'Назва зменена',
        zh: '名称已更改',
        pt: 'Nome alterado',
        bg: 'Името е променено'
      },
      iptv_playlist_change_name: {
        ru: 'Изменить название',
        en: 'Change name',
        uk: 'Змінити назву',
        be: 'Змяніць назву',
        zh: '更改名称',
        pt: 'Alterar nome',
        bg: 'Промяна на името'
      },
      iptv_param_view_in_main: {
        ru: 'Показывать каналы на главной',
        en: 'Show channels on main page',
        uk: 'Показувати канали на головній',
        be: 'Паказваць каналы на галоўнай',
        zh: '在主页上显示频道',
        pt: 'Mostrar canais na página principal',
        bg: 'Показване на канали на главната страница'
      }
    });
  }
  var Lang = {
    init: init
  };

  var Channel = /*#__PURE__*/function () {
    function Channel(data, playlist) {
      _classCallCheck(this, Channel);
      this.data = data;
      this.playlist = playlist;
    }

    /**
     * Загрузить шаблон
     */
    return _createClass(Channel, [{
      key: "build",
      value: function build() {
        this.card = Lampa.Template.js('cub_iptv_channel_main_board');
        this.icon = this.card.querySelector('.iptv-channel__ico') || {};
        this.card.addEventListener('visible', this.visible.bind(this));
      }

      /**
       * Загрузить картинку
       */
    }, {
      key: "image",
      value: function image() {
        var _this = this;
        this.icon.onload = function () {
          _this.card.classList.add('loaded');
          if (_this.data.logo.indexOf('epg.it999') == -1) {
            _this.card.addClass('small--icon');
          }
        };
        this.icon.onerror = function () {
          var simb = document.createElement('div');
          simb.addClass('iptv-channel__simb');
          simb.text(_this.data.name.length <= 3 ? _this.data.name.toUpperCase() : _this.data.name.replace(/[^a-z|а-я|0-9]/gi, '').toUpperCase()[0]);
          var text = document.createElement('div');
          text.addClass('iptv-channel__name');
          text.text(Utils.clear(_this.data.name));
          _this.card.querySelector('.iptv-channel__body').append(simb);
          _this.card.querySelector('.iptv-channel__body').append(text);
        };
      }

      /**
       * Создать
       */
    }, {
      key: "create",
      value: function create() {
        var _this2 = this;
        this.build();
        this.card.addEventListener('hover:focus', function () {
          if (_this2.onFocus) _this2.onFocus(_this2.card, _this2.data);
        });
        this.card.addEventListener('hover:hover', function () {
          if (_this2.onHover) _this2.onHover(_this2.card, _this2.data);
        });
        this.card.addEventListener('hover:enter', function () {
          var play = {
            title: _this2.data.name || '',
            url: _this2.data.url,
            tv: true
          };
          Lampa.Player.runas(Lampa.Storage.field('player_iptv'));
          Lampa.Player.play(play);
          Lampa.Player.playlist(_this2.playlist.map(function (a) {
            return {
              title: a.name,
              url: a.url,
              tv: true
            };
          }));
        });
        this.image();
      }

      /**
       * Загружать картинку если видна карточка
       */
    }, {
      key: "visible",
      value: function visible() {
        if (this.data.logo) this.icon.src = this.data.logo;else this.icon.onerror();
        if (this.onVisible) this.onVisible(this.card, this.data);
      }

      /**
       * Уничтожить
       */
    }, {
      key: "destroy",
      value: function destroy() {
        this.icon.onerror = function () {};
        this.icon.onload = function () {};
        this.icon.src = '';
        this.card.remove();
        this.card = null;
        this.icon = null;
      }

      /**
       * Рендер
       * @returns {object}
       */
    }, {
      key: "render",
      value: function render(js) {
        return js ? this.card : $(this.card);
      }
    }]);
  }();

  function startPlugin() {
    window.plugin_iptv_ready = true;
    var manifest = {
      type: 'video',
      version: '1.2.8',
      name: 'IPTV',
      description: '',
      component: 'iptv',
      onMain: function onMain(data) {
        if (!Lampa.Storage.field('iptv_view_in_main')) return {
          results: []
        };
        var playlist = Lampa.Arrays.clone(Lampa.Storage.get('iptv_play_history_main_board', '[]')).reverse();
        return {
          results: playlist,
          title: Lampa.Lang.translate('title_continue'),
          nomore: true,
          line_type: 'iptv',
          cardClass: function cardClass(item) {
            return new Channel(item, playlist);
          }
        };
      }
    };
    Lampa.Manifest.plugins = manifest;
    function add() {
      var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg height=\"36\" viewBox=\"0 0 38 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect x=\"2\" y=\"8\" width=\"34\" height=\"21\" rx=\"3\" stroke=\"currentColor\" stroke-width=\"3\"/>\n                    <line x1=\"13.0925\" y1=\"2.34874\" x2=\"16.3487\" y2=\"6.90754\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                    <line x1=\"1.5\" y1=\"-1.5\" x2=\"9.31665\" y2=\"-1.5\" transform=\"matrix(-0.757816 0.652468 0.652468 0.757816 26.197 2)\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                    <line x1=\"9.5\" y1=\"34.5\" x2=\"29.5\" y2=\"34.5\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                </svg>\n            </div>\n            <div class=\"menu__text\">".concat(window.lampa_settings.iptv ? Lampa.Lang.translate('player_playlist') : 'IPTV', "</div>\n        </li>"));
      button.on('hover:enter', function () {
        if (window.lampa_settings.iptv) {
          if (!Lampa.Activity.active().component == 'iptv') return Lampa.Activity.active().activity.component().playlist();
        }
        Lampa.Activity.push({
          url: '',
          title: 'IPTV',
          component: 'iptv',
          page: 1
        });
      });
      $('.menu .menu__list').eq(0).append(button);
      $('body').append(Lampa.Template.get('cub_iptv_style', {}, true));
      if (window.lampa_settings.iptv) {
        $('.head .head__action.open--search').addClass('hide');
        $('.head .head__action.open--premium').remove();
        $('.head .head__action.open--feed').remove();
        $('.navigation-bar__body [data-action="main"]').unbind().on('click', function () {
          Lampa.Activity.active().activity.component().playlist();
        });
        $('.navigation-bar__body [data-action="search"]').addClass('hide');
      }
    }
    Lang.init();
    Templates.init();
    Settings.init();
    EPG.init();
    Guide.init();
    Lampa.Component.add('iptv', Component);
    if (window.lampa_settings.iptv) {
      Lampa.Storage.set('start_page', 'last');
      window.start_deep_link = {
        component: 'iptv'
      };
    }
    if (window.appready) add();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') add();
      });
    }
  }
  if (!window.plugin_iptv_ready) startPlugin();

})();
