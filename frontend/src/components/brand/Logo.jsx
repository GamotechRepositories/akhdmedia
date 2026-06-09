import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';

const Logo = ({ variant = 'default', theme = 'light', className = '' }) => {
  const isCompact = variant === 'compact';
  const isDark = theme === 'dark';

  return (
    <Link
      to="/"
      aria-label={`${BRAND.name} home`}
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg font-black tracking-tight ${
          isCompact ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm'
        } ${isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}
      >
        AK
      </span>
      <span
        className={`font-black uppercase tracking-[0.14em] leading-none ${isCompact ? 'text-xs' : 'text-sm'} ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
      >
        {BRAND.name}
      </span>
    </Link>
  );
};

export default Logo;
