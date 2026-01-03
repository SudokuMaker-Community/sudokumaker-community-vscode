import * as vscode from 'vscode';

export async function openCurrentDocumentToTheSide(uri: vscode.Uri | undefined, viewType: string) {
    let currentUri = uri;
    if (!currentUri) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        currentUri = editor.document.uri;
    }

    await vscode.commands.executeCommand(
        "vscode.openWith",
        currentUri,
        viewType,
        vscode.ViewColumn.Beside
    );
}