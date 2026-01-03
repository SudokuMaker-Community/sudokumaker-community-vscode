export const NAMES = {
    namespace: "sudokumaker-community-vscode",
    commands: {
        openSourceToSide: "openSourceToSide",
        openEditorToSide: "openEditorToSide",
        invalidateEditorCache: "invalidateEditorCache",
    },
    customEditors: {
        editor: "editor",
    },
    config: {
        sudokuMakerURL: {
            name: "sudokuMakerURL",
            default: "https://sudokumaker.app",
        }
    }
} as const;

export function withNS<K extends string>(key: K): `${typeof NAMES.namespace}.${K}` {
    return `${NAMES.namespace}.${key}`;
}