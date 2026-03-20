import { useEffect, useRef } from "react";

export default function QRModal({ pass, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pass?.qr_code) return;

    import("https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js").then(() => {
      if (canvasRef.current) {
        window.QRCode.toCanvas(canvasRef.current, pass.qr_code, {
          width: 180,
          margin: 2,
          color: { dark: "#0c4a6e", light: "#ffffff" },
        });
      }
    });
  }, [pass?.qr_code]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `pase-${pass.visitor_name.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `pase-${pass.id}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Pase QR — ${pass.visitor_name}` });
      } else {
        handleDownload();
      }
    });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-end",
        justifyContent: "center", zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "16px 16px 0 0",
          padding: "16px",
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: "32px", height: "3px", background: "var(--color-border)", borderRadius: "2px", margin: "0 auto" }} />

        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text)" }}>
          {pass.visitor_name}
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "-8px" }}>
          {pass.pass_type === "day" ? "Day Pass" : "Single Use"} · {pass.plate || "—"} · {pass.destination?.name ?? "—"}
        </div>

        {/* QR */}
        <div
          style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "10px",
            background: "var(--color-bg)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "10px", padding: "16px",
          }}
        >
          <canvas ref={canvasRef} style={{ borderRadius: "8px" }} />
          <div style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--color-text-muted)", letterSpacing: "1px" }}>
            {pass.qr_code}
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "3px" }}>
            {[
              ["Válido desde", new Date(pass.valid_from).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })],
              ["Válido hasta", new Date(pass.valid_to).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                <span style={{ color: "var(--color-text)", fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1, padding: "11px",
              background: "#0369a1", color: "#fff",
              border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: 500, cursor: "pointer",
            }}
          >
            Descargar QR
          </button>
          <button
            onClick={handleShare}
            style={{
              padding: "11px 14px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "8px", fontSize: "13px", cursor: "pointer",
            }}
          >
            Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
