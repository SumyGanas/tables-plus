import { Editor, parseYaml, stringifyYaml } from 'obsidian'

export async function saveSelectOptions(editor: Editor, tableStartLine: number, columnName: string, newOptions: string[]) {
    const lineAbove = tableStartLine - 1;
    let config = {};
    let configStartLine: number | null = null;
    let configEndLine: number | null = null;

    if (lineAbove >= 0 && editor.getLine(lineAbove).trim() === "```table-config") {
        configStartLine = lineAbove + 1;
        for (let i = configStartLine; i < tableStartLine; i++) {
            if (editor.getLine(i).trim() === "```") {
                configEndLine = i;
                break;
            }
        }

        if (configEndLine) {
            const configContent = editor.getRange(
                { line: configStartLine, ch: 0 },
                { line: configEndLine, ch: 0 }
            );
            config = parseYaml(configContent) || {};
        }
    }
    const updatedConfig = setTableConfig(config, ['columns', columnName], {
        type: 'select',
        options: newOptions
    });

    const newConfigContent = stringifyYaml(updatedConfig);
    const newConfigBlock = `\`\`\`table-config\n${newConfigContent}\`\`\`\n\n`;

    if (configStartLine && configEndLine) {
        editor.replaceRange(
            newConfigBlock,
            { line: configStartLine - 1, ch: 0 }, 
            { line: tableStartLine, ch: 0 }
        );
    } else {
        editor.replaceRange(
            newConfigBlock,
            { line: tableStartLine, ch: 0 }
        );
    }
}


function setTableConfig(obj: any, path: string[], value: any) {
    let schema = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const p = path[i];
        if (!schema[p]) schema[p] = {};
        schema = schema[p];
    }
    schema[path[path.length - 1]] = value;
    return obj;
}




