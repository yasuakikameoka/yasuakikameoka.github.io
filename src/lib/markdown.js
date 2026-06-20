import { escapeHtml } from './escape.js';

export function extractSection(markdown, heading) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const target = heading.trim().toLowerCase();
  let start = -1;
  let level = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) continue;
    if (match[2].trim().toLowerCase() === target) {
      start = i + 1;
      level = match[1].length;
      break;
    }
  }

  if (start === -1) return '';

  const sectionLines = [];
  for (let i = start; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+/);
    if (match && match[1].length <= level) break;
    sectionLines.push(lines[i]);
  }

  return sectionLines.join('\n').trim();
}

export function summaryFromConcept(concept) {
  if (concept.summary_override && concept.summary_override.trim()) {
    return concept.summary_override.trim();
  }

  const summary = extractSection(concept.body_markdown, 'Summary');
  if (summary) return plainText(summary);

  return plainText(concept.body_markdown).slice(0, 90);
}

export function renderConceptMarkdown(markdown) {
  const epigraph = extractSection(markdown, 'Epigraph');
  const summary = extractSection(markdown, 'Summary');
  const body = extractSection(markdown, 'Body');
  const parts = [];

  if (epigraph) {
    parts.push(`<div class="concept-epigraph">
  ${indent(renderMarkdown(epigraph), 2)}
</div>`);
  }

  if (summary) {
    parts.push(`<p class="concept-summary">${escapeHtml(plainText(summary))}</p>`);
  }

  parts.push(renderMarkdown(body || markdown));

  return parts.filter(Boolean).join('\n\n');
}

export function renderMarkdown(markdown) {
  const blocks = String(markdown ?? '').trim().split(/\n{2,}/).filter(Boolean);

  return blocks.map((block) => {
    const heading = block.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      return `<h${level}>${escapeHtml(heading[2].trim())}</h${level}>`;
    }

    if (block.split(/\r?\n/).every((line) => line.startsWith('\t'))) {
      const lines = block.split(/\r?\n/)
        .map((line) => line.replace(/^\t/, '').trim())
        .filter(Boolean)
        .map((line) => `<p>${renderInlineMarkdown(line)}</p>`);
      return `<aside class="supplement">\n${lines.join('\n')}\n</aside>`;
    }

    if (block.split(/\r?\n/).every((line) => line.trim().startsWith('>'))) {
      const lines = block.split(/\r?\n/)
        .map((line) => line.trim().replace(/^>\s?/, '').trim())
        .filter(Boolean)
        .map((line) => `<p>${renderInlineMarkdown(line)}</p>`);
      return `<blockquote>\n${lines.join('\n')}\n</blockquote>`;
    }

    const lines = block.split(/\r?\n/);
    if (lines.some((line) => line.trim().startsWith('>'))) {
      return renderMixedQuoteBlock(lines);
    }

    if (lines.every((line) => parseListLine(line))) {
      return renderList(lines);
    }

    const paragraphLines = lines.map((line) => renderInlineMarkdown(line.trim())).filter(Boolean);
    return `<p>${paragraphLines.join('<br>')}</p>`;
  }).join('\n\n');
}

function renderMixedQuoteBlock(lines) {
  const groups = [];
  let current = [];
  let currentIsQuote = null;

  for (const line of lines) {
    const isQuote = line.trim().startsWith('>');
    if (current.length > 0 && isQuote !== currentIsQuote) {
      groups.push(current.join('\n'));
      current = [];
    }

    current.push(line);
    currentIsQuote = isQuote;
  }

  if (current.length > 0) {
    groups.push(current.join('\n'));
  }

  return renderMarkdown(groups.join('\n\n'));
}

function renderResonances(markdown) {
  const blocks = String(markdown ?? '').trim().split(/\n{2,}/).filter(Boolean);
  const sections = [];
  let current = null;
  const preamble = [];

  for (const block of blocks) {
    const heading = block.match(/^###\s+(.+)$/);
    if (heading) {
      current = {
        title: heading[1].trim(),
        body: [],
      };
      sections.push(current);
      continue;
    }

    if (current) {
      current.body.push(block);
    } else {
      preamble.push(block);
    }
  }

  const rendered = [];
  if (preamble.length > 0) {
    rendered.push(renderMarkdown(preamble.join('\n\n')));
  }

  for (const section of sections) {
    rendered.push(`<section class="resonance-block">
  <h3>${escapeHtml(section.title)}</h3>
  <div class="resonance-body">
    ${indent(renderMarkdown(section.body.join('\n\n')), 4)}
  </div>
</section>`);
  }

  return rendered.join('\n\n');
}

function indent(value, spaces) {
  const padding = ' '.repeat(spaces);
  return String(value).split('\n').map((line) => `${padding}${line}`).join('\n');
}

function parseListLine(line) {
  const match = String(line).match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
  if (!match) return null;

  return {
    indent: match[1].replace(/\t/g, '  ').length,
    type: /^\d+\.$/.test(match[2]) ? 'ol' : 'ul',
    text: match[3].trim(),
  };
}

function renderList(lines) {
  const first = parseListLine(lines[0]);
  const root = { type: first.type, indent: first.indent, items: [] };
  const stack = [root];

  for (const line of lines) {
    const parsed = parseListLine(line);
    if (!parsed) continue;

    while (stack.length > 1 && parsed.indent < stack[stack.length - 1].indent) {
      stack.pop();
    }

    let current = stack[stack.length - 1];
    if (parsed.indent > current.indent) {
      const parentItem = current.items[current.items.length - 1];
      const child = { type: parsed.type, indent: parsed.indent, items: [] };
      parentItem.children.push(child);
      stack.push(child);
      current = child;
    }

    current.items.push({
      text: parsed.text,
      children: [],
    });
  }

  return renderListNode(root);
}

function renderListNode(list) {
  const items = list.items.map((item) => {
    const children = item.children.map(renderListNode).join('\n');
    return `<li>${renderInlineMarkdown(item.text)}${children ? `\n${children}` : ''}</li>`;
  }).join('\n');

  return `<${list.type}>\n${items}\n</${list.type}>`;
}

function plainText(markdown) {
  return String(markdown ?? '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderInlineMarkdown(value) {
  const mathExpressions = [];
  const withMathPlaceholders = String(value).replace(/\$([^$\n]+)\$/g, (_, expression) => {
    const index = mathExpressions.push(expression.trim()) - 1;
    return `\u0000MATH${index}\u0000`;
  });

  return escapeHtml(withMathPlaceholders)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\u0000MATH(\d+)\u0000/g, (_, index) => renderInlineMath(mathExpressions[Number(index)]));
}

function renderInlineMath(expression) {
  const accessibleExpression = escapeHtml(expression);
  const formattedExpression = escapeHtml(expression)
    .replace(/([A-Za-z]+)/g, '<var>$1</var>');

  return `<span class="inline-math" role="math" aria-label="${accessibleExpression}">${formattedExpression}</span>`;
}
