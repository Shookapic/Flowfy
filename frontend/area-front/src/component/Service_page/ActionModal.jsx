// components/ActionModal/ActionModal.jsx
import React from 'react';

export const ActionModal = ({ isOpen, onClose, actions, onSubmit }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4 text-white">Select Action</h3>
        <div className="space-y-2">
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => onSubmit(action)}
              className="w-full p-2 text-left hover:bg-gray-700 rounded text-white"
            >
              {action}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};