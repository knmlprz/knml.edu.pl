// @vitest-environment happy-dom
// Edytor potrzebuje DOM przeglądarki; happy-dom daje go w Node, bez uruchamiania przeglądarki.
import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../src/redakcja/edytor';

let destroy = () => {};
afterEach(() => destroy());

function editorWith(markdown: string) {
  const editor = createEditor(document.createElement('div'), markdown, () => {});
  destroy = () => editor.destroy();
  return editor;
}

// Pod spodem edytora jest Markdown: to, co wczytamy, ma wrócić bez zmian,
// inaczej każde otwarcie szkicu zmieniałoby wpis.
describe('Markdown → edytor → Markdown bez zmian', () => {
  const samples = {
    akapity: 'Pierwszy akapit.\n\nDrugi akapit z polskimi znakami: zażółć gęślą jaźń.',
    pogrubienie: 'Tekst **pogrubiony** i zwykły.',
    nagłówek: '## Nagłówek\n\nTekst pod nagłówkiem.',
    lista: '- pierwszy\n- drugi z **pogrubieniem**\n- trzeci',
    link: 'Zobacz [stronę koła](https://knml.edu.pl/blog/) i wróć.',
    'wszystko naraz': '## Co zbudowaliśmy\n\nAplikację **LARKFiD**, opis na [GitHubie](https://github.com/knmlprz/).\n\n- zbieranie danych\n- [mapa](https://knml.edu.pl/)\n\n## Dalej\n\nKoniec.',
    'znaki specjalne': 'Wynik 2 \\* 3, a &lt; b oraz \\_podkreślenie\\_.',
  };

  for (const [name, markdown] of Object.entries(samples)) {
    it(name, () => {
      expect(editorWith(markdown).getMarkdown()).toBe(markdown);
    });
  }

  it('tekst wpisany jak HTML zostaje tekstem, nie znacznikiem', () => {
    const editor = editorWith('');
    editor.commands.insertContent({ type: 'text', text: 'a <script>alert(1)</script> b' });
    expect(editor.getMarkdown()).not.toContain('<script>');
  });
});

describe('wklejanie z Worda, Google Docs, innych stron', () => {
  const pasted = `
    <h1 style="color:red;font-family:'Comic Sans MS'">Tytuł z Worda</h1>
    <p><span style="color:#ff0000;font-size:28px;font-family:Arial">Kolorowy tekst</span> i <b>pogrubiony</b>,
       <i>kursywa</i>, <u>podkreślenie</u>, <a href="https://knml.edu.pl/">link</a>.</p>
    <table><tr><td>komórka 1</td><td>komórka 2</td></tr></table>
    <p><img src="https://example.com/x.png" alt="obrazek"> po obrazku</p>
    <ol><li>numerowana</li></ol>
    <ul><li>punkt</li></ul>
    <p><a href="javascript:alert(1)">groźny link</a></p>`;

  function pasteIntoEmptyEditor() {
    const editor = editorWith('');
    editor.view.pasteHTML(pasted);
    return editor;
  }

  it('zostaje tylko dozwolone formatowanie: pogrubienie, nagłówek, lista, link', () => {
    const html = pasteIntoEmptyEditor().getHTML();
    const tags = new Set([...html.matchAll(/<([a-z0-9]+)/g)].map(([, tag]) => tag));
    expect([...tags].every((tag) => ['p', 'h2', 'strong', 'ul', 'li', 'a'].includes(tag))).toBe(true);
    expect(html).not.toMatch(/style=|<img|<table|<td|<em|<u>|<h1|<ol/);
  });

  it('tekst zostaje, znika tylko wygląd', () => {
    const markdown = pasteIntoEmptyEditor().getMarkdown();
    for (const text of ['Tytuł z Worda', 'Kolorowy tekst', 'kursywa', 'komórka 1', 'komórka 2', 'po obrazku', 'numerowana']) {
      expect(markdown).toContain(text);
    }
    expect(markdown).toContain('## Tytuł z Worda');
    expect(markdown).toContain('**pogrubiony**');
    expect(markdown).toContain('[link](https://knml.edu.pl/)');
    expect(markdown).toContain('- punkt');
    expect(markdown).not.toMatch(/!\[|javascript:|color|Arial/);
  });
});
