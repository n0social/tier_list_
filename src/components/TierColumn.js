import React, { useState, useRef, useEffect, useCallback } from 'react';
import ItemCard from './ItemCard';

export default function TierColumn({ tierKey, title, itemIds = [], itemsMap = {}, onDragStart, onDropToTier, onDragOver, onDelete, onImageChange, color, selectedItemId, onSelectItem, onTierClick }) {
  const [isOver, setIsOver] = useState(false);
  const activeDragRef = useRef(null);
  const ghostRef = useRef(null);
  const onDropRef = useRef(onDropToTier);

  useEffect(() => {
    onDropRef.current = onDropToTier;
  }, [onDropToTier]);

  useEffect(() => {
    return () => {
      // cleanup any active drag state/listeners on unmount
      if (activeDragRef.current?.pressTimer) {
        clearTimeout(activeDragRef.current.pressTimer);
      }
      if (ghostRef.current) {
        try { ghostRef.current.remove(); } catch (err) {}
        ghostRef.current = null;
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateGhostPosition = (x, y) => {
    const g = ghostRef.current;
    if (!g) return;
    const rect = g.getBoundingClientRect();
    g.style.left = `${x - rect.width / 2}px`;
    g.style.top = `${y - rect.height / 2}px`;
  };

  const onPointerMove = useCallback((ev) => {
    const state = activeDragRef.current;
    if (!state) return;
    // if not yet a drag, cancel long-press if moved too far
    if (!state.isDragging) {
      const dx = ev.clientX - state.startX;
      const dy = ev.clientY - state.startY;
      if (Math.hypot(dx, dy) > 10) {
        if (state.pressTimer) {
          clearTimeout(state.pressTimer);
          state.pressTimer = null;
        }
      }
      return;
    }
    // update ghost position
    updateGhostPosition(ev.clientX, ev.clientY);
  }, []);

  const onPointerUp = useCallback((ev) => {
    const state = activeDragRef.current;
    if (!state) return;
    if (state.pressTimer) {
      clearTimeout(state.pressTimer);
      state.pressTimer = null;
    }

    if (state.isDragging) {
      const x = ev.clientX;
      const y = ev.clientY;
      const elUnder = document.elementFromPoint(x, y);
      const tierEl = elUnder && elUnder.closest ? elUnder.closest('[data-tier]') : null;
      const toTier = tierEl ? tierEl.getAttribute('data-tier') : null;
      let index = undefined;
      if (tierEl) {
        const container = tierEl.querySelector('.tier-items-container');
        if (container) {
          const children = Array.from(container.querySelectorAll('.draggable-item-wrapper'));
          index = children.length;
          for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            if (x < rect.left + rect.width / 2) {
              index = i;
              break;
            }
          }
        }
      }

      if (toTier && state.itemId) {
        try {
          onDropRef.current && onDropRef.current(state.itemId, state.fromTier, toTier, index);
        } catch (err) {
          console.error('pointer-drop error', err);
        }
      }
    }

    // cleanup
    try { state.originEl && (state.originEl.style.opacity = ''); } catch (err) {}
    if (ghostRef.current) {
      try { ghostRef.current.remove(); } catch (err) {}
      ghostRef.current = null;
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    activeDragRef.current = null;
  }, [onPointerMove]);

  const beginPointerDrag = (ev, state) => {
    if (!state) return;
    state.isDragging = true;
    const el = state.originEl;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${ev.clientX - rect.width / 2}px`;
    ghost.style.top = `${ev.clientY - rect.height / 2}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.classList.add('touch-drag-ghost');
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    try { el.style.opacity = '0.45'; } catch (err) {}
  };

  const handlePointerDown = (e, itemId) => {
    // only primary button
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const isTouchDevice = typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
    if (!(e.pointerType === 'touch' || (e.pointerType === 'mouse' && isTouchDevice))) return;

    activeDragRef.current = {
      itemId,
      fromTier: tierKey,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      isDragging: false,
      originEl: e.currentTarget,
      pressTimer: null,
    };

    activeDragRef.current.pressTimer = window.setTimeout(() => beginPointerDrag(e, activeDragRef.current), 260);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    try { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  };

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
          data-tier={tierKey}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => onDragOver(e)}
          onDrop={handleDrop}
          onClick={(e) => {
            // ignore clicks that originate from clicking an item
            if (e.target && e.target.closest && e.target.closest('.draggable-item-wrapper')) return;
            if (onTierClick) onTierClick(tierKey);
          }}
        >
            <div className={tierKey === 'pool' ? 'tier-items-container grid grid-cols-4 md:grid-cols-6 gap-2 items-start' : 'tier-items-container flex flex-wrap gap-3 items-start'}>
              {itemIds.length === 0 ? (
                <div className="text-gray-400 text-sm">Drop items here</div>
              ) : (
                itemIds.map((id) => {
                  const wrapperClass = `draggable-item-wrapper ${selectedItemId === id ? 'ring-4 ring-indigo-500 rounded-md' : ''}`;
                  return (
                    <div key={id} className={wrapperClass} data-item-id={id} onPointerDown={(e) => handlePointerDown(e, id)} onClick={(e) => { e.stopPropagation(); if (onSelectItem) onSelectItem(id); }}>
                      <ItemCard
                        item={itemsMap[id]}
                        fromTier={tierKey}
                        onDragStart={onDragStart}
                        onDelete={onDelete}
                        onImageChange={onImageChange}
                        compact={tierKey === 'pool'}
                      />
                    </div>
                  );
                })
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
