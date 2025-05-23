(function () {
    'use strict';

    function show() {
      var html = $("<div class=\"womens_day\">\n        <div class=\"womens_day__image\">\n            <img class=\"womens_day__img\">\n        </div>\n        <div class=\"womens_day__title\">".concat(Lampa.Lang.translate('womens_day_title'), "</div>\n        <div class=\"womens_day__details\">").concat(Lampa.Lang.translate('womens_day_details'), "</div>\n    </div>"));
      var enabled = Lampa.Controller.enabled().name;
      Lampa.Modal.open({
        title: '',
        html: html,
        size: 'medium',
        nopadding: true,
        onBack: function onBack() {
          Lampa.Modal.close();
          Lampa.Controller.toggle(enabled);
        }
      });
      var img = html.find('.womens_day__img');
      Lampa.Utils.imgLoad(img[0], Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/img/other/8day.jpg', function () {
        img.addClass('--loaded');
      });
      Lampa.Modal.scroll().render(true).addClass('scroll--nopadding');
    }
    function startPlugin() {
      Lampa.Lang.add({
        womens_day_title: {
          ru: '40% скидка в честь 8 Марта!',
          uk: '40% знижка на честь 8 Березня!',
          be: '40% зніжка на гонар 8 Сакавіка!'
        },
        womens_day_details: {
          ru: 'Акция действует 8 и 9 марта 2025 года. Поздравьте своих любимых женщин с праздником и подарите им подписку <b>CUB Premium</b>, подробнее на сайте <span>https://cub.red/premium</span> или <span>https://cub.rip/premium</span>',
          uk: 'Акція діє 8 та 9 березня 2025 року. Привітайте своїх улюблених жінок з святом і подаруйте їм підписку <b>CUB Premium</b>, детальніше на сайті <span>https://cub.red/premium</span> або <span>https://cub.rip/premium</span>',
          be: 'Акцыя дзейнічае 8 і 9 сакавіка 2025 года. Паградуйце сваіх любімых жанчын з святам і падаруйце ім падпіску <b>CUB Premium</b>, падрабязней на сайце <span>https://cub.red/premium</span> ці <span>https://cub.rip/premium</span>'
        }
      });
      var button = $("<div class=\"head__action head__settings selector womens_day__button\">\n        <svg width=\"120\" height=\"115\" viewBox=\"0 0 120 115\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <path d=\"M80.0537 23.5794C80.0537 15.3916 67.0291 5.14876 61.972 1.47659C61.3997 1.06128 60.7099 0.837524 60.0018 0.837524C59.2938 0.837524 58.6039 1.06128 58.0317 1.47659C52.9745 5.14853 39.95 15.3916 39.95 23.5794C39.95 27.8278 41.273 31.8854 43.7766 35.3141L60.0021 57.5488L76.2275 35.3141C78.7308 31.8854 80.0537 27.8278 80.0537 23.5794ZM118.618 42.4642C113.549 38.809 99.7422 29.6382 91.9246 32.1695C87.8682 33.4829 84.4032 35.9906 81.9036 39.4221L65.6906 61.6657L91.9361 70.1612C95.9838 71.4727 100.267 71.4713 104.323 70.1579C112.141 67.6266 117.894 52.1222 119.836 46.1966C120.056 45.5261 120.056 44.8035 119.837 44.1328C119.619 43.4621 119.192 42.8778 118.618 42.4642ZM28.0664 70.1612L54.3119 61.6657L38.0989 39.4221C35.5993 35.9904 32.134 33.4829 28.0779 32.1695C20.2605 29.6382 6.45385 38.809 1.38452 42.4642C0.811064 42.8779 0.384158 43.4621 0.165235 44.1328C-0.0536884 44.8035 -0.05334 45.5261 0.16623 46.1966C2.10874 52.1222 7.86174 67.6266 15.6794 70.1579C19.7357 71.4713 24.0187 71.4727 28.0664 70.1612ZM89.7662 76.8103L63.517 68.3267V95.8144C63.5158 100.054 64.8408 104.111 67.3483 107.548C72.1814 114.171 88.7631 114.829 95.0214 114.838C95.7295 114.838 96.4195 114.615 96.9923 114.201C97.565 113.786 97.9909 113.201 98.2087 112.53C100.132 106.598 104.621 90.685 99.7882 84.0618C97.2806 80.6251 93.8153 78.1177 89.7662 76.8103ZM20.2143 84.0615C15.3812 90.6848 19.8705 106.598 21.7938 112.53C22.0116 113.201 22.4375 113.786 23.0102 114.2C23.583 114.615 24.273 114.838 24.9811 114.837C31.2394 114.829 47.821 114.171 52.6541 107.547C55.1619 104.111 56.4869 100.054 56.4855 95.8141V68.3267L30.236 76.8103C26.1872 78.1177 22.7219 80.6251 20.2143 84.0615Z\" fill=\"currentColor\"/>\n        </svg>\n    </div>");
      button.on('hover:enter', show);
      setInterval(function () {
        if (Lampa.Player.opened()) return;
        button.addClass('--animate');
        setTimeout(function () {
          button.removeClass('--animate');
        }, 2000);
      }, 1000 * 10);
      Lampa.Head.render().find('.open--search').after(button);
      Lampa.Template.add('womens_day_css', "\n        <style>\n        .womens_day__button.--animate:not(.focus){background:-webkit-linear-gradient(45deg,rgba(255,255,255,0) 0,rgba(255,255,255,0) 40%,#fff 50%,rgba(255,255,255,0) 60%,rgba(255,255,255,0) 100%);background:-o-linear-gradient(45deg,rgba(255,255,255,0) 0,rgba(255,255,255,0) 40%,#fff 50%,rgba(255,255,255,0) 60%,rgba(255,255,255,0) 100%);background:linear-gradient(45deg,rgba(255,255,255,0) 0,rgba(255,255,255,0) 40%,#fff 50%,rgba(255,255,255,0) 60%,rgba(255,255,255,0) 100%);-webkit-background-size:400% 400%;background-size:400% 400%;-webkit-animation:head-icon-blick 1s ease forwards;-o-animation:head-icon-blick 1s ease forwards;animation:head-icon-blick 1s ease forwards}.womens_day__button.--animate svg{-webkit-animation:bf-a-rubber .4s;-o-animation:bf-a-rubber .4s;animation:bf-a-rubber .4s}.womens_day{line-height:1.6}.womens_day__image{position:relative;padding-bottom:50%;margin-bottom:1em;background:rgba(255,255,255,0.1);-webkit-border-radius:.3em;border-radius:.3em}.womens_day__img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;transition:opacity .3s}.womens_day__img.--loaded{opacity:1}.womens_day__title{font-size:1.6em;margin-bottom:1em}.womens_day__details{font-size:1.1em}.womens_day__details span{color:#d3b38b}\n        </style>\n    ");
      $('body').append(Lampa.Template.get('womens_day_css', {}, true));
    }
    if (!window.womens_day) {
      window.womens_day = true;
      var date_start = '2025-03-08:00:00';
      var date_end = '2025-03-09T23:00:00';
      var time_start = new Date(date_start).getTime();
      var time_end = new Date(date_end).getTime();
      var time_now = new Date().getTime();
      var nosuport = false; //Lampa.Platform.is('netcast') || Lampa.Platform.is('orsay')

      if (time_now > time_start && time_now < time_end && Lampa.Lang.selected(['ru', 'uk', 'be']) && !nosuport && !window.lampa_settings.iptv) {
        if (window.appready) startPlugin();else {
          Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
          });
        }
      }
    }

})();
