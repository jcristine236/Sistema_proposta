import Link from "next/link";

export default function SemPermissao() {
  return (
    <div className="card vazio" style={{ maxWidth: 520, margin: "60px auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Acesso não permitido</h1>
      <p>Seu usuário não tem permissão para esta área. Fale com um administrador.</p>
      <Link className="btn claro" href="/admin" style={{ marginTop: 10 }}>Voltar ao painel</Link>
    </div>
  );
}
