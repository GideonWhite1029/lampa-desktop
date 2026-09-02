const { Menu, shell } = require('electron');

// Toggle <video> picture-in-picture directly, without depending on Lampa internals.
const PIP_JS = `(() => {
  const v = document.querySelector('video');
  if (!v) return 'no-video';
  if (document.pictureInPictureElement) { document.exitPictureInPicture(); return 'exit'; }
  if (document.pictureInPictureEnabled && v.requestPictureInPicture) { v.requestPictureInPicture(); return 'enter'; }
  return 'unsupported';
})()`;

const build = ({
  win,
  onToggleMiniPlayer,
  onCheckLampaCore,
  getLampaAutoUpdate,
  onSetLampaAutoUpdate,
  getDoh,
  onSetDoh,
  onOpenConfig
}) => {
  const wc = () => win && win.webContents;

  const template = [
    {
      label: 'Файл',
      submenu: [
        { role: 'quit', label: 'Выход', accelerator: 'CmdOrCtrl+Q' }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload', label: 'Обновить' },
        { role: 'forceReload', label: 'Обновить без кеша' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Масштаб 100%' },
        { role: 'zoomIn', label: 'Увеличить', accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut', label: 'Уменьшить' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран', accelerator: 'F11' },
        {
          label: 'Инструменты разработчика',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => { const c = wc(); if (c) c.toggleDevTools(); }
        }
      ]
    },
    {
      label: 'Просмотр',
      submenu: [
        {
          label: 'Картинка в картинке',
          accelerator: 'CmdOrCtrl+P',
          click: () => { const c = wc(); if (c) c.executeJavaScript(PIP_JS, true).catch(() => {}); }
        },
        {
          label: 'Мини-плеер (поверх окон)',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => onToggleMiniPlayer && onToggleMiniPlayer()
        }
      ]
    },
    {
      label: 'Сеть',
      submenu: [
        {
          label: 'DNS через HTTPS (обход блокировок)',
          type: 'checkbox',
          checked: getDoh ? getDoh() : true,
          click: (item) => onSetDoh && onSetDoh(item.checked)
        },
        { type: 'separator' },
        {
          label: 'Открыть файл настроек (desktop.json)',
          click: () => onOpenConfig && onOpenConfig()
        }
      ]
    },
    {
      label: 'Обновления',
      submenu: [
        {
          label: 'Проверить обновление ядра Lampa',
          click: () => onCheckLampaCore && onCheckLampaCore()
        },
        {
          label: 'Автообновление ядра Lampa',
          type: 'checkbox',
          checked: getLampaAutoUpdate ? getLampaAutoUpdate() : true,
          click: (item) => onSetLampaAutoUpdate && onSetLampaAutoUpdate(item.checked)
        }
      ]
    },
    {
      label: 'Окно',
      submenu: [
        { role: 'minimize', label: 'Свернуть' },
        { role: 'close', label: 'Закрыть' }
      ]
    },
    {
      label: 'Справка',
      submenu: [
        { label: 'Исходники Lampa', click: () => shell.openExternal('https://github.com/yumata/lampa-source') },
        { label: 'Проект на GitHub', click: () => shell.openExternal('https://github.com/GideonWhite1029/lampa-desktop') }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
};

module.exports = { build };
