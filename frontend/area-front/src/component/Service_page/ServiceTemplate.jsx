// ServiceTemplate.jsx
import React, { useState } from 'react'; // Remove useEffect since it's not used
import { useParams } from 'react-router-dom';
import { Notification } from './Notification';
import { ServiceHeader } from './ServiceHeader';
import { ActionModal } from './ActionModal';
import { ReactionModal } from './ReactionModal';
import { ActionCard } from './ActionCard';
import { projects } from '../services';

const serviceActions = {
  'discord-service': ['Send message', 'Create channel'],
  'github-service': ['Push a commit', 'Create an issue'],
  'spotify-service': ['Like a song', 'Create a playlist'],
  'x-service': ['Post a tweet', 'Retweet a post'],
  'youtube-service': ['Like a video', 'Upload a video', 'Subscribe to a channel'],
  'gmail-service': ['Receive an email with attachment']
};

const availableReactions = {
  'discord-service': ['Send message (Discord)', 'Create channel (Discord)'],
  'github-service': ['Create issue (GitHub)', 'Create PR (GitHub)'],
  'spotify-service': ['Add to playlist (Spotify)', 'Like song (Spotify)'],
  'x-service': ['Tweet about it (Twitter)', 'DM user (Twitter)'],
  'youtube-service': ['Add to playlist (YouTube)', 'Comment on video (YouTube)'],
  'gmail-service': ['Send email notification (Gmail)', 'Create draft (Gmail)']
};

export function ServiceTemplate() {
  const { serviceName } = useParams();
  const service = projects.find((project) => project.link.includes(serviceName));

  const [selectedActions, setSelectedActions] = useState([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedReactions, setSelectedReactions] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [connectedServices, setConnectedServices] = useState({
    twitter: false, discord: false, gmail: false,
    spotify: false, github: false
  });

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

  const handleConnect = () => {
    if (!isConnected) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
      setSelectedActions([]);
      setSelectedReactions({});
    }
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
    setNotification("Add at least one reaction to make this action work");
    setTimeout(() => setNotification(null), 3000);
  };
  
  const handleReactionSubmit = (reactions) => {
    setSelectedReactions({
      ...selectedReactions,
      [currentAction]: reactions
    });
    const serviceNames = reactions.map(r => {
      const match = r.match(/\((.*?)\)/);
      return match ? match[1].toLowerCase() : '';
    });
    const notConnectedServices = serviceNames.filter(
      name => !connectedServices[name]
    );
    if (notConnectedServices.length > 0) {
      setNotification(`Connect to (${notConnectedServices.join('), (')}) to activate this reaction`);
      setTimeout(() => setNotification(null), 3000);
    }
    setIsReactionModalOpen(false);
    setCurrentAction(null);
  };

  const handleServiceConnect = (serviceName) => {
    setConnectedServices(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  if (!service) return <div>Service not found</div>;

  return (
    <div className="min-h-screen bg-gray-800">
      {notification && <Notification message={notification} />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <ServiceHeader 
            service={service}
            isConnected={isConnected}
            onConnect={handleConnect}
          />

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Actions & Reactions</h2>
              <button
                onClick={() => setIsActionModalOpen(true)}
                className="px-4 py-2 text-white rounded-full transition-all duration-300 ease-in-out transform hover:opacity-80 hover:scale-110"
                style={{ backgroundColor: service.bgColor }}
              >
                +
              </button>
            </div>

            <div className="space-y-4">
              {selectedActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  reactions={selectedReactions[action.id]}
                  onAddReaction={() => {
                    setCurrentAction(action.id);
                    setIsReactionModalOpen(true);
                  }}
                  onDeleteAction={handleDeleteAction}
                  onDeleteReaction={handleDeleteReaction}
                  onServiceConnect={handleServiceConnect}
                  connectedServices={connectedServices}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        actions={serviceActions[serviceName] || []}
        onSubmit={handleActionSubmit}
      />

      <ReactionModal
        isOpen={isReactionModalOpen}
        onClose={() => setIsReactionModalOpen(false)}
        reactions={availableReactions[serviceName] || []}
        selectedReactions={selectedReactions[currentAction] || []}
        onSubmit={handleReactionSubmit}
      />
    </div>
  );
}