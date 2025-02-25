(function () {
    'use strict';

    function videocdn(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var results = [];
      var object = _object;
      var select_title = '';
      var get_links_wait = false;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        voice_name: '',
        voice_id: 0
      };

      /**
       * Начать поиск
       * @param {Object} _object 
       */
      this.search = function (_object, data) {
        object = _object;
        select_title = object.movie.title;
        get_links_wait = true;
        var url = component.proxy('videocdn') + 'http://cdn.svetacdn.in/api/';
        var itm = data[0];
        var type = itm.iframe_src.split('/').slice(-2)[0];
        if (type == 'movie') type = 'movies';
        url += type;
        url = Lampa.Utils.addUrlComponent(url, 'api_token=3i40G5TSECmLF77oAqnEgbx61ZWaOYaE');
        url = Lampa.Utils.addUrlComponent(url, itm.imdb_id ? 'imdb_id=' + encodeURIComponent(itm.imdb_id) : 'title=' + encodeURIComponent(itm.title));
        url = Lampa.Utils.addUrlComponent(url, 'field=' + encodeURIComponent('global'));
        network.silent(url, function (found) {
          results = found.data.filter(function (elem) {
            return elem.id == itm.id;
          });
          success(results);
          component.loading(false);
          if (!results.length) component.emptyForQuery(select_title);
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        });
      };
      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };

      /**
       * Сброс фильтра
       */
      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: 0,
          voice_name: '',
          voice_id: 0
        };
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Применить фильтр
       * @param {*} type 
       * @param {*} a 
       * @param {*} b 
       */
      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        if (a.stype == 'voice') {
          choice.voice_name = filter_items.voice[b.index];
          choice.voice_id = filter_items.voice_info[b.index] && filter_items.voice_info[b.index].id;
        }
        component.reset();
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Уничтожить
       */
      this.destroy = function () {
        network.clear();
        results = null;
      };

      /**
       * Успешно, есть данные
       * @param {Object} json 
       */
      function success(json) {
        results = json;
        extractData(json);
        filter();
        append(filtred());
      }
      function extractItems(str, max_quality) {
        try {
          var items = str.split(',').map(function (item) {
            return {
              quality: parseInt(item.match(/\[(\d+)p\]/)[1]),
              file: 'http:' + item.replace(/\[\d+p\]/, '').split(' or ')[0]
            };
          }).filter(function (item) {
            return item.quality <= max_quality;
          });
          items.sort(function (a, b) {
            return b.quality - a.quality;
          });
          return items;
        } catch (e) {}
        return [];
      }

      /**
       * Получить информацию о фильме
       * @param {Arrays} results 
       */
      function extractData(results) {
        network.timeout(20000);
        var movie = results.slice(0, 1)[0];
        extract = {};
        if (movie) {
          var src = movie.iframe_src;
          network["native"]('http:' + src, function (raw) {
            get_links_wait = false;
            component.render().find('.broadcast__scan').remove();
            var math = raw.replace(/\n/g, '').match(/id="files" value="(.*?)"/);
            if (math) {
              var json = Lampa.Arrays.decodeJson(math[1].replace(/&quot;/g, '"'), {});
              var text = document.createElement("textarea");
              var _loop = function _loop(i) {
                var _movie$media;
                if (0 === i - 0) {
                  return 1; // continue
                }
                text.innerHTML = json[i];
                Lampa.Arrays.decodeJson(text.value, {});
                var max_quality = (_movie$media = movie.media) === null || _movie$media === void 0 || (_movie$media = _movie$media.filter(function (obj) {
                  return obj.translation_id === i - 0;
                })[0]) === null || _movie$media === void 0 ? void 0 : _movie$media.max_quality;
                if (!max_quality) {
                  var _movie$translations;
                  max_quality = (_movie$translations = movie.translations) === null || _movie$translations === void 0 || (_movie$translations = _movie$translations.filter(function (obj) {
                    return obj.id === i - 0;
                  })[0]) === null || _movie$translations === void 0 ? void 0 : _movie$translations.max_quality;
                }
                extract[i] = {
                  json: Lampa.Arrays.decodeJson(text.value, {}),
                  //file: extractFile(json[i], max_quality)
                  items: extractItems(json[i], max_quality)
                };
                for (var a in extract[i].json) {
                  var elem = extract[i].json[a];
                  if (elem.folder) {
                    for (var f in elem.folder) {
                      var folder = elem.folder[f];

                      //folder.file = extractFile(folder.file, max_quality)
                      folder.items = extractItems(folder.file, max_quality);
                    }
                  }
                  //else elem.file = extractFile(elem.file, max_quality)
                  else elem.items = extractItems(elem.file, max_quality);
                }
              };
              for (var i in json) {
                if (_loop(i)) continue;
              }
            }
          }, function () {
            get_links_wait = false;
            component.render().find('.broadcast__scan').remove();
          }, false, {
            dataType: 'text'
          });
        }
      }

      /**
       * Найти поток
       * @param {Object} element 
       * @param {Int} max_quality
       * @returns string
       */
      function getFile(element, max_quality) {
        var translat = extract[element.translation];
        var id = element.season + '_' + element.episode;
        var file = '';
        var items = [];
        var quality = false;
        if (translat) {
          if (element.season) {
            for (var i in translat.json) {
              var elem = translat.json[i];
              if (elem.folder) {
                for (var f in elem.folder) {
                  var folder = elem.folder[f];
                  if (folder.id == id) {
                    //file = folder.file
                    items = folder.items;
                    break;
                  }
                }
              } else if (elem.id == id) {
                //file = elem.file
                items = elem.items;
                break;
              }
            }
          } else {
            //file = translat.file
            items = translat.items;
          }
        }
        max_quality = parseInt(max_quality);

        /*
        if(file){
            let path = file.slice(0, file.lastIndexOf('/')) + '/'
             if(file.split('/').pop().replace('.mp4','') !== max_quality){
                file = path + max_quality + '.mp4'
            }
             quality = {}
             let mass = [1080,720,480,360]
                mass = mass.slice(mass.indexOf(max_quality))
                 mass.forEach((n)=>{
                    quality[n + 'p'] = path + n + '.mp4'
                })
            
            let preferably = Lampa.Storage.get('video_quality_default','1080') + 'p'
            
            if(quality[preferably]) file = quality[preferably]
        }
        */

        if (items && items.length) {
          quality = {};
          var mass = [1080, 720, 480, 360];
          mass = mass.slice(mass.indexOf(max_quality));
          mass.forEach(function (n) {
            var exes = items.find(function (a) {
              return a.quality == n;
            });
            if (exes) {
              if (!file) file = exes.file;
              quality[n + 'p'] = exes.file;
            }
          });
          var preferably = Lampa.Storage.get('video_quality_default', '1080') + 'p';
          if (quality[preferably]) file = quality[preferably];
        }
        return {
          file: file,
          quality: quality
        };
      }

      /**
       * Построить фильтр
       */
      function filter() {
        filter_items = {
          season: [],
          voice: [],
          voice_info: []
        };
        results.slice(0, 1).forEach(function (movie) {
          if (movie.season_count) {
            var s = movie.season_count;
            while (s--) {
              filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (movie.season_count - s));
            }
          }
          if (filter_items.season.length) {
            movie.episodes.forEach(function (episode) {
              if (episode.season_num == choice.season + 1) {
                episode.media.forEach(function (media) {
                  if (!filter_items.voice_info.find(function (v) {
                    return v.id == media.translation.id;
                  })) {
                    filter_items.voice.push(media.translation.shorter_title);
                    filter_items.voice_info.push({
                      id: media.translation.id
                    });
                  }
                });
              }
            });
          }
        });
        if (choice.voice_name) {
          var inx = -1;
          if (choice.voice_id) {
            var voice = filter_items.voice_info.find(function (v) {
              return v.id == choice.voice_id;
            });
            if (voice) inx = filter_items.voice_info.indexOf(voice);
          }
          if (inx == -1) inx = filter_items.voice.indexOf(choice.voice_name);
          if (inx == -1) choice.voice = 0;else if (inx !== choice.voice) {
            choice.voice = inx;
          }
        }
        component.filter(filter_items, choice);
      }

      /**
       * Отфильтровать файлы
       * @returns array
       */
      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');
        if (object.movie.number_of_seasons) {
          results.slice(0, 1).forEach(function (movie) {
            movie.episodes.forEach(function (episode) {
              if (episode.season_num == filter_data.season + 1) {
                var temp = episode.media.map(function (m) {
                  return m;
                });
                var unique = [];
                temp.sort(function (a, b) {
                  return b.max_quality - a.max_quality;
                });
                temp.forEach(function (m) {
                  if (!unique.find(function (a) {
                    return a.translation.id == m.translation.id;
                  })) {
                    unique.push(m);
                  }
                });
                episode.media.forEach(function (media) {
                  if (media.translation.id == filter_items.voice_info[filter_data.voice].id && unique.indexOf(media) !== -1) {
                    filtred.push({
                      episode: parseInt(episode.num),
                      season: episode.season_num,
                      title: episode.num + ' - ' + episode.ru_title,
                      quality: media.max_quality + 'p',
                      translation: media.translation_id
                    });
                  }
                });
              }
            });
          });
        } else {
          results.slice(0, 1).forEach(function (movie) {
            movie.media.forEach(function (element) {
              filtred.push({
                title: element.translation.title,
                quality: element.max_quality + 'p' + (element.source_quality ? ' - ' + element.source_quality.toUpperCase() : ''),
                translation: element.translation_id
              });
            });
          });
        }
        return filtred;
      }

      /**
       * Добавить видео
       * @param {Array} items 
       */
      function append(items) {
        component.reset();
        if (get_links_wait) component.append($('<div class="broadcast__scan"><div></div></div>'));
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element) {
          if (element.season) element.title = 'S' + element.season + ' / ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.title;
          element.info = element.season ? ' / ' + filter_items.voice[choice.voice] : '';
          if (element.season) {
            element.translate_episode_end = last_episode;
            element.translate_voice = filter_items.voice[choice.voice];
          }
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
          item.addClass('video--stream');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));
          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }
          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            var extra = getFile(element, element.quality);
            if (extra.file) {
              var playlist = [];
              var first = {
                url: extra.file,
                quality: extra.quality,
                timeline: view,
                title: element.season ? element.title : object.movie.title + ' / ' + element.title
              };
              if (element.season) {
                items.forEach(function (elem) {
                  var ex = getFile(elem, elem.quality);
                  playlist.push({
                    title: elem.title,
                    url: ex.file,
                    quality: ex.quality,
                    timeline: elem.timeline
                  });
                });
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);
              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            } else Lampa.Noty.show(Lampa.Lang.translate(get_links_wait ? 'online_waitlink' : 'online_nolink'));
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            element: element,
            file: function file(call) {
              call(getFile(element, element.quality));
            }
          });
        });
        component.start(true);
      }
    }

    function rezka(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var embed = component.proxy('rezka') + 'https://voidboost.net/';
      var object = _object;
      var select_title = '';
      var select_id = '';
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        voice_name: ''
      };

      /**
       * Поиск
       * @param {Object} _object 
       */
      this.search = function (_object, kinopoisk_id) {
        object = _object;
        select_id = kinopoisk_id;
        select_title = object.movie.title;
        getFirstTranlate(kinopoisk_id, function (voice) {
          getFilm(kinopoisk_id, voice);
        });
      };
      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };

      /**
       * Сброс фильтра
       */
      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: 0,
          voice_name: ''
        };
        component.loading(true);
        getFilm(select_id);
        component.saveChoice(choice);
      };

      /**
       * Применить фильтр
       * @param {*} type 
       * @param {*} a 
       * @param {*} b 
       */
      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index];
        component.reset();
        filter();
        component.loading(true);
        getFilm(select_id, extract.voice[choice.voice].token);
        component.saveChoice(choice);
        setTimeout(component.closeFilter, 10);
      };

      /**
       * Уничтожить
       */
      this.destroy = function () {
        network.clear();
        extract = null;
      };
      function getSeasons(voice, call) {
        var url = embed + 'serial/' + voice + '/iframe?h=gidonline.io';
        network.clear();
        network.timeout(10000);
        network["native"](url, function (str) {
          extractData(str);
          call();
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
      }
      function getFirstTranlate(id, call) {
        network.clear();
        network.timeout(10000);
        network["native"](embed + 'embed/' + id + '?s=1', function (str) {
          extractData(str);
          if (extract.voice.length) call(extract.voice[0].token);else component.emptyForQuery(select_title);
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
      }
      function getEmbed(url) {
        network.clear();
        network.timeout(10000);
        network["native"](url, function (str) {
          component.loading(false);
          extractData(str);
          filter();
          append();
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
      }

      /**
       * Запросить фильм
       * @param {Int} id 
       * @param {String} voice 
       */
      function getFilm(id, voice) {
        network.clear();
        network.timeout(10000);
        var url = embed;
        if (voice) {
          if (extract.season.length) {
            var ses = extract.season[Math.min(extract.season.length - 1, choice.season)].id;
            url += 'serial/' + voice + '/iframe?s=' + ses + '&h=gidonline.io';
            return getSeasons(voice, function () {
              var check = extract.season.filter(function (s) {
                return s.id == ses;
              });
              if (!check.length) {
                choice.season = extract.season.length - 1;
                url = embed + 'serial/' + voice + '/iframe?s=' + extract.season[Math.min(extract.season.length - 1, choice.season)].id + '&h=gidonline.io';
              }
              getEmbed(url);
            });
          } else {
            url += 'movie/' + voice + '/iframe?h=gidonline.io';
            getEmbed(url);
          }
        } else {
          url += 'embed/' + id;
          url += '?s=1';
          getEmbed(url);
        }
      }

      /**
       * Построить фильтр
       */
      function filter() {
        filter_items = {
          season: extract.season.map(function (v) {
            return v.name;
          }),
          voice: extract.season.length ? extract.voice.map(function (v) {
            return v.name;
          }) : []
        };
        if (choice.voice_name) {
          var inx = filter_items.voice.indexOf(choice.voice_name);
          if (inx == -1) choice.voice = 0;else if (inx !== choice.voice) {
            choice.voice = inx;
          }
        }
        component.filter(filter_items, choice);
      }
      function parseSubtitles(str) {
        var subtitle = str.match("subtitle': '(.*?)'");
        if (subtitle) {
          var index = -1;
          return subtitle[1].split(',').map(function (sb) {
            var sp = sb.split(']');
            index++;
            return {
              label: sp[0].slice(1),
              url: sp.pop(),
              index: index
            };
          });
        }
      }

      /**
       * Получить поток
       * @param {*} element 
       */
      function getStream(element, call, error) {
        if (element.stream) return call(element.stream);
        var url = embed;
        if (element.season) {
          url += 'serial/' + extract.voice[choice.voice].token + '/iframe?s=' + element.season + '&e=' + element.episode + '&h=gidonline.io';
        } else {
          url += 'movie/' + element.voice.token + '/iframe?h=gidonline.io';
        }
        network.clear();
        network.timeout(3000);
        network["native"](url, function (str) {
          var videos = str.match("file': '(.*?)'");
          if (videos) {
            var video = decode(videos[1]),
              qused = '',
              first = '',
              mass = ['2160p', '1440p', '1080p Ultra', '1080p', '720p', '480p', '360p'];

            //ухня тут происходит, хрен знает почему после .join() возврошает только последнию ссылку
            video = video.slice(1).split(/,\[/).map(function (s) {
              return s.split(']')[0] + ']' + (s.indexOf(' or ') > -1 ? s.split(' or').pop().trim() : s.split(']').pop());
            }).join('[');
            element.qualitys = {};
            var preferably = Lampa.Storage.get('video_quality_default', '1080');
            mass.forEach(function (n) {
              var link = video.match(new RegExp(n + "](.*?)mp4"));
              if (link) {
                if (!first) first = link[1] + 'mp4';
                element.qualitys[n] = link[1] + 'mp4';
                if (n.indexOf(preferably) >= 0) {
                  qused = link[1] + 'mp4';
                  first = qused;
                }
              }
            });
            if (!first) element.qualitys = false;
            if (first) {
              element.stream = qused || first;
              element.subtitles = parseSubtitles(str);
              call(element.stream);
            } else error();
          } else error();
        }, error, false, {
          dataType: 'text'
        });
      }
      function decode(data) {
        function product(iterables, repeat) {
          var argv = Array.prototype.slice.call(arguments),
            argc = argv.length;
          if (argc === 2 && !isNaN(argv[argc - 1])) {
            var copies = [];
            for (var i = 0; i < argv[argc - 1]; i++) {
              copies.push(argv[0].slice()); // Clone
            }
            argv = copies;
          }
          return argv.reduce(function tl(accumulator, value) {
            var tmp = [];
            accumulator.forEach(function (a0) {
              value.forEach(function (a1) {
                tmp.push(a0.concat(a1));
              });
            });
            return tmp;
          }, [[]]);
        }
        function unite(arr) {
          var _final = [];
          arr.forEach(function (e) {
            _final.push(e.join(""));
          });
          return _final;
        }
        var trashList = ["@", "#", "!", "^", "$"];
        var two = unite(product(trashList, 2));
        var tree = unite(product(trashList, 3));
        var trashCodesSet = two.concat(tree);
        var arr = data.replace("#h", "").split("//_//");
        var trashString = arr.join('');
        trashCodesSet.forEach(function (i) {
          trashString = trashString.replace(new RegExp(btoa(i), 'g'), '');
        });
        var result = '';
        try {
          result = atob(trashString.substr(2));
        } catch (e) {}
        return result;
      }

      /*
      function decode(x){
          let file = x.replace('JCQkIyMjIyEhISEhISE=', '')
              .replace('QCMhQEBAIyMkJEBA', '')
              .replace('QCFeXiFAI0BAJCQkJCQ=', '')
              .replace('Xl4jQEAhIUAjISQ=', '')
              .replace('Xl5eXl5eIyNAzN2FkZmRm', '')
              .split('//_//')
              .join('')
              .substr(2)
          try {
              return atob(file)
          } catch (e){
              console.log("Encrypt error: ", file)
              return ''
          }
      }
      */

      /**
       * Получить данные о фильме
       * @param {String} str 
       */
      function extractData(str) {
        extract.voice = [];
        extract.season = [];
        extract.episode = [];
        str = str.replace(/\n/g, '');
        var voices = str.match('<select name="translator"[^>]+>(.*?)</select>');
        var sesons = str.match('<select name="season"[^>]+>(.*?)</select>');
        var episod = str.match('<select name="episode"[^>]+>(.*?)</select>');
        if (sesons) {
          var select = $('<select>' + sesons[1] + '</select>');
          $('option', select).each(function () {
            extract.season.push({
              id: $(this).attr('value'),
              name: $(this).text()
            });
          });
        }
        if (voices) {
          var _select = $('<select>' + voices[1] + '</select>');
          $('option', _select).each(function () {
            var token = $(this).attr('data-token');
            if (token) {
              extract.voice.push({
                token: token,
                name: $(this).text(),
                id: $(this).val()
              });
            }
          });
        }
        if (episod) {
          var _select2 = $('<select>' + episod[1] + '</select>');
          $('option', _select2).each(function () {
            extract.episode.push({
              id: $(this).attr('value'),
              name: $(this).text()
            });
          });
        }
      }

      /**
       * Показать файлы
       */
      function append() {
        component.reset();
        var items = [];
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        if (extract.season.length) {
          extract.episode.forEach(function (episode) {
            items.push({
              title: 'S' + extract.season[Math.min(extract.season.length - 1, choice.season)].id + ' / ' + episode.name,
              quality: '720p ~ 1080p',
              season: extract.season[Math.min(extract.season.length - 1, choice.season)].id,
              episode: parseInt(episode.id),
              info: ' / ' + extract.voice[choice.voice].name,
              voice: extract.voice[choice.voice]
            });
          });
        } else {
          extract.voice.forEach(function (voice) {
            items.push({
              title: voice.name.length > 3 ? voice.name : select_title,
              quality: '720p ~ 1080p',
              voice: voice,
              info: ''
            });
          });
        }
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element) {
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, element.voice.name].join('') : object.movie.original_title + element.voice.name);
          element.timeline = view;
          if (element.season) {
            element.translate_episode_end = last_episode;
            element.translate_voice = element.voice.name;
          }
          item.append(Lampa.Timeline.render(view));
          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }
          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            getStream(element, function (stream) {
              var first = {
                url: stream,
                timeline: view,
                quality: element.qualitys,
                title: element.title
              };
              Lampa.Player.play(first);
              if (element.season && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  var cell = {
                    url: function url(call) {
                      getStream(elem, function (stream) {
                        cell.url = stream;
                        cell.quality = elem.qualitys;
                        call();
                      }, function () {
                        cell.url = '';
                        call();
                      });
                    },
                    timeline: elem.timeline,
                    title: elem.title
                  };
                  if (elem == element) cell.url = stream;
                  playlist.push(cell);
                });
                Lampa.Player.playlist(playlist);
              } else {
                Lampa.Player.playlist([first]);
              }
              if (element.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(element.subtitles);
              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            }, function () {
              Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
            });
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            element: element,
            file: function file(call) {
              getStream(element, function (stream) {
                call({
                  file: stream,
                  quality: element.qualitys
                });
              });
            }
          });
        });
        component.start(true);
      }
    }

    function kinobase(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var embed = component.proxy('kinobase') + 'https://kinobase.org/';
      var object = _object;
      var select_title = '';
      var select_id = '';
      var filter_items = {};
      var choice = {
        season: 0,
        voice: -1,
        quality: -1
      };

      /**
       * Поиск
       * @param {Object} _object
       * @param {String} kinopoisk_id
       */
      this.search = function (_object, kp_id, sim) {
        var _this = this;
        if (this.wait_similars && sim) return getPage(sim[0].link);
        object = _object;
        select_title = object.movie.title;
        var url = embed + "search?query=" + encodeURIComponent(cleanTitle(select_title));
        network["native"](url, function (str) {
          str = str.replace(/\n/, '');
          var links = object.movie.number_of_seasons ? str.match(/<a href="\/serial\/(.*?)">(.*?)<\/a>/g) : str.match(/<a href="\/film\/(.*?)" class="link"[^>]+>(.*?)<\/a>/g);
          var relise = object.search_date || (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
          var need_year = parseInt((relise + '').slice(0, 4));
          var found_url = '';
          if (links) {
            var cards = [];
            links.filter(function (l) {
              var link = $(l),
                titl = link.attr('title') || link.text() || '';
              var year = parseInt(titl.split('(').pop().slice(0, -1));
              if (year > need_year - 2 && year < need_year + 2) cards.push({
                year: year,
                title: titl.split(/\(\d{4}\)/)[0].trim(),
                link: link.attr('href')
              });
            });
            var card = cards.find(function (c) {
              return c.year == need_year;
            });
            if (!card) card = cards.find(function (c) {
              return c.title == select_title;
            });
            if (!card && cards.length == 1) card = cards[0];
            if (card) found_url = cards[0].link;
            if (found_url) getPage(found_url);else if (links.length) {
              _this.wait_similars = true;
              var similars = [];
              links.forEach(function (l) {
                var link = $(l),
                  titl = link.attr('title') || link.text();
                similars.push({
                  title: titl,
                  link: link.attr('href'),
                  filmId: 'similars'
                });
              });
              component.similars(similars);
              component.loading(false);
            } else component.emptyForQuery(select_title);
          } else component.emptyForQuery(select_title);
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
      };
      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };

      /**
       * Сброс фильтра
       */
      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: -1
        };
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Применить фильтр
       * @param {*} type
       * @param {*} a
       * @param {*} b
       */
      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        component.reset();
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Уничтожить
       */
      this.destroy = function () {
        network.clear();
        extract = null;
      };
      function cleanTitle(str) {
        return str.replace('.', '').replace(':', '');
      }
      function filter() {
        filter_items = {
          season: [],
          voice: [],
          quality: []
        };
        if (object.movie.number_of_seasons) {
          if (extract[0].playlist) {
            extract.forEach(function (item) {
              filter_items.season.push(item.comment);
            });
          }
        }
        component.filter(filter_items, choice);
      }
      function filtred() {
        var filtred = [];
        if (object.movie.number_of_seasons) {
          var playlist = extract[choice.season].playlist || extract;
          var season = parseInt(extract[choice.season].comment);
          playlist.forEach(function (serial) {
            var quality = serial.file.match(/\[(\d+)p\]/g).pop().replace(/\[|\]/g, '');
            var voice = serial.file.match("{([^}]+)}");
            filtred.push({
              file: serial.file,
              title: serial.comment,
              quality: quality,
              season: isNaN(season) ? 1 : season,
              info: voice ? ' / ' + voice[1] : '',
              subtitles: parseSubs(serial.subtitle || '')
            });
          });
        } else {
          extract.forEach(function (elem) {
            var quality = elem.file.match(/\[(\d+)p\]/g).pop().replace(/\[|\]/g, '');
            var voice = elem.file.match("{([^}]+)}");
            if (!elem.title) elem.title = elem.comment || (voice ? voice[1] : Lampa.Lang.translate('noname'));
            if (!elem.quality) elem.quality = quality;
            if (!elem.info) elem.info = '';
          });
          filtred = extract;
        }
        return filtred;
      }
      function parseSubs(vod) {
        var subtitles = [];
        vod.split(',').forEach(function (s) {
          var nam = s.match("\\[(.*?)]");
          if (nam) {
            var url = s.replace(/\[.*?\]/, '').split(' or ')[0];
            if (url) {
              subtitles.push({
                label: nam[1],
                url: url
              });
            }
          }
        });
        return subtitles.length ? subtitles : false;
      }

      /**
       * Получить данные о фильме
       * @param {String} str
       */
      function extractData(str, page) {
        var vod = str.split('|');
        if (vod[0] == 'file') {
          var file = str.match("file\\|([^\\|]+)\\|");
          var found = [];
          var subtiles = parseSubs(vod[2]);
          var quality_type = page.replace(/\n/g, '').replace(/ /g, '').match(/<li><b>Качество:<\/b>(\w+)<\/li>/i);
          if (file) {
            str = file[1].replace(/\n/g, '');
            str.split(',').forEach(function (el) {
              var quality = el.match("\\[(\\d+)p");
              el.split(';').forEach(function (el2) {
                var voice = el2.match("{([^}]+)}");
                var links = voice ? el2.match("}([^;]+)") : el2.match("\\]([^;]+)");
                found.push({
                  file: file[1],
                  title: object.movie.title,
                  quality: quality[1] + 'p' + (quality_type ? ' - ' + quality_type[1] : ''),
                  voice: voice ? voice[1] : '',
                  stream: links[1].split(' or ')[0],
                  subtitles: subtiles,
                  info: ' '
                });
              });
            });
            found.reverse();
          }
          extract = found;
        } else if (vod[0] == 'pl') extract = Lampa.Arrays.decodeJson(vod[1], []);else component.emptyForQuery(select_title);
      }
      function getPage(url) {
        network.clear();
        network.timeout(1000 * 10);
        network["native"](embed + url, function (str) {
          str = str.replace(/\n/g, '');
          var MOVIE_ID = str.match('var MOVIE_ID = ([^;]+);');
          var IDENTIFIER = str.match('var IDENTIFIER = "([^"]+)"');
          var PLAYER_CUID = str.match('var PLAYER_CUID = "([^"]+)"');
          if (MOVIE_ID && IDENTIFIER && PLAYER_CUID) {
            select_id = MOVIE_ID[1];
            var identifier = IDENTIFIER[1];
            var player_cuid = PLAYER_CUID[1];
            var data_url = "user_data";
            data_url = Lampa.Utils.addUrlComponent(data_url, "page=movie");
            data_url = Lampa.Utils.addUrlComponent(data_url, "movie_id=" + select_id);
            data_url = Lampa.Utils.addUrlComponent(data_url, "cuid=" + player_cuid);
            data_url = Lampa.Utils.addUrlComponent(data_url, "device=DESKTOP");
            data_url = Lampa.Utils.addUrlComponent(data_url, "_=" + Date.now());
            network.clear();
            network.timeout(1000 * 10);
            network["native"](embed + data_url, function (user_data) {
              if (typeof user_data.vod_hash == "string") {
                var file_url = "vod/" + select_id;
                file_url = Lampa.Utils.addUrlComponent(file_url, "identifier=" + identifier);
                file_url = Lampa.Utils.addUrlComponent(file_url, "player_type=new");
                file_url = Lampa.Utils.addUrlComponent(file_url, "file_type=mp4");
                file_url = Lampa.Utils.addUrlComponent(file_url, "st=" + user_data.vod_hash);
                file_url = Lampa.Utils.addUrlComponent(file_url, "e=" + user_data.vod_time);
                file_url = Lampa.Utils.addUrlComponent(file_url, "_=" + Date.now());
                network.clear();
                network.timeout(1000 * 10);
                network["native"](embed + file_url, function (files) {
                  component.loading(false);
                  extractData(files, str);
                  filter();
                  append(filtred());
                }, function (a, c) {
                  component.empty(network.errorDecode(a, c));
                }, false, {
                  dataType: 'text'
                });
              } else component.empty(Lampa.Lang.translate('torrent_parser_no_hash'));
            }, function (a, c) {
              component.empty(network.errorDecode(a, c));
            });
          } else component.emptyForQuery(select_title);
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
      }
      function getFile(element) {
        var quality = {},
          first = '';
        var preferably = Lampa.Storage.get('video_quality_default', '1080');
        element.file.split(',').reverse().forEach(function (file) {
          var q = file.match("\\[(\\d+)p");
          if (q) {
            quality[q[1] + 'p'] = file.replace(/\[\d+p\]/, '').replace(/{([^}]+)}/, '').split(' or ')[0];
            if (!first || q[1] == preferably) first = quality[q[1] + 'p'];
          }
        });
        element.stream = first;
        element.qualitys = quality;
        return {
          file: first,
          quality: quality
        };
      }

      /**
       * Показать файлы
       */
      function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        items.forEach(function (element, index) {
          if (element.season) element.title = 'S' + element.season + ' / ' + element.title;
          if (element.voice) element.title = element.voice;
          if (typeof element.episode == 'undefined') element.episode = index + 1;
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, element.title, 'kinobase'].join('') : object.movie.original_title + element.quality + 'kinobase');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));
          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }
          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            getFile(element);
            if (element.stream) {
              var playlist = [];
              var first = {
                url: element.stream,
                timeline: view,
                title: element.season ? element.title : element.voice ? object.movie.title + ' / ' + element.title : element.title,
                subtitles: element.subtitles,
                quality: element.qualitys
              };
              if (element.season) {
                items.forEach(function (elem) {
                  getFile(elem);
                  playlist.push({
                    title: elem.title,
                    url: elem.stream,
                    timeline: elem.timeline,
                    subtitles: elem.subtitles,
                    quality: elem.qualitys
                  });
                });
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);
              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            file: function file(call) {
              call(getFile(element));
            }
          });
        });
        component.start(true);
      }
    }

    function collaps(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var embed = component.proxy('collaps') + 'https://api.delivembd.ws/embed/';
      var object = _object;
      var select_title = '';
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0
      };

      /**
       * Поиск
       * @param {Object} _object 
       */
      this.search = function (_object, kinopoisk_id) {
        object = _object;
        select_title = object.movie.title;
        var url = embed + 'kp/' + kinopoisk_id;
        network.silent(url, function (str) {
          if (str) {
            parse(str);
          } else component.emptyForQuery(select_title);
          component.loading(false);
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
      };
      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };

      /**
       * Сброс фильтра
       */
      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: 0
        };
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Применить фильтр
       * @param {*} type 
       * @param {*} a 
       * @param {*} b 
       */
      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        component.reset();
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Уничтожить
       */
      this.destroy = function () {
        network.clear();
        extract = null;
      };
      function parse(str) {
        str = str.replace(/\n/g, '');
        var find = str.match('makePlayer\\({(.*?)}\\);');
        if (find) {
          var json;
          try {
            json = eval('({' + find[1] + '})');
          } catch (e) {}
          if (json) {
            extract = json;
            filter();
            append(filtred());
          } else component.emptyForQuery(select_title);
        }
      }

      /**
       * Построить фильтр
       */
      function filter() {
        filter_items = {
          season: [],
          voice: [],
          quality: []
        };
        if (extract.playlist) {
          if (extract.playlist.seasons) {
            extract.playlist.seasons.forEach(function (season) {
              filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + season.season);
            });
          }
        }
        component.filter(filter_items, choice);
      }

      /**
       * Отфильтровать файлы
       * @returns array
       */
      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');
        if (extract.playlist) {
          extract.playlist.seasons.forEach(function (season, i) {
            if (i == filter_data.season) {
              season.episodes.forEach(function (episode) {
                filtred.push({
                  file: episode.hls,
                  episode: parseInt(episode.episode),
                  season: season.season,
                  title: episode.title,
                  quality: '',
                  info: episode.audio.names.slice(0, 5).join(', '),
                  subtitles: episode.cc ? episode.cc.map(function (c) {
                    return {
                      label: c.name,
                      url: c.url
                    };
                  }) : false
                });
              });
            }
          });
        } else if (extract.source) {
          var resolution = Lampa.Arrays.getKeys(extract.qualityByWidth).pop();
          var max_quality = extract.qualityByWidth ? extract.qualityByWidth[resolution] || 0 : 0;
          filtred.push({
            file: extract.source.hls,
            title: extract.title,
            quality: max_quality ? max_quality + 'p / ' : '',
            info: extract.source.audio.names.slice(0, 5).join(', '),
            subtitles: extract.source.cc ? extract.source.cc.map(function (c) {
              return {
                label: c.name,
                url: c.url
              };
            }) : false
          });
        }
        return filtred;
      }

      /**
       * Показать файлы
       */
      function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        items.forEach(function (element) {
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, element.title].join('') : object.movie.original_title + 'collaps');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));
          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }
          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            if (element.file) {
              var playlist = [];
              var first = {
                url: element.file,
                timeline: view,
                title: element.season ? element.title : element.voice ? object.movie.title + ' / ' + element.title : element.title,
                subtitles: element.subtitles
              };
              if (element.season) {
                items.forEach(function (elem) {
                  playlist.push({
                    title: elem.title,
                    url: elem.file,
                    timeline: elem.timeline,
                    subtitles: elem.subtitles
                  });
                });
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);
              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            file: function file(call) {
              call({
                file: element.file
              });
            }
          });
        });
        component.start(true);
      }
    }

    function cdnmovies(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var object = _object;
      var select_title = '';
      var embed = component.proxy('cdnmovies') + 'https://cdnmovies.net/api/short/';
      var token = '02d56099082ad5ad586d7fe4e2493dd9';
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        voice_name: ''
      };

      /**
       * Начать поиск
       * @param {Object} _object 
       */
      this.search = function (_object, data) {
        var _this = this;
        if (this.wait_similars) return this.find(data[0].iframe_src);
        object = _object;
        select_title = object.movie.title;
        var url = embed;
        var itm = data[0];
        if (itm.iframe_src) {
          var type = itm.iframe_src.split('/').slice(-2)[0];
          if (type == 'movie') type = 'movies';
          url += type;
          url = Lampa.Utils.addUrlComponent(url, 'token=' + token);
          url = Lampa.Utils.addUrlComponent(url, itm.imdb_id ? 'imdb_id=' + encodeURIComponent(itm.imdb_id) : 'title=' + encodeURIComponent(itm.title));
          url = Lampa.Utils.addUrlComponent(url, 'field=' + encodeURIComponent('global'));
          network.silent(url, function (json) {
            var array_data = [];
            for (var key in json.data) {
              array_data.push(json.data[key]);
            }
            json.data = array_data;
            if (json.data.length > 1) {
              _this.wait_similars = true;
              component.similars(json.data);
              component.loading(false);
            } else if (json.data.length == 1) {
              _this.find(json.data[0].iframe_src);
            } else {
              component.emptyForQuery(select_title);
            }
          }, function (a, c) {
            component.empty(network.errorDecode(a, c));
          }, false, {
            dataType: 'json'
          });
        } else {
          component.emptyForQuery(select_title);
        }
      };
      this.find = function (url) {
        network.clear();
        network.silent('http:' + url, function (json) {
          parse(json);
          component.loading(false);
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
      };
      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };

      /**
       * Сброс фильтра
       */
      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: 0,
          voice_name: ''
        };
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Применить фильтр
       * @param {*} type 
       * @param {*} a 
       * @param {*} b 
       */
      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index];
        component.reset();
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Уничтожить
       */
      this.destroy = function () {
        network.clear();
      };
      function parse(str) {
        str = str.replace(/\n/g, '');
        var find = str.match('Playerjs\\({(.*?)}\\);');
        var videos = str.match("file:'(.*?)'}");
        if (videos) {
          var video = decode(videos[1]) || videos[1];
          if (find) {
            var json;
            try {
              json = JSON.parse(video);
            } catch (e) {}
            if (json) {
              extract = json;
              filter();
              append(filtred());
            } else component.emptyForQuery(select_title);
          }
        } else component.emptyForQuery(select_title);
      }
      function decode(data) {
        data = data.replace('#2', '').replace('//NTR2amZoY2dkYnJ5ZGtjZmtuZHo1Njg0MzZmcmVkKypk', '').replace('//YXorLWVydyozNDU3ZWRndGpkLWZlcXNwdGYvcmUqcSpZ', '').replace('//LSpmcm9mcHNjcHJwYW1mcFEqNDU2MTIuMzI1NmRmcmdk', '').replace('//ZGY4dmc2OXI5enhXZGx5ZisqZmd4NDU1ZzhmaDl6LWUqUQ==', '').replace('//bHZmeWNnbmRxY3lkcmNnY2ZnKzk1MTQ3Z2ZkZ2YtemQq', '');
        try {
          return decodeURIComponent(atob(data).split("").map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(""));
        } catch (e) {
          return '';
        }
      }

      /**
       * Найти поток
       * @param {Object} element 
       * @param {Int} max_quality
       * @returns string
       */
      function getFile(element) {
        var file = '';
        var quality = false;
        var max_quality = 1080;
        var path = element.slice(0, element.lastIndexOf('/')) + '/';
        if (file.split('/').pop().replace('.mp4', '') !== max_quality) {
          file = path + max_quality + '.mp4';
        }
        quality = {};
        var mass = [1080, 720, 480, 360];
        mass = mass.slice(mass.indexOf(max_quality));
        mass.forEach(function (n) {
          quality[n + 'p'] = path + n + '.mp4';
        });
        var preferably = Lampa.Storage.get('video_quality_default', '1080') + 'p';
        if (quality[preferably]) file = quality[preferably];
        return {
          file: file,
          quality: quality
        };
      }

      /**
       * Построить фильтр
       */
      function filter() {
        filter_items = {
          season: [],
          voice: [],
          quality: []
        };
        if (extract[0].folder || object.movie.number_of_seasons) {
          extract.forEach(function (season) {
            filter_items.season.push(season.title);
          });
          extract[choice.season].folder.forEach(function (f) {
            f.folder.forEach(function (t) {
              if (filter_items.voice.indexOf(t.title) == -1) filter_items.voice.push(t.title);
            });
          });
          if (!filter_items.voice[choice.voice]) choice.voice = 0;
        }
        if (choice.voice_name) {
          var inx = filter_items.voice.indexOf(choice.voice_name);
          if (inx == -1) choice.voice = 0;else if (inx !== choice.voice) {
            choice.voice = inx;
          }
        }
        component.filter(filter_items, choice);
      }

      /**
       * Отфильтровать файлы
       * @returns array
       */
      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');
        if (extract[0].folder || object.movie.number_of_seasons) {
          extract.forEach(function (t) {
            if (t.title == filter_items.season[filter_data.season]) {
              t.folder.forEach(function (se) {
                se.folder.forEach(function (eps) {
                  if (eps.title == filter_items.voice[choice.voice]) {
                    filtred.push({
                      file: eps.file,
                      episode: parseInt(se.title.match(/\d+/)),
                      season: parseInt(t.title.match(/\d+/)),
                      quality: '360p ~ 1080p',
                      info: ' / ' + Lampa.Utils.shortText(eps.title, 50)
                    });
                  }
                });
              });
            }
          });
        } else {
          extract.forEach(function (data) {
            filtred.push({
              file: data.file,
              title: data.title,
              quality: '360p ~ 1080p',
              info: '',
              subtitles: data.subtitle ? data.subtitle.split(',').map(function (c) {
                return {
                  label: c.split(']')[0].slice(1),
                  url: c.split(']')[1]
                };
              }) : false
            });
          });
        }
        return filtred;
      }

      /**
       * Добавить видео
       * @param {Array} items 
       */
      function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        items.forEach(function (element) {
          if (element.season) element.title = 'S' + element.season + ' / ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.episode;
          element.info = element.season ? ' / ' + Lampa.Utils.shortText(filter_items.voice[choice.voice], 50) : '';
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
          item.addClass('video--stream');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));
          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }
          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            var extra = getFile(element.file);
            if (extra.file) {
              var playlist = [];
              var first = {
                url: extra.file,
                quality: extra.quality,
                timeline: view,
                subtitles: element.subtitles,
                title: element.season ? element.title : object.movie.title + ' / ' + element.title
              };
              if (element.season) {
                items.forEach(function (elem) {
                  var ex = getFile(elem.file);
                  playlist.push({
                    title: elem.title,
                    url: ex.file,
                    quality: ex.quality,
                    subtitles: elem.subtitles,
                    timeline: elem.timeline
                  });
                });
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);
              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            file: function file(call) {
              call(getFile(element.file));
            }
          });
        });
        component.start(true);
      }
    }

    function filmix(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var results = [];
      var object = _object;
      var embed = 'http://filmixapp.cyou/api/v2/';
      var select_title = '';
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        voice_name: ''
      };
      var token = Lampa.Storage.get('filmix_token', '');
      if (!window.filmix) {
        window.filmix = {
          max_qualitie: 720,
          is_max_qualitie: false
        };
      }
      var dev_token = 'user_dev_apk=2.0.1&user_dev_id=&user_dev_name=Xiaomi&user_dev_os=11&user_dev_token=' + token + '&user_dev_vendor=Xiaomi';

      /**
       * Начать поиск
       * @param {Object} _object 
       */
      this.search = function (_object, data) {
        var _this = this;
        if (this.wait_similars) return this.find(data[0].id);
        object = _object;
        select_title = object.movie.title;
        var item = data[0];
        var year = parseInt((object.movie.release_date || object.movie.first_air_date || '0000').slice(0, 4));
        var orig = object.movie.original_title || object.movie.original_name;
        var url = embed + 'search';
        url = Lampa.Utils.addUrlComponent(url, 'story=' + encodeURIComponent(item.title));
        url = Lampa.Utils.addUrlComponent(url, dev_token);
        network.clear();
        network.silent(url, function (json) {
          var cards = json.filter(function (c) {
            c.year = parseInt(c.alt_name.split('-').pop());
            return c.year > year - 2 && c.year < year + 2;
          });
          var card = cards.find(function (c) {
            return c.year == year;
          });
          if (!card) {
            card = cards.find(function (c) {
              return c.original_title == orig;
            });
          }
          if (!card && cards.length == 1) card = cards[0];
          if (card) _this.find(card.id);else if (json.length) {
            _this.wait_similars = true;
            component.similars(json);
            component.loading(false);
          } else component.emptyForQuery(select_title);
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        });
      };
      this.find = function (filmix_id) {
        var url = embed;
        if (!window.filmix.is_max_qualitie && token) {
          window.filmix.is_max_qualitie = true;
          network.clear();
          network.timeout(10000);
          network.silent(url + 'user_profile?' + dev_token, function (found) {
            if (found && found.user_data) {
              if (found.user_data.is_pro) window.filmix.max_qualitie = 1080;
              if (found.user_data.is_pro_plus) window.filmix.max_qualitie = 2160;
            }
            end_search(filmix_id);
          });
        } else end_search(filmix_id);
        function end_search(filmix_id) {
          network.clear();
          network.timeout(10000);
          network.silent((window.filmix.is_max_qualitie ? url + 'post/' + filmix_id : url + 'post/' + filmix_id) + '?' + dev_token, function (found) {
            if (found && Object.keys(found).length) {
              success(found);
              component.loading(false);
            } else component.emptyForQuery(select_title);
          }, function (a, c) {
            component.empty(network.errorDecode(a, c));
          });
        }
      };
      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };

      /**
       * Сброс фильтра
       */
      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: 0,
          voice_name: ''
        };
        extractData(results);
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Применить фильтр
       * @param {*} type 
       * @param {*} a 
       * @param {*} b 
       */
      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index];
        component.reset();
        extractData(results);
        filter();
        append(filtred());
        component.saveChoice(choice);
      };

      /**
       * Уничтожить
       */
      this.destroy = function () {
        network.clear();
        results = null;
      };

      /**
       * Успешно, есть данные
       * @param {Object} json
       */
      function success(json) {
        results = json;
        extractData(json);
        filter();
        append(filtred());
      }

      /**
       * Получить информацию о фильме
       * @param {Arrays} data
       */
      function extractData(data) {
        extract = {};
        var pl_links = data.player_links;
        if (pl_links.playlist && Object.keys(pl_links.playlist).length > 0) {
          var seas_num = 0;
          for (var season in pl_links.playlist) {
            var episode = pl_links.playlist[season];
            ++seas_num;
            var transl_id = 0;
            for (var voice in episode) {
              var episode_voice = episode[voice];
              ++transl_id;
              var items = [];
              for (var ID in episode_voice) {
                var file_episod = episode_voice[ID];
                var quality_eps = file_episod.qualities.filter(function (qualitys) {
                  return qualitys <= window.filmix.max_qualitie;
                });
                var max_quality = Math.max.apply(null, quality_eps);
                var stream_url = file_episod.link.replace('%s.mp4', max_quality + '.mp4');
                var s_e = stream_url.slice(0 - stream_url.length + stream_url.lastIndexOf('/'));
                var str_s_e = s_e.match(/s(\d+)e(\d+?)_\d+\.mp4/i);
                if (str_s_e) {
                  var _seas_num = parseInt(str_s_e[1]);
                  var _epis_num = parseInt(str_s_e[2]);
                  items.push({
                    id: _seas_num + '_' + _epis_num,
                    comment: _epis_num + ' ' + Lampa.Lang.translate('torrent_serial_episode') + ' <i>' + ID + '</i>',
                    file: stream_url,
                    episode: _epis_num,
                    season: _seas_num,
                    quality: max_quality,
                    qualities: quality_eps,
                    translation: transl_id
                  });
                }
              }
              if (!extract[transl_id]) extract[transl_id] = {
                json: [],
                file: ''
              };
              extract[transl_id].json.push({
                id: seas_num,
                comment: seas_num + ' ' + Lampa.Lang.translate('torrent_serial_season'),
                folder: items,
                translation: transl_id
              });
            }
          }
        } else if (pl_links.movie && pl_links.movie.length > 0) {
          var _transl_id = 0;
          for (var _ID in pl_links.movie) {
            var _file_episod = pl_links.movie[_ID];
            ++_transl_id;
            var _quality_eps = _file_episod.link.match(/.+\[(.+[\d]),?\].+/i);
            if (_quality_eps) _quality_eps = _quality_eps[1].split(',').filter(function (quality_) {
              return quality_ <= window.filmix.max_qualitie;
            });
            var _max_quality = Math.max.apply(null, _quality_eps);
            var file_url = _file_episod.link.replace(/\[(.+[\d]),?\]/i, _max_quality);
            extract[_transl_id] = {
              file: file_url,
              translation: _file_episod.translation,
              quality: _max_quality,
              qualities: _quality_eps
            };
          }
        }
      }

      /**
       * Найти поток
       * @param {Object} element
       * @param {Int} max_quality
       * @returns string
       */
      function getFile(element, max_quality) {
        var translat = extract[element.translation];
        var id = element.season + '_' + element.episode;
        var file = '';
        var quality = false;
        if (translat) {
          if (element.season) for (var i in translat.json) {
            var elem = translat.json[i];
            if (elem.folder) for (var f in elem.folder) {
              var folder = elem.folder[f];
              if (folder.id == id) {
                file = folder.file;
                break;
              }
            } else {
              if (elem.id == id) {
                file = elem.file;
                break;
              }
            }
          } else file = translat.file;
        }
        max_quality = parseInt(max_quality);
        if (file) {
          var link = file.slice(0, file.lastIndexOf('_')) + '_';
          var orin = file.split('?');
          orin = orin.length > 1 ? '?' + orin.slice(1).join('?') : '';
          if (file.split('_').pop().replace('.mp4', '') !== max_quality) {
            file = link + max_quality + '.mp4' + orin;
          }
          quality = {};
          var mass = [2160, 1440, 1080, 720, 480, 360];
          mass = mass.slice(mass.indexOf(max_quality));
          mass.forEach(function (n) {
            quality[n + 'p'] = link + n + '.mp4' + orin;
          });
          var preferably = Lampa.Storage.get('video_quality_default', '1080') + 'p';
          if (quality[preferably]) file = quality[preferably];
        }
        return {
          file: file,
          quality: quality
        };
      }

      /**
       * Построить фильтр
       */
      function filter() {
        filter_items = {
          season: [],
          voice: [],
          voice_info: []
        };
        if (results.last_episode && results.last_episode.season) {
          var s = results.last_episode.season;
          while (s--) {
            filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (results.last_episode.season - s));
          }
        }
        for (var Id in results.player_links.playlist) {
          var season = results.player_links.playlist[Id];
          var d = 0;
          for (var voic in season) {
            ++d;
            if (filter_items.voice.indexOf(voic) == -1) {
              filter_items.voice.push(voic);
              filter_items.voice_info.push({
                id: d
              });
            }
          }
        }
        if (choice.voice_name) {
          var inx = filter_items.voice.indexOf(choice.voice_name);
          if (inx == -1) choice.voice = 0;else if (inx !== choice.voice) {
            choice.voice = inx;
          }
        }
        component.filter(filter_items, choice);
      }

      /**
       * Отфильтровать файлы
       * @returns array
       */
      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');
        if (Object.keys(results.player_links.playlist).length) {
          for (var transl in extract) {
            var element = extract[transl];
            for (var season_id in element.json) {
              var episode = element.json[season_id];
              if (episode.id == filter_data.season + 1) {
                episode.folder.forEach(function (media) {
                  if (media.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(media.episode),
                      season: media.season,
                      title: media.episode + (media.title ? ' - ' + media.title : ''),
                      quality: media.quality + 'p ',
                      translation: media.translation
                    });
                  }
                });
              }
            }
          }
        } else if (Object.keys(results.player_links.movie).length) {
          for (var transl_id in extract) {
            var _element = extract[transl_id];
            filtred.push({
              title: _element.translation,
              quality: _element.quality + 'p ',
              qualitys: _element.qualities,
              translation: transl_id
            });
          }
        }
        return filtred;
      }

      /**
       * Добавить видео
       * @param {Array} items 
       */
      function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element) {
          if (element.season) element.title = 'S' + element.season + ' / ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.episode;
          element.info = element.season ? ' / ' + Lampa.Utils.shortText(filter_items.voice[choice.voice], 50) : '';
          if (element.season) {
            element.translate_episode_end = last_episode;
            element.translate_voice = filter_items.voice[choice.voice];
          }
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
          item.addClass('video--stream');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));
          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }
          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            var extra = getFile(element, element.quality);
            if (extra.file) {
              var playlist = [];
              var first = {
                url: extra.file,
                quality: extra.quality,
                timeline: view,
                title: element.season ? element.title : object.movie.title + ' / ' + element.title
              };
              if (element.season) {
                items.forEach(function (elem) {
                  var ex = getFile(elem, elem.quality);
                  playlist.push({
                    title: elem.title,
                    url: ex.file,
                    quality: ex.quality,
                    timeline: elem.timeline
                  });
                });
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);
              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            element: element,
            file: function file(call) {
              call(getFile(element, element.quality));
            }
          });
        });
        component.start(true);
      }
    }

    function component(object) {
      var network = new Lampa.Reguest();
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true
      });
      var files = new Lampa.Files(object);
      var filter = new Lampa.Filter(object);
      var balanser = Lampa.Storage.get('online_balanser', 'videocdn');
      var last_bls = Lampa.Storage.cache('online_last_balanser', 200, {});
      if (last_bls[object.movie.id]) {
        balanser = last_bls[object.movie.id];
      }
      this.proxy = function (name) {
        var prox = Lampa.Storage.get('online_proxy_all');
        var need = Lampa.Storage.get('online_proxy_' + name);
        if (need) prox = need;
        if (prox && prox.slice(-1) !== '/') {
          prox += '/';
        }
        return prox;
      };
      var sources = {
        videocdn: new videocdn(this, object),
        rezka: new rezka(this, object),
        kinobase: new kinobase(this, object),
        collaps: new collaps(this, object),
        cdnmovies: new cdnmovies(this, object),
        filmix: new filmix(this, object)
      };
      var last;
      var last_filter;
      var extended;
      var selected_id;
      var filter_translate = {
        season: Lampa.Lang.translate('torrent_serial_season'),
        voice: Lampa.Lang.translate('torrent_parser_voice'),
        source: Lampa.Lang.translate('settings_rest_source')
      };
      var filter_sources = ['videocdn', 'rezka', 'kinobase', 'collaps', 'filmix'];
      var ignore_sources = ['filmix', 'kinobase'];
      var kiposk_sources = ['rezka', 'collaps'];

      // шаловливые ручки
      if (filter_sources.indexOf(balanser) == -1) {
        balanser = 'videocdn';
        Lampa.Storage.set('online_balanser', 'videocdn');
      }
      scroll.body().addClass('torrent-list');
      function minus() {
        scroll.minus(window.innerWidth > 580 ? false : files.render().find('.files__left'));
      }
      window.addEventListener('resize', minus, false);
      minus();

      /**
       * Подготовка
       */
      this.create = function () {
        var _this = this;
        this.activity.loader(true);
        filter.onSearch = function (value) {
          Lampa.Activity.replace({
            search: value,
            clarification: true
          });
        };
        filter.onBack = function () {
          _this.start();
        };
        filter.render().find('.selector').on('hover:focus', function (e) {
          last_filter = e.target;
        });
        filter.onSelect = function (type, a, b) {
          if (type == 'filter') {
            if (a.reset) {
              if (extended) sources[balanser].reset();else _this.start();
            } else {
              sources[balanser].filter(type, a, b);
            }
          } else if (type == 'sort') {
            balanser = a.source;
            Lampa.Storage.set('online_balanser', balanser);
            last_bls[object.movie.id] = balanser;
            Lampa.Storage.set('online_last_balanser', last_bls);
            _this.search();
            setTimeout(Lampa.Select.close, 10);
          }
        };
        filter.render().find('.filter--sort span').text(Lampa.Lang.translate('online_balanser'));
        filter.render();
        files.append(scroll.render());
        scroll.append(filter.render());
        this.search();
        return this.render();
      };

      /**
       * Начать поиск
       */
      this.search = function () {
        this.activity.loader(true);
        this.filter({
          source: filter_sources
        }, {
          source: 0
        });
        this.reset();
        this.find();
      };
      this.find = function () {
        var _this2 = this;
        var url = this.proxy('videocdn') + 'http://cdn.svetacdn.in/api/short';
        var query = object.search;
        url = Lampa.Utils.addUrlComponent(url, 'api_token=3i40G5TSECmLF77oAqnEgbx61ZWaOYaE');
        var display = function display(json) {
          if (object.movie.imdb_id) {
            var imdb = json.data.filter(function (elem) {
              return elem.imdb_id == object.movie.imdb_id;
            });
            if (imdb.length) json.data = imdb;
          }
          if (json.data && json.data.length) {
            if (json.data.length == 1 || object.clarification) {
              _this2.extendChoice();
              if (balanser == 'videocdn' || balanser == 'filmix' || balanser == 'cdnmovies') sources[balanser].search(object, json.data);else sources[balanser].search(object, json.data[0].kp_id || json.data[0].filmId, json.data);
            } else {
              _this2.similars(json.data);
              _this2.loading(false);
            }
          } else _this2.emptyForQuery(query);
        };
        var pillow = function pillow(a, c) {
          network.timeout(1000 * 15);
          if (balanser !== 'videocdn') {
            network["native"]('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query), function (json) {
              json.data = json.films;
              display(json);
            }, function (a, c) {
              _this2.empty(network.errorDecode(a, c));
            }, false, {
              headers: {
                'X-API-KEY': '2d55adfd-019d-4567-bbf7-67d503f61b5a'
              }
            });
          } else {
            _this2.empty(network.errorDecode(a, c));
          }
        };
        var letgo = function letgo(imdb_id) {
          var url_end = Lampa.Utils.addUrlComponent(url, imdb_id ? 'imdb_id=' + encodeURIComponent(imdb_id) : 'title=' + encodeURIComponent(query));
          network.timeout(1000 * 15);
          network["native"](url_end, function (json) {
            if (json.data && json.data.length) display(json);else {
              network["native"](Lampa.Utils.addUrlComponent(url, 'title=' + encodeURIComponent(query)), display.bind(_this2), pillow.bind(_this2));
            }
          }, pillow.bind(_this2));
        };
        network.clear();
        network.timeout(1000 * 15);
        if (ignore_sources.indexOf(balanser) >= 0) {
          display({
            data: [{
              title: object.movie.title || object.movie.name
            }]
          });
        } else if (object.movie.kinopoisk_id && kiposk_sources.indexOf(balanser) >= 0) {
          sources[balanser].search(object, object.movie.kinopoisk_id);
        } else if (object.movie.imdb_id) {
          letgo(object.movie.imdb_id);
        } else if (object.movie.source == 'tmdb' || object.movie.source == 'cub') {
          var tmdburl = (object.movie.name ? 'tv' : 'movie') + '/' + object.movie.id + '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96&language=ru';
          var baseurl = typeof Lampa.TMDB !== 'undefined' ? Lampa.TMDB.api(tmdburl) : 'http://api.themoviedb.org' + tmdburl;
          network["native"](baseurl, function (ttid) {
            letgo(ttid.imdb_id);
          }, function (a, c) {
            _this2.empty(network.errorDecode(a, c));
          });
        } else {
          letgo();
        }
      };
      this.extendChoice = function () {
        var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
        var save = data[selected_id || object.movie.id] || {};
        extended = true;
        sources[balanser].extendChoice(save);
      };
      this.saveChoice = function (choice) {
        var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
        data[selected_id || object.movie.id] = choice;
        Lampa.Storage.set('online_choice_' + balanser, data);
      };

      /**
       * Есть похожие карточки
       * @param {Object} json 
       */
      this.similars = function (json) {
        var _this3 = this;
        json.forEach(function (elem) {
          var year = elem.start_date || elem.year || '';
          elem.title = elem.title || elem.ru_title || elem.en_title || elem.nameRu || elem.nameEn;
          elem.quality = year ? (year + '').slice(0, 4) : '----';
          elem.info = '';
          var item = Lampa.Template.get('online_folder', elem);
          item.on('hover:enter', function () {
            _this3.activity.loader(true);
            _this3.reset();
            object.search_date = year;
            selected_id = elem.id;
            _this3.extendChoice();
            if (balanser == 'videocdn' || balanser == 'filmix' || balanser == 'cdnmovies') sources[balanser].search(object, [elem]);else sources[balanser].search(object, elem.kp_id || elem.filmId, [elem]);
          });
          _this3.append(item);
        });
      };

      /**
       * Очистить список файлов
       */
      this.reset = function () {
        last = false;
        scroll.render().find('.empty').remove();
        filter.render().detach();
        scroll.clear();
        scroll.append(filter.render());
      };

      /**
       * Загрузка
       */
      this.loading = function (status) {
        if (status) this.activity.loader(true);else {
          this.activity.loader(false);
          this.activity.toggle();
        }
      };

      /**
       * Построить фильтр
       */
      this.filter = function (filter_items, choice) {
        var select = [];
        var add = function add(type, title) {
          var need = Lampa.Storage.get('online_filter', '{}');
          var items = filter_items[type];
          var subitems = [];
          var value = need[type];
          items.forEach(function (name, i) {
            subitems.push({
              title: name,
              selected: value == i,
              index: i
            });
          });
          select.push({
            title: title,
            subtitle: items[value],
            items: subitems,
            stype: type
          });
        };
        filter_items.source = filter_sources;
        choice.source = filter_sources.indexOf(balanser);
        select.push({
          title: Lampa.Lang.translate('torrent_parser_reset'),
          reset: true
        });
        Lampa.Storage.set('online_filter', choice);
        if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
        if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
        filter.set('filter', select);
        filter.set('sort', filter_sources.map(function (e) {
          return {
            title: e,
            source: e,
            selected: e == balanser
          };
        }));
        this.selected(filter_items);
      };

      /**
       * Закрыть фильтр
       */
      this.closeFilter = function () {
        if ($('body').hasClass('selectbox--open')) Lampa.Select.close();
      };

      /**
       * Показать что выбрано в фильтре
       */
      this.selected = function (filter_items) {
        var need = Lampa.Storage.get('online_filter', '{}'),
          select = [];
        for (var i in need) {
          if (filter_items[i] && filter_items[i].length) {
            if (i == 'voice') {
              select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
            } else if (i !== 'source') {
              if (filter_items.season.length >= 1) {
                select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
              }
            }
          }
        }
        filter.chosen('filter', select);
        filter.chosen('sort', [balanser]);
      };

      /**
       * Добавить файл
       */
      this.append = function (item) {
        item.on('hover:focus', function (e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(item);
      };

      /**
       * Меню
       */
      this.contextmenu = function (params) {
        params.item.on('hover:long', function () {
          function show(extra) {
            var enabled = Lampa.Controller.enabled().name;
            var menu = [{
              title: Lampa.Lang.translate('torrent_parser_label_title'),
              mark: true
            }, {
              title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
              clearmark: true
            }, {
              title: Lampa.Lang.translate('time_reset'),
              timeclear: true
            }];
            if (Lampa.Platform.is('webos')) {
              menu.push({
                title: Lampa.Lang.translate('player_lauch') + ' - Webos',
                player: 'webos'
              });
            }
            if (Lampa.Platform.is('android')) {
              menu.push({
                title: Lampa.Lang.translate('player_lauch') + ' - Android',
                player: 'android'
              });
            }
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
              player: 'lampa'
            });
            if (extra) {
              menu.push({
                title: Lampa.Lang.translate('copy_link'),
                copylink: true
              });
            }
            if (Lampa.Account.working() && params.element && typeof params.element.season !== 'undefined' && Lampa.Account.subscribeToTranslation) {
              menu.push({
                title: Lampa.Lang.translate('online_voice_subscribe'),
                subscribe: true
              });
            }
            Lampa.Select.show({
              title: Lampa.Lang.translate('title_action'),
              items: menu,
              onBack: function onBack() {
                Lampa.Controller.toggle(enabled);
              },
              onSelect: function onSelect(a) {
                if (a.clearmark) {
                  Lampa.Arrays.remove(params.viewed, params.hash_file);
                  Lampa.Storage.set('online_view', params.viewed);
                  params.item.find('.torrent-item__viewed').remove();
                }
                if (a.mark) {
                  if (params.viewed.indexOf(params.hash_file) == -1) {
                    params.viewed.push(params.hash_file);
                    params.item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                    Lampa.Storage.set('online_view', params.viewed);
                  }
                }
                if (a.timeclear) {
                  params.view.percent = 0;
                  params.view.time = 0;
                  params.view.duration = 0;
                  Lampa.Timeline.update(params.view);
                }
                Lampa.Controller.toggle(enabled);
                if (a.player) {
                  Lampa.Player.runas(a.player);
                  params.item.trigger('hover:enter');
                }
                if (a.copylink) {
                  if (extra.quality) {
                    var qual = [];
                    for (var i in extra.quality) {
                      qual.push({
                        title: i,
                        file: extra.quality[i]
                      });
                    }
                    Lampa.Select.show({
                      title: 'Ссылки',
                      items: qual,
                      onBack: function onBack() {
                        Lampa.Controller.toggle(enabled);
                      },
                      onSelect: function onSelect(b) {
                        Lampa.Utils.copyTextToClipboard(b.file, function () {
                          Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                        }, function () {
                          Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                        });
                      }
                    });
                  } else {
                    Lampa.Utils.copyTextToClipboard(extra.file, function () {
                      Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                    }, function () {
                      Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                    });
                  }
                }
                if (a.subscribe) {
                  Lampa.Account.subscribeToTranslation({
                    card: object.movie,
                    season: params.element.season,
                    episode: params.element.translate_episode_end,
                    voice: params.element.translate_voice
                  }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate('online_voice_success'));
                  }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate('online_voice_error'));
                  });
                }
              }
            });
          }
          params.file(show);
        }).on('hover:focus', function () {
          if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.item);
        });
      };

      /**
       * Показать пустой результат
       */
      this.empty = function (msg) {
        var empty = Lampa.Template.get('list_empty');
        if (msg) empty.find('.empty__descr').text(msg);
        scroll.append(empty);
        this.loading(false);
      };

      /**
       * Показать пустой результат по ключевому слову
       */
      this.emptyForQuery = function (query) {
        this.empty(Lampa.Lang.translate('online_query_start') + ' (' + query + ') ' + Lampa.Lang.translate('online_query_end'));
      };
      this.getLastEpisode = function (items) {
        var last_episode = 0;
        items.forEach(function (e) {
          if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
        });
        return last_episode;
      };

      /**
       * Начать навигацию по файлам
       */
      this.start = function (first_select) {
        if (Lampa.Activity.active().activity !== this.activity) return; //обязательно, иначе наблюдается баг, активность создается но не стартует, в то время как компонент загружается и стартует самого себя.

        if (first_select) {
          var last_views = scroll.render().find('.selector.online').find('.torrent-item__viewed').parent().last();
          if (object.movie.number_of_seasons && last_views.length) last = last_views.eq(0)[0];else last = scroll.render().find('.selector').eq(3)[0];
        }
        Lampa.Background.immediately(Lampa.Utils.cardImgBackground(object.movie));
        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(scroll.render(), files.render());
            Lampa.Controller.collectionFocus(last || false, scroll.render());
          },
          up: function up() {
            if (Navigator.canmove('up')) {
              if (scroll.render().find('.selector').slice(3).index(last) == 0 && last_filter) {
                Lampa.Controller.collectionFocus(last_filter, scroll.render());
              } else Navigator.move('up');
            } else Lampa.Controller.toggle('head');
          },
          down: function down() {
            Navigator.move('down');
          },
          right: function right() {
            if (Navigator.canmove('right')) Navigator.move('right');else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          back: this.back
        });
        Lampa.Controller.toggle('content');
      };
      this.render = function () {
        return files.render();
      };
      this.back = function () {
        Lampa.Activity.backward();
      };
      this.pause = function () {};
      this.stop = function () {};
      this.destroy = function () {
        network.clear();
        files.destroy();
        scroll.destroy();
        network = null;
        sources.videocdn.destroy();
        sources.rezka.destroy();
        sources.kinobase.destroy();
        sources.collaps.destroy();
        sources.cdnmovies.destroy();
        sources.filmix.destroy();
        window.removeEventListener('resize', minus);
      };
    }

    if (!Lampa.Lang) {
      var lang_data = {};
      Lampa.Lang = {
        add: function add(data) {
          lang_data = data;
        },
        translate: function translate(key) {
          return lang_data[key] ? lang_data[key].ru : key;
        }
      };
    }
    Lampa.Lang.add({
      online_nolink: {
        ru: 'Не удалось извлечь ссылку',
        uk: 'Неможливо отримати посилання',
        en: 'Failed to fetch link',
        zh: '获取链接失败',
        bg: 'Не може да се извлече връзката'
      },
      online_waitlink: {
        ru: 'Работаем над извлечением ссылки, подождите...',
        uk: 'Працюємо над отриманням посилання, зачекайте...',
        en: 'Working on extracting the link, please wait...',
        zh: '正在提取链接，请稍候...',
        bg: 'Работя по извличнаето на линка, моля почакайте...'
      },
      online_balanser: {
        ru: 'Балансер',
        uk: 'Балансер',
        en: 'Balancer',
        zh: '平衡器',
        bg: 'Балансър'
      },
      helper_online_file: {
        ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
        uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
        en: 'Hold the "OK" key to bring up the context menu',
        zh: '按住“确定”键调出上下文菜单',
        bg: 'Задръжте бутон "ОК" за да отворите контекстното меню'
      },
      online_query_start: {
        ru: 'По запросу',
        uk: 'На запит',
        en: 'On request',
        zh: '根据要求',
        bg: 'По запитване'
      },
      online_query_end: {
        ru: 'нет результатов',
        uk: 'немає результатів',
        en: 'no results',
        zh: '没有结果',
        bg: 'няма резултати'
      },
      title_online: {
        ru: 'Онлайн',
        uk: 'Онлайн',
        en: 'Online',
        zh: '在线的',
        bg: 'Онлайн'
      },
      title_proxy: {
        ru: 'Прокси',
        uk: 'Проксі',
        en: 'Proxy',
        zh: '代理人',
        bg: 'Прокси'
      },
      online_proxy_title: {
        ru: 'Основной прокси',
        uk: 'Основний проксі',
        en: 'Main proxy',
        zh: '主要代理',
        bg: 'Основно прокси'
      },
      online_proxy_descr: {
        ru: 'Будет использоваться для всех балансеров',
        uk: 'Використовуватиметься для всіх балансерів',
        en: 'Will be used for all balancers',
        zh: '将用于所有平衡器',
        bg: 'Ще бъде използвано от всички балансъри'
      },
      online_proxy_placeholder: {
        ru: 'Например: http://proxy.com',
        uk: 'Наприклад: http://proxy.com',
        en: 'For example: http://proxy.com',
        zh: '例如：http://proxy.com',
        bg: 'Например: http://proxy.com'
      },
      filmix_param_add_title: {
        ru: 'Добавить ТОКЕН от Filmix',
        uk: 'Додати ТОКЕН від Filmix',
        en: 'Add TOKEN from Filmix',
        zh: '从 Filmix 添加 TOKEN',
        bg: 'Добави TOKEN от Filmix'
      },
      filmix_param_add_descr: {
        ru: 'Добавьте ТОКЕН для подключения подписки',
        uk: 'Додайте ТОКЕН для підключення передплати',
        en: 'Add a TOKEN to connect a subscription',
        zh: '添加 TOKEN 以连接订阅',
        bg: 'Добави TOKEN за вклюване на абонамента'
      },
      filmix_param_placeholder: {
        ru: 'Например: nxjekeb57385b..',
        uk: 'Наприклад: nxjekeb57385b..',
        en: 'For example: nxjekeb57385b..',
        zh: '例如：nxjekeb57385b..',
        bg: 'Например: nxjekeb57385b..'
      },
      filmix_param_add_device: {
        ru: 'Добавить устройство на Filmix',
        uk: 'Додати пристрій на Filmix',
        en: 'Add Device to Filmix',
        zh: '将设备添加到 Filmix',
        bg: 'Добави устройство в Filmix'
      },
      filmix_modal_text: {
        ru: 'Введите его на странице https://filmix.ac/consoles в вашем авторизованном аккаунте!',
        uk: 'Введіть його на сторінці https://filmix.ac/consoles у вашому авторизованому обліковому записі!',
        en: 'Enter it at https://filmix.ac/consoles in your authorized account!',
        zh: '在您的授权帐户中的 https://filmix.ac/consoles 中输入！',
        bg: 'Въведете го на страницата https://filmix.ac/consoles във вашият акаунт'
      },
      filmix_modal_wait: {
        ru: 'Ожидаем код',
        uk: 'Очікуємо код',
        en: 'Waiting for the code',
        zh: '我们正在等待代码',
        bg: 'Очаквам код'
      },
      filmix_copy_secuses: {
        ru: 'Код скопирован в буфер обмена',
        uk: 'Код скопійовано в буфер обміну',
        en: 'Code copied to clipboard',
        zh: '代码复制到剪贴板',
        bg: 'Кода е копиран в буфера за обмен'
      },
      filmix_copy_fail: {
        ru: 'Ошибка при копировании',
        uk: 'Помилка при копіюванні',
        en: 'Copy error',
        zh: '复制错误',
        bg: 'Грешка при копиране'
      },
      filmix_nodevice: {
        ru: 'Устройство не авторизовано',
        uk: 'Пристрій не авторизований',
        en: 'Device not authorized',
        zh: '设备未授权',
        bg: 'Устройството не е оторизирано'
      },
      title_status: {
        ru: 'Статус',
        uk: 'Статус',
        en: 'Status',
        zh: '地位',
        bg: 'Статус'
      },
      online_voice_subscribe: {
        ru: 'Подписаться на перевод',
        uk: 'Підписатися на переклад',
        en: 'Subscribe to translation',
        zh: '订阅翻译',
        bg: 'Абонирай се за превода'
      },
      online_voice_success: {
        ru: 'Вы успешно подписались',
        uk: 'Ви успішно підписалися',
        en: 'You have successfully subscribed',
        zh: '您已成功订阅'
      },
      online_voice_error: {
        ru: 'Возникла ошибка',
        uk: 'Виникла помилка',
        en: 'An error has occurred',
        zh: '发生了错误',
        bg: 'Възникна грешка'
      }
    });
    function resetTemplates() {
      Lampa.Template.add('online', "<div class=\"online selector\">\n        <div class=\"online__body\">\n            <div style=\"position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em\">\n                <svg style=\"height: 2.4em; width:  2.4em;\" viewBox=\"0 0 128 128\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"64\" cy=\"64\" r=\"56\" stroke=\"white\" stroke-width=\"16\"/>\n                    <path d=\"M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z\" fill=\"white\"/>\n                </svg>\n            </div>\n            <div class=\"online__title\" style=\"padding-left: 2.1em;\">{title}</div>\n            <div class=\"online__quality\" style=\"padding-left: 3.4em;\">{quality}{info}</div>\n        </div>\n    </div>");
      Lampa.Template.add('online_folder', "<div class=\"online selector\">\n        <div class=\"online__body\">\n            <div style=\"position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em\">\n                <svg style=\"height: 2.4em; width:  2.4em;\" viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"/>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"/>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"/>\n                </svg>\n            </div>\n            <div class=\"online__title\" style=\"padding-left: 2.1em;\">{title}</div>\n            <div class=\"online__quality\" style=\"padding-left: 3.4em;\">{quality}{info}</div>\n        </div>\n    </div>");
    }
    var button = "<div class=\"full-start__button selector view--online\" data-subtitle=\"v1.54\">\n    <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:svgjs=\"http://svgjs.com/svgjs\" version=\"1.1\" width=\"512\" height=\"512\" x=\"0\" y=\"0\" viewBox=\"0 0 30.051 30.051\" style=\"enable-background:new 0 0 512 512\" xml:space=\"preserve\" class=\"\">\n    <g xmlns=\"http://www.w3.org/2000/svg\">\n        <path d=\"M19.982,14.438l-6.24-4.536c-0.229-0.166-0.533-0.191-0.784-0.062c-0.253,0.128-0.411,0.388-0.411,0.669v9.069   c0,0.284,0.158,0.543,0.411,0.671c0.107,0.054,0.224,0.081,0.342,0.081c0.154,0,0.31-0.049,0.442-0.146l6.24-4.532   c0.197-0.145,0.312-0.369,0.312-0.607C20.295,14.803,20.177,14.58,19.982,14.438z\" fill=\"currentColor\"/>\n        <path d=\"M15.026,0.002C6.726,0.002,0,6.728,0,15.028c0,8.297,6.726,15.021,15.026,15.021c8.298,0,15.025-6.725,15.025-15.021   C30.052,6.728,23.324,0.002,15.026,0.002z M15.026,27.542c-6.912,0-12.516-5.601-12.516-12.514c0-6.91,5.604-12.518,12.516-12.518   c6.911,0,12.514,5.607,12.514,12.518C27.541,21.941,21.937,27.542,15.026,27.542z\" fill=\"currentColor\"/>\n    </g></svg>\n\n    <span>#{title_online}</span>\n    </div>";

    // нужна заглушка, а то при страте лампы говорит пусто
    Lampa.Component.add('online', component);

    //то же самое
    resetTemplates();
    Lampa.Listener.follow('full', function (e) {
      if (e.type == 'complite') {
        var btn = $(Lampa.Lang.translate(button));
        btn.on('hover:enter', function () {
          resetTemplates();
          Lampa.Component.add('online', component);
          Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_online'),
            component: 'online',
            search: e.data.movie.title,
            search_one: e.data.movie.title,
            search_two: e.data.movie.original_title,
            movie: e.data.movie,
            page: 1
          });
        });
        e.object.activity.render().find('.view--torrent').after(btn);
      }
    });

    ///////ONLINE/////////

    Lampa.Params.select('online_proxy_all', '', '');
    Lampa.Params.select('online_proxy_videocdn', '', '');
    Lampa.Params.select('online_proxy_rezka', '', '');
    Lampa.Params.select('online_proxy_kinobase', '', '');
    Lampa.Params.select('online_proxy_collaps', '', '');
    Lampa.Params.select('online_proxy_cdnmovies', '', '');
    Lampa.Template.add('settings_proxy', "<div>\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"online_proxy_all\" placeholder=\"#{online_proxy_placeholder}\">\n        <div class=\"settings-param__name\">#{online_proxy_title}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{online_proxy_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"online_proxy_videocdn\" placeholder=\"#{online_proxy_placeholder}\">\n        <div class=\"settings-param__name\">Videocdn</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"online_proxy_rezka\" placeholder=\"#{online_proxy_placeholder}\">\n        <div class=\"settings-param__name\">Rezka</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"online_proxy_kinobase\" placeholder=\"#{online_proxy_placeholder}\">\n        <div class=\"settings-param__name\">Kinobase</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"online_proxy_collaps\" placeholder=\"#{online_proxy_placeholder}\">\n        <div class=\"settings-param__name\">Collaps</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"online_proxy_cdnmovies\" placeholder=\"#{online_proxy_placeholder}\">\n        <div class=\"settings-param__name\">Cdnmovies</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n</div>");
    function addSettingsProxy() {
      if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="proxy"]').length) {
        var field = $(Lampa.Lang.translate("<div class=\"settings-folder selector\" data-component=\"proxy\">\n            <div class=\"settings-folder__icon\">\n                <svg height=\"46\" viewBox=\"0 0 42 46\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <rect x=\"1.5\" y=\"26.5\" width=\"39\" height=\"18\" rx=\"1.5\" stroke=\"white\" stroke-width=\"3\"/>\n                <circle cx=\"9.5\" cy=\"35.5\" r=\"3.5\" fill=\"white\"/>\n                <circle cx=\"26.5\" cy=\"35.5\" r=\"2.5\" fill=\"white\"/>\n                <circle cx=\"32.5\" cy=\"35.5\" r=\"2.5\" fill=\"white\"/>\n                <circle cx=\"21.5\" cy=\"5.5\" r=\"5.5\" fill=\"white\"/>\n                <rect x=\"31\" y=\"4\" width=\"11\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                <rect y=\"4\" width=\"11\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                <rect x=\"20\" y=\"14\" width=\"3\" height=\"7\" rx=\"1.5\" fill=\"white\"/>\n                </svg>\n            </div>\n            <div class=\"settings-folder__name\">#{title_proxy}</div>\n        </div>"));
        Lampa.Settings.main().render().find('[data-component="more"]').after(field);
        Lampa.Settings.main().update();
      }
    }
    if (window.appready) addSettingsProxy();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') addSettingsProxy();
      });
    }

    ///////FILMIX/////////

    var network = new Lampa.Reguest();
    var api_url = 'http://filmixapp.cyou/api/v2/';
    var user_dev = '?user_dev_apk=1.1.3&user_dev_id=' + Lampa.Utils.uid(16) + '&user_dev_name=Xiaomi&user_dev_os=11&user_dev_vendor=Xiaomi&user_dev_token=';
    var ping_auth;
    Lampa.Params.select('filmix_token', '', '');
    Lampa.Template.add('settings_filmix', "<div>\n    <div class=\"settings-param selector\" data-name=\"filmix_token\" data-type=\"input\" placeholder=\"#{filmix_param_placeholder}\">\n        <div class=\"settings-param__name\">#{filmix_param_add_title}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{filmix_param_add_descr}</div>\n    </div>\n    <div class=\"settings-param selector\" data-name=\"filmix_add\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{filmix_param_add_device}</div>\n    </div>\n</div>");
    Lampa.Storage.listener.follow('change', function (e) {
      if (e.name == 'filmix_token') {
        if (e.value) checkPro(e.value);else {
          Lampa.Storage.set("filmix_status", {});
          showStatus();
        }
      }
    });
    function addSettingsFilmix() {
      if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="filmix"]').length) {
        var field = $("<div class=\"settings-folder selector\" data-component=\"filmix\">\n            <div class=\"settings-folder__icon\">\n                <svg height=\"57\" viewBox=\"0 0 58 57\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M20 20.3735V45H26.8281V34.1262H36.724V26.9806H26.8281V24.3916C26.8281 21.5955 28.9062 19.835 31.1823 19.835H39V13H26.8281C23.6615 13 20 15.4854 20 20.3735Z\" fill=\"white\"/>\n                <rect x=\"2\" y=\"2\" width=\"54\" height=\"53\" rx=\"5\" stroke=\"white\" stroke-width=\"4\"/>\n                </svg>\n            </div>\n            <div class=\"settings-folder__name\">Filmix</div>\n        </div>");
        Lampa.Settings.main().render().find('[data-component="more"]').after(field);
        Lampa.Settings.main().update();
      }
    }
    if (window.appready) addSettingsFilmix();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') addSettingsFilmix();
      });
    }
    Lampa.Settings.listener.follow('open', function (e) {
      if (e.name == 'filmix') {
        e.body.find('[data-name="filmix_add"]').unbind('hover:enter').on('hover:enter', function () {
          var user_code = '';
          var user_token = '';
          var modal = $('<div><div class="broadcast__text">' + Lampa.Lang.translate('filmix_modal_text') + '</div><div class="broadcast__device selector" style="text-align: center">' + Lampa.Lang.translate('filmix_modal_wait') + '...</div><br><div class="broadcast__scan"><div></div></div></div></div>');
          Lampa.Modal.open({
            title: '',
            html: modal,
            onBack: function onBack() {
              Lampa.Modal.close();
              Lampa.Controller.toggle('settings_component');
              clearInterval(ping_auth);
            },
            onSelect: function onSelect() {
              Lampa.Utils.copyTextToClipboard(user_code, function () {
                Lampa.Noty.show(Lampa.Lang.translate('filmix_copy_secuses'));
              }, function () {
                Lampa.Noty.show(Lampa.Lang.translate('filmix_copy_fail'));
              });
            }
          });
          ping_auth = setInterval(function () {
            checkPro(user_token, function () {
              Lampa.Modal.close();
              clearInterval(ping_auth);
              Lampa.Storage.set("filmix_token", user_token);
              e.body.find('[data-name="filmix_token"] .settings-param__value').text(user_token);
              Lampa.Controller.toggle('settings_component');
            });
          }, 10000);
          network.clear();
          network.timeout(10000);
          network.quiet(api_url + 'token_request' + user_dev, function (found) {
            if (found.status == 'ok') {
              user_token = found.code;
              user_code = found.user_code;
              modal.find('.selector').text(user_code);
              //modal.find('.broadcast__scan').remove()
            } else {
              Lampa.Noty.show(found);
            }
          }, function (a, c) {
            Lampa.Noty.show(network.errorDecode(a, c));
          });
        });
        showStatus();
      }
    });
    function showStatus() {
      var status = Lampa.Storage.get("filmix_status", '{}');
      var info = Lampa.Lang.translate('filmix_nodevice');
      if (status.login) {
        if (status.is_pro) info = status.login + ' - PRO ' + Lampa.Lang.translate('filter_rating_to') + ' - ' + status.pro_date;else if (status.is_pro_plus) info = status.login + ' - PRO_PLUS ' + Lampa.Lang.translate('filter_rating_to') + ' - ' + status.pro_date;else info = status.login + ' - NO PRO';
      }
      var field = $(Lampa.Lang.translate("\n        <div class=\"settings-param\" data-name=\"filmix_status\" data-static=\"true\">\n            <div class=\"settings-param__name\">#{title_status}</div>\n            <div class=\"settings-param__value\">".concat(info, "</div>\n        </div>")));
      $('.settings [data-name="filmix_status"]').remove();
      $('.settings [data-name="filmix_add"]').after(field);
    }
    function checkPro(token, call) {
      network.clear();
      network.timeout(8000);
      network.silent(api_url + 'user_profile' + user_dev + token, function (json) {
        if (json) {
          if (json.user_data) {
            Lampa.Storage.set("filmix_status", json.user_data);
            if (call) call();
          } else {
            Lampa.Storage.set("filmix_status", {});
          }
          showStatus();
        }
      }, function (a, c) {
        Lampa.Noty.show(network.errorDecode(a, c));
      });
    }

})();
