import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../icon/fontawesome';

const Footer = () => {
    return (
        <footer className="footer footer-center bg-transparent p-10 mt-12">
            <aside>
              <FontAwesomeIcon icon={['fas', 'circle-nodes']} className="text-2xl text-gray-600" />
              <p className="font-bold">
                Flowfy.
                <br />
                since 2024
              </p>
              <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
            </aside>
        </footer>
    );
}

export default Footer;