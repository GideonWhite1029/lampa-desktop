(function () {
    'use strict';

    function init() {
      $('body').append("\n        <style>\n        \n        </style>\n    ");
    }
    if (window.appready) init();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') init();
      });
    }

})();
