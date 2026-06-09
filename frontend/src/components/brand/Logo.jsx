import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';

const Logo = ({ variant = 'default', theme = 'light', className = '' }) => {
  const isCompact = variant === 'compact';
  const isDark = theme === 'dark';

  return (
    <Link
      to="/"
      aria-label={`${BRAND.name} home`}
      className={`group inline-flex items-center ${className}`}
    >
      <span className="flex flex-col leading-none">
        <span
          className={`font-black uppercase tracking-[0.16em] ${isCompact ? 'text-xs' : 'text-sm'} ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {BRAND.name}
        </span>
        <span
          className={`mt-0.5 font-semibold uppercase tracking-[0.18em] ${isCompact ? 'text-[8px]' : 'text-[9px]'} ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          Stock Video
        </span>
      </span>
    </Link>
  );
};

export default Logo;
