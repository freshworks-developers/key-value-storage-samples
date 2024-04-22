let noteKey, client;

(async function init() {
  client = await app.initialized();
  let {
    loggedInUser: { id: agentId }
  } = await client.data.get('loggedInUser');
  let {
    ticket: { id: ticketId }
  } = await client.data.get('ticket');

  noteKey = `${agentId}:${ticketId}`;

  pick('.note-save').addEventListener('click', saveNotes);
  pick('.note-delete').addEventListener('click', deleteNotes);

  client.events.on('app.activated', setup);
})();

async function saveNotes() {
  let notes = pick('.note').value;
  if (notes) {
    await to(client.db.set(noteKey, { notes }));
    showNoticeToUser('success', 'DB — ', 'Notes saved');
  } else {
    showNoticeToUser('warning', 'DB — ', 'You did not save any notes');
  }
}

async function deleteNotes() {
  let [err] = await to(client.db.delete(noteKey));
  if (err) {
    showNoticeToUser('error', 'DB — ', 'Not able to Delete');
  }

  pick('.note').value = '';
  showNoticeToUser('success', 'DB — ', 'Notes deleted');
}

async function setup() {
  let [err, { notes }] = await to(client.db.get(noteKey));

  if (err) {
    switch (err.status) {
      case 404:
        await showNoticeToUser('info', 'DB — ', 'You did not save any notes');
        break;
      case 0:
        console.error('In development mode');
        break;
      default:
        await showNoticeToUser('danger', 'Unexpected Error', "Take Developer's help");
        break;
    }
  }
  pick('.note').value = notes;
}

async function showNoticeToUser(...info) {
  let [type, title, message] = info;
  let notificationType = { type, title, message };

  await client.interface.trigger('showNotify', notificationType);
}

function pick(selector, context = document) {
  return context.querySelector(selector);
}

// utility to handle
function to(promise, improved) {
  return promise
    .then((data) => [null, data])
    .catch((err) => {
      if (improved) {
        Object.assign(err, improved);
      }
      return [err];
    });
}
