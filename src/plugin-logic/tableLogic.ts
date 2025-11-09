import { EditorView } from '@codemirror/view';
import { ChangeSpec, Line } from "@codemirror/state"

export function findIndex(headerRow: HTMLTableRowElement | null | undefined): number | null {
  const cell = headerRow?.querySelector('th[modified-header]')

  const children = cell?.parentElement?.children;
  if (children) {
    return  Array.from(children).indexOf(cell);
  }
  return null;
  
}


function findCellInsertIndex(lineText: string, cellPre: number): {start: number; end: number} | null {
  const cell = parseInt(String(cellPre),10)
  let currentPipeIndex = -1;
  const pipeRegexp: RegExp = /[|]/g;
  const pipes = Array.from(lineText.matchAll(pipeRegexp))
  const startPipeIndex = pipes[cell].index
  const endPipeIndex = pipes[cell+1].index

  if (endPipeIndex === -1) {
    return null;
  }
  
  if (startPipeIndex != undefined && endPipeIndex != undefined) {
    return { start: startPipeIndex, end: endPipeIndex };
  } else {
    return null
  }
  
}

export function indexTable(view: EditorView, table: HTMLElement | null, cell: number): ChangeSpec[] | undefined {
  const changes: ChangeSpec[] = [];
  let rowIndex = 1
  const tableStartPos = view.posAtDOM(table as Node);
  if (tableStartPos === null) return;
  const startLine: Line = view.state.doc.lineAt(tableStartPos);
  let currentLineNumber = startLine.number + 2;
  while (currentLineNumber <= view.state.doc.lines) {
    const line = view.state.doc.line(currentLineNumber);
    if (!line.text.includes('|')) {
      break;
    }
    const PipeIndeces = findCellInsertIndex(line.text,cell)
    if (PipeIndeces) {
      const firstPipeIndex = line.from + PipeIndeces.start + 1;
      const secondPipeIndex = line.from + PipeIndeces.end;
      const insertfromPos =  firstPipeIndex + 1;
      const inserttoPos = secondPipeIndex;
      changes.push({
        from: insertfromPos,
        to: inserttoPos,
      }); 
      changes.push({
        from: insertfromPos,
        to: inserttoPos,
        insert: ` ${String(rowIndex)} `
      });
    }
    rowIndex++;
    currentLineNumber++;
  }
  return changes; 
}

export function enumTable(view: EditorView, table: HTMLElement | null, cell: number): ChangeSpec[] | undefined {
  const changes: ChangeSpec[] = [];
  let rowIndex = 1
  const tableStartPos = view.posAtDOM(table as Node);
  if (tableStartPos === null) return;
  const startLine: Line = view.state.doc.lineAt(tableStartPos);
  let currentLineNumber = startLine.number + 2;
  while (currentLineNumber <= view.state.doc.lines) {
    const line = view.state.doc.line(currentLineNumber);
    if (!line.text.includes('|')) {
      break;
    }
    const PipeIndeces = findCellInsertIndex(line.text,cell)
    if (PipeIndeces) {
      const firstPipeIndex = line.from + PipeIndeces.start + 1;
      const secondPipeIndex = line.from + PipeIndeces.end;
      const insertfromPos =  firstPipeIndex + 1;
      const inserttoPos = secondPipeIndex;
      const cellText = view.state.doc.sliceString(insertfromPos, inserttoPos)
      const smilingFaceWithSmilingEyes = "\u{25A9}";
      const buttonImage = `[ ✎ ]`
      if (cellText.trim().length <= 0) { //rn only adding to empty cells 
      changes.push({ 
        from: insertfromPos,
        to: inserttoPos,
        insert: buttonImage
      });
      }
    }
    rowIndex++;
    currentLineNumber++;
  }
  return changes; 
}

export function countTableRows( table: HTMLTableElement | null): number {
  if (!table || table.tagName !== 'TABLE') {
    console.error("The provided element is not a table.");
    return 0;
  }
  return table.rows.length - 1;
}


export function moneyFormat(view: EditorView, table: HTMLElement | null, cell: number, symbol: string | null): ChangeSpec[] | undefined {
  if (!symbol) {
    return
  }
  const changes: ChangeSpec[] = [];
  let rowIndex = 1
  const tableStartPos = view.posAtDOM(table as Node);
  if (tableStartPos === null) return;
  const startLine: Line = view.state.doc.lineAt(tableStartPos);
  let currentLineNumber = startLine.number + 2;
  while (currentLineNumber <= view.state.doc.lines) {
    const line = view.state.doc.line(currentLineNumber);
    if (!line.text.includes('|')) {
      break;
    }
    const PipeIndeces = findCellInsertIndex(line.text,cell)
    if (PipeIndeces) {
      const firstPipeIndex = line.from + PipeIndeces.start + 1;
      const secondPipeIndex = line.from + PipeIndeces.end;
      const insertfromPos =  firstPipeIndex + 1;
      const inserttoPos = secondPipeIndex;
      let cellText = view.state.doc.sliceString(insertfromPos, inserttoPos)
      if (parseInt(String(cellText))) {
        changes.push({
        from: insertfromPos,
        to: inserttoPos,
      }); 
        if (cellText.includes(".")) {
          changes.push({
          from: insertfromPos,
          to: inserttoPos,
          insert: `${symbol}`+" "+`${cellText} `
        });
        } else {
          changes.push({
            from: insertfromPos,
            to: inserttoPos,
            insert: `${symbol}`+" "+`${cellText.trimEnd()}.00`
          });
        }
      
      } else if (parseInt(String(cellText).slice(2))) {
        cellText = (String(cellText).slice(2))
        changes.push({
          from: insertfromPos,
          to: inserttoPos
        });
        if (cellText.includes(".")) {
          changes.push({
          from: insertfromPos,
          to: inserttoPos,
          insert: `${symbol}`+" "+`${cellText} `
        });
        } else {
          changes.push({
            from: insertfromPos,
            to: inserttoPos,
            insert: `${symbol}`+" "+`${cellText.trimEnd()}.00`
          });
        }
        
      } else {

      }
      
    }
    rowIndex++;
    currentLineNumber++;
  }
  return changes;
}

