import { Editor, parseYaml, stringifyYaml } from 'obsidian'
import { EditorView } from '@codemirror/view';
import { setTableIdEffect } from '../state-effects/enumEffects';

interface ColumnConfig {
    columnName: string;
    type: string;
    options: string[];
  }
    interface TableConfig {
    tableId: string | null;
    columns: Record<string, ColumnConfig>;
}

export async function saveSelectOptions(editor: Editor, tableStartLine: number, tableID: string, newOptions: string[], columnName: string): Promise<{ configBlock: string; }> {
    const lineAbove = tableStartLine - 1;
    let newTableConfig: TableConfig = {
        tableId: tableID,
        columns: {}
      };
    let configStartLine: number | null = null;
    let configEndLine = Math.max(0,lineAbove - 1)

    if (lineAbove >= 0 && editor.getLine(configEndLine).trim() === "```") { //old config exists
        configStartLine = lineAbove - 1;
        for (let i = configEndLine; i >= 0; i--) {
            if (editor.getLine(i).trim() === "```table-config") {
                configStartLine = i;
                break;
            }
        }
        if (configEndLine != null && configStartLine != null) {
            const configContent = editor.getRange(
                { line: configStartLine+1, ch: 0 },
                { line: configEndLine, ch: 0 }
            );
            newTableConfig = parseYaml(configContent)
        }

    }
    let updatedConfig: any 
    if (newOptions.length > 0)  {
        updatedConfig = setTableConfig(newTableConfig ,['columns', columnName],{ 
        type: 'select', 
        options: newOptions 
    })
    }  else {
        updatedConfig = setTableConfig(newTableConfig)
}
    
    const newConfigContent = stringifyYaml(updatedConfig);
    const newConfigBlock = `\`\`\`table-config\n${newConfigContent}\`\`\`\n\n`;

    if (configEndLine != null && configStartLine != null) {{
        editor.replaceRange(
            newConfigBlock,
            { line: Math.max((configStartLine - 1),0), ch: 0 }, 
            { line: tableStartLine, ch: 0 }
        );}
    } else {
        editor.replaceRange(
            newConfigBlock,
            { line: tableStartLine, ch: 0 }
        );
    }
    return {configBlock: newConfigBlock}
}

  function setTableConfig(obj: any, path?: string[], value?: any) {
    const newObj = { ...obj };
    let currentLevel = newObj;
    if (!path || path.length === 0) {
        return newObj;
      }
  
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      currentLevel[key] = { ...currentLevel[key] };
      currentLevel = currentLevel[key];
    }
  
    currentLevel[path[path.length - 1]] = value;
    return newObj;
  }

function getTableConfig(editor: Editor): TableConfig {
    const line = editor.getCursor().line
    let configEndLine = 0
    for (let li = line; li >= 0; li--) {
        if (editor.getLine(li).trim() === "```") {
            configEndLine = li;
            break;
        }
    }
    const lineAbove = line - 1;
    let config: TableConfig = {
        tableId: null,
        columns: {},
      };
    
    let configStartLine: number | null = null;

    if (lineAbove >= 0 && editor.getLine(configEndLine).trim() === "```") {
        configStartLine = lineAbove + 1;
        for (let i = configStartLine; i >= 0; i--) {
            if (editor.getLine(i).trim() === "```table-config") {
                configStartLine = i;
                break;
            } 
        }
        const configContent = editor.getRange(
            { line: configStartLine+1, ch: 0 },
            { line: configEndLine, ch: 0 }
        );
        config = parseYaml(configContent)
    }   
    return config
}

export async function getTableEnumOptions(editor: Editor, columnName: string): Promise<string[]> {
    const config = getTableConfig(editor)
    const options = config.columns[columnName]?.options ?? [];
    return options
}

//returns table id or creates and returns a new one if it doesn't exist
export async function getTableId(editor: Editor): Promise<string> {
    const line = editor.getCursor().line
    const tableConfig = getTableConfig(editor)

    const cfg = tableConfig.tableId
    // @ts-expect-error, not typed
    const editorView = editor.cm as EditorView;
    
    if (cfg === null) {
        const id = crypto.randomUUID()
        saveSelectOptions(editor, line, id, [],"")
        editorView.dispatch({
            effects:setTableIdEffect.of(id)
        })
        return id
    }
    editorView.dispatch({
        effects:setTableIdEffect.of(cfg)
    })
    return cfg
}
