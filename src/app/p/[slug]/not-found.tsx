export default function NaoEncontrada() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Proposta não encontrada</h1>
        <p style={{ color: "#5b6578" }}>Confira o link recebido ou fale com quem enviou a proposta.</p>
      </div>
    </main>
  );
}
