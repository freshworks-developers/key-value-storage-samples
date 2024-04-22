/**
 * @desc - This app allows you to save a memo linked to the ticket
 * @info - https://developers.freshservice.com/docs/data-storage
 */

let noteKey;

const q = (selector, context = document) => context.querySelector(selector);

const showError = async (err) => {
  try {
    const data = await client.interface.trigger("showNotify", {
      type: "warning",
      title: "Warning",
      message: `Error: App is facing issues during initialization - ${err}`,
    });
    console.info(`Err: Interface API - ${data}`);
  } catch (error) {
    console.error(`Some error Encountered: ${error}`);
  }
};

const saveNote = async () => {
  console.log('save note clicked');
  const noteData = q("#note").value;
  if (noteData === '') {
    notify('warning', 'Note is empty');
    return;
  }
  try {
    await client.db.set(noteKey, { note: noteData });
    notify('success', 'Note has been stored');
  } catch {
    notify('danger', 'Error storing the note');
  }
};

const deleteNote = async () => {
  try {
    await client.db.delete(noteKey);
    q("#note").value = '';
    notify('success', 'Note has been deleted');
  } catch {
    notify('danger', 'Error deleting the note');
  }
};

const displayNote = async () => {
  const data = await client.db.get(noteKey);
  q("#note").value = data.note;
};

const notify = async (status, message) => {
  await client.interface.trigger('showNotify', {
    type: status,
    message: message,
  });
};

const fetchInfo = async (callback) => {
  try {
    const userData = await client.data.get('loggedInUser');
    console.log(userData);
    const ticketData = await client.data.get('ticket');
    console.log(ticketData);
    noteKey = `${userData.loggedInUser.id} : ${ticketData.ticket.id}`;
    callback();
  } catch (error) {
    console.error(`Error fetching data: ${error}`);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const _client = await app.initialized();
    window.client = _client;
    client.events.on('app.activated', async () => {
      await fetchInfo();
      displayNote();
      q("#note-save").addEventListener('click', saveNote);
      q("#note-delete").addEventListener('click', deleteNote);
    });
  } catch (err) {
    console.error('Error: Failed to initialize the app');
    showError(err);
  }
});

