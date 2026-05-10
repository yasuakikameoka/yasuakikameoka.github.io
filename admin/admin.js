const config = window.CMS_CONFIG;
const supabase = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey);

const state = {
  concepts: [],
  selectedId: null,
  isNew: false,
};

const elements = {
  authPanel: document.querySelector('#auth-panel'),
  authForm: document.querySelector('#auth-form'),
  authMessage: document.querySelector('#auth-message'),
  sessionStatus: document.querySelector('#session-status'),
  signOutButton: document.querySelector('#sign-out-button'),
  editorLayout: document.querySelector('#editor-layout'),
  conceptList: document.querySelector('#concept-list'),
  newConceptButton: document.querySelector('#new-concept-button'),
  refreshButton: document.querySelector('#refresh-button'),
  conceptForm: document.querySelector('#concept-form'),
  editorHeading: document.querySelector('#editor-heading'),
  saveMessage: document.querySelector('#save-message'),
  preview: document.querySelector('#preview'),
  fields: {
    title: document.querySelector('#title'),
    slug: document.querySelector('#slug'),
    sortOrder: document.querySelector('#sort_order'),
    isPublished: document.querySelector('#is_published'),
    summaryOverride: document.querySelector('#summary_override'),
    relatedTitles: document.querySelector('#related_titles'),
    bodyMarkdown: document.querySelector('#body_markdown'),
  },
};

init();

async function init() {
  const { data } = await supabase.auth.getSession();
  applySession(data.session);

  supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });

  elements.authForm.addEventListener('submit', signIn);
  elements.signOutButton.addEventListener('click', () => supabase.auth.signOut());
  elements.newConceptButton.addEventListener('click', newConcept);
  elements.refreshButton.addEventListener('click', loadConcepts);
  elements.conceptForm.addEventListener('submit', saveConcept);
  elements.fields.bodyMarkdown.addEventListener('input', updatePreview);
  elements.fields.title.addEventListener('input', maybeFillSlug);
}

async function applySession(session) {
  if (!session) {
    elements.authPanel.hidden = false;
    elements.editorLayout.hidden = true;
    elements.signOutButton.hidden = true;
    elements.sessionStatus.textContent = 'Signed out';
    return;
  }

  elements.authPanel.hidden = true;
  elements.editorLayout.hidden = false;
  elements.signOutButton.hidden = false;
  elements.sessionStatus.textContent = session.user.email ?? 'Signed in';
  await loadConcepts();
}

async function signIn(event) {
  event.preventDefault();
  setMessage(elements.authMessage, 'Signing in...');

  const form = new FormData(elements.authForm);
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    setMessage(elements.authMessage, error.message, true);
    return;
  }

  setMessage(elements.authMessage, '');
}

async function loadConcepts() {
  setMessage(elements.saveMessage, 'Loading...');
  const { data, error } = await supabase
    .from('concepts')
    .select('id,slug,title,related_titles,body_markdown,summary_override,sort_order,is_published,published_at')
    .order('sort_order', { ascending: true });

  if (error) {
    setMessage(elements.saveMessage, error.message, true);
    return;
  }

  state.concepts = data ?? [];
  state.isNew = false;
  renderConceptList();

  if (state.concepts.length > 0) {
    selectConcept(state.selectedId ?? state.concepts[0].id);
  } else {
    newConcept();
  }

  setMessage(elements.saveMessage, '');
}

function renderConceptList() {
  elements.conceptList.innerHTML = '';

  for (const concept of state.concepts) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = concept.id === state.selectedId ? 'active' : '';
    button.innerHTML = `
      ${escapeHtml(concept.title)}
      <span>${escapeHtml(concept.slug)} · ${concept.is_published ? 'published' : 'draft'}</span>
    `;
    button.addEventListener('click', () => selectConcept(concept.id));
    elements.conceptList.append(button);
  }
}

function selectConcept(id) {
  const concept = state.concepts.find((item) => item.id === id);
  if (!concept) return;

  state.selectedId = concept.id;
  state.isNew = false;
  fillForm(concept);
  renderConceptList();
}

function newConcept() {
  state.selectedId = null;
  state.isNew = true;
  fillForm({
    title: '',
    slug: '',
    sort_order: nextSortOrder(),
    summary_override: '',
    is_published: false,
    related_titles: [],
    body_markdown: '## Summary\n\n\n\n## Body\n\n',
  });
  renderConceptList();
}

function fillForm(concept) {
  elements.editorHeading.textContent = concept.title || 'New concept';
  elements.fields.title.value = concept.title ?? '';
  elements.fields.slug.value = concept.slug ?? '';
  elements.fields.sortOrder.value = concept.sort_order ?? 0;
  elements.fields.isPublished.checked = Boolean(concept.is_published);
  elements.fields.summaryOverride.value = concept.summary_override ?? '';
  elements.fields.relatedTitles.value = normalizeRelatedTitles(concept.related_titles).join(', ');
  elements.fields.bodyMarkdown.value = concept.body_markdown ?? '';
  updatePreview();
}

async function saveConcept(event) {
  event.preventDefault();
  setMessage(elements.saveMessage, 'Saving...');

  const payload = {
    title: elements.fields.title.value.trim(),
    slug: elements.fields.slug.value.trim(),
    sort_order: Number(elements.fields.sortOrder.value || 0),
    summary_override: elements.fields.summaryOverride.value.trim() || null,
    related_titles: parseRelatedTitles(elements.fields.relatedTitles.value),
    body_markdown: elements.fields.bodyMarkdown.value,
    is_published: elements.fields.isPublished.checked,
    published_at: elements.fields.isPublished.checked ? new Date().toISOString() : null,
  };

  const request = state.isNew
    ? supabase.from('concepts').insert(payload).select('id').single()
    : supabase.from('concepts').update(payload).eq('id', state.selectedId).select('id').single();

  const { data, error } = await request;

  if (error) {
    setMessage(elements.saveMessage, error.message, true);
    return;
  }

  state.selectedId = data.id;
  state.isNew = false;
  await loadConcepts();
  setMessage(elements.saveMessage, 'Saved. Run npm run build:concepts to regenerate the public pages.');
}

function updatePreview() {
  elements.preview.innerHTML = renderMarkdown(elements.fields.bodyMarkdown.value);
}

function maybeFillSlug() {
  if (!state.isNew || elements.fields.slug.value.trim()) return;
  elements.fields.slug.value = toSlug(elements.fields.title.value);
}

function renderMarkdown(markdown) {
  const blocks = String(markdown ?? '').trim().split(/\n{2,}/).filter(Boolean);
  return blocks.map((block) => {
    const heading = block.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      return `<h${heading[1].length}>${escapeHtml(heading[2].trim())}</h${heading[1].length}>`;
    }

    return `<p>${block.split(/\r?\n/).map((line) => escapeHtml(line.trim())).filter(Boolean).join('<br>')}</p>`;
  }).join('');
}

function nextSortOrder() {
  const max = state.concepts.reduce((value, concept) => Math.max(value, concept.sort_order ?? 0), 0);
  return max + 10;
}

function parseRelatedTitles(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRelatedTitles(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return parseRelatedTitles(value);
  return [];
}

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
}

function toSlug(value) {
  return String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
