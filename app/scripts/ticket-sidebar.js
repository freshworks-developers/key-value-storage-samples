(function () {
  const state = {
    client: null,
    agentId: null,
    ticketId: null,
    noteKey: null,
    statsKey: null,
    ttlKey: null,
    serverKey: null,
    ticketNotesEntity: null,
    entityRecordId: null
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      state.client = await app.initialized();
      const entity = state.client.db.entity({ version: 'v1' });
      state.ticketNotesEntity = entity.get('ticket_notes');

      const [{ loggedInUser }, { ticket }] = await Promise.all([
        state.client.data.get('loggedInUser'),
        state.client.data.get('ticket')
      ]);

      state.agentId = loggedInUser.id;
      state.ticketId = ticket.id;
      state.noteKey = `${state.agentId}:${state.ticketId}`;
      state.statsKey = `stats:${state.agentId}:${state.ticketId}`;
      state.ttlKey = `ttl:${state.agentId}:${state.ticketId}`;
      state.serverKey = `srv:${state.agentId}:${state.ticketId}`;

      document.getElementById('ticket-meta').textContent = `Ticket #${state.ticketId} · Agent ${state.agentId}`;
      document.getElementById('note-key-label').textContent = state.noteKey;

      bindNotesTab();
      bindAdvancedTab();

      state.client.events.on('app.activated', loadNotes);
      await loadNotes();
    } catch (err) {
      console.error('Init failed', err);
      showNotify('danger', 'Init error', 'Could not initialize the app.');
    }
  }

  function bindNotesTab() {
    document.getElementById('note-save').addEventListener('click', saveNotes);
    document.getElementById('note-delete').addEventListener('click', deleteNotes);
  }

  function bindAdvancedTab() {
    document.getElementById('btn-increment').addEventListener('click', incrementViews);
    document.getElementById('btn-append').addEventListener('click', appendTag);
    document.getElementById('btn-set-field').addEventListener('click', setStatus);
    document.getElementById('btn-ttl-set').addEventListener('click', setWithTtl);
    document.getElementById('btn-setif-create').addEventListener('click', setIfNotExist);
    document.getElementById('btn-setif-update').addEventListener('click', setIfExist);
    document.getElementById('btn-entity-save').addEventListener('click', saveEntity);
    document.getElementById('btn-entity-load').addEventListener('click', loadEntity);
    document.getElementById('btn-srv-set').addEventListener('click', serverDbSet);
    document.getElementById('btn-srv-get').addEventListener('click', serverDbGet);
    document.getElementById('btn-srv-update').addEventListener('click', serverDbUpdate);
    document.getElementById('btn-srv-delete').addEventListener('click', serverDbDelete);
  }

  async function loadNotes() {
    const [err, data] = await to(state.client.db.get(state.noteKey));

    if (err) {
      if (err.status === 404) {
        await showNotify('info', 'DB —', 'You did not save any notes');
        document.getElementById('note-text').value = '';
        return;
      }
      if (err.status === 0) {
        console.error('Development mode — KV unavailable');
        return;
      }
      await showNotify('danger', 'Unexpected error', "Take developer's help");
      return;
    }

    document.getElementById('note-text').value = data.notes || '';
  }

  async function saveNotes() {
    const notes = document.getElementById('note-text').value;
    if (!notes) {
      await showNotify('warning', 'DB —', 'You did not save any notes');
      return;
    }
    await state.client.db.set(state.noteKey, { notes });
    await showNotify('success', 'DB —', 'Notes saved');
  }

  async function deleteNotes() {
    const [err] = await to(state.client.db.delete(state.noteKey));
    if (err) {
      await showNotify('error', 'DB —', 'Not able to delete');
      return;
    }
    document.getElementById('note-text').value = '';
    await showNotify('success', 'DB —', 'Notes deleted');
  }

  async function ensureStatsRecord() {
    const [err] = await to(state.client.db.get(state.statsKey));
    if (err && err.status === 404) {
      await state.client.db.set(state.statsKey, {
        views: 0,
        tags: [],
        status: 'new'
      });
    }
  }

  async function incrementViews() {
    await ensureStatsRecord();
    const data = await state.client.db.update(state.statsKey, 'increment', { views: 1 });
    setOutput('update-output', `increment views → ${JSON.stringify(data, null, 2)}`);
    await showNotify('success', 'update', 'Incremented views');
  }

  async function appendTag() {
    await ensureStatsRecord();
    const tag = `tag-${Date.now().toString(36)}`;
    const data = await state.client.db.update(state.statsKey, 'append', { tags: [tag] });
    setOutput('update-output', `append tag "${tag}" → ${JSON.stringify(data, null, 2)}`);
    await showNotify('success', 'update', `Appended ${tag}`);
  }

  async function setStatus() {
    await ensureStatsRecord();
    const data = await state.client.db.update(state.statsKey, 'set', { status: 'reviewed' });
    setOutput('update-output', `set status → ${JSON.stringify(data, null, 2)}`);
    await showNotify('success', 'update', 'Status set to reviewed');
  }

  async function setWithTtl() {
    const ttl = Number(document.getElementById('ttl-seconds').value) || 120;
    const data = await state.client.db.set(
      state.ttlKey,
      { draft: 'Ephemeral coaching draft', savedAt: new Date().toISOString() },
      { ttl }
    );
    setOutput('ttl-output', `set with ttl:${ttl}s → ${JSON.stringify(data, null, 2)}`);
    await showNotify('success', 'TTL', `Draft expires in ${ttl}s`);
  }

  async function setIfNotExist() {
    const lockKey = `lock:${state.agentId}:${state.ticketId}`;
    try {
      const data = await state.client.db.set(lockKey, { locked: true }, { setIf: 'not_exist' });
      setOutput('ttl-output', `setIf not_exist OK → ${JSON.stringify(data, null, 2)}`);
      await showNotify('success', 'setIf', 'Lock created (not_exist)');
    } catch (err) {
      setOutput('ttl-output', `setIf not_exist failed (${err.status}): ${err.message}`);
      await showNotify('warning', 'setIf', err.message || 'Key already exists');
    }
  }

  async function setIfExist() {
    const lockKey = `lock:${state.agentId}:${state.ticketId}`;
    try {
      const data = await state.client.db.set(lockKey, { locked: false, releasedAt: new Date().toISOString() }, { setIf: 'exist' });
      setOutput('ttl-output', `setIf exist OK → ${JSON.stringify(data, null, 2)}`);
      await showNotify('success', 'setIf', 'Lock updated (exist)');
    } catch (err) {
      setOutput('ttl-output', `setIf exist failed (${err.status}): ${err.message}`);
      await showNotify('warning', 'setIf', err.message || 'Key does not exist');
    }
  }

  async function saveEntity() {
    const noteContent = document.getElementById('entity-note').value;
    const payload = {
      ticket_id: String(state.ticketId),
      agent_id: String(state.agentId),
      note_content: noteContent,
      tags: 'coaching'
    };

    let result;
    if (state.entityRecordId) {
      result = await state.ticketNotesEntity.update(state.entityRecordId, payload);
    } else {
      result = await state.ticketNotesEntity.create(payload);
      state.entityRecordId = result.record.display_id;
    }

    setOutput('entity-output', JSON.stringify(result, null, 2));
    await showNotify('success', 'Entity', 'Coaching note saved');
  }

  async function loadEntity() {
    const result = await state.ticketNotesEntity.getAll({
      query: { ticket_id: String(state.ticketId), agent_id: String(state.agentId) }
    });

    if (result.records && result.records.length > 0) {
      state.entityRecordId = result.records[0].display_id;
      document.getElementById('entity-note').value = result.records[0].data.note_content || '';
      setOutput('entity-output', JSON.stringify(result, null, 2));
      await showNotify('success', 'Entity', 'Record loaded');
    } else {
      setOutput('entity-output', 'No entity record for this ticket + agent.');
      await showNotify('info', 'Entity', 'No record found');
    }
  }

  async function serverDbSet() {
    const result = await invokeServer('serverDbSet', {
      key: state.serverKey,
      value: { source: 'serverless', visits: 1, updatedAt: new Date().toISOString() },
      options: { setIf: 'not_exist' }
    });
    setOutput('server-output', JSON.stringify(result, null, 2));
  }

  async function serverDbGet() {
    const result = await invokeServer('serverDbGet', { key: state.serverKey });
    setOutput('server-output', JSON.stringify(result, null, 2));
  }

  async function serverDbUpdate() {
    const result = await invokeServer('serverDbUpdate', {
      key: state.serverKey,
      action: 'increment',
      attributes: { visits: 1 }
    });
    setOutput('server-output', JSON.stringify(result, null, 2));
  }

  async function serverDbDelete() {
    const result = await invokeServer('serverDbDelete', { key: state.serverKey });
    setOutput('server-output', JSON.stringify(result, null, 2));
  }

  async function invokeServer(method, payload) {
    try {
      const response = await state.client.request.invoke(method, payload);
      await showNotify('success', 'Serverless', `${method} completed`);
      return response;
    } catch (err) {
      await showNotify('danger', 'Serverless', err.message || `${method} failed`);
      throw err;
    }
  }

  async function showNotify(type, title, message) {
    await state.client.interface.trigger('showNotify', { type, title, message });
  }

  function setOutput(id, text) {
    document.getElementById(id).textContent = text;
  }

  function to(promise) {
    return promise.then((data) => [null, data]).catch((err) => [err]);
  }
})();
