import * as vscode from 'vscode';

import { NAMES } from "./constants";

export function getSudokuMakerUrl() {
    return (
        vscode.workspace.getConfiguration(NAMES.namespace)
            .get<string>(NAMES.config.sudokuMakerURL.name)
        ?? NAMES.config.sudokuMakerURL.default
    );
}