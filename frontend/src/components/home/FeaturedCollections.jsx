import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import { mapFeaturedCollections } from '../../utils/categoryContent';
import { FeaturedCollectionsSkeleton } from '../ui/HomeSectionSkeletons';
import OptimizedImage from '../ui/OptimizedImage';

const FeaturedCollections = () => {
  const { categories, loading } = useCatalog();
  const collections = mapFeaturedCollections(categories);

  if (loading) return <FeaturedCollectionsSkeleton />;
  if (collections.length === 0) return null;

  return (
    <section className="scroll-section mx-auto mb-8 mt-8 max-w-7xl px-4 sm:mt-12 sm:px-6 lg:px-8">
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Editor Picks</h2>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">Hand-selected bundles for agency and creator workflows.</p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            to={collection.link}
            className="group relative block aspect-[16/9] overflow-hidden rounded-2xl shadow-md"
          >
            <OptimizedImage
              src={collection.image}
              alt={collection.title}
              width={960}
              height={540}
              quality={75}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${collection.gradient}`} />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                {collection.subtitle}
              </p>
              <h3 className="mt-1 text-lg font-black sm:mt-2 sm:text-2xl">{collection.title}</h3>
            </div>          </Link>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCollections;
