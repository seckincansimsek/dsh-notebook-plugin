# Notebook

A Markdown notebook that lives in the Harness sidebar.

Open it from the notebook icon in the left sidebar. Notes are stored in the
browser's local storage, so they stay on your machine and survive restarts.

## Writing

- **Notes rail** — every note with a title, a one-line preview and its last
  edit date. Search filters the list; `+` creates a note.
- **Title** — click the large title and type. It becomes the `.md` file name
  and, when the note has no `#` heading yet, its first heading on export.
- **Formatting** — bold, italic, strikethrough, inline code, H1–H3, links,
  quotes, bulleted/numbered/task lists, fenced code blocks, horizontal rules
  and tables. Every toolbar button acts on the current selection; the same
  keys work without leaving the keyboard:

  | Shortcut | Action |
  | --- | --- |
  | `⌘/Ctrl + B` | bold |
  | `⌘/Ctrl + I` | italic |
  | `⌘/Ctrl + E` | inline code |
  | `⌘/Ctrl + K` | link |
  | `⌘/Ctrl + Shift + X` | strikethrough |
  | `Tab` | indent two spaces |
  | `Enter` | continue a list (or leave an empty item) |

- **Views** — Write only, Split (editor + live preview), or Preview only.
- **Status bar** — words, characters, lines and estimated reading time.

## Exporting

- **Export .md** saves the current note as a Markdown file; the file name comes
  from the note title and an existing `#` heading is not duplicated.
- **Copy Markdown** puts the same text on the clipboard (the fallback path
  works without clipboard permission).
- **Export all** (rail footer) writes every note into one `.md` separated by
  `---`.

## Bundle layout

```
package.json        bundle manifest: dsh.bundle patch + dsh.client web module
cordis.patch.yml    inserts the `notebook` row
index.js            Host half (intentionally empty)
client.js           sidebar icon + main panel, all UI and Markdown logic
locale/{en,tr}.json plugin title/description for the Plugins page
icon.svg            bundle icon
```
