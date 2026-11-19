// The kinds of message the contact form carries.
//
// The kind is what the reader chooses, and it is what the form posts. It says only what the
// message is about: nothing about the reader beyond the choice itself.

export const CONTACT_KINDS = [
  { id: 'mistake', label: 'A mistake in a story' },
  { id: 'privacy', label: 'A privacy request (see, correct or delete my data)' },
  { id: 'question', label: 'A question' },
  { id: 'other', label: 'Something else' },
];

export const KIND_IDS = CONTACT_KINDS.map((k) => k.id);

/**
 * The kind a link asked for, or 'mistake' when it asked for nothing (or for something this form
 * does not know). The answer is always one of KIND_IDS, so the form can never post a kind that
 * was invented.
 */
export function kindFrom(value) {
  const v = String(value || '').toLowerCase();
  return KIND_IDS.includes(v) ? v : 'mistake';
}

/** The label of a kind, for the page that names it. */
export function kindLabel(value) {
  const id = kindFrom(value);
  return CONTACT_KINDS.find((k) => k.id === id)?.label || CONTACT_KINDS[0].label;
}
