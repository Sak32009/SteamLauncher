import type { IpcRendererEvent, OpenDialogReturnValue } from 'electron';

declare global {
  interface Window {
    api: {
      account: {
        exist: () => Promise<boolean>;
        getData: () => Promise<StoreAccountType | undefined>;
        getRandomSteamId: () => Promise<string>;
      };
      app: {
        choseDirectory: () => Promise<OpenDialogReturnValue>;
        choseFile: () => Promise<OpenDialogReturnValue>;
        filePathParse: (path: string) => Promise<FilePathParse>;
        getCopyright: () => Promise<string>;
        getDescription: () => Promise<string>;
        getName: () => Promise<string>;
        getVersion: () => Promise<string>;
        notify: (message: string) => void;
      };
      game: {
        getData: (appId: string) => Promise<StoreGameDataType | undefined>;
        // TODO: add interface
        getPaths: (appId: string) => Promise<Record<string, string>>;
        openContextMenu: (appId: string) => void;
      };
      games: {
        getData: () => Promise<StoreGamesDataType | undefined>;
      };
      on: (
        channel: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listener: (event: IpcRendererEvent, ...arguments_: any[]) => void
      ) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      send: (channel: string, ...arguments_: any[]) => void;
      settings: {
        getData: () => Promise<StoreSettingsType | undefined>;
        getNetworkStatus: () => Promise<boolean | undefined>;
        setNetworkStatus: (to: boolean) => void;
      };
      window: {
        close: () => Promise<void>;
        maximize: () => Promise<void>;
        minimize: () => Promise<void>;
        restore: () => Promise<void>;
      };
    };
  }
}
