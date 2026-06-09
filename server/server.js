/**
 * TechServe Data Storage — serverless KV demos ($db.*)
 * Invoked from the Advanced Storage tab via client.request.invoke
 */

exports = {
  serverDbSet: async function (args) {
    try {
      const { key, value, options } = args;
      const data = await $db.set(key, value, options || {});
      renderData(null, { success: true, operation: 'set', key, data });
    } catch (err) {
      renderData({ status: err.status || 500, message: err.message || 'set failed' });
    }
  },

  serverDbGet: async function (args) {
    try {
      const { key } = args;
      const data = await $db.get(key);
      renderData(null, { success: true, operation: 'get', key, data });
    } catch (err) {
      renderData({ status: err.status || 500, message: err.message || 'get failed' });
    }
  },

  serverDbUpdate: async function (args) {
    try {
      const { key, action, attributes } = args;
      const data = await $db.update(key, action, attributes);
      renderData(null, { success: true, operation: 'update', key, action, data });
    } catch (err) {
      renderData({ status: err.status || 500, message: err.message || 'update failed' });
    }
  },

  serverDbDelete: async function (args) {
    try {
      const { key } = args;
      const data = await $db.delete(key);
      renderData(null, { success: true, operation: 'delete', key, data });
    } catch (err) {
      renderData({ status: err.status || 500, message: err.message || 'delete failed' });
    }
  }
};
