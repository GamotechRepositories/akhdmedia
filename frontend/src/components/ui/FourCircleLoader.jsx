/**
 * Four-corner circle loader — adapted from Uiverse.io by AbanoubMagdy1
 * @see https://uiverse.io/AbanoubMagdy1
 */
const CORNERS = [
  'top-0 left-0',
  'top-0 right-0',
  'bottom-0 left-0',
  'bottom-0 right-0',
];

export default function FourCircleLoader({ className = '' }) {
  return (
    <div
      className={`drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] ${className}`.trim()}
      aria-hidden
    >
      <div className="animate-four-circle-spin relative h-12 w-12">
        {CORNERS.map((position) => (
          <div
            key={position}
            className={`absolute h-[1.2rem] w-[1.2rem] rounded-full bg-[#333] ${position}`}
          />
        ))}
      </div>
    </div>
  );
}
