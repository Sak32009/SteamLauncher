import {serialize} from 'dom-form-serializer';

$(document).on('submit', '.modal form[sk-channel]', async (event) => {
  event.preventDefault();
  const $dom = $(event.currentTarget);
  const channel = $dom.attr('sk-channel')!;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const serialized = serialize($dom[0]);

  if (channel === 'game-add' || channel === 'game-edit') {
    $.snack('Not implemented yet', 'warning');
  } else {
    window.api.send(channel, serialized);
  }
});

export {};