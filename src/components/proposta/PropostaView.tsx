"use client";

// Renderiza uma proposta completa (capa + seções) com os efeitos de rolagem.
// modo "publico": rastreia leitura e permite aceitar/recusar/comentar.
// modo "previa": usado no painel enquanto a proposta é preenchida.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Contexto } from "@/lib/contexto";
import { condicao } from "@/lib/contexto";
import type { Secao } from "@/lib/secoes";
import { variaveisCss, type Tema } from "@/lib/tema";
import { brl } from "@/lib/formato";
import { COMPONENTES } from "./Secoes";
import { Icone } from "./icones";
import { useRastreioLeitura } from "./rastreio";
import { Logo } from "@/components/Logo";
import { cnpjValido, emailValido, formatarCnpj, formatarTelefone, telefoneValido } from "@/lib/documentos";

type Props = {
  secoes: Secao[];
  ctx: Contexto;
  tema: Tema;
  modo: "publico" | "previa";
  slug?: string;
  /** Decisão já registrada (proposta aceita/recusada) */
  decisao?: "ACEITA" | "RECUSADA" | null;
  motivosRecusa?: string[];
  /** Nome que a página exibe no aviso de prévia */
  avisoPrevia?: string;
  /** Número de controle exibido discretamente no rodapé */
  codigo?: string;
};

type Modal = null | "aceitar" | "recusar" | "comentar" | "enviado";

const MOTIVOS_PADRAO = ["Desisti do projeto", "Não enxerguei valor", "Preço acima do esperado", "Não foi aprovado pela diretoria", "Escolhi outro fornecedor", "Outro motivo"];

