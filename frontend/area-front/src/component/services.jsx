import { HoverEffect } from "./hover-effect";
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faGithub, faSpotify, faYoutube, faXTwitter, faReddit } from '@fortawesome/free-brands-svg-icons';
import Navbar from "./Navbar";
import Footer from "./Footer";

export function Services() {
  return (
    <>
    <Navbar />
    <div className="max-w-5xl mx-auto px-8">
      
      <h1 className="text-3xl font-bold text-center mt-12">Choose a service</h1>
      <div className="flex justify-center mt-16">
        <button className="btn btn-primary">
          <a href="/tutorial">Click here to do correctly your AREAS !</a>
        </button>
      </div>
      <HoverEffect items={projects} />
    </div>
    <Footer />
    </>
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
    title: "Reddit",
    description: "Reddit",
    link: "/reddit-service",
    icon: <FontAwesomeIcon icon={faReddit} className="w-20 h-20" style={{ color: "#FFFFFF" }} />,
    bgColor: "#FF0000",
    textColor: "#FFFFFF",
  }
];