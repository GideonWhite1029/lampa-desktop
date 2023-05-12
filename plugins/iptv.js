(function () {
  'use strict';

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
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  var favorites = [];
  var Favorites = /*#__PURE__*/function () {
    function Favorites() {
      _classCallCheck(this, Favorites);
    }
    _createClass(Favorites, null, [{
      key: "load",
      value: function load() {
        DB.getData('favorites').then(function (result) {
          favorites = result || [];
        });
      }
    }, {
      key: "list",
      value: function list() {
        return favorites;
      }
    }, {
      key: "find",
      value: function find(favorite) {
        return favorites.find(function (a) {
          return a.url == favorite.url;
        });
      }
    }, {
      key: "remove",
      value: function remove(favorite) {
        return new Promise(function (resolve, reject) {
          var find = favorites.find(function (a) {
            return a.url == favorite.url;
          });
          if (find) {
            DB.deleteData('favorites', favorite.url).then(function () {
              Lampa.Arrays.remove(favorites, find);
              resolve();
            })["catch"](reject);
          } else reject();
        });
      }
    }, {
      key: "add",
      value: function add(favorite) {
        return new Promise(function (resolve, reject) {
          if (!favorites.find(function (a) {
            return a.url == favorite.url;
          })) {
            Lampa.Arrays.extend(favorite, {
              view: 0,
              added: Date.now()
            });
            DB.addData('favorites', favorite.url, favorite).then(function () {
              favorites.push(favorite);
              resolve();
            })["catch"](reject);
          } else reject();
        });
      }
    }, {
      key: "update",
      value: function update(favorite) {
        return new Promise(function (resolve, reject) {
          if (favorites.find(function (a) {
            return a.url == favorite.url;
          })) {
            Lampa.Arrays.extend(favorite, {
              view: 0,
              added: Date.now()
            });
            DB.updateData('favorites', favorite.url, favorite).then(resolve)["catch"](reject);
          } else reject();
        });
      }
    }, {
      key: "toggle",
      value: function toggle(favorite) {
        return this.find(favorite) ? this.remove(favorite) : this.add(favorite);
      }
    }]);
    return Favorites;
  }();

  var DB = new Lampa.DB('cub_iptv', ['playlist', 'params', 'epg', 'favorites', 'other'], 4);
  DB.logs = true;
  DB.openDatabase().then(Favorites.load)["catch"](function (e) {});

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
    _createClass(Params, null, [{
      key: "get",
      value: function get(id) {
        return new Promise(function (resolve) {
          DB.getDataAnyCase('params', id).then(function (params) {
            resolve(fixParams(params));
          });
        });
      }
    }, {
      key: "set",
      value: function set(id, params) {
        return DB.rewriteData('params', id, fixParams(params));
      }
    }, {
      key: "value",
      value: function value(params, name) {
        return Lampa.Lang.translate('iptv_params_' + params[name]);
      }
    }]);
    return Params;
  }();

  var Api = /*#__PURE__*/function () {
    function Api() {
      _classCallCheck(this, Api);
    }
    _createClass(Api, null, [{
      key: "get",
      value: function get(method) {
        var _this = this;
        return new Promise(function (resolve, reject) {
          var account = Lampa.Storage.get('account', '{}');
          if (!account.token) return reject();
          _this.network.silent(_this.api_url + method, resolve, reject, false, {
            headers: {
              token: account.token,
              profile: account.profile.id
            }
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
          _this2.network["native"](url, function (str) {
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
          _this3.get('list').then(function (result) {
            DB.rewriteData('playlist', 'list', result);
            resolve(result);
          })["catch"](function (e) {
            DB.getData('playlist', 'list').then(function (result) {
              result ? resolve(result) : reject();
            })["catch"](reject);
          });
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
              _this4.get('playlist/' + id).then(secuses)["catch"](error);
            }
          })["catch"](reject);
        });
      }
    }, {
      key: "program",
      value: function program(data) {
        var _this5 = this;
        return new Promise(function (resolve, reject) {
          DB.getDataAnyCase('epg', data.channel_id, 60 * 24 * 3).then(function (epg) {
            if (epg) resolve(epg);else {
              _this5.network.timeout(5000);
              _this5.network.silent(_this5.api_url + 'program/' + data.channel_id + '/' + data.time + '?full=true', function (result) {
                DB.rewriteData('epg', data.channel_id, result.program)["finally"](resolve.bind(resolve, result.program));
              }, function (a) {
                if (a.status == 500) DB.rewriteData('epg', data.channel_id, [])["finally"](resolve.bind(resolve, []));else reject();
              });
            }
          });
        });
      }
    }]);
    return Api;
  }();
  _defineProperty(Api, "network", new Lampa.Reguest());
  _defineProperty(Api, "api_url", 'http://cub.watch/api/iptv/');

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
        DB.rewriteData('playlist', 'active', playlist.id)["finally"](function () {
          _this.listener.send('channels-load', playlist);
        });
      });
    }
    _createClass(PlaylistItem, [{
      key: "displaySettings",
      value: function displaySettings() {
        var _this2 = this;
        var params = {
          update: ['always', 'hour', 'hour12', 'day', 'week', 'none'],
          loading: ['cub', 'lampa']
        };
        Lampa.Select.show({
          title: Lampa.Lang.translate('title_settings'),
          items: [{
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
          }],
          onSelect: function onSelect(a) {
            if (a.name) {
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
                Lampa.Noty.show('Кеш удален');
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
    return PlaylistItem;
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
    _createClass(Playlist, [{
      key: "list",
      value: function list(playlist) {
        var _this = this;
        this.scroll.clear();
        this.scroll.reset();
        this.html.find('.iptv-list__text').html(Lampa.Lang.translate('iptv_select_playlist_text'));
        playlist.list.reverse().forEach(function (data) {
          var item = new PlaylistItem(data);
          item.listener = _this.listener;
          var elem = item.render();
          elem.on('hover:focus', function () {
            _this.last = elem;
            _this.scroll.update(_this.last);
          }).on('hover:hover hover:touch', function () {
            _this.last = elem;
            Navigator.focused(elem);
          });
          _this.scroll.append(elem);
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
        var _this2 = this;
        Promise.all([Api.list(), DB.getDataAnyCase('playlist', 'active')]).then(function (result) {
          var playlist = result[0];
          var active = result[1];
          if (playlist) {
            if (active) {
              var find = playlist.list.find(function (l) {
                return l.id == active;
              });
              if (find) {
                _this2.listener.send('channels-load', find);
              } else _this2.list(playlist);
            } else _this2.list(playlist);
          } else _this2.empty();
        })["catch"](function (e) {
          _this2.empty();
        });
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
        var _this3 = this;
        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(_this3.html);
            Lampa.Controller.collectionFocus(_this3.last, _this3.html);
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
    return Playlist;
  }();

  var Utils = /*#__PURE__*/function () {
    function Utils() {
      _classCallCheck(this, Utils);
    }
    _createClass(Utils, null, [{
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
    }]);
    return Utils;
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
        _this.icons.sort(function (a, b) {
          var ta = a.added || 0;
          var tb = b.added || 0;
          return ta < tb ? -1 : ta > tb ? 1 : 0;
        });
        if (data.menu.favorites) _this.sort();
        _this.html.empty();
        _this.scroll.reset();
        _this.position = 0;
        _this.last = false;
        _this.next();
      });
    }
    _createClass(Icons, [{
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
          var position = start + index;
          chn.text((position + 1).pad(3));
          item.addClass('iptv-channel selector layer--visible layer--render');
          body.addClass('iptv-channel__body');
          img.addClass('iptv-channel__ico');
          chn.addClass('iptv-channel__chn');
          body.append(img);
          item.append(body);
          item.append(chn);
          item.toggleClass('favorite', Boolean(Favorites.find(element)));
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
                title: Lampa.Lang.translate(Favorites.find(element) ? 'iptv_remove_fav' : 'iptv_add_fav')
              }],
              onSelect: function onSelect(a) {
                Favorites.toggle(element)["finally"](function () {
                  item.toggleClass('favorite', Boolean(Favorites.find(element)));
                  _this2.listener.send('update-favorites');
                });
                _this2.toggle();
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
    return Icons;
  }();

  var EPG = /*#__PURE__*/function () {
    function EPG() {
      _classCallCheck(this, EPG);
    }
    _createClass(EPG, null, [{
      key: "time",
      value: function time(channel) {
        var timeshift = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var date = new Date(),
          time = date.getTime(),
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
    return EPG;
  }();

  var Details = /*#__PURE__*/function () {
    function Details(listener) {
      var _this = this;
      _classCallCheck(this, Details);
      this.listener = listener;
      this.html = Lampa.Template.js('cub_iptv_details');
      this.title = this.html.find('.iptv-details__title');
      this.play = this.html.find('.iptv-details__play');
      this.progm = this.html.find('.iptv-details__program');
      this.empty_html = Lampa.Template.js('cub_iptv_details_empty');
      this.listener.follow('details-load', this.draw.bind(this));
      if (window.iptv_mobile) this.html.removeClass('layer--wheight');
      this.timer = setInterval(function () {
        if (_this.timeline) _this.timeline();
      }, 1000 * 5);
    }
    _createClass(Details, [{
      key: "draw",
      value: function draw(channel) {
        var _this2 = this;
        this.title.text(Utils.clearChannelName(channel.name));
        this.group(channel, Utils.clearMenuName(channel.group || Lampa.Lang.translate('player_unknown')));
        this.wait_for = channel.name;
        if (channel.id) {
          this.progm.text(Lampa.Lang.translate('loading') + '...');
          Api.program({
            channel_id: channel.id,
            time: EPG.time(channel)
          }).then(function (program) {
            if (_this2.wait_for == channel.name) {
              if (program.length) _this2.program(channel, program);else _this2.empty();
            }
          })["catch"](function (e) {
            console.log(e);
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
      key: "program",
      value: function program(channel, _program) {
        var _this3 = this;
        if (this.endless) this.endless.destroy();
        this.timeline = false;
        var stime = EPG.time(channel);
        var start = EPG.position(channel, _program);
        var archive = Utils.hasArchive(channel);
        if (_program[start]) {
          this.group(channel, Lampa.Utils.shortText(Utils.clear(_program[start].title), 50));
        }
        this.endless = new Lampa.Endless(function (position) {
          if (position >= _program.length) return _this3.endless.to(position - 1);
          var wrap = document.createElement('div');
          var list = EPG.list(channel, _program, 10, position);
          list.forEach(function (elem, index) {
            var item = document.createElement('div');
            if (elem.type == 'date') item.addClass('iptv-program-date').text(elem.date);else {
              item.addClass('iptv-program selector');
              var time = document.createElement('div');
              time.addClass('iptv-program__time').text(Lampa.Utils.parseTime(elem.program.start).time);
              var body = document.createElement('div');
              body.addClass('iptv-program__body');
              var title = document.createElement('div');
              title.addClass('iptv-program__title').text(Utils.clear(elem.program.title));
              body.append(title);
              if (elem.watch) {
                var timeline = document.createElement('div');
                timeline.addClass('iptv-program__timeline');
                var div = document.createElement('div');
                div.style.width = EPG.timeline(channel, elem.program) + '%';
                timeline.append(div);
                _this3.timeline = function () {
                  var percent = EPG.timeline(channel, elem.program);
                  div.style.width = percent + '%';
                  if (percent == 100) {
                    var next = EPG.position(channel, _program);
                    if (start !== next) _this3.program(channel, _program);
                  }
                };
                item.addClass('played');
                body.append(timeline);
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
                    _this3.listener.send('play-archive', {
                      program: elem.program,
                      position: position,
                      channel: channel,
                      timeshift: stime - elem.program.start,
                      playlist: _program.slice(Math.max(0, position - 40), start)
                    });
                  });
                }
              }
              item.append(time);
              item.append(body);
            }
            wrap.addClass('iptv-details__list');
            wrap.append(item);
          });
          return wrap;
        }, {
          position: start
        });
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
    return Details;
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
    _createClass(Menu, [{
      key: "build",
      value: function build(data) {
        var _this = this;
        this.menu.empty();
        this.html.find('.iptv-menu__title').text(data.name || Lampa.Lang.translate('player_playlist'));
        var favorites = Favorites.list();
        Lampa.Arrays.insert(data.playlist.menu, 0, {
          name: Lampa.Lang.translate('settings_input_links'),
          count: favorites.length,
          favorites: true
        });
        var first;
        data.playlist.menu.forEach(function (menu) {
          if (menu.count == 0 && !menu.favorites) return;
          var li = document.createElement('div');
          var co = document.createElement('span');
          li.addClass('iptv-menu__list-item selector');
          li.text(Utils.clearMenuName(menu.name || Lampa.Lang.translate('iptv_all_channels')));
          co.text(menu.count);
          li.append(co);
          if (menu.favorites) {
            li.addClass('favorites--menu-item');
            _this.listener.follow('update-favorites', function () {
              favorites = Favorites.list();
              menu.count = favorites.length;
              li.find('span').text(menu.count);
            });
          }
          li.on('hover:enter', function () {
            if (menu.count == 0) return;
            if (menu.favorites) {
              _this.listener.send('icons-load', {
                menu: menu,
                icons: favorites
              });
            } else {
              _this.listener.send('icons-load', {
                menu: menu,
                icons: menu.name ? data.playlist.channels.filter(function (a) {
                  return a.group == menu.name;
                }) : data.playlist.channels
              });
            }
            var active = _this.menu.find('.active');
            if (active) active.removeClass('active');
            li.addClass('active');
            _this.last = li;
            _this.listener.send('toggle', 'icons');
          });
          li.on('hover:focus', function () {
            _this.scroll.update(li, true);
            _this.last = li;
          });
          if (!first && menu.count !== 0) first = li;
          _this.menu.append(li);
        });
        if (first) Lampa.Utils.trigger(first, 'hover:enter');
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this2 = this;
        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(_this2.render());
            Lampa.Controller.collectionFocus(_this2.last, _this2.render());
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
    return Menu;
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
    var thisOffset = 0;
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
  function unixtime() {
    return Math.floor((new Date().getTime() + 0) / 1000);
  }
  var Url = /*#__PURE__*/function () {
    function Url() {
      _classCallCheck(this, Url);
    }
    _createClass(Url, null, [{
      key: "prepareUrl",
      value: function prepareUrl(url, program) {
        var m = [],
          val = '',
          r = {
            start: unixtime,
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
            offset: unixtime() - start,
            duration: duration,
            now: unixtime,
            lutc: unixtime,
            timestamp: unixtime,
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
              return tf(unixtime(), m[6], m[4], m[5]);
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
            return url.replace(/\/(video\d*|mono\d*)\.(m3u8|ts)(\?|$)/, '/$1-\${start}-\${duration}.$2$3').replace(/\/(index|playlist)\.(m3u8|ts)(\?|$)/, '/archive-\${start}-\${duration}.$2$3').replace(/\/mpegts(\?|$)/, '/timeshift_abs-\${start}.ts$1').replace(/\/live(\?|$)/, '/\${start}.ts$1');
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
    return Url;
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
    _createClass(Channels, [{
      key: "build",
      value: function build(data) {
        this.empty = false;
        this.menu.build(data);
        this.listener.send('display', this);
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
        var start_channel = Lampa.Arrays.clone(this.icons.icons[data.position]);
        start_channel.original = this.icons.icons[data.position];
        data.url = Url.prepareUrl(start_channel.url);
        if (this.archive && this.archive.channel == start_channel.original) {
          data.url = Url.catchupUrl(this.archive.channel.url, this.archive.channel.catchup.type, this.archive.channel.catchup.source);
          data.url = Url.prepareUrl(data.url, this.archive.program);
        }
        data.onGetChannel = function (position) {
          var original = _this2.icons.icons[position];
          var channel = Lampa.Arrays.clone(original);
          var timeshift = _this2.archive && _this2.archive.channel == original ? _this2.archive.timeshift : 0;
          channel.name = Utils.clearChannelName(channel.name);
          channel.group = Utils.clearMenuName(channel.group);
          channel.url = Url.prepareUrl(channel.url);
          channel.original = original;
          if (timeshift) {
            channel.shift = timeshift;
            channel.url = Url.catchupUrl(original.url, channel.catchup.type, channel.catchup.source);
            channel.url = Url.prepareUrl(channel.url, _this2.archive.program);
          }
          update = false;
          if (channel.id) {
            if (!cache[channel.id]) {
              cache[channel.id] = [];
              Api.program({
                channel_id: channel.id,
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
        data.onPlay = function (channel) {
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
    return Channels;
  }();

  function Component() {
    var html = document.createElement('div');
    var listener;
    var playlist;
    var channels;
    window.iptv_mobile = window.innerWidth < 768;
    if (Lampa.Manifest.app_digital >= 185) {
      listener = Lampa.Subscribe();
      playlist = new Playlist(listener);
      channels = new Channels(listener);
    }
    this.create = function () {
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
      return this.render();
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
      playlist.destroy();
      channels.destroy();
      listener.destroy();
      html.remove();
    };
  }

  function startPlugin() {
    window.plugin_iptv_ready = true;
    var manifest = {
      type: 'video',
      version: '1.2.5',
      name: 'IPTV',
      description: '',
      component: 'iptv'
    };
    Lampa.Manifest.plugins = manifest;
    Lampa.Lang.add({
      iptv_noprogram: {
        ru: 'Нет программы',
        en: 'No program',
        uk: 'Немає програми',
        be: 'Няма праграмы',
        zh: '没有节目',
        pt: 'Nenhum programa'
      },
      iptv_noload_playlist: {
        ru: 'К сожалению, загрузка плейлиста не удалась. Возможно, ваш провайдер заблокировал загрузку из внешних источников.',
        en: 'Unfortunately, the playlist download failed. Your ISP may have blocked downloads from external sources.',
        uk: 'На жаль, завантаження плейлиста не вдалося. Можливо, ваш провайдер заблокував завантаження із зовнішніх джерел.',
        be: 'Нажаль, загрузка плэйліста не атрымалася. Магчыма, ваш правайдэр заблакаваў загрузку са знешніх крыніц.',
        zh: '不幸的是，播放列表下载失败。 您的 ISP 可能已阻止从外部来源下载。',
        pt: 'Infelizmente, o download da lista de reprodução falhou. Seu ISP pode ter bloqueado downloads de fontes externas.'
      },
      iptv_select_playlist: {
        ru: 'Выберите плейлист',
        en: 'Choose a playlist',
        uk: 'Виберіть плейлист',
        be: 'Выберыце плэйліст',
        zh: '选择一个播放列表',
        pt: 'Escolha uma lista de reprodução'
      },
      iptv_all_channels: {
        ru: 'Все каналы',
        en: 'All channels',
        uk: 'Усі канали',
        be: 'Усе каналы',
        zh: '所有频道',
        pt: 'Todos os canais'
      },
      iptv_add_fav: {
        ru: 'Добавить в избранное',
        en: 'Add to favorites',
        uk: 'Додати в обране',
        be: 'Дадаць у абранае',
        zh: '添加到收藏夹',
        pt: 'Adicionar aos favoritos'
      },
      iptv_remove_fav: {
        ru: 'Убрать из избранного',
        en: 'Remove from favorites',
        uk: 'Прибрати з вибраного',
        be: 'Прыбраць з абранага',
        zh: '从收藏夹中删除',
        pt: 'Remover dos favoritos'
      },
      iptv_playlist_empty: {
        ru: 'К сожалению, на данный момент вы не добавили ни одного плейлиста. Чтобы начать просмотр контента, пожалуйста, перейдите на страницу <span class="iptv-link">cub.watch/iptv</span> и добавьте хотя бы один плейлист.',
        en: 'Sorry, you haven\'t added any playlist yet. To start watching content, please go to <span class="iptv-link">cub.watch/iptv</span> and add at least one playlist.',
        uk: 'На жаль, на даний момент ви не додали жодного плейлиста. Щоб розпочати перегляд контенту, будь ласка, перейдіть на сторінку <span class="iptv-link">cub.watch/iptv</span> і додайте хоча б один плейлист.',
        be: 'Нажаль, на дадзены момант вы не дадалі ніводнага плэйліста. Каб пачаць прагляд кантэнту, калі ласка, перайдзіце на старонку <span class="iptv-link">cub.watch/iptv</span> і дадайце хаця б адзін плэйліст.',
        zh: '抱歉，您还没有添加任何播放列表。 要开始观看内容，请转到 <span class="iptv-link">cub.watch/iptv</span> 并添加至少一个播放列表。',
        pt: 'Desculpe, você ainda não adicionou nenhuma lista de reprodução. Para começar a assistir o conteúdo, acesse <span class="iptv-link">cub.watch/iptv</span> e adicione pelo menos uma lista de reprodução.'
      },
      iptv_select_playlist_text: {
        ru: 'Для того чтобы добавить свой плейлист, вам необходимо перейти на сайт <span class="iptv-link">cub.watch/iptv</span> и добавить плейлист от вашего провайдера.',
        en: 'In order to add your playlist, you need to go to <span class="iptv-link">cub.watch/iptv</span> and add a playlist from your provider.',
        uk: 'Щоб додати свій плейлист, вам необхідно перейти на сайт <span class="iptv-link">cub.watch/iptv</span> і додати плейлист від вашого провайдера.',
        be: 'Для таго каб дадаць свой плэйліст, вам неабходна перайсці на сайт <span class="iptv-link">cub.watch/iptv</span> і дадаць плэйліст ад вашага правайдэра.',
        zh: '要添加您的播放列表，您需要前往 <span class="iptv-link">cub.watch/iptv</span> 并添加来自您的提供商的播放列表。',
        pt: 'Para adicionar sua lista de reprodução, você precisa acessar <span class="iptv-link">cub.watch/iptv</span> e adicionar uma lista de reprodução do seu provedor.'
      },
      iptv_updated: {
        ru: 'Обновлено',
        en: 'Updated',
        uk: 'Оновлено',
        be: 'Абноўлена',
        zh: '更新',
        pt: 'Atualizada'
      },
      iptv_update: {
        ru: 'Обновление',
        en: 'Update',
        uk: 'Оновлення',
        be: 'Абнаўленне',
        zh: '更新',
        pt: 'Atualizar'
      },
      iptv_active: {
        ru: 'Активно',
        en: 'Actively',
        uk: 'Активно',
        be: 'Актыўна',
        zh: '积极地',
        pt: 'Ativamente'
      },
      iptv_yesterday: {
        ru: 'Вчера',
        en: 'Yesterday',
        uk: 'Вчора',
        be: 'Учора',
        zh: '昨天',
        pt: 'Ontem'
      },
      iptv_today: {
        ru: 'Сегодня',
        en: 'Today',
        uk: 'Сьогодні',
        be: 'Сёння',
        zh: '今天',
        pt: 'Hoje'
      },
      iptv_tomorrow: {
        ru: 'Завтра',
        en: 'Tomorrow',
        uk: 'Завтра',
        be: 'Заўтра',
        zh: '明天',
        pt: 'Amanhã'
      },
      iptv_loading: {
        ru: 'Метод загрузки',
        en: 'Download method',
        uk: 'Метод завантаження',
        be: 'Метад загрузкі',
        zh: '下载方式',
        pt: 'Método de download'
      },
      iptv_params_cub: {
        ru: 'CUB',
        en: 'CUB',
        uk: 'CUB',
        be: 'CUB',
        zh: 'CUB',
        pt: 'CUB'
      },
      iptv_params_lampa: {
        ru: 'Lampa',
        en: 'Lampa',
        uk: 'Lampa',
        be: 'Lampa',
        zh: 'Lampa',
        pt: 'Lampa'
      },
      iptv_remove_cache: {
        ru: 'Удалить кеш',
        en: 'Delete cache',
        uk: 'Видалити кеш',
        be: 'Выдаліць кэш',
        zh: '删除缓存',
        pt: 'Excluir cache'
      },
      iptv_remove_cache_descr: {
        ru: 'Удалить плейлист из кеша',
        en: 'Delete playlist from cache',
        uk: 'Видалити плейлист з кешу',
        be: 'Выдаліць плэйліст з кэшу',
        zh: '从缓存中删除播放列表',
        pt: 'Excluir lista de reprodução do cache'
      },
      iptv_params_always: {
        ru: 'Всегда',
        en: 'Always',
        uk: 'Завжди',
        be: 'Заўсёды',
        zh: '总是',
        pt: 'Sempre'
      },
      iptv_params_hour: {
        ru: 'Каждый час',
        en: 'Each hour',
        uk: 'Кожну годину',
        be: 'Кожную гадзіну',
        zh: '每小时',
        pt: 'Cada hora'
      },
      iptv_params_hour12: {
        ru: 'Каждые 12 часов',
        en: 'Every 12 hours',
        uk: 'Кожні 12 годин',
        be: 'Кожныя 12 гадзін',
        zh: '每12小时',
        pt: 'A cada 12 horas'
      },
      iptv_params_day: {
        ru: 'Ежедневно',
        en: 'Daily',
        uk: 'Щодня',
        be: 'Штодня',
        zh: '日常的',
        pt: 'Diário'
      },
      iptv_params_week: {
        ru: 'Еженедельно',
        en: 'Weekly',
        uk: 'Щотижня',
        be: 'Штотыдзень',
        zh: '每周',
        pt: 'Semanalmente'
      },
      iptv_params_none: {
        ru: 'Никогда',
        en: 'Never',
        uk: 'Ніколи',
        be: 'Ніколі',
        zh: '绝不',
        pt: 'Nunca'
      },
      iptv_update_app_title: {
        ru: 'Обновите приложение',
        en: 'Update the app',
        uk: 'Оновлення програми',
        be: 'Абнавіце дадатак',
        zh: '更新应用程序',
        pt: 'Atualize o aplicativo'
      },
      iptv_update_app_text: {
        ru: 'К сожалению, для работы плагина необходимо обновить вашу лампу путем ее перезагрузки. Она устарела и без этой процедуры плагин не будет функционировать.',
        en: 'Unfortunately, for the plugin to work, you need to update your lamp by rebooting it. It is outdated and without this procedure the plugin will not function.',
        uk: 'На жаль, для роботи плагіна необхідно оновити лампу шляхом її перезавантаження. Вона застаріла і без цієї процедури плагін не функціонуватиме.',
        be: 'Нажаль, для працы плагіна неабходна абнавіць вашу лямпу шляхам яе перазагрузкі. Яна састарэлая і без гэтай працэдуры плягін не будзе функцыянаваць.',
        zh: '不幸的是，要使插件正常工作，您需要通过重新启动来更新灯泡。 它已过时，如果没有此程序，插件将无法运行。',
        pt: 'Infelizmente, para que o plug-in funcione, você precisa atualizar sua lâmpada reiniciando-a. Está desatualizado e sem este procedimento o plugin não funcionará.'
      },
      iptv_param_sort_add: {
        ru: 'По добавлению',
        en: 'By addition',
        uk: 'За додаванням',
        be: 'Па даданні',
        zh: '按添加时间',
        pt: 'Por adição'
      },
      iptv_param_sort_name: {
        ru: 'По названию',
        en: 'By name',
        uk: 'За назвою',
        be: 'Па назве',
        zh: '按名称',
        pt: 'Por nome'
      },
      iptv_param_sort_view: {
        ru: 'По просмотрам',
        en: 'By views',
        uk: 'За переглядами',
        be: 'Па праглядах',
        zh: '按观看次数',
        pt: 'Por visualizações'
      },
      iptv_param_sort_favorite: {
        ru: 'Сортировать избранное',
        en: 'Sort by favorite',
        uk: 'Сортувати в обраному',
        be: 'Сартаваць па выбраным',
        zh: '按收藏排序',
        pt: 'Classificar por favoritos'
      },
      iptv_premium: {
        ru: 'Доступ к некоторым функциям возможен только при наличии подписки <b>CUB Premium</b>',
        en: 'Some features are only available with a <b>CUB Premium</b> subscription',
        uk: 'Доступ до деяких функцій можливий лише за наявності передплати <b>CUB Premium</b>',
        be: 'Доступ да некаторых функцый магчымы толькі пры наяўнасці падпіскі <b>CUB Premium</b>',
        zh: '某些功能仅适用于 <b>CUB Premium</b> 订阅',
        pt: 'Alguns recursos estão disponíveis apenas com uma assinatura <b>CUB Premium</b>'
      }
    });
    Lampa.Template.add('cub_iptv_content', "\n        <div class=\"iptv-content\">\n            <div class=\"iptv-content__menu\"></div>\n            <div class=\"iptv-content__channels\"></div>\n            <div class=\"iptv-content__details\"></div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_menu', "\n        <div class=\"iptv-menu\">\n            <div class=\"iptv-menu__body\">\n                <div class=\"iptv-menu__title\"></div>\n                <div class=\"iptv-menu__list\"></div>\n            </div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_channels', "\n        <div class=\"iptv-channels\">\n            \n        </div>\n    ");
    Lampa.Template.add('cub_iptv_details', "\n        <div class=\"iptv-details layer--wheight\">\n            <div class=\"iptv-details__play\"></div>\n            <div class=\"iptv-details__title\"></div>\n\n            <div class=\"iptv-details__program\">\n\n            </div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_details_empty', "\n        <div class=\"iptv-details-epmty endless endless-up\">\n            <div><span></span><span style=\"width: 60%\"></span></div>\n            <div><span></span><span style=\"width: 70%\"></span></div>\n            <div><span></span><span style=\"width: 40%\"></span></div>\n            <div><span></span><span style=\"width: 55%\"></span></div>\n            <div><span></span><span style=\"width: 30%\"></span></div>\n            <div><span></span><span style=\"width: 55%\"></span></div>\n            <div><span></span><span style=\"width: 30%\"></span></div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_playlist_item', "\n        <div class=\"iptv-playlist-item selector layer--visible layer--render\">\n            <div class=\"iptv-playlist-item__body\">\n                <div class=\"iptv-playlist-item__name\">\n                    <div class=\"iptv-playlist-item__name-ico\"><span></span></div>\n                    <div class=\"iptv-playlist-item__name-text\">est</div>\n                </div>\n                <div class=\"iptv-playlist-item__url\"></div>\n            </div>\n\n            <div class=\"iptv-playlist-item__footer hide\">\n                <div class=\"iptv-playlist-item__details details-left\"></div>\n                <div class=\"iptv-playlist-item__details details-right\"></div>\n            </div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_list', "\n        <div class=\"iptv-list layer--wheight\">\n            <div class=\"iptv-list__ico\">\n                <svg height=\"36\" viewBox=\"0 0 38 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect x=\"2\" y=\"8\" width=\"34\" height=\"21\" rx=\"3\" stroke=\"white\" stroke-width=\"3\"/>\n                    <line x1=\"13.0925\" y1=\"2.34874\" x2=\"16.3487\" y2=\"6.90754\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                    <line x1=\"1.5\" y1=\"-1.5\" x2=\"9.31665\" y2=\"-1.5\" transform=\"matrix(-0.757816 0.652468 0.652468 0.757816 26.197 2)\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                    <line x1=\"9.5\" y1=\"34.5\" x2=\"29.5\" y2=\"34.5\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                </svg>\n            </div>\n            <div class=\"iptv-list__title\"></div>\n            <div class=\"iptv-list__text\"></div>\n            <div class=\"iptv-list__items\"></div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_list_empty', "\n        <div class=\"iptv-list-empty selector\">\n            <div class=\"iptv-list-empty__text\"></div>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_param_lock', "\n        <div class=\"iptv-param-lock\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"512\" height=\"512\" viewBox=\"0 0 401.998 401.998\" xml:space=\"preserve\"><path d=\"M357.45 190.721c-5.331-5.33-11.8-7.993-19.417-7.993h-9.131v-54.821c0-35.022-12.559-65.093-37.685-90.218C266.093 12.563 236.025 0 200.998 0c-35.026 0-65.1 12.563-90.222 37.688-25.126 25.126-37.685 55.196-37.685 90.219v54.821h-9.135c-7.611 0-14.084 2.663-19.414 7.993-5.33 5.326-7.994 11.799-7.994 19.417V374.59c0 7.611 2.665 14.086 7.994 19.417 5.33 5.325 11.803 7.991 19.414 7.991H338.04c7.617 0 14.085-2.663 19.417-7.991 5.325-5.331 7.994-11.806 7.994-19.417V210.135c.004-7.612-2.669-14.084-8.001-19.414zm-83.363-7.993H127.909v-54.821c0-20.175 7.139-37.402 21.414-51.675 14.277-14.275 31.501-21.411 51.678-21.411 20.179 0 37.399 7.135 51.677 21.411 14.271 14.272 21.409 31.5 21.409 51.675v54.821z\" fill=\"currentColor\"></path></svg>\n        </div>\n    ");
    Lampa.Template.add('cub_iptv_style', "\n        <style>\n        .iptv-list{padding:1.5em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;padding-bottom:1em}.iptv-list__ico{width:4.5em;margin-bottom:2em;height:4.5em}.iptv-list__ico>svg{width:4.5em;height:4.5em}.iptv-list__title{font-size:1.9em;margin-bottom:1em}.iptv-list__text{font-size:1.2em;line-height:1.4;margin-bottom:1em;text-align:center;width:60%;margin:0 auto;margin-bottom:2em}@media screen and (max-width:767px){.iptv-list__text{width:100%}}.iptv-list__items{width:80%;margin:0 auto}.iptv-list__items .scroll{height:22em}@media screen and (max-width:767px){.iptv-list__items{width:100%}}.iptv-list__item{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;padding:1em;background-color:rgba(255,255,255,0.1);font-size:1.3em;line-height:1.3;-webkit-border-radius:.3em;border-radius:.3em;margin:1em}.iptv-list__item-name{width:40%;padding-right:1em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap;text-align:left}.iptv-list__item-url{width:60%;padding-left:1em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap;text-align:right}.iptv-list__item.focus{background-color:#fff;color:black}.iptv-playlist-item{padding:1em;background-color:rgba(255,255,255,0.1);line-height:1.3;margin:1em;-webkit-border-radius:1em;border-radius:1em;position:relative}.iptv-playlist-item__body{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.iptv-playlist-item__url{width:60%;padding-left:1em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap;text-align:right}.iptv-playlist-item__name{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;width:40%}.iptv-playlist-item__name-ico{background-color:#fff;-webkit-border-radius:.5em;border-radius:.5em;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;padding:.3em .5em;color:#000;min-width:2.3em;text-align:center}.iptv-playlist-item__name-ico>span{font-size:1.2em;font-weight:900}.iptv-playlist-item__name-text{font-weight:600;padding-left:1em}.iptv-playlist-item__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;margin-top:1em;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between}@media screen and (max-width:480px){.iptv-playlist-item__footer{display:block}}.iptv-playlist-item__details{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.iptv-playlist-item__details+div{margin-left:2em}@media screen and (max-width:480px){.iptv-playlist-item__details+div{margin-left:0;margin-top:1em}}.iptv-playlist-item__label{color:rgba(255,255,255,0.5)}.iptv-playlist-item__label>span{color:#fff}.iptv-playlist-item__label+.iptv-playlist-item__label:before{content:'|';display:inline-block;margin:0 1em;font-size:.7em;margin-top:-0.4em}.iptv-playlist-item.focus::after,.iptv-playlist-item.hover::after{content:'';position:absolute;top:-0.5em;left:-0.5em;right:-0.5em;bottom:-0.5em;border:.3em solid #fff;-webkit-border-radius:1.4em;border-radius:1.4em;z-index:-1;pointer-events:none}.iptv-content{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;padding:0 1.5em;line-height:1.3}.iptv-content>div{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.iptv-content__menu{width:30%;padding-right:4em}@media screen and (max-width:900px){.iptv-content__menu{width:28%}}.iptv-content__channels{width:25%}@media screen and (max-width:900px){.iptv-content__channels{width:27%}}.iptv-content__details{width:45%;padding-left:4em}.iptv-menu__title{font-size:2.4em;font-weight:300;margin-bottom:1em}.iptv-menu__list-item{color:rgba(255,255,255,0.6);font-size:1.4em;font-weight:300;position:relative;padding:.5em .8em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.iptv-menu__list-item>span{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;padding-left:1em;margin-left:auto}.iptv-menu__list-item.active{color:#fff;background-color:rgba(255,255,255,0.1);-webkit-border-radius:.8em;border-radius:.8em}.iptv-menu__list-item.focus{color:#000;background-color:#fff;-webkit-border-radius:.8em;border-radius:.8em}.iptv-menu__list>div+div{margin-top:.3em}.iptv-channels{padding:1em;padding-left:5em}.iptv-channel{background-color:#464646;-webkit-border-radius:1em;border-radius:1em;padding-bottom:72%;position:relative}.iptv-channel__body{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;padding:1em;text-align:center}.iptv-channel__ico{width:80%;opacity:0;max-height:100%}.iptv-channel__name{text-align:center;font-size:1.2em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical;max-height:1.4em}.iptv-channel__simb{font-size:4em;font-weight:900;line-height:.7;margin-bottom:.4em}.iptv-channel__chn{position:absolute;top:50%;right:100%;margin-right:.5em;font-size:1.9em;font-weight:600;margin-top:-0.7em;opacity:.5}.iptv-channel.loaded .iptv-channel__ico{opacity:1}.iptv-channel.full--icon .iptv-channel__body{padding:0;overflow:hidden;-webkit-border-radius:1em;border-radius:1em}.iptv-channel.full--icon .iptv-channel__ico{max-width:105%;width:105%;height:105%}.iptv-channel.small--icon .iptv-channel__ico{width:6em;-webkit-border-radius:.7em;border-radius:.7em}.iptv-channel.favorite::after{content:'';position:absolute;top:.3em;right:.2em;background-image:url(./img/icons/menu/like.svg);background-repeat:no-repeat;background-position:50% 50%;-webkit-background-size:55% 55%;-o-background-size:55%;background-size:55%;-webkit-border-radius:100%;border-radius:100%;width:1.8em;height:1.8em;margin-left:-0.9em}.iptv-channel.focus::before,.iptv-channel.active::before{content:'';position:absolute;top:-0.5em;left:-0.5em;right:-0.5em;bottom:-0.5em;border:.3em solid #fff;-webkit-border-radius:1.4em;border-radius:1.4em;opacity:.4}.iptv-channel.focus::before{opacity:1}.iptv-channel+.iptv-channel{margin-top:1em}.iptv-details{padding-top:3.5em;-webkit-mask-image:-webkit-gradient(linear,left top,left bottom,from(white),color-stop(92%,white),to(rgba(255,255,255,0)));-webkit-mask-image:-webkit-linear-gradient(top,white 0,white 92%,rgba(255,255,255,0) 100%);mask-image:-webkit-gradient(linear,left top,left bottom,from(white),color-stop(92%,white),to(rgba(255,255,255,0)));mask-image:linear-gradient(to bottom,white 0,white 92%,rgba(255,255,255,0) 100%)}.iptv-details__play{font-size:1.3em;margin-bottom:.5em}.iptv-details__play .lb{background:rgba(255,255,255,0.3);-webkit-border-radius:.2em;border-radius:.2em;padding:0 .4em;margin-right:.7em}.iptv-details__play span:last-child{opacity:.5}.iptv-details__title{font-size:3.3em;font-weight:700}.iptv-details__program{padding-top:3em}.iptv-details__list>div+div{margin-top:1.6em}.iptv-details-epmty>div{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.iptv-details-epmty>div span{background-color:rgba(255,255,255,0.18);-webkit-border-radius:.2em;border-radius:.2em;height:1em}.iptv-details-epmty>div span:first-child{width:8%;margin-right:3.2em}.iptv-details-epmty>div+div{margin-top:2em}.iptv-program{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;font-size:1.2em;font-weight:300;position:relative}.iptv-program-date{font-size:1.2em;padding-left:4.9em;margin-bottom:1em;opacity:.5}.iptv-program__time{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;width:5em;position:relative}.iptv-program__descr{opacity:.5;margin-top:.7em}.iptv-program__timeline{-webkit-border-radius:1em;border-radius:1em;background:rgba(255,255,255,0.1);margin-top:.9em}.iptv-program__timeline>div{height:.1em;-webkit-border-radius:1em;border-radius:1em;background:#fff;min-height:2px}.iptv-program__body{-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1}.iptv-program.archive::after{content:'';position:absolute;top:.2em;left:3.1em;width:1em;height:1em;background:url('./img/icons/menu/time.svg') no-repeat 50% 50%;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.iptv-program.played::after{content:'';position:absolute;top:.2em;left:3.1em;width:1em;height:1em;background:url('./img/icons/player/play.svg') no-repeat 50% 50%;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.iptv-program.focus .iptv-program__time::after{content:'';position:absolute;top:0;width:2.4em;left:0;background-color:rgba(255,255,255,0.2);height:1.4em;-webkit-border-radius:.2em;border-radius:.2em}.iptv-list-empty{border:.2em dashed rgba(255,255,255,0.5);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;height:12em;-webkit-border-radius:1em;border-radius:1em}.iptv-link{display:inline-block;padding:.1em .5em;-webkit-border-radius:.2em;border-radius:.2em;background-color:rgba(255,255,255,0.1)}.iptv-param-lock{position:absolute;top:50%;right:1.5em;margin-top:-1em;opacity:.5}.iptv-param-lock>svg{width:2em;height:2em}body.platform--orsay .iptv-menu__list-item{padding-right:2.7em}body.platform--orsay .iptv-menu__list-item>span{position:absolute;top:.5em;right:1em}body.light--version .iptv-content{font-size:.9em}body.light--version .iptv-channel{-webkit-border-radius:.3em;border-radius:.3em}body.light--version .iptv-channel::before{-webkit-border-radius:.6em;border-radius:.6em}.iptv-mobile .iptv-content{display:block;padding:0}.iptv-mobile .iptv-content__menu,.iptv-mobile .iptv-content__channels,.iptv-mobile .iptv-content__details{width:100%;padding:0}.iptv-mobile .iptv-menu__list{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.iptv-mobile .iptv-menu__list>div+div{margin:0;margin-left:.5em}.iptv-mobile .iptv-menu__list-item{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.iptv-mobile .iptv-menu__title{display:none}.iptv-mobile .iptv-channels{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;padding:0}.iptv-mobile .iptv-channel{padding-bottom:0;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;width:14em;height:10em}@media screen and (max-width:400px){.iptv-mobile .iptv-channel{width:11em;height:8em}.iptv-mobile .iptv-channel .iptv-channel__simb{font-size:3.2em}}.iptv-mobile .iptv-channel__chn{display:none}.iptv-mobile .iptv-channel+.iptv-channel{margin:0;margin-left:1em}.iptv-mobile .iptv-content__details{padding:0 1.5em}.iptv-mobile .iptv-details{padding-top:0;height:48vh}@media screen and (max-width:500px){.iptv-mobile .iptv-details__title{font-size:2.5em}}\n        </style>\n    ");
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
    });
    function add() {
      var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg height=\"36\" viewBox=\"0 0 38 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect x=\"2\" y=\"8\" width=\"34\" height=\"21\" rx=\"3\" stroke=\"currentColor\" stroke-width=\"3\"/>\n                    <line x1=\"13.0925\" y1=\"2.34874\" x2=\"16.3487\" y2=\"6.90754\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                    <line x1=\"1.5\" y1=\"-1.5\" x2=\"9.31665\" y2=\"-1.5\" transform=\"matrix(-0.757816 0.652468 0.652468 0.757816 26.197 2)\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                    <line x1=\"9.5\" y1=\"34.5\" x2=\"29.5\" y2=\"34.5\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                </svg>\n            </div>\n            <div class=\"menu__text\">".concat(window.lampa_settings.iptv ? Lampa.Lang.translate('player_playlist') : 'IPTV', "</div>\n        </li>"));
      button.on('hover:enter', function () {
        if (window.lampa_settings.iptv) return Lampa.Activity.active().activity.component().playlist();
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
        $('.navigation-bar__body [data-action="main"]').unbind().on('click', function () {
          Lampa.Activity.active().activity.component().playlist();
        });
        $('.navigation-bar__body [data-action="search"]').addClass('hide');
      }
      Lampa.SettingsApi.addComponent({
        component: 'iptv',
        icon: "<svg height=\"36\" viewBox=\"0 0 38 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <rect x=\"2\" y=\"8\" width=\"34\" height=\"21\" rx=\"3\" stroke=\"white\" stroke-width=\"3\"/>\n                <line x1=\"13.0925\" y1=\"2.34874\" x2=\"16.3487\" y2=\"6.90754\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                <line x1=\"1.5\" y1=\"-1.5\" x2=\"9.31665\" y2=\"-1.5\" transform=\"matrix(-0.757816 0.652468 0.652468 0.757816 26.197 2)\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n                <line x1=\"9.5\" y1=\"34.5\" x2=\"29.5\" y2=\"34.5\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n            </svg>",
        name: 'IPTV'
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
