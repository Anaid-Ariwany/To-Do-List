function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'checked') node.checked = Boolean(v);
      else if (k === 'value') node.value = v == null ? '' : String(v);
      else if (v === true) node.setAttribute(k, '');
      else if (v !== false && v != null) node.setAttribute(k, String(v));
    }
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function formatDueDate(isoDate) {
  if (!isoDate) return 'No due date';
  // isoDate is expected as "YYYY-MM-DD" from <input type="date">
  return isoDate;
}

function openTodoModal(modal, values) {
  modal.dataset.mode = values && values.id ? 'edit' : 'create';
  modal.dataset.todoId = values && values.id ? values.id : '';

  modal.querySelector('[name="title"]').value = values?.title || '';
  modal.querySelector('[name="description"]').value = values?.description || '';
  modal.querySelector('[name="dueDate"]').value = values?.dueDate || '';
  modal.querySelector('[name="priority"]').value = values?.priority || 'medium';
  modal.querySelector('[name="notes"]').value = values?.notes || '';
  modal.querySelector('[data-modal-title]').textContent = values && values.id ? 'Edit todo' : 'New todo';

  modal.closest('.modal-backdrop').classList.add('open');
  modal.querySelector('[name="title"]').focus();
}

function closeModal(backdrop) {
  backdrop.classList.remove('open');
  const form = backdrop.querySelector('form');
  if (form) form.reset();
}

function buildModal() {
  const backdrop = el(
    'div',
    { class: 'modal-backdrop', role: 'dialog', 'aria-modal': 'true' },
    el(
      'div',
      { class: 'modal card', dataset: { mode: 'create', todoId: '' } },
      el(
        'div',
        { class: 'modal-header' },
        el('h3', { 'data-modal-title': '' }, 'New todo'),
        el('button', { class: 'btn small', type: 'button', 'data-close': '' }, 'Close')
      ),
      el(
        'form',
        { autocomplete: 'off' },
        el(
          'div',
          { class: 'grid2' },
          el(
            'div',
            { class: 'field' },
            el('label', {}, 'Title'),
            el('input', { name: 'title', required: true, placeholder: 'e.g. Pay rent' })
          ),
          el(
            'div',
            { class: 'field' },
            el('label', {}, 'Due date'),
            el('input', { name: 'dueDate', type: 'date' })
          ),
          el(
            'div',
            { class: 'field' },
            el('label', {}, 'Priority'),
            el(
              'select',
              { name: 'priority' },
              el('option', { value: 'low' }, 'Low'),
              el('option', { value: 'medium' }, 'Medium'),
              el('option', { value: 'high' }, 'High')
            )
          ),
          el(
            'div',
            { class: 'field' },
            el('label', {}, 'Notes'),
            el('input', { name: 'notes', placeholder: 'Optional notes' })
          )
        ),
        el(
          'div',
          { class: 'field', style: 'margin-top:10px' },
          el('label', {}, 'Description'),
          el('textarea', { name: 'description', placeholder: 'Optional details…' })
        ),
        el(
          'div',
          { class: 'modal-actions' },
          el('button', { class: 'btn', type: 'button', 'data-cancel': '' }, 'Cancel'),
          el('button', { class: 'btn primary', type: 'submit' }, 'Save')
        )
      )
    )
  );
  return backdrop;
}

function renderProjects(container, state, actions) {
  container.textContent = '';
  for (const p of state.projects) {
    const isActive = p.id === state.selectedProjectId;
    const item = el(
      'div',
      { class: `project${isActive ? ' active' : ''}`, dataset: { pid: p.id } },
      el(
        'div',
        { class: 'project-name truncate' },
        el('span', { class: 'truncate' }, p.name),
        el('span', { class: 'pill' }, String(p.todos.length))
      ),
      el(
        'div',
        { style: 'display:flex; gap:8px; align-items:center' },
        el('button', { class: 'btn small', type: 'button', dataset: { action: 'rename' } }, 'Rename'),
        el('button', { class: 'btn small danger', type: 'button', dataset: { action: 'delete' } }, 'Delete')
      )
    );

    item.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) return; // handled below
      actions.selectProject(p.id);
    });

    item.querySelector('[data-action="rename"]').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = prompt('Rename project:', p.name);
      if (name != null && String(name).trim()) actions.renameProject(p.id, name);
    });

    item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = confirm(`Delete project "${p.name}"? This removes all its todos.`);
      if (ok) actions.deleteProject(p.id);
    });

    container.appendChild(item);
  }
}

