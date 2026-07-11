import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';
import { POLICY_LINKS } from '../constants/policyLinks';
import Logo from './brand/Logo';

const Footer = () => {
  return (
  <footer className="bg-gray-950 pb-28 text-gray-300 sm:pb-24 md:pb-12">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Logo theme="dark" className="mb-4" />
          <p className="mb-4 text-sm leading-relaxed text-gray-400">
            {BRAND.tagline}. License broadcast-ready clips with transparent pricing and instant delivery.
          </p>
          <Link to="/about-us" className="text-sm text-white transition hover:text-gray-200">
            About Us
          </Link>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Policies</h3>
          <ul className="space-y-2 text-sm">
            {POLICY_LINKS.map((policy) => (
              <li key={policy.to}>
                <Link to={policy.to} className="transition hover:text-white">
                  {policy.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Contact</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="font-semibold text-white">{BRAND.name}</li>
            <li>GSTIN: {BRAND.gstNumber}</li>
            <li className="text-xs leading-relaxed text-gray-500">{BRAND.companyAddress}</li>
            <li className="pt-2">
              <Link to="/support" className="font-medium text-white transition hover:text-gray-200">
                Contact Support
              </Link>
            </li>
            <li>Email: {BRAND.supportEmail}</li>
            <li>Only WhatsApp: {BRAND.supportPhone}</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-gray-800 pt-8 text-center text-sm text-gray-500 sm:text-left">
        <p>
          &copy; {new Date().getFullYear()} {BRAND.name}. GSTIN {BRAND.gstNumber}. All footage rights
          reserved by contributors.
        </p>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
