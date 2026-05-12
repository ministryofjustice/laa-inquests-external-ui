export interface SummaryListRow {
  value: { text: string };
  key: { text: string };
  actions?: RowAction;
}

export interface RowAction {
  items: Array<{ text: string }>;
}
