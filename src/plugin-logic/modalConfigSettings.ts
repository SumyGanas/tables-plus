import { Editor, Notice, parseYaml, stringifyYaml } from 'obsidian'

export interface TableConfig {
    columns: Record<string, string[]>[]
}

export class Table {
    editor: Editor
    config: TableConfig
    tableElement: HTMLElement | null = null
    tableLine: number | null = null
    
    constructor(editor: Editor, tableElement?: HTMLElement | null) {
        this.editor = editor;
        if (tableElement) {
            this.tableElement = tableElement;
            this.tableLine = this.getTableLineNumber(tableElement);
        }
    }

    /**
     * Get the line number where the table starts
     */
    private getTableLineNumber(tableElement: HTMLElement): number | null {
        try {
            const view = (this.editor as unknown as { cm: { posAtDOM: (el: HTMLElement) => number | null; state: { doc: { lineAt: (pos: number) => { number: number } } } } }).cm;
            if (!view) return null;
            
            const pos = view.posAtDOM(tableElement);
            if (pos === null) return null;
            
            const line = view.state.doc.lineAt(pos);
            return line.number;
        } catch {
            return null;
        }
    }
  
    /**
     * Find the cell index for a column by its header name
     */
    public findColumnIndexByHeader(headerName: string): number {
        if (!this.tableElement) return -1;
        
        const headerRow = this.tableElement.querySelector('thead tr') || this.tableElement.querySelector('tr');
        if (!headerRow) return -1;
        
        const headers = headerRow.querySelectorAll('th');
        for (let i = 0; i < headers.length; i++) {
            const headerEl = headers[i] as HTMLElement;
            if (headerEl.innerText?.trim() === headerName) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Count cells with data in a column
     */
    public countColumnData(columnIndex: number): number {
        if (!this.tableElement || columnIndex < 0) return 0;
        
        const rows = this.tableElement.querySelectorAll('tr');
        let count = 0;
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells[columnIndex]) {
                const text = cells[columnIndex].textContent?.trim();
                if (text && text.length > 0) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Get the table's position (line number) for config matching
     */
    public getTablePosition(): number | null {
        if (this.tableLine !== null) {
            return this.tableLine;
        }
        if (this.tableElement) {
            this.tableLine = this.getTableLineNumber(this.tableElement);
            return this.tableLine;
        }
        return null;
    }
  
    /**
     * Get config block lines based on table position
     * @returns A tuple of [configStartLine, configEndLine] if found, or null if no config block is found for this table
     */
    public getConfigLinesForTable(): [number, number] | null {
        const tableLine = this.getTablePosition();
        if (tableLine === null) return null;
        let configEndLine = -1;
        for (let i = tableLine - 2; i >= 0; i--) {
            const lineText = this.editor.getLine(i).trim();
            if (lineText === '```') {
                configEndLine = i + 1; 
                break;
            }
            if (lineText.startsWith('|')) {
                return null;
            }
        }
        
        if (configEndLine === -1) return null;
        
        let configStartLine = -1;
        for (let i = configEndLine - 2; i >= 0; i--) {
            const lineText = this.editor.getLine(i).trim();
            if (lineText === '```tables-plus-config') {
                configStartLine = i + 1; 
                break;
            }
            if (lineText.startsWith('|') || lineText.startsWith('#')) {
                return null;
            }
            if ((configEndLine - 1) - i > 20) {
                return null;
            }
        }
        
        if (configStartLine === -1) return null;
        
        return [configStartLine, configEndLine];
    }
    
    /**
     * Get the table config by reading the config block above the table, if it exists. 
     * If no config block is found, returns an empty config object.
     * @returns An empty TableConfig object and its position, or null 
     */
    public async getTableConfig(): Promise<{TableConfig: TableConfig | null; position: number | null}> {
        const lines = this.getConfigLinesForTable()
        let config: TableConfig = {columns: []}
        const position = this.getTablePosition();
        
        if (!lines) {
            return Promise.resolve({TableConfig: config, position})
        } else {
           const [configStartLine, configEndLine] = lines;
           const startLine0 = configStartLine - 1;  
           const endLine0 = configEndLine - 1;      
           const configContent = this.editor.getRange(
                { line: startLine0 + 1, ch: 0 },     
                { line: endLine0, ch: 0 }           
            );
            try {
                config = parseYaml(configContent)
            } catch (_e) {
                return Promise.resolve({TableConfig: null, position: null})
            }
        }  
        return Promise.resolve({TableConfig: config, position})
    }

    /**
     * Get enum options for a specific column from the table config
     * @param columnName The name of the column to get options for
     * @returns An array of enum options, or an empty array if none found
     */
    public async getTableEnumOptions(columnName: string): Promise<string[]> {
        try {
            const res = await this.getTableConfig();
            if (!res || !res.TableConfig || !res.TableConfig.columns) {
                return [];
            }
            const columnRecords = res.TableConfig.columns;
            for (const record of columnRecords) {
                const entries = Object.entries(record);
                if (entries.length > 0) {
                    const [key, values] = entries[0];
                    if (key === columnName && Array.isArray(values)) {
                        return values;
                    }
                }
            }
            return [];
        } catch (error) {
            console.error("Error fetching enum options:", error);
            return [];
        }
    }

    /** Update the table config with new enum options for a specific column, creating the config block if it doesn't exist, and return the new config block content
     * @param columnName The column to update
     * @param newOptions The new enum options for this column
     * @returns The updated config block content as a promise
     */
    public async saveSelectOptions(newOptions: string[], columnName: string): Promise<{configBlock: string}>  {
        const newConfig = await this.setTableConfig(columnName, newOptions)
        const configObj = { columns: newConfig };
        const newConfigContent = stringifyYaml(configObj)
        const lines = this.getConfigLinesForTable()
        if (!lines) {
            await this.createConfigBlock(newConfig, columnName);
        } else {
            const [startLine,endLine] = lines
            this.editor.replaceRange(
                    newConfigContent,
                    { line: startLine, ch: 0 },   
                    { line: endLine-1, ch: 0 } 
                );
        }
        return Promise.resolve({configBlock: newConfigContent})
    }

    private async createConfigBlock(newConfig: Record<string, string[]>[], _columnName: string): Promise<void> {
        const tableLine = this.getTablePosition();
        if (tableLine === null) {
            new Notice("Could not determine table position to create config block.");
            return;
        }
        
        const configObj = {
            columns: newConfig
        };
        const configYaml = stringifyYaml(configObj);
        const configBlock = `\`\`\`tables-plus-config\n${configYaml}\`\`\`\n\n`;
        
        this.editor.replaceRange(
            configBlock,
            { line: tableLine - 1, ch: 0 }
        );
        
        new Notice("Created new config block for this table.");
    }

    /** Update the table config with new enum options for a specific column, creating the columns array if it doesn't exist yet
     * @param columnName The column to update
     * @param newOptions The new enum options for this column
     * @returns The updated columns array for the table config
     */
    async setTableConfig(columnName: string, newOptions: string[]): Promise<Record<string, string[]>[]>  {
        const oldConfig = await this.getTableConfig()
        let newColumns: TableConfig["columns"]
        if (!oldConfig.TableConfig?.columns) {
            newColumns = [{ [columnName]: newOptions }];
           
        } else {
            newColumns = [...oldConfig.TableConfig.columns];
        }
        const existing = newColumns.find(c => Object.keys(c)[0] === columnName);
        if (existing) {
        existing[columnName] = newOptions;
        } else {
        newColumns.push({ [columnName]: newOptions });
        }
        return Promise.resolve(newColumns)
    }

    /**
     * Clear all cells in a specific column of the table
     * @param columnIndex The column index to clear
     * @returns The number of cells cleared
     */
    public clearColumnCells(columnIndex: number): number {
        const tableLine = this.getTablePosition();
        if (tableLine === null) return 0;
        
        let clearedCount = 0;
        let currentLine = tableLine + 1; 
        while (currentLine <= this.editor.lineCount()) {
            const lineText = this.editor.getLine(currentLine - 1);        
            if (!lineText.trim().startsWith('|')) {
                break; 
            }
            
            if (/^\|[-\s|]*\|$/.test(lineText.trim())) {
                currentLine++;
                continue;
            }
            
            const cellBoundaries = this.findCellInLine(lineText, columnIndex);
            if (cellBoundaries) {
                this.editor.replaceRange(
                    ' ',
                    { line: currentLine - 1, ch: cellBoundaries.start + 1 },
                    { line: currentLine - 1, ch: cellBoundaries.end }
                );
                clearedCount++;
            }
            
            currentLine++;
        }
        
        if (clearedCount > 0) {
            new Notice(`Cleared ${clearedCount} cell${clearedCount !== 1 ? 's' : ''}`);
        }
        
        return clearedCount;
    }
    
    /**
     * Find the start and end character positions of a cell in a table row
     * @param lineText The text of the line containing the table row
     * @param cellIndex The index of the cell to find
     * @returns An object with start and end character positions, or null if not found 
     */
    private findCellInLine(lineText: string, cellIndex: number): { start: number; end: number } | null {
        const parts = lineText.split('|');
        if (cellIndex + 1 >= parts.length) return null;
        
        let charPos = 0;
        for (let i = 0; i <= cellIndex; i++) {
            charPos += parts[i].length + 1;
        }
        
        const start = charPos;
        const end = charPos + parts[cellIndex + 1].length;
        
        return { start, end };
    }

    /**
     * Remove a column's enum config from the table config
     * @param columnName The column to remove
     * @returns true if config was removed, false if column wasn't found or no config exists
     */
    public async removeColumnConfig(columnName: string): Promise<boolean> {
        const config = await this.getTableConfig();
        if (!config.TableConfig?.columns || config.TableConfig.columns.length === 0) {
            return false;
        }
        
        const originalLength = config.TableConfig.columns.length;
        config.TableConfig.columns = config.TableConfig.columns.filter(
            col => Object.keys(col)[0] !== columnName
        );
        
        if (config.TableConfig.columns.length === originalLength) {
            return false;
        }
        
        const configObj = { 
            columns: config.TableConfig.columns 
        };
        const configYaml = stringifyYaml(configObj);        
        const lines = this.getConfigLinesForTable();
        if (lines) {
            const [startLine, endLine] = lines;
            const startLine0 = startLine - 1;
            const endLine0 = endLine - 1;
            
            const endLineText = this.editor.getLine(endLine0);
            const endCh = endLineText ? endLineText.length : 0;
            
            this.editor.replaceRange(
                `\`\`\`tables-plus-config\n${configYaml}\`\`\``,
                { line: startLine0, ch: 0 },
                { line: endLine0, ch: endCh }
            );
            new Notice(`Removed enum config for column '${columnName}'`);
            return true;
        }
        return false;
    }
}
