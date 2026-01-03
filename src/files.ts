import * as vscode from 'vscode';

import * as fs from 'fs';
import path from 'node:path';

export function loadScript(context: vscode.ExtensionContext, file: string): string {

    const scriptPath = context.asAbsolutePath(path.join("scripts", file));
    const scriptFile = fs.readFileSync(scriptPath);

    return scriptFile.toString();
}