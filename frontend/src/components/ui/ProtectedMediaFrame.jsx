import { preventMediaContextMenu } from '../../utils/mediaProtection';

const ProtectedMediaFrame = ({ children, className = '', watermark = false }) => (
  <div
    onContextMenu={preventMediaContextMenu}
    className={`protected-media-shell relative ${className}`.trim()}
  >
    {children}
    {watermark && <div className="protected-media-watermark z-[5]" aria-hidden />}
  </div>
);

export default ProtectedMediaFrame;
