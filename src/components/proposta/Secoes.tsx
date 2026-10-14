"use client";

// Componentes visuais de cada tipo de seção. Recebem a definição da seção
// (do modelo) e o contexto da proposta (dados preenchidos + cálculo).

import { Fragment, useState, type CSSProperties, type ReactNode } from "react";
import type { Contexto } from "@/lib/contexto";
import { preencher } from "@/lib/contexto";
import { brl } from "@/lib/formato";
import type * as S from "@/lib/secoes";
import { Icone } from "./icones";
import { IlustracaoDatacenter } from "./IlustracaoDatacenter";

type P<T> = { s: T; ctx: Contexto; logo?: string; onAceitar?: () => void; onComentar?: () => void; onRecusar?: () => void };

const d = (seg: number) => ({ "--d": `${seg}s` }) as CSSProperties;

/** Texto com {{variáveis}} e **negrito**, sem HTML arbitrário. */
export function Rico({ t, ctx }: { t?: string; ctx: Contexto }) {
  const txt = preencher(t, ctx);
  const partes = txt.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

function Cabecalho({ numero, titulo, eyebrow, ctx }: { numero?: string; titulo: string; eyebrow?: string; ctx: Contexto }) {
  return (
    <div className="chead rv">
      {numero && <span className="chn">{numero}</span>}
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2><Rico t={titulo} ctx={ctx} /></h2>
      </div>
    </div>
  );
}

function Secao({ s, classe, children }: { s: S.SecaoBase; classe: string; children: ReactNode }) {
  return (
    <section className={`ch ${classe}`} id={s.id} data-secao={s.id} data-chapter={s.capitulo}>
      {children}
    </section>
  );
}

export function Capa({ s, ctx, logo }: P<S.SecaoCapa>) {
  return (
    <header className="hero lean" id={s.id} data-secao={s.id} data-chapter={s.capitulo ?? "Início"}>
      <div className="nav">
        {logo ? <img src={logo} alt={ctx.empresa.nome} /> : <b style={{ fontSize: 28 }}>{ctx.empresa.nome}</b>}
        {s.tagline && <span>{preencher(s.tagline, ctx)}</span>}
      </div>
      <div className="cover">
        <div className="eyebrow">{preencher(s.eyebrow, ctx)}</div>
        <h1>
          {preencher(s.titulo, ctx).split("\n").map((l, i) => (
            <Fragment key={i}>{i > 0 && <br />}{l}</Fragment>
          ))}
        </h1>
        <div className="clibig cli">{ctx.cliente}</div>
        <div className="pills">
          {s.selos.map((selo, i) => {
            const validade = selo.estilo === "validade";
            const exp = validade && ctx.expirada;
            return (
              <span key={i} className={`pill ${validade ? (exp ? "exp" : "valid") : ""}`}>
                <Icone nome={selo.icone} />
                <span>{exp ? `Proposta expirada em ${ctx.validade}` : preencher(selo.texto, ctx)}</span>
              </span>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export function Abertura({ s, ctx }: P<S.SecaoAbertura>) {
  return (
    <section className="ch white intro" id={s.id} data-secao={s.id} data-chapter={s.capitulo}>
      <div className="inner">
        <p className="in-k rv"><Rico t={s.chamada} ctx={ctx} /></p>
        <h2 className="in-h rv" style={d(0.08)}>
          <Rico t={s.titulo} ctx={ctx} /> {s.destaque && <span>{preencher(s.destaque, ctx)}</span>}
        </h2>
        <div className="in-row">
          {s.cards.map((c, i) => (
            <div key={i} className="in-c rv" style={d(0.16 + i * 0.1)}>
              <i><Icone nome={c.icone} /></i>
              <b>{preencher(c.titulo, ctx)}</b>
              <span>{preencher(c.texto, ctx)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Sobre({ s, ctx }: P<S.SecaoSobre>) {
  const letras = (s.letras ?? ctx.empresa.nome).toUpperCase();
  return (
    <Secao s={s} classe="tint">
      <div className="inner">
        <Cabecalho numero={s.numero} titulo={s.titulo} ctx={ctx} />
        {s.paragrafos.map((p, i) => (
          <p key={i} className="lead rv" style={d(0.1 + i * 0.05)}><Rico t={p} ctx={ctx} /></p>
        ))}
        <div className="stats4">
          {s.numeros.map((n, i) => (
            <div key={i} className="st rv zoom" style={d(i * 0.1)}>
              <b data-count={n.valor} data-fmt={n.formato === "simples" ? "plain" : undefined} data-suffix={n.sufixo}>
                {n.formato === "simples" ? n.valor : n.valor.toLocaleString("pt-BR")}{n.sufixo}
              </b>
              <span>{n.rotulo}</span>
            </div>
          ))}
        </div>
        {s.valoresTitulo && <div className="eyebrow rv" style={{ margin: "6px 0 4px" }}>{s.valoresTitulo}</div>}
        <div className="cword">
          {s.valores.map((v, i) => (
            <div key={i} className="cl rv" style={d(i * 0.12)}>
              <div className="lt">{letras[i] ?? v.palavra[0]}</div>
              <b>{v.palavra}</b>
              <span>{v.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </Secao>
  );
}

export function Confianca({ s, ctx }: P<S.SecaoConfianca>) {
  const [aba, setAba] = useState(0);
  const grupo = s.grupos[aba];
  return (
    <Secao s={s} classe="white">
      <div className="inner">
        <Cabecalho numero={s.numero} titulo={s.titulo} ctx={ctx} />
        <div className="trust">
          <div className="rv left">
            {s.paragrafos.map((p, i) => (
              <p key={i} className="lead" style={i === 0 ? { marginTop: 0 } : undefined}><Rico t={p} ctx={ctx} /></p>
            ))}
          </div>
          {s.ilustracao === "datacenter" && <div className="rv right"><IlustracaoDatacenter /></div>}
        </div>
        <div className="ctabs rv">
          {s.grupos.map((g, i) => (
            <button key={g.nome} type="button" className={`ctab ${i === aba ? "on" : ""}`} onClick={() => setAba(i)}>{g.nome}</button>
          ))}
        </div>
        <div className="bdgs" key={aba}>
          {grupo?.selos.map((c, i) => (
            <div key={i} className="bdg" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="hex"><b>{c.sigla}</b><i>{c.codigo}</i></div>
              <span>{c.descricao}</span>
            </div>
          ))}
        </div>
      </div>
    </Secao>
  );
}

export function Marcas({ s, ctx }: P<S.SecaoMarcas>) {
  const meio = Math.ceil(s.itens.length / 2);
  const linha = (l: string[]) => [...l, ...l, ...l, ...l].map((n, i) => <div key={i} className="mqi">{n}</div>);
  return (
    <section className="ch tint ecos" id={s.id} data-secao={s.id} data-chapter={s.capitulo}>
      <div className="inner"><Cabecalho titulo={s.titulo} ctx={ctx} /></div>
      <div className="mq"><div className="mq-track">{linha(s.itens.slice(0, meio))}</div></div>
      <div className="mq rev"><div className="mq-track">{linha(s.itens.slice(meio).reverse())}</div></div>
    </section>
  );
}

export function Comparativo({ s, ctx }: P<S.SecaoComparativo>) {
  return (
    <Secao s={s} classe="white">
      <div className="inner">
        <Cabecalho numero={s.numero} titulo={s.titulo} ctx={ctx} />
        <div className="dgrid">
          {s.itens.map((it, i) => (
            <div key={i} className="dc rv" style={d((i % 3) * 0.08)}>
              <div className="top"><i><Icone nome={it.icone} /></i><h3>{it.titulo}</h3></div>
              <div className="y"><Icone nome="check" /><span>{it.nosso}</span></div>
              <div className="n"><Icone nome="x" /><span><em>{s.rotuloMercado}:</em> {it.mercado}</span></div>
            </div>
          ))}
        </div>
      </div>
    </Secao>
  );
}

export function Especificacoes({ s, ctx }: P<S.SecaoEspecificacoes>) {
  return (
    <Secao s={s} classe="tint">
      <div className="inner">
        <Cabecalho numero={s.numero} titulo={s.titulo} eyebrow={s.eyebrow} ctx={ctx} />
        {s.subtitulo && <h3 className="sh rv">{preencher(s.subtitulo, ctx)}</h3>}
        {s.texto && <p className="lead rv" style={{ ...d(0.1), marginTop: 8 }}><Rico t={s.texto} ctx={ctx} /></p>}
        <h3 className="sh rv" style={{ marginTop: 36 }}>
          {preencher(s.tituloTabela, ctx)}
          {s.selo && (
            <span className="planbadge" style={{ marginLeft: 10 }}><Icone nome="cloud" /><span>{preencher(s.selo, ctx)}</span></span>
          )}
        </h3>
        {s.nota && <p className="sm rv">{preencher(s.nota, ctx)}</p>}
        <div className="tw rv">
          <table className="tbl ctable">
            <tbody>
              {s.linhas.map((l, i) => (
                <tr key={i}>
                  <th>{preencher(l.rotulo, ctx)}</th>
                  <td>{preencher(l.valor, ctx).split("\n").map((x, j) => <Fragment key={j}>{j > 0 && <br />}{x}</Fragment>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Secao>
  );
}

export function Investimento({ s, ctx }: P<S.SecaoInvestimento>) {
  const c = ctx.calc;
  const temDesc = c.desconto.valor > 0;
  return (
    <section className="ch navy" id={s.id} data-secao={s.id} data-chapter={s.capitulo}>
      <div className="inner">
        <Cabecalho numero={s.numero} titulo={s.titulo} ctx={ctx} />
        <div className="pricegrid">
          <div className="pcard rv left">
            <h3>{preencher(s.recorrente.titulo, ctx)}</h3>
            {c.base.produto ? (
              <div className="pl"><span>Plano</span><b>{c.base.produto.nome}</b></div>
            ) : (
              <div className="pl"><span>Mensalidade</span><b>{brl(c.base.valor)}</b></div>
            )}
            {c.adicionais.map((a) => (
              <div key={a.campo} className="pl">
                <span>{a.rotuloLinha}</span>
                <b>{a.quantidade.toLocaleString("pt-BR")} {a.unidade}</b>
              </div>
            ))}
            {temDesc && (
              <div className="pl disc">
                <span>{c.desconto.tipo === "pct" ? `Desconto de ${c.desconto.informado.toLocaleString("pt-BR")}%` : "Desconto"}</span>
                <b>aplicado</b>
              </div>
            )}
            <div className="final">
              <small>{preencher(s.recorrente.rotuloTotal, ctx)}</small>
              {temDesc && <span className="old">{brl(c.subtotal)}</span>}
              <strong data-live={c.totalMensal}>{brl(c.totalMensal)}</strong>
              {s.recorrente.rodapeTotal && <em>{preencher(s.recorrente.rodapeTotal, ctx)}</em>}
            </div>
            {s.recorrente.aviso && (
              <div className="nofine">
                <Icone nome={s.recorrente.aviso.icone} />
                <div><b>{s.recorrente.aviso.titulo}</b><p>{s.recorrente.aviso.texto}</p></div>
              </div>
            )}
          </div>
          {s.unico && c.totalUnico > 0 && (
            <div className="pcard impl rv right" style={d(0.12)}>
              <h3>{s.unico.titulo}</h3>
              {s.unico.intro && <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>{s.unico.intro}</p>}
              {s.unico.itens.map((it, i) => (
                <div key={i} className="item">
                  <i><Icone nome={it.icone} /></i>
                  <div><b>{it.titulo}</b><p>{it.texto}</p></div>
                </div>
              ))}
              <div className="once"><span>{s.unico.rotulo}</span><b data-live={c.totalUnico}>{brl(c.totalUnico)}</b></div>
            </div>
          )}
        </div>
        {s.observacoes && ctx.observacoes.length > 0 && (
          <div className="pcard obs rv" style={{ marginTop: 22 }}>
            <h3>{s.observacoes.titulo}</h3>
            {ctx.observacoes.map((o, i) => (
              <div key={i} className="orow"><b>{o.titulo}</b><span>{o.descricao}</span></div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function Resultados({ s, ctx }: P<S.SecaoResultados>) {
  return (
    <Secao s={s} classe="tint">
      <div className="inner">
        <Cabecalho numero={s.numero} titulo={s.titulo} ctx={ctx} />
        {s.blocos.map((b, i) => (
          <div key={i} className="rblock rv">
            <div className="rtag"><span>{i + 1}</span>{b.titulo}</div>
            {b.estilo === "lista" && (
              <div className="rlist">
                {b.itens.map((it, j) => (
                  <div key={j} className="ri"><i><Icone nome={it.icone} /></i><div><b>{it.titulo}</b><p>{it.texto}</p></div></div>
                ))}
              </div>
            )}
            {b.estilo === "checks" && (
              <>
                <div className="rchecks">
                  {b.itens.map((t, j) => <div key={j}><Icone nome="check" />{t}</div>)}
                </div>
                {b.nota && <p className="rgoal">{b.nota}</p>}
              </>
            )}
            {b.estilo === "grade" && (
              <div className="rben">
                {b.itens.map((it, j) => (
                  <div key={j}><i><Icone nome={it.icone} /></i><b>{it.titulo}</b><p>{it.texto}</p></div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Secao>
  );
}

export function Cronograma({ s, ctx }: P<S.SecaoCronograma>) {
  return (
    <Secao s={s} classe="white">
      <div className="inner">
        <Cabecalho numero={s.numero} titulo={s.titulo} ctx={ctx} />
        <div className="tl" data-timeline>
          {s.etapas.map((e, i) => (
            <div key={i} className="tstep rv">
              <div className="tnode"><Icone nome={e.icone} /></div>
              <div className="num">Etapa {i + 1}</div>
              <h3>{e.titulo}</h3>
              <p>{e.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </Secao>
  );
}

export function Texto({ s, ctx }: P<S.SecaoTexto>) {
  return (
    <Secao s={s} classe="white">
      <div className="inner">
        <Cabecalho numero={s.numero} titulo={s.titulo} eyebrow={s.eyebrow} ctx={ctx} />
        {s.paragrafos.map((p, i) => (
          <p key={i} className="lead rv"><Rico t={p} ctx={ctx} /></p>
        ))}
      </div>
    </Secao>
  );
}

export function Fechamento({ s, ctx, onAceitar, onComentar, onRecusar }: P<S.SecaoFechamento>) {
  return (
    <section className="ch navy cta" id={s.id} data-secao={s.id} data-chapter={s.capitulo ?? "Fechamento"}>
      <div className="inner">
        <h2 className="rv"><Rico t={s.titulo} ctx={ctx} /></h2>
        {s.texto && <p className="rv"><Rico t={s.texto} ctx={ctx} /></p>}
        {ctx.expirada ? (
          <div className="until">Esta proposta expirou em {ctx.validade}. Fale com a gente para atualizarmos as condições.</div>
        ) : (
          <>
            <div className="acoes rv" style={d(0.2)}>
              <button className="btn gold" type="button" onClick={onAceitar}>{preencher(s.botao, ctx)}</button>
              <button className="btn ghost" type="button" onClick={onComentar}>Tenho uma dúvida</button>
            </div>
            <div className="until">Proposta válida até {ctx.validade}</div>
            <button className="link-recusa" type="button" onClick={onRecusar}>Não tenho interesse no momento</button>
          </>
        )}
        {s.site && <div className="site">{preencher(s.site, ctx)}</div>}
      </div>
    </section>
  );
}

export const COMPONENTES: Record<S.TipoSecao, (p: P<never>) => ReactNode> = {
  capa: Capa as never,
  abertura: Abertura as never,
  sobre: Sobre as never,
  confianca: Confianca as never,
  marcas: Marcas as never,
  comparativo: Comparativo as never,
  especificacoes: Especificacoes as never,
  investimento: Investimento as never,
  resultados: Resultados as never,
  cronograma: Cronograma as never,
  texto: Texto as never,
  fechamento: Fechamento as never,
};
