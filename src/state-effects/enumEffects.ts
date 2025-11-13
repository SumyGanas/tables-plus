import { StateEffect, StateField } from "@codemirror/state"

export interface TableConfigPayload {
  key: string;
  columnName: string;
  tableConfig: unknown;
}
export const setEnumListEffect = StateEffect.define<string[]>();
export const upsertTableConfigEffect = StateEffect.define<TableConfigPayload>();
export const removeTableConfigEffect = StateEffect.define<string>();
export const setTableIdEffect = StateEffect.define<string>();

type ConfigMap = Map<string, unknown>;

export const tableConfigStateField = StateField.define<ConfigMap>({
  create() {
    return new Map<string, unknown>();
  },

  update(oldValue, tr) {
    if (tr.effects.length === 0) {
      return oldValue;
    }

    const newValue = new Map(oldValue);

    for (const effect of tr.effects) {
      if (effect.is(upsertTableConfigEffect)) {
        newValue.set(effect.value.key, effect.value.tableConfig);
      }

      if (effect.is(setTableIdEffect)) {
        newValue.set("tableId",effect.value)
      }
    }
    return newValue;
  },
});