function renderTodos(container, state, actions, modalBackdrop) {
  const project = state.selectedProject;
  container.textContent = '';

  if (!project || project.todos.length === 0) {
    container.appendChild(
      el('div', { class: 'todo' }, el('div', { class: 'subtle' }, 'No todos yet. Create one to get started.'))
    );
    return;
  }

  for (const t of project.todos) {
    const expanded = state.ui.expandedTodoId === t.id;

    const checkbox = el('input', {
      type: 'checkbox',
      checked: t.completed,
      onChange: () => actions.toggleTodoComplete(project.id, t.id),
      'aria-label': 'Mark complete',
    });

    const titleText = t.title || '(Untitled)';
    const title = el(
      'div',
      { class: 'todo-title' },
      el('span', { class: `prio ${t.priority}` }, ''),
      el('div', { class: 'truncate' }, titleText)
    );

    const due = el('div', { class: 'subtle' }, formatDueDate(t.dueDate));
    const top = el(
      'div',
      { class: 'todo-top' },
      checkbox,
      el('div', { style: 'min-width:0' }, title, due),
      el(
        'div',
        { class: 'todo-actions' },
        el('button', { class: 'btn small', type: 'button', dataset: { action: 'expand' } }, expanded ? 'Collapse' : 'Expand'),
        el('button', { class: 'btn small', type: 'button', dataset: { action: 'edit' } }, 'Edit'),
        el('button', { class: 'btn small danger', type: 'button', dataset: { action: 'delete' } }, 'Delete')
      )
    );

    const details = el(
      'div',
      { class: 'details' },
      el(
        'div',
        { class: 'grid2' },
        el('div', {}, el('div', { class: 'subtle' }, 'Priority'), el('div', {}, t.priority)),
        el('div', {}, el('div', { class: 'subtle' }, 'Completed'), el('div', {}, t.completed ? 'Yes' : 'No'))
      ),
      el('div', { style: 'margin-top:10px' }, el('div', { class: 'subtle' }, 'Description'), el('div', {}, t.description || '—')),
      el('div', { style: 'margin-top:10px' }, el('div', { class: 'subtle' }, 'Notes'), el('div', {}, t.notes || '—'))
    );

    const row = el('div', { class: `todo${expanded ? ' expanded' : ''}` }, top, details);

    row.querySelector('[data-action="expand"]').addEventListener('click', () => actions.toggleExpanded(t.id));
    row.querySelector('[data-action="edit"]').addEventListener('click', () => openTodoModal(modalBackdrop.querySelector('.modal'), t));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      const ok = confirm(`Delete todo "${titleText}"?`);
      if (ok) actions.deleteTodo(project.id, t.id);
    });

    container.appendChild(row);
  }
}

function mountApp(root, store) {
  if (!root) throw new Error('Missing root element');
  const { actions } = store;

  const projectsList = el('div', { class: 'projects' });
  const todoList = el('div', { class: 'todo-list card' });

  const modalBackdrop = buildModal();
  document.body.appendChild(modalBackdrop);

  const sidebar = el(
    'aside',
    { class: 'sidebar' },
    el(
      'div',
      { class: 'brand' },
      el('h1', {}, 'Todo List'),
      el('button', { class: 'btn small primary', type: 'button', 'data-new-project': '' }, 'New project')
    ),
    projectsList
  );

  const headerTitle = el('h2', {}, '');
  const headerSubtitle = el('div', { class: 'subtle' }, '');
  const mainHeader = el(
    'div',
    { class: 'header' },
    el('div', {}, headerTitle, headerSubtitle),
    el('button', { class: 'btn primary', type: 'button', 'data-new-todo': '' }, 'New todo')
  );

  const main = el('main', { class: 'main' }, mainHeader, todoList);

  root.innerHTML = '';
  root.appendChild(el('div', { class: 'app' }, sidebar, main));

  // Modal wiring
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal(modalBackdrop);
  });
  modalBackdrop.querySelector('[data-close]').addEventListener('click', () => closeModal(modalBackdrop));
  modalBackdrop.querySelector('[data-cancel]').addEventListener('click', () => closeModal(modalBackdrop));

  modalBackdrop.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const modal = modalBackdrop.querySelector('.modal');
    const state = store.getState();
    const project = state.selectedProject;
    if (!project) return;

    const fd = new FormData(e.target);
    const values = {
      title: fd.get('title'),
      description: fd.get('description'),
      dueDate: fd.get('dueDate'),
      priority: fd.get('priority'),
      notes: fd.get('notes'),
    };

    if (!String(values.title || '').trim()) {
      alert('Please provide a title.');
      return;
    }

    if (modal.dataset.mode === 'edit' && modal.dataset.todoId) {
      actions.updateTodo(project.id, modal.dataset.todoId, values);
    } else {
      actions.addTodo(project.id, values);
    }

    closeModal(modalBackdrop);
  });

  // Header actions
  root.querySelector('[data-new-project]').addEventListener('click', () => {
    const name = prompt('Project name:');
    if (name != null && String(name).trim()) actions.addProject(name);
  });
  root.querySelector('[data-new-todo]').addEventListener('click', () => {
    const state = store.getState();
    const project = state.selectedProject;
    if (!project) return;
    openTodoModal(modalBackdrop.querySelector('.modal'), null);
  });

  function render() {
    const state = store.getState();
    renderProjects(projectsList, state, actions);
    headerTitle.textContent = state.selectedProject?.name || 'Todos';
    headerSubtitle.textContent = `${state.selectedProject?.todos.length || 0} item(s)`;
    renderTodos(todoList, state, actions, modalBackdrop);
  }

  store.subscribe(render);
  render();
}

module.exports = { mountApp };
