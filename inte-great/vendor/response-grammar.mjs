/** RESPONSE-GRAMMAR-001: local human-authored signals, not a recommendation engine. */
export const SCHEMA = 'abundent/response-grammar-card/v0';

// A branch refines ONLY the meaning the human already selected.
// This tree is an initial vocabulary, not a psychological taxonomy or diagnosis.
export const ROOTS = [
  {
    id: 'notice', label: 'Hey. I see this.', kind: 'acknowledgment',
    next: [
      { id: 'here', label: "I'm here.", kind: 'acknowledgment' },
      { id: 'listening', label: "I'm listening.", kind: 'acknowledgment' },
      { id: 'more', label: 'Tell me more.', kind: 'inquiry' },
    ],
  },
  {
    id: 'feel', label: 'I feel something.', kind: 'self_report',
    next: [
      { id: 'concerned', label: "I'm concerned.", kind: 'self_report', next: [
        { id: 'safety', label: 'About safety.', kind: 'self_report' },
        { id: 'wellbeing', label: 'About well-being.', kind: 'self_report' },
      ] },
      { id: 'grateful', label: "I'm grateful.", kind: 'self_report' },
      { id: 'joy', label: 'This brings me joy.', kind: 'self_report' },
      { id: 'solidarity', label: 'I stand with you.', kind: 'self_report' },
    ],
  },
  {
    id: 'ask', label: 'I want to understand.', kind: 'inquiry',
    next: [
      { id: 'context', label: 'What happened?', kind: 'inquiry' },
      { id: 'need', label: 'What would actually help?', kind: 'inquiry' },
      { id: 'permission', label: 'May I ask a question?', kind: 'inquiry' },
    ],
  },
  {
    id: 'offer', label: 'I might be able to help.', kind: 'offer_draft',
    next: [
      { id: 'time', label: 'I could offer some time.', kind: 'offer_draft' },
      { id: 'transport', label: 'I may be able to transport something.', kind: 'offer_draft' },
      { id: 'food', label: 'I might have food or supplies.', kind: 'offer_draft' },
      { id: 'skill', label: 'I could share a skill.', kind: 'offer_draft' },
      { id: 'intro', label: 'I know someone who might help.', kind: 'offer_draft' },
    ],
  },
  {
    id: 'invite', label: "Let's see what's possible.", kind: 'invitation_draft',
    next: [
      { id: 'talk', label: 'Would you like to talk?', kind: 'invitation_draft' },
      { id: 'table', label: 'Would you like to meet around a table?', kind: 'invitation_draft' },
      { id: 'try', label: 'Want to try something small together?', kind: 'invitation_draft' },
    ],
  },
  {
    id: 'boundary', label: 'Not right now.', kind: 'boundary',
    next: [
      { id: 'pass', label: 'No, thank you.', kind: 'boundary' },
      { id: 'later', label: 'Maybe another time.', kind: 'boundary' },
      { id: 'privacy', label: 'Please do not contact me about this.', kind: 'boundary' },
    ],
  },
];

const MAX_CONTEXT = 240;
const MAX_NOTE = 180;
const plain = (value, max, field) => {
  if (typeof value !== 'string') throw new TypeError(`${field} must be text`);
  const cleaned = value.trim();
  if (Array.from(cleaned).length > max) throw new RangeError(`${field} exceeds ${max} characters`);
  return cleaned;
};

export function resolvePath(path) {
  if (!Array.isArray(path) || path.length < 1 || path.length > 4) {
    throw new TypeError('Select at least one response, no more than four levels');
  }
  const labels = [];
  let level = ROOTS;
  let current;
  for (const part of path) {
    if (typeof part !== 'string') throw new TypeError('Invalid response path');
    current = level.find((node) => node.id === part);
    if (!current) throw new TypeError(`Unknown or out-of-order response: ${part}`);
    labels.push(current.label);
    level = current.next || [];
  }
  return { node: current, labels, next: level };
}

export function makeCard({ context = '', path, note = '' }) {
  const cleanContext = plain(context, MAX_CONTEXT, 'Context');
  const cleanNote = plain(note, MAX_NOTE, 'Own words');
  const { node, labels } = resolvePath(path);
  // Non-binding statements may be context-free, but an actionable-seeming offer
  // or invitation is held until the person anchors it to a particular situation.
  if (['offer_draft', 'invitation_draft'].includes(node.kind) && !cleanContext) {
    throw new TypeError('An offer or invitation needs a stated context');
  }
  return {
    schema: SCHEMA,
    context: { type: 'author_entered', text: cleanContext || null, verification: 'unverified' },
    response: { path: [...path], phrases: labels, selected: node.label, kind: node.kind, own_words: cleanNote || null },
    status: 'LOCAL_DRAFT',
    delivery: 'NOT_SENT',
    identity: 'NOT_VERIFIED',
    acceptance: 'NOT_ESTABLISHED',
    obligation: 'NONE',
    action: 'NOT_PERFORMED',
    permission: 'NONE',
  };
}

export function asPlainText(card) {
  if (!card || card.schema !== SCHEMA) throw new TypeError('Not a response-grammar card');
  // This is a convenience rendering, not proof that the text was delivered.
  const lines = [];
  if (card.context.text) lines.push(`In response to: ${card.context.text}`);
  lines.push(card.response.selected);
  if (card.response.own_words) lines.push(card.response.own_words);
  lines.push('[Draft only. Not sent; no commitment or agreement implied.]');
  return lines.join('\n');
}
