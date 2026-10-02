import { useRegisterSW } from 'virtual:pwa-register/react';
import './UpdateBanner.css';

function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="update-banner" role="status">
      <span>Update available</span>
      <button type="button" onClick={() => updateServiceWorker(true)}>
        Reload
      </button>
    </div>
  );
}

export default UpdateBanner;
