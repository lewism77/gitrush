/** @typedef {import('vscode').ExtensionContext} ExtensionContext */

const copyHash = require('./copyHash.js');
const pushChanges = require('./pushChanges.js');

/**
 * @param {ExtensionContext} context
 */
async function activate(context) {
    console.debug('Starting GitRush...');
    
    await copyHash.activate(context);
    await pushChanges.activate(context);
}

// This method is called when your extension is deactivated
function deactivate() {
    console.debug('Closing GitRush...');
}

module.exports = {
    activate,
    deactivate
}
