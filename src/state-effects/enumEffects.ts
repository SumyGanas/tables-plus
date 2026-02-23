import { StateEffect, StateField } from "@codemirror/state"

export interface TableConfigPayload {
  position: number; 
  columnName: string;
  tableConfig: {
    columns: unknown;
  };
}
export const setEnumListEffect = StateEffect.define<string[]>();
export const upsertTableConfigEffect = StateEffect.define<TableConfigPayload>();
export const removeTableConfigEffect = StateEffect.define<number>(); 

type ConfigMap = Map<number, {
  columns: unknown;
}>;

export const tableConfigStateField = StateField.define<ConfigMap>({
  create() {
    return new Map<number, { columns: unknown }>();
  },

  update(oldValue, tr) {
    if (tr.effects.length === 0) {
      return oldValue;
    }

    const newValue = new Map(oldValue);

    for (const effect of tr.effects) {
      if (effect.is(upsertTableConfigEffect)) {
        newValue.set(effect.value.position, effect.value.tableConfig);
      }

      if (effect.is(removeTableConfigEffect)) {
        newValue.delete(effect.value);
      }
    }
    return newValue;
  },
});