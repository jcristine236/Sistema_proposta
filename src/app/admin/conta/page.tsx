import { exigirSessao } from "@/lib/auth";
import { FormConta } from "./FormConta";

export default async function Conta() {
  const { usuario } = await exigirSessao(undefined, "ver", { permitirTrocaSenha: true });
  return (
    <>
      <div className="topo"><div><h1>Minha conta</h1><p>{usuario.email}</p></div></div>
      {usuario.trocarSenha && <div className="alerta aviso" style={{ maxWidth: 560 }}>Por segurança, defina uma senha nova antes de continuar.</div>}
      <FormConta nome={usuario.nome} whatsapp={usuario.whatsapp ?? ""} obrigatorio={usuario.trocarSenha} />
    </>
  );
}
