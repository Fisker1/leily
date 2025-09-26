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
        background: "linear-gradient(135deg, rgba(112,177,255,0.20), rgba(160,255,218,0.20))",
        padding: "6rem 1.25rem",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* soft radial glow backdrop */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-20%",
          background: "radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0) 100%)",
          filter: "blur(40px)",
          pointerEvents: "none"
        }}
      />

      <div style={{ textAlign: "center" }}>
        <img
          src={src}
          alt="Leily – Kommer snart"
          onError={() => { if (src !== imgSrcFallback) setSrc(imgSrcFallback); }}
          style={{
            maxWidth: 980,
            width: "92%",
            height: "auto",
            borderRadius: 20,
            boxShadow: "0 10px 40px rgba(0,0,0,0.06), 0 30px 120px rgba(58,161,255,0.20), 0 30px 120px rgba(97,255,200,0.18)",
            display: "block",
            margin: "0 auto"
          }}
        />
      </div>
    </main>
  );
}
