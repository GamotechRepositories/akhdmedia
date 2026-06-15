import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';

const Logo = ({ variant = 'default', theme = 'light', className = '' }) => {
  const isCompact = variant === 'compact';
  const isDark = theme === 'dark';

  const sizeClass = isCompact
    ? 'text-[11px] sm:text-xs'
    : 'text-xs min-[360px]:text-sm sm:text-base md:text-base lg:text-lg xl:text-lg';

  return (
    <Link
      to="/"
      aria-label={`${BRAND.name} home`}
      className={`group inline-flex max-w-full items-center ${className}`}
    >
      <span
        className={`truncate whitespace-nowrap font-black uppercase leading-none tracking-[0.04em] min-[360px]:tracking-[0.05em] sm:tracking-[0.06em] md:tracking-[0.07em] ${sizeClass} ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
      >
        {BRAND.name}
      </span>
    </Link>
  );
};

export default Logo;
