import { useEffect, useRef, useState } from 'react';
import { buildProductMediaItems } from '../../constants/mediaTypes';
import { handleImageError } from '../../utils/imageFallback';

const ProductMediaGallery = ({ product }) => {
  const videoRef = useRef(null);
  const mediaItems = buildProductMediaItems(product);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const selectedItem = mediaItems[selectedMediaIndex];
  const isVideoSelected = selectedItem?.type === 'video';

  useEffect(() => {
    setSelectedMediaIndex(0);
    setIsVideoPlaying(false);
  }, [product?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return;

    video.load();
    setIsVideoPlaying(false);

    const startDemo = async () => {
      try {
        video.muted = true;
        await video.play();
      } catch {
        setIsVideoPlaying(false);
      }
    };

    startDemo();
  }, [selectedMediaIndex, isVideoSelected, product?.id]);

  const selectMedia = (index) => {
    videoRef.current?.pause();
    setSelectedMediaIndex(index);
    setIsVideoPlaying(false);
  };

  const handlePrevMedia = () => {
    selectMedia(selectedMediaIndex === 0 ? mediaItems.length - 1 : selectedMediaIndex - 1);
  };

  const handleNextMedia = () => {
    selectMedia(selectedMediaIndex === mediaItems.length - 1 ? 0 : selectedMediaIndex + 1);
  };

  const toggleVideoPlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
      return;
    }

    try {
      await video.play();
    } catch {
      try {
        video.muted = true;
        await video.play();
      } catch {
        setIsVideoPlaying(false);
      }
    }
  };

  if (!mediaItems.length) return null;

  return (
    <>
      <div className="relative aspect-[10/9] bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6 shadow-lg max-w-sm mx-auto sm:max-w-md lg:max-w-full lg:mx-0">
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-semibold text-gray-900 shadow-sm">
          {isVideoSelected ? 'demo preview' : 'preview image'}
        </div>

        {mediaItems.length > 1 && (
          <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
            <button
              type="button"
              onClick={handlePrevMedia}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm"
              aria-label="Previous"
            >
              <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNextMedia}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm"
              aria-label="Next"
            >
              <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {isVideoSelected ? (
          <div className="relative h-full w-full bg-black">
            <video
              ref={videoRef}
              key={selectedItem.src}
              src={selectedItem.src}
              poster={selectedItem.poster}
              className="h-full w-full object-cover"
              loop
              muted
              playsInline
              preload="auto"
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onEnded={() => setIsVideoPlaying(false)}
              onError={() => setIsVideoPlaying(false)}
            />

            {!isVideoPlaying && (
              <button
                type="button"
                onClick={toggleVideoPlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
                aria-label="Play demo video"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl backdrop-blur-sm">
                  <svg className="ml-1 h-7 w-7 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}

            {isVideoPlaying && (
              <button
                type="button"
                onClick={toggleVideoPlay}
                className="absolute bottom-14 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition hover:bg-white"
                aria-label="Pause demo video"
              >
                <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <img
            src={selectedItem.src}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => handleImageError(e, 800, 800)}
          />
        )}

        {product.brand && (
          <div className="absolute bottom-1/3 left-4 sm:left-8">
            <div className="bg-gray-800/90 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap">
              {product.brand}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2">
        {mediaItems.map((item, index) => (
          <button
            key={`${item.type}-${index}`}
            type="button"
            onClick={() => selectMedia(index)}
            className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
              selectedMediaIndex === index
                ? 'border-gray-900 shadow-md'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {item.type === 'video' ? (
              <>
                <img src={item.poster} alt="Video preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </>
            ) : (
              <img
                src={item.src}
                alt={item.label}
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, 80, 80)}
              />
            )}
          </button>
        ))}
      </div>
    </>
  );
};

export default ProductMediaGallery;
