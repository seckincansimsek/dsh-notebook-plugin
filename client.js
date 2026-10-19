/**
 * Notebook — browser half.
 *
 * A Markdown notebook in the sidebar: a notes rail, a formatting toolbar, a
 * plain-text editor with a live rendered preview, and `.md` export. Notes are
 * kept in this browser's local storage; nothing is sent anywhere.
 *
 * Plain JavaScript, no JSX, no build step, no Harness Client package imports.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-notebook',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    const useDeferred = typeof React.useDeferredValue === 'function' ? React.useDeferredValue : (value) => value;

    const NS = 'notebook';
    const STORAGE_KEY = 'dsh.notebook.v1';
    const MAX_TITLE = 120;

    /* ------------------------------------------------------------------ text */

    const dictEn = {
      panel: 'Notebook',
      title: 'Notebook',
      untitled: 'Untitled note',
      titleLabel: 'Note title',
      editorLabel: 'Note body',
      newNote: 'New note',
      notes: 'Notes',
      search: 'Search notes',
      searchPlaceholder: 'Search notes',
      noMatches: 'No notes match your search.',
      noNotes: 'No notes yet',
      noNotesBody: 'Create a note and start writing. Everything stays in this browser.',
      createFirst: 'Create a note',
      delete: 'Delete',
      confirmDelete: 'Delete this note?',
      cancel: 'Cancel',
      exportMd: 'Export .md',
      exportAll: 'Export all notes',
      copyMd: 'Copy Markdown',
      copied: 'Copied',
      write: 'Write',
      split: 'Split',
      preview: 'Preview',
      saving: 'Saving…',
      saved: 'Saved locally',
      saveFailed: 'Could not save locally',
      words: 'words',
      word: 'word',
      characters: 'characters',
      lines: 'lines',
      minRead: 'min read',
      placeholder: 'Start writing in Markdown…',
      titlePlaceholder: 'Untitled note',
      toolbarH1: 'Heading 1',
      toolbarH2: 'Heading 2',
      toolbarH3: 'Heading 3',
      toolbarBold: 'Bold (⌘B)',
      toolbarItalic: 'Italic (⌘I)',
      toolbarStrike: 'Strikethrough (⌘⇧X)',
      toolbarCode: 'Inline code (⌘E)',
      toolbarLink: 'Link (⌘K)',
      toolbarQuote: 'Quote',
      toolbarBullet: 'Bulleted list',
      toolbarNumbered: 'Numbered list',
      toolbarTask: 'Task list',
      toolbarCodeBlock: 'Code block',
      toolbarHr: 'Divider',
      toolbarTable: 'Table',
      previewEmpty: 'Nothing to preview yet.',
      welcomeTitle: 'Welcome to Notebook',
      welcomeIntro: 'This notebook lives beside your sessions. Notes are saved in this browser, and **Export .md** writes the current note to a Markdown file.',
      welcomeHeading: 'Try the toolbar',
      welcomeBold: 'Select a word and press **⌘B** for bold, **⌘I** for italic.',
      welcomeList: 'Start a line with `# ` for a heading, `- ` for a list, `> ` for a quote.',
      welcomeLink: 'The link button inserts `[text](url)` and selects the URL.',
      welcomeMore: '**Export all** in the rail writes every note into a single `.md` file.',
      welcomeTable: '| Shortcut | Action |\n| --- | --- |\n| ⌘B | bold |\n| ⌘I | italic |\n| ⌘K | link |\n| ⌘E | inline code |',
      shortcuts: 'Markdown shortcuts',
    };

    const dictTr = {
      panel: 'Not Defteri',
      title: 'Not Defteri',
      untitled: 'Adsız not',
      titleLabel: 'Not başlığı',
      editorLabel: 'Not içeriği',
      newNote: 'Yeni not',
      notes: 'Notlar',
      search: 'Notlarda ara',
      searchPlaceholder: 'Notlarda ara',
      noMatches: 'Aramanızla eşleşen not yok.',
      noNotes: 'Henüz not yok',
      noNotesBody: 'Bir not oluşturup yazmaya başlayın. Her şey bu tarayıcıda kalır.',
      createFirst: 'Not oluştur',
      delete: 'Sil',
      confirmDelete: 'Bu not silinsin mi?',
      cancel: 'Vazgeç',
      exportMd: '.md dışa aktar',
      exportAll: 'Tüm notları dışa aktar',
      copyMd: 'Markdown kopyala',
      copied: 'Kopyalandı',
      write: 'Yaz',
      split: 'Bölünmüş',
      preview: 'Önizleme',
      saving: 'Kaydediliyor…',
      saved: 'Bu cihazda kaydedildi',
      saveFailed: 'Bu cihaza kaydedilemedi',
      words: 'kelime',
      word: 'kelime',
      characters: 'karakter',
      lines: 'satır',
      minRead: 'dk okuma',
      placeholder: 'Markdown ile yazmaya başlayın…',
      titlePlaceholder: 'Adsız not',
      toolbarH1: 'Başlık 1',
      toolbarH2: 'Başlık 2',
      toolbarH3: 'Başlık 3',
      toolbarBold: 'Kalın (⌘B)',
      toolbarItalic: 'İtalik (⌘I)',
      toolbarStrike: 'Üstü çizili (⌘⇧X)',
      toolbarCode: 'Satır içi kod (⌘E)',
      toolbarLink: 'Bağlantı (⌘K)',
      toolbarQuote: 'Alıntı',
      toolbarBullet: 'Madde işaretli liste',
      toolbarNumbered: 'Numaralı liste',
      toolbarTask: 'Görev listesi',
      toolbarCodeBlock: 'Kod bloğu',
      toolbarHr: 'Ayırıcı',
      toolbarTable: 'Tablo',
      previewEmpty: 'Henüz önizlenecek bir şey yok.',
      welcomeTitle: "Not Defteri'ne hoş geldiniz",
      welcomeIntro: 'Bu not defteri oturumlarınızın yanında durur. Notlar bu tarayıcıda saklanır ve **.md dışa aktar** geçerli notu bir Markdown dosyasına yazar.',
      welcomeHeading: 'Araç çubuğunu deneyin',
      welcomeBold: 'Bir sözcük seçip **⌘B** ile kalın, **⌘I** ile italik yapın.',
      welcomeList: 'Satır başına `# ` yazınca başlık, `- ` yazınca liste, `> ` yazınca alıntı olur.',
      welcomeLink: 'Bağlantı düğmesi `[metin](adres)` ekler ve adresi seçer.',
      welcomeMore: 'Kenar çubuğundaki **Tümünü dışa aktar** bütün notları tek bir `.md` dosyasına yazar.',
      welcomeTable: '| Kısayol | İşlev |\n| --- | --- |\n| ⌘B | kalın |\n| ⌘I | italik |\n| ⌘K | bağlantı |\n| ⌘E | satır içi kod |',
      shortcuts: 'Markdown kısayolları',
    };

    function dictFor(language) {
      return String(language || 'en').toLowerCase().startsWith('tr') ? dictTr : dictEn;
    }

    function uid() {
      try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      } catch (error) {
        /* fall through */
      }
      return 'n-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    /* -------------------------------------------------------------- markdown */

    const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
    }

    function safeUrl(value) {
      const url = String(value).trim();
      if (/^(https?:\/\/|mailto:|#|\/|\.{1,2}\/)/i.test(url)) return url;
      return null;
    }

    function inlineFormat(raw) {
      const codes = [];
      let out = escapeHtml(raw);
      out = out.replace(/`([^`]+)`/g, (match, code) => {
        codes.push(code);
        return '\u0000' + (codes.length - 1) + '\u0000';
      });
      out = out.replace(/!\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (match, alt, url) => {
        const safe = safeUrl(url);
        return safe ? '<img src="' + safe + '" alt="' + alt + '" loading="lazy" />' : alt;
      });
      out = out.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (match, label, url) => {
        const safe = safeUrl(url);
        return safe ? '<a href="' + safe + '" target="_blank" rel="noreferrer noopener">' + label + '</a>' : label;
      });
      out = out.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>');
      out = out.replace(/(^|[^\w*])\*(?=\S)([^*]*?\S)\*(?!\*)/g, '$1<em>$2</em>');
      out = out.replace(/(^|[^\w_])_(?=\S)([^_]*?\S)_(?!_)/g, '$1<em>$2</em>');
      out = out.replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
      out = out.replace(/\u0000(\d+)\u0000/g, (match, index) => '<code>' + codes[Number(index)] + '</code>');
      return out;
    }

    function isTableStart(lines, index) {
      if (index + 1 >= lines.length) return false;
      const header = lines[index];
      const separator = lines[index + 1];
      if (!header.includes('|') || !separator.includes('|')) return false;
      return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(separator);
    }

    function splitRow(row) {
      return String(row).trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
    }

    function isBlockStart(line) {
      return /^\s{0,3}(#{1,6}\s|>|`{3,}|~{3,}|([-*+]|\d+[.)])\s)/.test(line) || /^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line);
    }

    function renderListItems(items) {
      const parts = [];
      let open = null;
      for (const item of items) {
        const kind = item.ordered ? 'ol' : 'ul';
        if (open !== kind) {
          if (open) parts.push('</' + open + '>');
          parts.push('<' + kind + '>');
          open = kind;
        }
        const indent = Math.min(item.indent, 8) * 10;
        const task = item.text.match(/^\[([ xX])\](?:\s+([\s\S]*))?$/);
        if (task) {
          const checked = task[1].trim().length > 0;
          parts.push(
            '<li class="dsh-nb-task" style="margin-left:' + indent + 'px">' +
              '<span class="dsh-nb-check">' + (checked ? '✓' : '') + '</span>' +
              '<span>' + inlineFormat(task[2] || '') + '</span>' +
            '</li>',
          );
        } else {
          parts.push('<li style="margin-left:' + indent + 'px">' + inlineFormat(item.text) + '</li>');
        }
      }
      if (open) parts.push('</' + open + '>');
      return parts.join('');
    }

    function renderMarkdown(source) {
      const lines = String(source == null ? '' : source).replace(/\r\n?/g, '\n').split('\n');
      const out = [];
      let index = 0;

      while (index < lines.length) {
        const line = lines[index];

        if (!line.trim()) {
          index += 1;
          continue;
        }

        const fence = line.match(/^\s*(`{3,}|~{3,})\s*[\w+-]*\s*$/);
        if (fence) {
          const marker = fence[1][0];
          const closing = new RegExp('^\\s*' + marker + '{3,}\\s*$');
          const body = [];
          index += 1;
          while (index < lines.length && !closing.test(lines[index])) {
            body.push(lines[index]);
            index += 1;
          }
          if (index < lines.length) index += 1;
          out.push('<pre><code>' + escapeHtml(body.join('\n')) + '</code></pre>');
          continue;
        }

        if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
          out.push('<hr />');
          index += 1;
          continue;
        }

        const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
        if (heading) {
          const level = heading[1].length;
          out.push('<h' + level + '>' + inlineFormat(heading[2]) + '</h' + level + '>');
          index += 1;
          continue;
        }

        if (/^\s{0,3}>/.test(line)) {
          const quoted = [];
          while (index < lines.length && /^\s{0,3}>/.test(lines[index])) {
            quoted.push(lines[index].replace(/^\s{0,3}>\s?/, ''));
            index += 1;
          }
          out.push('<blockquote>' + inlineFormat(quoted.join('\n')).replace(/\n/g, '<br />') + '</blockquote>');
          continue;
        }

        if (isTableStart(lines, index)) {
          const header = splitRow(lines[index]);
          index += 2;
          const rows = [];
          while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
            rows.push(splitRow(lines[index]));
            index += 1;
          }
          const head = header.map((cell) => '<th>' + inlineFormat(cell) + '</th>').join('');
          const body = rows.map((row) => '<tr>' + row.map((cell) => '<td>' + inlineFormat(cell) + '</td>').join('') + '</tr>').join('');
          out.push('<table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>');
          continue;
        }

        if (/^(\s*)([-*+]|\d+[.)])\s+/.test(line)) {
          const items = [];
          while (index < lines.length) {
            const current = lines[index];
            const item = current.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
            if (item) {
              items.push({
                ordered: /^\d/.test(item[2]),
                indent: item[1].replace(/\t/g, '  ').length,
                text: item[3],
              });
              index += 1;
              continue;
            }
            if (/^\s{2,}\S/.test(current) && items.length > 0 && !/^\s{0,3}(#{1,6})\s/.test(current)) {
              items[items.length - 1].text += ' ' + current.trim();
              index += 1;
              continue;
            }
            break;
          }
          out.push(renderListItems(items));
          continue;
        }

        const paragraph = [line];
        index += 1;
        while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index]) && !isTableStart(lines, index)) {
          paragraph.push(lines[index]);
          index += 1;
        }
        out.push(
          '<p>' + paragraph.map((text) => (text.endsWith('  ') ? inlineFormat(text.trimEnd()) + '<br />' : inlineFormat(text))).join(' ') + '</p>',
        );
      }

      return out.join('\n');
    }

    /* ------------------------------------------------------- edit transforms */

    function lineBounds(text, start, end) {
      const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;
      return [lineStart, lineEnd];
    }

    function wrapSelection(text, start, end, before, after, placeholder) {
      const selected = text.slice(start, end);
      const inner = selected.length > 0 ? selected : placeholder;
      const next = text.slice(0, start) + before + inner + after + text.slice(end);
      const caret = start + before.length;
      return { text: next, sel: [caret, caret + inner.length] };
    }

    function toggleWrap(text, start, end, marker) {
      const selected = text.slice(start, end);
      const before = text.slice(Math.max(0, start - marker.length), start);
      const after = text.slice(end, end + marker.length);
      if (before === marker && after === marker) {
        const next = text.slice(0, start - marker.length) + selected + text.slice(end + marker.length);
        return { text: next, sel: [start - marker.length, end - marker.length] };
      }
      if (selected.length >= marker.length * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
        const inner = selected.slice(marker.length, selected.length - marker.length);
        return { text: text.slice(0, start) + inner + text.slice(end), sel: [start, start + inner.length] };
      }
      return wrapSelection(text, start, end, marker, marker, '');
    }

    function stripListMarker(line) {
      return line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '');
    }

    function toggleLinePrefix(text, start, end, prefix, numbered) {
      const [lineStart, lineEnd] = lineBounds(text, start, end);
      const block = text.slice(lineStart, lineEnd);
      const lines = block.split('\n');
      const matches = (line, position) => {
        if (!line.trim()) return true;
        if (numbered) return new RegExp('^\\s*' + (position + 1) + '\\.\\s').test(line);
        return line.startsWith(prefix);
      };
      const all = lines.every((line, position) => matches(line, position));
      const next = lines.map((line, position) => {
        if (all) {
          if (!line.trim()) return line;
          return numbered ? stripListMarker(line) : line.startsWith(prefix) ? line.slice(prefix.length) : line;
        }
        if (!line.trim()) return line;
        const content = numbered ? stripListMarker(line) : line.startsWith(prefix) ? line.slice(prefix.length) : stripListMarker(line);
        return numbered ? (position + 1) + '. ' + content : prefix + content;
      });
      const replaced = next.join('\n');
      return { text: text.slice(0, lineStart) + replaced + text.slice(lineEnd), sel: [lineStart, lineStart + replaced.length] };
    }

    function insertBlock(text, start, end, block, caretInBlock) {
      const before = text.slice(0, start);
      const after = text.slice(end);
      const lead = before.length === 0 || before.endsWith('\n') ? '' : '\n';
      const tail = after.length === 0 || after.startsWith('\n') ? '' : '\n';
      const caret = start + lead.length + (caretInBlock == null ? block.length : caretInBlock);
      return { text: before + lead + block + tail + after, sel: [caret, caret] };
    }

    function insertCodeBlock(text, start, end) {
      const selected = text.slice(start, end);
      if (selected) {
        const block = '```\n' + selected + '\n```';
        return insertBlock(text, start, end, block, block.length);
      }
      return insertBlock(text, start, end, '```\n\n```', 4);
    }

    function insertTable(text, start, end) {
      const block = '| Column | Column |\n| --- | --- |\n| Text | Text |';
      const result = insertBlock(text, start, end, block, 2);
      return { text: result.text, sel: [result.sel[0], result.sel[0] + 6] };
    }

    function insertLink(text, start, end) {
      const selected = text.slice(start, end) || 'link text';
      const snippet = '[' + selected + '](https://)';
      const next = text.slice(0, start) + snippet + text.slice(end);
      const urlStart = start + 1 + selected.length + 2;
      return { text: next, sel: [urlStart, urlStart + 8] };
    }

    function continueList(text, start, end) {
      if (start !== end) return null;
      const [lineStart, lineEnd] = lineBounds(text, start, end);
      if (text.slice(start, lineEnd).trim()) return null;
      const prefix = text.slice(lineStart, start);
      const match = prefix.match(/^(\s*)([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?(.*)$/);
      if (!match) return null;
      const indent = match[1];
      const marker = match[2];
      const task = match[3];
      if (!match[4].trim()) {
        const next = text.slice(0, lineStart) + text.slice(start);
        return { text: next, sel: [lineStart, lineStart] };
      }
      let nextMarker = marker;
      if (/^\d/.test(marker)) nextMarker = String(parseInt(marker, 10) + 1) + marker.slice(-1);
      const insert = '\n' + indent + nextMarker + ' ' + (task ? '[ ] ' : '');
      const caret = start + insert.length;
      return { text: text.slice(0, start) + insert + text.slice(end), sel: [caret, caret] };
    }

    /* ------------------------------------------------------------- documents */

    function readDocument() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.notes)) return null;
        const notes = parsed.notes
          .filter((note) => note && typeof note === 'object' && typeof note.id === 'string')
          .map((note) => ({
            id: note.id,
            title: typeof note.title === 'string' ? note.title : '',
            body: typeof note.body === 'string' ? note.body : '',
            createdAt: typeof note.createdAt === 'number' ? note.createdAt : Date.now(),
            updatedAt: typeof note.updatedAt === 'number' ? note.updatedAt : Date.now(),
          }));
        const activeId = notes.some((note) => note.id === parsed.activeId) ? parsed.activeId : notes[0] ? notes[0].id : null;
        return { notes, activeId };
      } catch (error) {
        return null;
      }
    }

    function persistDocument(doc) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, notes: doc.notes, activeId: doc.activeId }));
        return true;
      } catch (error) {
        return false;
      }
    }

    function welcomeNote(t) {
      const body = [
        t('welcomeIntro'),
        '',
        '## ' + t('welcomeHeading'),
        '',
        '- ' + t('welcomeBold'),
        '- ' + t('welcomeList'),
        '- ' + t('welcomeLink'),
        '- ' + t('welcomeMore'),
        '',
        t('welcomeTable'),
        '',
        '```',
        'const notes = ["markdown", "saved locally"];',
        '```',
        '',
      ].join('\n');
      const now = Date.now();
      return { id: uid(), title: t('welcomeTitle'), body, createdAt: now, updatedAt: now };
    }

    function loadDocument(t) {
      const stored = readDocument();
      if (stored) return stored;
      const note = welcomeNote(t);
      return { notes: [note], activeId: note.id };
    }

    function noteHeading(note) {
      return (note.title || '').trim() || 'Untitled note';
    }

    function markdownFor(note) {
      const title = noteHeading(note);
      const body = String(note.body == null ? '' : note.body).replace(/\s+$/, '');
      const firstLine = body.split('\n')[0] || '';
      const hasHeading = /^\s{0,3}#\s+\S/.test(firstLine);
      const head = hasHeading ? '' : '# ' + title + '\n\n';
      return (head + body).replace(/\n*$/, '\n');
    }

    function allMarkdown(notes) {
      return notes.map((note) => markdownFor(note).replace(/\n+$/, '')).join('\n\n---\n\n') + '\n';
    }

    function fileNameFor(title) {
      const slug = String(title || 'note')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
      return (slug || 'note') + '.md';
    }

    function downloadText(fileName, text) {
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function copyText(text) {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (error) {
        /* fall through to the selection path */
      }
      try {
        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.top = '-1000px';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const ok = document.execCommand('copy');
        field.remove();
        return ok;
      } catch (error) {
        return false;
      }
    }

    function previewOf(note) {
      const line = String(note.body || '').split('\n').find((entry) => entry.trim().length > 0) || '';
      const clean = line
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s*[-*+]\s+/, '')
        .replace(/^\s*\d+[.)]\s+/, '')
        .replace(/[`*_>#]/g, '')
        .trim();
      return clean || '…';
    }

    function timeLabel(timestamp) {
      try {
        return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch (error) {
        return '';
      }
    }

    /* -------------------------------------------------------------- chrome */

    function Icon(props) {
      const size = props.size || 16;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: props.width || 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        props.children,
      );
    }

    const IconPlus = (p) => h(Icon, p, h('path', { d: 'M12 5v14M5 12h14' }));
    const IconSearch = (p) => h(Icon, p, h('circle', { cx: 11, cy: 11, r: 6.5 }), h('path', { d: 'M16 16l4.2 4.2' }));
    const IconTrash = (p) => h(Icon, p, h('path', { d: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12' }));
    const IconDownload = (p) => h(Icon, p, h('path', { d: 'M12 4v11M7.5 10.5L12 15l4.5-4.5' }), h('path', { d: 'M5 19h14' }));
    const IconCopy = (p) =>
      h(Icon, p, h('rect', { x: 9, y: 9, width: 11, height: 11, rx: 2.2 }), h('path', { d: 'M15 9V6.2A2.2 2.2 0 0 0 12.8 4H6.2A2.2 2.2 0 0 0 4 6.2v6.6A2.2 2.2 0 0 0 6.2 15H9' }));
    const IconCheck = (p) => h(Icon, p, h('path', { d: 'M5 12.5l4.5 4.5L19 7' }));
    const IconLink = (p) =>
      h(Icon, p, h('path', { d: 'M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.2 1.2' }), h('path', { d: 'M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.2-1.2' }));

    function NotebookIcon(props) {
      const size = props.size || 18;
      const active = props.active === true;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('rect', { x: 4.6, y: 3, width: 14.8, height: 18, rx: 2.4, stroke: 'currentColor', strokeWidth: active ? 2 : 1.6 }),
        h('path', {
          d: 'M8.6 7h6.8M8.6 11h6.8M8.6 15h4.4',
          stroke: 'currentColor',
          strokeWidth: active ? 1.8 : 1.4,
          strokeLinecap: 'round',
          opacity: active ? 1 : 0.75,
        }),
        h('path', {
          d: 'M4.6 7.4h-1M4.6 12h-1M4.6 16.6h-1',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          opacity: active ? 0.9 : 0.5,
        }),
      );
    }

    /* -------------------------------------------------------------------- css */

    const CSS = `
/* Notebook panel — the Harness page shell, control metrics and semantic tokens. */
.dsh-nb-root {
  width: 100%; min-width: 0; height: 100%; min-height: 0;
  display: flex; overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 14px; line-height: 1.6;
}
.dsh-nb-root *, .dsh-nb-root *::before, .dsh-nb-root *::after { box-sizing: border-box; }
.dsh-nb-root ::-webkit-scrollbar { width: 9px; height: 9px; }
.dsh-nb-root ::-webkit-scrollbar-thumb { background: var(--dsw-alias-scrollbar-bg-l2); border: 2px solid transparent; background-clip: content-box; border-radius: 8px; }
.dsh-nb-root ::-webkit-scrollbar-thumb:hover { background: var(--dsw-alias-scrollbar-hover-l2); background-clip: content-box; }

/* rail ------------------------------------------------------------------ */
.dsh-nb-rail {
  width: 246px; flex: none; min-height: 0;
  display: flex; flex-direction: column;
  border-right: .5px solid var(--dsw-alias-border-l1);
}
.dsh-nb-railHead { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 18px 12px 8px 14px; }
[data-platform=darwin] .dsh-nb-railHead { padding-top: calc(18px + var(--dsh-frame-top-clearance, 0px)); }
.dsh-nb-railLabel { display: inline-flex; align-items: center; gap: 6px; min-width: 0; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 15px; letter-spacing: .04em; text-transform: uppercase; }
.dsh-nb-count { min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); font-size: 11px; line-height: 16px; text-align: center; }
.dsh-nb-iconBtn { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
.dsh-nb-iconBtn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.dsh-nb-search { display: flex; align-items: center; gap: 6px; margin: 0 10px 8px; padding: 0 8px; height: 28px; border: .5px solid var(--dsw-alias-border-l1); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-tertiary); }
.dsh-nb-search:focus-within { border-color: var(--dsw-alias-border-l3); }
.dsh-nb-search input { flex: 1 1 auto; min-width: 0; height: 100%; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; outline: none; }
.dsh-nb-search input::placeholder { color: var(--dsw-alias-label-caption); }
.dsh-nb-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 2px 8px 8px; display: flex; flex-direction: column; gap: 2px; }
.dsh-nb-listEmpty { padding: 18px 8px; color: var(--dsw-alias-label-tertiary); font-size: 12.5px; line-height: 19px; }
.dsh-nb-note { position: relative; border-radius: 8px; }
.dsh-nb-note:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-nb-note.active { background: var(--dsw-alias-interactive-bg-active); }
.dsh-nb-noteMain { display: block; width: 100%; padding: 7px 28px 8px 9px; border: 0; border-radius: 8px; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.dsh-nb-noteTitle { display: block; font-size: 13px; line-height: 19px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dsh-nb-noteMeta { display: block; font-size: 12px; line-height: 17px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dsh-nb-noteDate { display: block; margin-top: 2px; font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-caption); }
.dsh-nb-noteDel { position: absolute; top: 6px; right: 5px; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: 0; border-radius: 5px; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; opacity: 0; }
.dsh-nb-note:hover .dsh-nb-noteDel, .dsh-nb-note.active .dsh-nb-noteDel, .dsh-nb-noteDel:focus-visible { opacity: 1; }
.dsh-nb-noteDel:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-state-error-primary); }
.dsh-nb-confirm { position: absolute; right: 4px; bottom: 4px; display: flex; gap: 4px; padding: 2px; border-radius: 6px; background: var(--dsw-alias-bg-overlay); border: .5px solid var(--dsw-alias-border-l2); }
.dsh-nb-mini { border: 0; border-radius: 5px; padding: 2px 7px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11.5px; line-height: 17px; cursor: pointer; }
.dsh-nb-mini:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-nb-mini.danger { color: var(--dsw-alias-state-error-primary); }
.dsh-nb-railFoot { flex: none; padding: 8px 10px 14px; border-top: .5px solid var(--dsw-alias-border-l1); }
.dsh-nb-railFoot .dsh-nb-btn { width: 100%; }

/* main ------------------------------------------------------------------ */
.dsh-nb-main { flex: 1 1 auto; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.dsh-nb-top { flex: none; padding: 22px clamp(18px, 3vw, 36px) 0; }
[data-platform=darwin] .dsh-nb-top { padding-top: calc(22px + var(--dsh-frame-top-clearance, 0px)); }
.dsh-nb-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px 16px; }
.dsh-nb-headText { min-width: 0; flex: 1 1 auto; }
.dsh-nb-title { width: 100%; padding: 0; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 20px; line-height: 28px; font-weight: 500; outline: none; }
.dsh-nb-title::placeholder { color: var(--dsw-alias-label-caption); }
.dsh-nb-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 6px; }
.dsh-nb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 28px; padding: 0 10px; border: .5px solid var(--dsw-alias-border-l3); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; line-height: 18px; white-space: nowrap; cursor: pointer; }
.dsh-nb-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-nb-btn.icon { width: 28px; padding: 0; }
.dsh-nb-btn.primary { border-color: transparent; background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); }
.dsh-nb-btn.primary:hover { background: var(--dsw-alias-button-primary-hover); }
.dsh-nb-btn.ok { border-color: currentColor; color: var(--dsw-alias-state-success-primary); }
.dsh-nb-seg { display: inline-flex; border: .5px solid var(--dsw-alias-border-l3); border-radius: 7px; overflow: hidden; }
.dsh-nb-seg button { height: 26px; padding: 0 9px; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer; }
.dsh-nb-seg button + button { border-left: .5px solid var(--dsw-alias-border-l1); }
.dsh-nb-seg button:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-nb-seg button.on { background: var(--dsw-alias-interactive-bg-active); color: var(--dsw-alias-label-primary); }
.dsh-nb-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 1px; margin-top: 10px; padding: 5px 0; border-top: .5px solid var(--dsw-alias-border-l1); border-bottom: .5px solid var(--dsw-alias-border-l1); }
.dsh-nb-tool { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 26px; padding: 0 4px; border: 0; border-radius: 5px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; cursor: pointer; }
.dsh-nb-tool:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.dsh-nb-tool:disabled { opacity: .4; cursor: default; }
.dsh-nb-glyph { font-size: 12px; line-height: 1; }
.dsh-nb-glyph.bold { font-weight: 700; }
.dsh-nb-glyph.italic { font-style: italic; }
.dsh-nb-glyph.strike { text-decoration: line-through; }
.dsh-nb-glyph.code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }
.dsh-nb-sep { width: .5px; height: 16px; margin: 0 4px; background: var(--dsw-alias-border-l2); }

