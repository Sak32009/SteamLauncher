import { webContents } from 'electron';
import storage from '../storage';
import notify from './notify';

const gameRemove = (appId: string) => {
  const data = storage.get('games');
  if (typeof data !== 'undefined') {
    const { name } = data[appId];
    delete data[appId];
    storage.set('games', data);
    notify(`${name} removed successfully!`);
    webContents.getFocusedWebContents().send('index-reload-games-list');
  }
};

export default gameRemove;
