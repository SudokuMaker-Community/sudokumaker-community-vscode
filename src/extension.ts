import * as vscode from 'vscode';

import * as cache from './cache';
import { NAMES, withNS } from './constants';
import * as server from './server';
import * as editor from './editor';
import * as config from './config';
import * as view from './view';

export async function activate(context: vscode.ExtensionContext) {

	const serverContext = await startServer(context);

	registerCommands(context);
	registerCustomEditors(context, serverContext);
	registerConfigurationListeners(context, serverContext);
}

async function startServer(context: vscode.ExtensionContext): Promise<server.ServerContext> {

	const serverContext = await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: "SudokuMaker Proxy Server",
			cancellable: false,
		},
		async (progress, token) => {
			progress.report({ message: "Initializing local server..." });

			const ctx = await server.startServer(context);

			progress.report({ message: "Server started!" });
			return ctx;
		}
	);

	context.subscriptions.push(serverContext.disposable);
	return serverContext;
}

function registerCommands(context: vscode.ExtensionContext) {

	context.subscriptions.push(

		vscode.commands.registerCommand(
			withNS(NAMES.commands.openSourceToSide),
			(uri) => view.openCurrentDocumentToTheSide(
				uri,
				"vscode.textEditor"
			)
		),
		vscode.commands.registerCommand(
			withNS(NAMES.commands.openEditorToSide),
			(uri) => view.openCurrentDocumentToTheSide(
				uri,
				"sudokumaker-community-vscode.editor"
			)
		),
		vscode.commands.registerCommand(
			withNS(NAMES.commands.invalidateEditorCache),
			() => {
				cache.generateNewCacheId();

				vscode.window.showInformationMessage(
					"Editor Cache successfully invalidated!"
				);
			}
		)
	);
}

function registerCustomEditors(context: vscode.ExtensionContext, serverContext: server.ServerContext) {

	context.subscriptions.push(

		vscode.window.registerCustomEditorProvider(
			withNS(NAMES.customEditors.editor),
			new editor.SudokuMakerEditorProvider(context, serverContext.address),
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);
}

function registerConfigurationListeners(context: vscode.ExtensionContext, serverContext: server.ServerContext) {

	vscode.workspace.onDidChangeConfiguration(e => {

		if (e.affectsConfiguration(withNS(NAMES.config.sudokuMakerURL.name))) {

			serverContext.setTargetUrl(config.getSudokuMakerUrl());
			cache.generateNewCacheId();
		}
	});
}



export function deactivate() {

}
