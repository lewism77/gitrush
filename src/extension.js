/** @typedef {import('vscode').ExtensionContext} ExtensionContext */

const copyHash = require('./copyHash.js');
const pushChanges = require('./pushChanges.js');
const forcePushChanges = require('./forcePushChanges.js');
const commitStagedAmend = require('./commitStagedAmend.js');

/**
 * @param {ExtensionContext} context
 */
async function activate(context) {
    console.debug('Starting GitRush...');
    
    await copyHash.activate(context);
    await pushChanges.activate(context);
    await forcePushChanges.activate(context);
    await commitStagedAmend.activate(context);
}

function deactivate() {
    console.debug('Closing GitRush...');
}

module.exports = {
    activate,
    deactivate
}
