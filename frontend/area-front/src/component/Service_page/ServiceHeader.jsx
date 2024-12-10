// components/ServiceHeader/ServiceHeader.jsx
import React from 'react';

export const ServiceHeader = ({ service, isConnected, onConnect }) => (
  <div className="p-6 rounded-lg" style={{ backgroundColor: service.bgColor, color: service.textColor }}>
    <div className="flex items-center justify-center mb-4">
      {service.icon}
    </div>
    <h1 className="text-3xl font-bold mb-4 text-center text-white">{service.title} Service</h1>
    <div className="flex justify-center">
      <label className="relative inline-flex cursor-pointer select-none items-center">
        <input type="checkbox" checked={isConnected} onChange={onConnect} className="sr-only" />
        <div className="relative h-8 w-[200px] rounded-full transition-colors duration-300 bg-gray-800">
          <div 
            className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full
              transition-transform duration-300 ${isConnected ? 'translate-x-[164px]' : 'translate-x-0'}`}
            style={{ backgroundColor: service.bgColor }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
            {isConnected ? 'Connected' : 'Connect'}
          </div>
        </div>
      </label>
    </div>
  </div>
);