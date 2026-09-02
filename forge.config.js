const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// Heavy / toolchain-dependent makers can be turned off for local `npm run make`:
//   LAMPA_SKIP_FLATPAK=1   (needs flatpak + flatpak-builder + runtimes)
//   LAMPA_SKIP_WIX=1       (needs the WiX Toolset v3 on PATH, Windows only)
//   LAMPA_SKIP_APPIMAGE=1
const skip = (name) => process.env[`LAMPA_SKIP_${name}`] === '1';

const makers = [
  {
    name: '@electron-forge/maker-zip',
    platforms: ['win32', 'linux', 'darwin'],
  },
  {
    name: '@electron-forge/maker-squirrel',
    platforms: ['win32'],
    config: {},
  },
  {
    name: '@electron-forge/maker-deb',
    platforms: ['linux'],
    config: {
      maintainer: 'GideonWhite1029',
      homepage: 'https://github.com/GideonWhite1029/lampa-desktop'
    },
  },
  {
    name: '@electron-forge/maker-rpm',
    platforms: ['linux'],
    config: {
      homepage: 'https://github.com/GideonWhite1029/lampa-desktop'
    },
  }
];

if (!skip('APPIMAGE')) {
  makers.push({
    name: '@reforged/maker-appimage',
    platforms: ['linux'],
    config: {
      options: {
        name: 'Lampa',
        productName: 'Lampa',
        bin: 'lampa',
        genericName: 'Media Center',
        categories: ['AudioVideo', 'Video', 'Player'],
        icon: 'icons/og.png'
      }
    },
  });
}

if (!skip('FLATPAK')) {
  makers.push({
    name: '@electron-forge/maker-flatpak',
    platforms: ['linux'],
    config: {
      options: {
        id: 'com.lampa.stream',
        productName: 'Lampa',
        genericName: 'Media Center',
        description: 'Приложение для просмотров фильмов и сериалов',
        categories: ['AudioVideo', 'Video', 'Player'],
        icon: 'icons/og.png',
        runtimeVersion: '24.08',
        baseVersion: '24.08',
        finishArgs: [
          '--share=ipc',
          '--share=network',
          '--socket=x11',
          '--socket=wayland',
          '--socket=pulseaudio',
          '--device=dri',
          '--filesystem=home',
          '--filesystem=xdg-download',
          '--talk-name=org.freedesktop.Notifications',
          '--talk-name=org.kde.StatusNotifierWatcher',
          // let the sandbox launch an external player (VLC/mpv/...) on the host
          '--talk-name=org.freedesktop.Flatpak'
        ]
      }
    },
  });
}

if (!skip('WIX')) {
  makers.push({
    name: '@electron-forge/maker-wix',
    platforms: ['win32'],
    config: {
      name: 'Lampa',
      manufacturer: 'GideonWhite1029',
      exe: 'lampa',
      icon: 'icons/og.ico',
      shortcutFolderName: 'Lampa',
      // Keep this GUID constant forever so future MSIs upgrade in place.
      upgradeCode: '8569691a-a325-415c-8047-f6710eddc5b3',
      ui: {
        chooseDirectory: true
      }
    },
  });
}

module.exports = {
  packagerConfig: {
    author: "ymata, GideonWhite1029",
    description: "Приложение для просмотров фильмов и сериалов",
    arch: ["x64", "ia32"],
    platform: ["win32", "linux", "darwin"],
    asar: true,
    executableName: "lampa",
    icon: "icons/og.png"
  },
  rebuildConfig: {},
  makers,
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'GideonWhite1029',
          name: 'lampa-desktop'
        },
        prerelease: false,
        generateReleaseNotes: true,
        draft: true
      }
    }
  ],
  buildIdentifier: "com.lampa.stream"
};
