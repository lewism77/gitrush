const vscode = require('vscode');
const childProcess = require('child_process');
const normalIcon = "$(git-commit)";
const copiedIcon = "$(files)";
const forcePushIcon = "$(repo-force-push)";
const loadingIcon = "$(sync~spin)";
const iconTransitionMs = 1000;
const gitApiVersion = 1;
let statusBarCommit;
let statusBarPush;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    console.debug('Starting GitRush...');

    // Push command
    const gitPath = vscode.workspace.getConfiguration('git').get('path') || 'git';
    const pushCommandId = 'gitrush.gitPush';
    let gitPushCommand = vscode.commands.registerCommand(pushCommandId, async () => {
        await _updateStatusBarRemote(loadingIcon);

        const api = await _getGitApi();
        const repo = api.getRepository(vscode.window.activeTextEditor.document.fileName);
        childProcess.exec(gitPath + ' push',
            { cwd: repo.rootUri.fsPath },
            (error, stdout, stderr) => {
            if(error) { vscode.window.showErrorMessage(error.toString()); }
            if(stderr) { vscode.window.showErrorMessage(stderr); }
            if (stdout) { vscode.window.showInformationMessage(stdout); }
            _updateStatusBarRemote();
        });
    });

    context.subscriptions.push(gitPushCommand);

    // Push button on status bar
    statusBarPush = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    statusBarPush.command = pushCommandId;
    context.subscriptions.push(statusBarPush);    

    // Copy hash command
    const copyCommitCommandId = 'gitrush.copyCommit';
    let copyCommitCommand = vscode.commands.registerCommand(copyCommitCommandId, async () => {
        // Put hash into the clipboard
        var currentCommit = await _getCurrentCommit();
        vscode.env.clipboard.writeText(currentCommit);
        
        // Change the icon temporarily as feedback to user
        await _updateStatusBarCommit(copiedIcon)
        let interval = setInterval(async() => {
            await _updateStatusBarCommit(normalIcon);
            clearInterval(interval);
        }, iconTransitionMs);
    });

    context.subscriptions.push(copyCommitCommand);

    // Hash status bar
    statusBarCommit = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarCommit.command = copyCommitCommandId;

    // Update when switching editors
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async () => {
        await _updateStatusBarCommit();
        await _updateStatusBarRemote();
    }));
    
    // Update when git API is initialised
    const api = await _getGitApi();
    context.subscriptions.push(api.onDidChangeState(async () => {
        await _updateStatusBarCommit();
        await _updateStatusBarRemote();
    }));
}

async function _updateStatusBarCommit(icon = normalIcon) {
    const currentCommit = await _getCurrentCommit();
    if (currentCommit) {
        statusBarCommit.text = `${icon} ${currentCommit.substring(0, 8)}`;
        statusBarCommit.tooltip = `Copy: "${currentCommit}"`
        statusBarCommit.show();
    } else {
        statusBarCommit.hide();
    }
}

async function _updateStatusBarRemote(icon = forcePushIcon) {
    const remote = await _getOriginRemote();
    if (remote) {
        statusBarPush.text = `${icon} Force Push`;
        statusBarPush.tooltip = `Push to: "${remote}"`
        statusBarPush.show();
    } else {
        statusBarPush.hide();
    }
}

async function _getCurrentCommit() {
    try {
        const api = await _getGitApi();
    
        const repo = api.getRepository(vscode.window.activeTextEditor.document.fileName);
        if (!repo) return;

        if (repo.state.HEAD.commit) {
            console.debug(`Current commit is: ${repo.state.HEAD.commit}`)
            return repo.state.HEAD.commit;
        }

        return "";
    } catch (error) {
        console.debug(error);
    }
}

async function _getOriginRemote() {
    try {
        const api = await _getGitApi();
    
        const repo = api.getRepository(vscode.window.activeTextEditor.document.fileName);
        if (!repo) return;

        if (repo.repository.remotes.length && repo.repository.remotes[0].name) {
            console.debug(`0th remote is: ${repo.repository.remotes[0].name}`)
            return repo.repository.remotes[0].name;
        }

        return "";
    } catch (error) {
        console.debug(error);
    }
}

async function _getGitApi() {
    const extension = vscode.extensions.getExtension('vscode.git');
        let gitExtension = null;
        if (extension !== undefined) {
            gitExtension = extension.isActive ? extension.exports : await extension.activate();	
        }

        if (!gitExtension) return;
    
    let api = gitExtension.getAPI(gitApiVersion);
    return api;
}

// This method is called when your extension is deactivated
function deactivate() {
    console.debug('Closing GitRush...');
}

module.exports = {
    activate,
    deactivate
}
