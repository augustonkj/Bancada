/* ============================================================
 *  Bancada — motor dos laboratórios (versão 2)
 *
 *  Lab.iniciar({ id })            público, etapas, rodapé, impressão
 *  Lab.publico()                  "fund" | "medio" | "grad" | "prof"
 *  Lab.aoMudarPublico(fn)         executa fn(publico) agora e a cada troca
 *  Lab.questoes(el, lista, opts)  questões filtradas pelo público
 *  Lab.tabela(el, config)         tabela de dados do experimento
 *  Lab.grafico(canvas, config)    gráfico de dispersão/linha
 *  Lab.ajusteLinear(pontos)       regressão linear com incertezas
 *  Lab.fmt(numero, casas)         número com vírgula decimal
 *
 *  Conteúdo por público: qualquer elemento com
 *  data-publico="fund medio grad prof" só aparece para esses públicos.
 * ============================================================ */
(function () {
  "use strict";

  const AUTOR = {
    nome: "Doutorando Antonio Augusto Ignacio",
    email: "augustonkj@gmail.com",
    lattes: "http://lattes.cnpq.br/4063776675134292",
  };

  const PUBLICOS = {
    fund: "Fundamental",
    medio: "Ensino Médio",
    grad: "Graduação",
    prof: "Professor",
  };

  const CURTOS = { fund: "Fund.", medio: "Médio", grad: "Grad.", prof: "Prof." };

  const escapar = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmt = (n, casas = 2) =>
    Number.isFinite(n) ? n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) : "—";

  // mesmo formato de fmt, mas com a vírgula protegida para uso dentro do LaTeX
  const tex = (n, casas = 2) => fmt(n, casas).replace(",", "{,}");

  const lerNumero = (texto) => parseFloat(String(texto).trim().replace(/\s/g, "").replace(",", "."));

  const armazenamento = {
    ler(chave, padrao) {
      try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (_) { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (_) {}
    },
  };

  const cor = (nome) => getComputedStyle(document.body).getPropertyValue(nome).trim();

  let idLab = "lab";

  /* ---------------- Público ---------------- */
  let publicoAtual = (() => {
    const daUrl = new URLSearchParams(location.search).get("publico");
    if (daUrl && PUBLICOS[daUrl]) return daUrl;
    const salvo = armazenamento.ler("bancada:publico", "medio");
    return PUBLICOS[salvo] ? salvo : "medio";
  })();

  const publico = () => publicoAtual;

  function aplicarPublico() {
    document.body.dataset.publicoAtual = publicoAtual;
    document.querySelectorAll("[data-publico]").forEach((el) => {
      el.classList.toggle("visivel", el.dataset.publico.split(/\s+/).includes(publicoAtual));
    });
    document.querySelectorAll(".seletor-publico button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.valor === publicoAtual));
    });
  }

  function definirPublico(valor) {
    if (!PUBLICOS[valor] || valor === publicoAtual) return;
    publicoAtual = valor;
    armazenamento.gravar("bancada:publico", valor);
    aplicarPublico();
    document.dispatchEvent(new CustomEvent("lab:publico", { detail: valor }));
    // se a etapa atual deixou de existir para este público, volta para a primeira
    const atual = document.querySelector(".etapa.ativa");
    if (atual && !etapaDisponivel(atual)) irPara(etapasDisponiveis()[0]?.id);
    else atualizarNavEtapas();
  }

  function aoMudarPublico(fn) {
    fn(publicoAtual);
    document.addEventListener("lab:publico", (e) => fn(e.detail));
  }

  /* ---------------- Etapas ---------------- */
  const etapaDisponivel = (el) => !el.hasAttribute("data-publico") || el.classList.contains("visivel");
  const etapasDisponiveis = () => Array.from(document.querySelectorAll(".etapa")).filter(etapaDisponivel);

  function atualizarNavEtapas() {
    const visitadas = armazenamento.ler(`bancada:${idLab}:visitadas`, []);
    const ativa = document.querySelector(".etapa.ativa");
    document.querySelectorAll(".etapas-nav a").forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      a.classList.toggle("ativa", ativa && ativa.id === id);
      a.classList.toggle("visitada", visitadas.includes(id));
    });
    // numeração contínua considerando só as etapas visíveis
    let n = 0;
    document.querySelectorAll(".etapas-nav li").forEach((li) => {
      const visivel = !li.hasAttribute("data-publico") || li.classList.contains("visivel");
      const num = li.querySelector(".num");
      if (visivel && num && !li.querySelector(".professor")) num.textContent = ++n;
    });
    // botões anterior/próximo
    const lista = etapasDisponiveis();
    lista.forEach((el, i) => {
      const rodape = el.querySelector(".etapa__rodape");
      if (!rodape) return;
      const ant = lista[i - 1], prox = lista[i + 1];
      rodape.innerHTML =
        (ant ? `<a class="botao" href="#${ant.id}">← ${escapar(ant.dataset.titulo || "Anterior")}</a>` : "<span></span>") +
        (prox ? `<a class="botao botao--primario" href="#${prox.id}">${escapar(prox.dataset.titulo || "Próxima")} →</a>` : "");
    });
  }

  function irPara(id, rolar = true) {
    const lista = etapasDisponiveis();
    const alvo = lista.find((e) => e.id === id) || lista[0];
    if (!alvo) return;
    document.querySelectorAll(".etapa").forEach((e) => e.classList.toggle("ativa", e === alvo));
    const visitadas = new Set(armazenamento.ler(`bancada:${idLab}:visitadas`, []));
    visitadas.add(alvo.id);
    armazenamento.gravar(`bancada:${idLab}:visitadas`, Array.from(visitadas));
    atualizarNavEtapas();
    const link = document.querySelector(`.etapas-nav a[href="#${alvo.id}"]`);
    if (link) link.scrollIntoView({ block: "nearest", inline: "center" });
    if (rolar) {
      const nav = document.querySelector(".etapas-nav");
      const topo = document.querySelector(".conteudo").getBoundingClientRect().top + scrollY - (nav ? nav.offsetHeight + 60 : 0);
      if (scrollY > topo) scrollTo({ top: topo });
    }
    document.dispatchEvent(new CustomEvent("lab:etapa", { detail: alvo.id }));
  }

  /* ---------------- Equações (KaTeX) ----------------
   * Escreva as equações em LaTeX: \( … \) na linha e \[ … \] em destaque.
   * O conteúdo criado depois (questões, cálculos) é renderizado automaticamente.
   */
  const KATEX = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/";
  const DELIMITADORES = [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }];
  let katexPronto = false;

  function renderizarMat(el) {
    if (!katexPronto || !el || !window.renderMathInElement) return;
    window.renderMathInElement(el, {
      delimiters: DELIMITADORES,
      throwOnError: false,
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option", "select", "input"],
    });
  }

  function carregarKatex() {
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = KATEX + "katex.min.css";
    document.head.appendChild(css);
    const carregar = (src) => new Promise((ok, erro) => {
      const sc = document.createElement("script"); sc.src = src; sc.onload = ok; sc.onerror = erro;
      document.head.appendChild(sc);
    });
    carregar(KATEX + "katex.min.js")
      .then(() => carregar(KATEX + "contrib/auto-render.min.js"))
      .then(() => {
        katexPronto = true;
        renderizarMat(document.body);
        // renderiza o que for inserido depois; só há nova mutação se houver LaTeX a converter
        let pendentes = new Set(), agendado = false;
        new MutationObserver((muts) => {
          muts.forEach((m) => {
            const alvo = m.target.nodeType === 1 ? m.target : m.target.parentElement;
            if (alvo && !alvo.closest(".katex")) pendentes.add(alvo);
          });
          if (!agendado) {
            agendado = true;
            requestAnimationFrame(() => { agendado = false; const els = pendentes; pendentes = new Set(); els.forEach((e) => e.isConnected && renderizarMat(e)); });
          }
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
      })
      .catch(() => { /* sem internet: as equações ficam em texto LaTeX */ });
  }

  /* ---------------- Início ---------------- */
  function iniciar({ id } = {}) {
    idLab = id || location.pathname;
    carregarKatex();

    // seletor de público
    document.querySelectorAll(".seletor-publico").forEach((grupo) => {
      grupo.innerHTML = Object.entries(PUBLICOS)
        .map(([v, nome]) => `<button type="button" data-valor="${v}"><span class="longo">${nome}</span><span class="curto">${CURTOS[v]}</span></button>`).join("");
      grupo.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-valor]");
        if (b) definirPublico(b.dataset.valor);
      });
    });
    aplicarPublico();

    // a barra de etapas gruda logo abaixo da barra superior (cuja altura muda no celular)
    const barra = document.querySelector(".barra"), nav = document.querySelector(".etapas-nav");
    if (barra && nav) {
      const ajustar = () => { nav.style.top = barra.offsetHeight + "px"; };
      ajustar();
      window.addEventListener("resize", ajustar);
    }

    // rodapé com autoria
    const rodape = document.querySelector(".rodape-lab__dentro");
    if (rodape) {
      rodape.innerHTML =
        `<div>Desenvolvido por <strong>${escapar(AUTOR.nome)}</strong><br>` +
        `<a href="mailto:${AUTOR.email}">${AUTOR.email}</a> · ` +
        `<a href="${AUTOR.lattes}" target="_blank" rel="noopener">Currículo Lattes</a></div>` +
        `<div>Bancada · laboratório virtual de ensino<br>` +
        `<a href="https://creativecommons.org/licenses/by-nc/4.0/deed.pt-br" target="_blank" rel="noopener license">CC BY-NC 4.0</a> · uso comercial não autorizado</div>`;
    }

    // etapas: navegação pelo endereço (#preparacao, #pratica…)
    document.querySelectorAll(".etapa").forEach((el) => {
      if (!el.querySelector(".etapa__rodape")) {
        const r = document.createElement("div");
        r.className = "etapa__rodape nao-imprimir";
        el.appendChild(r);
      }
    });
    window.addEventListener("hashchange", () => irPara(location.hash.slice(1)));
    irPara(location.hash.slice(1), false);

    // roteiro com marcação de "feito"
    const feitas = armazenamento.ler(`bancada:${idLab}:passos`, []);
    document.querySelectorAll(".roteiro > li").forEach((li, i) => {
      const chave = li.dataset.passo || String(i);
      const rotulo = document.createElement("label");
      rotulo.className = "etapa-check nao-imprimir";
      rotulo.innerHTML = `<input type="checkbox"> Concluí este passo`;
      const caixa = rotulo.querySelector("input");
      caixa.checked = feitas.includes(chave);
      li.classList.toggle("feito", caixa.checked);
      caixa.addEventListener("change", () => {
        li.classList.toggle("feito", caixa.checked);
        const atual = new Set(armazenamento.ler(`bancada:${idLab}:passos`, []));
        caixa.checked ? atual.add(chave) : atual.delete(chave);
        armazenamento.gravar(`bancada:${idLab}:passos`, Array.from(atual));
      });
      const div = document.createElement("div");
      div.appendChild(rotulo);
      li.appendChild(div);
    });

    document.querySelectorAll("[data-imprimir]").forEach((b) => b.addEventListener("click", () => {
      irPara("relatorio", false);
      setTimeout(() => window.print(), 50);
    }));
  }

  /* ---------------- Questões ----------------
   * Tipos:
   *  { tipo: "multipla", enunciado, alternativas: [...], correta: índice, explicacao }
   *  { tipo: "numerica", enunciado, resposta, tolerancia (fração), unidade, explicacao }
   *    - resposta pode ser função () => número (valores que dependem do experimento)
   *  { tipo: "aberta", enunciado, modelo }
   *  publico: ["fund", "medio", ...]  (opcional; sem ele, aparece para todos)
   *  nivel: rótulo exibido no canto ("fácil", "desafio"…)
 *  dica: texto de ajuda exibido pelo botão "Ver dica" (opcional)
   * opts: { chave, semPlacar, aoAtualizar(acertos, total) }
   */
  function questoes(el, listaCompleta, { aoAtualizar, chave: nomeChave = "questoes", semPlacar = false } = {}) {
    const letras = "abcdefgh";
    let lista = [], estado = {}, chave = "";

    el.classList.add("questoes");

    function render() {
      lista = listaCompleta.filter((q) => !q.publico || q.publico.includes(publicoAtual));
      chave = `bancada:${idLab}:${nomeChave}:${publicoAtual}`;
      estado = armazenamento.ler(chave, {});
      el.innerHTML = lista.map((q, i) => {
        const cabeca = `<div class="questao__cabeca"><span>${escapar(q.nivel || "")}</span></div>`;
        const enunciado = `<div class="questao__enunciado">${q.enunciado}</div>`;
        let corpo;
        if (q.tipo === "multipla") {
          corpo = `<ul class="alternativas">${q.alternativas.map((alt, j) => `
            <li><label class="alternativa">
              <input type="radio" name="${nomeChave}-q${i}" value="${j}">
              <span class="alternativa__letra">${letras[j]})</span>
              <span>${alt}</span>
            </label></li>`).join("")}</ul>
            <div class="botoes"><button type="button" class="botao botao--primario" data-acao="verificar">Verificar resposta</button>${q.dica ? '<button type="button" class="botao" data-acao="dica">💡 Ver dica</button>' : ""}</div>`;
        } else if (q.tipo === "numerica") {
          corpo = `<div class="resposta-numerica">
              <input type="text" inputmode="decimal" placeholder="Sua resposta" aria-label="Resposta da questão ${i + 1}">
              ${q.unidade ? `<span class="mono">${escapar(q.unidade)}</span>` : ""}
            </div>
            <div class="botoes"><button type="button" class="botao botao--primario" data-acao="verificar">Verificar resposta</button>${q.dica ? '<button type="button" class="botao" data-acao="dica">💡 Ver dica</button>' : ""}</div>`;
        } else {
          corpo = `<div class="resposta-aberta"><textarea placeholder="Escreva sua resposta com suas palavras…" aria-label="Resposta da questão ${i + 1}"></textarea></div>
            <div class="botoes"><button type="button" class="botao" data-acao="modelo">${q.botao || "Comparar com a resposta-modelo"}</button>${q.dica ? '<button type="button" class="botao" data-acao="dica">💡 Ver dica</button>' : ""}</div>`;
        }
        return `<article class="questao" data-i="${i}">${cabeca}${enunciado}${corpo}<div class="retorno-area"></div></article>`;
      }).join("") + (semPlacar ? "" : `
        <div class="placar">
          <div><div style="font-size:13px;font-weight:700;color:var(--tinta-suave)">SEU DESEMPENHO</div>
          <div class="placar__numero" data-placar>0 de 0</div></div>
          <button type="button" class="botao nao-imprimir" data-acao="recomecar">Refazer questões</button>
        </div>`);
      restaurar();
      atualizarPlacar();
    }

    const objetivas = () => lista.filter((q) => q.tipo !== "aberta").length;

    function atualizarPlacar() {
      const acertos = Object.values(estado).filter((e) => e.certo === true).length;
      if (!semPlacar) el.querySelector("[data-placar]").textContent = `${acertos} de ${objetivas()} acertos`;
      if (aoAtualizar) aoAtualizar(acertos, objetivas());
    }

    function mostrarRetorno(art, q, certo, extra) {
      const area = art.querySelector(".retorno-area");
      art.classList.toggle("correta", certo === true);
      art.classList.toggle("incorreta", certo === false);
      if (q.tipo === "aberta") {
        area.innerHTML = `<div class="retorno retorno--modelo"><strong>${q.rotuloModelo || "Resposta-modelo"}</strong>${q.modelo}</div>`;
        return;
      }
      area.innerHTML = certo
        ? `<div class="retorno retorno--certo"><strong>Correto!</strong>${q.explicacao ? `<p>${q.explicacao}</p>` : ""}</div>`
        : `<div class="retorno retorno--errado"><strong>Ainda não.</strong>${extra || ""}${q.explicacao ? `<p>${q.explicacao}</p>` : ""}</div>`;
    }

    function marcarAlternativas(art, q, escolhida) {
      art.querySelectorAll(".alternativa").forEach((lab, j) => {
        lab.classList.toggle("marcada-certa", j === q.correta && escolhida === q.correta);
        lab.classList.toggle("marcada-errada", j === escolhida && escolhida !== q.correta);
      });
    }

    function restaurar() {
      el.querySelectorAll(".questao").forEach((art) => {
        const i = +art.dataset.i, q = lista[i], e = estado[i];
        if (!e) return;
        if (q.tipo === "multipla") {
          const r = art.querySelector(`input[value="${e.valor}"]`);
          if (r) { r.checked = true; marcarAlternativas(art, q, +e.valor); }
        } else if (q.tipo === "numerica") {
          art.querySelector("input").value = e.valor;
        } else {
          art.querySelector("textarea").value = e.valor || "";
        }
        if (e.verificada) mostrarRetorno(art, q, e.certo);
      });
    }

    function mostrarAviso(art, texto) {
      art.querySelector(".retorno-area").innerHTML = `<div class="retorno retorno--modelo"><p>${texto}</p></div>`;
    }

    // respostas abertas são salvas enquanto o aluno digita (usadas no relatório)
    el.addEventListener("input", (ev) => {
      const t = ev.target.closest("textarea");
      if (!t) return;
      const i = +t.closest(".questao").dataset.i;
      estado[i] = Object.assign(estado[i] || {}, { valor: t.value });
      armazenamento.gravar(chave, estado);
      document.dispatchEvent(new CustomEvent("lab:respostas"));
    });

    el.addEventListener("click", (ev) => {
      const botao = ev.target.closest("[data-acao]");
      if (!botao) return;

      if (botao.dataset.acao === "recomecar") {
        estado = {};
        armazenamento.gravar(chave, estado);
        render();
        return;
      }

      const art = botao.closest(".questao");
      const i = +art.dataset.i, q = lista[i];

      if (botao.dataset.acao === "dica") {
        art.querySelector(".retorno-area").innerHTML = `<div class="retorno retorno--modelo"><strong>💡 Dica</strong><p>${q.dica}</p></div>`;
        return;
      }

      if (q.tipo === "multipla") {
        const marcada = art.querySelector("input[type=radio]:checked");
        if (!marcada) { mostrarAviso(art, "Escolha uma alternativa antes de verificar."); return; }
        const valor = +marcada.value, certo = valor === q.correta;
        marcarAlternativas(art, q, valor);
        estado[i] = { valor, certo, verificada: true };
        mostrarRetorno(art, q, certo);
      } else if (q.tipo === "numerica") {
        const texto = art.querySelector("input").value;
        const valor = lerNumero(texto);
        if (!Number.isFinite(valor)) { mostrarAviso(art, "Digite um número (use vírgula ou ponto para decimais)."); return; }
        const esperado = typeof q.resposta === "function" ? q.resposta() : q.resposta;
        if (!Number.isFinite(esperado)) { mostrarAviso(art, q.semDados || "Faça as medições do experimento antes de responder."); return; }
        const tol = q.tolerancia ?? 0.03;
        const certo = Math.abs(valor - esperado) <= Math.abs(esperado) * tol + 1e-9;
        const dica = valor !== 0 && Math.abs(valor / esperado - 1) < 0.25
          ? "<p>Você está perto — confira os arredondamentos e as unidades.</p>" : "";
        estado[i] = { valor: texto, certo, verificada: true };
        mostrarRetorno(art, q, certo, dica);
      } else {
        const texto = art.querySelector("textarea").value.trim();
        if (texto.length < 10) { mostrarAviso(art, "Escreva sua resposta antes — é assim que se aprende!"); return; }
        estado[i] = { valor: texto, verificada: true };
        mostrarRetorno(art, q, null);
      }
      armazenamento.gravar(chave, estado);
      atualizarPlacar();
    });

    document.addEventListener("lab:publico", render);
    render();

    return {
      // respostas atuais (para o relatório)
      respostas: () => lista.map((q, i) => ({ q, valor: estado[i]?.valor, certo: estado[i]?.certo })),
    };
  }

  /* ---------------- Tabela de dados ----------------
   * config: { colunas: [{ chave, titulo, casas, texto }], aoMudar(linhas), nomeArquivo, textoVazio }
   *   texto: true alinha a coluna à esquerda. aoMudar também é chamado na criação.
   *   Colunas com publico: [...] só aparecem para esses públicos.
   */
  function tabela(el, config) {
    const chave = `bancada:${idLab}:tabela`;
    let linhas = armazenamento.ler(chave, []);
    el.classList.add("tabela-dados");

    const colunas = () => config.colunas.filter((c) => !c.publico || c.publico.includes(publicoAtual));

    function estrutura() {
      el.innerHTML = `
        <div class="tabela-dados__rolagem"><table>
          <thead><tr><th>#</th>${colunas().map((c) => `<th${c.texto ? ' class="esq"' : ""}>${c.titulo}</th>`).join("")}<th class="nao-imprimir"></th></tr></thead>
          <tbody></tbody>
        </table></div>
        <div class="botoes nao-imprimir">
          <button type="button" class="botao" data-acao="csv">⤓ Baixar tabela (CSV)</button>
          <button type="button" class="botao" data-acao="limpar">Limpar tabela</button>
        </div>`;
      desenhar();
    }

    const celula = (l, c) => typeof l[c.chave] === "number" ? fmt(l[c.chave], c.casas ?? 2) : escapar(l[c.chave] ?? "—");

    function desenhar() {
      const corpo = el.querySelector("tbody");
      const cols = colunas();
      corpo.innerHTML = linhas.length
        ? linhas.map((l, i) => `<tr><td>${i + 1}</td>${cols.map((c) =>
            `<td${c.texto ? ' class="esq"' : ""}>${celula(l, c)}</td>`).join("")}
            <td class="nao-imprimir"><button type="button" class="tabela-dados__remover" data-remover="${i}" aria-label="Remover medição ${i + 1}">×</button></td></tr>`).join("")
        : `<tr class="tabela-dados__vazia"><td colspan="${cols.length + 2}">${config.textoVazio || "Nenhuma medição registrada ainda."}</td></tr>`;
      armazenamento.gravar(chave, linhas);
      if (config.aoMudar) config.aoMudar(linhas);
    }

    el.addEventListener("click", (ev) => {
      const rem = ev.target.closest("[data-remover]");
      if (rem) { linhas.splice(+rem.dataset.remover, 1); desenhar(); return; }
      const acao = ev.target.closest("[data-acao]")?.dataset.acao;
      if (acao === "limpar") { linhas = []; desenhar(); }
      if (acao === "csv") {
        const cols = colunas();
        const cab = ["#", ...cols.map((c) => c.titulo.replace(/<[^>]+>/g, ""))].join(";");
        const corpoCsv = linhas.map((l, i) => [i + 1, ...cols.map((c) =>
          typeof l[c.chave] === "number" ? fmt(l[c.chave], c.casas ?? 2).replace(/\./g, "") : l[c.chave])].join(";")).join("\n");
        const blob = new Blob(["﻿" + cab + "\n" + corpoCsv], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (config.nomeArquivo || "medicoes") + ".csv";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    });

    document.addEventListener("lab:publico", estrutura);
    estrutura();

    return {
      adicionar(linha) { linhas.push(linha); desenhar(); },
      linhas: () => linhas.slice(),
      limpar() { linhas = []; desenhar(); },
      // HTML estático da tabela (para o relatório)
      html() {
        const cols = colunas();
        if (!linhas.length) return "";
        return `<div class="tabela-dados"><div class="tabela-dados__rolagem"><table><thead><tr><th>#</th>${cols.map((c) => `<th${c.texto ? ' class="esq"' : ""}>${c.titulo}</th>`).join("")}</tr></thead><tbody>` +
          linhas.map((l, i) => `<tr><td>${i + 1}</td>${cols.map((c) => `<td${c.texto ? ' class="esq"' : ""}>${celula(l, c)}</td>`).join("")}</tr>`).join("") +
          `</tbody></table></div></div>`;
      },
    };
  }

  /* ---------------- Gráfico ----------------
   * config: {
   *   rotuloX, rotuloY,
   *   series: [{ pontos: [{x, y, ey}], tipo: "pontos"|"linha", cor: "--cor-area" | "#hex", tracejado }],
   *   xMin, xMax, yMin, yMax, passoX, passoY (opcionais), marcas: [{ x, rotulo }]
   * }
   * Retorna { atualizar(parcial), imagem() }
   */
  function grafico(canvas, configInicial) {
    let config = Object.assign({ series: [] }, configInicial);
    const ctx = canvas.getContext("2d");
    const resolverCor = (c) => (c && c.startsWith("--") ? cor(c) : c || cor("--cor-area"));

    function escalaBonita(min, max, n = 5) {
      if (min === max) { min -= 1; max += 1; }
      // valores ligeiramente negativos (ex.: intercepto de uma reta ajustada) não empurram o eixo abaixo de zero
      if (min < 0 && max > 0 && -min < 0.03 * max) min = 0;
      const passoBruto = (max - min) / n;
      const mag = Math.pow(10, Math.floor(Math.log10(passoBruto)));
      const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= passoBruto) || 10 * mag;
      return { min: Math.floor(min / passo) * passo, max: Math.ceil(max / passo) * passo, passo };
    }
    const casasDe = (passo) => (passo >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(passo) - 1e-9)));

    function desenhar() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);

      const todos = config.series.flatMap((s) => s.pontos);
      const xs = todos.map((p) => p.x), ys = todos.map((p) => p.y + (p.ey || 0));
      const ex = escalaBonita(config.xMin ?? (xs.length ? Math.min(0, ...xs) : 0), config.xMax ?? (xs.length ? Math.max(...xs) : 1));
      const ey = escalaBonita(config.yMin ?? (ys.length ? Math.min(0, ...ys) : 0), config.yMax ?? (ys.length ? Math.max(...ys) : 1));
      if (config.xMin != null) ex.min = config.xMin;
      if (config.xMax != null) ex.max = config.xMax;
      if (config.yMin != null) ey.min = config.yMin;
      if (config.yMax != null) ey.max = config.yMax;
      if (config.passoX) ex.passo = config.passoX;
      if (config.passoY) ey.passo = config.passoY;

      const m = { e: 62, d: 18, t: 16, b: 48 };
      const px = (x) => m.e + ((x - ex.min) / (ex.max - ex.min)) * (w - m.e - m.d);
      const py = (y) => h - m.b - ((y - ey.min) / (ey.max - ey.min)) * (h - m.t - m.b);

      ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#e8ecf3";
      ctx.fillStyle = "#6b7588";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (let x = Math.ceil(ex.min / ex.passo - 1e-9) * ex.passo; x <= ex.max + 1e-9; x += ex.passo) {
        ctx.beginPath(); ctx.moveTo(px(x), m.t); ctx.lineTo(px(x), h - m.b); ctx.stroke();
        ctx.fillText(fmt(Math.abs(x) < 1e-9 ? 0 : x, casasDe(ex.passo)), px(x), h - m.b + 8);
      }
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      for (let y = Math.ceil(ey.min / ey.passo - 1e-9) * ey.passo; y <= ey.max + 1e-9; y += ey.passo) {
        ctx.beginPath(); ctx.moveTo(m.e, py(y)); ctx.lineTo(w - m.d, py(y)); ctx.stroke();
        ctx.fillText(fmt(Math.abs(y) < 1e-9 ? 0 : y, casasDe(ey.passo)), m.e - 10, py(y));
      }
      // eixos
      ctx.strokeStyle = "#9aa4b5";
      ctx.beginPath(); ctx.moveTo(m.e, m.t); ctx.lineTo(m.e, h - m.b); ctx.lineTo(w - m.d, h - m.b); ctx.stroke();

      ctx.fillStyle = "#1a2233";
      ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(config.rotuloX || "", (m.e + w - m.d) / 2, h - 4);
      ctx.save();
      ctx.translate(14, (m.t + h - m.b) / 2); ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = "top";
      ctx.fillText(config.rotuloY || "", 0, -6);
      ctx.restore();

      (config.marcas || []).forEach((mk) => {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "#8a94a6";
        ctx.beginPath(); ctx.moveTo(px(mk.x), m.t); ctx.lineTo(px(mk.x), h - m.b); ctx.stroke();
        ctx.restore();
        if (mk.rotulo) {
          ctx.fillStyle = "#5a6579";
          ctx.font = '12px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.textAlign = "left"; ctx.textBaseline = "top";
          ctx.fillText(mk.rotulo, px(mk.x) + 5, m.t + 2);
        }
      });

      config.series.forEach((s) => {
        const c = resolverCor(s.cor);
        ctx.strokeStyle = c; ctx.fillStyle = c;
        if (s.tipo === "linha") {
          ctx.save();
          ctx.lineWidth = 2.5;
          if (s.tracejado) ctx.setLineDash([7, 6]);
          ctx.beginPath();
          s.pontos.forEach((p, i) => (i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y))));
          ctx.stroke();
          ctx.restore();
        } else {
          s.pontos.forEach((p) => {
            if (p.ey) {
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(px(p.x), py(p.y - p.ey)); ctx.lineTo(px(p.x), py(p.y + p.ey));
              ctx.moveTo(px(p.x) - 4, py(p.y - p.ey)); ctx.lineTo(px(p.x) + 4, py(p.y - p.ey));
              ctx.moveTo(px(p.x) - 4, py(p.y + p.ey)); ctx.lineTo(px(p.x) + 4, py(p.y + p.ey));
              ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 5.5, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke(); ctx.strokeStyle = c;
          });
        }
      });

      if (!todos.length) {
        ctx.fillStyle = "#8a94a6";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = '15px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(config.textoVazio || "Registre medições para ver o gráfico", (m.e + w - m.d) / 2, (m.t + h - m.b) / 2);
      }
    }

    window.addEventListener("resize", desenhar);
    document.addEventListener("lab:etapa", () => requestAnimationFrame(desenhar));
    desenhar();

    return {
      atualizar(parcial) { config = Object.assign(config, parcial); desenhar(); },
      imagem() { desenhar(); return canvas.clientWidth ? canvas.toDataURL("image/png") : ""; },
    };
  }

  /* ---------------- Regressão linear: y = a·x + b ----------------
   * Retorna { a, b, r2, sa, sb } — sa e sb são os desvios-padrão dos coeficientes.
   */
  function ajusteLinear(pontos) {
    const n = pontos.length;
    if (n < 2) return null;
    const sx = pontos.reduce((s, p) => s + p.x, 0), sy = pontos.reduce((s, p) => s + p.y, 0);
    const sxx = pontos.reduce((s, p) => s + p.x * p.x, 0), sxy = pontos.reduce((s, p) => s + p.x * p.y, 0);
    const den = n * sxx - sx * sx;
    if (Math.abs(den) < 1e-12) return null;
    const a = (n * sxy - sx * sy) / den, b = (sy - a * sx) / n;
    const media = sy / n;
    const ssTot = pontos.reduce((s, p) => s + (p.y - media) ** 2, 0);
    const ssRes = pontos.reduce((s, p) => s + (p.y - (a * p.x + b)) ** 2, 0);
    const s2 = n > 2 ? ssRes / (n - 2) : 0;
    return { a, b, r2: ssTot ? 1 - ssRes / ssTot : 1, sa: Math.sqrt((n * s2) / den), sb: Math.sqrt((s2 * sxx) / den) };
  }

  window.Lab = {
    iniciar, publico, aoMudarPublico, irPara, renderizarMat, questoes, tabela, grafico, ajusteLinear,
    fmt, tex, lerNumero, escapar, cor, armazenamento, AUTOR, PUBLICOS,
  };
})();
