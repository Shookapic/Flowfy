import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../icon/fontawesome';
import Footer from './Footer';
import Navbar from './Navbar';
import actionreaction from '../assets/aboutpage/action_reaction.png';
import { motion } from 'framer-motion';

function Aboutpage() {
    return (
        <>
        <Navbar />
        <div className="container mx-auto mt-12">
            <div className="grid grid-cols-2 gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1 }}>
                <div className="col-span-1">
                    <div className="text-center font-bold">
                        <h1 className="text-3xl">What is an action and reaction ?</h1>
                        <p className="text-lg mt-4">
                            An action is a service that you want to use, like Gmail, Slack, or Spotify.
                            <br />
                            A reaction is a service that you want to trigger, like sending an email, a message, or a notification.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <div className="max-w-2xl">
                            <img src={actionreaction} alt="Action Reaction" />
                        </div>
                    </div>
                </div>
                </motion.div>
                <div className="col-span-1 text-center">
                    <h1 className="text-3xl font-bold">How it works</h1>
                    <p className="text-lg mt-4 font-bold">
                        For example, you can connect your Gmail account (action) to your Slack account (reaction).
                        <br />
                        When you receive a new email, a message will be sent to your Slack account.
                    </p>
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ duration: 1, delay: 0 }}
                    >
                        <div className="card shadow-2xl mt-12">
                            <div className="card-body">
                                <FontAwesomeIcon icon={['fab', 'google']} className="text-4xl text-red-500" />
                                <h3 className="font-semibold text-slate-700 dark:text-white">Gmail</h3>
                            </div>
                        </div>
                    </motion.div>
                    <FontAwesomeIcon icon="arrow-down" className="text-4xl text-gray-500 dark:text-neutral-400 mt-12" />
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ duration: 1, delay: 0.5 }}
                    >
                        <div className="card shadow-2xl mt-12">
                            <div className="card-body">
                                <FontAwesomeIcon icon={['fab', 'slack']} className="text-4xl text-blue-500" />
                                <h3 className="font-semibold text-slate-700 dark:text-white">Slack</h3>
                            </div>
                        </div>
                    </motion.div>
                    <FontAwesomeIcon icon="equals" className="text-4xl text-gray-500 dark:text-neutral-400 mt-12" />
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ duration: 1, delay: 1 }}
                    >
                        <div className="card shadow-2xl mt-12">
                            <div className="card-body">
                                <FontAwesomeIcon icon="envelope" className="text-4xl text-red-500" />
                                <h3 className="font-semibold text-slate-700 dark:text-white">New message on Slack</h3>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
        <Footer />
        </>
    );
}

export default Aboutpage;