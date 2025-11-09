import { EditorView, ViewPlugin, ViewUpdate, PluginValue } from "@codemirror/view";
import { ChangeSpec } from "@codemirror/state"
import { setEnumEffect, setIndexEffect } from "@/src/state-effects/TypeEffects";
import { enumTable, indexTable, moneyFormat } from "@/src/plugin-logic/tableLogic";
import { addCurrencies, currencySet } from "./currencyState";
import { tableConfigStateField } from "@/src/state-effects/enumEffects";

class TableViewPlugin implements PluginValue {
    view: EditorView;
    constructor(view: EditorView) {
        this.view = view
    }
  
    update(update: ViewUpdate) {
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
                                  const configs = this.view.state.field(tableConfigStateField)
                                  const TableId = configs.get("tableId")
                                  if (attributeKey === "Index") {
                                      changes = indexTable(this.view, table, cellIndex);
                                      if (changes) {
                                        this.view.dispatch({
                                        changes: changes, 
                                        effects: setIndexEffect.of({[TableId]: rows }) //Changed
                                      });
                                  }
                                } else if (attributeKey?.contains("Money")) {
                                    addCurrencies(this.view, currencySet)
                                    const currencyCode = attributeKey.toString().charAt(6)
                                    changes = moneyFormat(this.view, table, cellIndex, currencyCode);
                                    if (changes) {
                                      this.view.dispatch({
                                      changes: changes, 
                                      effects: setIndexEffect.of({[TableId]: rows }) //Changed
                                      });
                                    }
                                    //adds text to the cells below which is picked up by different view plugin 
                                } else if (attributeKey === "Enum") {
                                    changes = enumTable(this.view, table, cellIndex)
                                    if (changes) {
                                      this.view.dispatch({
                                      changes: changes, 
                                      effects: [setEnumEffect.of({[TableId]: rows })] //Changed
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


  
    destroy() {

    }

  }
  
  export const tableViewPlugin = ViewPlugin.fromClass(TableViewPlugin);
