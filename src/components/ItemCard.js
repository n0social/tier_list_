import React, { useRef } from 'react';

export default function ItemCard({ item, fromTier, onDragStart, onDelete, onImageChange, compact = false }) {
  const fileRef = useRef(null);

  function handleFileClick(e) {
    e.stopPropagation();
    fileRef.current?.click();
  }

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImageChange && onImageChange(item.id, reader.result);
    };
    reader.readAsDataURL(f);
  }

  const dragStart = (e) => onDragStart && onDragStart(e, item.id, fromTier);

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1 cursor-grab">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            draggable
            onDragStart={dragStart}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div draggable onDragStart={dragStart} className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded">{item.emoji || '🔹'}</div>
        )}
        <div className="text-xs text-center text-white/90">{item.name}</div>
        <div className="flex gap-1">
          <button onClick={() => onDelete(item.id)} className="text-xs text-red-400">✕</button>
          <button onClick={handleFileClick} className="text-xs text-gray-300">↺</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={dragStart}
      className="bg-white rounded shadow-sm p-3 min-w-[120px] max-w-[160px] flex-shrink-0 cursor-grab hover:scale-[1.02] transition-transform"
    >
      <div className="flex flex-col items-center gap-2">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            draggable
            onDragStart={dragStart}
            className="w-28 h-28 object-cover rounded"
          />
        ) : (
          <div draggable onDragStart={dragStart} className="text-3xl select-none">{item.emoji || '🔹'}</div>
        )}

        <div className="text-sm font-medium text-center">{item.name}</div>

        <div className="flex gap-2 mt-1">
          <button onClick={() => onDelete(item.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
          <button onClick={handleFileClick} className="text-xs text-gray-700 hover:text-gray-900">Change</button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  );
}
