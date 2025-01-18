import cedric from '../assets/homepage/cedric.jpg';
import arthur from '../assets/homepage/arthur.jpg';
import evan from '../assets/homepage/evan.jpg';
import manu from '../assets/homepage/manu.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../icon/fontawesome';

function TeamSection() {
    return (
        <div className="flex flex-col items-center mt-24 px-4 sm:px-6 lg:px-8" id="team">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cédric Roulof */}
                <div className="flex flex-col rounded-xl p-4 md:p-6 items-center bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
                    <img src={cedric} alt="Cédric Roulof" className="w-44 h-44 rounded-full" />
                    <div className="mt-4 text-center">
                        <h3 className="font-medium text-gray-800 dark:text-neutral-200">Cédric Roulof</h3>
                        <p className="text-xs uppercase text-gray-500 dark:text-neutral-500">CEO / Full Stack Developer</p>
                    </div>
                    <div className="mt-3 space-x-2">
                        <a className="inline-flex justify-center items-center w-8 h-8 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700" href="https://re.linkedin.com/in/c%C3%A9dric-roulof-494026258">
                            <FontAwesomeIcon icon={['fab', 'linkedin']} />
                        </a>
                        <a className="inline-flex justify-center items-center w-8 h-8 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700" href="https://github.com/Shookapic">
                            <FontAwesomeIcon icon={['fab', 'github']} />
                        </a>
                    </div>
                </div>

                {/* Arthur Mazeau */}
                <div className="flex flex-col rounded-xl p-4 md:p-6 items-center bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
                    <img src={arthur} alt="Arthur Mazeau" className="w-44 h-44 rounded-full" />
                    <div className="mt-4 text-center">
                        <h3 className="font-medium text-gray-800 dark:text-neutral-200">Arthur Mazeau</h3>
                        <p className="text-xs uppercase text-gray-500 dark:text-neutral-500">Full Stack Developer</p>
                    </div>
                    <div className="mt-3 space-x-2">
                        <a className="inline-flex justify-center items-center w-8 h-8 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700" href="https://www.linkedin.com/in/arthur-mazeau-92b239258/">
                            <FontAwesomeIcon icon={['fab', 'linkedin']} />
                        </a>
                        <a className="inline-flex justify-center items-center w-8 h-8 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700" href="https://github.com/Arthurvroum">
                            <FontAwesomeIcon icon={['fab', 'github']} />
                        </a>
                    </div>
                </div>

                {/* Manu Acamas */}
                <div className="flex flex-col rounded-xl p-4 md:p-6 items-center bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
                    <img src={manu} alt="Manu Acamas" className="w-44 h-44 rounded-full" />
                    <div className="mt-4 text-center">
                        <h3 className="font-medium text-gray-800 dark:text-neutral-200">Manu Acamas</h3>
                        <p className="text-xs uppercase text-gray-500 dark:text-neutral-500">Full Stack Developer</p>
                    </div>
                    <div className="mt-3 space-x-2">
                        <a className="inline-flex justify-center items-center w-8 h-8 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700" href="https://www.linkedin.com/in/manu-acamas-vaudemont-41117b258">
                            <FontAwesomeIcon icon={['fab', 'linkedin']} />
                        </a>
                        <a className="inline-flex justify-center items-center w-8 h-8 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700" href="https://github.com/nihilistaken">
                            <FontAwesomeIcon icon={['fab', 'github']} />
                        </a>
                    </div>
                </div>

                {/* Evan Tangatchy */}
                <div className="flex flex-col rounded-xl p-4 md:p-6 items-center bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
                    <img src={evan} alt="Evan Tangatchy" className="w-44 h-44 rounded-full" />
                    <div className="mt-4 text-center">
                        <h3 className="font-medium text-gray-800 dark:text-neutral-200">Evan Tangatchy</h3>
                        <p className="text-xs uppercase text-gray-500 dark:text-neutral-500">Full Stack Developer</p>
                    </div>
                    <div className="mt-3 space-x-2">
                        <a className="inline-flex justify-center items-center w-8 h-8 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700" href="https://www.linkedin.com/in/evan-tangatchy/">
                            <FontAwesomeIcon icon={['fab', 'linkedin']} />
                        </a>
                        <a className="inline-flex justify-center items-center w-8 h-8 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700" href="https://github.com/z0ubi">
                            <FontAwesomeIcon icon={['fab', 'github']} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeamSection;
