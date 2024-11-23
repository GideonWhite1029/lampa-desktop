(function () {
    'use strict';

    var connect_host = '{localhost}';
    var list_opened = false;
    function reguest(params, callback) {
      if (params.ffprobe && params.path.split('.').pop() !== 'mp4') {
        setTimeout(function () {
          callback({
            streams: params.ffprobe
          });
        }, 200);
      } else {
        if (connect_host == '{localhost}') connect_host = '185.204.0.61';
        var socket = new WebSocket('ws://' + connect_host + ':8080/?' + params.torrent_hash + '&index=' + params.id);
        socket.addEventListener('message', function (event) {
          socket.close();
          var json = {};
          try {
            json = JSON.parse(event.data);
          } catch (e) {}
          if (json.streams) callback(json);
        });
      }
    }
    function subscribeTracks(data) {
      var inited = false;
      var inited_parse = false;
      var webos_replace = {};
      function log() {
        console.log.apply(console.log, arguments);
      }
      function getTracks() {
        var video = Lampa.PlayerVideo.video();
        return video.audioTracks || [];
      }
      function getSubs() {
        var video = Lampa.PlayerVideo.video();
        return video.textTracks || [];
      }
      log('Tracks', 'start');
      function setTracks() {
        if (inited_parse) {
          var new_tracks = [];
          var video_tracks = getTracks();
          var parse_tracks = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          });
          var minus = 1;
          log('Tracks', 'set tracks:', video_tracks.length);
          if (parse_tracks.length !== video_tracks.length) parse_tracks = parse_tracks.filter(function (a) {
            return a.codec_name !== 'dts';
          });
          parse_tracks = parse_tracks.filter(function (a) {
            return a.tags;
          });
          log('Tracks', 'filtred tracks:', parse_tracks.length);
          parse_tracks.forEach(function (track) {
            var orig = video_tracks[track.index - minus];
            var elem = {
              index: track.index - minus,
              language: track.tags.language,
              label: track.tags.title || track.tags.handler_name,
              ghost: orig ? false : true,
              selected: orig ? orig.selected == true || orig.enabled == true : false
            };
            console.log('Tracks', 'tracks original', orig);
            Object.defineProperty(elem, "enabled", {
              set: function set(v) {
                if (v) {
                  var aud = getTracks();
                  var trk = aud[elem.index];
                  for (var i = 0; i < aud.length; i++) {
                    aud[i].enabled = false;
                    aud[i].selected = false;
                  }
                  if (trk) {
                    trk.enabled = true;
                    trk.selected = true;
                  }
                }
              },
              get: function get() {}
            });
            new_tracks.push(elem);
          });
          if (parse_tracks.length) Lampa.PlayerPanel.setTracks(new_tracks);
        }
      }
      function setSubs() {
        if (inited_parse) {
          var new_subs = [];
          var video_subs = getSubs();
          var parse_subs = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'subtitle';
          });
          var minus = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          }).length + 1;
          log('Tracks', 'set subs:', video_subs.length);
          parse_subs = parse_subs.filter(function (a) {
            return a.tags;
          });
          log('Tracks', 'filtred subs:', parse_subs.length);
          parse_subs.forEach(function (track) {
            var orig = video_subs[track.index - minus];
            var elem = {
              index: track.index - minus,
              language: track.tags.language,
              label: track.tags.title || track.tags.handler_name,
              ghost: video_subs[track.index - minus] ? false : true,
              selected: orig ? orig.selected == true || orig.mode == 'showing' : false
            };
            console.log('Tracks', 'subs original', orig);
            Object.defineProperty(elem, "mode", {
              set: function set(v) {
                if (v) {
                  var txt = getSubs();
                  var sub = txt[elem.index];
                  for (var i = 0; i < txt.length; i++) {
                    txt[i].mode = 'disabled';
                    txt[i].selected = false;
                  }
                  if (sub) {
                    sub.mode = 'showing';
                    sub.selected = true;
                  }
                }
              },
              get: function get() {}
            });
            new_subs.push(elem);
          });
          if (parse_subs.length) Lampa.PlayerPanel.setSubs(new_subs);
        }
      }
      function listenTracks() {
        log('Tracks', 'tracks video event');
        setTracks();
        Lampa.PlayerVideo.listener.remove('tracks', listenTracks);
      }
      function listenSubs() {
        log('Tracks', 'subs video event');
        setSubs();
        Lampa.PlayerVideo.listener.remove('subs', listenSubs);
      }
      function canPlay() {
        log('Tracks', 'canplay video event');
        if (webos_replace.tracks) setWebosTracks(webos_replace.tracks);else setTracks();
        if (webos_replace.subs) setWebosSubs(webos_replace.subs);else setSubs();
        Lampa.PlayerVideo.listener.remove('canplay', canPlay);
      }
      function setWebosTracks(video_tracks) {
        if (inited_parse) {
          var parse_tracks = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          });
          log('Tracks', 'webos set tracks:', video_tracks.length);
          if (parse_tracks.length !== video_tracks.length) {
            parse_tracks = parse_tracks.filter(function (a) {
              return a.codec_name !== 'truehd';
            });
            if (parse_tracks.length !== video_tracks.length) {
              parse_tracks = parse_tracks.filter(function (a) {
                return a.codec_name !== 'dts';
              });
            }
          }
          parse_tracks = parse_tracks.filter(function (a) {
            return a.tags;
          });
          log('Tracks', 'webos tracks', video_tracks);
          parse_tracks.forEach(function (track, i) {
            if (video_tracks[i]) {
              video_tracks[i].language = track.tags.language;
              video_tracks[i].label = track.tags.title || track.tags.handler_name;
            }
          });
        }
      }
      function setWebosSubs(video_subs) {
        if (inited_parse) {
          var parse_subs = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'subtitle';
          });
          log('Tracks', 'webos set subs:', video_subs.length);
          if (parse_subs.length !== video_subs.length - 1) parse_subs = parse_subs.filter(function (a) {
            return a.codec_name !== 'hdmv_pgs_subtitle';
          });
          parse_subs = parse_subs.filter(function (a) {
            return a.tags;
          });
          parse_subs.forEach(function (track, a) {
            var i = a + 1;
            if (video_subs[i]) {
              video_subs[i].language = track.tags.language;
              video_subs[i].label = track.tags.title || track.tags.handler_name;
            }
          });
        }
      }
      function listenWebosSubs(_data) {
        log('Tracks', 'webos subs event');
        webos_replace.subs = _data.subs;
        if (inited_parse) setWebosSubs(_data.subs);
      }
      function listenWebosTracks(_data) {
        log('Tracks', 'webos tracks event');
        webos_replace.tracks = _data.tracks;
        if (inited_parse) setWebosTracks(_data.tracks);
      }
      function listenStart() {
        inited = true;
        reguest(data, function (result) {
          log('Tracks', 'parsed', inited_parse);
          inited_parse = result;
          if (inited) {
            if (webos_replace.subs) setWebosSubs(webos_replace.subs);else setSubs();
            if (webos_replace.tracks) setWebosTracks(webos_replace.tracks);else setTracks();
          }
        });
      }
      function listenDestroy() {
        inited = false;
        Lampa.Player.listener.remove('destroy', listenDestroy);
        Lampa.PlayerVideo.listener.remove('tracks', listenTracks);
        Lampa.PlayerVideo.listener.remove('subs', listenSubs);
        Lampa.PlayerVideo.listener.remove('webos_subs', listenWebosSubs);
        Lampa.PlayerVideo.listener.remove('webos_tracks', listenWebosTracks);
        Lampa.PlayerVideo.listener.remove('canplay', canPlay);
        log('Tracks', 'end');
      }
      Lampa.Player.listener.follow('destroy', listenDestroy);
      Lampa.PlayerVideo.listener.follow('tracks', listenTracks);
      Lampa.PlayerVideo.listener.follow('subs', listenSubs);
      Lampa.PlayerVideo.listener.follow('webos_subs', listenWebosSubs);
      Lampa.PlayerVideo.listener.follow('webos_tracks', listenWebosTracks);
      Lampa.PlayerVideo.listener.follow('canplay', canPlay);
      listenStart();
    }
    function parseMetainfo(data) {
      var loading = Lampa.Template.get('tracks_loading');
      data.item.after(loading);
      reguest(data.element, function (result) {
        if (list_opened) {
          var append = function append(name, fields) {
            if (fields.length) {
              var block = Lampa.Template.get('tracks_metainfo_block', {});
              block.find('.tracks-metainfo__label').text(Lampa.Lang.translate(name == 'video' ? 'extensions_hpu_video' : name == 'audio' ? 'player_tracks' : 'player_' + name));
              fields.forEach(function (data) {
                var item = $('<div class="tracks-metainfo__item tracks-metainfo__item--' + name + ' selector"></div>');
                item.on('hover:focus', function (e) {
                  Lampa.Modal.scroll().update(item);
                });
                for (var i in data) {
                  var div = $('<div class="tracks-metainfo__column--' + i + '"></div>');
                  div.text(data[i]);
                  item.append(div);
                }
                block.find('.tracks-metainfo__info').append(item);
              });
              html.append(block);
            }
          };
          var video = [];
          var audio = [];
          var subs = [];
          var codec_video = result.streams.filter(function (a) {
            return a.codec_type == 'video';
          });
          var codec_audio = result.streams.filter(function (a) {
            return a.codec_type == 'audio';
          });
          var codec_subs = result.streams.filter(function (a) {
            return a.codec_type == 'subtitle';
          });
          codec_video.slice(0, 1).forEach(function (v) {
            var line = {};
            if (v.width && v.height) line.video = v.width + 'х' + v.height;
            if (v.duration) {
              line.duration = new Date(v.duration * 1000).toISOString().slice(11, 19);
            } else if (v.tags) {
              if (v.tags.DURATION) {
                line.duration = v.tags.DURATION ? v.tags.DURATION.split(".") : '';
                line.duration.pop();
              } else if (v.tags["DURATION-eng"]) {
                line.duration = v.tags["DURATION-eng"] ? v.tags["DURATION-eng"].split(".") : '';
                line.duration.pop();
              }
            }
            if (v.codec_name) line.codec = v.codec_name.toUpperCase();
            if (Boolean(v.is_avc)) line.avc = 'AVC';
            var bit = v.bit_rate ? v.bit_rate : v.tags && (v.tags.BPS || v.tags["BPS-eng"]) ? v.tags.BPS || v.tags["BPS-eng"] : '--';
            line.rate = bit == '--' ? bit : Math.round(bit / 1000000) + ' ' + Lampa.Lang.translate('speed_mb');
            if (Lampa.Arrays.getKeys(line).length) video.push(line);
          });
          codec_audio.forEach(function (a, i) {
            var line = {
              num: i + 1
            };
            if (a.tags) {
              line.lang = (a.tags.language || '').toUpperCase();
            }
            line.name = a.tags ? a.tags.title || a.tags.handler_name : '';
            if (a.codec_name) line.codec = a.codec_name.toUpperCase();
            if (a.channel_layout) line.channels = a.channel_layout.replace('(side)', '').replace('stereo', '2.0').replace('8 channels (FL+FR+FC+LFE+SL+SR+TFL+TFR)', '7.1');
            var bit = a.bit_rate ? a.bit_rate : a.tags && (a.tags.BPS || a.tags["BPS-eng"]) ? a.tags.BPS || a.tags["BPS-eng"] : '--';
            line.rate = bit == '--' ? bit : Math.round(bit / 1000) + ' ' + Lampa.Lang.translate('speed_kb');
            if (Lampa.Arrays.getKeys(line).length) audio.push(line);
          });
          codec_subs.forEach(function (a, i) {
            var line = {
              num: i + 1
            };
            if (a.tags) {
              line.lang = (a.tags.language || '').toUpperCase();
            }
            line.name = a.tags ? a.tags.title || a.tags.handler_name : '';
            if (a.codec_name) line.codec = a.codec_name.toUpperCase().replace('SUBRIP', 'SRT').replace('HDMV_PGS_SUBTITLE', 'HDMV PGS').replace('MOV_TEXT', 'MOV TEXT');
            if (Lampa.Arrays.getKeys(line).length) subs.push(line);
          });
          var html = Lampa.Template.get('tracks_metainfo', {});
          append('video', video);
          append('audio', audio);
          append('subs', subs);
          loading.remove();
          if (video.length || audio.length || subs.length) {
            data.item.after(html);
          }
          if (Lampa.Controller.enabled().name == 'modal') Lampa.Controller.toggle('modal');
        }
      });
    }
    Lampa.Player.listener.follow('start', function (data) {
      if (data.torrent_hash) subscribeTracks(data);
    });
    Lampa.Listener.follow('torrent_file', function (data) {
      if (data.type == 'list_open') list_opened = true;
      if (data.type == 'list_close') list_opened = false;
      if (data.type == 'render' && data.items.length == 1 && list_opened) {
        parseMetainfo(data);
      }
    });
    Lampa.Template.add('tracks_loading', "\n    <div class=\"tracks-loading\">\n        <span>#{loading}...</span>\n    </div>\n");
    Lampa.Template.add('tracks_metainfo', "\n    <div class=\"tracks-metainfo\"></div>\n");
    Lampa.Template.add('tracks_metainfo_block', "\n    <div class=\"tracks-metainfo__line\">\n        <div class=\"tracks-metainfo__label\"></div>\n        <div class=\"tracks-metainfo__info\"></div>\n    </div>\n");
    Lampa.Template.add('tracks_css', "\n    <style>\n    \n    </style>\n");
    $('body').append(Lampa.Template.get('tracks_css', {}, true));

})();
