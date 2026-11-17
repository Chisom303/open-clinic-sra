import { test } from 'node:test';
import assert from 'node:assert/strict';
import { annotate, TERMS } from '../src/app/glossary.js';

test('marks EHR, ePHI, BAA and MFA as defined terms', () => {
  const out = annotate('Use MFA for the EHR and sign a BAA before sharing ePHI.');
  for (const t of ['MFA', 'EHR', 'BAA', 'ePHI']) assert.match(out, new RegExp(`<abbr class="term"[^>]*>${t}</abbr>`));
});

test('does not mark PHI inside ePHI, or partial words', () => {
  const out = annotate('ePHI and EHRS and MFAs');
  assert.equal((out.match(/<abbr/g) || []).length, 1);
  assert.match(out, />ePHI</);
});

test('plural forms are marked with the singular definition', () => {
  assert.match(annotate('cloud EHRs'), /data-def="Electronic health record:[^"]*">EHRs</);
});

test('every term has a name and definition', () => {
  for (const t of TERMS) assert.ok(t.term && t.name && t.def.length > 20);
});
