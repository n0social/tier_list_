import React, { useState } from 'react';
import ItemCard from './ItemCard';

export default function TierColumn({ tierKey, title, itemIds = [], itemsMap = {}, onDragStart, onDropToTier, onDragOver, onDelete, color }) {
  const [isOver, setIsOver] = useState(false);

  function handleDragEnter(e) {
    e.preventDefault();
    setIsOver(true);
  }

  function handleDragLeave() {
    setIsOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsOver(false);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      return;
    }
    const { itemId, fromTier } = payload;
    if (!itemId) return;

    // determine insertion index based on mouse X position
    const container = e.currentTarget.querySelector('.tier-items-container');
    if (!container) {
      onDropToTier(itemId, fromTier, tierKey, 0);
      return;
    }
    const children = Array.from(container.querySelectorAll('.draggable-item-wrapper'));
    let index = children.length;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (e.clientX < rect.left + rect.width / 2) {
        index = i;
        break;
      }
    }
    onDropToTier(itemId, fromTier, tierKey, index);
  }

  return (
    <div className="w-full">
      <div
        className={`tier-row flex items-stretch mb-3 rounded overflow-hidden`}
        style={{ backgroundColor: color ? `${color}22` : 'transparent' }}
      >
        <div
          className="tier-label flex items-center justify-center font-bold text-white text-2xl"
          style={{ backgroundColor: color || '#6b7280', width: 96 }}
        >
          {title}
        </div>

        <div
          className={`tier-band flex-1 p-3 ${isOver ? 'ring-4 ring-offset-2 ring-indigo-300' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => onDragOver(e)}
          onDrop={handleDrop}
        >
          <div className="tier-items-container flex flex-wrap gap-3 items-start">
            {itemIds.length === 0 ? (
              <div className="text-gray-400 text-sm">Drop items here</div>
            ) : (
              itemIds.map((id) => (
                <div key={id} className="draggable-item-wrapper">
                  <ItemCard item={itemsMap[id]} fromTier={tierKey} onDragStart={onDragStart} onDelete={onDelete} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
