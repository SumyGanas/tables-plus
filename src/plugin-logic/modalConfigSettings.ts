import { Editor, parseYaml, stringifyYaml } from 'obsidian'

export interface TableConfig {
    tableId: string,
    columns: Record<string, string[]>[]
}

export class Table {
    tableId: string
    editor: Editor
    constructor(editor: Editor) {
        this.editor = editor;
    }
  
    public getTableConf(): TableConfig {
        const [configStartLine, configEndLine] = this.getStartAndEndLines()

        const configContent = this.editor.getRange(
                { line: configStartLine+1, ch: 0 },
                { line: configEndLine, ch: 0 }
            );
            
        const config: TableConfig = parseYaml(configContent)
        return config
  }

    public async getTableEnumOptions(columnName: string): Promise<string[]> {
        const config = this.getTableConf()
        let vals: string[] = []
        if(config.columns){
            const columnRecords = config.columns;
            for (const [_, value] of Object.entries(columnRecords)) {
            if (Object.entries(value)[0][0] === columnName) {
                vals = value[columnName]
                break
                }
            }
        }
        if (vals != undefined) return Promise.resolve(vals)
        else return Promise.resolve([])
    }

    public async saveSelectOptions(newOptions: string[], columnName: string): Promise<{configBlock: string}>  {
        const newConfig = this.setTableConfig(columnName, newOptions)
        const newConfigContent = stringifyYaml(newConfig)
        const newConfigString = `columns:\n${newConfigContent}`;
        const [startLine,endLine] = this.getStartAndEndLines()
        {
            this.editor.replaceRange(
                newConfigString,
                { line: startLine+2, ch: 0 },
                {line: endLine,ch: 0}
            );
        }
        return Promise.resolve({configBlock: newConfigString})
    }

    public async newConfigBlock(tableStartLine: number): Promise<{configBlock: string}>  {
        const tableId = crypto.randomUUID()
        const s = stringifyYaml({ tableId:`${tableId}`, columns: ``})
        const newConfigBlock = `\`\`\`table-config\n`+s+`\`\`\`\n\n`

        {
            this.editor.replaceRange(
                newConfigBlock,
                { line: tableStartLine, ch: 0 }
            );
        }
        return Promise.resolve({configBlock: newConfigBlock})
    }

  //returns a column updated with the given new options
    setTableConfig(columnName: string, newOptions: string[]): Record<string, string[]>[]  {
        const oldConfig = this.getTableConf()
        let newColumns: TableConfig["columns"]
        if (!oldConfig.columns) {
            newColumns = [{ [columnName]: newOptions }];
           
        } else {
            newColumns = [...oldConfig.columns];
        }
        const existing = newColumns.find(c => Object.keys(c)[0] === columnName);
        if (existing) {
        existing[columnName] = newOptions;
        } else {
        newColumns.push({ [columnName]: newOptions });
        }
        return newColumns
    }

    getStartAndEndLines(): [number, number] {
        const line = this.editor.getCursor().line
        const lineAbove = line - 1
        
        let configEndLine = Math.max(lineAbove-1,0) 
        if (this.editor.getLine(configEndLine).trim() !== "```") {
            for (let i = configEndLine; i >= 0; i--) {
                if (this.editor.getLine(i).trim() === "```") {
                    configEndLine = i
                    break
                }
            }
        }
        let configStartLine = Math.max(configEndLine-1,0) ;
            for (let i = configStartLine; i >= 0; i--) {
                if (this.editor.getLine(i).trim() === "```table-config") {
                    configStartLine = i;
                    break;
                } else if (this.editor.getLine(i).charAt(0) === `|` && this.editor.getLine(i).at(-1) === `|`) {
                    break
                }
            }
         return [configStartLine,configEndLine]
    }
       
}
