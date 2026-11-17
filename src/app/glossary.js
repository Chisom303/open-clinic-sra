// Plain-language definitions for terms used in the assessment.
// `annotate` marks these terms in already-escaped HTML so people can hover or tap them.

export const TERMS = [
  { term: 'EHR', name: 'Electronic health record', def: 'The software your practice uses to keep patient charts and records, whether hosted in the cloud or on your own computers.' },
  { term: 'ePHI', name: 'Electronic protected health information', def: 'Any patient health information stored or sent electronically: charts, billing records, emails, scans, appointment details.' },
  { term: 'PHI', name: 'Protected health information', def: 'Health information that can identify a patient, in any form: electronic, paper, or spoken.' },
  { term: 'BAA', name: 'Business Associate Agreement', def: 'A contract HIPAA requires with any outside company that handles patient information for you, such as your EHR vendor, billing company, or IT provider.' },
  { term: 'MFA', name: 'Multi-factor authentication', def: 'Signing in with a password plus a second step, such as a code from a phone app or text message.' },
  { term: 'HIPAA', name: 'Health Insurance Portability and Accountability Act', def: 'The U.S. law whose Security Rule requires practices to protect electronic patient information and assess the risks to it.' },
];

// Terms marked inline. HIPAA is common enough to leave unmarked; it is in the glossary lists.
const INLINE = { EHR: 0, EHRs: 0, ePHI: 1, PHI: 2, BAA: 3, BAAs: 3, MFA: 4 };
const PATTERN = /\b(EHRs?|ePHI|PHI|BAAs?|MFA)\b/g;

/** Wrap known terms in escaped text with a focusable, tappable definition marker. */
export function annotate(escapedHtml) {
  return String(escapedHtml).replace(PATTERN, (word) => {
    const t = TERMS[INLINE[word]];
    return `<abbr class="term" tabindex="0" data-def="${t.name}: ${t.def.replace(/"/g, '&quot;')}">${word}</abbr>`;
  });
}

/** A definition list of all terms, for the start page and the report. */
export function glossaryList(className = 'glossary') {
  return `<dl class="${className}">${TERMS.map(
    (t) => `<div><dt>${t.term}</dt><dd><strong>${t.name}.</strong> ${t.def}</dd></div>`,
  ).join('')}</dl>`;
}
