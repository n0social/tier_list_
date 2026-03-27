import React, { useEffect, useRef, useState } from 'react';
import TierColumn from './TierColumn';
import html2canvas from 'html2canvas';

const TIERS = ['S', 'A', 'B', 'C', 'D', 'Nah'];

const TIER_COLORS = {
  S: '#ef4444', // red
  A: '#fb923c', // orange
  B: '#facc15', // yellow
  C: '#34d399', // green
  D: '#60a5fa', // blue
  Nah: '#374151', // slate gray
  pool: '#9CA3AF',
};

const sampleItems = {};

const defaultLayout = {
  pool: [],
  S: [],
  A: [],
  B: [],
  C: [],
  D: [],
  Nah: [],
};

function removeFromAll(layout, itemId) {
  const newLayout = {};
  Object.keys(layout).forEach((k) => {
    newLayout[k] = layout[k].filter((id) => id !== itemId);
  });
  return newLayout;
}

export default function TierList() {
  const exportRef = useRef(null);
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem('tier_items');
    return stored ? JSON.parse(stored) : sampleItems;
  });
  const [layout, setLayout] = useState(() => {
    const url = new URL(window.location.href);
    const s = url.searchParams.get('s');
    if (s) {
      try {
        const decoded = decodeURIComponent(atob(s));
        const parsed = JSON.parse(decoded);
        if (parsed?.layout && parsed?.items) return parsed.layout;
      } catch (e) {
        // ignore
      }
    }
    const stored = localStorage.getItem('tier_layout');
    return stored ? JSON.parse(stored) : defaultLayout;
  });

  const [selectedItemId, setSelectedItemId] = useState(null);

  function handleSelectItem(itemId) {
    setSelectedItemId((prev) => (prev === itemId ? null : itemId));
  }

  function handleTierClick(tierKey) {
    if (!selectedItemId) return;
    const fromTier = Object.keys(layout).find((k) => layout[k]?.includes(selectedItemId));
    handleDropToTier(selectedItemId, fromTier, tierKey, undefined);
    setSelectedItemId(null);
  }

  useEffect(() => {
    localStorage.setItem('tier_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('tier_layout', JSON.stringify(layout));
  }, [layout]);

  function handleDragStart(e, itemId, fromTier) {
    e.dataTransfer.setData('application/json', JSON.stringify({ itemId, fromTier }));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDropToTier(itemId, fromTier, toTier, index) {
    if (!itemId) return;
    setLayout((prev) => {
      const fromIndex = prev[fromTier]?.indexOf(itemId);
      const removed = removeFromAll(prev, itemId);
      const next = { ...removed };
      if (!next[toTier]) next[toTier] = [];

      let insertIndex = typeof index === 'number' ? index : next[toTier].length;
      if (fromTier === toTier && typeof fromIndex === 'number' && fromIndex !== -1 && fromIndex < insertIndex) {
        insertIndex = insertIndex - 1;
      }
      if (insertIndex < 0) insertIndex = 0;
      if (insertIndex > next[toTier].length) insertIndex = next[toTier].length;

      const arr = [...next[toTier]];
      arr.splice(insertIndex, 0, itemId);
      next[toTier] = arr;
      return next;
    });
  }

  function handleImageChange(itemId, dataUrl) {
    setItems((prev) => {
      const copy = { ...prev };
      if (copy[itemId]) {
        copy[itemId] = { ...copy[itemId], image: dataUrl };
      }
      return copy;
    });
  }

  function handleDelete(itemId) {
    setItems((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
    setLayout((prev) => removeFromAll(prev, itemId));
  }

  function addItem(name, image) {
    const finalName = name && name.length ? name : 'Item';
    const id = `i${Date.now()}`;
    const emoji = finalName.trim().charAt(0) || '⭐';
    setItems((prev) => ({ ...prev, [id]: { id, name: finalName, emoji, image } }));
    setLayout((prev) => ({ ...prev, pool: [id, ...(prev.pool || [])] }));
  }

  function resetToDefaults() {
    setItems(sampleItems);
    setLayout(defaultLayout);
    window.history.replaceState({}, '', window.location.pathname);
  }

  async function exportAsImage() {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { scale: 2 });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tierlist.png';
    a.click();
  }

  function copyShareLink() {
    const state = { items, layout };
    const str = JSON.stringify(state);
    const base64 = btoa(unescape(encodeURIComponent(str)));
    const url = `${window.location.origin}${window.location.pathname}?s=${base64}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard');
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-6">n0social's Ultimate Tier List</h1>

        <div className="flex flex-col gap-6">
          <div>
            <div ref={exportRef} className="tier-list-export p-4 bg-[#0b0b0b] rounded shadow">
              {TIERS.map((tier) => (
                <div key={tier} className="mb-4">
                  <TierColumn
                    tierKey={tier}
                    title={tier}
                    itemIds={layout[tier]}
                    itemsMap={items}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDropToTier={handleDropToTier}
                    onDelete={handleDelete}
                    onImageChange={handleImageChange}
                    color={TIER_COLORS[tier]}
                    selectedItemId={selectedItemId}
                    onSelectItem={handleSelectItem}
                    onTierClick={handleTierClick}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-[#0b0b0b] p-4 rounded shadow mb-4">
              <h2 className="font-semibold mb-2 text-white">Pool</h2>
              <TierColumn
                tierKey={'pool'}
                title={'Pool'}
                itemIds={layout.pool}
                itemsMap={items}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDropToTier={handleDropToTier}
                onDelete={handleDelete}
                onImageChange={handleImageChange}
                color={TIER_COLORS.pool}
                selectedItemId={selectedItemId}
                onSelectItem={handleSelectItem}
                onTierClick={handleTierClick}
              />

              <AddItemForm onAdd={addItem} />

              <div className="flex gap-2 mt-4">
                <button onClick={exportAsImage} className="px-3 py-2 bg-green-600 text-white rounded">Export PNG</button>
                <button onClick={copyShareLink} className="px-3 py-2 bg-blue-600 text-white rounded">Copy Share Link</button>
                <button onClick={resetToDefaults} className="px-3 py-2 bg-gray-200 rounded">Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddItemForm({ onAdd }) {
  const [name, setName] = useState('');
  const [imageData, setImageData] = useState(null);
  const [fileKey, setFileKey] = useState(Date.now());

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(f);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(name.trim(), imageData);
        setName('');
        setImageData(null);
        setFileKey(Date.now());
      }}
      className="mt-3"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add new item"
        className="w-full border border-gray-700 bg-[#0b0b0b] text-white rounded p-2 mb-2"
      />

      <div className="mb-2">
        <input key={fileKey} type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-300" />
        {imageData ? <img src={imageData} alt="preview" className="mt-2 w-24 h-24 object-cover rounded" /> : null}
      </div>

      <div className="text-right">
        <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">Add</button>
      </div>
    </form>
  );
}
