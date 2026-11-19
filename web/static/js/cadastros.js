// Cadastros do painel: o que no Next eram componentes React com estado
// (InputImagem.tsx e FormUsuario.tsx). Sem build e sem eval, para a CSP com nonce.
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" }[c];
    });
  }

  function csrf() {
    var el = document.querySelector("input[name=csrfmiddlewaretoken]");
    return el ? el.value : "";
  }

  function postar(url, corpo, json) {
    var opcoes = { method: "POST", headers: { "X-CSRFToken": csrf() }, credentials: "same-origin" };
    if (json) {
      opcoes.headers["Content-Type"] = "application/json";
      opcoes.body = JSON.stringify(corpo);
    } else {
      opcoes.body = corpo;
    }
    return fetch(url, opcoes).then(
      function (r) {
        return r.json().catch(function () { return null; }).then(function (j) { return { r: r, j: j }; });
      },
      function () { return { r: null, j: null }; }
    );
  }

  // ---- InputImagem: envia o arquivo e guarda a URL no campo de texto ----------------
  function iniciarImagem(arquivo) {
    var raiz = arquivo.parentElement;
    var caixa = raiz.firstElementChild;
    var texto = raiz.querySelector("input[name]:not([type=file])");
    var botao = raiz.querySelector("button[type=button]");
    if (!caixa || !texto || !botao) return;

    function mostrar(url) {
      if (url) caixa.innerHTML = '<img src="' + esc(url) + '" alt="" style="max-height:50px;max-width:100%">';
      else caixa.innerHTML = '<span class="muted" style="font-size:12.5px">Sem imagem</span>';
    }
    function erro(msg) {
      var atual = raiz.querySelector(".alerta.erro");
      if (atual) atual.remove();
      if (msg) {
        var div = document.createElement("div");
        div.className = "alerta erro";
        div.textContent = msg;
        raiz.appendChild(div);
      }
    }
    texto.addEventListener("input", function () { mostrar(texto.value); });
    botao.addEventListener("click", function () { arquivo.click(); });
    arquivo.addEventListener("change", function () {
      var f = arquivo.files && arquivo.files[0];
      if (!f) return;
      erro("");
      botao.disabled = true;
      botao.textContent = "...";
      var fd = new FormData();
      fd.append("arquivo", f);
      postar("/api/uploads", fd, false).then(function (x) {
        botao.disabled = false;
        botao.textContent = "Enviar";
        arquivo.value = "";
        if (!x.r || !x.r.ok) return erro((x.j && x.j.erro) || "Falha no envio.");
        texto.value = x.j.url;
        mostrar(x.j.url);
      });
    });
  }

  // ---- FormUsuario ----------------------------------------------------------------------
  function iniciarUsuario(raiz, dados) {
    var u = JSON.parse(JSON.stringify(dados.inicial));
    var msg = {};
    var salvando = false;

    function marcado(m, a) { return !!(u.permissoes.modulos[m] && u.permissoes.modulos[m][a]); }
    function ck(v) { return v ? " checked" : ""; }

    function html() {
      var h = '<div class="card"><h2>Dados de acesso</h2><div class="linha2">' +
        '<div class="campo"><label>Nome</label><input data-acao="nome" value="' + esc(u.nome) + '"></div>' +
        '<div class="campo"><label>E-mail (login)</label><input type="email" data-acao="email" value="' + esc(u.email) + '"></div></div>' +
        '<div class="linha2"><div class="campo"><label>WhatsApp (recebe avisos das suas propostas)</label><input data-acao="whatsapp" value="' + esc(u.whatsapp) + '" placeholder="5511999998888"></div>' +
        '<div class="campo"><label>' + (u.id ? "Nova senha (opcional)" : "Senha (vazio = gerar provisória)") + '</label><input type="password" autocomplete="new-password" data-acao="senha" value="' + esc(u.senha || "") + '"><div class="ajuda">Mínimo 10 caracteres, com letras e números. O usuário troca no primeiro acesso.</div></div></div>' +
        '<label class="check"><input type="checkbox" data-acao="ativo"' + ck(u.ativo) + '> Usuário ativo</label>';
      if (dados.euSuper) h += '<label class="check"><input type="checkbox" data-acao="superAdmin"' + ck(u.superAdmin) + '> Superadministrador (acesso total à plataforma)</label>';
      h += '<h2 style="margin-top:20px">Empresas</h2>';
      if (u.superAdmin) {
        h += '<p class="muted">Superadministrador acessa todas as empresas.</p>';
      } else {
        if (dados.euSuper || dados.euTodas) h += '<label class="check"><input type="checkbox" data-acao="todasEmpresas"' + ck(u.todasEmpresas) + '> Acessa todas as empresas (inclusive as que forem criadas depois)</label>';
        if (!u.todasEmpresas) dados.empresas.forEach(function (e) {
          h += '<label class="check"><input type="checkbox" data-acao="empresa" data-modo="' + esc(e.id) + '"' + ck(u.empresas.indexOf(e.id) >= 0) + '> ' + esc(e.nome) + '</label>';
        });
      }
      if (msg.erro) h += '<div class="alerta erro">' + esc(msg.erro) + '</div>';
      if (msg.ok) h += '<div class="alerta ok">' + esc(msg.ok) + (msg.senha ? ' Senha provisória: <b class="mono">' + esc(msg.senha) + '</b> (anote e envie ao usuário; ele troca no primeiro acesso)' : "") + '</div>';
      h += '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn destaque" type="button" data-acao="salvar"' + (salvando ? " disabled" : "") + '>' + (salvando ? "Salvando..." : "Salvar usuário") + '</button>';
      if (u.id) h += '<button class="btn claro" type="button" data-acao="redefinir">Redefinir senha</button>';
      h += '</div></div><div class="card"><h2>Permissões</h2>';
      if (u.superAdmin) {
        h += '<p class="muted">Superadministrador tem todas as permissões.</p>';
      } else {
        h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"><span class="muted" style="font-size:13px;align-self:center">Aplicar perfil:</span>';
        dados.perfis.forEach(function (p) {
          h += '<button type="button" class="btn claro pequeno" title="' + esc(p.descricao) + '" data-acao="perfil" data-modo="' + esc(p.id) + '">' + esc(p.nome) + '</button>';
        });
        h += '</div><div class="tabela-wrap"><table class="tabela matriz"><thead><tr><th>Módulo</th>';
        dados.acoes.forEach(function (a) { h += "<th>" + esc(a.nome) + "</th>"; });
        h += "</tr></thead><tbody>";
        dados.modulos.forEach(function (m) {
          h += "<tr><td><b>" + esc(m.nome) + "</b></td>";
          dados.acoes.forEach(function (a) {
            h += "<td>" + (m.acoes.indexOf(a.id) >= 0
              ? '<input type="checkbox" data-acao="permissao" data-modo="' + esc(m.id + ":" + a.id) + '"' + ck(marcado(m.id, a.id)) + ' aria-label="' + esc(m.nome + ": " + a.nome) + '">'
              : '<span class="muted">—</span>') + "</td>";
          });
          h += "</tr>";
        });
        h += '</tbody></table></div><label class="check" style="margin-top:12px"><input type="checkbox" data-acao="propostasDeTodos"' + ck(u.permissoes.propostasDeTodos) + '>Vê as propostas de todos os usuários (desmarcado: só as próprias)</label>' +
          '<p class="muted" style="font-size:12.5px">Você só consegue conceder permissões que você mesmo tem.</p>';
      }
      return h + "</div>";
    }

    function desenhar() { raiz.innerHTML = html(); }

    function alternar(m, a) {
      var atual = Object.assign({}, u.permissoes.modulos[m] || {});
      atual[a] = !atual[a];
      if (a === "ver" && !atual.ver) Object.keys(atual).forEach(function (k) { atual[k] = false; });
      if (a !== "ver" && atual[a]) atual.ver = true;
      u.permissoes.modulos[m] = atual;
    }

    function salvar() {
      salvando = true;
      msg = {};
      desenhar();
      postar("/admin/usuarios/salvar", u, true).then(function (x) {
        salvando = false;
        var r = x.j;
        if (!r || r.erro || !r.ok) {
          msg = { erro: (r && r.erro) || "Falha ao salvar." };
        } else {
          msg = { ok: "Usuário salvo.", senha: r.senhaTemporaria };
          if (!u.id) { u.id = r.id; window.history.replaceState(null, "", "/admin/usuarios/" + r.id); }
          u.senha = "";
        }
        desenhar();
      });
    }

    function redefinir() {
      if (!window.confirm("Gerar uma nova senha provisória? O usuário será desconectado.")) return;
      postar("/admin/usuarios/" + encodeURIComponent(u.id) + "/redefinir-senha", {}, true).then(function (x) {
        var r = x.j;
        msg = !r || r.erro || !r.senha ? { erro: (r && r.erro) || "Falha ao redefinir." } : { ok: "Senha redefinida.", senha: r.senha };
        desenhar();
      });
    }

    // Campos de texto: só atualizam o estado (redesenhar tiraria o foco)
    raiz.addEventListener("input", function (e) {
      var acao = e.target.dataset && e.target.dataset.acao;
      if (acao === "nome" || acao === "email" || acao === "whatsapp" || acao === "senha") u[acao] = e.target.value;
    });
    raiz.addEventListener("change", function (e) {
      var el = e.target;
      var acao = el.dataset && el.dataset.acao;
      if (!acao || el.type !== "checkbox") return;
      if (acao === "ativo" || acao === "superAdmin" || acao === "todasEmpresas") u[acao] = el.checked;
      else if (acao === "empresa") {
        var id = el.dataset.modo;
        u.empresas = u.empresas.indexOf(id) >= 0 ? u.empresas.filter(function (x) { return x !== id; }) : u.empresas.concat([id]);
      } else if (acao === "permissao") {
        var p = el.dataset.modo.split(":");
        alternar(p[0], p[1]);
      } else if (acao === "propostasDeTodos") u.permissoes.propostasDeTodos = el.checked;
      desenhar();
    });
    raiz.addEventListener("click", function (e) {
      var el = e.target.closest("button[data-acao]");
      if (!el) return;
      var acao = el.dataset.acao;
      if (acao === "salvar") salvar();
      else if (acao === "redefinir") redefinir();
      else if (acao === "perfil") {
        var perfil = dados.perfis.filter(function (p) { return p.id === el.dataset.modo; })[0];
        if (perfil) { u.permissoes = JSON.parse(JSON.stringify(perfil.permissoes)); desenhar(); }
      }
    });

    desenhar();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("input[type=file][accept^='image/']").forEach(iniciarImagem);
    var raiz = document.querySelector("[data-modo=form-usuario]");
    var dados = document.getElementById("dados-usuario");
    if (raiz && dados) iniciarUsuario(raiz, JSON.parse(dados.textContent));
  });
})();
