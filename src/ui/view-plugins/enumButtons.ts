import { ViewUpdate, EditorView, ViewPlugin, Decoration, DecorationSet,WidgetType } from '@codemirror/view';
import {MatchDecorator} from "@codemirror/view"
import { Menu, MarkdownView, MarkdownPostProcessor, App, Notice } from 'obsidian';
import { Table } from '@/src/plugin-logic/modalConfigSettings';
import { editorInfoField } from 'obsidian';

//Widget that styles the given element 
class PlaceholderWidget extends WidgetType {
    toDOM(view: EditorView): HTMLElement {
    const markdownView = view.state.field(editorInfoField)
    
    const btn = document.createElement('button');
    btn.innerText = " ✎ ";
    btn.onclick = ((ev: MouseEvent)=>{
        ev.preventDefault();
        const headerName = findButtonHeader(btn)
        const editor = markdownView.editor
        if (headerName && editor){
        const table = new Table(editor)
        const enumOptions = table.getTableEnumOptions(headerName)
        enumOptions.then((menuitems)=>{
            if (menuitems.length) { 
            const menu = new Menu()
            menuitems.forEach((menuItem)=>{
                 menu.addItem((item) =>
                    item.setTitle(menuItem).onClick(() => {
                        const pos = view.posAtDOM(btn);
                        view.dispatch({
                            changes: { from: pos, to: pos+5, insert: menuItem },
                        });     
                }));
            });

            menu.showAtMouseEvent(ev)
            }
        }).catch((reason: Error)=>{
            if (reason.name === "YAMLParseError") {
                new Notice(`Your table-config format is incorrect!\n(Note: Tabs are not allowed, use spaces).`)
            }
        });
        }

    });

        return btn;
    }
    ignoreEvent() {
        return false;
      }
  }


const placeholderMatcher = new MatchDecorator({
    regexp: /\[ ✎ \]/g,
    decoration: () => Decoration.replace({
      widget: new PlaceholderWidget(),
    })
  })

export const createPlaceholderPostProcessor = (app: App): MarkdownPostProcessor => {
    return (element: HTMLElement, ctx) => {
        const view = app.workspace.getActiveViewOfType(MarkdownView);
        if (view) 
        {
            const targetString = "[ ✎ ]";
            element.findAll("td").forEach((cell) => {
                
            if (cell.textContent === targetString) {
                cell.empty(); 
                const btn = cell.createEl('button');
                btn.innerText = " ✎ ";
                
                btn.onClickEvent(() => {
                   new Notice("Please set cell content in live preview.")
                //TODO: Fix logic to obtain pre-rendered data 
                // const headerName = findButtonHeader(btn);
                // const editor = view.editor;
                // const btnLine = ctx.getSectionInfo(element)?.lineStart;
                // let menuItems: string[] | undefined = []
                // if (headerName && editor && btnLine) {
                //     const table = new Table(editor)
                //     const enumOptions = table.getTableEnumOptions(headerName)
                //     enumOptions.then((menuitems)=>{
                //         menuItems = menuitems
                //         if (menuItems.length) {
                //             const menu = new Menu()
                //             menuItems.forEach((menuItem)=>{
                //                 menu.addItem((item) =>
                //                     item.setTitle(menuItem).onClick(() => {
                //                         cell.empty()
                //                         cell.setText(menuItem)
                //                     })
                //                 );
                //             })
                //             menu.showAtMouseEvent(ev)
                //         }
                //     }).catch(()=>{
                //         new Notice(`Please check your table-config!\nNote: Reading view maybe buggy so consider editing this cell in live preview.`)
                //     })
                // }
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