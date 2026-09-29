/**
 * Small interface words for the archive's controls (verbs and button
 * labels only). Everything the page *says* — headings, filter names,
 * labels, empty state — comes from src/content/pages.ts (`archiveCopy`,
 * `pages.archive`) through @/lib/content.
 */
export const ARCHIVE_UI = {
  open: "Open",
  read: "Read",
  filters: "Filters",
  clearAll: "Clear all",
  clearSearch: "Clear search",
  removeFilter: "Remove filter",
  editFilters: "Filters",
  showing: "Showing",
  of: "of",
  searchShortcut: "Press / to search",
  yearChart: "Entries per year",
} as const;
