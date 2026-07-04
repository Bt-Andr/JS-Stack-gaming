import React, { useState } from "react";
import { aiGenerate } from "./quest-shared.jsx";

export default function AiTest() {
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

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999 }}>
      <div style={{ background: "rgba(15,46,84,0.96)", padding: 12, borderRadius: 8, color: "#EAF2FA", width: 360, boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>AI Test</div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ width: "100%", height: 80, marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handle} disabled={loading} style={{ padding: "8px 12px" }}>{loading ? "Calling…" : "Call AI"}</button>
          <button onClick={() => { setPrompt(""); setResult(null); }} style={{ padding: "8px 12px" }}>Clear</button>
        </div>
        {result && (
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, background: "#061d33", padding: 8, borderRadius: 6 }}>{result.error ? `Error: ${result.text}` : result.text}</pre>
        )}
      </div>
    </div>
  );
}
