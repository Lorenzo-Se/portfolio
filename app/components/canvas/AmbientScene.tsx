type AmbientSceneProps = {
  reduced: boolean;
};

export function AmbientScene({ reduced }: AmbientSceneProps) {
  return (
    <>
      <div
        className={`site-backdrop${reduced ? " is-static" : ""}`}
        aria-hidden="true"
      >
        <div className="site-backdrop__wash" />
        <div className="site-backdrop__grid" />
        <div className="site-backdrop__floor" />
      </div>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