/* editor + preview ------------------------------------------------------ */
.dsh-nb-body { flex: 1 1 auto; min-height: 0; display: flex; }
.dsh-nb-editor { flex: 1 1 50%; min-width: 0; min-height: 0; padding: 16px clamp(18px, 3vw, 36px) 28px; border: 0; outline: none; resize: none; background: transparent; color: var(--dsw-alias-label-primary); caret-color: var(--dsw-alias-brand-primary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13.5px; line-height: 1.75; tab-size: 2; }
.dsh-nb-body[data-mode=write] .dsh-nb-editor { flex-basis: 100%; }
.dsh-nb-editor::placeholder { color: var(--dsw-alias-label-caption); }
.dsh-nb-preview { flex: 1 1 50%; min-width: 0; min-height: 0; overflow-y: auto; scrollbar-gutter: stable; padding: 16px clamp(18px, 3vw, 36px) 32px; border-left: .5px solid var(--dsw-alias-border-l1); }
.dsh-nb-body[data-mode=preview] .dsh-nb-preview { flex-basis: 100%; border-left: 0; }
.dsh-nb-previewEmpty { color: var(--dsw-alias-label-tertiary); font-size: 13px; }

/* rendered markdown ----------------------------------------------------- */
.dsh-nb-md { max-width: 760px; overflow-wrap: anywhere; font-size: 14px; line-height: 1.75; color: var(--dsw-alias-label-primary); }
.dsh-nb-md > :first-child { margin-top: 0; }
.dsh-nb-md h1, .dsh-nb-md h2, .dsh-nb-md h3, .dsh-nb-md h4, .dsh-nb-md h5, .dsh-nb-md h6 { margin: 22px 0 8px; font-weight: 600; line-height: 1.35; }
.dsh-nb-md h1 { font-size: 24px; }
.dsh-nb-md h2 { font-size: 19px; }
.dsh-nb-md h3 { font-size: 16px; }
.dsh-nb-md h4 { font-size: 14.5px; }
.dsh-nb-md h5, .dsh-nb-md h6 { font-size: 13.5px; color: var(--dsw-alias-label-secondary); }
.dsh-nb-md p { margin: 0 0 12px; }
.dsh-nb-md a { color: var(--dsw-alias-brand-primary); text-decoration: none; }
.dsh-nb-md a:hover { text-decoration: underline; }
.dsh-nb-md strong { font-weight: 600; }
.dsh-nb-md code { padding: 1px 5px; border-radius: 5px; background: var(--dsw-alias-bg-layer-2); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
.dsh-nb-md pre { margin: 0 0 14px; padding: 12px 14px; border-radius: var(--dsw-radius-md, 8px); background: var(--dsw-alias-bg-layer-2); overflow-x: auto; }
.dsh-nb-md pre code { padding: 0; background: transparent; font-size: 12.5px; line-height: 1.65; white-space: pre; }
.dsh-nb-md blockquote { margin: 0 0 14px; padding: 2px 0 2px 12px; border-left: 2px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-secondary); }
.dsh-nb-md blockquote p { margin: 0; }
.dsh-nb-md ul, .dsh-nb-md ol { margin: 0 0 14px; padding-left: 22px; }
.dsh-nb-md li { margin: 3px 0; }
.dsh-nb-md li.dsh-nb-task { display: flex; gap: 7px; align-items: flex-start; margin-left: -20px; list-style: none; }
.dsh-nb-md .dsh-nb-check { flex: none; width: 14px; height: 14px; margin-top: 3px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 4px; color: var(--dsw-alias-button-primary-fill); font-size: 10px; line-height: 12px; text-align: center; }
.dsh-nb-md hr { height: 0; margin: 20px 0; border: 0; border-top: .5px solid var(--dsw-alias-border-l2); }
.dsh-nb-md table { width: 100%; margin: 0 0 14px; border-collapse: collapse; font-size: 13px; }
.dsh-nb-md th, .dsh-nb-md td { padding: 6px 10px; border: .5px solid var(--dsw-alias-border-l1); text-align: left; }
.dsh-nb-md th { background: var(--dsw-alias-bg-layer-2); font-weight: 500; }
.dsh-nb-md img { max-width: 100%; border-radius: 6px; }

/* status + empty -------------------------------------------------------- */
.dsh-nb-status { flex: none; display: flex; align-items: center; gap: 9px; padding: 7px clamp(18px, 3vw, 36px); border-top: .5px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 17px; }
.dsh-nb-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); }
.dsh-nb-spacer { flex: 1 1 auto; }
.dsh-nb-save { white-space: nowrap; }
.dsh-nb-empty { flex: 1 1 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 40px 24px; text-align: center; }
.dsh-nb-emptyGlyph { color: var(--dsw-alias-label-tertiary); opacity: .8; }
.dsh-nb-empty h1 { margin: 0; font-size: 18px; font-weight: 500; line-height: 26px; }
.dsh-nb-empty p { max-width: 380px; margin: 0 0 6px; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 21px; }

