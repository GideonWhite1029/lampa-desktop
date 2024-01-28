(function () {
    'use strict';

    var network = new Lampa.Reguest();
    var api_url = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/api/collections/';
    function main(params, oncomplite, onerror) {
      network.silent(api_url + 'list?page=' + params.page, function (data) {
        data.collection = true;
        data.total_pages = data.total_pages || 5;
        data.results.forEach(function (element) {
          element.poster_path = element.img;
          element.backdrop_path = element.img;
        });
        oncomplite(data);
      }, onerror);
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
      full: full,
      clear: clear
    };

    function component$1(object) {
      var comp = new Lampa.InteractionCategory(object);
      comp.create = function () {
        Api.main(object, this.build.bind(this), this.empty.bind(this));
      };
      comp.nextPageReuest = function (object, resolve, reject) {
        Api.main(object, resolve.bind(comp), reject.bind(comp));
      };
      comp.cardRender = function (object, element, card) {
        card.onMenu = false;
        card.onEnter = function () {
          Lampa.Activity.push({
            url: element.hpu,
            title: element.title,
            component: 'cub_collection',
            page: 1
          });
        };
      };
      return comp;
    }

    function component(object) {
      var comp = new Lampa.InteractionCategory(object);
      comp.create = function () {
        Api.full(object, this.build.bind(this), this.empty.bind(this));
      };
      comp.nextPageReuest = function (object, resolve, reject) {
        Api.full(object, resolve.bind(comp), reject.bind(comp));
      };
      return comp;
    }

    function startPlugin() {
      var manifest = {
        type: 'video',
        version: '1.1.1',
        name: 'Коллекции',
        description: '',
        component: 'cub_collections'
      };
      Lampa.Manifest.plugins = manifest;
      Lampa.Component.add('cub_collections', component$1);
      Lampa.Component.add('cub_collection', component);
      function add() {
        var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg width=\"191\" height=\"239\" viewBox=\"0 0 191 239\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M35.3438 35.3414V26.7477C35.3438 19.9156 38.0594 13.3543 42.8934 8.51604C47.7297 3.68251 54.2874 0.967027 61.125 0.966431H164.25C171.086 0.966431 177.643 3.68206 182.482 8.51604C187.315 13.3524 190.031 19.91 190.031 26.7477V186.471C190.031 189.87 189.022 193.192 187.133 196.018C185.245 198.844 182.561 201.046 179.421 202.347C176.28 203.647 172.825 203.988 169.492 203.325C166.158 202.662 163.096 201.026 160.692 198.623L155.656 193.587V220.846C155.656 224.245 154.647 227.567 152.758 230.393C150.87 233.219 148.186 235.421 145.046 236.722C141.905 238.022 138.45 238.363 135.117 237.7C131.783 237.037 128.721 235.401 126.317 232.998L78.3125 184.993L30.3078 232.998C27.9041 235.401 24.8419 237.037 21.5084 237.7C18.1748 238.363 14.7195 238.022 11.5794 236.722C8.43922 235.421 5.75517 233.219 3.86654 230.393C1.9779 227.567 0.969476 224.245 0.96875 220.846V61.1227C0.96875 54.2906 3.68437 47.7293 8.51836 42.891C13.3547 38.0575 19.9124 35.342 26.75 35.3414H35.3438ZM138.469 220.846V61.1227C138.469 58.8435 137.563 56.6576 135.952 55.046C134.34 53.4343 132.154 52.5289 129.875 52.5289H26.75C24.4708 52.5289 22.2849 53.4343 20.6733 55.046C19.0617 56.6576 18.1562 58.8435 18.1562 61.1227V220.846L66.1609 172.841C69.3841 169.619 73.755 167.809 78.3125 167.809C82.87 167.809 87.2409 169.619 90.4641 172.841L138.469 220.846ZM155.656 169.284L172.844 186.471V26.7477C172.844 24.4685 171.938 22.2826 170.327 20.671C168.715 19.0593 166.529 18.1539 164.25 18.1539H61.125C58.8458 18.1539 56.6599 19.0593 55.0483 20.671C53.4367 22.2826 52.5312 24.4685 52.5312 26.7477V35.3414H129.875C136.711 35.3414 143.268 38.0571 148.107 42.891C152.94 47.7274 155.656 54.285 155.656 61.1227V169.284Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"menu__text\">".concat(manifest.name, "</div>\n        </li>"));
        button.on('hover:enter', function () {
          Lampa.Activity.push({
            url: '',
            title: manifest.name,
            component: 'cub_collections',
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
    if (!window.cub_collections_ready) startPlugin();

})();
