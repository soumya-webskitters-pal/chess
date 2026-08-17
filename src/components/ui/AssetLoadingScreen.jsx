export default function AssetLoadingScreen({ progress }) {
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  return (
    <div className="asset-loader" style={{ '--loader-poster-desktop': `url(${import.meta.env.BASE_URL}poster-desktop.png)`, '--loader-poster-mobile': `url(${import.meta.env.BASE_URL}poster-mobile.png)` }} role="status" aria-live="polite" aria-label={`Loading chess assets: ${roundedProgress}%`}>
      <div className="asset-loader-progress-wrap">
        <div className="asset-loader-progress" aria-hidden="true"><span style={{ width: `${roundedProgress}%` }} /></div>
        <strong className="asset-loader-value">{roundedProgress}%</strong>
      </div>
    </div>
  );
}
