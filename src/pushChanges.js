const vscode = require('vscode');
const childProcess = require('child_process');
const gitUtil = require('./gitUtil.js');

const forcePushIcon = "$(repo-force-push)";
const loadingIcon = "$(sync~spin)";

let statusBarPush;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    const gitPath = vscode.workspace.getConfiguration('git').get('path') || 'git';
    const pushCommandId = 'gitrush.gitPush';
    let gitPushCommand = vscode.commands.registerCommand(pushCommandId, async () => {
        await updateStatusBarRemote(loadingIcon);

        const api = await gitUtil.getGitApi();
        const repo = api.getRepository(vscode.window.activeTextEditor.document.fileName);
        childProcess.exec(gitPath + ' push',
            { cwd: repo.rootUri.fsPath },
            (error, stdout, stderr) => {
            if(error) { vscode.window.showErrorMessage(error.toString()); }
            if(stderr) { vscode.window.showErrorMessage(stderr); }
            if (stdout) { vscode.window.showInformationMessage(stdout); }
            updateStatusBarRemote(); // Can't await here
        });
    });

    context.subscriptions.push(gitPushCommand);

    // Push button on status bar
    statusBarPush = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    statusBarPush.command = pushCommandId;
    context.subscriptions.push(statusBarPush);

    // Update when switching editors
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async () => {
        await updateStatusBarRemote();
    }));

    // Update when git API is initialised
    const api = await gitUtil.getGitApi();
    context.subscriptions.push(api.onDidChangeState(async () => {
        await updateStatusBarRemote();
    }));
}

/**
 * @param {string} icon
 */
async function updateStatusBarRemote(icon = forcePushIcon) {
    const remote = await gitUtil.getOriginRemote();
    if (remote) {
        statusBarPush.text = `${icon} Push`;
        statusBarPush.tooltip = `Push to: "${remote}"`
        statusBarPush.show();
    } else {
        statusBarPush.hide();
    }
}

module.exports = {
    activate,
}