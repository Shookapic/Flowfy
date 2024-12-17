import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Notification } from './Notification';
import { ServiceHeader } from './ServiceHeader';
import { ActionModal } from './ActionModal';
import { ReactionModal } from './ReactionModal';
import { ActionCard } from './ActionCard';
import { projects } from '../services';
import Navbar from '../Navbar';
import Footer from '../Footer';

const serviceApiEndpoints = {
  'spotify-service': '/api/auth/spotify',
  'youtube-service': '/api/auth/youtube',
  'netflix-service': '/api/auth/netflix',
  'twitch-service': '/api/auth/twitch',
  'twitter-service': '/api/auth/twitter',
  'github-service': '/api/auth/github',
};

const serviceIds = {
  'spotify-service': 1,
  'youtube-service': 2,
  'netflix-service': 3,
  'twitch-service': 4,
  'twitter-service': 5,
  'github-service': 6,
};

export function ServiceTemplate() {
  const { serviceName } = useParams();
  const service = projects.find((project) => project.link.includes(serviceName));

  const [serviceActions, setServiceActions] = useState([]);
  const [availableReactions, setAvailableReactions] = useState([]);
  const [selectedActions, setSelectedActions] = useState([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedReactions, setSelectedReactions] = useState({});
  const [isConnected, setIsConnected] = useState(true);
  const [notification, setNotification] = useState(null);
  const [connectedServices] = useState({
    twitter: false, discord: false, gmail: false,
    spotify: false, github: false
  });

  useEffect(() => {
    const fetchActionsAndReactions = async () => {
      const serviceId = serviceIds[serviceName];
      if (!serviceId) return;

      try {
        const actionsResponse = await fetch(`http://flowfy.duckdns.org:3000/get-actions-by-service-id?serviceId=${serviceId}`);
        const actionsData = await actionsResponse.json();
        setServiceActions(actionsData);

        const reactionsResponse = await fetch(`http://flowfy.duckdns.org:3000/get-reactions-by-service-id?serviceId=${serviceId}`);
        const reactionsData = await reactionsResponse.json();
        setAvailableReactions(reactionsData);
      } catch (error) {
        console.error('Error fetching actions and reactions:', error);
      }
    };

    fetchActionsAndReactions();
  }, [serviceName]);

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

  const handleServiceConnect = (serviceName) => {
    const endpoint = serviceApiEndpoints[serviceName];
    if (!endpoint) {
      setNotification(`No API endpoint configured for ${serviceName}`);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const email = localStorage.getItem('email');
    if (!email) {
      setNotification('Email not found in localStorage');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const url = `http://flowfy.duckdns.org:3000${endpoint}?email=${encodeURIComponent(email)}`;
    window.location.href = url; // Redirect to the OAuth2 provider
  };

  const handleConnect = () => {
    if (!isConnected) {
      handleServiceConnect(serviceName);
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

  if (!service) return <div>Service not found</div>;

  return (
    <>
    <Navbar />
    <div className="min-h-screen">
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
              <h2 className="text-xl font-semibold text-black dark:text-white">Actions & Reactions</h2>
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
        actions={serviceActions.map(action => action.description)} // Ensure actions are rendered correctly
        onSubmit={handleActionSubmit}
        />

      <ReactionModal
        isOpen={isReactionModalOpen}
        onClose={() => setIsReactionModalOpen(false)}
        reactions={availableReactions.map(reaction => reaction.description)} // Ensure reactions are rendered correctly
        selectedReactions={selectedReactions[currentAction] || []}
        onSubmit={handleReactionSubmit}
        />
    </div>
    <Footer />
    </>
  );
}
