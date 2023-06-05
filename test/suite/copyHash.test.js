const assert = require('assert');
const vscode = require('vscode');

suite('copyHash test suite', () => {
	vscode.window.showInformationMessage('Start copyHash tests.');

	test('Registers the copy command', () => {
		vscode.commands.getCommands().then((value) => {
			const filtered = value.filter((item) => {
				item === 'gitrush.copyCommit';
			});

			assert.strictEqual(1, filtered.length)
		});
	});
});
