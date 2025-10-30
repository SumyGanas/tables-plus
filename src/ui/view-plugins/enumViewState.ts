import { EditorView, ViewPlugin, ViewUpdate, PluginValue } from "@codemirror/view";
import { setEnumListEffect } from "@/src/state-effects/enumEffects";

class TableViewPlugin implements PluginValue {
    view: EditorView;
    constructor(view: EditorView) {
        this.view = view
    }
  
    update(update: ViewUpdate) {
        this.view.requestMeasure({
            read: () => {
                return this.view.dom.querySelectorAll('[data-slot="Badge"]'); 
            },
            write: (selectedEnums: NodeListOf<Element>) => {
                const ls: string[] = []
                if (selectedEnums.length) {
                    selectedEnums.forEach((selectedEnum)=>{
                       const enumName = selectedEnum.getText().trim()
                       ls.push(enumName)
                    })
                    setTimeout(()=>{
                        this.view.dispatch({
                            effects: setEnumListEffect.of(ls)
                        })
                    },0)
                }
            }
          });  
    }


  
    destroy() {

    }
  }
  
  export const tableViewPlugin = ViewPlugin.fromClass(TableViewPlugin);
