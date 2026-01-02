// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import express from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { randomUUID } from 'node:crypto';
import * as fs from 'fs';
import path from 'node:path';

function startServer(context: vscode.ExtensionContext) {
	const app = express();

	const TARGET_URL = "https://sudokumaker.app";
	const scriptPath = context.asAbsolutePath(path.join("inject", "script.js"));

	app.use('/', createProxyMiddleware({
		target: TARGET_URL,
		changeOrigin: true,
		selfHandleResponse: true,
		on: {
			proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
				// TODO: Add cache headers (no caching)
				if (res.getHeader("Content-Type")?.toString().includes("text/html")) {
					const scriptFile = fs.readFileSync(scriptPath);
					const script = `
							<script>
								${scriptFile}
							</script>
						`;
					const headTag = "<head>";
					const replacement = `${headTag}${script.trim()}`;
					return (
						responseBuffer
							.toString()
							.replace(headTag, replacement)
					);
				} else {
					return responseBuffer;
				}
			})
		}
	}));

	app.listen(3003, () => {
		console.log('Proxy server running on http://localhost:3000');
	});
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	startServer(context);
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sudokumaker-community-vscode" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"sudokumaker-community-vscode.openSourceToSide",
			(uri) => openCurrentDocumentToTheSide(
				uri,
				"vscode.textEditor"
			)
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"sudokumaker-community-vscode.openEditorToSide",
			(uri) => openCurrentDocumentToTheSide(
				uri,
				"sudokumaker-community-vscode.editor"
			)
		)
	);

	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			"sudokumaker-community-vscode.editor",
			new SudokuMakerEditorProvider(context),
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);
}

async function openCurrentDocumentToTheSide(uri: vscode.Uri | undefined, viewType: string) {
	let usedUri = uri;
	if (!usedUri) {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		usedUri = editor.document.uri;
	}

	await vscode.commands.executeCommand(
		"vscode.openWith",
		usedUri,
		viewType,
		vscode.ViewColumn.Beside
	);
}


class SudokuMakerEditorProvider implements vscode.CustomTextEditorProvider {
	constructor(private readonly context: vscode.ExtensionContext) { }

	resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Thenable<void> | void {
		webviewPanel.webview.options = {
			enableScripts: true,
		};

		webviewPanel.webview.html = getWebviewContent(this.context);
	}
}

function getWebviewContent(context: vscode.ExtensionContext) {
	const scriptPath = context.asAbsolutePath(path.join("inject", "page.js"));
	const scriptFile = fs.readFileSync(scriptPath);
	return `
        <!DOCTYPE html>
        <html lang="en">
		<head>
			<script>
				${scriptFile}
			</script>
		</head>
        <body style="margin:0; padding:0; height:100vh; overflow:hidden;">
            <iframe src="http://${randomUUID()}.localhost:3003"
				allow="clipboard-read; clipboard-write"
				sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock allow-presentation"
                    style="width:100%; height:100%; border:none;">
            </iframe>
        </body>
        </html>
    `;
}

// This method is called when your extension is deactivated
export function deactivate() { }
