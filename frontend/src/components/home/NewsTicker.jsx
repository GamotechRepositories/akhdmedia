import { useCatalog } from '../../context/CatalogContext';
import { TICKER_ITEMS } from '../../constants/siteContent';

const NewsTicker = () => {
  const { siteContent } = useCatalog();
  const items = siteContent?.tickerItems?.length ? siteContent.tickerItems : TICKER_ITEMS;
  const content = items.map((item) => `◆ ${item}`).join('   ');

  return (
    <div className="overflow-hidden border-b border-gray-800 bg-black py-2 text-white sm:py-3" aria-live="polite">
      <div className="flex w-[200%] animate-marquee whitespace-nowrap">
        <span className="mx-6 text-[10px] font-semibold uppercase tracking-[0.15em] sm:mx-8 sm:text-xs sm:tracking-[0.18em]">{content}</span>
        <span className="mx-6 text-[10px] font-semibold uppercase tracking-[0.15em] sm:mx-8 sm:text-xs sm:tracking-[0.18em]" aria-hidden="true">
          {content}
        </span>
      </div>
    </div>
  );
};

export default NewsTicker;
