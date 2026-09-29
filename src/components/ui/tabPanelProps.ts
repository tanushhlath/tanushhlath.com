/** Attributes for the panel a SegmentedTabs tab controls: `<section {...tabPanelProps("work", lens)}>`. */
export function tabPanelProps(idPrefix: string, value: string) {
  return {
    role: "tabpanel" as const,
    id: `${idPrefix}-panel-${value}`,
    "aria-labelledby": `${idPrefix}-tab-${value}`,
    tabIndex: 0,
  };
}
