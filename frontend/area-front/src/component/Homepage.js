import { useEffect, useState } from 'react';
import lightImage from '../assets/homepage/tile_background_light.png';
import darkImage from '../assets/homepage/tile_background.png';
import wthisflowfy from '../assets/homepage/rb_2092.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../icon/fontawesome';
import Footer from './Footer';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import TeamSection from './TeamSection';

function Homepage() {
    const [headerImage, setHeaderImage] = useState(darkImage);

    useEffect(() => {
        const updateTheme = () => {
            const prefersLightTheme = window.matchMedia('(prefers-color-scheme: light)').matches;
            setHeaderImage(prefersLightTheme ? lightImage : darkImage);
        };

        updateTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        mediaQuery.addEventListener('change', updateTheme);

        return () => mediaQuery.removeEventListener('change', updateTheme);
    }, []);

    return (
      <>
        <Navbar />
        <div className="relative w-full h-[80vh]">
          <img src={headerImage} alt="header_image" className="object-cover w-full h-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1 }}>
              <div className="card shadow-2xl bg-slate-700 dark:bg-white">
                <div className="card-body">
                  <h1 className="text-4xl font-bold dark:text-slate-700 text-white">Welcome to Flowfy</h1>
                  <h3 className="font-semibold dark:text-slate-700 text-white">The best place to connect all your services easily!</h3>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto mt-32" id="wthflowfy">
          <div className="text-center font-bold">
            <h1 className="text-3xl">What is Flowfy</h1>
            <p className="text-lg mt-4">
              Flowfy is a platform that allows you to connect all your services together in one place with action and reaction.
              <br />
              It provides a wide range of services to help you automate your daily tasks.
            </p>
            <div className="flex justify-center">
              <div className="max-w-2xl">
                <img src={wthisflowfy} alt="Flowfy" />
              </div>
            </div>
            <a href="/about" className="btn">What is a action reaction ?</a>
          </div>
        </div>

        <div className="container mx-auto mt-32">
          <div className="text-center font-bold">
            <h1 className="text-3xl">Our services</h1>
            <p className="text-lg mt-4">
              We provide a wide range of services to help you connect all your services together.
            </p>
            <div className="flex justify-center">
              <div className="flex overflow-y-hidden space-x-16 group mt-16 max-w-2xl">
                <div className="flex space-x-16 animate-loop-scroll group-hover:paused">
                  <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'youtube']} className="text-6xl text-red-600" />
                  </a>
                  <a href="https://www.spotify.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'spotify']} className="text-6xl text-green-500" />
                  </a>
                  <a href="https://www.discord.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'discord']} className="text-6xl text-purple-500" />
                  </a>
                  <a href="https://www.github.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'github']} className="text-6xl text-gray-600" />
                  </a>
                  <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'x-twitter']} className="text-6xl text-black dark:text-white" />
                  </a>
                  <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'google']} className="text-6xl text-blue-600" />
                  </a>
                </div>
                <div className="flex space-x-16 animate-loop-scroll group-hover:paused" aria-hidden="true">
                  <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'youtube']} className="text-6xl text-red-600" />
                  </a>
                  <a href="https://www.spotify.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'spotify']} className="text-6xl text-green-500" />
                  </a>
                  <a href="https://www.discord.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'discord']} className="text-6xl text-purple-500" />
                  </a>
                  <a href="https://www.github.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'github']} className="text-6xl text-gray-600" />
                  </a>
                  <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'x-twitter']} className="text-6xl text-black dark:text-white" />
                  </a>
                  <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={['fab', 'google']} className="text-6xl text-blue-600" />
                  </a>
                </div>
              </div>
            </div>
            <a href="/services" className="btn mt-16">Discover all services</a>
          </div>
        </div>
        <div className="container mx-auto mt-32">
          <div className="text-center font-bold">
            <h1 className="text-3xl">Our team</h1>
            <p className="text-lg mt-4">
              Meet the team behind Flowfy.
            </p>
            <TeamSection />
        </div>
        </div>
        <Footer />
      </>
    );
}

export default Homepage;