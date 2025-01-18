import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../icon/fontawesome';
import LogoutButton from './LogoutButton';


const Navbar = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleAvatarClick = () => {
    setIsMenuVisible((prev) => !prev);
  };

  const handleOutsideClick = (event) => {
    if (!event.target.closest('#avatar-menu') && !event.target.closest('#avatar-image')) {
      setIsMenuVisible(false);
    }
  };

  const [profilePhoto] = useState(
    localStorage.getItem('profilePhoto') || 'https://i0.wp.com/www.lifewaycenters.com/wp-content/uploads/2016/06/placeholder-150x150-1.png?fit=150%2C150&ssl=1'
  );

  React.useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex="0" role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex="0"
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li><a className="font-bold" href="/services">Services</a></li>
            <li>
              <a className="font-bold" href="/login">Log in</a>
            </li>
            <li><a className="font-bold" href="/login">Get Start</a></li>
          </ul>
        </div>
        <FontAwesomeIcon icon={['fas', 'circle-nodes']} className="text-2xl text-gray-600" />
        <a className="btn btn-ghost text-xl" href="/">Flowfy</a>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><a className="font-bold" href="/services">Services</a></li>
          <li>
            <a className="font-bold" href="/#wthflowfy">What is Flowfy ?</a>
          </li>
          <li><a className="font-bold" href="/#team">Our Team</a></li>
        </ul>
      </div>
      <div className="navbar-end relative flex items-center gap-4">
        {/* Add the download button before the avatar */}
        <a 
            href="/api/apk"  // Remove the domain since we're using relative path
            className="btn btn-primary hidden md:inline-flex btn-sm lg:btn-md"
            download="flowfy.apk.zip"
          >
            <FontAwesomeIcon icon={['fab', 'android']} className="mr-2" />
            Download APK
        </a>
        
        {/* Mobile version of download button */}
        <a 
          href="https://flowfy.duckdns.org/api/apk" 
          download
          className="btn btn-primary btn-circle btn-xs md:hidden" // Mobile version
          title="Download APK"
        >
          <FontAwesomeIcon icon={['fab', 'android']} />
        </a>
      
        {/* Existing avatar code */}
        <div className="avatar" id="avatar-menu">
          <div className="w-10 rounded-full">
            <img
              src={profilePhoto}
              id="avatar-image"
              style={{ cursor: 'pointer' }}
              alt="Avatar"
              onClick={handleAvatarClick}
            />
          </div>
        </div>
      
        {/* Existing menu code */}
        {isMenuVisible && (
          <ul
            className="menu bg-base-200 rounded-box w-56 absolute z-10 mt-3"
            style={{ top: '100%' }}
          >
            <div className="mt-2 ms-1">
              <LogoutButton />
            </div>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navbar;
