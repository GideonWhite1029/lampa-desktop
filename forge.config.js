const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

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
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'linux', 'darwin'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        maintainer: 'GideonWhite1029',
        homepage: 'https://github.com/GideonWhite1029/lampa-desktop'
      },
    },
    {
      name: '@electron-forge/maker-flatpak',
      config: {
        options: {
          categories: ['Video'],
          mimeType: ['video/h264']
        }
      }
    }
  ],
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
