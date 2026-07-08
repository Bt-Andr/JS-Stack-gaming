import React, { useState } from "react";
import { aiGenerate } from "./quest-shared.jsx";

export default function AiTest() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("Explique comment fonctionne la closure en JS.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handle() {
    setLoading(true);
    setResult(null);
    try {
      const r = await aiGenerate(prompt, { max_tokens: 256 });
      if (r.error) setResult({ error: true, text: r.message || JSON.stringify(r) });
      else setResult({ error: false, text: r.data.answer });
    } catch (e) {
      setResult({ error: true, text: String(e) });
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Ouvrir AI Test"
        style={{
          position: "fixed", right: 16, bottom: 16, zIndex: 9999,
          width: 44, height: 44, borderRadius: 999,
          background: "rgba(15,46,84,0.96)", color: "#EAF2FA",
          border: "1px solid #2F4F73", boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
          fontSize: 18, cursor: "pointer",
        }}
      >
        🤖
      </button>
    );
  }

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999 }}>
      <div style={{ background: "rgba(15,46,84,0.96)", padding: 12, borderRadius: 8, color: "#EAF2FA", width: 360, boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>AI Test</div>
          <button
            onClick={() => setOpen(false)}
            title="Réduire"
            style={{ background: "transparent", border: "none", color: "#8FA8C2", fontSize: 16, lineHeight: 1, cursor: "pointer", padding: 4 }}
          >
            ×
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: "100%", height: 80, marginBottom: 8, background: "#061d33", color: "#EAF2FA", border: "1px solid #2F4F73", borderRadius: 6, padding: 6, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handle}
            disabled={loading}
            style={{ padding: "8px 12px", background: "#E8964B", color: "#0B2545", border: "none", borderRadius: 6, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Calling…" : "Call AI"}
          </button>
          <button
            onClick={() => { setPrompt(""); setResult(null); }}
            style={{ padding: "8px 12px", background: "transparent", color: "#EAF2FA", border: "1px solid #2F4F73", borderRadius: 6, cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
        {result && (
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, background: "#061d33", color: result.error ? "#E8584B" : "#EAF2FA", padding: 8, borderRadius: 6 }}>{result.error ? `Error: ${result.text}` : result.text}</pre>
        )}
      </div>
    </div>
  );
}
