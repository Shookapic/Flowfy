// components/ReactionModal/ReactionModal.jsx
import React from 'react';

export const ReactionModal = ({ isOpen, onClose, reactions, selectedReactions, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4 text-white">Select Reactions</h3>
        <div className="space-y-2">
          {reactions.map((reaction) => (
            <label key={reaction} className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) => {
                  if (e.target.checked) {
                    onSubmit([...selectedReactions, reaction]);
                  } else {
                    onSubmit(selectedReactions.filter(r => r !== reaction));
                  }
                }}
                checked={selectedReactions.includes(reaction)}
              />
              <span className="text-white">{reaction}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};