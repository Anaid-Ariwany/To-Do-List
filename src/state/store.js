const { createProject } = require('../models/project');
const { createTodo } = require('../models/todo');
const { saveState } = require('../storage/storage');

function makeDefaultState() {
  const inbox = createProject({ name: 'Default' });
  return {
    projects: [inbox],
    selectedProjectId: inbox.id,
    ui: { expandedTodoId: null },
  };
}

function hydrateState(raw) {
  const base = makeDefaultState();
  if (!raw || typeof raw !== 'object') return base;

  const projects = Array.isArray(raw.projects) ? raw.projects.map((p) => createProject(p)) : base.projects;
  const selectedProjectId =
    typeof raw.selectedProjectId === 'string' && projects.some((p) => p.id === raw.selectedProjectId)
      ? raw.selectedProjectId
      : projects[0]?.id || base.selectedProjectId;

  const expandedTodoId = raw.ui && typeof raw.ui.expandedTodoId === 'string' ? raw.ui.expandedTodoId : null;
  return { projects, selectedProjectId, ui: { expandedTodoId } };
}

function snapshotForStorage(state) {
  return {
    projects: state.projects.map((p) => ({
      id: p.id,
      name: p.name,
      todos: p.todos.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        priority: t.priority,
        notes: t.notes,
        checklist: t.checklist,
        completed: t.completed,
        createdAt: t.createdAt,
      })),
    })),
    selectedProjectId: state.selectedProjectId,
    ui: { expandedTodoId: state.ui.expandedTodoId },
  };
}

function createStore(initialState) {
  let state = hydrateState(initialState);
  const listeners = new Set();

  function emit() {
    const snap = getState();
    for (const l of listeners) l(snap);
    saveState(snapshotForStorage(state));
  }

  function getState() {
    return {
      projects: state.projects,
      selectedProjectId: state.selectedProjectId,
      selectedProject: state.projects.find((p) => p.id === state.selectedProjectId) || state.projects[0],
      ui: state.ui,
    };
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function selectProject(projectId) {
    if (!state.projects.some((p) => p.id === projectId)) return;
    state.selectedProjectId = projectId;
    state.ui.expandedTodoId = null;
    emit();
  }

  function addProject(name) {
    const project = createProject({ name: String(name || 'New Project') });
    state.projects.push(project);
    state.selectedProjectId = project.id;
    state.ui.expandedTodoId = null;
    emit();
    return project;
  }

  function renameProject(projectId, newName) {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return false;
    project.name = String(newName || '').trim() || project.name;
    emit();
    return true;
  }

  function deleteProject(projectId) {
    if (state.projects.length <= 1) return false;
    const idx = state.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return false;
    state.projects.splice(idx, 1);
    if (!state.projects.some((p) => p.id === state.selectedProjectId)) {
      state.selectedProjectId = state.projects[0].id;
    }
    state.ui.expandedTodoId = null;
    emit();
    return true;
  }

  function addTodo(projectId, todoLike) {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return null;
    const todo = project.addTodo(todoLike);
    state.ui.expandedTodoId = todo.id;
    emit();
    return todo;
  }

  function updateTodo(projectId, todoId, patch) {
    const project = state.projects.find((p) => p.id === projectId);
    const todo = project?.findTodo(todoId);
    if (!todo) return false;
    todo.update(patch);
    emit();
    return true;
  }

  function deleteTodo(projectId, todoId) {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return false;
    const ok = project.deleteTodo(todoId);
    if (state.ui.expandedTodoId === todoId) state.ui.expandedTodoId = null;
    if (ok) emit();
    return ok;
  }

  function toggleTodoComplete(projectId, todoId) {
    const project = state.projects.find((p) => p.id === projectId);
    const todo = project?.findTodo(todoId);
    if (!todo) return false;
    todo.toggleComplete();
    emit();
    return true;
  }

  function toggleExpanded(todoId) {
    state.ui.expandedTodoId = state.ui.expandedTodoId === todoId ? null : todoId;
    emit();
  }

  // Ensure storage has a baseline immediately (and listeners render).
  emit();

  return {
    getState,
    subscribe,
    actions: {
      selectProject,
      addProject,
      renameProject,
      deleteProject,
      addTodo,
      updateTodo,
      deleteTodo,
      toggleTodoComplete,
      toggleExpanded,
      // exposed for convenience in UI when creating objects
      createTodo,
    },
  };
}

module.exports = { createStore };
