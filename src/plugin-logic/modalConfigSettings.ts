import { Editor, parseYaml, stringifyYaml } from 'obsidian'
//import { stringify } from 'yaml'
// import { EditorView } from '@codemirror/view';
// import { setTableIdEffect } from '../state-effects/enumEffects';


//type Column = Record<string, string[]> //column name : options

//type TableConfig = Record<string,Column[]> // table id : columns
export interface TableConfig {
    tableId: string,
    columns: Record<string, string[]>[] //columnName, options
} //object is needed so the parseyaml function works

export class Table {
    tableId: string
    editor: Editor
    constructor(editor: Editor) {
        this.editor = editor;
    }
  
  //gets existing or empty -> so it can be passed to set 
    public getTableConf(): TableConfig {
        const [configStartLine, configEndLine] = this.getStartAndEndLines(this.editor)

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
        const columnRecords = config.columns;
        if(config.columns){
            for (const [key, value] of Object.entries(columnRecords)) {
            if (key === columnName) {
                vals = value.options
                break
                }
        }}
        
        
        if (vals != undefined) return vals
        else return []
    }

    public async saveSelectOptions(newOptions: string[], columnName: string): Promise<{configBlock: string}>  {
        const newConfig = this.setTableConfig(columnName, newOptions)
        const newConfigContent = stringifyYaml(newConfig)
        const newConfigString = `columns:\n${newConfigContent}`;
        const [startLine,endLine] = this.getStartAndEndLines(this.editor)
        {
            this.editor.replaceRange(
                newConfigString,
                { line: startLine+2, ch: 0 },
                {line: endLine,ch: 0}
            );
        }
        return {configBlock: newConfigString}
    }

    public async newConfigBlock(tableStartLine: number): Promise<{configBlock: string}>  {
        const tableId = crypto.randomUUID()
        //const newConfigBlock = `\`\`\`table-config\ntableId: ${tableId}\n\n\`\`\`\n\n`;
        const s = stringifyYaml({ tableId:`${tableId}`, columns: ``})
        const newConfigBlock = `\`\`\`table-config\n`+s+`\`\`\`\n\n`

        {
            this.editor.replaceRange(
                newConfigBlock,
                { line: tableStartLine, ch: 0 }
            );
        }
        return {configBlock: newConfigBlock}
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

    getStartAndEndLines(editor: Editor): [number, number] {
        const line = editor.getCursor().line
        const lineAbove = line - 1
        
        const configEndLine = Math.max(lineAbove-1,0) 

        let configStartLine = Math.max(configEndLine-1,0) ;
            for (let i = configStartLine; i >= 0; i--) {
                if (editor.getLine(i).trim() === "```table-config") {
                    configStartLine = i;
                    break;
                } else if (editor.getLine(i).charAt(0) === `|` && editor.getLine(i).at(-1) === `|`) {
                    break
                }
            }
         return [configStartLine,configEndLine]
    }
       
}
