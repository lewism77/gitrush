const vscode = require('vscode');
const gitUtil = require('./gitUtil.js');

const normalIcon = "$(git-commit)";
const copiedIcon = "$(files)";
const iconTransitionMs = 1000;

let statusBarCommit;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    const copyCommitCommandId = 'gitrush.copyCommit';
    let copyCommitCommand = vscode.commands.registerCommand(copyCommitCommandId, async () => copyCommitAction());

    context.subscriptions.push(copyCommitCommand);

    statusBarCommit = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarCommit.command = copyCommitCommandId;

    // Update when switching editors
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async () => {
        await updateStatusBarCommit();
    }));
    
    // Update when git API is initialised
    const api = await gitUtil.getGitApi();
    context.subscriptions.push(api.onDidChangeState(async () => {
        await updateStatusBarCommit();
    }));
}

/**
 * @param {string} icon
 */
async function updateStatusBarCommit(icon = normalIcon) {
    const currentCommit = await gitUtil.getCurrentCommit();
    if (currentCommit) {
        statusBarCommit.text = `${icon} ${currentCommit.substring(0, 8)}`;
        statusBarCommit.tooltip = `Copy: "${currentCommit}"`
        statusBarCommit.show();
    } else {
        statusBarCommit.hide();
    }
}

async function copyCommitAction() {
    // Put hash into the clipboard
    var currentCommit = await gitUtil.getCurrentCommit();
    vscode.env.clipboard.writeText(currentCommit);
    
    // Change the icon temporarily as feedback to user
    await updateStatusBarCommit(copiedIcon)
    let interval = setInterval(async() => {
        await updateStatusBarCommit(normalIcon);
        clearInterval(interval);
    }, iconTransitionMs);
}

module.exports = {
    activate,
}
