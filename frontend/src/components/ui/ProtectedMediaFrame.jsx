import { forwardRef } from 'react';
import { preventMediaContextMenu, preventMediaDrag } from '../../utils/mediaProtection';

const ProtectedMediaFrame = forwardRef(({ children, className = '', watermark = false }, ref) => (
  <div
    ref={ref}
    onContextMenu={preventMediaContextMenu}
    onDragStart={preventMediaDrag}
    className={`protected-media-shell relative overflow-hidden ${className}`.trim()}
  >
    {children}
    {/* Blocks long-press / right-click targeting of the raw img/video under chrome controls. */}
    <div
      className="protected-media-shield"
      aria-hidden
      onContextMenu={preventMediaContextMenu}
      onDragStart={preventMediaDrag}
    />
    {watermark && <div className="protected-media-watermark" aria-hidden />}
  </div>
));

ProtectedMediaFrame.displayName = 'ProtectedMediaFrame';

export default ProtectedMediaFrame;
