import { app, dialog, shell } from 'electron';
import fs from 'node:fs';
import { join, basename } from 'node:path';
import { pathExists, emptyDir, copy, writeFile, ensureDir, remove } from 'fs-extra';
import ini from 'ini';
import appNotify from '../functions/app-notify';
import log from '../instances/log';
import storage from '../instances/storage';
import execFile from '../node/exec-file-promisify';
import paths from '../paths';
import SteamEmulator from './steam-emulator';
// eslint-disable-next-line import/no-cycle
import SteamCloud from './steam-cloud';

const isDirectoryEmpty = async (path: string) => {
  const files = await fs.promises.readdir(path);
  return files.length === 0;
};

class SteamGame {
  private static async clientLoader(dataGame: StoreGameDataType) {
    // loader
    const loaderConfig = {
      Launcher: {
        Target: dataGame.executableFilePath,
        StartIn: dataGame.executableWorkingDirectory,
        CommandLine: dataGame.commandLine,
        SteamClientPath: paths.emulator.steamClientFilePath,
        SteamClientPath64: paths.emulator.steamClient64FilePath,
        Persist: storage.get('settings.ssePersist') ? 1 : 0,
        InjectDll: storage.get('settings.sseInjectDll') ? 1 : 0,
        ParanoidMode: storage.get('settings.sseParanoidMode') ? 1 : 0,
      },
      SmartSteamEmu: {
        AppId: dataGame.appId,
      },
    };

    await writeFile(paths.emulator.loaderConfigFilePath, ini.stringify(loaderConfig));

    // exec
    appNotify(`Launch ${dataGame.name}`);

    await execFile(paths.emulator.loaderFilePath);
  }

  public static async launch(dataGame: StoreGameDataType, withoutEmu = false) {
    const dataGameExecutableFilePath = dataGame.executableFilePath;
    const dataGameCommandLine = dataGame.commandLine;
    const dataGameAppId = dataGame.appId;
    const dataGameName = dataGame.name;
    const dataGameDisableOverlay = dataGame.disableOverlay;
    const dataGameDisableNetworking = dataGame.disableNetworking;
    const dataGameDisableLanOnly = dataGame.disableLanOnly;
    const dataGameForceAccountName = dataGame.forceAccountName;
    const dataGameForceAccountLanguage = dataGame.forceAccountLanguage;
    const dataGameForceAccountSteamId = dataGame.forceAccountSteamId;
    const dataGameForceAccountListenPort = dataGame.forceAccountListenPort;
    const dataGamePaths = SteamGame.paths(dataGameAppId);

    const dataAccount = storage.get('account') as StoreAccountType;

    const dataSettings = storage.get('settings');
    const dataNetwork = dataSettings.network;

    if (withoutEmu) {
      appNotify(`Launch normally ${dataGameName}`);
      await execFile(dataGameExecutableFilePath, dataGameCommandLine.split(' '));
      return;
    }

    if (!(await SteamEmulator.checkForUpdatesAndNotify())) {
      appNotify('Error with the verification of the emulator, check the logs.');
      return;
    }

    // root/disable_lan_only.txt
    await (dataGameDisableLanOnly
      ? writeFile(paths.emulator.disableLanOnlyFilePath, '')
      : remove(paths.emulator.disableLanOnlyFilePath));

    // root/local_save.txt
    await writeFile(paths.emulator.localSaveFilePath, 'steam_saves');

    // steam_saves
    await ensureDir(paths.emulator.savesPath);

    // steam_saves/settings
    await ensureDir(paths.emulator.savesSettingsPath);

    await writeFile(paths.emulator.savesSettingsAccountNameFilePath, dataAccount.name);
    await writeFile(paths.emulator.savesSettingsLanguageFilePath, dataAccount.language);
    await writeFile(paths.emulator.savesSettingsListenPortFilePath, dataAccount.listenPort);
    await writeFile(paths.emulator.savesSettingsUserSteamIdFilePath, dataAccount.steamId);

    // steam_settings
    await emptyDir(paths.emulator.settingsPath);

    await copy(dataGamePaths.appIdDataPath, paths.emulator.settingsPath, {
      filter: (source) => basename(source) !== 'header.jpg',
    });

    // steam_settings/steam_appid.txt
    await writeFile(paths.emulator.settingsSteamAppIdFilePath, dataGameAppId);

    // steam_settings/force_account_name.txt
    if (dataGameForceAccountName.length > 0) {
      await writeFile(paths.emulator.settingsForceAccountNameFilePath, dataGameForceAccountName);
    }

    // steam_settings/force_language.txt
    if (dataGameForceAccountLanguage.length > 0) {
      await writeFile(paths.emulator.settingsForceLanguageFilePath, dataGameForceAccountLanguage);
    }

    // steam_settings/force_steamid.txt
    if (dataGameForceAccountSteamId.length > 0) {
      await writeFile(paths.emulator.settingsForceSteamIdFilePath, dataGameForceAccountSteamId);
    }

    // steam_settings/force_listen_port.txt
    if (dataGameForceAccountListenPort.length > 0) {
      await writeFile(paths.emulator.settingsForceListenPortFilePath, dataGameForceAccountListenPort);
    }

    // steam_settings/disable_overlay.txt
    if (dataGameDisableOverlay) {
      await writeFile(paths.emulator.settingsDisableOverlayFilePath, '');
    }

    // steam_settings/disable_networking.txt
    if (dataGameDisableNetworking) {
      await writeFile(paths.emulator.settingsDisableNetworkingFilePath, '');
    }

    // steam_settings/offline.txt
    if (!dataNetwork) {
      await writeFile(paths.emulator.settingsOfflineFilePath, '');
    }

    // clientLoader
    await SteamGame.clientLoader(dataGame);

    // after the game is closed, I make backups of the saves
    await SteamCloud.backup(dataGame);
  }

