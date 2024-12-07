(function () {
    'use strict';

    function init() {
      $('body').append("\n        <style>\n        .full-start-new__title{-webkit-line-clamp:2;line-clamp:2}.full-descr__text{width:100%}\n        </style>\n    ");
    }
    if (window.appready) init();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') init();
      });
    }

})();