@media (max-width: 820px) { .dsh-nb-rail { display: none; } }
@media (max-width: 1080px) { .dsh-nb-body[data-mode=split] .dsh-nb-preview { border-left: 0; } }
`;

    /* ------------------------------------------------------------------ hooks */

    function useLocaleTick(locale) {
      const [, setTick] = useState(0);
      useEffect(() => {
        if (!locale || typeof locale.subscribe !== 'function') return undefined;
        let live = true;
        const unsubscribe = locale.subscribe(() => {
          if (live) setTick((value) => value + 1);
        });
        return () => {
          live = false;
          if (typeof unsubscribe === 'function') unsubscribe();
        };
      }, [locale]);
    }

    /* ------------------------------------------------------------------ panel */

    function NotebookPanel(props) {
      const t = props.t;
      const locale = props.locale;
      useLocaleTick(locale);

      const [doc, setDoc] = useState(() => loadDocument(t));
      const [mode, setMode] = useState('split');
      const [query, setQuery] = useState('');
      const [saveState, setSaveState] = useState('idle');
      const [copied, setCopied] = useState(false);
      const [pendingDelete, setPendingDelete] = useState(null);

      const editorRef = useRef(null);
      const titleRef = useRef(null);
      const pendingSelection = useRef(null);
      const focusTitleNext = useRef(false);
      const copiedTimer = useRef(null);

      const notes = doc.notes;
      const active = notes.find((note) => note.id === doc.activeId) || notes[0] || null;
      const body = active ? active.body : '';
      const deferredBody = useDeferred(body);
      const previewHtml = useMemo(() => renderMarkdown(deferredBody), [deferredBody]);

      useEffect(() => {
        setSaveState('saving');
        const timer = setTimeout(() => {
          setSaveState(persistDocument(doc) ? 'saved' : 'error');
        }, 450);
        return () => clearTimeout(timer);
      }, [doc]);

      useEffect(() => {
        const selection = pendingSelection.current;
        if (!selection) return;
        pendingSelection.current = null;
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        try {
          editor.setSelectionRange(selection[0], selection[1]);
        } catch (error) {
          /* the element may have unmounted */
        }
      }, [body]);

      useEffect(() => {
        if (!focusTitleNext.current) return;
        focusTitleNext.current = false;
        const input = titleRef.current;
        if (!input) return;
        input.focus();
        input.select();
      }, [doc.activeId]);

      useEffect(() => () => {
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
      }, []);

      const mutateActive = useCallback((patch) => {
        setDoc((current) => {
          if (!current.activeId) return current;
          const now = Date.now();
          return {
            ...current,
            notes: current.notes.map((note) => (note.id === current.activeId ? { ...note, ...patch, updatedAt: now } : note)),
          };
        });
      }, []);

      const setBody = (text) => mutateActive({ body: text });
      const setTitle = (value) => mutateActive({ title: value });

      const openNote = (id) => setDoc((current) => ({ ...current, activeId: id }));

      const createNote = () => {
        const now = Date.now();
        const note = { id: uid(), title: '', body: '', createdAt: now, updatedAt: now };
        focusTitleNext.current = true;
        setPendingDelete(null);
        setQuery('');
        setMode('write');
        setDoc((current) => ({ notes: [note, ...current.notes], activeId: note.id }));
      };

      const deleteNote = (id) => {
        setPendingDelete(null);
        setDoc((current) => {
          const remaining = current.notes.filter((note) => note.id !== id);
          return {
            notes: remaining,
            activeId: current.activeId === id ? (remaining[0] ? remaining[0].id : null) : current.activeId,
          };
        });
      };

      const applyEdit = (transform) => {
        if (!active) return;
        const editor = editorRef.current;
        const start = editor ? editor.selectionStart == null ? body.length : editor.selectionStart : body.length;
        const end = editor ? editor.selectionEnd == null ? start : editor.selectionEnd : start;
        const result = transform(body, start, end);
        if (!result) return;
        if (result.sel) pendingSelection.current = result.sel;
        setBody(result.text);
      };

      const exportActive = () => {
        if (!active) return;
        try {
          downloadText(fileNameFor(active.title), markdownFor(active));
        } catch (error) {
          console.error('notebook: could not export the note', error);
        }
      };

      const exportAllNotes = () => {
        if (notes.length === 0) return;
        const stamp = new Date().toISOString().slice(0, 10);
        try {
          downloadText('notebook-' + stamp + '.md', allMarkdown(notes));
        } catch (error) {
          console.error('notebook: could not export all notes', error);
        }
      };

      const copyActive = async () => {
        if (!active) return;
        const ok = await copyText(markdownFor(active));
        if (!ok) return;
        setCopied(true);
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), 1600);
      };

      const onEditorKeyDown = (event) => {
        const mod = event.metaKey || event.ctrlKey;
        const key = String(event.key || '').toLowerCase();
        if (mod && !event.altKey && key === 'b') {
          event.preventDefault();
          applyEdit((text, start, end) => toggleWrap(text, start, end, '**'));
          return;
        }
        if (mod && !event.altKey && key === 'i') {
          event.preventDefault();
          applyEdit((text, start, end) => toggleWrap(text, start, end, '*'));
          return;
        }
        if (mod && !event.altKey && key === 'e') {
          event.preventDefault();
          applyEdit((text, start, end) => toggleWrap(text, start, end, '`'));
          return;
        }
        if (mod && !event.altKey && key === 'k') {
          event.preventDefault();
          applyEdit((text, start, end) => insertLink(text, start, end));
          return;
        }
        if (mod && event.shiftKey && key === 'x') {
          event.preventDefault();
          applyEdit((text, start, end) => toggleWrap(text, start, end, '~~'));
          return;
        }
        if (mod && key === 's') {
          event.preventDefault();
          exportActive();
          return;
        }
        if (event.key === 'Tab') {
          event.preventDefault();
          const editor = event.currentTarget;
          editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
          setBody(editor.value);
          return;
        }
        if (event.key === 'Enter' && !event.shiftKey) {
          const editor = event.currentTarget;
          const result = continueList(body, editor.selectionStart, editor.selectionEnd);
          if (result) {
            event.preventDefault();
            pendingSelection.current = result.sel;
            setBody(result.text);
          }
        }
      };

      const trimmedQuery = query.trim().toLowerCase();
      const visibleNotes = trimmedQuery
        ? notes.filter((note) => (note.title + '\n' + note.body).toLowerCase().includes(trimmedQuery))
        : notes;

      const words = body.trim() ? body.trim().split(/\s+/).length : 0;
      const characters = body.length;
      const lineCount = body ? body.split('\n').length : 0;
      const readMinutes = Math.max(1, Math.round(words / 220));
      const saveText = saveState === 'saving' ? t('saving') : saveState === 'error' ? t('saveFailed') : saveState === 'saved' ? t('saved') : '';

      const toolGroups = [
        [
          { key: 'h1', label: 'H1', title: t('toolbarH1'), run: () => applyEdit((text, start, end) => toggleLinePrefix(text, start, end, '# ')) },
          { key: 'h2', label: 'H2', title: t('toolbarH2'), run: () => applyEdit((text, start, end) => toggleLinePrefix(text, start, end, '## ')) },
          { key: 'h3', label: 'H3', title: t('toolbarH3'), run: () => applyEdit((text, start, end) => toggleLinePrefix(text, start, end, '### ')) },
        ],
        [
          { key: 'bold', label: 'B', cls: 'bold', title: t('toolbarBold'), run: () => applyEdit((text, start, end) => toggleWrap(text, start, end, '**')) },
          { key: 'italic', label: 'I', cls: 'italic', title: t('toolbarItalic'), run: () => applyEdit((text, start, end) => toggleWrap(text, start, end, '*')) },
          { key: 'strike', label: 'S', cls: 'strike', title: t('toolbarStrike'), run: () => applyEdit((text, start, end) => toggleWrap(text, start, end, '~~')) },
          { key: 'code', label: '</>', cls: 'code', title: t('toolbarCode'), run: () => applyEdit((text, start, end) => toggleWrap(text, start, end, '`')) },
          { key: 'link', title: t('toolbarLink'), icon: IconLink, run: () => applyEdit((text, start, end) => insertLink(text, start, end)) },
        ],
        [
          { key: 'quote', label: '“', title: t('toolbarQuote'), run: () => applyEdit((text, start, end) => toggleLinePrefix(text, start, end, '> ')) },
          { key: 'bullet', label: '•', title: t('toolbarBullet'), run: () => applyEdit((text, start, end) => toggleLinePrefix(text, start, end, '- ')) },
          { key: 'numbered', label: '1.', title: t('toolbarNumbered'), run: () => applyEdit((text, start, end) => toggleLinePrefix(text, start, end, '', true)) },
          { key: 'task', label: '☑', title: t('toolbarTask'), run: () => applyEdit((text, start, end) => toggleLinePrefix(text, start, end, '- [ ] ')) },
        ],
        [
          { key: 'block', label: '{ }', cls: 'code', title: t('toolbarCodeBlock'), run: () => applyEdit((text, start, end) => insertCodeBlock(text, start, end)) },
          { key: 'hr', label: '—', title: t('toolbarHr'), run: () => applyEdit((text, start, end) => insertBlock(text, start, end, '---')) },
          { key: 'table', label: '▦', title: t('toolbarTable'), run: () => applyEdit((text, start, end) => insertTable(text, start, end)) },
        ],
      ];

      const toolbar = h(
        'div',
        { className: 'dsh-nb-toolbar', role: 'toolbar', 'aria-label': t('shortcuts') },
        ...toolGroups.flatMap((group, groupIndex) => {
          const buttons = group.map((item) =>
            h(
              'button',
              {
                key: item.key,
                type: 'button',
                className: 'dsh-nb-tool',
                title: item.title,
                'aria-label': item.title,
                disabled: mode === 'preview',
                onMouseDown: (event) => event.preventDefault(),
                onClick: item.run,
              },
              item.icon ? h(item.icon, { size: 14 }) : h('span', { className: 'dsh-nb-glyph ' + (item.cls || '') }, item.label),
            ),
          );
          if (groupIndex === 0) return buttons;
          return [h('span', { key: 'sep-' + groupIndex, className: 'dsh-nb-sep', 'aria-hidden': true }), ...buttons];
        }),
      );

      const modeControl = h(
        'div',
        { className: 'dsh-nb-seg', role: 'group', 'aria-label': t('title') },
        ...[
          { key: 'write', label: t('write') },
          { key: 'split', label: t('split') },
          { key: 'preview', label: t('preview') },
        ].map((option) =>
          h(
            'button',
            {
              key: option.key,
              type: 'button',
              className: mode === option.key ? 'on' : undefined,
              'aria-pressed': mode === option.key,
              onClick: () => setMode(option.key),
            },
            option.label,
          ),
        ),
      );

      const rail = h(
        'aside',
        { className: 'dsh-nb-rail' },
        h(
          'div',
          { className: 'dsh-nb-railHead' },
          h('span', { className: 'dsh-nb-railLabel' }, t('notes'), h('span', { className: 'dsh-nb-count' }, String(notes.length))),
          h(
            'button',
            { type: 'button', className: 'dsh-nb-iconBtn', title: t('newNote'), 'aria-label': t('newNote'), onClick: createNote },
            h(IconPlus, { size: 15 }),
          ),
        ),
        h(
          'label',
          { className: 'dsh-nb-search' },
          h(IconSearch, { size: 13 }),
          h('input', {
            value: query,
            placeholder: t('searchPlaceholder'),
            'aria-label': t('search'),
            onChange: (event) => setQuery(event.target.value),
          }),
        ),
        h(
          'div',
          { className: 'dsh-nb-list' },
          visibleNotes.length === 0
            ? h('div', { className: 'dsh-nb-listEmpty' }, trimmedQuery ? t('noMatches') : t('noNotes'))
            : visibleNotes.map((note) =>
                h(
                  'div',
                  { key: note.id, className: 'dsh-nb-note' + (active && note.id === active.id ? ' active' : '') },
                  h(
                    'button',
                    { type: 'button', className: 'dsh-nb-noteMain', title: note.title || t('untitled'), onClick: () => openNote(note.id) },
                    h('span', { className: 'dsh-nb-noteTitle' }, note.title || t('untitled')),
                    h('span', { className: 'dsh-nb-noteMeta' }, previewOf(note)),
                    h('span', { className: 'dsh-nb-noteDate' }, timeLabel(note.updatedAt)),
                  ),
                  pendingDelete === note.id
                    ? h(
                        'div',
                        { className: 'dsh-nb-confirm' },
                        h('button', { type: 'button', className: 'dsh-nb-mini danger', onClick: () => deleteNote(note.id) }, t('delete')),
                        h('button', { type: 'button', className: 'dsh-nb-mini', onClick: () => setPendingDelete(null) }, t('cancel')),
                      )
                    : h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-nb-noteDel',
                          title: t('delete'),
                          'aria-label': t('delete'),
                          onClick: () => setPendingDelete(note.id),
                        },
                        h(IconTrash, { size: 13 }),
                      ),
                ),
              ),
        ),
        notes.length > 1
          ? h(
              'div',
              { className: 'dsh-nb-railFoot' },
              h('button', { type: 'button', className: 'dsh-nb-btn', title: t('exportAll'), onClick: exportAllNotes }, h(IconDownload, { size: 14 }), t('exportAll')),
            )
          : null,
      );

      if (!active) {
        return h(
          'div',
          { className: 'dsh-nb-root' },
          h('style', null, CSS),
          rail,
          h(
            'section',
            { className: 'dsh-nb-main' },
            h(
              'div',
              { className: 'dsh-nb-empty' },
              h('div', { className: 'dsh-nb-emptyGlyph' }, h(NotebookIcon, { size: 34 })),
              h('h1', null, t('noNotes')),
              h('p', null, t('noNotesBody')),
              h('button', { type: 'button', className: 'dsh-nb-btn primary', onClick: createNote }, h(IconPlus, { size: 14 }), t('createFirst')),
            ),
          ),
        );
      }

      const header = h(
        'div',
        { className: 'dsh-nb-top' },
        h(
          'div',
          { className: 'dsh-nb-head' },
          h(
            'div',
            { className: 'dsh-nb-headText' },
            h('input', {
              ref: titleRef,
              className: 'dsh-nb-title',
              value: active.title,
              placeholder: t('titlePlaceholder'),
              maxLength: MAX_TITLE,
              'aria-label': t('titleLabel'),
              onChange: (event) => setTitle(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'dsh-nb-actions' },
            modeControl,
            h('button', { type: 'button', className: 'dsh-nb-btn', title: t('exportMd'), onClick: exportActive }, h(IconDownload, { size: 14 }), t('exportMd')),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-nb-btn icon' + (copied ? ' ok' : ''),
                title: copied ? t('copied') : t('copyMd'),
                'aria-label': copied ? t('copied') : t('copyMd'),
                onClick: copyActive,
              },
              copied ? h(IconCheck, { size: 14 }) : h(IconCopy, { size: 14 }),
            ),
          ),
        ),
        toolbar,
      );

      const editor = h('textarea', {
        ref: editorRef,
        className: 'dsh-nb-editor',
        value: body,
        placeholder: t('placeholder'),
        spellCheck: true,
        'aria-label': t('editorLabel'),
        onChange: (event) => setBody(event.target.value),
        onKeyDown: onEditorKeyDown,
      });

      const preview = h(
        'div',
        { className: 'dsh-nb-preview' },
        previewHtml ? h('div', { className: 'dsh-nb-md', dangerouslySetInnerHTML: { __html: previewHtml } }) : h('div', { className: 'dsh-nb-previewEmpty' }, t('previewEmpty')),
      );

      const status = h(
        'div',
        { className: 'dsh-nb-status' },
        h('span', null, words + ' ' + (words === 1 ? t('word') : t('words'))),
        h('span', { className: 'dsh-nb-dot', 'aria-hidden': true }),
        h('span', null, characters + ' ' + t('characters')),
        h('span', { className: 'dsh-nb-dot', 'aria-hidden': true }),
        h('span', null, lineCount + ' ' + t('lines')),
        h('span', { className: 'dsh-nb-dot', 'aria-hidden': true }),
        h('span', null, '~' + readMinutes + ' ' + t('minRead')),
        h('span', { className: 'dsh-nb-spacer' }),
        h('span', { className: 'dsh-nb-save', 'aria-live': 'polite' }, saveText),
      );

      return h(
        'div',
        { className: 'dsh-nb-root' },
        h('style', null, CSS),
        rail,
        h(
          'section',
          { className: 'dsh-nb-main' },
          header,
          h(
            'div',
            { className: 'dsh-nb-body', 'data-mode': mode },
            mode === 'preview' ? null : editor,
            mode === 'write' ? null : preview,
          ),
          status,
        ),
      );
    }

    /* ------------------------------------------------------------------ apply */

    return {
      inject: ['slots'],
      apply(ctx) {
        const warn = (label, error) => {
          try {
            console.error('notebook: ' + label + ' failed — ' + String(error && error.message ? error.message : error));
          } catch (loggingError) {
            /* logging must not throw either */
          }
        };
        const safely = (label, register) => {
          try {
            return register();
          } catch (error) {
            warn(label, error);
            return undefined;
          }
        };
        const service = (name) => {
          try {
            if (typeof ctx.get === 'function') {
              const found = ctx.get(name);
              if (found !== undefined && found !== null) return found;
            }
          } catch (error) {
            /* not reachable that way */
          }
          try {
            return ctx[name];
          } catch (error) {
            return undefined;
          }
        };

        const locale = safely('locale lookup', () => service('locale'));
        const translate = locale && typeof locale.bind === 'function' ? locale.bind(NS) : null;
        const fallback = (key) => {
          let language = 'en';
          try {
            if (locale && typeof locale.getLocale === 'function') language = locale.getLocale().id || 'en';
          } catch (error) {
            /* keep English */
          }
          const table = dictFor(language);
          if (table[key] !== undefined) return table[key];
          return dictEn[key] !== undefined ? dictEn[key] : key;
        };
        const t = (key) => {
          if (translate) {
            try {
              const value = translate(key);
              if (typeof value === 'string' && value.length > 0 && value !== key) return value;
            } catch (error) {
              /* fall back to the bundled dictionary */
            }
          }
          return fallback(key);
        };

        const addDictionary = (language, table) => {
          if (!locale || typeof locale.register !== 'function') return () => {};
          try {
            const dispose = locale.register(NS, language, table);
            return typeof dispose === 'function' ? dispose : () => {};
          } catch (error) {
            if (!/already/i.test(String(error && error.message ? error.message : error))) warn('dictionary ' + language, error);
            return () => {};
          }
        };

        safely('dictionaries', () =>
          ctx.effect(() => {
            const disposers = [addDictionary('en', dictEn), addDictionary('tr', dictTr)];
            return () => {
              for (const dispose of disposers) {
                try {
                  dispose();
                } catch (error) {
                  /* already gone */
                }
              }
            };
          }, 'notebook: dictionaries'),
        );

        safely('main panel', () =>
          ctx.slots.inject('main', () =>
            ctx.slots.register({ name: 'main', key: 'notebook' }, (props) => h(NotebookPanel, { ...props, t, locale })),
          ),
        );

        safely('sidebar entry', () =>
          ctx.slots.inject('sidebar.panellist', () =>
            ctx.slots.register({ name: 'sidebar.panellist', id: 'notebook', order: 30, label: () => t('panel') }, NotebookIcon),
          ),
        );
      },
    };
  },
});
