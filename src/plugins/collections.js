(function () {
    'use strict';

    function Collection(data) {
      this.data = data;
      function remove(elem) {
        if (elem) elem.remove();
      }
      this.build = function () {
        this.item = Lampa.Template.js('cub_collection');
        this.img = this.item.find('.card__img');
        this.icon = this.item.find('.cub-collection-card__user-icon img');
        this.item.find('.card__title').text(Lampa.Utils.capitalizeFirstLetter(data.title));
        this.item.find('.cub-collection-card__items').text(data.items_count);
        this.item.find('.cub-collection-card__date').text(Lampa.Utils.parseTime(data.time).full);
        this.item.find('.cub-collection-card__views').text(Lampa.Utils.bigNumberToShort(data.views));
        this.item.find('.full-review__like-counter').text(Lampa.Utils.bigNumberToShort(data.liked));
        this.item.find('.cub-collection-card__user-name').text(data.username);
        this.item.addEventListener('visible', this.visible.bind(this));
      };

      /**
       * Загрузить картинку
       */
      this.image = function () {
        var _this = this;
        this.img.onload = function () {
          _this.item.classList.add('card--loaded');
        };
        this.img.onerror = function () {
          _this.img.src = './img/img_broken.svg';
        };
        this.icon.onload = function () {
          _this.item.find('.cub-collection-card__user-icon').classList.add('loaded');
        };
        this.icon.onerror = function () {
          _this.icon.src = './img/img_broken.svg';
        };
      };

      /**
       * Создать
       */
      this.create = function () {
        var _this2 = this;
        this.build();
        this.item.addEventListener('hover:focus', function () {
          if (_this2.onFocus) _this2.onFocus(_this2.item, data);
        });
        this.item.addEventListener('hover:touch', function () {
          if (_this2.onTouch) _this2.onTouch(_this2.item, data);
        });
        this.item.addEventListener('hover:hover', function () {
          if (_this2.onHover) _this2.onHover(_this2.item, data);
        });
        this.item.addEventListener('hover:enter', function () {
          Lampa.Activity.push({
            url: data.id,
            collection: data,
            title: Lampa.Utils.capitalizeFirstLetter(data.title),
            component: 'cub_collections_view',
            page: 1
          });
        });
        this.item.addEventListener('hover:long', function () {
          var items = [];
          var voited = Lampa.Storage.cache('collections_voited', 100, []);
          items.push({
            title: 'Коллeкции @' + data.username,
            user: data.cid
          });
          if (voited.indexOf(data.id) == -1) {
            items = items.concat([{
              title: '<span class="settings-param__label">+1</span> ' + Lampa.Lang.translate('title_like'),
              like: 1
            }, {
              title: Lampa.Lang.translate('reactions_shit'),
              like: -1
            }]);
          }
          Lampa.Select.show({
            title: Lampa.Lang.translate('title_action'),
            items: items,
            onSelect: function onSelect(item) {
              Lampa.Controller.toggle('content');
              if (item.user) {
                Lampa.Activity.push({
                  url: 'user_' + item.user,
                  title: 'Коллeкции @' + data.username,
                  component: 'cub_collections_collection',
                  page: 1
                });
              } else {
                Api.liked({
                  id: data.id,
                  dir: item.like
                }, function () {
                  voited.push(data.id);
                  Lampa.Storage.set('collections_voited', voited);
                  data.liked += item.like;
                  _this2.item.find('.full-review__like-counter').text(Lampa.Utils.bigNumberToShort(data.liked));
                  Lampa.Bell.push({
                    text: Lampa.Lang.translate('discuss_voited')
                  });
                });
              }
            },
            onBack: function onBack() {
              Lampa.Controller.toggle('content');
            }
          });
        });
        this.image();
      };

      /**
       * Загружать картинку если видна карточка
       */
      this.visible = function () {
        this.img.src = Lampa.Api.img(data.backdrop_path, 'w500');
        this.icon.src = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/img/profiles/' + data.icon + '.png';
        if (this.onVisible) this.onVisible(this.item, data);
      };

      /**
       * Уничтожить
       */
      this.destroy = function () {
        this.img.onerror = function () {};
        this.img.onload = function () {};
        this.img.src = '';
        remove(this.item);
        this.item = null;
        this.img = null;
      };

      /**
       * Рендер
       * @returns {object}
       */
      this.render = function (js) {
        return js ? this.item : $(this.item);
      };
    }

    var network = new Lampa.Reguest();
    var api_url = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/api/collections/';
    var collections = [{
      hpu: 'user',
      title: 'Мои коллекции'
    }, {
      hpu: 'new',
      title: 'Новинки'
    }, {
      hpu: 'top',
      title: 'В топе'
    }, {
      hpu: 'week',
      title: 'Популярные за неделю'
    }, {
      hpu: 'month',
      title: 'Популярные за месяц'
    }, {
      hpu: 'big',
      title: 'Большие коллекции'
    }, {
      hpu: 'all',
      title: 'Все коллекции'
    }];
    function main(params, oncomplite, onerror) {
      var user = Lampa.Storage.get('account', '{}');
      var status = new Lampa.Status(collections.length);
      status.onComplite = function () {
        var keys = Object.keys(status.data);
        var sort = collections.map(function (a) {
          return a.hpu;
        });
        if (keys.length) {
          var fulldata = [];
          keys.sort(function (a, b) {
            return sort.indexOf(a) - sort.indexOf(b);
          });
          keys.forEach(function (key) {
            var data = status.data[key];
            data.title = collections.find(function (item) {
              return item.hpu == key;
            }).title;
            data.cardClass = function (elem, param) {
              return new Collection(elem);
            };
            fulldata.push(data);
          });
          oncomplite(fulldata);
        } else onerror();
      };
      collections.forEach(function (item) {
        if (item.hpu == 'user' && !user.token) return status.error();
        var url = api_url + 'list?category=' + item.hpu;
        if (item.hpu == 'user') url = api_url + 'list?cid=' + user.id;
        network.silent(url, function (data) {
          data.collection = true;
          data.line_type = 'collection';
          data.category = item.hpu;
          status.append(item.hpu, data);
        }, status.error.bind(status));
      });
    }
    function collection(params, oncomplite, onerror) {
      var url = api_url + 'list?category=' + params.url + '&page=' + params.page;
      if (params.url.indexOf('user') >= 0) {
        url = api_url + 'list?cid=' + params.url.split('_').pop() + '&page=' + params.page;
      }
      network.silent(url, function (data) {
        data.collection = true;
        data.total_pages = data.total_pages || 15;
        data.cardClass = function (elem, param) {
          return new Collection(elem);
        };
        oncomplite(data);
      }, onerror);
    }
    function liked(params, callaback) {
      network.silent(api_url + 'liked', callaback, function (a, e) {
        Lampa.Noty.show(network.errorDecode(a, e));
      }, params);
    }
    function full(params, oncomplite, onerror) {
      network.silent(api_url + 'view/' + params.url + '?page=' + params.page, function (data) {
        data.total_pages = data.total_pages || 15;
        oncomplite(data);
      }, onerror);
    }
    function clear() {
      network.clear();
    }
    var Api = {
      main: main,
      collection: collection,
      full: full,
      clear: clear,
      liked: liked
    };

    function component$2(object) {
      var comp = new Lampa.InteractionMain(object);
      comp.create = function () {
        var _this = this;
        this.activity.loader(true);
        Api.main(object, function (data) {
          _this.build(data);
        }, this.empty.bind(this));
        return this.render();
      };
      comp.onMore = function (data) {
        Lampa.Activity.push({
          url: data.category + (data.category == 'user' ? '_' + data.cid : ''),
          title: data.title,
          component: 'cub_collections_collection',
          page: 1
        });
      };
      return comp;
    }

    function component$1(object) {
      var comp = new Lampa.InteractionCategory(object);
      comp.create = function () {
        Api.full(object, this.build.bind(this), this.empty.bind(this));
      };
      comp.nextPageReuest = function (object, resolve, reject) {
        Api.full(object, resolve.bind(comp), reject.bind(comp));
      };
      return comp;
    }

    function component(object) {
      var comp = new Lampa.InteractionCategory(object);
      comp.create = function () {
        Api.collection(object, this.build.bind(this), this.empty.bind(this));
      };
      comp.nextPageReuest = function (object, resolve, reject) {
        Api.collection(object, resolve.bind(comp), reject.bind(comp));
      };
      comp.cardRender = function (object, element, card) {
        card.onMenu = false;
        card.onEnter = function () {
          Lampa.Activity.push({
            url: element.id,
            title: element.title,
            component: 'cub_collection',
            page: 1
          });
        };
      };
      return comp;
    }

    function startPlugin() {
      var manifest = {
        type: 'video',
        version: '1.1.2',
        name: 'Коллекции',
        description: '',
        component: 'cub_collections'
      };
      Lampa.Manifest.plugins = manifest;
      Lampa.Component.add('cub_collections_main', component$2);
      Lampa.Component.add('cub_collections_collection', component);
      Lampa.Component.add('cub_collections_view', component$1);
      Lampa.Template.add('cub_collection', "<div class=\"card cub-collection-card selector layer--visible layer--render card--collection\">\n        <div class=\"card__view\">\n            <img src=\"./img/img_load.svg\" class=\"card__img\">\n            <div class=\"cub-collection-card__head\">\n                <div class=\"cub-collection-card__items\"></div>\n                <div class=\"cub-collection-card__date\"></div>\n            </div>\n            <div class=\"cub-collection-card__bottom\">\n                <div class=\"cub-collection-card__views\"></div>\n                <div class=\"cub-collection-card__liked\">\n                    <div class=\"full-review__like-icon\">\n                        <svg width=\"29\" height=\"27\" viewBox=\"0 0 29 27\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                            <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8.0131 9.05733H3.75799C2.76183 9.05903 1.80696 9.45551 1.10257 10.1599C0.39818 10.8643 0.00170332 11.8192 0 12.8153V23.0778C0.00170332 24.074 0.39818 25.0289 1.10257 25.7333C1.80696 26.4377 2.76183 26.8341 3.75799 26.8358H23.394C24.2758 26.8354 25.1294 26.5252 25.8056 25.9594C26.4819 25.3936 26.9379 24.6082 27.094 23.7403L28.9408 13.4821C29.038 12.9408 29.0153 12.3849 28.8743 11.8534C28.7333 11.3218 28.4774 10.8277 28.1247 10.4058C27.7721 9.98391 27.3311 9.6445 26.833 9.41151C26.3349 9.17852 25.7918 9.05762 25.2419 9.05733H18.5043V3.63509C18.5044 2.90115 18.2824 2.18438 17.8673 1.57908C17.4522 0.973783 16.8636 0.508329 16.179 0.243966C15.4943 -0.0203976 14.7456 -0.0712821 14.0315 0.0980078C13.3173 0.267298 12.6712 0.648829 12.178 1.1924L12.1737 1.19669C10.5632 2.98979 9.70849 5.78681 8.79584 7.79142C8.6423 8.14964 8.45537 8.49259 8.23751 8.81574C8.16898 8.90222 8.09358 8.98301 8.01203 9.05733H8.0131ZM6.54963 23.6147H3.75799C3.68706 23.6147 3.61686 23.6005 3.55156 23.5728C3.48626 23.5452 3.42719 23.5046 3.37789 23.4536C3.32786 23.4047 3.28819 23.3463 3.26126 23.2817C3.23433 23.2171 3.22068 23.1478 3.22113 23.0778V12.8164C3.22068 12.7464 3.23433 12.6771 3.26126 12.6125C3.28819 12.548 3.32786 12.4895 3.37789 12.4406C3.42719 12.3896 3.48626 12.3491 3.55156 12.3214C3.61686 12.2937 3.68706 12.2795 3.75799 12.2795H6.54963V23.6147ZM9.77077 11.7599C10.3704 11.336 10.8649 10.7803 11.216 10.1353C11.8221 8.94289 12.3599 7.71687 12.8265 6.46324C13.2315 5.33852 13.818 4.28775 14.5627 3.3527C14.6197 3.29181 14.6935 3.24913 14.7747 3.23003C14.8559 3.21093 14.9409 3.21625 15.0191 3.24533C15.0976 3.27557 15.165 3.32913 15.2122 3.3988C15.2594 3.46848 15.2842 3.55093 15.2832 3.63509V10.6679C15.2831 10.8794 15.3246 11.0889 15.4055 11.2844C15.4864 11.4799 15.605 11.6575 15.7546 11.8071C15.9042 11.9566 16.0818 12.0753 16.2773 12.1562C16.4727 12.237 16.6822 12.2786 16.8938 12.2785H25.2419C25.3207 12.2784 25.3986 12.2961 25.4698 12.3301C25.5409 12.3641 25.6036 12.4136 25.6531 12.4749C25.7042 12.5345 25.7411 12.6049 25.7612 12.6807C25.7813 12.7566 25.784 12.836 25.7691 12.913L23.9223 23.1723C23.8993 23.296 23.834 23.4077 23.7376 23.4885C23.6412 23.5692 23.5197 23.6138 23.394 23.6147H9.77077V11.7599Z\" fill=\"currentColor\"></path>\n                        </svg>\n                    </div>\n                    <div class=\"full-review__like-counter\"></div>\n                </div>\n                <div class=\"cub-collection-card__user-name\"></div>\n                <div class=\"cub-collection-card__user-icon\">\n                    <img >\n                </div>\n            </div>\n        </div>\n        <div class=\"card__title\"></div>\n    </div>");
      var style = "\n        <style>\n        .cub-collection-card__head{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-webkit-justify-content:space-between;-ms-flex-pack:justify;justify-content:space-between;padding:.5em 1em;color:#fff;font-size:1em;font-weight:500;position:absolute;top:0;left:0;width:100%}.cub-collection-card__bottom{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;padding:.5em 1em;background-color:rgba(0,0,0,0.5);color:#fff;font-size:1em;font-weight:400;-webkit-border-radius:1em;border-radius:1em;position:absolute;bottom:0;left:0;width:100%}.cub-collection-card__liked{padding-left:1em;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center}.cub-collection-card__liked .full-review__like-icon{margin-top:-0.2em}.cub-collection-card__liked .full-review__like-counter{font-weight:600}.cub-collection-card__items{background:rgba(0,0,0,0.5);padding:.3em;-webkit-border-radius:.2em;border-radius:.2em}.cub-collection-card__user-name{padding:0 1em;margin-left:auto}.cub-collection-card__user-icon{width:2em;height:2em;-webkit-border-radius:100%;border-radius:100%;background-color:#fff;border:.2em solid #fff}.cub-collection-card__user-icon img{width:100%;height:100%;-webkit-border-radius:100%;border-radius:100%;opacity:0}.cub-collection-card__user-icon.loaded img{opacity:1}.category-full .cub-collection-card{padding-bottom:2em}body.glass--style .cub-collection-card__bottom,body.glass--style .cub-collection-card__items{background-color:rgba(0,0,0,0.3);-webkit-backdrop-filter:blur(1.6em);backdrop-filter:blur(1.6em)}body.light--version .cub-collection-card__bottom{-webkit-border-radius:0;border-radius:0}@media screen and (max-width:767px){.category-full .cub-collection-card{width:33.3%}}@media screen and (max-width:580px){.category-full .cub-collection-card{width:50%}}@media screen and (max-width:991px){body.light--version .category-full .cub-collection-card{width:33.3%}}@media screen and (max-width:580px){body.light--version .category-full .cub-collection-card{width:50%}}@media screen and (max-width:991px){body.light--version.size--bigger .category-full .cub-collection-card{width:50%}}\n        </style>\n    ";
      Lampa.Template.add('cub_collections_css', style);
      $('body').append(Lampa.Template.get('cub_collections_css', {}, true));
      function add() {
        var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg width=\"191\" height=\"239\" viewBox=\"0 0 191 239\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M35.3438 35.3414V26.7477C35.3438 19.9156 38.0594 13.3543 42.8934 8.51604C47.7297 3.68251 54.2874 0.967027 61.125 0.966431H164.25C171.086 0.966431 177.643 3.68206 182.482 8.51604C187.315 13.3524 190.031 19.91 190.031 26.7477V186.471C190.031 189.87 189.022 193.192 187.133 196.018C185.245 198.844 182.561 201.046 179.421 202.347C176.28 203.647 172.825 203.988 169.492 203.325C166.158 202.662 163.096 201.026 160.692 198.623L155.656 193.587V220.846C155.656 224.245 154.647 227.567 152.758 230.393C150.87 233.219 148.186 235.421 145.046 236.722C141.905 238.022 138.45 238.363 135.117 237.7C131.783 237.037 128.721 235.401 126.317 232.998L78.3125 184.993L30.3078 232.998C27.9041 235.401 24.8419 237.037 21.5084 237.7C18.1748 238.363 14.7195 238.022 11.5794 236.722C8.43922 235.421 5.75517 233.219 3.86654 230.393C1.9779 227.567 0.969476 224.245 0.96875 220.846V61.1227C0.96875 54.2906 3.68437 47.7293 8.51836 42.891C13.3547 38.0575 19.9124 35.342 26.75 35.3414H35.3438ZM138.469 220.846V61.1227C138.469 58.8435 137.563 56.6576 135.952 55.046C134.34 53.4343 132.154 52.5289 129.875 52.5289H26.75C24.4708 52.5289 22.2849 53.4343 20.6733 55.046C19.0617 56.6576 18.1562 58.8435 18.1562 61.1227V220.846L66.1609 172.841C69.3841 169.619 73.755 167.809 78.3125 167.809C82.87 167.809 87.2409 169.619 90.4641 172.841L138.469 220.846ZM155.656 169.284L172.844 186.471V26.7477C172.844 24.4685 171.938 22.2826 170.327 20.671C168.715 19.0593 166.529 18.1539 164.25 18.1539H61.125C58.8458 18.1539 56.6599 19.0593 55.0483 20.671C53.4367 22.2826 52.5312 24.4685 52.5312 26.7477V35.3414H129.875C136.711 35.3414 143.268 38.0571 148.107 42.891C152.94 47.7274 155.656 54.285 155.656 61.1227V169.284Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"menu__text\">".concat(manifest.name, "</div>\n        </li>"));
        button.on('hover:enter', function () {
          Lampa.Activity.push({
            url: '',
            title: manifest.name,
            component: 'cub_collections_main',
            page: 1
          });
        });
        $('.menu .menu__list').eq(0).append(button);
      }
      if (window.appready) add();else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }
    if (!window.cub_collections_ready && Lampa.Manifest.app_digital >= 242) startPlugin();

})();
