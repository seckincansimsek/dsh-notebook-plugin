/**
 * Notebook — Host half.
 *
 * The notebook is entirely a browser-side application: notes live in the
 * page's local storage, the editor and live Markdown preview are React
 * components, and `.md` export is produced in the page. This Host row exists
 * so the bundle has a valid plugin entry, and it intentionally registers
 * nothing. Keeping it empty also means the plugin cannot fail a harness boot.
 */

export function apply() {}
