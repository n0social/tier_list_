import React from 'react';

export default function ItemCard({ item, fromTier, onDragStart, onDelete }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id, fromTier)}
      className="bg-white rounded shadow-sm p-3 min-w-[120px] max-w-[160px] flex-shrink-0 cursor-grab hover:scale-[1.02] transition-transform"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-3xl select-none">{item.emoji || '🔹'}</div>
        <div className="text-sm font-medium text-center">{item.name}</div>
        <button onClick={() => onDelete(item.id)} className="text-xs text-red-500 hover:text-red-700 mt-1">Remove</button>
      </div>
    </div>
  );
}
