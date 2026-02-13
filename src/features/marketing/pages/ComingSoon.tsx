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
        background: "#f6f9fc",
        padding: "4rem 1rem"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img
          src={src}
          alt="Leily – Kommer snart"
          onError={() => { if (src !== imgSrcFallback) setSrc(imgSrcFallback); }}
          style={{
            maxWidth: 980,
            width: "92%",
            height: "auto",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            display: "block",
            margin: "0 auto"
          }}
        />
      </div>
    </main>
  );
}
