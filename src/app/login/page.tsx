import { FormLogin } from "./FormLogin";

export default async function Login({ searchParams }: { searchParams: Promise<{ voltar?: string; erro?: string }> }) {
  const { voltar, erro } = await searchParams;
  return (
    <main className="login">
      <div className="card">
        <h1>Propostas</h1>
        <p>Entre para criar e acompanhar suas propostas.</p>
        {erro === "sem-empresa" && <div className="alerta aviso">Seu usuário ainda não está vinculado a nenhuma empresa.</div>}
        <FormLogin voltar={voltar ?? "/admin"} />
      </div>
    </main>
  );
}
