/**
 * Adds a "Приложение" section to Lampa's own Settings screen so the desktop-only
 * options (DNS-over-HTTPS, proxy, Lampa core auto-update) are discoverable there
 * instead of only in the hidden Electron menu bar.
 *
 * Runs in the page (main world); talks to the main process through window.api.
 */
(function () {
  if (!window.api || typeof window.api.desktopConfig !== 'function') return;

  var ICON = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 0c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9m0-18C9.5 5.5 8.5 9 8.5 12s1 6.5 3.5 9M3.5 12h17" ' +
    'stroke="white" stroke-width="1.6" stroke-linecap="round"/></svg>';

  function whenReady(cb) {
    if (window.Lampa && Lampa.SettingsApi && Lampa.Storage && Lampa.Lang && Lampa.Noty) return cb();
    setTimeout(function () { whenReady(cb); }, 200);
  }

  whenReady(function () {
    window.api.desktopConfig().then(function (cfg) {
      cfg = cfg || {};

      // seed the visual state without firing onChange
      Lampa.Storage.set('desktop_doh', !!cfg.doh, true);
      Lampa.Storage.set('desktop_proxy', cfg.proxy || '', true);
      Lampa.Storage.set('desktop_lampa_autoupdate', cfg.lampaAutoUpdate !== false, true);

      Lampa.SettingsApi.addComponent({
        component: 'desktop_app',
        name: 'Приложение',
        icon: ICON
      });

      Lampa.SettingsApi.addParam({
        component: 'desktop_app',
        param: { name: 'desktop_doh', type: 'trigger', 'default': false },
        field: {
          name: 'DNS через HTTPS',
          description: 'Обход блокировки DNS (например TMDB). Если после включения сеть пропадёт — выключите обратно. Требуется перезапуск.'
        },
        onChange: function () {
          window.api.setDesktop({ doh: !!Lampa.Storage.field('desktop_doh') });
          Lampa.Noty.show('Применится после перезапуска приложения');
        }
      });

      Lampa.SettingsApi.addParam({
        component: 'desktop_app',
        // `values` must be a string for a free-text input, otherwise Lampa's
        // update$3() does values[name][key] on undefined and the settings screen crashes.
        param: { name: 'desktop_proxy', type: 'input', values: '', 'default': '', placeholder: 'socks5://127.0.0.1:1080' },
        field: {
          name: 'Прокси',
          description: 'Напр. socks5://127.0.0.1:1080 или http://host:port. Пусто — без прокси. Требуется перезапуск.'
        },
        onChange: function () {
          window.api.setDesktop({ proxy: String(Lampa.Storage.field('desktop_proxy') || '') });
          Lampa.Noty.show('Применится после перезапуска приложения');
        }
      });

      Lampa.SettingsApi.addParam({
        component: 'desktop_app',
        param: { name: 'desktop_lampa_autoupdate', type: 'trigger', 'default': true },
        field: {
          name: 'Автообновление ядра Lampa',
          description: 'Проверять и подгружать свежие app.js / app.css при запуске'
        },
        onChange: function () {
          window.api.setDesktop({ lampaAutoUpdate: !!Lampa.Storage.field('desktop_lampa_autoupdate') });
        }
      });

      Lampa.SettingsApi.addParam({
        component: 'desktop_app',
        param: { name: 'desktop_core_check', type: 'button' },
        field: { name: 'Проверить обновление ядра Lampa сейчас' },
        onChange: function () {
          Lampa.Noty.show('Проверка…');
          window.api.checkLampaCore().then(function (r) {
            r = r || {};
            if (r.status === 'updated') Lampa.Noty.show('Ядро обновлено до ' + r.version + '. Перезапустите приложение.');
            else if (r.status === 'up-to-date') Lampa.Noty.show('Ядро актуально (' + r.version + ')');
            else Lampa.Noty.show('Не удалось проверить обновление ядра');
          }).catch(function () {
            Lampa.Noty.show('Не удалось проверить обновление ядра');
          });
        }
      });
    }).catch(function () { /* main process not answering; skip the panel */ });
  });
})();
