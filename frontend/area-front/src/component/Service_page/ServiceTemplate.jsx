import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Notification } from './Notification';
import { ServiceHeader } from './ServiceHeader';
import { ActionModal } from './ActionModal';
import { ReactionModal } from './ReactionModal';
import { ActionCard } from './ActionCard';
import { projects } from '../services';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import Navbar from '../Navbar';
import Footer from '../Footer';

const serviceApiEndpoints = {
  'spotify-service': '/api/auth/spotify',
  'youtube-service': '/api/auth/youtube',
  'netflix-service': '/api/auth/netflix',
  'twitch-service': '/api/auth/twitch',
  'twitter-service': '/api/auth/twitter',
  'github-service': '/api/auth/github',
  'discord-service': '/api/auth/discord',
  'google-service': '/api/auth/google',
  'notion-service': '/api/auth/notion',
  'outlook-service': '/api/auth/outlook',
  'reddit-service': '/api/auth/reddit',
};

const serviceIds = {
  'spotify-service': 1,
  'youtube-service': 2,
  'netflix-service': 3,
  'twitch-service': 4,
  'twitter-service': 5,
  'github-service': 6,
  'discord-service': 7,
  'google-service': 8,
  'notion-service': 9,
  'outlook-service': 10,
  'reddit-service': 11,
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
  const [isConnected, setIsConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [connectedServices, setConnectedServices] = useState({});

  useEffect(() => {
    const fetchActionsAndReactions = async () => {
      const serviceId = serviceIds[serviceName];
      if (!serviceId) return;

      try {
        const actionsResponse = await fetch(`https://flowfy.duckdns.org/api/get-actions-by-service-id?serviceId=${serviceId}`);
        const actionsData = await actionsResponse.json();
        setServiceActions(actionsData);

        const reactionsResponse = await fetch(`https://flowfy.duckdns.org/api/get-reactions-by-service-id?serviceId=${serviceId}`);
        const reactionsData = await reactionsResponse.json();
        setAvailableReactions(reactionsData);
      } catch (error) {
        console.error('Error fetching actions and reactions:', error);
      }
    };

    const fetchConnectionStatus = async () => {
      const email = localStorage.getItem('email');
      if (!email) return;
    
      const serviceId = serviceIds[serviceName];
      if (!serviceId) return;
    
      try {
        const response = await fetch(
          `https://flowfy.duckdns.org/api/is_user_logged_service?email=${encodeURIComponent(email)}&service_id=${serviceId}`
        );
    
        if (response.status === 200) {
          setIsConnected(true);
          setConnectedServices((prevState) => ({
            ...prevState,
            [serviceName]: true,
          }));
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error fetching connection status:', error);
      }
    };

    fetchActionsAndReactions();
    fetchConnectionStatus();
  }, [serviceName]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connectedParam = urlParams.get('connected');

    if (connectedParam === 'true') {
      setIsConnected(true);
      setConnectedServices((prevState) => ({
        ...prevState,
        [serviceName]: true,
      }));
      setNotification(`Successfully connected to ${serviceName}.`);
      setTimeout(() => setNotification(null), 3000);
    } else if (connectedParam === 'false') {
      setIsConnected(false);
      setNotification(`Failed to connect to ${serviceName}. Please try again.`);
      setTimeout(() => setNotification(null), 3000);
    }
  }, [serviceName]);

  useEffect(() => {
    const storedAreas = localStorage.getItem(`areas${serviceName.toUpperCase()}`);
    if (storedAreas) {
      const actionsAndReactions = storedAreas.split(',');
      const actions = [];
      const reactions = {};

      actionsAndReactions.forEach((item) => {
        const [action, reaction] = item.split(':');
        const actionId = `${action}_${Date.now()}`;
        actions.push({ id: actionId, name: action });
        reactions[actionId] = reaction ? reaction.split('|') : [];
      });

      setSelectedActions(actions);
      setSelectedReactions(reactions);
    }
  }, [serviceName]);

  const saveToLocalStorage = (actions, reactions) => {
    const areas = actions
      .map((action) => {
        const reactionList = reactions[action.id] || [];
        return `${action.name}:${reactionList.join('|')}`;
      })
      .join(',');
    localStorage.setItem(`areas${serviceName.toUpperCase()}`, areas);
  };

  const handleConnect = async () => {
    if (!serviceName) return;

    const email = localStorage.getItem('email');
    if (!email) return;

    const endpoint = serviceApiEndpoints[serviceName];
    const returnTo = window.location.href;
    // Add platform parameter
    const platform = window.Capacitor?.isNative ? 'mobile' : 'web';
    const url = `https://flowfy.duckdns.org${endpoint}?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}&platform=${platform}`;

    if (window.Capacitor?.isNative) {
      try {
        const handler = App.addListener('appUrlOpen', async ({ url }) => {
          if (url.startsWith('flowfy://oauth/callback')) {
            await Browser.close();
            const urlObj = new URL(url);
            const email = urlObj.searchParams.get('email');
            if (email) {
              setIsConnected(true);
              setConnectedServices(prev => ({
                ...prev,
                [serviceName]: true
              }));
              handler.remove();
              setNotification(`Successfully connected to ${serviceName}`);
              setTimeout(() => setNotification(null), 3000);
            }
          }
        });

        await Browser.open({
          url: url,
          windowName: '_self',
          presentationStyle: 'fullscreen'
        });
      } catch (error) {
        console.error('Error during OAuth flow:', error);
        setNotification('Failed to open authentication window');
        setTimeout(() => setNotification(null), 3000);
      }
    } else {
      window.location.href = url;
    }
  };

  const handleActionSubmit = (action) => {
    if (!isConnected) {
      setNotification('Please connect to the service first');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const actionId = `${action}_${Date.now()}`;
    const newActions = [...selectedActions, { id: actionId, name: action }];
    const newReactions = { ...selectedReactions, [actionId]: [] };
    setSelectedActions(newActions);
    setSelectedReactions(newReactions);
    setIsActionModalOpen(false);
    setNotification('Add at least one reaction to make this action work');
    setTimeout(() => setNotification(null), 3000);
    saveToLocalStorage(newActions, newReactions);
  };

  const handleReactionSubmit = async (reactions) => {
    if (!currentAction) {
      setNotification('Action missing');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const newReactions = {
      ...selectedReactions,
      [currentAction]: reactions,
    };

    const serviceNames = reactions
      .filter((r) => typeof r === 'string')
      .map((r) => r.match(/\((.*?)\)/)?.[1]?.toLowerCase() || '');

    const notConnectedServices = serviceNames.filter((name) => name && !connectedServices[name]);

    if (notConnectedServices.length > 0) {
      setNotification(`Connect to (${notConnectedServices.join('), (')}) to activate this reaction`);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const currentServiceId = serviceIds[serviceName];
    const email = localStorage.getItem('email');
    const isMobile = window.Capacitor?.isNative;
    const platform = isMobile ? 'mobile' : 'web';

    for (const reaction of reactions) {
      const reactionServiceId = availableReactions.find((r) => r.description === reaction)?.required_service_id;
      if (reactionServiceId && reactionServiceId !== currentServiceId) {
        try {
          const response = await fetch(`https://flowfy.duckdns.org/api/is_user_logged_service?email=${encodeURIComponent(email)}&service_id=${reactionServiceId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 200) {
            console.log('User is logged in for this service');
          } else if (response.status === 404 || response.status === 400) {
            const returnTo = window.location.href;
            const serviceName = Object.keys(serviceIds).find(key => serviceIds[key] === reactionServiceId);
            const authUrl = `https://flowfy.duckdns.org${serviceApiEndpoints[serviceName]}?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}&platform=${platform}`;

            if (isMobile) {
              try {
                const { Browser } = await import('@capacitor/browser');
                await Browser.open({
                  url: authUrl,
                  windowName: '_self',
                  presentationStyle: 'fullscreen'
                });
              } catch (error) {
                console.error('Error opening browser:', error);
                setNotification('Failed to open authentication window');
              }
            } else {
              window.location.href = authUrl;
            }
            return;
          } else {
            console.error('Unexpected response status:', response.status);
            setNotification('Failed to check user login status');
            setTimeout(() => setNotification(null), 3000);
            return;
          }
        } catch (error) {
          console.error('Error checking user login status:', error);
          setNotification('Failed to check user login status');
          setTimeout(() => setNotification(null), 3000);
          return;
        }
      }
    }

    setSelectedReactions(newReactions);
    setIsReactionModalOpen(false);
    setCurrentAction(null);
    saveToLocalStorage(selectedActions, newReactions);
    await saveActionReaction();
  };

  const saveActionReaction = async () => {
    const email = localStorage.getItem('email');
    if (!email) {
      setNotification('Email not found in localStorage');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const areas = localStorage.getItem(`areas${serviceName.toUpperCase()}`);
    try {
      const response = await fetch('https://flowfy.duckdns.org/api/save-action-reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, areas }),
      });
      if (response.ok) {
        setNotification('Action-reaction saved successfully');
        setTimeout(() => setNotification(null), 3000);
      } else {
        const errorData = await response.json();
        setNotification(errorData.message || 'Failed to save action-reaction');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error saving action-reaction:', error);
      setNotification('Failed to save action-reaction');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (!service) return <div>Service not found</div>;

  return (
    <>
    <Navbar />
    <div className="min-h-screen">
      {notification && <Notification message={notification} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <ServiceHeader service={service} isConnected={isConnected} onConnect={handleConnect} />
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Actions & Reactions</h2>
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
                  onDeleteAction={(actionId) => {
                    const newActions = selectedActions.filter((a) => a.id !== actionId);
                    const { [actionId]: _, ...rest } = selectedReactions;
                    setSelectedActions(newActions);
                    setSelectedReactions(rest);
                    saveToLocalStorage(newActions, rest);
                  }}
                  onDeleteReaction={(actionId, reactionIndex) => {
                    const newReactions = {
                      ...selectedReactions,
                      [actionId]: selectedReactions[actionId].filter((_, index) => index !== reactionIndex),
                    };
                    setSelectedReactions(newReactions);
                    saveToLocalStorage(selectedActions, newReactions);
                  }}
                  onServiceConnect={handleConnect}
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
    <Footer />
    </>
  );
}