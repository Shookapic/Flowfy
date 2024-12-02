import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projects } from './services';

const serviceActions = {
  'discord-service': ['Send message', 'Create channel'],
  'github-service': ['Push a commit', 'Create an issue'],
  'spotify-service': ['Like a song', 'Create a playlist'],
  'x-service': ['Post a tweet', 'Retweet a post'],
  'youtube-service': ['Like a video', 'Upload a video', 'Subscribe to a channel'],
  'gmail-service': ['Receive an email with attachment']
};

const availableReactions = {
  'discord-service': ['Tweet about it (Twitter)', 'Send email notification (Gmail)'],
  'github-service': ['Notify on Discord (Discord)', 'Send email notification (Gmail)'],
  'spotify-service': ['Tweet about it (Twitter)', 'Notify on Discord (Discord)'],
  'x-service': ['Send email notification (Gmail)', 'Create issue (GitHub)'],
  'youtube-service': ['Tweet about it (Twitter)', 'Add to playlist (Spotify)', 'Notify on Discord (Discord)'],
  'gmail-service': ['Create issue (GitHub)', 'Notify on Discord (Discord)']
};

const Notification = ({ message, type = "warning" }) => (
  <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === "warning" ? "bg-yellow-500" : "bg-red-500"
  } text-white`}>
    {message}
  </div>
);

export function ServiceTemplate() {
  const { serviceName } = useParams();
  const service = projects.find((project) =>
    project.link.includes(serviceName)
  );

  const [selectedActions, setSelectedActions] = useState([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedReactions, setSelectedReactions] = useState({});
  const [isConnected, setIsConnected] = useState(false); // Moved up with other state declarations
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [connectedServices, setConnectedServices] = useState({
    twitter: false,
    discord: false,
    gmail: false,
    spotify: false,
    github: false
  });

  const handleAddAction = () => {
    setIsActionModalOpen(true);
  };

  const handleActionSubmit = (action) => {
    if (!isConnected) {
      setNotification("Please connect to the service first");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    const actionId = `${action}_${Date.now()}`;
    setSelectedActions([...selectedActions, { id: actionId, name: action }]);
    setSelectedReactions({ ...selectedReactions, [actionId]: [] });
    setIsActionModalOpen(false);
  };

  const handleDeleteAction = (actionId) => {
    setSelectedActions(selectedActions.filter(a => a.id !== actionId));
    const { [actionId]: _, ...rest } = selectedReactions;
    setSelectedReactions(rest);
  };

  const handleDeleteReaction = (actionId, reactionIndex) => {
    setSelectedReactions({
      ...selectedReactions,
      [actionId]: selectedReactions[actionId].filter((_, index) => index !== reactionIndex)
    });
  };

  const handleAddReaction = (actionId) => {
    setCurrentAction(actionId);
    setIsReactionModalOpen(true);
  };

  useEffect(() => {
    selectedActions.forEach(action => {
      const reactions = selectedReactions[action.id] || [];
      if (reactions.length === 0) {
        setNotification("Add at least one reaction for your action to work");
        setTimeout(() => setNotification(null), 3000);
      }
    });
  }, [selectedActions, selectedReactions]);

    // Update handleReactionSubmit function
  const handleReactionSubmit = (reactions) => {
    // First set the reactions
    setSelectedReactions({
      ...selectedReactions,
      [currentAction]: reactions
    });
    
    // Extract service names from reactions
    const serviceNamesInReactions = reactions.map(r => {
      const match = r.match(/\((.*?)\)/);
      return match ? match[1].toLowerCase() : r.toLowerCase().split(' ')[0];
    });
    
    // Check which services need connection
    const notConnectedServices = serviceNamesInReactions.filter(
      name => !connectedServices[name]
    );
    
    // Show notification if any services need connection
    if (notConnectedServices.length > 0) {
      setNotification(`Please connect to ${notConnectedServices.join(', ')} to activate this reaction`);
      setTimeout(() => setNotification(null), 3000);
    } else if (isConnected) {
      saveSetup(); // Only save if all services are connected
      setNotification('Reaction added and saved successfully');
      setTimeout(() => setNotification(null), 3000);
    }
  
    setIsReactionModalOpen(false);
    setCurrentAction(null);
  };

  const handleConnect = () => {
    if (!isConnected) {
      // TODO: Backend implementation for connection
      console.log(`Connecting to ${service?.title}`);
      setIsConnected(true);
    } else {
      // TODO: Backend implementation for disconnection
      console.log(`Disconnecting from ${service?.title}`);
      setIsConnected(false);
      // Clear actions and reactions when disconnecting
      setSelectedActions([]);
      setSelectedReactions({});
    }
  };

  const handleServiceConnect = (serviceName) => {
    // TODO: Backend implementation for service connection
    console.log(`Connecting to ${serviceName}`);
    setConnectedServices(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  useEffect(() => {
    const fetchExistingSetup = async () => {
      try {
        // TODO: Backend API call to fetch existing actions/reactions
        // const response = await fetch(`/api/services/${serviceName}/setup`);
        // const data = await response.json();
        // setSelectedActions(data.actions);
        // setSelectedReactions(data.reactions);
        setIsLoading(true);
      } catch (error) {
        console.error('Failed to fetch existing setup:', error);
        setIsLoading(true);
      }
    };
  
    fetchExistingSetup();
  }, [serviceName]);

  const saveSetup = async () => {
    try {
      // TODO: Backend API call to save current setup
      // await fetch(`/api/services/${serviceName}/setup`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     actions: selectedActions,
      //     reactions: selectedReactions
      //   })
      // });
      console.log('Setup saved successfully');
    } catch (error) {
      console.error('Failed to save setup:', error);
      setNotification('Failed to save setup');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (!service) {
    return <div>Service not found</div>;
  }

  if (isLoading) {
    const validActions = serviceActions[serviceName] || [];
    return (
    <div className="min-h-screen bg-gray-800">
      {notification && <Notification message={notification} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* Header Section */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: service.bgColor, color: service.textColor }}>
            <div className="flex items-center justify-center mb-4">
              {service.icon}
            </div>
            <h1 className="text-3xl font-bold mb-4 text-center text-white">{service.title} Service</h1>
            <div className="flex justify-center">
            <label className="relative inline-flex cursor-pointer select-none items-center">
              <input
                type="checkbox"
                checked={isConnected}
                onChange={handleConnect}
                className="sr-only"
              />
              <div className={`
                relative h-8 w-[200px] rounded-full transition-colors duration-300
                bg-gray-800
              `}>
                <div 
                  className={`
                    absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full
                    transition-transform duration-300
                    ${isConnected ? 'translate-x-[164px]' : 'translate-x-0'}
                  `}
                  style={{ backgroundColor: service.bgColor }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                  {isConnected ? 'Connected' : 'Connect'}
                </div>
              </div>
            </label>
            </div>
          </div>
  
          {/* Actions and Reactions Grid */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Actions & Reactions</h2>
              <button
                onClick={handleAddAction}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                +
              </button>
            </div>
            <div className="space-y-4">
              {selectedActions.map((action) => (
                <div key={action.id} className="bg-white dark:bg-gray-600 p-4 sm:p-6 rounded-lg shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-700 pb-4 gap-3 sm:gap-2">
                    <p className="font-semibold text-white text-base sm:text-lg">{action.name}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddReaction(action.id)}
                        className="px-2 py-1 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-xs sm:text-sm transition-colors flex-1 sm:flex-none"
                      >
                        Add Reaction
                      </button>
                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        className="px-2 py-1 sm:px-4 sm:py-2 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs sm:text-sm transition-colors flex-1 sm:flex-none"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {selectedReactions[action.id] && selectedReactions[action.id].length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p className="text-white text-xs sm:text-sm font-medium">Reactions</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                      {selectedReactions[action.id].map((reaction, index) => (
                        <div 
                          key={index} 
                          className="flex items-center bg-gray-700 hover:bg-gray-600 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 transition-colors gap-2"
                        >
                          <span className="text-white text-xs sm:text-sm">{reaction}</span>
                          <button
                            onClick={() => handleDeleteReaction(action.id, index)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            ×
                          </button>
                          {/* Add connect button */}
                          <button
                            onClick={() => handleServiceConnect(reaction.toLowerCase().split(' ')[0])}
                            className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                              connectedServices[reaction.toLowerCase().split(' ')[0]]
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                            } text-white`}
                          >
                            {connectedServices[reaction.toLowerCase().split(' ')[0]] ? 'Connected' : 'Connect'}
                          </button>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>      
      {/* Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Select Action</h3>
            <div className="space-y-2">
              {validActions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleActionSubmit(action)}
                  className="w-full p-2 text-left hover:bg-gray-700 rounded text-white"
                >
                  {action}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reaction Modal */}
      {isReactionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Select Reactions</h3>
            <div className="space-y-2">
              {(availableReactions[serviceName] || []).map((reaction) => (
                <label key={reaction} className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    onChange={(e) => {
                      const currentReactions = selectedReactions[currentAction] || [];
                      if (e.target.checked) {
                        handleReactionSubmit([...currentReactions, reaction]);
                      } else {
                        handleReactionSubmit(currentReactions.filter(r => r !== reaction));
                      }
                    }}
                    checked={(selectedReactions[currentAction] || []).includes(reaction)}
                  />
                  <span className="text-white">{reaction}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => setIsReactionModalOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
}