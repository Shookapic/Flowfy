import React from 'react';

export const ActionCard = ({
  action,
  reactions,
  onAddReaction,
  onDeleteAction,
  onDeleteReaction,
  onServiceConnect,
  connectedServices
}) => (
  <div className="bg-white dark:bg-gray-600 p-4 sm:p-6 rounded-lg shadow">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-700 pb-4 gap-3 sm:gap-2">
      <p className="font-semibold text-white text-base sm:text-lg">{action.name}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onAddReaction(action.id)}
          className="px-2 py-1 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-xs sm:text-sm transition-colors flex-1 sm:flex-none"
        >
          Add Reaction
        </button>
        <button
          onClick={() => onDeleteAction(action.id)}
          className="px-2 py-1 sm:px-4 sm:py-2 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs sm:text-sm transition-colors flex-1 sm:flex-none"
        >
          Delete
        </button>
      </div>
    </div>
    {reactions?.length > 0 && (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-white text-xs sm:text-sm font-medium">Reactions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reactions.map((reaction, index) => (
            <div key={index} className="flex items-center bg-gray-700 hover:bg-gray-600 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 transition-colors gap-2">
              <span className="text-white text-xs sm:text-sm">{reaction}</span>
              <button
                onClick={() => onDeleteReaction(action.id, index)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
