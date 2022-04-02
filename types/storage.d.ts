type StoreAccountType = {
  language: string,
  name: string,
  steamId: string,
  steamWebApiKey: string,
};

type StoreGameDataType = {
  appId: string,
  commandLine: string,
  header: string,
  listenPort: string,
  name: string,
  overlay: boolean,
  path: string,
  runPath: string,
};

type StoreGamesDataType = Record<string, StoreGameDataType>;

type StoreSettingsType = {
  network: boolean,
  steamClientPath?: string,
};

type StoreWindowBoundsType = {
  height: number,
  width: number,
  x: number,
  y: number,
};

type StoreWindowType = {
  bounds: StoreWindowBoundsType,
  isFullScreen: boolean,
  isMaximized: boolean,
};

type StoreType = {
  account?: StoreAccountType,
  games?: StoreGamesDataType,
  settings: StoreSettingsType,
  window?: StoreWindowType,
};