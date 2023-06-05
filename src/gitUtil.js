const vscode = require('vscode');
const gitApiVersion = 1;

async function getOriginRemote() {
    try {
        const api = await getGitApi();
    
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

async function getCurrentCommit() {
    try {
        const api = await getGitApi();
    
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

async function getGitApi() {
    const extension = vscode.extensions.getExtension('vscode.git');
        let gitExtension = null;
        if (extension !== undefined) {
            gitExtension = extension.isActive ? extension.exports : await extension.activate();	
        }

        if (!gitExtension) return;
    
    let api = gitExtension.getAPI(gitApiVersion);
    return api;
}

module.exports = {
    getOriginRemote,
    getCurrentCommit,
    getGitApi,
}
