import * as vscode from 'vscode';

import path from 'node:path';
import { AddressInfo } from 'node:net';

import * as cache from "./cache";
import * as files from './files';
import { SCRIPTS } from './constants';

export class SudokuMakerEditorProvider implements vscode.CustomTextEditorProvider {
    constructor(private readonly context: vscode.ExtensionContext, private readonly address: AddressInfo) { }

    resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Thenable<void> | void {
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        webviewPanel.webview.html = getWebviewContent(this.context, this.address);
        webviewPanel.webview.onDidReceiveMessage((e) => {
            console.log("Event received:", e);
        });
        webviewPanel.webview.postMessage({
            type: "load",
            data: {
                json: `{"formatVersion":"1.5.0","puzzle":{"name":"Test2","author":"Wiggel","cells":[{},{"given":true,"value":2},{"given":true,"value":4},{"given":true,"value":3},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}],"constraints":[{"type":0},{"type":1,"regions":[0,0,0,1,1,1,2,2,2,0,0,0,1,1,1,2,2,2,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,3,3,3,4,4,4,5,5,5,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,6,6,6,7,7,7,8,8,8,6,6,6,7,7,7,8,8,8]}]}}`
            }
        });
    }
}

function getWebviewContent(context: vscode.ExtensionContext, address: AddressInfo) {
    const scriptPath = context.asAbsolutePath(path.join("scripts", "webview", "page.js"));
    const scriptFile = files.loadScript(context, SCRIPTS.webview.page);

    return `
        <!DOCTYPE html>
        <html lang="en">
		<head>
			<script>
				${scriptFile}
			</script>
		</head>
        <body style="margin:0; padding:0; height:100vh; overflow:hidden;">
            <iframe id="sudokumaker-frame" src="http://${cache.getCacheId()}.localhost:${address.port}"
				allow="clipboard-read; clipboard-write"
				sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock allow-presentation"
                    style="width:100%; height:100%; border:none;">
            </iframe>
        </body>
        </html>
    `;
}