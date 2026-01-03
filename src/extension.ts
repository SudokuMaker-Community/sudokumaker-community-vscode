// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import express from 'express';
import { createProxyMiddleware, RequestHandler, responseInterceptor } from 'http-proxy-middleware';
import { randomUUID } from 'node:crypto';
import * as fs from 'fs';
import path from 'node:path';
import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';

interface ServerContext {
	server: Server<typeof IncomingMessage, typeof ServerResponse>
	address: AddressInfo
	disposable: { dispose(): any; }
	setTargetUrl(url: string): void
}

function getSudokuMakerUrl() {
	return vscode.workspace.getConfiguration("sudokumaker-community-vscode")
		.get<string>("sudokuMakerURL")!;
}

function startServer(context: vscode.ExtensionContext): Promise<ServerContext> {
	return new Promise((resolve, reject) => {
		const app = express();

		const scriptPath = context.asAbsolutePath(path.join("inject", "script.js"));

		let middleware: RequestHandler<IncomingMessage, ServerResponse<IncomingMessage>, (err?: any) => void>;
		setTargetUrl(getSudokuMakerUrl());

		function setTargetUrl(url: string) {
			middleware = createProxyMiddleware({
				target: url,
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
			});
		}


		app.use('/', (req, res, next) => {
			return middleware(req, res, next);
		});

		const server = app.listen(0, (e) => {
			if (e === undefined) {

				const address = server.address();
				console.log("Address", address);
				if (!(typeof address === "object") || address === null) {
					reject(new Error(`Error: Invalid Address (${address})`));
				} else {
					console.log(`Proxy server running on http://${address.address}:${address.port}`);
					resolve({
						server,
						address,
						disposable: {
							dispose: () => server.close()
						},
						setTargetUrl
					});
				}
			} else {
				console.log("Error starting local WebServer:", e);
				reject(e);
			}
		});
	});
}

let cacheId = randomUUID();

function generateNewCacheId() {
	cacheId = randomUUID();
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	const serverContext = await startServer(context);
	context.subscriptions.push(serverContext.disposable);

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
		vscode.commands.registerCommand(
			"sudokumaker-community-vscode.invalidateEditorCache",
			() => generateNewCacheId()
		)
	);

	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			"sudokumaker-community-vscode.editor",
			new SudokuMakerEditorProvider(context, serverContext.address),
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);

	vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration("sudokumaker-community-vscode.sudokuMakerURL")) {
			serverContext.setTargetUrl(getSudokuMakerUrl());
			generateNewCacheId();
		}
	});
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
	constructor(private readonly context: vscode.ExtensionContext, private readonly address: AddressInfo) { }

	resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Thenable<void> | void {
		webviewPanel.webview.options = {
			enableScripts: true,
		};

		webviewPanel.webview.html = getWebviewContent(this.context, this.address);
	}
}

function getWebviewContent(context: vscode.ExtensionContext, address: AddressInfo) {
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
            <iframe src="http://${cacheId}.localhost:${address.port}"
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
