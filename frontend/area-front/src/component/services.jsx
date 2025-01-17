import { HoverEffect } from "./hover-effect";
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faGithub, faSpotify, faYoutube, faGoogle, faXTwitter, faReddit } from '@fortawesome/free-brands-svg-icons';

export function Services() {
  return (
    <div className="max-w-5xl mx-auto px-8">
      <HoverEffect items={projects} />
    </div>
  );
}

export const projects = [
  {
    title: "Discord",
    description: "Discord",
    link: "/discord-service",
    icon: <FontAwesomeIcon icon={faDiscord} className="w-20 h-20" style={{ color: "#FFFFFF" }} />,
    bgColor: "#5865F2",
    textColor: "#FFFFFF",
  },
  {
    title: "Github",
    description: "Github",
    link: "/github-service",
    icon: <FontAwesomeIcon icon={faGithub} className="w-20 h-20" style={{ color: "#FFFFFF" }} />,
    bgColor: "#000000",
    textColor: "#FFFFFF",
  },
  {
    title: "Spotify",
    description: "Spotify",
    link: "/spotify-service",
    icon: <FontAwesomeIcon icon={faSpotify} className="w-20 h-20" style={{ color: "#FFFFFF" }} />,
    bgColor: "#1ed760",
    textColor: "#FFFFFF",
  },
  {
    title: "X",
    description: "X",
    link: "/x-service",
    icon: <FontAwesomeIcon icon={faXTwitter} className="w-20 h-20" style={{ color: "#FFFFFF" }} />,
    bgColor: "#000000",
    textColor: "#FFFFFF",
  },
  {
    title: "YouTube",
    description: "Youtube",
    link: "/youtube-service",
    icon: <FontAwesomeIcon icon={faYoutube} className="w-20 h-20" style={{ color: "#FFFFFF" }} />,
    bgColor: "#FF0000",
    textColor: "#FFFFFF",
  },
  {
    title: "Reddit",
    description: "Reddit",
    link: "/reddit-service",
    icon: <FontAwesomeIcon icon={faReddit} className="w-20 h-20" style={{ color: "#FFFFFF" }} />,
    bgColor: "#FF0000",
    textColor: "#FFFFFF",
  }
];