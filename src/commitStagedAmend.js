const vscode = require('vscode');
const childProcess = require('child_process');
const gitUtil = require('./gitUtil.js');

const forcePushIcon = "$(references)";
const loadingIcon = "$(sync~spin)";

let statusBarPush;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    const gitPath = vscode.workspace.getConfiguration('git').get('path') || 'git';
    const pushCommandId = 'gitrush.commitStagedAmend';
    let gitPushCommand = vscode.commands.registerCommand(pushCommandId, async () => {
        await updateStatusBar(loadingIcon);

        const api = await gitUtil.getGitApi();
        const repo = api.getRepository(vscode.window.activeTextEditor.document.fileName);
        childProcess.exec(gitPath + ' commit --amend --no-edit',
            { cwd: repo.rootUri.fsPath },
            (error, stdout, stderr) => {
            if(error) { vscode.window.showErrorMessage(error.toString()); }
            if(stderr) { vscode.window.showErrorMessage(stderr); }
            if (stdout) { vscode.window.showInformationMessage(stdout); }
            updateStatusBar(); // Can't await here
        });
    });

    context.subscriptions.push(gitPushCommand);

    // Push button on status bar
    statusBarPush = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
    statusBarPush.command = pushCommandId;
    context.subscriptions.push(statusBarPush);

    // Update when switching editors
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async () => {
        await updateStatusBar();
    }));

    // Update when git API is initialised
    const api = await gitUtil.getGitApi();
    context.subscriptions.push(api.onDidChangeState(async () => {
        await updateStatusBar();
    }));
}

/**
 * @param {string} icon
 */
async function updateStatusBar(icon = forcePushIcon) {
    let enable = vscode.workspace.getConfiguration('gitrush').get('enableCommitAmend');
    const remote = await gitUtil.getOriginRemote();

    if (remote && enable) {
        statusBarPush.text = `${icon} Amend`;
        statusBarPush.tooltip = `Amend to: "${remote}"`;
        statusBarPush.show();
    } else {
        statusBarPush.hide();
    }
}

module.exports = {
    activate,
}