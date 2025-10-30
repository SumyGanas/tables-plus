import { EditorView, ViewPlugin, ViewUpdate, PluginValue } from "@codemirror/view";
import { index_table, moneyFormat } from "@/src/plugin-logic/tableLogic";
import { setIndexEffect } from "@/src/state-effects/TypeEffects";
import { ChangeSpec } from "@codemirror/state"
import { addCurrencies, currencySet } from "./currencyState";

export function updateTableIds(table: HTMLTableElement): {tableID: string, rows: number} {
    const attributeElem = table?.closest('th');
    attributeElem?.removeAttribute('modified-header')
    const tableElement = table?.closest('table');
    const tableID = table?.id
    const rows = table?.rows?.length - 1 
    if (tableID) {
      return {tableID, rows}
    } else {
      tableElement?.setAttribute("id",crypto.randomUUID())
      const tableID = table?.id
      return {tableID, rows}
    }
  }

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
                                  const indexElem = this.view.dom.querySelector('[cell-index]');
                                  const cellIndex = (indexElem?.getAttribute("cell-index") as unknown) as number
                                  const attributeKey = table.getAttribute("modified-header");
                                  const {tableID, rows} = updateTableIds(table);
                                  if (attributeKey === "Index") {
                                      const changes = index_table(this.view, table, cellIndex);
                                      if (changes) {
                                        this.view.dispatch({
                                        changes: changes, 
                                        effects: setIndexEffect.of({[tableID]: rows })
                                      });
                                  }}
                                  
                                  else if (attributeKey?.contains("Money")) {
                                    addCurrencies(this.view, currencySet)
                                    const currencyCode = attributeKey.toString().charAt(6)
                                    const changes = moneyFormat(this.view, table, cellIndex, currencyCode);
                                    if (changes) {
                                      this.view.dispatch({
                                      changes: changes, 
                                      effects: setIndexEffect.of({[tableID]: rows })
                                    });
                                }}
                                  indexElem?.removeAttribute("cell-index")
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
