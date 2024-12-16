import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../icon/fontawesome';

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
            <a className="font-bold" href="/login">Log in</a>
          </li>
          <li><a className="font-bold" href="/login">Get Start</a></li>
        </ul>
      </div>
      <div className="navbar-end relative">
        <div className="avatar" id="avatar-menu">
          <div className="w-10 rounded-full">
            <img
              src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
              id="avatar-image"
              style={{ cursor: 'pointer' }}
              alt="Avatar"
              onClick={handleAvatarClick}
            />
          </div>
        </div>

        {isMenuVisible && (
          <ul
            className="menu bg-base-200 rounded-box w-56 absolute z-10 mt-3"
            style={{ top: '100%' }}
          >
            <li><a href="/profile">View profile</a></li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navbar;
