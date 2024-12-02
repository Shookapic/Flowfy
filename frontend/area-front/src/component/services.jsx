import { HoverEffect } from "./hover-effect";
import React from 'react';

export function Services() { // Renamed to Services to follow React component naming conventions
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
    link: "https://discord.com",
    logo: "/discord-mark-white.png",
    bgColor: "#5865F2",
    textColor: "#FFFFFF",
    scale: 0.7,
  },
  {
    title: "Github",
    description: "Github",
    link: "https://github.com",
    logo: "/github-mark/github-mark-white.png",
    bgColor: "#000000",
    textColor: "#FFFFFF",
    scale: 0.7,
  },
  {
    title: "Spotify",
    description: "Spotify",
    link: "https://spotify.com",
    logo: "/spotify.svg",
    bgColor: "#1ed760",
    textColor: "#FFFFFF",
    scale: 1.4,
  },
  {
    title: "X",
    description: "X",
    link: "https://x.com",
    logo: "/logo-white.png",
    bgColor: "#000000",
    textColor: "#FFFFFF",
    scale: 0.5,
  },
  {
    title: "YouTube",
    description: "Youtube",
    link: "https://youtube.com",
    logo: "/youtube_social_red.png",
    bgColor: "#FF0000",
    textColor: "#FFFFFF",
  },
];