import * as vscode from 'vscode';

import * as fs from 'fs';
import path from 'node:path';
import * as YAML from 'yaml';

export function loadScript(context: vscode.ExtensionContext, file: string): string {

    const scriptPath = context.asAbsolutePath(path.join("scripts", file));
    const scriptFile = fs.readFileSync(scriptPath);

    return scriptFile.toString();
}

export type UUIDString = string;
export type UriString = string;

const uriMap: Map<UUIDString, UriString> = new Map();
const uuidMap: Map<UriString, UUIDString> = new Map();

export function getFileId(uri: vscode.Uri): UUIDString {
    const uriString = uri.toString();

    const storedUUID = uuidMap.get(uriString);
    if (storedUUID !== undefined) {
        return storedUUID;
    }

    let uuid = null;
    do {
        uuid = crypto.randomUUID();
    } while (uriMap.has(uuid));

    uriMap.set(uuid, uriString);
    uuidMap.set(uriString, uuid);

    return uuid;
}

export function loadJsonFromUUID(uuid: UUIDString): string | undefined {
    const uriString = uriMap.get(uuid);
    if (uriString === undefined) {
        return undefined;
    }
    const uri = vscode.Uri.parse(uriString);
    const content = fs.readFileSync(uri.fsPath).toString();

    let json = null;
    if (uriString.endsWith(".yaml")) {
        json = YAML.parse(content);
    } else {
        json = JSON.parse(content);
    }

    return JSON.stringify(json);
}