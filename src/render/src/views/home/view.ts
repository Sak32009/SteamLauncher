import mustache from 'mustache';
import navigo from '../../navigo.js';

class HomeView {
  private $dom: JQuery | undefined;

  public async show() {
    await this.setDom();
    await this.appendGamesList();
    await this.setEvents();
    await this.appendDom();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public async beforeHook(done: Function) {
    const accountExist = await window.api.account.exist();
    if (!accountExist) {
      navigo.navigate('/account/create');
    }

    done();
  }

  private async setDom() {
    const {default: html} = await import('./home.html?raw');
    const rendered = mustache.render(html, {});
    this.$dom = $(rendered);
  }

  private async appendGamesList() {
    const gamesData = await window.api.games.getData();
    const $gamesList = this.$dom?.find('#games-list .card-body').empty();
    if (typeof gamesData !== 'undefined' && Object.keys(gamesData).length > 0) {
      const $gamesGrid = $("<div class='games-grid'></div>");
      $.each(gamesData, (appId: string, values) => {
        const $gameContainer = $(`<div class="game-container" data-appId="${appId}"></div>`);
        const header = values.header;
        const name = values.name;

        if (header !== '') {
          $('<img>').attr('src', header).appendTo($gameContainer);
        }

        $('<div>').text(name).appendTo($gameContainer);

        $gamesGrid.append($gameContainer);
      });
      $gamesList?.append($gamesGrid);
    } else {
      $gamesList?.html(`<h1 class="text-center">You haven't entered any games yet!</h1>`);
    }
  }

  private async setEvents() {
    this.$dom?.on('contextmenu', '.game-container', (event) => {
      const appId = $(event.currentTarget).attr('data-appId');
      window.api.game.openContextMenu(appId!);
    });

    this.$dom?.find('#file-drop').fileDrop((file) => {
      const queryString = new URLSearchParams(file).toString();
      navigo.navigate(`/game/add/?${queryString}`);
    });

    window.api.on('index-reload-games-list', async () => {
      await this.appendGamesList();
    });
  }

  private async appendDom() {
    $('#container').html(this.$dom![0]);
  }
}

export default HomeView;