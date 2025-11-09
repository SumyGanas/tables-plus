import { ViewUpdate, EditorView, ViewPlugin, Decoration, DecorationSet,WidgetType } from '@codemirror/view';
import {MatchDecorator} from "@codemirror/view"
import { Menu, MarkdownPostProcessorContext, MarkdownView, MarkdownPostProcessor, App } from 'obsidian';
import { getTableEnumOptions } from '@/src/plugin-logic/modalConfigSettings';
import { editorInfoField } from 'obsidian';

//Widget that styles the given element 
class PlaceholderWidget extends WidgetType {
    constructor(){
        super();
        
    }
    toDOM(view: EditorView): HTMLElement {
    const markdownView = view.state.field(editorInfoField)
    
    const btn = document.createElement('button');
    btn.innerText = " ✎ ";

    btn.onclick = ((ev: MouseEvent)=>{
        ev.preventDefault();
        const headerName = findButtonHeader(btn)
        const editor = markdownView.editor
        let menuItems: string[] | undefined = []
        if (headerName && editor){
            
        const enumOptions = getTableEnumOptions(editor,headerName)
        enumOptions.then((eO)=>{
            menuItems = eO
            if (menuItems.length) {
            const menu = new Menu()
            menuItems.forEach((menuItem)=>{
                 menu.addItem((item) =>
                    item.setTitle(menuItem).onClick((evt) => {
                        const pos = view.posAtDOM(btn);
                        view.dispatch({
                            changes: { from: pos, to: pos+5, insert: menuItem },
                        });
                        
                       
                }));
            });

            menu.showAtMouseEvent(ev)
            }
        });
        }

    });

        return btn;
    }
    ignoreEvent() {
        return true;
      }
  }


const placeholderMatcher = new MatchDecorator({
    regexp: /\[\ ✎ \]/g,
    decoration: match => Decoration.replace({
      widget: new PlaceholderWidget(),
    })
  })

export const createPlaceholderPostProcessor = (app: App): MarkdownPostProcessor => {
    return (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        const view = app.workspace.getActiveViewOfType(MarkdownView);
        if (view) 
        {
            const targetString = "[ ✎ ]";
            element.findAll("td").forEach((cell) => {
                
            if (cell.textContent === targetString) {
                cell.empty(); 
                const btn = cell.createEl('button');
                btn.innerText = " ✎ ";
                
                btn.onClickEvent((ev: MouseEvent) => {
                const headerName = findButtonHeader(btn);
                const editor = view.editor;
                let menuItems: string[] | undefined = []
                if (headerName && editor) {
                    const enumOptions = getTableEnumOptions(editor,headerName)
                    enumOptions.then((eO)=>{
                        menuItems = eO
                        if (menuItems.length) {
                            const menu = new Menu()
                            menuItems.forEach((menuItem)=>{
                                menu.addItem((item) =>
                                    item.setTitle(menuItem).onClick(() => {
                                        cell.empty()
                                        cell.setText(menuItem)
                                    })
                                );
                            })
                            menu.showAtMouseEvent(ev)
                        }
                    })
                }
                });
            }
            });
      }
      ;}
  }



export const placeholders = ViewPlugin.fromClass(class {
placeholders: DecorationSet
constructor(view: EditorView) {
    this.placeholders = placeholderMatcher.createDeco(view)
}
    update(update: ViewUpdate) {
        this.placeholders = placeholderMatcher.updateDeco(update, this.placeholders)
    }
}, {
    decorations: instance => instance.placeholders,
    provide: plugin => EditorView.atomicRanges.of(view => {
        return view.plugin(plugin)?.placeholders || Decoration.none
    })
});

function findButtonHeader(button: HTMLElement): string | undefined {
    if (!button) {
        return;
      }
    const cell = button.closest('td, th') as HTMLTableCellElement;
    if (!cell) return;
    const columnIndex = cell.cellIndex;
    const table = cell.closest('table');
    if (!table) return;
    const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
    if (!headerRow) return;
    const headerCell = headerRow.children[columnIndex] as HTMLTableCellElement;
    if (headerCell) {
        const headerName = headerCell.textContent?.trim();
        return headerName
    }
  return 
}