function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizePriority(priority) {
  const p = String(priority || '').toLowerCase();
  if (p === 'high' || p === 'medium' || p === 'low') return p;
  return 'medium';
}

function createTodo(input) {
  const {
    id = makeId(),
    title = '',
    description = '',
    dueDate = '',
    priority = 'medium',
    notes = '',
    checklist = [],
    completed = false,
    createdAt = new Date().toISOString(),
  } = input || {};

  return {
    id,
    title: String(title).trim(),
    description: String(description).trim(),
    dueDate: String(dueDate || ''),
    priority: normalizePriority(priority),
    notes: String(notes).trim(),
    checklist: Array.isArray(checklist) ? checklist : [],
    completed: Boolean(completed),
    createdAt,
    toggleComplete() {
      this.completed = !this.completed;
    },
    update(patch) {
      if (!patch || typeof patch !== 'object') return;
      if ('title' in patch) this.title = String(patch.title).trim();
      if ('description' in patch) this.description = String(patch.description).trim();
      if ('dueDate' in patch) this.dueDate = String(patch.dueDate || '');
      if ('priority' in patch) this.priority = normalizePriority(patch.priority);
      if ('notes' in patch) this.notes = String(patch.notes).trim();
      if ('checklist' in patch) this.checklist = Array.isArray(patch.checklist) ? patch.checklist : [];
      if ('completed' in patch) this.completed = Boolean(patch.completed);
    },
  };
}

module.exports = { createTodo };
