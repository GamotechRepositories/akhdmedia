import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';
import { useCatalog } from '../context/CatalogContext';
import Logo from './brand/Logo';

const Footer = () => {
  const { navLinks } = useCatalog();

  return (
  <footer className="bg-gray-950 pb-28 text-gray-300 sm:pb-24 md:pb-12">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo theme="dark" className="mb-4" />
          <p className="mb-4 text-sm leading-relaxed text-gray-400">
            {BRAND.tagline}. License broadcast-ready clips with transparent pricing and instant delivery.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Footage Types</h3>
          <ul className="space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.id}>
                <Link to={link.path} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Licensing</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="transition hover:text-white">Standard License</Link></li>
            <li><Link to="/" className="transition hover:text-white">Extended License</Link></li>
            <li><Link to="/" className="transition hover:text-white">Enterprise</Link></li>
            <li><Link to="/" className="transition hover:text-white">Refund Policy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Contact</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link to="/support" className="font-medium text-white transition hover:text-gray-200">
                Contact Support
              </Link>
            </li>
            <li>{BRAND.supportEmail}</li>
            <li>{BRAND.supportPhone}</li>
            <li>Mon–Sat · 9AM – 6PM IST</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} {BRAND.name}. All footage rights reserved by contributors.</p>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
