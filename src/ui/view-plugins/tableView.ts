import { EditorView, ViewPlugin, ViewUpdate, PluginValue } from "@codemirror/view";
import { ChangeSpec } from "@codemirror/state"
import { setEnumEffect, setIndexEffect } from "@/src/state-effects/TypeEffects";
import { enumTable, indexTable, moneyFormat } from "@/src/plugin-logic/tableLogic";
import { addCurrencies, currencySet } from "./currencyState";
import { upsertTableConfigEffect } from "@/src/state-effects/enumEffects";
import { parseYaml } from "obsidian";


class TableViewPlugin implements PluginValue {
    view: EditorView;
    constructor(view: EditorView) {
        this.view = view
    }

    private getTablePosition(table: HTMLElement): number | null {
        try {
            const pos = this.view.posAtDOM(table as Node);
            if (pos === null) return null;
            const line = this.view.state.doc.lineAt(pos);
            return line.number;
        } catch {
            return null;
        }
    }

    private scanAndDispatchConfigs() {
        const tables = this.view.dom.querySelectorAll('table');
        tables.forEach((table) => {
            const position = this.getTablePosition(table);
            if (position === null) return;
            let configStartLine = -1;
            let configEndLine = -1;

            for (let i = position - 1; i >= 1; i--) {
                const line = this.view.state.doc.line(i);
                const lineText = line.text.trim();

                if (lineText === '```') {
                    configEndLine = i;
                    break;
                }
                if (lineText.startsWith('|')) {
                    break;
                }
            }

            if (configEndLine === -1) return;

            for (let i = configEndLine - 1; i >= 1; i--) {
                const line = this.view.state.doc.line(i);
                const lineText = line.text.trim();

                if (lineText === '```tables-plus-config') {
                    configStartLine = i;
                    break;
                }
                if (lineText.startsWith('|') || lineText.startsWith('#')) {
                    break;
                }
                if (configEndLine - i > 20) break;
            }

            if (configStartLine !== -1) {
                const configContent = this.view.state.doc.sliceString(
                    this.view.state.doc.line(configStartLine + 1).from,
                    this.view.state.doc.line(configEndLine).from
                );

                try {
                    const config = parseYaml(configContent);
                    if (config && config.columns) {
                        this.view.dispatch({
                            effects: upsertTableConfigEffect.of({
                                position: position,
                                columnName: '',
                                tableConfig: {
                                    columns: config.columns || []
                                }
                            })
                        });
                    }
                } catch (e) {
                    console.error('Failed to parse config at position', position, e);
                }
            }
        });
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            window.setTimeout(() => {
                this.scanAndDispatchConfigs();
            }, 10);
        }

        this.view.requestMeasure({
            read: () => {
                return this.view.dom.querySelectorAll('[modified-header]');
            },
            write: (tables: NodeListOf<HTMLTableElement>) => {
                if (tables.length) {
                  tables.forEach((table)=>{
                            setTimeout(() => {
                                if (table) {
                                  let changes: ChangeSpec[] | undefined = undefined
                                  const rows = table?.rows?.length - 1
                                  const indexElem = this.view.dom.querySelector('[cell-index]');
                                  const cellIndex = (indexElem?.getAttribute("cell-index") as unknown) as number
                                  const attributeKey = table.getAttribute("modified-header");
                                  const position = this.getTablePosition(table);

                                  if (attributeKey === "Index") {
                                      changes = indexTable(this.view, table, cellIndex);
                                      if (changes) {
                                        this.view.dispatch({
                                        changes: changes,
                                        effects: setIndexEffect.of({[position ?? 'default']: rows })
                                      });
                                  }
                                } else if (attributeKey?.contains("Money")) {
                                    addCurrencies(this.view, currencySet)
                                    const currencyCode = attributeKey.toString().charAt(6)
                                    changes = moneyFormat(this.view, table, cellIndex, currencyCode);
                                    if (changes) {
                                      this.view.dispatch({
                                      changes: changes,
                                      effects: setIndexEffect.of({[position ?? 'default']: rows })
                                    });
                                    }
                                } else if (attributeKey === "Enum") {
                                    changes = enumTable(this.view, table, cellIndex)
                                    if (changes) {
                                      this.view.dispatch({
                                      changes: changes,
                                      effects: [setEnumEffect.of({[position ?? 'default']: rows })]
                                    });
                                    }
                                }
                                    indexElem?.removeAttribute("cell-index")
                                    table.removeAttribute("modified-header")
                                  }

                                }, 0);

                            });
                          }
                        }
          });


    }

  }

  export const tableViewPlugin = ViewPlugin.fromClass(TableViewPlugin);
