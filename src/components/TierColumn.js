import React from 'react';
import ItemCard from './ItemCard';

export default function TierColumn({ tierKey, title, itemIds = [], itemsMap = {}, onDragStart, onDropToTier, onDragOver, onDelete, color }) {
  function handleDrop(e) {
    e.preventDefault();
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
      <div className="flex items-center mb-2">
        <div
          className="w-14 h-10 flex items-center justify-center font-bold text-white rounded mr-3"
          style={{ background: color || '#6b7280' }}
        >
          {title}
        </div>
        <div className="text-sm text-gray-600">{itemIds.length} items</div>
      </div>

      <div
        onDragOver={(e) => onDragOver(e)}
        onDrop={handleDrop}
        className="min-h-[96px] p-3 border rounded bg-white"
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
  );
}
