const { createTodo } = require('./todo');

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createProject(input) {
  const { id = makeId(), name = 'Untitled', todos = [] } = input || {};
  return {
    id,
    name: String(name).trim() || 'Untitled',
    todos: Array.isArray(todos) ? todos.map((t) => createTodo(t)) : [],
    addTodo(todoLike) {
      const todo = createTodo(todoLike);
      this.todos.unshift(todo);
      return todo;
    },
    findTodo(todoId) {
      return this.todos.find((t) => t.id === todoId) || null;
    },
    deleteTodo(todoId) {
      const idx = this.todos.findIndex((t) => t.id === todoId);
      if (idx === -1) return false;
      this.todos.splice(idx, 1);
      return true;
    },
  };
}

module.exports = { createProject };
