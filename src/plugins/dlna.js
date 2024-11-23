(function () {
    'use strict';

    function Component(object) {
      var html = Lampa.Template.js('client_dlna_main'),
        head = html.find('.client-dlna-main__head'),
        body = html.find('.client-dlna-main__body');
      var listener_id, deviceFinder, scroll, tree;
      this.create = function () {
        this.activity.loader(true);
        if (window.serviceProvider) {
          scroll = new Lampa.Scroll({
            mask: true,
            over: true
          });
          scroll.minus(head);
          body.append(scroll.render(true));
          try {
            deviceFinder = serviceProvider.getDeviceFinder();
            listener_id = deviceFinder.addDeviceDiscoveryListener({
              ondeviceadded: this.drawDevices.bind(this),
              ondeviceremoved: this.drawDevices.bind(this)
            });
          } catch (e) {
            console.log('DLNA', 'getDeviceFinder error: ', e.message);
          }
          this.drawDevices();
        } else {
          var empty = new Lampa.Empty({
            descr: Lampa.Lang.translate('client_dlna_nosuport')
          });
          html.empty();
          html.append(empty.render(true));
          this.start = empty.start;
        }
        this.activity.loader(false);
      };
      this.drawDevices = function () {
        var _this = this;
        var devices = [];
        try {
          devices = deviceFinder.getDeviceList("MEDIAPROVIDER");
        } catch (e) {
          console.log('DLNA', 'getDeviceList error: ', e.message);
        }
        scroll.clear();
        scroll.reset();
        if (devices.length) {
          devices.forEach(function (element) {
            var item = Lampa.Template.js('client_dlna_device');
            item.find('.client-dlna-device__name').text(element.name);
            item.find('.client-dlna-device__ip').text(element.ipAddress);
            item.on('hover:enter', function () {
              tree = {
                device: element,
                tree: [element.rootFolder]
              };
              _this.displayFolder();
            });
            item.on('hover:focus', function () {
              scroll.update(item);
            });
            scroll.append(item);
          });
        } else {
          this.drawLoading(Lampa.Lang.translate('client_dlna_search_device'));
        }
        this.drawHead();
        this.activity.toggle();
      };
      this.drawLoading = function (text) {
        scroll.clear();
        scroll.reset();
        Lampa.Controller.clear();
        var load = Lampa.Template.js('client_dlna_loading');
        load.find('.client-dlna-loading__title').text(text);
        scroll.append(load);
      };
      this.drawFolder = function (elems) {
        var _this2 = this;
        scroll.clear();
        scroll.reset();
        var folders = elems.filter(function (a) {
          return a.itemType == 'FOLDER';
        });
        var files = elems.filter(function (a) {
          return a.itemType == 'VIDEO';
        });
        folders.forEach(function (element) {
          var item = Lampa.Template.js('client_dlna_folder');
          item.find('.client-dlna-device__name').text(element.title);
          item.on('hover:enter', function () {
            tree.tree.push(element);
            _this2.displayFolder();
          });
          item.on('hover:focus', function () {
            scroll.update(item);
          });
          scroll.append(item);
        });
        if (files.length) {
          var spl = document.createElement('div');
          spl.addClass('client-dlna-main__split');
          spl.text(Lampa.Lang.translate('title_files'));
          scroll.append(spl);
          files.forEach(function (element) {
            var item = Lampa.Template.js('client_dlna_file');
            item.find('.client-dlna-file__name').text(element.title);
            item.find('.client-dlna-file__size').text(Lampa.Utils.bytesToSize(element.fileSize));
            item.on('hover:enter', function () {
              var video = {
                title: element.title,
                url: element.itemUri
              };
              Lampa.Player.play(video);
              Lampa.Player.playlist([video]);
            });
            item.on('hover:focus', function () {
              scroll.update(item);
            });
            scroll.append(item);
          });
        }
        this.drawHead();
        this.activity.toggle();
      };
      this.drawHead = function () {
        head.empty();
        var nav = [];
        if (tree) {
          var device_item = document.createElement('div');
          device_item.addClass('client-dlna-head__device');
          var icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 128 128\" xml:space=\"preserve\">\n                <path d=\"M111.7 57.1V22.2c0-1.1-.5-2.3-1.4-2.9h-.1c-.6-.4-1.2-.6-2-.6H30.9c-2 0-3.5 1.5-3.5 3.5v31.9h34.9c2.8 0 5.1 2.4 5.1 5.2v15.5h27.5V61.4c0-2.4 1.9-4.2 4.2-4.2h12.6z\" fill=\"currentColor\"></path>\n                <path d=\"M96.8 67.6H128v33.2H96.8zM67.3 86.1h27.5v-9.2H67.3zM65.1 59.3c0-1.8-1.3-3.1-3-3.1h-56c-1.7 0-3 1.4-3 3.1v41.9h62zM0 106.1c0 1.7 1.3 3.1 3.1 3.1h62.2c1.7 0 3.1-1.3 3.1-3.1v-2.9H0zM125.8 59.3H99c-1.2 0-2.2.9-2.2 2.2v4.1H128v-4.1c0-1.3-.9-2.2-2.2-2.2zm-9.4 4.1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1h7.9c.6 0 1 .4 1 1 .1.6-.3 1-1 1zm3.8 0h-.4c-.6 0-1-.4-1-1s.4-1 1-1h.4c.6 0 1 .4 1 1s-.4 1-1 1zM96.8 107.1c0 1.2.9 2.2 2.2 2.2h26.8c1.2 0 2.2-1 2.2-2.2V103H96.8zm11.6-2h7.9c.6 0 1 .4 1 1s-.4 1-1 1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1zM81.7 93.7H78v-5.6H67.3v7.6h14.3c.6 0 1-.4 1-1 .1-.6-.3-1-.9-1z\" fill=\"currentColor\"></path>\n            </svg>";
          icon += '<span>' + tree.device.name + '</span>';
          device_item.html(icon);
          nav.push(device_item);
          tree.tree.forEach(function (folder) {
            if (folder.isRootFolder) return;
            var folder_item = document.createElement('div');
            folder_item.text(folder.title);
            folder_item.addClass('client-dlna-head__folder');
            nav.push(folder_item);
          });
        } else {
          var empty_item = document.createElement('div');
          empty_item.addClass('client-dlna-head__device');
          var _icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 128 128\" xml:space=\"preserve\">\n                <path d=\"M111.7 57.1V22.2c0-1.1-.5-2.3-1.4-2.9h-.1c-.6-.4-1.2-.6-2-.6H30.9c-2 0-3.5 1.5-3.5 3.5v31.9h34.9c2.8 0 5.1 2.4 5.1 5.2v15.5h27.5V61.4c0-2.4 1.9-4.2 4.2-4.2h12.6z\" fill=\"currentColor\"></path>\n                <path d=\"M96.8 67.6H128v33.2H96.8zM67.3 86.1h27.5v-9.2H67.3zM65.1 59.3c0-1.8-1.3-3.1-3-3.1h-56c-1.7 0-3 1.4-3 3.1v41.9h62zM0 106.1c0 1.7 1.3 3.1 3.1 3.1h62.2c1.7 0 3.1-1.3 3.1-3.1v-2.9H0zM125.8 59.3H99c-1.2 0-2.2.9-2.2 2.2v4.1H128v-4.1c0-1.3-.9-2.2-2.2-2.2zm-9.4 4.1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1h7.9c.6 0 1 .4 1 1 .1.6-.3 1-1 1zm3.8 0h-.4c-.6 0-1-.4-1-1s.4-1 1-1h.4c.6 0 1 .4 1 1s-.4 1-1 1zM96.8 107.1c0 1.2.9 2.2 2.2 2.2h26.8c1.2 0 2.2-1 2.2-2.2V103H96.8zm11.6-2h7.9c.6 0 1 .4 1 1s-.4 1-1 1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1zM81.7 93.7H78v-5.6H67.3v7.6h14.3c.6 0 1-.4 1-1 .1-.6-.3-1-.9-1z\" fill=\"currentColor\"></path>\n            </svg>";
          _icon += '<span>' + Lampa.Lang.translate('client_dlna_all_device') + '</span>';
          empty_item.html(_icon);
          nav.push(empty_item);
        }
        for (var i = 0; i < nav.length; i++) {
          if (i > 0) {
            var spl = document.createElement('div');
            spl.addClass('client-dlna-head__split');
            head.append(spl);
          }
          head.append(nav[i]);
        }
      };
      this.displayFolder = function () {
        var _this3 = this;
        var device = tree.device;
        var folder = tree.tree[tree.tree.length - 1];
        this.drawLoading(Lampa.Lang.translate('loading'));
        device.browse(folder, 0, 10, this.drawFolder.bind(this), function () {
          Lampa.Noty.show(Lampa.Lang.translate('torrent_parser_empty'));
          tree.tree.pop();
          _this3.displayFolder();
        });
      };
      this.back = function () {
        if (tree) {
          if (tree.tree.length > 1) {
            tree.tree.pop();
            this.displayFolder();
          } else {
            tree = false;
            this.drawDevices();
          }
        } else {
          Lampa.Activity.backward();
        }
      };
      this.background = function () {
        Lampa.Background.immediately('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAZCAYAAABD2GxlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHASURBVHgBlZaLrsMgDENXxAf3/9XHFdXNZLm2YZHQymPk4CS0277v9+ffrut62nEcn/M8nzb69cxj6le1+75f/RqrZ9fatm3F9wwMR7yhawilNke4Gis/7j9srQbdaVFBnkcQ1WrfgmIIBcTrvgqqsKiTzvpOQbUnAykVW4VVqZXyyDllYFSKx9QaVrO7nGJIB63g+FAq/xhcHWBYdwCsmAtvFZUKE0MlVZWCT4idOlyhTp3K35R/6Nzlq0uBnsKWlEzgSh1VGJxv6rmpXMO7EK+XWUPnDFRWqitQFeY2UyZVryuWlI8ulLgGf19FooAUwC9gCWLcwzWPb7Wa60qdlZxjx6ooUuUqVQsK+y1VoAJyBeJAVsLJeYmg/RIXdG2kPhwYPBUQQyYF0XC8lwP3MTCrYAXB88556peCbUUZV7WccwkUQfCZC4PXdA5hKhSVhythZqjZM0J39w5m8BRadKAcrsIpNZsLIYdOqcZ9hExhZ1MH+QL+ciFzXzmYhZr/M6yUUwp2dp5U4naZDwAF5JRSefdScJZ3SkU0nl8xpaAy+7ml1EqvMXSs1HRrZ9bc3eZUSXmGa/mdyjbmqyX7A9RaYQa9IRJ0AAAAAElFTkSuQmCC');
      };
      this.start = function () {
        if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;
        this.background();
        Lampa.Controller.add('content', {
          invisible: true,
          toggle: function toggle() {
            Lampa.Controller.collectionSet(html);
            Lampa.Controller.collectionFocus(false, html);
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          right: function right() {
            Navigator.move('right');
          },
          down: function down() {
            Navigator.move('down');
          },
          back: this.back.bind(this)
        });
        Lampa.Controller.toggle('content');
      };
      this.pause = function () {};
      this.stop = function () {};
      this.render = function () {
        return html;
      };
      this.destroy = function () {
        if (deviceFinder) deviceFinder.removeDeviceDiscoveryListener(listener_id);
        if (scroll) scroll.destroy();
        html.remove();
      };
    }

    // window.webapis = {
    //     allshare: {
    //         serviceconnector: {
    //             createServiceProvider: function(good, err){
    //                 good()
    //             },
    //             getServiceProvider: function(){
    //                 return window.webapis.allshare.serviceconnector
    //             },
    //             getDeviceFinder: function(){
    //                 return {
    //                     getDeviceList: function(){
    //                         return [{
    //                             browse: (where, index, max, call)=>{
    //                                 let root = [{
    //                                     contentBuildType: "PROVIDER",
    //                                     date: "2023-06-14",
    //                                     duration: 0,
    //                                     extension: "avi",
    //                                     fileSize: 781084672,
    //                                     height: 0,
    //                                     isRootFolder: false,
    //                                     itemType: "FOLDER",
    //                                     title: "Следствие ведут знатоки (малые рипы)/Следствие ведут знатоки фильм 01 Черный маклер 745"
    //                                 }]

    //                                 let folder = [{
    //                                     contentBuildType: "PROVIDER",
    //                                     date: "2023-06-14",
    //                                     duration: 0,
    //                                     extension: "avi",
    //                                     fileSize: 781084672,
    //                                     height: 0,
    //                                     isRootFolder: false,
    //                                     itemType: "FOLDER",
    //                                     title: "Moviews"
    //                                 },
    //                                 {
    //                                     contentBuildType: "PROVIDER",
    //                                     date: "2023-06-14",
    //                                     duration: 0,
    //                                     extension: "avi",
    //                                     fileSize: 781084672,
    //                                     height: 0,
    //                                     isRootFolder: false,
    //                                     itemType: "FOLDER",
    //                                     title: "Moviews"
    //                                 },
    //                                 {
    //                                     contentBuildType: "PROVIDER",
    //                                     date: "2023-06-14",
    //                                     duration: 0,
    //                                     extension: "avi",
    //                                     fileSize: 781084672,
    //                                     height: 0,
    //                                     isRootFolder: false,
    //                                     itemType: "VIDEO",
    //                                     title: "Super_Mario_Brosers.avi"
    //                                 },{
    //                                     contentBuildType: "PROVIDER",
    //                                     date: "2023-06-14",
    //                                     duration: 0,
    //                                     extension: "avi",
    //                                     fileSize: 781084672,
    //                                     height: 0,
    //                                     isRootFolder: false,
    //                                     itemType: "VIDEO",
    //                                     title: "Super_Mario_Brosers.avi"
    //                                 },{
    //                                     contentBuildType: "PROVIDER",
    //                                     date: "2023-06-14",
    //                                     duration: 0,
    //                                     extension: "avi",
    //                                     fileSize: 781084672,
    //                                     height: 0,
    //                                     isRootFolder: false,
    //                                     itemType: "VIDEO",
    //                                     title: "Super_Mario_Brosers.avi"
    //                                 },{
    //                                     contentBuildType: "PROVIDER",
    //                                     date: "2023-06-14",
    //                                     duration: 0,
    //                                     extension: "avi",
    //                                     fileSize: 781084672,
    //                                     height: 0,
    //                                     isRootFolder: false,
    //                                     itemType: "VIDEO",
    //                                     title: "Super_Mario_Brosers.avi"
    //                                 },{
    //                                     contentBuildType: "PROVIDER",
    //                                     date: "2023-06-14",
    //                                     duration: 0,
    //                                     extension: "avi",
    //                                     fileSize: 781084672,
    //                                     height: 0,
    //                                     isRootFolder: false,
    //                                     itemType: "VIDEO",
    //                                     title: "Super_Mario_Brosers.avi"
    //                                 }]

    //                                 call(where.isRootFolder ? root : folder)
    //                             },
    //                             deviceDomain: "LOCAL_NETWORK",
    //                             deviceType: "MEDIAPROVIDER",
    //                             iconArray: [],
    //                             id: "uuid:cb14b8a3-c25f-e43b-596b-49b4643ff223+wlan0",
    //                             ipAddress: "192.168.0.103",
    //                             isSearchable: true,
    //                             modelName: "dms 1.4",
    //                             name: "Tor",
    //                             nic: "192.168.0.102",
    //                             rootFolder: {
    //                                 isRootFolder: true,
    //                                 title: 'Root',
    //                             },
    //                             search: ()=>{},
    //                             subtype: ""
    //                         }]
    //                     },
    //                     addDeviceDiscoveryListener: function(){
    //                         return 23334
    //                     },
    //                     removeDeviceDiscoveryListener: function(){

    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

    function startPlugin() {
      window.plugin_client_dnla = true;
      Lampa.Lang.add({
        client_dlna_search_device: {
          ru: 'Поиск устройств',
          en: 'Device search',
          uk: 'Пошук пристроїв',
          be: 'Пошук прылад',
          zh: '设备搜索',
          pt: 'Pesquisa de dispositivos'
        },
        client_dlna_nosuport: {
          ru: 'Ваш виджет не поддерживается, обновите виджет на новую версию',
          en: 'Your widget is not supported, update the widget to a newer version',
          uk: 'Віджет не підтримується, оновіть віджет на нову версію',
          be: 'Ваш віджэт не падтрымліваецца, абнавіце віджэт на новую версію',
          zh: '不支持您的小部件，请将小部件更新到较新版本',
          pt: 'Seu widget não é compatível, atualize o widget para uma versão mais recente'
        },
        client_dlna_all_device: {
          ru: 'Все устройства',
          en: 'All devices',
          uk: 'Усі пристрої',
          be: 'Усе прылады',
          zh: '所有设备',
          pt: 'Todos os dispositivos'
        }
      });
      var manifest = {
        type: 'plugin',
        version: '1.1.1',
        name: 'DLNA',
        description: '',
        component: 'client_dnla'
      };
      Lampa.Manifest.plugins = manifest;
      Lampa.Template.add('client_dlna_main', "\n        <div class=\"client-dlna-main\">\n            <div class=\"client-dlna-main__head client-dlna-head\"></div>\n            <div class=\"client-dlna-main__body\"></div>\n        </div>\n    ");
      Lampa.Template.add('client_dlna_loading', "\n        <div class=\"client-dlna-loading\">\n            <div class=\"client-dlna-loading__title\"></div>\n            <div class=\"client-dlna-loading__loader\">\n                <div class=\"broadcast__scan\"><div></div></div>\n            </div>\n        </div>\n    ");
      Lampa.Template.add('client_dlna_device', "\n        <div class=\"client-dlna-device selector\">\n            <div class=\"client-dlna-device__body\">\n                <div class=\"client-dlna-device__icon\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 128 128\" xml:space=\"preserve\">\n                        <path d=\"M111.7 57.1V22.2c0-1.1-.5-2.3-1.4-2.9h-.1c-.6-.4-1.2-.6-2-.6H30.9c-2 0-3.5 1.5-3.5 3.5v31.9h34.9c2.8 0 5.1 2.4 5.1 5.2v15.5h27.5V61.4c0-2.4 1.9-4.2 4.2-4.2h12.6z\" fill=\"currentColor\"></path>\n                        <path d=\"M96.8 67.6H128v33.2H96.8zM67.3 86.1h27.5v-9.2H67.3zM65.1 59.3c0-1.8-1.3-3.1-3-3.1h-56c-1.7 0-3 1.4-3 3.1v41.9h62zM0 106.1c0 1.7 1.3 3.1 3.1 3.1h62.2c1.7 0 3.1-1.3 3.1-3.1v-2.9H0zM125.8 59.3H99c-1.2 0-2.2.9-2.2 2.2v4.1H128v-4.1c0-1.3-.9-2.2-2.2-2.2zm-9.4 4.1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1h7.9c.6 0 1 .4 1 1 .1.6-.3 1-1 1zm3.8 0h-.4c-.6 0-1-.4-1-1s.4-1 1-1h.4c.6 0 1 .4 1 1s-.4 1-1 1zM96.8 107.1c0 1.2.9 2.2 2.2 2.2h26.8c1.2 0 2.2-1 2.2-2.2V103H96.8zm11.6-2h7.9c.6 0 1 .4 1 1s-.4 1-1 1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1zM81.7 93.7H78v-5.6H67.3v7.6h14.3c.6 0 1-.4 1-1 .1-.6-.3-1-.9-1z\" fill=\"currentColor\"></path>\n                    </svg>\n                </div>\n                <div class=\"client-dlna-device__name\"></div>\n                <div class=\"client-dlna-device__ip\"></div>\n            </div>\n        </div>\n    ");
      Lampa.Template.add('client_dlna_folder', "\n        <div class=\"client-dlna-device selector\">\n            <div class=\"client-dlna-device__body\">\n                <div class=\"client-dlna-device__icon\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 408 408\" style=\"enable-background:new 0 0 512 512\" xml:space=\"preserve\">\n                        <path d=\"M372 88.661H206.32l-33-39.24a5.001 5.001 0 0 0-4-1.8H36c-19.956.198-36.023 16.443-36 36.4v240c-.001 19.941 16.06 36.163 36 36.36h336c19.94-.197 36.001-16.419 36-36.36v-199c.001-19.941-16.06-36.162-36-36.36z\" fill=\"currentColor\"></path>\n                    </svg>\n                </div>\n                <div class=\"client-dlna-device__name\"></div>\n            </div>\n        </div>\n    ");
      Lampa.Template.add('client_dlna_file', "\n        <div class=\"client-dlna-file selector\">\n            <div class=\"client-dlna-file__body\">\n                <div class=\"client-dlna-file__icon\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 477.867 477.867\" xml:space=\"preserve\">\n                        <path d=\"M238.933 0C106.974 0 0 106.974 0 238.933s106.974 238.933 238.933 238.933 238.933-106.974 238.933-238.933C477.726 107.033 370.834.141 238.933 0zm100.624 246.546a17.068 17.068 0 0 1-7.662 7.662v.085L195.362 322.56c-8.432 4.213-18.682.794-22.896-7.638a17.061 17.061 0 0 1-1.8-7.722V170.667c-.004-9.426 7.633-17.07 17.059-17.075a17.068 17.068 0 0 1 7.637 1.8l136.533 68.267c8.436 4.204 11.867 14.451 7.662 22.887z\" fill=\"currentColor\"></path>\n                    </svg>\n                </div>\n                <div class=\"client-dlna-file__name\"></div>\n                <div class=\"client-dlna-file__size\"></div>\n            </div>\n        </div>\n    ");
      Lampa.Template.add(manifest.component + '_style', "\n        <style>\n        .client-dlna-main__wrap::after{content:'';display:block;clear:both}.client-dlna-main__split{clear:both;padding:1.2em;font-size:1.4em}.client-dlna-head{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap;line-height:1.4;font-size:1.2em;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;min-height:4.1em;padding:.7em;padding-bottom:0}.client-dlna-head>*{margin:.5em;-webkit-border-radius:.3em;border-radius:.3em;padding:.4em 1em;-o-text-overflow:ellipsis;text-overflow:ellipsis;max-width:20em;overflow:hidden;white-space:nowrap;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.client-dlna-head__device{background-color:#404040;font-weight:600;margin-right:1.4em}.client-dlna-head__device>svg{width:1.5em !important;height:1.5em !important;margin-right:1em;vertical-align:middle;opacity:.5}.client-dlna-head__split{padding:0;margin:0;overflow:inherit}.client-dlna-head__split::before{content:'';display:block;width:.3em;height:.3em;border-right:.2em solid #fff;border-bottom:.2em solid #fff;-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);-o-transform:rotate(-45deg);transform:rotate(-45deg);opacity:.5;margin-top:.15em}.client-dlna-device{float:left;width:33.3%;padding:1.5em;line-height:1.4}.client-dlna-device__body{background-color:#404040;-webkit-border-radius:1em;border-radius:1em;padding:1.5em;position:relative;min-height:12.5em}.client-dlna-device__name{font-weight:600;font-size:1.4em;margin-bottom:.4em;overflow:hidden;-o-text-overflow:'.';text-overflow:'.';display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical}.client-dlna-device__ip{opacity:.5}.client-dlna-device__icon{opacity:.5;margin-bottom:1em}.client-dlna-device__icon svg{width:4em !important;height:4em !important}.client-dlna-device.focus .client-dlna-device__body::after,.client-dlna-device.hover .client-dlna-device__body::after{content:'';position:absolute;top:-0.5em;left:-0.5em;right:-0.5em;bottom:-0.5em;border:.3em solid #fff;-webkit-border-radius:1.4em;border-radius:1.4em;z-index:-1;pointer-events:none}.client-dlna-loading{margin:0 auto;padding:1.5em;text-align:center}.client-dlna-loading__title{font-size:1.4em;margin-bottom:2em}.client-dlna-file{padding:1.5em;line-height:1.4;padding-bottom:0}.client-dlna-file__body{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;background-color:#404040;-webkit-border-radius:1em;border-radius:1em;padding:1.5em;position:relative}.client-dlna-file__icon{opacity:.5;margin-right:2em}.client-dlna-file__icon svg{width:3em !important;height:3em !important}.client-dlna-file__name{font-weight:600;font-size:1.4em;overflow:hidden;-o-text-overflow:'.';text-overflow:'.';display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical}.client-dlna-file__size{padding-left:2em;margin-left:auto}.client-dlna-file.focus .client-dlna-file__body::after,.client-dlna-file.hover .client-dlna-file__body::after{content:'';position:absolute;top:-0.5em;left:-0.5em;right:-0.5em;bottom:-0.5em;border:.3em solid #fff;-webkit-border-radius:1.4em;border-radius:1.4em;z-index:-1;pointer-events:none}\n        </style>\n    ");
      try {
        webapis.allshare.serviceconnector.createServiceProvider(function () {
          console.log('DLNA', 'connected');
          window.serviceProvider = webapis.allshare.serviceconnector.getServiceProvider();
        }, function (e) {
          console.log('DLNA', 'connect error:', e.message);
        });
      } catch (e) {}
      function add() {
        //if(!Lampa.Platform.is('tizen')) return

        var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg viewBox=\"0 0 512 512\" xml:space=\"preserve\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path fill=\"currentColor\" d=\"M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z\"/>\n                    <circle cx=\"160\" cy=\"250\" r=\"60\" fill=\"currentColor\"/>\n                    <circle cx=\"320\" cy=\"150\" r=\"60\" fill=\"currentColor\"/>\n                    <circle cx=\"320\" cy=\"350\" r=\"60\" fill=\"currentColor\"/>\n                    <path fill=\"currentColor\" d=\"M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z\"/>\n                </svg>\n            </div>\n            <div class=\"menu__text\">".concat(manifest.name, "</div>\n        </li>"));
        button.on('hover:enter', function () {
          Lampa.Activity.push({
            url: '',
            title: manifest.name,
            component: manifest.component,
            page: 1
          });
        });
        $('.menu .menu__list').eq(0).append(button);
        $('body').append(Lampa.Template.get(manifest.component + '_style', {}, true));
      }
      Lampa.Component.add(manifest.component, Component);
      if (window.appready) add();else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }
    if (!window.plugin_client_dnla) startPlugin();

})();
