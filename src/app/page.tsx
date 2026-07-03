// Fázis 0 kezdőoldal: él-e az app + gyors health-jelzés.
// A tényleges pipeline-felület a következő fázisokban épül (lásd docs/ROADMAP.md).

async function getHealth() {
  try {
    const res = await fetch(
      `http://localhost:${process.env.PORT ?? 3000}/api/health`,
      { cache: "no-store" },
    );
    return (await res.json()) as { status: string; db: string };
  } catch {
    return { status: "error", db: "disconnected" };
  }
}

export default async function Home() {
  const health = await getHealth();
  const dbOk = health.db === "connected";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Outreach Automation</h1>
      <p style={{ color: "#9aa1ab", marginTop: 0 }}>
        Fázis 0 — csontváz. A pipeline felülete a következő fázisokban épül.
      </p>

      <div
        style={{
          marginTop: 32,
          padding: 20,
          borderRadius: 12,
          background: "#141821",
          border: "1px solid #222835",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: dbOk ? "#3fb950" : "#f85149",
              display: "inline-block",
            }}
          />
          <strong>Adatbázis:</strong>
          <span style={{ color: dbOk ? "#3fb950" : "#f85149" }}>
            {dbOk ? "kapcsolódik" : "nem elérhető"}
          </span>
        </div>
      </div>
    </main>
  );
}