  public static launchFromCommandsLine(appCommandsLine: string[]) {
    if (appCommandsLine.length > 0) {
      const { 0: argumentAppId } = appCommandsLine;
      log.info(`Launched ${argumentAppId} from commands line...`);
      const data: StoreGameDataType | undefined = storage.get(`games.${argumentAppId}`);
      if (typeof data !== 'undefined') {
        SteamGame.launch(data).catch((error) => log.error((error as Error).message));
      } else {
        dialog.showErrorBox('Error', `${argumentAppId} does not exist!`);
      }
    }
  }

  public static remove(appId: string) {
    const data = storage.get('games');
    if (typeof data !== 'undefined') {
      const { name } = data[appId];
      delete data[appId];
      storage.set('games', data);
      appNotify(`${name} removed successfully!`);
    }
  }

  public static paths(appId: string) {
    const steamRetrieverPath = join(paths.appDataPath, 'steam_retriever');
    const steamCloudPath = join(paths.appDataPath, 'steam_cloud');
    const appIdSavesCloudPath = join(steamCloudPath, appId);
    const appIdDataPath = join(steamRetrieverPath, appId);
    const appIdAchievementsPath = join(appIdDataPath, 'achievements');
    const appIdAchievementsInfoPath = join(appIdDataPath, 'achievements.json');
    const appIdStatsInfoPath = join(appIdDataPath, 'stats.txt');
    const appIdItemsInfoPath = join(appIdDataPath, 'items.json');
    const appIdDefaultItemsInfoPath = join(appIdDataPath, 'default_items.json');
    const appIdDlcsInfoPath = join(appIdDataPath, 'DLC.txt');
    const appIdSteamInterfacesPath = join(appIdDataPath, 'steam_interfaces.txt');
    const appIdHeaderPath = join(appIdDataPath, 'header.jpg');
    const appIdSavesPath = join(paths.emulator.savesPath, appId);

    return {
      steamRetrieverPath,
      appIdSavesPath,
      appIdAchievementsInfoPath,
      appIdAchievementsPath,
      appIdDataPath,
      appIdDefaultItemsInfoPath,
      appIdDlcsInfoPath,
      appIdHeaderPath,
      appIdItemsInfoPath,
      appIdStatsInfoPath,
      appIdSteamInterfacesPath,
      appIdSavesCloudPath,
    };
  }

  public static async openFileLocation(appId: string) {
    const dataGame: StoreGameDataType = storage.get(`games.${appId}`);
    if (await pathExists(dataGame.executableFilePath)) {
      shell.showItemInFolder(dataGame.executableFilePath);
    } else {
      appNotify('The game path does not exists!');
    }
  }

  public static async openSaveLocation(appId: string) {
    const gamePaths = SteamGame.paths(appId);
    const savesPath = gamePaths.appIdSavesPath;
    const savesCloudPath = gamePaths.appIdSavesCloudPath;
    if ((await pathExists(savesCloudPath)) && !(await isDirectoryEmpty(savesCloudPath))) {
      await shell.openPath(savesCloudPath);
    } else {
      appNotify('The game has no saves inside the cloud saves.');
    }

    if (await pathExists(savesPath)) {
      await shell.openPath(savesPath);
    } else {
      appNotify('The game has no saves inside the emulator.');
    }
  }

  public static async openDataLocation(appId: string) {
    const { appIdDataPath } = SteamGame.paths(appId);
    if (await pathExists(appIdDataPath)) {
      await shell.openPath(appIdDataPath);
    } else {
      appNotify('The game data does not exists!');
    }
  }

  public static createDesktopShortcut(appId: string) {
    const data: StoreGameDataType = storage.get(`games.${appId}`);
    const name = SteamGame.removeSpecialChars(data.name);
    const toPath = join(app.getPath('desktop'), `Launch ${name}.lnk`);
    const writeShortcutLink = shell.writeShortcutLink(toPath, {
      args: data.appId,
      icon: data.executableFilePath,
      iconIndex: 0,
      target: app.getPath('exe'),
    });
    if (writeShortcutLink) {
      appNotify('Shortcut created successfully on desktop!');
    } else {
      appNotify('Unknown error with creating shortcut!');
    }
  }

  public static removeSpecialChars(string_: string) {
    return string_.replace(/[^\w\s]/gu, '');
  }
}

export default SteamGame;