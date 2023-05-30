const vscode = require('vscode');
const normalIcon = "$(git-commit)";
const copiedIcon = "$(files)";
const iconTransitionMs = 1000;
let statusBarItem;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.debug('Starting GitRush...');

	const copyCommitCommandId = 'gitrush.copyCommit';
	let copyCommitCommand = vscode.commands.registerCommand(copyCommitCommandId, async () => {
		// Put hash into the clipboard
		var currentCommit = await _getCurrentCommit();
		vscode.env.clipboard.writeText(currentCommit);
		
		// Change the icon temporarily as feedback to user
		await _updateStatusBarItem(copiedIcon)
		let interval = setInterval(async() => {
			await _updateStatusBarItem(normalIcon);
			clearInterval(interval);
		}, iconTransitionMs);
	});

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = copyCommitCommandId;
	
	context.subscriptions.push(statusBarItem);
	context.subscriptions.push(copyCommitCommand);

	// Update when switching editors
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async () => await _updateStatusBarItem() ));

	// Update when git API is initialised
	const extension = vscode.extensions.getExtension('vscode.git');
		let gitExtension = null;
		if (extension !== undefined) {
			gitExtension = extension.isActive ? extension.exports : await extension.activate();	
		}
	const api = gitExtension.getAPI(1);
	context.subscriptions.push(api.onDidChangeState(async () => await _updateStatusBarItem() ));
}

async function _getCurrentCommit() {
	try {
		const extension = vscode.extensions.getExtension('vscode.git');
		let gitExtension = null;
		if (extension !== undefined) {
			gitExtension = extension.isActive ? extension.exports : await extension.activate();	
		}

		if (!gitExtension) return;
	
		let api = gitExtension.getAPI(1);
		if (!api) return;
	
		//const repo = api.repositories[0];
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

async function _updateStatusBarItem(icon = normalIcon) {
	const currentCommit = await _getCurrentCommit();
	if (currentCommit) {
		statusBarItem.text = `${icon} ${currentCommit.substring(0, 8)}`;
		statusBarItem.tooltip = `Copy: "${currentCommit}"`
		statusBarItem.show();
	} else {
		statusBarItem.hide();
	}
}

// This method is called when your extension is deactivated
function deactivate() {
	console.debug('Closing GitRush...');
}

module.exports = {
	activate,
	deactivate
}
