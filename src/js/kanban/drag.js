import changeItemsCount from './changeItemsCount';

export default function drag(main, el) {
  function getCoords(elem) {
    const box = elem.getBoundingClientRect();
    return {
      top: box.top + window.scrollX,
      left: box.left + window.scrollX,
    };
  }

  const container = main;
  const item = el;
  let draggedEl = null;
  let dataId = null;
  let wrapper = null;

  item.addEventListener('mousedown', (e) => {
    const coords = getCoords(item);
    const shiftX = e.pageX - coords.left;
    const shiftY = e.pageY - coords.top;
    let hasMoved = false;

    function moveAt(event) {
      if (Math.abs(event.clientX - e.clientX) > 5 || Math.abs(event.clientY - e.clientY) > 5) {
        hasMoved = true;
      }

      if (hasMoved) {
        item.style.left = `${event.pageX - shiftX}px`;
        item.style.top = `${event.pageY - shiftY}px`;
      }
    }

    if (e.target.dataset.toggle !== 'item-remove') {
      e.preventDefault();
      if (draggedEl) return;

      wrapper = document.createElement('div');
      wrapper.style.height = `${item.offsetHeight}px`;
      wrapper.style.backgroundColor = '#7b9bb1';
      item.parentElement.insertBefore(wrapper, item);

      dataId = e.target.closest('.main-kanban-column').dataset.id;
      draggedEl = e.target;

      item.classList.add('dragged');
      document.body.append(item);

      moveAt(e);

      const mouseMoving = function handleMouseMove(event) {
        event.preventDefault();
        if (!draggedEl) return;
        moveAt(event);
      };

      container.addEventListener('mousemove', mouseMoving);

      const mouseUpHandler = (event) => {
        if (!draggedEl) return;

        wrapper.parentNode.removeChild(wrapper);

        const closest = document.elementFromPoint(event.clientX, event.clientY);
        const columsLocal = JSON.parse(localStorage.columns);
        const newColumn = closest.closest('.main-kanban-column');
        const newColumnId = newColumn.dataset.id;
        const index = columsLocal[dataId].findIndex((i) => i.id === +item.dataset.id);
        const todoLocal = columsLocal[dataId].splice(index, 1);

        if (closest.className !== 'main-kanban-column-body') {
          let itemsColumn = closest.closest('.main-kanban-item');

          if (itemsColumn) {
            const center = itemsColumn.getBoundingClientRect().y
              + itemsColumn.getBoundingClientRect().height / 2;

            if (event.clientY > center) {
              if (itemsColumn.nextElementSibling !== null) {
                itemsColumn = itemsColumn.nextElementSibling;
              } else {
                return;
              }
            }

            itemsColumn.parentElement.insertBefore(item, itemsColumn);
            item.classList.remove('dragged');
            item.style.top = null;
            item.style.left = null;

            if (dataId === newColumnId) {
              const indexBefore = columsLocal[dataId].findIndex(
                (i) => i.id === +itemsColumn.dataset.id,
              );
              columsLocal[dataId].splice(indexBefore, 0, todoLocal[0]);
            } else {
              const indexBefore = columsLocal[newColumnId].findIndex(
                (i) => i.id === +itemsColumn.dataset.id,
              );
              columsLocal[newColumnId].splice(indexBefore, 0, todoLocal[0]);
            }
          } else {
            return;
          }
        }

        if (closest.className === 'main-kanban-column-body') {
          if (!Object.hasOwn(columsLocal, newColumnId)) {
            columsLocal[newColumnId] = [];
          }
          if (todoLocal[0]) columsLocal[newColumnId].push(todoLocal[0]);

          item.classList.remove('dragged');
          container.removeEventListener('mousemove', mouseMoving);

          const columnItems = newColumn.querySelector('.main-kanban-column-items');
          columnItems.append(item);

          item.style.top = null;
          item.style.left = null;
        }

        changeItemsCount(newColumn, columsLocal[newColumnId]);
        changeItemsCount(
          main.querySelector(`[data-id="${dataId}"]`),
          columsLocal[dataId],
        );
        localStorage.setItem('columns', JSON.stringify(columsLocal));
        draggedEl = null;
        container.removeEventListener('mouseup', mouseUpHandler);
      };

      container.addEventListener('mouseup', mouseUpHandler);
    }
  });
}
