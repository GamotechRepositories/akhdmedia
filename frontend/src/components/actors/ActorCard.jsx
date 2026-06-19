import { Link } from 'react-router-dom';
import OptimizedImage from '../ui/OptimizedImage';

const ActorCard = ({ actor, className = '' }) => (
  <Link
    to={`/videos?actor=${encodeURIComponent(actor.id)}`}
    className={`group text-center ${className}`}
  >
    <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 transition-colors group-hover:border-gray-900">
      {actor.image ? (
        <OptimizedImage
          src={actor.image}
          alt={actor.name}
          width={216}
          height={216}
          quality={85}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-2xl font-bold text-gray-500">
          {actor.name?.charAt(0) || '?'}
        </div>
      )}
    </div>
    <p className="mt-3 line-clamp-2 text-xs font-semibold text-gray-900 sm:text-sm">
      {actor.name}
    </p>
  </Link>
);

export default ActorCard;
