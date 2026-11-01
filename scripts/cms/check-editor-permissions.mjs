#!/usr/bin/env node
// Exercises the Content Editor role against a Directus instance and reports
// what it can and cannot do. Every write it makes is undone. Run against
// STAGING with an editor user's token:
//
//   DIRECTUS_URL=… EDITOR_TOKEN=<content-editor static token> node scripts/cms/check-editor-permissions.mjs

const BASE = (process.env.DIRECTUS_URL || 'http://127.0.0.1:8055').replace(/\/$/, '');
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error('EDITOR_TOKEN required');

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text).data : null };
}

let failures = 0;
function expect(label, got, want) {
  const pass = got === want;
  if (!pass) failures++;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${got ? 'allowed' : 'denied'}${pass ? '' : ` (expected ${want ? 'allowed' : 'denied'})`}`);
}

const first = async (c, q = '') => (await call('GET', `/items/${c}?limit=1&fields=*${q}`)).data?.[0];

// Content: edit, create, delete
const section = await first('page_sections');
expect('read page sections', Boolean(section), true);
const r1 = await call('PATCH', `/items/page_sections/${section.id}`, { heading: section.heading });
expect('edit a page section', r1.ok, true);
expect('change a section key', (await call('PATCH', `/items/page_sections/${section.id}`, { section_key: 'x' })).ok, false);
expect('add a section to a page', (await call('POST', '/items/page_sections', { page: section.page, section_key: 'x' })).ok, false);
expect('delete a section (hide it instead)', (await call('DELETE', `/items/page_sections/${section.id}`)).ok, false);

const item = await call('POST', '/items/section_items', { section: section.id, title: 'permission check', status: 'hidden' });
expect('add a section item', item.ok, true);
if (item.ok) expect('delete a section item', (await call('DELETE', `/items/section_items/${item.data.id}`)).ok, true);

const tr = await call('POST', '/items/page_sections_translations', { page_sections_id: section.id, languages_code: 'sk', heading: 'test' });
expect('add a translation', tr.ok, true);
if (tr.ok) await call('DELETE', `/items/page_sections_translations/${tr.data.id}`);

const page = await call('POST', '/items/pages', { title: 'Permission check', slug: `perm-check-${Date.now()}`, status: 'draft' });
expect('create a page', page.ok, true);
if (page.ok) expect('delete a page they created', (await call('DELETE', `/items/pages/${page.data.id}`)).ok, true);

const fixed = await first('pages', '&filter[fixed_route][_eq]=/accommodation');
expect('delete a hand-designed page', (await call('DELETE', `/items/pages/${fixed.id}`)).ok, false);

const post = await call('POST', '/items/posts', { title: 'Permission check', slug: `perm-check-${Date.now()}`, status: 'draft' });
expect('create a blog post', post.ok, true);
if (post.ok) await call('DELETE', `/items/posts/${post.data.id}`);
const ev = await call('POST', '/items/eventpages', { title: 'Permission check', slug: `perm-check-${Date.now()}`, status: 'draft' });
expect('create an event', ev.ok, true);
if (ev.ok) await call('DELETE', `/items/eventpages/${ev.data.id}`);
const tm = await call('POST', '/items/team_members', { name: 'Permission check', status: 'draft' });
expect('create a team member', tm.ok, true);
if (tm.ok) await call('DELETE', `/items/team_members/${tm.data.id}`);

// Settings
const s = (await call('GET', '/items/site_settings')).data;
expect('edit site settings', (await call('PATCH', '/items/site_settings', { site_name: s.site_name })).ok, true);
const ui = await first('ui_strings');
expect('edit a small text', (await call('PATCH', `/items/ui_strings/${ui.id}`, { value: ui.value })).ok, true);
expect('create a small text', (await call('POST', '/items/ui_strings', { key: 'x.y', value: 'x' })).ok, false);
const opt = await first('booking_options');
expect('edit a booking price', (await call('PATCH', `/items/booking_options/${opt.id}`, { price_excl_vat: opt.price_excl_vat })).ok, true);
expect('change a booking option key', (await call('PATCH', `/items/booking_options/${opt.id}`, { option_key: 'zzz' })).ok, false);
expect('delete a booking option', (await call('DELETE', `/items/booking_options/${opt.id}`)).ok, false);

// Out of bounds
expect('read booking inquiries', (await call('GET', '/items/booking_inquiries?limit=1')).ok, false);
expect('read legacy tables (subscribers)', (await call('GET', '/items/subscribers?limit=1')).ok, false);
expect('change project settings', (await call('PATCH', '/settings', { project_name: 'x' })).ok, false);
expect('create a collection', (await call('POST', '/collections', { collection: 'perm_check', schema: {} })).ok, false);
expect('create a user', (await call('POST', '/users', { email: 'perm@example.com', password: 'x'.repeat(12) })).ok, false);
expect('delete a file', (await call('DELETE', `/files/${(await call('GET', '/files?limit=1')).data[0].id}`)).ok, false);

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
