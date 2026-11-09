import { Editor } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import { BulletList, ListItem } from '@tiptap/extension-list';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';

// Edytor treści wpisu w kreatorze. Zna tylko pogrubienie, nagłówek, listę punktowaną i link:
// wszystko inne (kolory, czcionki, tabele, obrazki) znika przy wklejaniu, bo edytor nie ma
// na to miejsca. Dzięki temu wpis to czysta treść, a wygląd ustala szablon strony.
// Nowe formatowanie = nowe rozszerzenie tutaj + przycisk w src/pages/redakcja/index.astro.

// Wpis ma jeden tytuł (h1 na stronie wpisu), więc w treści jest jeden poziom nagłówka.
// Nagłówki dowolnego poziomu wklejone z innych dokumentów stają się takim nagłówkiem.
const SectionHeading = Heading.extend({
  parseHTML: () => [1, 2, 3, 4, 5, 6].map((level) => ({ tag: `h${level}`, attrs: { level: 2 } })),
}).configure({ levels: [2] });

export function createEditor(element: HTMLElement, markdown: string, onChange: (markdown: string) => void, attributes: Record<string, string> = {}) {
  return new Editor({
    element,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      SectionHeading,
      BulletList,
      ListItem,
      Link.configure({ openOnClick: false, defaultProtocol: 'https' }),
      UndoRedo,
      Markdown,
    ],
    content: markdown,
    contentType: 'markdown',
    editorProps: { attributes },
    onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
  });
}
