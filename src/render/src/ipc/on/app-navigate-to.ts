import navigo from '../../navigo.js';

window.api.on('app-navigate-to', (_event, to: string) => {
  navigo.navigate(to);
});