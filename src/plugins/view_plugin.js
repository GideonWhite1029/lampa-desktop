(function () {
    'use strict';

    function startPlugin() {
      window.view_plugin_ready = true;
      function showList() {
        Lampa.Account.plugins(function (plugins) {
          var original = plugins.filter(function (plugin) {
            return plugin.status;
          }).map(function (plugin) {
            return plugin.url;
          }).concat(Lampa.Storage.get('plugins', '[]').filter(function (plugin) {
            return plugin.status;
          }).map(function (plugin) {
            return plugin.url;
          }));
          var include = [];
          original.forEach(function (url) {
            var encode = url;
            if (!/[0-9]{1,3}[.][0-9]{1,3}[.][0-9]{1,3}[.][0-9]{1,3}/.test(encode)) {
              encode = encode.replace(/\{storage_(\w+|\d+|_|-)\}/g, function (match, key) {
                return encodeURIComponent(Lampa.Base64.encode(localStorage.getItem(key) || ''));
              });
              var email = localStorage.getItem('account_email');
              if (Lampa.Account.logged() && email) encode = Lampa.Utils.addUrlComponent(encode, 'email=' + encodeURIComponent(Lampa.Base64.encode(email)));
              encode = Lampa.Utils.addUrlComponent(encode, 'logged=' + encodeURIComponent(Lampa.Account.logged() ? 'true' : 'false'));
              encode = Lampa.Utils.addUrlComponent(encode, 'random=' + Math.random());
            }
            include.push(encode);
          });
          Lampa.Select.show({
            title: 'Плагины',
            items: original.map(function (p, i) {
              return {
                title: ' ' + p,
                url: include[i]
              };
            }),
            onSelect: function onSelect(select) {
              var html = $('<div></div>');
              var iframe = $('<iframe style="width: 100%; height: 28em; background: #fff; pointer-events: none; border: 0; border-radius: 0.3em"></iframe>');
              html.append('<div style="margin-bottom: 1em">Адрес: ' + select.url + '</div>');
              html.append(iframe);
              iframe.attr('src', select.url);
              Lampa.Controller.toggle('content');
              Lampa.Modal.open({
                title: '',
                size: 'large',
                html: html,
                onBack: function onBack() {
                  Lampa.Modal.close();
                  Lampa.Controller.toggle('content');
                }
              });
            },
            onBack: function onBack() {
              Lampa.Controller.toggle('menu');
            }
          });
        });
      }
      Lampa.Template.add('trailer', "\n        <div class=\"card selector card--trailer\">\n            <div class=\"card__view\">\n                <img src=\"./img/img_load.svg\" class=\"card__img\">\n            </div>\n            <div class=\"card__promo\">\n                <div class=\"card__promo-text\">\n                    <div class=\"card__title\"></div>\n                </div>\n                <div class=\"card__details\"></div>\n            </div>\n            <div class=\"card__play\">\n                <img src=\"./img/icons/player/play.svg\">\n            </div>\n        </div>\n    ");
      function add() {
        var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg height=\"44\" viewBox=\"0 0 44 44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect width=\"21\" height=\"21\" rx=\"2\" fill=\"white\"></rect>\n                    <mask id=\"path-2-inside-1_154:24\" fill=\"white\">\n                    <rect x=\"2\" y=\"27\" width=\"17\" height=\"17\" rx=\"2\"></rect>\n                    </mask>\n                    <rect x=\"2\" y=\"27\" width=\"17\" height=\"17\" rx=\"2\" stroke=\"white\" stroke-width=\"6\" mask=\"url(#path-2-inside-1_154:24)\"></rect>\n                    <rect x=\"27\" y=\"2\" width=\"17\" height=\"17\" rx=\"2\" fill=\"white\"></rect>\n                    <rect x=\"27\" y=\"34\" width=\"17\" height=\"3\" fill=\"white\"></rect>\n                    <rect x=\"34\" y=\"44\" width=\"17\" height=\"3\" transform=\"rotate(-90 34 44)\" fill=\"white\"></rect>\n                </svg>\n            </div>\n            <div class=\"menu__text\">\u0410\u043D\u0430\u043B\u0438\u0437</div>\n        </li>");
        button.on('hover:enter', showList);
        $('.menu .menu__list').eq(0).append(button);
      }
      if (window.appready) add();else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }
    if (!window.view_plugin_ready) startPlugin();

})();
