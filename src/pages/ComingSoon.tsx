import React from "react";

export default function ComingSoon() {
  React.useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex,nofollow";
    document.head.appendChild(m);
    return () => { document.head.removeChild(m); };
  }, []);

  const imgSrcPrimary = "/coming-soon.jpg";
  const imgSrcFallback = "/coming-soon.png";
  const [src, setSrc] = React.useState(imgSrcPrimary);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, rgba(112,177,255,0.25), rgba(160,255,218,0.25))",
        padding: "4rem 1rem"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img
          src={src}
          alt="Leily – Kommer snart"
          onError={() => { if (src !== imgSrcFallback) setSrc(imgSrcFallback); }}
          style={{ maxWidth: 960, width: "90%", height: "auto", borderRadius: 16 }}
        />
      </div>
    </main>
  );
}
