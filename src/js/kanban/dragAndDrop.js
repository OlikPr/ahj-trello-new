export default function dragAndDrop(main) {
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.main-kanban-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function updateLocalStorage(item, fromColumn, toColumn) {
    const columns = JSON.parse(localStorage.columns || '{}');
    const fromKey = fromColumn.closest('.main-kanban-column').dataset.id;
    const toKey = toColumn.closest('.main-kanban-column').dataset.id;
    const itemId = Number(item.dataset.id);

    const taskIndex = columns[fromKey].findIndex((t) => t.id === itemId);
    if (taskIndex === -1) return;

    const [task] = columns[fromKey].splice(taskIndex, 1);
    if (!columns[toKey]) columns[toKey] = [];
    columns[toKey].push(task);

    localStorage.setItem('columns', JSON.stringify(columns));
  }

  function validateCardContent(content) {
    return content && content.trim() !== '';
  }

  main.addEventListener('dragleave', (e) => {
    if (e.target.classList.contains('dragged')) {
      e.target.classList.remove('dragged');
    }
  });
  let dropIndicator = null;
  function createDropIndicator() {
    dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    document.body.append(dropIndicator);
    return dropIndicator;
  }
  main.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('main-kanban-item')) {
      const cardText = e.target.querySelector('.tasks-kanban-item-text')?.textContent;
      if (!validateCardContent(cardText)) {
        e.preventDefault();
        return;
      }
      e.target.classList.add('dragging');
      document.body.style.cursor = 'grabbing';
      e.target.style.cursor = 'grabbing';
      e.dataTransfer.setData('text/plain', e.target.dataset.id);
      setTimeout(() => {
        e.target.style.opacity = '0.4';
      }, 0);
      dropIndicator = createDropIndicator(); 
    }
  });

  main.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('main-kanban-item')) {
      e.target.classList.remove('dragging');
      document.body.style.cursor = '';
      e.target.style.cursor = '';
      e.target.style.opacity = '1';
      if (dropIndicator) {
      dropIndicator.remove();
      dropIndicator = null;
    }
    const dragged = document.querySelector('.dragged');
    if (dragged) dragged.classList.remove('dragged');
    }
  });

  main.addEventListener('dragenter', (e) => {
    if (e.target.classList.contains('main-kanban-column-items')) {
      e.target.classList.add('dragged');
    }
  });

  let elemBelow = '';

  main.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    elemBelow = e.target;
     if (targetItem) {
      const rect = targetItem.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      if (e.clientY < center) {
        dropIndicator.style.width = `${rect.width}px`;
        dropIndicator.style.position = 'fixed';
        dropIndicator.style.left = `${rect.left}px`;
        dropIndicator.style.top = `${rect.top}px`;
        targetItem.before(dropIndicator);
      } else {
        dropIndicator.style.width = `${rect.width}px`;
        dropIndicator.style.position = 'fixed';
        dropIndicator.style.left = `${rect.left}px`;
        dropIndicator.style.top = `${rect.bottom}px`;
        targetItem.after(dropIndicator);
      }
      dropIndicator.classList.add('active');
    } else if (columnBody) {
      const rect = columnBody.getBoundingClientRect();
      dropIndicator.style.width = `${rect.width - 20}px`;
      dropIndicator.style.position = 'fixed';
      dropIndicator.style.left = `${rect.left + 10}px`;
      dropIndicator.style.top = `${rect.bottom - 10}px`;
      columnBody.append(dropIndicator);
      dropIndicator.classList.add('active');
    }
  });

  main.addEventListener('drop', (e) => {
    const todo = main.querySelector(`[data-id="${e.dataTransfer.getData('text/plain')}"]`);
    if (!todo) return;
    const cardText = todo.querySelector('.tasks-kanban-item-text')?.textContent;
    if (!validateCardContent(cardText)) {
      return;
    }
    const dropColumn = e.target.closest('.main-kanban-column-body');
    const currentColumn = todo.closest('.main-kanban-column');

    if (elemBelow === todo) {
      return;
    }

    const afterElement = getDragAfterElement(dropColumn, e.clientY);

    if (afterElement) {
      dropColumn.insertBefore(todo, afterElement);
    } else {
      dropColumn.append(todo);
    }

    if (['span', 'tasks-kanban-item-text', 'tasks-kanban-item'].includes(elemBelow.tagName.toLowerCase() || elemBelow.className)) {
      elemBelow = elemBelow.closest('.main-kanban-item');
    }

    updateLocalStorage(todo, currentColumn, dropColumn);

    if (elemBelow.classList.contains('main-kanban-item')) {
      const center = elemBelow.getBoundingClientRect().y
        + elemBelow.getBoundingClientRect().height / 2;

      if (e.clientY > center && elemBelow.nextElementSibling !== null) {
        elemBelow = elemBelow.nextElementSibling;
      }

      elemBelow.parentElement.insertBefore(todo, elemBelow);
      todo.className = elemBelow.className;
    }

    if (e.target.classList.contains('main-kanban-column-body')) {
      const columsLocal = JSON.parse(localStorage.columns);
      const keyForTodo = todo.closest('.main-kanban-column').dataset.id;
      const index = columsLocal[keyForTodo].findIndex((item) => item.id === +todo.dataset.id);
      const todoLocal = columsLocal[keyForTodo].splice(index, 1);
      if (todoLocal.length === 0 || !todoLocal[0].text || todoLocal[0].text.trim() === '') {
        columsLocal[keyForTodo].splice(index, 0, ...todoLocal);
        return;
      }
      const columnItems = e.target.querySelector('.main-kanban-column-items');
      const keyForColumnItems = columnItems.closest('.main-kanban-column').dataset.id;

      if (!Object.hasOwn(columsLocal, keyForColumnItems)) {
        columsLocal[keyForColumnItems] = [];
      }

      columsLocal[keyForColumnItems].push(todoLocal[0]);
      localStorage.setItem('columns', JSON.stringify(columsLocal));
      columnItems.append(todo);

      if (e.target.classList.contains('dragged')) {
        e.target.classList.remove('dragged');
      }
    }
  });
}
