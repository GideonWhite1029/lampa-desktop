(function () {
  if (window.__lampaSyncLoaded) return;
  window.__lampaSyncLoaded = true;

  var POLL_MS = 15000;
  var POLL_HIDDEN_MS = 60000;
  var PUSH_DELAY_MS = 1500;
  var KV = { resume: 'desktop_torrent_resume', audio: 'desktop_audio_choice' };
  var WHERE = ['book', 'like', 'wath', 'history', 'look', 'viewed', 'scheduled', 'continued', 'thrown'];

  var SETTINGS = [
    'parser_use', 'parser_torrent_type', 'parse_lang', 'parse_in_search',
    'jackett_url', 'jackett_url_two', 'prowlarr_url',
    'torrserver_tracktimecode', 'torrserver_savedb', 'torrserver_preload',
    'desktop_audio_lang', 'player_timecode', 'playlist_next', 'tmdb_lang', 'language'
  ];

  var script = document.currentScript && document.currentScript.src || '';
  var scriptToken = (/[?&]token=([^&#]+)/.exec(script) || [])[1] || '';
  var origin = /^https?:\/\//.test(script) ? script.split('/').slice(0, 3).join('/') : '';

  try {
    if (origin && !window.localStorage.getItem('torrserver_url')) {
      window.localStorage.setItem('torrserver_url', origin.split('//')[1].split(':')[0] + ':8090');
    }
  } catch (error) {
  }

  var outbox = { timeline: {}, fav: [], kv: {} };
  var applying = false;
  var busy = false;
  var pushTimer = null;
  var kvSeen = {};

  function whenReady(cb) {
    if (window.Lampa && Lampa.Storage && Lampa.Timeline && Lampa.Timeline.listener &&
        Lampa.Favorite && Lampa.Favorite.listener && Lampa.Utils && window.appready) return cb();
    setTimeout(function () { whenReady(cb); }, 300);
  }

  function serverUrl() {
    var custom = Lampa.Storage.get('lampa_sync_url', '');
    return String(custom || origin || 'http://127.0.0.1:8095').replace(/\/+$/, '');
  }

  function syncToken() {
    return String(Lampa.Storage.get('lampa_sync_token', '') || (scriptToken && decodeURIComponent(scriptToken)) || '');
  }

  function outboxEmpty() {
    return !Object.keys(outbox.timeline).length && !outbox.fav.length && !Object.keys(outbox.kv).length;
  }

  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(sync, PUSH_DELAY_MS);
  }

  function onTimeline(e) {
    if (applying || !e || !e.data || !e.data.road) return;
    outbox.timeline[e.data.hash] = e.data.road;
    schedulePush();
  }

  function favT() {
    var t = Lampa.Storage.get('lampa_sync_fav_t', '{}');
    return t && typeof t === 'object' ? t : {};
  }

  function setFavT(key, t) {
    var all = favT();
    all[key] = t;
    Lampa.Storage.set('lampa_sync_fav_t', all);
  }

  function queueFav(where, card, on) {
    if (!card || card.id == null || WHERE.indexOf(where) < 0) return;
    var t = Date.now();
    setFavT(where + ':' + card.id, t);
    outbox.fav.push({ where: where, id: card.id, on: on, t: t, card: on ? Lampa.Utils.clearCard(Lampa.Arrays.clone(card)) : null });
    schedulePush();
  }

  function onFavorite(e) {
    if (applying || !e) return;
    if (e.type === 'add' || e.type === 'added') queueFav(e.where, e.card, true);
    else if (e.type === 'remove' && e.method === 'id') queueFav(e.where, e.card, false);
  }

  function collectKv() {
    Object.keys(KV).forEach(function (ns) {
      var all = Lampa.Storage.get(KV[ns], '{}');
      if (!all || typeof all !== 'object') return;
      Object.keys(all).forEach(function (key) {
        var rec = all[key];
        var id = ns + ':' + key;
        var u = rec && rec.updated || 0;
        if (u && kvSeen[id] !== u) {
          kvSeen[id] = u;
          outbox.kv[id] = { v: rec, u: u };
        }
      });
    });
  }

  function rawSetting(name) {
    try { return window.localStorage.getItem(name); } catch (error) { return null; }
  }

  function settingsU() {
    var u = Lampa.Storage.get('lampa_sync_settings_u', '{}');
    return u && typeof u === 'object' ? u : {};
  }

  function setSettingU(name, u) {
    var all = settingsU();
    all[name] = u;
    Lampa.Storage.set('lampa_sync_settings_u', all);
  }

  function seedSettings() {
    SETTINGS.forEach(function (name) {
      var v = rawSetting(name);
      if (v !== null && v !== '') outbox.kv['settings:' + name] = { v: v, u: 1 };
    });
  }

  function onStorage(e) {
    if (applying || !e) return;
    if (SETTINGS.indexOf(e.name) >= 0) {
      var u = Date.now();
      setSettingU(e.name, u);
      outbox.kv['settings:' + e.name] = { v: rawSetting(e.name), u: u };
      schedulePush();
      return;
    }
    for (var ns in KV) {
      if (KV[ns] === e.name) {
        collectKv();
        if (Object.keys(outbox.kv).length) schedulePush();
        return;
      }
    }
  }

  function queueEverything() {
    var views = Lampa.Storage.get(Lampa.Timeline.filename(), '{}') || {};
    Object.keys(views).forEach(function (hash) {
      var road = views[hash];
      if (road && typeof road === 'object') outbox.timeline[hash] = road;
    });

    var fav = Lampa.Favorite.full();
    var now = Date.now();
    var t = favT();
    WHERE.forEach(function (where) {
      (fav[where] || []).forEach(function (id, index) {
        var card = (fav.card || []).filter(function (c) { return c.id == id; })[0];
        if (!card) return;
        var key = where + ':' + id;
        if (!t[key]) t[key] = now - index * 1000;
        outbox.fav.push({ where: where, id: id, on: true, t: t[key], card: card });
      });
    });
    Lampa.Storage.set('lampa_sync_fav_t', t);

    collectKv();
  }

  function applyTimeline(timeline) {
    var views = Lampa.Storage.get(Lampa.Timeline.filename(), '{}') || {};
    Object.keys(timeline).forEach(function (hash) {
      var road = timeline[hash];
      var cur = views[hash];
      if (cur && typeof cur === 'object' && (cur.updated || 0) >= (road.updated || 0)) return;
      Lampa.Timeline.update({
        hash: hash, percent: road.percent, time: road.time, duration: road.duration,
        profile: road.profile, updated: road.updated, received: true
      });
    });
  }

  function applyFav(list) {
    var fav = Lampa.Favorite.full();
    var t = favT();

    list.sort(function (a, b) { return a.t - b.t; }).forEach(function (f) {
      var key = f.where + ':' + f.id;
      var has = (fav[f.where] || []).some(function (id) { return id == f.id; });
      if ((t[key] || 0) >= f.t) return;
      t[key] = f.t;

      if (f.on && f.card) {
        Lampa.Favorite.add(f.where, f.card, f.where === 'history' ? 100 : undefined);
      } else if (!f.on && has) {
        Lampa.Favorite.remove(f.where, { id: f.id });
      }
    });

    Lampa.Storage.set('lampa_sync_fav_t', t);
  }

  function applyKv(kv) {
    var touched = {};
    var su = settingsU();
    Object.keys(kv).forEach(function (id) {
      var ns = id.split(':')[0];
      var key = id.slice(ns.length + 1);

      if (ns === 'settings') {
        if (SETTINGS.indexOf(key) < 0 || (su[key] || 0) >= kv[id].u) return;
        su[key] = kv[id].u;
        if (kv[id].v === null) Lampa.Storage.set(key, '');
        else Lampa.Storage.set(key, kv[id].v);
        return;
      }

      var name = KV[ns];
      if (!name) return;
      var all = touched[name] || Lampa.Storage.get(name, '{}') || {};
      var cur = all[key];
      if (cur && (cur.updated || 0) >= kv[id].u) return;
      all[key] = kv[id].v;
      touched[name] = all;
      kvSeen[id] = kv[id].u;
    });
    Object.keys(touched).forEach(function (name) { Lampa.Storage.set(name, touched[name]); });
    Lampa.Storage.set('lampa_sync_settings_u', su);
  }

  function apply(res) {
    applying = true;
    try {
      if (res.timeline) applyTimeline(res.timeline);
      if (res.fav && res.fav.length) applyFav(res.fav);
      if (res.kv) applyKv(res.kv);
    } catch (error) {
      console.log('LampaSync', 'apply error', error && error.message);
    }
    applying = false;
  }

  function sync() {
    if (busy) return schedulePush();
    busy = true;
    clearTimeout(pushTimer);

    var batch = outbox;
    outbox = { timeline: {}, fav: [], kv: {} };
    var since = parseInt(Lampa.Storage.get('lampa_sync_cursor', '0'), 10) || 0;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', serverUrl() + '/sync', true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.setRequestHeader('Authorization', 'Bearer ' + syncToken());
    xhr.timeout = 20000;
    xhr.onload = function () {
      busy = false;
      var res;
      try { res = JSON.parse(xhr.responseText); } catch (e) { res = null; }
      if (xhr.status !== 200 || !res) return restore(batch);
      apply(res);
      Lampa.Storage.set('lampa_sync_cursor', String(res.cursor || since));
      if (!outboxEmpty()) schedulePush();
    };
    xhr.onerror = xhr.ontimeout = function () {
      busy = false;
      restore(batch);
    };
    xhr.send(JSON.stringify({ since: since, timeline: batch.timeline, fav: batch.fav, kv: batch.kv }));
  }

  function restore(batch) {
    Object.keys(batch.timeline).forEach(function (h) {
      if (!outbox.timeline[h]) outbox.timeline[h] = batch.timeline[h];
    });
    outbox.fav = batch.fav.concat(outbox.fav);
    Object.keys(batch.kv).forEach(function (k) {
      if (!outbox.kv[k]) outbox.kv[k] = batch.kv[k];
    });
  }

  whenReady(function () {
    Lampa.Timeline.listener.follow('update', onTimeline);
    Lampa.Favorite.listener.follow('add', function (e) { e.type = 'add'; onFavorite(e); });
    Lampa.Favorite.listener.follow('added', function (e) { e.type = 'added'; onFavorite(e); });
    Lampa.Favorite.listener.follow('remove', function (e) { e.type = 'remove'; onFavorite(e); });
    Lampa.Storage.listener.follow('change', onStorage);

    if (!Lampa.Storage.get('lampa_sync_joined', false)) {
      queueEverything();
      Lampa.Storage.set('lampa_sync_joined', true);
    } else {
      collectKv();
    }
    if (!Lampa.Storage.get('lampa_sync_settings_seeded', false)) {
      seedSettings();
      Lampa.Storage.set('lampa_sync_settings_seeded', true);
    }

    sync();
    var lastPoll = Date.now();
    setInterval(function () {
      if (!document.hidden || Date.now() - lastPoll >= POLL_HIDDEN_MS) {
        lastPoll = Date.now();
        sync();
      }
    }, POLL_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) sync();
    });
  });
})();
