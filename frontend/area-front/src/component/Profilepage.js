import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../icon/fontawesome';
import Services from './profile/services.json';
import { useState, useEffect } from 'react';

function Profilepage() {

  const [profilePhoto, setProfilePhoto] = useState(
    localStorage.getItem('profilePhoto') || "https://via.placeholder.com/150"
  );

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoDataUrl = e.target.result;
        setProfilePhoto(photoDataUrl);
        localStorage.setItem('profilePhoto', photoDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    }
  }, []);

  return (
    <>
      <Navbar />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1 }}>
        <div className="col-span-1 mt-12 ml-8">
      <div className="flex">
        <img src={profilePhoto} alt="profile" className="rounded-full h-24 w-24" />
        <div className="ml-4 mt-4">
          <h1 className="text-3xl font-bold dark:text-white text-slate-700">Username</h1>
          <p className="text-1xl font-bold dark:text-white text-slate-700">Email</p>
        </div>
      </div>
      <div className="flex">
        <button
          className="btn btn-primary mt-6"
          onClick={() => document.getElementById('photoInput').click()}
        >
          Change photo
        </button>
        <input
          id="photoInput"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
      </div>
    </div>
        </motion.div>
        <div className="col-span-1 mt-12">
          <div className="flex">
            <div className="flex-1">
              <h1 className="text-3xl font-bold dark:text-white text-slate-700">Services</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 mr-4">
                {Services.map((service) => (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 1 }}
                    key={service.id}
                    className={`p-4 rounded-lg ${service.color}`}
                  >
                    <div className="flex justify-center">
                      <FontAwesomeIcon icon={['fab', service.logo]} className="text-6xl text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-center dark:text-white">{service.name}</h1>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1 }}>
        <div className="overflow-x-auto mt-8">
          <h1 className="text-3xl font-bold dark:text-white text-slate-700 text-center mt-8">Action/Reaction</h1>
          <table className="table mt-12">
            <thead>
              <tr>
                <th></th>
                <th>Action</th>
                <th>Reaction</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {Services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <FontAwesomeIcon icon={['fab', service.logo]} className="text-3xl dark:text-white" />
                      </div>
                      <h1 className="text-xl font-bold dark:text-white ml-3">{service.name}</h1>
                    </div>
                  </td>
                  <td>{service.action}</td>
                  <td>{service.reaction}</td>
                  <td>{service.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <Footer />
    </>
  );
}

export default Profilepage;
