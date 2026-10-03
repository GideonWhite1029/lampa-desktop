(function () {
  if (window.__desktopResumeLoaded) return;
  window.__desktopResumeLoaded = true;

  var STORE_KEY = 'desktop_torrent_resume';
  var MAX_RECORDS = 200;
  var SEND_EVERY_MS = 15000;
  var SEND_DELAY_MS = 3000;
  var AUTOPLAY_WINDOW_MS = 120000;

  var lastTorrent = null;
  var playing = {};
  var pending = {};
  var lastSent = {};
  var timers = {};
  var autoplay = null;
  var network;
  var opener;
  var warmer;
  var warmTimer;
  var WARM_EVERY_MS = 20000;
  var WARM_MAX_MS = 10 * 60 * 1000;

  function whenReady(cb) {
    if (window.Lampa && Lampa.Listener && Lampa.Timeline && Lampa.Timeline.listener &&
        Lampa.Torrent && Lampa.Torserver && Lampa.Storage && Lampa.Activity && Lampa.Reguest && Lampa.Loading) return cb();
    setTimeout(function () { whenReady(cb); }, 200);
  }

  function movieKey(movie) {
    if (!movie) return '';
    var name = movie.original_name || movie.original_title;
    return name ? String(Lampa.Utils.hash(name)) : '';
  }

  function sameHash(a, b) {
    return !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();
  }

  function readAll() {
    var all = Lampa.Storage.get(STORE_KEY, '{}');
    return all && typeof all === 'object' ? all : {};
  }

  function getRecord(key) {
    return key ? readAll()[key] : null;
  }

  function saveRecord(key, patch) {
    if (!key) return;
    var all = readAll();
    var rec = all[key] || {};
    for (var k in patch) rec[k] = patch[k];
    rec.updated = Date.now();
    all[key] = rec;

    var keys = Object.keys(all);
    if (keys.length > MAX_RECORDS) {
      keys.sort(function (a, b) { return (all[a].updated || 0) - (all[b].updated || 0); });
      keys.slice(0, keys.length - MAX_RECORDS).forEach(function (k) { delete all[k]; });
    }
    Lampa.Storage.set(STORE_KEY, all);
  }

  function sendViewed(info, time) {
    var base = Lampa.Torserver.url();
    if (!base || !info.torrent_hash || info.file_id == null) return;
    network.silent(base + '/viewed', function () {}, function () {}, JSON.stringify({
      action: 'set',
      hash: info.torrent_hash,
      file_index: info.file_id,
      timecode: Math.max(0, Math.round(time || 0))
    }), { dataType: 'text' });
  }

  function flush(hash) {
    clearTimeout(timers[hash]);
    delete timers[hash];
    var p = pending[hash];
    if (!p) return;
    delete pending[hash];
    lastSent[hash] = Date.now();
    sendViewed(p.info, p.time);
  }

  function queue(hash, info, time) {
    pending[hash] = { info: info, time: time };
    if (Date.now() - (lastSent[hash] || 0) > SEND_EVERY_MS) flush(hash);
    else if (!timers[hash]) timers[hash] = setTimeout(function () { flush(hash); }, SEND_DELAY_MS);
  }

  function onTimelineUpdate(e) {
    var data = e && e.data;
    if (!data || !data.road) return;
    var info = playing[data.hash];
    if (!info) return;

    queue(data.hash, info, data.road.time);

    if (data.road.time > 0) {
      saveRecord(info.key, {
        torrent_hash: info.torrent_hash,
        file_id: info.file_id,
        season: info.season,
        episode: info.episode,
        timeline_hash: data.hash
      });
    }
  }

  function onTorrent(e) {
    if (e.type !== 'onenter' || !e.element) return;
    var el = e.element;
    lastTorrent = {
      title: el.title || el.Title || '',
      link: el.MagnetUri || el.Link || '',
      poster: el.poster || ''
    };
  }

  function onTorrentFile(e) {
    if (e.type === 'list_close') {
      lastTorrent = null;
      return;
    }

    if (e.type === 'render' && e.element && typeof e.element.url === 'string') {
      var view = e.element.timeline;
      if (view && view.time > 30 && view.percent < 90) e.element.url = e.element.url.replace('&preload', '&play');
    }

    if (e.type === 'render' && autoplay && e.element && e.item) {
      if (Date.now() > autoplay.until) {
        autoplay = null;
      } else if (e.element.id == autoplay.file_id && sameHash(e.element.torrent_hash, autoplay.torrent_hash)) {
        autoplay = null;
        var item = e.item;
        setTimeout(function () { item.trigger('hover:enter'); }, 0);
      }
      return;
    }

    if (e.type !== 'onenter' || !e.element) return;

    var movie = (e.params && e.params.movie) || {};
    var key = movieKey(movie);
    var el = e.element;

    playing = {};
    (el.playlist && el.playlist.length ? el.playlist : [el]).forEach(function (p) {
      if (!p.timeline || !p.timeline.hash) return;
      playing[p.timeline.hash] = {
        key: key,
        torrent_hash: p.torrent_hash,
        file_id: p.id,
        season: p.season,
        episode: p.episode
      };
    });

    var rec = {
      torrent_hash: el.torrent_hash,
      file_id: el.id,
      season: el.season,
      episode: el.episode,
      timeline_hash: el.timeline ? el.timeline.hash : ''
    };
    if (lastTorrent && lastTorrent.link) {
      rec.link = lastTorrent.link;
      rec.title = lastTorrent.title;
      rec.poster = lastTorrent.poster;
    }
    saveRecord(key, rec);
  }

  function resume(movie) {
    var rec = getRecord(movieKey(movie));

    if (!rec || !rec.torrent_hash || rec.file_id == null) {
      Lampa.Noty.show('Нет сохранённого торрента для продолжения — выберите раздачу в списке');
      return;
    }

    autoplay = { torrent_hash: rec.torrent_hash, file_id: rec.file_id, until: Date.now() + AUTOPLAY_WINDOW_MS };

    var addByLink = function () {
      if (!rec.link) {
        autoplay = null;
        Lampa.Noty.show('Раздача больше не доступна в TorrServer — выберите её в списке торрентов');
        return;
      }
      lastTorrent = { title: rec.title || '', link: rec.link, poster: rec.poster || '' };
      Lampa.Torrent.start({ title: rec.title || movie.title || movie.name || '', MagnetUri: rec.link, poster: rec.poster || '' }, movie);
    };

    var base = Lampa.Torserver.url();
    if (!base) return addByLink();
    Lampa.Loading.start(function () {
      autoplay = null;
      opener.clear();
      Lampa.Loading.stop();
    });
    opener.timeout(15000);
    opener.silent(base + '/stream?link=' + rec.torrent_hash + '&stat', function () {
      Lampa.Loading.stop();
      Lampa.Torrent.open(rec.torrent_hash, movie);
    }, function () {
      Lampa.Loading.stop();
      addByLink();
    });
  }

  function savedTime(rec) {
    var view = rec && rec.timeline_hash ? Lampa.Timeline.view(rec.timeline_hash) : null;
    return view && view.time > 0 ? Lampa.Utils.secondsToTime(view.time) : '';
  }

  function decorate(block) {
    if (block.__desktopResume) return;
    block.__desktopResume = true;
    block.addEventListener('hover:enter', function () {
      resume((Lampa.Activity.active() || {}).movie);
    });

    var time = savedTime(getRecord(movieKey((Lampa.Activity.active() || {}).movie)));
    var body = block.querySelector('.watched-history__body');
    if (body && time) {
      var span = document.createElement('span');
      span.textContent = time;
      body.appendChild(span);
    }
  }

  var PLAY_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M7 4.5v15a.5.5 0 00.77.42l11.5-7.5a.5.5 0 000-.84L7.77 4.08A.5.5 0 007 4.5z" fill="currentColor"/></svg>';

  function onFull(e) {
    if (e.type !== 'complite' || !e.data || !e.data.movie || !e.body) return;
    var movie = e.data.movie;
    var rec = getRecord(movieKey(movie));
    if (!rec || !rec.torrent_hash || rec.file_id == null) return;

    var parts = [];
    if (rec.season && rec.episode) parts.push('S' + rec.season + 'E' + rec.episode);
    else if (rec.episode) parts.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + rec.episode);
    var time = savedTime(rec);
    if (time) parts.push(time);

    var buttons = e.body.find('.full-start-new__buttons');
    buttons.find('.button--desktop-resume').remove();

    var btn = $('<div class="full-start__button selector button--desktop-resume">' + PLAY_ICON + '<span></span></div>');
    btn.find('span').text('Продолжить' + (parts.length ? ' · ' + parts.join(' · ') : ''));
    btn.on('hover:enter', function () { resume(movie); });
    buttons.prepend(btn);

    warm(rec.torrent_hash, movie);
  }

  function warm(hash, movie) {
    clearInterval(warmTimer);
    var base = Lampa.Torserver.url();
    if (!base) return;
    var until = Date.now() + WARM_MAX_MS;
    var ping = function () {
      var a = Lampa.Activity.active() || {};
      if (Date.now() > until || a.component !== 'full' || String(a.id) !== String(movie.id)) {
        clearInterval(warmTimer);
        return;
      }
      warmer.timeout(10000);
      warmer.silent(base + '/stream?link=' + hash + '&stat', function () {}, function () {});
    };
    ping();
    warmTimer = setInterval(ping, WARM_EVERY_MS);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.classList && root.classList.contains('watched-history')) decorate(root);
    var found = root.querySelectorAll('.watched-history');
    for (var i = 0; i < found.length; i++) decorate(found[i]);
  }

  whenReady(function () {
    network = new Lampa.Reguest();
    opener = new Lampa.Reguest();
    warmer = new Lampa.Reguest();

    if (!Lampa.Storage.get('desktop_tracktimecode_seeded', false)) {
      Lampa.Storage.set('torrserver_tracktimecode', true);
      Lampa.Storage.set('desktop_tracktimecode_seeded', true);
    }

    Lampa.Listener.follow('torrent', onTorrent);
    Lampa.Listener.follow('torrent_file', onTorrentFile);
    Lampa.Listener.follow('full', onFull);
    Lampa.Timeline.listener.follow('update', onTimelineUpdate);

    scan(document.body);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        for (var i = 0; i < m.addedNodes.length; i++) scan(m.addedNodes[i]);
      });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
