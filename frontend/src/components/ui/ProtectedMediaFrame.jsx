import { forwardRef } from 'react';
import { preventMediaContextMenu } from '../../utils/mediaProtection';

const ProtectedMediaFrame = forwardRef(({ children, className = '', watermark = false }, ref) => (
  <div
    ref={ref}
    onContextMenu={preventMediaContextMenu}
    className={`protected-media-shell relative overflow-hidden ${className}`.trim()}
  >
    {children}
    {watermark && <div className="protected-media-watermark" aria-hidden />}
  </div>
));

ProtectedMediaFrame.displayName = 'ProtectedMediaFrame';

export default ProtectedMediaFrame;
