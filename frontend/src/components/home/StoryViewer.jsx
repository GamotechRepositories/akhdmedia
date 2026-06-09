import { Link } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight, IconClose } from '../icons/Icons';

const StoryViewer = ({ stories = [], activeIndex, onClose, onNext, onPrev }) => {
  if (activeIndex === null || !stories[activeIndex]) return null;

  const story = stories[activeIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${story.label} collection preview`}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2 text-white/70 transition hover:text-white safe-top sm:right-6 sm:top-6"
        aria-label="Close story viewer"
      >
        <IconClose className="h-6 w-6 sm:h-8 sm:w-8" />
      </button>
      {activeIndex > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:opacity-80"
          aria-label="Previous story"
        >
          <IconChevronLeft />
        </button>
      )}

      {activeIndex < stories.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:opacity-80"
          aria-label="Next story"
        >
          <IconChevronRight />
        </button>
      )}

      <div
        className="relative mx-auto flex h-full w-full max-w-md flex-col items-center justify-center px-4 pb-24 pt-16 sm:px-6 sm:pb-20 sm:pt-12"
        onClick={(e) => e.stopPropagation()}
      >        <div className="absolute left-4 right-4 top-4 z-20 flex gap-1">
          {stories.map((item, index) => (
            <div
              key={item.id}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                index <= activeIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        <img
          src={story.image}
          alt={story.label}
          className="max-h-[70vh] w-full rounded-lg object-contain"
        />

        <div className="absolute bottom-20 left-4 right-4 text-center sm:bottom-24">
          <p className="rounded-full bg-black/50 px-4 py-2 text-base font-bold text-white backdrop-blur-sm sm:px-6 sm:text-xl">
            #{story.hashtag}
          </p>
          <p className="mt-2 text-xs text-white/70 sm:text-sm">{story.label}</p>          <Link
            to={story.link}
            onClick={onClose}
            className="mt-4 inline-block rounded-full bg-white px-6 py-2 text-xs font-bold uppercase tracking-wider text-gray-900"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