export function PropostaView({ secoes, ctx, tema, modo, slug, decisao, motivosRecusa, avisoPrevia, codigo }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [msgEnviado, setMsgEnviado] = useState("");
  const [estado, setEstado] = useState(decisao ?? null);
  const [toast, setToast] = useState("");
  const [barra, setBarra] = useState(false);
  const visiveis = secoes.filter((s) => condicao(s.mostrarSe, ctx));

  useRastreioLeitura(modo === "publico" ? slug : undefined, raiz);
  useEfeitosRolagem(raiz, modo, setBarra);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const abrir = (m: Modal) => {
    if (modo === "previa") {
      setToast("Prévia: no link real, o cliente registra a decisão aqui e você é avisado.");
      return;
    }
    setModal(m);
  };

  return (
    <div className={`pp ${modo === "previa" ? "previa" : ""}`} ref={raiz} style={variaveisCss(tema) as CSSProperties}>
      {avisoPrevia && <div className="aviso-topo">{avisoPrevia}</div>}
      {estado && (
        <div className="aviso-topo">
          {estado === "ACEITA" ? <>Proposta <b>aceita</b>. Obrigado! Nosso time entrará em contato.</> : <>Proposta recusada. Obrigado pelo retorno.</>}
        </div>
      )}
      <div className="pv-progress" data-progresso />
      <nav className="dots" aria-label="Capítulos">
        {visiveis.filter((s) => s.capitulo || s.tipo === "capa").map((s) => (
          <a key={s.id} href={`#${s.id}`} data-dot={s.id}><span>{s.capitulo ?? "Início"}</span></a>
        ))}
      </nav>

      {visiveis.map((s) => {
        const C = COMPONENTES[s.tipo];
        return (
          <C
            key={s.id}
            s={s as never}
            ctx={ctx}
            logo={s.tipo === "capa" ? tema.logoClaro || tema.logo : undefined}
            onAceitar={() => abrir("aceitar")}
            onComentar={() => abrir("comentar")}
            onRecusar={() => abrir("recusar")}
          />
        );
      })}

      <footer className="pf">
        {tema.logo && <div className="pf-logo"><Logo src={tema.logo} alt={ctx.empresa.nome} altura={40} larguraMax={200} /></div>}
        {ctx.empresa.rodape ?? ctx.empresa.nome}
        {codigo && <div className="pf-codigo">Proposta nº {codigo}</div>}
      </footer>

      {!estado && !ctx.expirada && (
        <div className={`barra-acoes ${barra ? "on" : ""}`}>
          <button className="btn gold" type="button" onClick={() => abrir("aceitar")}>Aceitar proposta</button>
          <button className="btn ghost" type="button" onClick={() => abrir("comentar")}>Comentar</button>
        </div>
      )}

      {modal && modal !== "enviado" && slug && (
        <ModalDecisao
          tipo={modal}
          slug={slug}
          ctx={ctx}
          motivos={motivosRecusa?.length ? motivosRecusa : MOTIVOS_PADRAO}
          onFechar={() => setModal(null)}
          onEnviado={(t, novo) => {
            setMsgEnviado(t);
            setModal("enviado");
            if (novo) setEstado(novo);
          }}
        />
      )}
      {modal === "enviado" && (
        <div className="modal-fundo" onClick={() => setModal(null)}>
          <div className="modal" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div className="ok"><Icone nome="check" /></div>
            <h3>{msgEnviado}</h3>
            <p>{msgEnviado.includes("aceita") ? "Recebemos seus dados. Nosso time entrará em contato para enviar o contrato." : "Quem enviou a proposta já foi avisado."}</p>
            <div className="rodape" style={{ justifyContent: "center" }}>
              <button className="btn" type="button" onClick={() => setModal(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function ModalDecisao({
  tipo, slug, ctx, motivos, onFechar, onEnviado,
}: {
  tipo: "aceitar" | "recusar" | "comentar";
  slug: string;
  ctx: Contexto;
  motivos: string[];
  onFechar: () => void;
  onEnviado: (titulo: string, status?: "ACEITA" | "RECUSADA") => void;
}) {
  const [f, setF] = useState({ nome: "", email: "", motivo: "", texto: "", razaoSocial: "", cnpj: "", nomeSocio: "", whatsapp: "" });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const aceitar = tipo === "aceitar";

  const titulos = { aceitar: "Aceitar a proposta", recusar: "Recusar a proposta", comentar: "Enviar uma dúvida ou comentário" };

  async function enviar() {
    if (aceitar) {
      if (!f.razaoSocial.trim()) return setErro("Informe a razão social.");
      if (!cnpjValido(f.cnpj)) return setErro("CNPJ inválido.");
      if (!f.nomeSocio.trim()) return setErro("Informe o nome do sócio responsável.");
      if (!emailValido(f.email)) return setErro("E-mail inválido.");
      if (!telefoneValido(f.whatsapp)) return setErro("WhatsApp inválido: informe DDD + número.");
    } else {
      if (!f.nome.trim()) return setErro("Informe seu nome.");
      if (tipo === "recusar" && !f.motivo) return setErro("Selecione um motivo.");
      if (tipo === "comentar" && !f.texto.trim()) return setErro("Escreva sua mensagem.");
    }
    setEnviando(true);
    setErro("");
    const r = await fetch(`/api/propostas/${slug}/decisao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: tipo, ...f, nome: aceitar ? f.nomeSocio : f.nome }),
    }).catch(() => null);
    setEnviando(false);
    if (!r?.ok) {
      const j = await r?.json().catch(() => null);
      return setErro(j?.erro ?? "Não foi possível enviar. Tente novamente.");
    }
    if (aceitar) onEnviado("Que ótimo, proposta aceita!", "ACEITA");
    else if (tipo === "recusar") onEnviado("Recebemos sua resposta.", "RECUSADA");
    else onEnviado("Mensagem enviada!");
  }

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{titulos[tipo]}</h3>
        {aceitar ? (
          <>
            <p>
              Investimento de <b>{brl(ctx.calc.totalMensal)}</b> por mês
              {ctx.calc.totalUnico > 0 && <> + <b>{brl(ctx.calc.totalUnico)}</b> de implantação</>}.
              {" "}Preencha os dados para prepararmos o contrato.
            </p>
            <label>Razão social</label>
            <input value={f.razaoSocial} onChange={set("razaoSocial")} autoComplete="organization" autoFocus />
            <label>CNPJ</label>
            <input value={f.cnpj} inputMode="numeric" placeholder="00.000.000/0000-00" onChange={(e) => setF((x) => ({ ...x, cnpj: formatarCnpj(e.target.value) }))} />
            <label>Nome do sócio responsável</label>
            <input value={f.nomeSocio} onChange={set("nomeSocio")} autoComplete="name" />
            <div className="modal-2">
              <div><label>E-mail</label><input type="email" value={f.email} onChange={set("email")} autoComplete="email" /></div>
              <div><label>WhatsApp</label><input value={f.whatsapp} inputMode="tel" placeholder="(11) 91234-5678" onChange={(e) => setF((x) => ({ ...x, whatsapp: formatarTelefone(e.target.value) }))} autoComplete="tel" /></div>
            </div>
          </>
        ) : (
          <>
            <label>Seu nome</label>
            <input value={f.nome} onChange={set("nome")} autoFocus />
            <label>Seu e-mail (opcional)</label>
            <input type="email" value={f.email} onChange={set("email")} />
          </>
        )}
        {tipo === "recusar" && (
          <>
            <label>Motivo</label>
            <select value={f.motivo} onChange={set("motivo")}>
              <option value="">Selecione</option>
              {motivos.map((m) => <option key={m}>{m}</option>)}
            </select>
          </>
        )}
        <label>{tipo === "comentar" ? "Mensagem" : "Comentário (opcional)"}</label>
        <textarea value={f.texto} onChange={set("texto")} maxLength={2000} />
        {erro && <p className="modal-erro" role="alert">{erro}</p>}
        <div className="rodape">
          <button className="btn ghost" type="button" onClick={onFechar}>Cancelar</button>
          <button className="btn gold" type="button" disabled={enviando} onClick={enviar}>
            {enviando ? "Enviando..." : aceitar ? "Confirmar aceite" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Revelar ao rolar, contadores, barra de progresso, capítulos e linha do tempo. */
function useEfeitosRolagem(raiz: React.RefObject<HTMLDivElement | null>, modo: string, setBarra: (v: boolean) => void) {
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const contar = (alvo: HTMLElement) => {
      alvo.querySelectorAll<HTMLElement>("[data-count]").forEach((n) => {
        if (n.dataset.done) return;
        n.dataset.done = "1";
        const fim = parseFloat(n.dataset.count ?? "0");
        const suf = n.dataset.suffix ?? "";
        const fmt = (v: number) => (n.dataset.fmt === "plain" ? String(Math.round(v)) : Math.round(v).toLocaleString("pt-BR"));
        if (reduzido) return;
        const t0 = performance.now();
        const passo = (t: number) => {
          const p = Math.min(1, (t - t0) / 1500);
          n.textContent = fmt(fim * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      });
    };

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting && !e.target.classList.contains("in")) {
          e.target.classList.add("in");
          contar(e.target as HTMLElement);
        }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );
    el.querySelectorAll(".rv").forEach((x) => io.observe(x));

    const capitulos = [...el.querySelectorAll<HTMLElement>("[data-chapter]")];
    const dots = [...el.querySelectorAll<HTMLElement>("[data-dot]")];
    const prog = el.querySelector<HTMLElement>("[data-progresso]");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (prog) prog.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
      let ativo = capitulos[0]?.id;
      capitulos.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.45) ativo = s.id; });
      dots.forEach((a) => a.classList.toggle("on", a.dataset.dot === ativo));
      el.querySelectorAll<HTMLElement>("[data-timeline]").forEach((tl) => {
        const r = tl.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (innerHeight * 0.62 - r.top) / r.height));
        tl.style.setProperty("--p", String(p));
        [...tl.children].forEach((st, i, arr) => st.classList.toggle("on", p >= i / arr.length + 0.015));
      });
      setBarra(scrollY > innerHeight * 0.9);
    };
    dots.forEach((a) => a.addEventListener("click", (ev) => {
      ev.preventDefault();
      document.getElementById(a.dataset.dot!)?.scrollIntoView({ behavior: reduzido ? "auto" : "smooth" });
    }));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [raiz, modo, setBarra]);
}
