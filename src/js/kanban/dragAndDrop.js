export default function dragAndDrop(main) {
  function isValidCard(card) {
    if (!card) return false;
    const textElement = card.querySelector('.tasks-kanban-item-text');
    return textElement && textElement.textContent.trim() !== '';
  }
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
    if (!isValidCard(item)) return false;
    const columns = JSON.parse(localStorage.columns || '{}');
    const fromKey = fromColumn.closest('.main-kanban-column').dataset.id;
    const toKey = toColumn.closest('.main-kanban-column').dataset.id;
    const itemId = Number(item.dataset.id);

    const taskIndex = columns[fromKey].findIndex((t) => t.id === itemId);
    if (taskIndex === -1) return;

    const [task] = columns[fromKey].splice(taskIndex, 1);
    if (!task || !task.text || task.text.trim() === '') {
      columns[fromKey].splice(taskIndex, 0, task);
      return false;
    }
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
      if (!isValidCard(e.target)) {
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
    if (draggedItem && !isValidCard(draggedItem)) {
        const originalColumn = main.querySelector(`[data-id="${draggedItem.dataset.id}"]`)?.closest('.main-kanban-column-items');
        if (originalColumn) {
          originalColumn.append(draggedItem);
        }
      }
      
      draggedItem = null;
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
    if (!draggedItem || !isValidCard(draggedItem)) return;
    e.dataTransfer.dropEffect = 'move';
    const targetItem = e.target.closest('.main-kanban-item');
    const columnBody = e.target.closest('.main-kanban-column-body');
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

    if (!updateLocalStorage(todo, currentColumn, dropColumn)) {
      const originalColumn = main.querySelector(`[data-id="${todo.dataset.id}"]`)?.closest('.main-kanban-column-items');
      if (originalColumn) {
        originalColumn.append(todo);
      }
    }
  
    if (dropIndicator) {
      dropIndicator.remove();
      dropIndicator = null;
    }
  });
}
