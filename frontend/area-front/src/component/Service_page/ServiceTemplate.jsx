import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Notification } from './Notification';
import { ServiceHeader } from './ServiceHeader';
import { ActionModal } from './ActionModal';
import { ReactionModal } from './ReactionModal';
import { ActionCard } from './ActionCard';
import { projects } from '../services';

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
  const [isConnected, setIsConnected] = useState(() => {
    const isConnectedStatus = localStorage.getItem(`isConnected_${serviceName}`);
    return isConnectedStatus === 'true';
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchActionsAndReactions = async () => {
      const serviceId = serviceIds[serviceName];
      if (!serviceId) return;

      try {
        const actionsResponse = await fetch(`http://localhost:3000/get-actions-by-service-id?serviceId=${serviceId}`);
        const actionsData = await actionsResponse.json();
        setServiceActions(actionsData);

        const reactionsResponse = await fetch(`http://localhost:3000/get-reactions`);
        const reactionsData = await reactionsResponse.json();
        setAvailableReactions(reactionsData);
      } catch (error) {
        console.error('Error fetching actions and reactions:', error);
      }
    };

    fetchActionsAndReactions();
  }, [serviceName]);

  useEffect(() => {
    const storedActions = localStorage.getItem(`selectedActions_${serviceName}`);
    const storedReactions = localStorage.getItem(`selectedReactions_${serviceName}`);
    const parsedActions = storedActions ? JSON.parse(storedActions) : [];
    const parsedReactions = storedReactions ? JSON.parse(storedReactions) : {};

    const formattedActions = parsedActions.map((action) => {
      const matchingServiceAction = serviceActions.find((sa) => sa.description === action.name);
      return {
        id: action.id,
        name: action.name,
        service_id: matchingServiceAction?.service_id || serviceIds[serviceName],
        description: matchingServiceAction?.description || action.name,
      };
    });

    const filteredActions = formattedActions.filter(
      (action) => parsedReactions[action.id] && parsedReactions[action.id].length > 0
    );

    const filteredReactions = Object.fromEntries(
      Object.entries(parsedReactions).filter(([actionId, reactions]) => reactions.length > 0)
    );

    setSelectedActions(filteredActions);
    setSelectedReactions(filteredReactions);

    localStorage.setItem(`selectedActions_${serviceName}`, JSON.stringify(filteredActions));
    localStorage.setItem(`selectedReactions_${serviceName}`, JSON.stringify(filteredReactions));
  }, [serviceActions, serviceName]);

  useEffect(() => {
    localStorage.setItem(`selectedActions_${serviceName}`, JSON.stringify(selectedActions));
  }, [selectedActions, serviceName]);

  useEffect(() => {
    localStorage.setItem(`selectedReactions_${serviceName}`, JSON.stringify(selectedReactions));
  }, [selectedReactions, serviceName]);

  useEffect(() => {
    const hasValidActionReaction = selectedActions.some((action) => {
      const reactions = selectedReactions[action.id];
      return reactions && reactions.length > 0;
    });
  
    if (hasValidActionReaction) {
      handleSave();
    }
  }, [selectedActions, selectedReactions]);

  const handleActionSubmit = (actionName) => {
    if (!isConnected) {
      setNotification("Please connect to the service first");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const actionId = `${actionName.replace(/\s+/g, '_')}_${Date.now()}`;
    const matchingServiceAction = serviceActions.find((sa) => sa.description === actionName);

    const newAction = {
      id: actionId,
      name: actionName,
      service_id: matchingServiceAction?.service_id || serviceIds[serviceName],
      description: actionName,
    };

    const newSelectedActions = [...selectedActions, newAction];
    const newSelectedReactions = { ...selectedReactions, [actionId]: [] };

    setSelectedActions(newSelectedActions);
    setSelectedReactions(newSelectedReactions);

    setIsActionModalOpen(false);
    setNotification("Add at least one reaction to make this action work");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReactionSubmit = (reactions) => {
    const newSelectedReactions = {
      ...selectedReactions,
      [currentAction]: reactions.map((reaction) => {
        const reactionData = availableReactions.find((r) => r.description === reaction);
        return { ...reactionData };
      }),
    };
    setSelectedReactions(newSelectedReactions);
    setIsReactionModalOpen(false);
    setCurrentAction(null);
  };

  const handleSave = async () => {
    const email = localStorage.getItem('email');

    const formattedActions = selectedActions.map((action) => ({
      id: action.id,
      service_id: action.service_id,
      description: action.description,
    }));

    const formattedReactions = Object.entries(selectedReactions).flatMap(
      ([actionId, reactions]) =>
        reactions.map((reaction) => ({
          id: reaction.id,
          service_id: reaction.service_id,
          description: reaction.description,
          action_id: actionId,
        }))
    );

    const payload = {
      email,
      actions: formattedActions,
      reactions: formattedReactions,
    };

    try {
      alert('Saving actions and reactions');
      const response = await fetch('http://localhost:3000/save-action-reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save actions and reactions');
      }

      console.log('Saved successfully:', payload);
    } catch (error) {
      console.error('Error saving actions and reactions:', error);
      setNotification('Failed to save action and reaction');
      setTimeout(() => setNotification(null), 3000);
    }
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
            onConnect={() => {
              setIsConnected(!isConnected);
              if (!isConnected) {
                localStorage.removeItem(`selectedActions_${serviceName}`);
                localStorage.removeItem(`selectedReactions_${serviceName}`);
                setSelectedActions([]);
                setSelectedReactions({});
              }
            }}
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
                connectedServices={serviceApiEndpoints}
                onAddReaction={() => {
                  setCurrentAction(action.id);
                  setIsReactionModalOpen(true);
                }}
                onDeleteAction={(id) => {
                  setSelectedActions((prev) => prev.filter((a) => a.id !== id));
                  setSelectedReactions((prev) => {
                    const { [id]: _, ...rest } = prev;
                    return rest;
                  });
                }}
                onDeleteReaction={(actionId, reactionIndex) => {
                  setSelectedReactions((prev) => ({
                    ...prev,
                    [actionId]: prev[actionId].filter((_, index) => index !== reactionIndex),
                  }));
                }}
                />              
              ))}
            </div>
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        actions={serviceActions.map((action) => action.description)}
        onSubmit={handleActionSubmit}
      />

      <ReactionModal
        isOpen={isReactionModalOpen}
        onClose={() => setIsReactionModalOpen(false)}
        reactions={availableReactions.map((reaction) => reaction.description)}
        selectedReactions={selectedReactions[currentAction] || []}
        onSubmit={handleReactionSubmit}
      />
    </div>
  );
}
