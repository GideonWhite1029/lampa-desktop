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

  var Api = /*#__PURE__*/function () {
    function Api() {
      _classCallCheck(this, Api);
    }
    return _createClass(Api, null, [{
      key: "list",
      value: function list() {
        var _this = this;
        return new Promise(function (resolve, reject) {
          _this.network["native"](_this.api_url, function (result) {
            Lampa.Cache.rewriteData('other', 'radio_record_list', result)["finally"](resolve.bind(resolve, result));
          }, function () {
            Lampa.Cache.getData('other', 'radio_record_list').then(resolve)["catch"](reject);
          });
        });
      }
    }]);
  }();
  _defineProperty(Api, "network", new Lampa.Reguest());
  _defineProperty(Api, "api_url", 'https://www.radiorecord.ru/api/stations/');

  var Favorites = /*#__PURE__*/function () {
    function Favorites() {
      _classCallCheck(this, Favorites);
    }
    return _createClass(Favorites, null, [{
      key: "get",
      value: function get() {
        var all = Lampa.Storage.get('radio_favorite_stations', '[]');
        all.sort(function (a, b) {
          return a.added > b.added ? -1 : a.added < b.added ? 1 : 0;
        });
        return all;
      }
    }, {
      key: "find",
      value: function find(favorite) {
        return this.get().find(function (a) {
          return a.id == favorite.id;
        });
      }
    }, {
      key: "remove",
      value: function remove(favorite) {
        var list = this.get();
        var find = this.find(favorite);
        if (find) {
          Lampa.Arrays.remove(list, find);
          Lampa.Storage.set('radio_favorite_stations', list);
        }
      }
    }, {
      key: "add",
      value: function add(favorite) {
        var list = this.get();
        var find = this.find(favorite);
        if (!find) {
          Lampa.Arrays.extend(favorite, {
            id: Lampa.Utils.uid(),
            added: Date.now()
          });
          list.push(favorite);
          Lampa.Storage.set('radio_favorite_stations', list);
        }
      }
    }, {
      key: "update",
      value: function update(favorite) {
        var list = this.get();
        var find = this.find(favorite);
        if (find) {
          Lampa.Storage.set('radio_favorite_stations', list);
        }
      }
    }, {
      key: "toggle",
      value: function toggle(favorite) {
        return this.find(favorite) ? this.remove(favorite) : this.add(favorite);
      }
    }]);
  }();

  function Player(station) {
    var html = Lampa.Template.js('radio_player');
    var audio = new Audio();
    var url = station.stream_320 ? station.stream_320 : station.stream_128 ? station.stream_128 : station.stream ? station.stream : station.stream_hls ? station.stream_hls.replace('playlist.m3u8', '96/playlist.m3u8') : '';
    var hls;
    audio.addEventListener("playing", function (event) {
      changeWave('play');
    });
    audio.addEventListener("waiting", function (event) {
      changeWave('loading');
    });
    var screenreset = setInterval(function () {
      Lampa.Screensaver.resetTimer();
    }, 1000);
    function prepare() {
      if (audio.canPlayType('application/vnd.apple.mpegurl') || url.indexOf('.aacp') > 0 || station.stream) load();else if (Hls.isSupported()) {
        try {
          hls = new Hls();
          hls.attachMedia(audio);
          hls.loadSource(url);
          hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR) {
              if (data.reason === "no EXTM3U delimiter") {
                Lampa.Noty.show(Lampa.Lang.translate('radio_load_error'));
              }
            }
          });
          hls.on(Hls.Events.MANIFEST_LOADED, function () {
            start();
          });
        } catch (e) {
          Lampa.Noty.show(Lampa.Lang.translate('radio_load_error'));
        }
      } else load();
    }
    function load() {
      audio.src = url;
      audio.load();
      start();
    }
    function start() {
      var playPromise;
      try {
        playPromise = audio.play();
      } catch (e) {}
      if (playPromise !== undefined) {
        playPromise.then(function () {
          console.log('Radio', 'start plaining');
          changeWave('play');
        })["catch"](function (e) {
          console.log('Radio', 'play promise error:', e.message);
        });
      }
    }
    function stop() {
      if (hls) {
        hls.destroy();
        hls = false;
      }
      audio.src = '';
    }
    function createWave() {
      var box = html.find('.radio-player__wave');
      for (var i = 0; i < 15; i++) {
        var div = document.createElement('div');
        box.append(div);
      }
      changeWave('loading');
    }
    function changeWave(class_name) {
      var lines = html.find('.radio-player__wave').querySelectorAll('div');
      for (var i = 0; i < lines.length; i++) {
        lines[i].removeClass('play loading').addClass(class_name);
        lines[i].style['animation-duration'] = (class_name == 'loading' ? 400 : 200 + Math.random() * 200) + 'ms';
        lines[i].style['animation-delay'] = (class_name == 'loading' ? Math.round(400 / lines.length * i) : 0) + 'ms';
      }
    }
    this.create = function () {
      var cover = Lampa.Template.js('radio_cover');
      cover.find('.radio-cover__title').text(station.title || '');
      cover.find('.radio-cover__tooltip').text(station.tooltip || '');
      var img_box = cover.find('.radio-cover__img-box');
      var img_elm = img_box.find('img');
      img_box.removeClass('loaded loaded-icon');
      img_elm.onload = function () {
        img_box.addClass('loaded');
      };
      img_elm.onerror = function () {
        img_elm.src = './img/icons/menu/movie.svg';
        img_box.addClass('loaded-icon');
      };
      img_elm.src = station.bg_image_mobile;
      html.find('.radio-player__cover').append(cover);
      html.find('.radio-player__close').on('click', function () {
        window.history.back();
      });
      document.body.append(html);
      createWave();
      prepare();
    };
    this.destroy = function () {
      stop();
      clearInterval(screenreset);
      html.remove();
    };
  }

  function Component() {
    var _this6 = this;
    var last,
      scroll,
      played,
      filtred = [],
      page = 0;
    var html = document.createElement('div');
    var img_bg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAZCAYAAABD2GxlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHASURBVHgBlZaLrsMgDENXxAf3/9XHFdXNZLm2YZHQymPk4CS0277v9+ffrut62nEcn/M8nzb69cxj6le1+75f/RqrZ9fatm3F9wwMR7yhawilNke4Gis/7j9srQbdaVFBnkcQ1WrfgmIIBcTrvgqqsKiTzvpOQbUnAykVW4VVqZXyyDllYFSKx9QaVrO7nGJIB63g+FAq/xhcHWBYdwCsmAtvFZUKE0MlVZWCT4idOlyhTp3K35R/6Nzlq0uBnsKWlEzgSh1VGJxv6rmpXMO7EK+XWUPnDFRWqitQFeY2UyZVryuWlI8ulLgGf19FooAUwC9gCWLcwzWPb7Wa60qdlZxjx6ooUuUqVQsK+y1VoAJyBeJAVsLJeYmg/RIXdG2kPhwYPBUQQyYF0XC8lwP3MTCrYAXB88556peCbUUZV7WccwkUQfCZC4PXdA5hKhSVhythZqjZM0J39w5m8BRadKAcrsIpNZsLIYdOqcZ9hExhZ1MH+QL+ciFzXzmYhZr/M6yUUwp2dp5U4naZDwAF5JRSefdScJZ3SkU0nl8xpaAy+7ml1EqvMXSs1HRrZ9bc3eZUSXmGa/mdyjbmqyX7A9RaYQa9IRJ0AAAAAElFTkSuQmCC';
    this.create = function () {
      var _this = this;
      this.activity.loader(true);
      Api.list().then(function (result) {
        _this.data = result.result;
        filtred = _this.data.stations;
        _this.build();
      })["catch"](function (e) {
        _this.data = {
          stations: []
        };
        _this.build();
      });
      return this.render();
    };
    this.background = function () {
      Lampa.Background.immediately(last ? last.background || img_bg : img_bg);
    };
    this.build = function () {
      var _this2 = this;
      html.append(Lampa.Template.js('radio_content'));
      scroll = new Lampa.Scroll({
        mask: true,
        over: true
      });
      scroll.onEnd = function () {
        page++;
        _this2.next();
      };
      html.find('.radio-content__list').append(scroll.render(true));
      html.find('.radio-content__cover').append(Lampa.Template.js('radio_cover'));
      scroll.minus(html.find('.radio-content__head'));
      this.buildCatalog();
      this.buildSearch();
      this.buildAdd();
      this.display();
      Lampa.Layer.update(html);
      this.activity.loader(false);
    };
    this.clearButtons = function (category, search) {
      var btn_catalog = html.find('.button--catalog');
      var btn_search = html.find('.button--search');
      btn_catalog.find('div').addClass('hide').text('');
      btn_search.find('div').addClass('hide').text('');
      if (category) {
        btn_catalog.find('div').removeClass('hide').text(category);
      } else {
        btn_search.find('div').removeClass('hide').text(search);
      }
    };
    this.buildCatalog = function () {
      var _this3 = this;
      var btn = html.find('.button--catalog');
      var items = [];
      var favs = Favorites.get().length;
      items.push({
        title: Lampa.Lang.translate('settings_input_links'),
        ghost: !favs,
        noenter: !favs,
        favorite: true
      });
      if (this.data.stations.length) {
        items.push({
          title: Lampa.Lang.translate('settings_param_jackett_interview_all'),
          all: true
        });
        this.data.genre.forEach(function (g) {
          items.push({
            title: g.name,
            id: g.id
          });
        });
      }
      if (favs) {
        filtred = Favorites.get();
        this.clearButtons(items[0].title, false);
      }
      btn.on('hover:enter', function () {
        Lampa.Select.show({
          title: Lampa.Lang.translate('title_catalog'),
          items: items,
          onSelect: function onSelect(a) {
            if (a.favorite) {
              filtred = Favorites.get();
            } else if (a.all) filtred = _this3.data.stations;else {
              filtred = _this3.data.stations.filter(function (s) {
                return s.genre.find(function (g) {
                  return g.id == a.id;
                });
              });
            }
            _this3.clearButtons(a.title, false);
            _this3.display();
          },
          onBack: function onBack() {
            Lampa.Controller.toggle('content');
          }
        });
      });
    };
    this.buildAdd = function () {
      var _this4 = this;
      var btn = html.find('.button--add');
      btn.on('hover:enter', function () {
        Lampa.Input.edit({
          title: Lampa.Lang.translate('radio_add_station'),
          free: true,
          nosave: true,
          nomic: true,
          value: ''
        }, function (url) {
          if (url) {
            Favorites.add({
              user: true,
              stream: url,
              title: Lampa.Lang.translate('radio_station')
            });
            filtred = Favorites.get();
            _this4.clearButtons(Lampa.Lang.translate('settings_input_links'), false);
            _this4.display();
          } else {
            Lampa.Controller.toggle('content');
          }
        });
      });
    };
    this.buildSearch = function () {
      var _this5 = this;
      var btn = html.find('.button--search');
      btn.on('hover:enter', function () {
        Lampa.Input.edit({
          free: true,
          nosave: true,
          nomic: true,
          value: ''
        }, function (val) {
          if (val) {
            val = val.toLowerCase();
            filtred = _this5.data.stations.filter(function (s) {
              return s.title.toLowerCase().indexOf(val) >= 0 || s.tooltip.toLowerCase().indexOf(val) >= 0;
            });
            _this5.clearButtons(false, val);
            _this5.display();
          } else {
            Lampa.Controller.toggle('content');
          }
        });
      });
    };
    this.display = function () {
      scroll.clear();
      scroll.reset();
      last = false;
      page = 0;
      this.cover({
        title: '',
        tooltip: ''
      });
      if (filtred.length) this.next();else {
        for (var i = 0; i < 3; i++) {
          var empty = Lampa.Template.js('radio_list_item');
          empty.addClass('empty--item');
          empty.style.opacity = 1 - 0.3 * i;
          scroll.append(empty);
        }
        Lampa.Layer.visible(scroll.render(true));
      }
      this.activity.toggle();
    };
    this.next = function () {
      var views = 10;
      var start = page * views;
      filtred.slice(start, start + views).forEach(_this6.append.bind(_this6));
      Lampa.Layer.visible(scroll.render(true));
    };
    this.play = function (station) {
      played = station;
      var player = new Player(station);
      player.create();
      document.body.addClass('ambience--enable');
      var move = function move(d) {
        var pos = filtred.indexOf(played) + d;
        if (pos >= 0 && pos <= filtred.length) {
          player.destroy();
          _this6.play(filtred[pos]);
        }
      };
      Lampa.Background.change(station.bg_image_mobile || img_bg);
      Lampa.Controller.add('content', {
        invisible: true,
        toggle: function toggle() {
          Lampa.Controller.clear();
        },
        back: function back() {
          document.body.removeClass('ambience--enable');
          player.destroy();
          _this6.activity.toggle();
        },
        up: function up() {
          move(-1);
        },
        down: function down() {
          move(1);
        }
      });
      Lampa.Controller.toggle('content');
    };
    this.append = function (station) {
      var _this7 = this;
      var item = Lampa.Template.js('radio_list_item');
      item.find('.radio-item__num').text((filtred.indexOf(station) + 1).pad(2));
      item.find('.radio-item__title').text(station.title);
      item.find('.radio-item__tooltip').text(station.tooltip || station.stream);
      item.background = station.bg_image_mobile || img_bg;
      var img_box = item.find('.radio-item__cover-box');
      var img_elm = item.find('img');
      img_elm.onload = function () {
        img_box.addClass('loaded');
      };
      img_elm.onerror = function () {
        img_elm.src = './img/icons/menu/movie.svg';
        img_box.addClass('loaded-icon');
      };
      img_elm.src = station.bg_image_mobile;
      item.on('hover:focus hover:hover', function () {
        _this7.cover(station);
        Lampa.Background.change(item.background);
        last = item;
      });
      item.on('hover:focus', function () {
        scroll.update(item);
      });
      item.on('hover:enter', function () {
        _this7.play(station);
      });
      item.on('hover:long', function () {
        if (station.user) {
          Lampa.Select.show({
            title: Lampa.Lang.translate('menu_settings'),
            items: [{
              title: Lampa.Lang.translate('extensions_change_name'),
              change: 'title'
            }, {
              title: Lampa.Lang.translate('extensions_change_link'),
              change: 'stream'
            }, {
              title: Lampa.Lang.translate('extensions_remove'),
              remove: true
            }],
            onSelect: function onSelect(a) {
              if (a.remove) {
                Favorites.remove(station);
                item.remove();
                last = false;
                Lampa.Controller.toggle('content');
              } else {
                Lampa.Input.edit({
                  free: true,
                  nosave: true,
                  nomic: true,
                  value: station[a.change] || ''
                }, function (val) {
                  if (val) {
                    station[a.change] = val;
                    Favorites.update(station);
                    _this7.cover(station);
                    item.find('.radio-item__' + (a.change == 'title' ? 'title' : 'tooltip')).text(val);
                  }
                  Lampa.Controller.toggle('content');
                });
              }
            },
            onBack: function onBack() {
              Lampa.Controller.toggle('content');
            }
          });
        } else {
          Favorites.toggle(station);
          item.toggleClass('favorite', Boolean(Favorites.find(station)));
        }
      });
      item.toggleClass('favorite', Boolean(Favorites.find(station)));
      if (!last) last = item;
      if (Lampa.Controller.own(this)) Lampa.Controller.collectionAppend(item);
      scroll.append(item);
    };
    this.cover = function (station) {
      html.find('.radio-cover__title').text(station.title || '');
      html.find('.radio-cover__tooltip').text(station.tooltip || '');
      var img_box = html.find('.radio-cover__img-box');
      var img_elm = img_box.find('img');
      img_box.removeClass('loaded loaded-icon');
      img_elm.onload = function () {
        img_box.addClass('loaded');
      };
      img_elm.onerror = function () {
        img_elm.src = './img/icons/menu/movie.svg';
        img_box.addClass('loaded-icon');
      };
      img_elm.src = station.bg_image_mobile;
    };
    this.start = function () {
      if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;
      this.background();
      Lampa.Controller.add('content', {
        link: this,
        invisible: true,
        toggle: function toggle() {
          Lampa.Controller.collectionSet(html);
          Lampa.Controller.collectionFocus(last, html);
        },
        left: function left() {
          if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
        },
        right: function right() {
          Navigator.move('right');
        },
        up: function up() {
          if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
        },
        down: function down() {
          Navigator.move('down');
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
      if (scroll) scroll.destroy();
      html.remove();
    };
  }

  function startPlugin() {
    window.plugin_record_ready = true;
    Lampa.Lang.add({
      radio_station: {
        ru: 'Радиостанция',
        en: 'Radio station',
        uk: 'Радіостанція',
        be: 'Радыёстанцыя',
        zh: '广播电台',
        pt: 'Estação de rádio',
        bg: 'Радиостанция'
      },
      radio_add_station: {
        ru: 'Введите адрес радиостанции',
        en: 'Enter the address of the radio station',
        uk: 'Введіть адресу радіостанції',
        be: 'Увядзіце адрас радыёстанцыі',
        zh: '输入电台地址',
        pt: 'Digite o endereço da estação de rádio',
        bg: 'Въведете адреса на радиостанцията'
      },
      radio_load_error: {
        ru: 'Ошибка в загрузке потока',
        en: 'Error in stream loading',
        uk: 'Помилка завантаження потоку',
        be: 'Памылка ў загрузцы патоку',
        zh: '流加载错误',
        pt: 'Erro ao carregar a transmissão',
        bg: 'Грешка при зареждане на потока'
      }
    });
    var manifest = {
      type: 'audio',
      version: '1.1.1',
      name: Lampa.Lang.translate('radio_station'),
      description: '',
      component: 'radio'
    };
    Lampa.Manifest.plugins = manifest;
    Lampa.Template.add('radio_content', "\n        <div class=\"radio-content\">\n            <div class=\"radio-content__head\">\n                <div class=\"simple-button simple-button--invisible simple-button--filter selector button--catalog\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" xml:space=\"preserve\">\n                        <path fill=\"currentColor\" d=\"M478.354,146.286H33.646c-12.12,0-21.943,9.823-21.943,21.943v321.829c0,12.12,9.823,21.943,21.943,21.943h444.709\n                            c12.12,0,21.943-9.823,21.943-21.943V168.229C500.297,156.109,490.474,146.286,478.354,146.286z M456.411,468.114H55.589V190.171\n                            h400.823V468.114z\"/>\n                        <path fill=\"currentColor\" d=\"M441.783,73.143H70.217c-12.12,0-21.943,9.823-21.943,21.943c0,12.12,9.823,21.943,21.943,21.943h371.566\n                            c12.12,0,21.943-9.823,21.943-21.943C463.726,82.966,453.903,73.143,441.783,73.143z\"/>\n                        <path fill=\"currentColor\" d=\"M405.211,0H106.789c-12.12,0-21.943,9.823-21.943,21.943c0,12.12,9.823,21.943,21.943,21.943h298.423\n                            c12.12,0,21.943-9.823,21.943-21.943C427.154,9.823,417.331,0,405.211,0z\"/>\n                    </svg>\n                    <div class=\"hide\"></div>\n                </div>\n                <div class=\"simple-button simple-button--invisible simple-button--filter selector button--add\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\"  viewBox=\"0 0 512 512\" xml:space=\"preserve\">\n                        <path d=\"M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.853 256-256S397.167 0 256 0zm0 472.341c-119.275 0-216.341-97.046-216.341-216.341S136.725 39.659 256 39.659 472.341 136.705 472.341 256 375.295 472.341 256 472.341z\" fill=\"currentColor\"></path>\n                        <path d=\"M355.148 234.386H275.83v-79.318c0-10.946-8.864-19.83-19.83-19.83s-19.83 8.884-19.83 19.83v79.318h-79.318c-10.966 0-19.83 8.884-19.83 19.83s8.864 19.83 19.83 19.83h79.318v79.318c0 10.946 8.864 19.83 19.83 19.83s19.83-8.884 19.83-19.83v-79.318h79.318c10.966 0 19.83-8.884 19.83-19.83s-8.864-19.83-19.83-19.83z\" fill=\"currentColor\"></path>\n                    </svg>\n                </div>\n                <div class=\"simple-button simple-button--invisible simple-button--filter selector button--search\">\n                    <svg width=\"23\" height=\"22\" viewBox=\"0 0 23 22\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\">\n                        <circle cx=\"9.9964\" cy=\"9.63489\" r=\"8.43556\" stroke=\"currentColor\" stroke-width=\"2.4\"></circle>\n                        <path d=\"M20.7768 20.4334L18.2135 17.8701\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"></path>\n                    </svg>\n                    <div class=\"hide\"></div>\n                </div>\n            </div>\n            <div class=\"radio-content__body\">\n                <div class=\"radio-content__list\"></div>\n                <div class=\"radio-content__cover\"></div>\n            </div>\n        </div>\n    ");
    Lampa.Template.add('radio_cover', "\n        <div class=\"radio-cover\">\n            <div class=\"radio-cover__img-container\">\n                <div class=\"radio-cover__img-box\">\n                    <img src=\"https://www.radiorecord.ru/upload/iblock/507/close-up-image-fresh-spring-green-grass1.jpg\" />\n                </div>\n            </div>\n\n            <div class=\"radio-cover__title\"></div>\n            <div class=\"radio-cover__tooltip\"></div>\n        </div>\n    ");
    Lampa.Template.add('radio_list_item', "\n        <div class=\"radio-item selector layer--visible\">\n            <div class=\"radio-item__num\"></div>\n            <div class=\"radio-item__cover\">\n                <div class=\"radio-item__cover-box\">\n                    <img />\n                </div>\n            </div>\n            <div class=\"radio-item__body\">\n                <div class=\"radio-item__title\"></div>\n                <div class=\"radio-item__tooltip\"></div>\n            </div>\n            <div class=\"radio-item__icons\">\n                <div class=\"radio-item__icon-favorite\">\n                    <svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 477.534 477.534\" xml:space=\"preserve\">\n                        <path fill=\"currentColor\" d=\"M438.482,58.61c-24.7-26.549-59.311-41.655-95.573-41.711c-36.291,0.042-70.938,15.14-95.676,41.694l-8.431,8.909\n                            l-8.431-8.909C181.284,5.762,98.662,2.728,45.832,51.815c-2.341,2.176-4.602,4.436-6.778,6.778\n                            c-52.072,56.166-52.072,142.968,0,199.134l187.358,197.581c6.482,6.843,17.284,7.136,24.127,0.654\n                            c0.224-0.212,0.442-0.43,0.654-0.654l187.29-197.581C490.551,201.567,490.551,114.77,438.482,58.61z M413.787,234.226h-0.017\n                            L238.802,418.768L63.818,234.226c-39.78-42.916-39.78-109.233,0-152.149c36.125-39.154,97.152-41.609,136.306-5.484\n                            c1.901,1.754,3.73,3.583,5.484,5.484l20.804,21.948c6.856,6.812,17.925,6.812,24.781,0l20.804-21.931\n                            c36.125-39.154,97.152-41.609,136.306-5.484c1.901,1.754,3.73,3.583,5.484,5.484C453.913,125.078,454.207,191.516,413.787,234.226\n                            z\"/>\n                    </svg>\n                </div>\n                <div class=\"radio-item__icon-play\">\n                    <svg width=\"22\" height=\"25\" viewBox=\"0 0 22 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                        <path d=\"M21 10.7679C22.3333 11.5377 22.3333 13.4622 21 14.232L3.75 24.1913C2.41666 24.9611 0.75 23.9989 0.75 22.4593L0.750001 2.5407C0.750001 1.0011 2.41667 0.0388526 3.75 0.808653L21 10.7679Z\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n            </div>\n        </div>\n    ");
    Lampa.Template.add('radio_player', "\n        <div class=\"radio-player\">\n            <div>\n                <div class=\"radio-player__cover\"></div>\n                <div class=\"radio-player__wave\"></div>\n            </div>\n            <div class=\"radio-player__close\">\n                <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 329.269 329\" xml:space=\"preserve\">\n                    <path d=\"M194.8 164.77 323.013 36.555c8.343-8.34 8.343-21.825 0-30.164-8.34-8.34-21.825-8.34-30.164 0L164.633 134.605 36.422 6.391c-8.344-8.34-21.824-8.34-30.164 0-8.344 8.34-8.344 21.824 0 30.164l128.21 128.215L6.259 292.984c-8.344 8.34-8.344 21.825 0 30.164a21.266 21.266 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25l128.21-128.214 128.216 128.214a21.273 21.273 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25 8.343-8.34 8.343-21.824 0-30.164zm0 0\" fill=\"currentColor\"></path>\n                </svg>\n            </div>\n        </div>\n    ");
    Lampa.Template.add('radio_style', "\n        <style>\n        .radio-content{padding:0 1.5em}.radio-content__head{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;padding:1.5em 0}.radio-content__body{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}.radio-content__list{width:60%}@media screen and (max-width:576px){.radio-content__list{width:100%}}.radio-content__cover{width:40%;padding:0 2em}@media screen and (max-width:576px){.radio-content__cover{display:none}}.radio-cover{text-align:center;line-height:1.4}.radio-cover__img-container{max-width:20em;margin:0 auto}.radio-cover__img-box{position:relative;padding-bottom:100%;background-color:rgba(0,0,0,0.3);-webkit-border-radius:1em;border-radius:1em}.radio-cover__img-box>img{position:absolute;top:0;left:0;width:100%;height:100%;-webkit-border-radius:1em;border-radius:1em;opacity:0}.radio-cover__img-box.loaded{background-color:transparent}.radio-cover__img-box.loaded>img{opacity:1}.radio-cover__img-box.loaded-icon{background-color:rgba(0,0,0,0.3)}.radio-cover__img-box.loaded-icon>img{left:20%;top:20%;width:60%;height:60%;opacity:.2}.radio-cover__title{font-weight:700;font-size:1.5em;margin-top:1em}.radio-cover__tooltip{font-weight:300;font-size:1.3em;margin-top:.2em}.radio-item{padding:1em;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;line-height:1.4}.radio-item__num{font-weight:700;margin-right:1em;font-size:1.3em;opacity:.4;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}@media screen and (max-width:400px){.radio-item__num{display:none}}.radio-item__body{max-width:60%}.radio-item__cover{width:5em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;margin-right:2em}.radio-item__cover-box{position:relative;padding-bottom:100%;background-color:rgba(0,0,0,0.3);-webkit-border-radius:1em;border-radius:1em}.radio-item__cover-box>img{position:absolute;top:0;left:0;width:100%;height:100%;-webkit-border-radius:1em;border-radius:1em;opacity:0}.radio-item__cover-box.loaded{background-color:transparent}.radio-item__cover-box.loaded>img{opacity:1}.radio-item__cover-box.loaded-icon{background-color:rgba(0,0,0,0.3)}.radio-item__cover-box.loaded-icon>img{left:20%;top:20%;width:60%;height:60%;opacity:.2}.radio-item__title{font-weight:700;font-size:1.2em}.radio-item__tooltip{opacity:.5;margin-top:.5em;font-size:1.1em}.radio-item__icons{margin-left:auto;padding-left:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}.radio-item__icons svg{width:1.4em !important;height:1.4em !important}.radio-item__icons>*+*{margin-left:1.5em}.radio-item__icons .radio-item__icon-favorite{display:none}.radio-item__icons .radio-item__icon-play{display:none}.radio-item.focus{background:#fff;color:#000;-webkit-border-radius:1em;border-radius:1em}.radio-item.focus .radio-item__icon-play{display:block}.radio-item.favorite .radio-item__icon-favorite{display:block}.radio-item.empty--item .radio-item__title,.radio-item.empty--item .radio-item__num,.radio-item.empty--item .radio-item__tooltip{background-color:rgba(255,255,255,0.3);height:1.2em;-webkit-border-radius:.3em;border-radius:.3em}.radio-item.empty--item .radio-item__num{width:1.4em}.radio-item.empty--item .radio-item__title{width:7em}.radio-item.empty--item .radio-item__tooltip{width:16em}.radio-item.empty--item .radio-item__icons{display:none}.radio-item.empty--item .radio-item__cover-box{background-color:rgba(255,255,255,0.3)}.radio-item.empty--item.focus{background-color:transparent;color:#fff}.radio-player{position:fixed;z-index:100;left:0;top:0;width:100%;height:100%;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center}.radio-player__cover{width:30em}.radio-player__wave{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;margin-top:2em}.radio-player__wave>div{width:2px;background-color:#fff;margin:0 .3em;height:1em;opacity:0}.radio-player__wave>div.loading{-webkit-animation:radioAnimationWaveLoading 400ms ease infinite;-o-animation:radioAnimationWaveLoading 400ms ease infinite;animation:radioAnimationWaveLoading 400ms ease infinite}.radio-player__wave>div.play{-webkit-animation:radioAnimationWavePlay 50ms linear infinite alternate;-o-animation:radioAnimationWavePlay 50ms linear infinite alternate;animation:radioAnimationWavePlay 50ms linear infinite alternate}.radio-player__close{position:fixed;top:1.5em;right:50%;margin-right:-2em;-webkit-border-radius:100%;border-radius:100%;padding:1em;display:none;background-color:rgba(255,255,255,0.1)}.radio-player__close>svg{width:1.5em;height:1.5em}body.true--mobile .radio-player__close{display:block}@-webkit-keyframes radioAnimationWaveLoading{0%{-webkit-transform:scale3d(1,0.3,1);transform:scale3d(1,0.3,1);opacity:1}10%{-webkit-transform:scale3d(1,1.5,1);transform:scale3d(1,1.5,1);opacity:1}20%{-webkit-transform:scale3d(1,0.3,1);transform:scale3d(1,0.3,1);opacity:1}100%{-webkit-transform:scale3d(1,0.3,1);transform:scale3d(1,0.3,1);opacity:1}}@-o-keyframes radioAnimationWaveLoading{0%{transform:scale3d(1,0.3,1);opacity:1}10%{transform:scale3d(1,1.5,1);opacity:1}20%{transform:scale3d(1,0.3,1);opacity:1}100%{transform:scale3d(1,0.3,1);opacity:1}}@keyframes radioAnimationWaveLoading{0%{-webkit-transform:scale3d(1,0.3,1);transform:scale3d(1,0.3,1);opacity:1}10%{-webkit-transform:scale3d(1,1.5,1);transform:scale3d(1,1.5,1);opacity:1}20%{-webkit-transform:scale3d(1,0.3,1);transform:scale3d(1,0.3,1);opacity:1}100%{-webkit-transform:scale3d(1,0.3,1);transform:scale3d(1,0.3,1);opacity:1}}@-webkit-keyframes radioAnimationWavePlay{0%{-webkit-transform:scale3d(1,0.3,1);transform:scale3d(1,0.3,1);opacity:.3}100%{-webkit-transform:scale3d(1,2,1);transform:scale3d(1,2,1);opacity:1}}@-o-keyframes radioAnimationWavePlay{0%{transform:scale3d(1,0.3,1);opacity:.3}100%{transform:scale3d(1,2,1);opacity:1}}@keyframes radioAnimationWavePlay{0%{-webkit-transform:scale3d(1,0.3,1);transform:scale3d(1,0.3,1);opacity:.3}100%{-webkit-transform:scale3d(1,2,1);transform:scale3d(1,2,1);opacity:1}}\n        </style>\n    ");
    function add() {
      var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg width=\"38\" height=\"31\" viewBox=\"0 0 38 31\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect x=\"17.613\" width=\"3\" height=\"16.3327\" rx=\"1.5\" transform=\"rotate(63.4707 17.613 0)\" fill=\"currentColor\"/>\n                    <circle cx=\"13\" cy=\"19\" r=\"6\" fill=\"currentColor\"/>\n                    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M0 11C0 8.79086 1.79083 7 4 7H34C36.2091 7 38 8.79086 38 11V27C38 29.2091 36.2092 31 34 31H4C1.79083 31 0 29.2091 0 27V11ZM21 19C21 23.4183 17.4183 27 13 27C8.58173 27 5 23.4183 5 19C5 14.5817 8.58173 11 13 11C17.4183 11 21 14.5817 21 19ZM30.5 18C31.8807 18 33 16.8807 33 15.5C33 14.1193 31.8807 13 30.5 13C29.1193 13 28 14.1193 28 15.5C28 16.8807 29.1193 18 30.5 18Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"menu__text\">".concat(manifest.name, "</div>\n        </li>"));
      button.on('hover:enter', function () {
        Lampa.Activity.push({
          url: '',
          title: manifest.name,
          component: 'radio',
          page: 1
        });
      });
      $('.menu .menu__list').eq(0).append(button);
      $('body').append(Lampa.Template.get('radio_style', {}, true));
    }
    Lampa.Component.add('radio', Component);
    if (window.appready) add();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') add();
      });
    }
  }
  if (!window.plugin_record_ready) startPlugin();

})();
