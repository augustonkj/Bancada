/* ============================================================
 *  Bancada — funções comuns dos laboratórios
 *
 *  Lab.iniciar({ id })            tema, sumário, etapas, impressão
 *  Lab.questoes(el, lista, opts)  questões com correção automática
 *  Lab.tabela(el, config)         tabela de dados do experimento
 *  Lab.grafico(canvas, config)    gráfico de dispersão/linha
 *  Lab.ajusteLinear(pontos)       regressão linear (a, b, r²)
 *  Lab.fmt(numero, casas)         número com vírgula decimal
 * ============================================================ */
(function () {
  "use strict";

  const AUTOR = {
    nome: "Doutorando Antonio Augusto Ignacio",
    email: "augustonkj@gmail.com",
    lattes: "http://lattes.cnpq.br/4063776675134292",
  };

  const escapar = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmt = (n, casas = 2) =>
    Number.isFinite(n) ? n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) : "—";

  const lerNumero = (texto) => parseFloat(String(texto).trim().replace(/\s/g, "").replace(",", "."));

  const armazenamento = {
    ler(chave, padrao) {
      try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (_) { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (_) {}
    },
  };

  const cor = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();

  /* ---------------- Tema, sumário e etapas ---------------- */
  let idLab = "lab";

  function iniciar({ id } = {}) {
    idLab = id || location.pathname;
    const raiz = document.documentElement;

    try { const t = localStorage.getItem("bancada-tema"); if (t) raiz.dataset.tema = t; } catch (_) {}
    const botaoTema = document.getElementById("lab-tema");
    if (botaoTema) {
      botaoTema.addEventListener("click", () => {
        const escuro = raiz.dataset.tema === "escuro" ||
          (!raiz.dataset.tema && matchMedia("(prefers-color-scheme: dark)").matches);
        raiz.dataset.tema = escuro ? "claro" : "escuro";
        try { localStorage.setItem("bancada-tema", raiz.dataset.tema); } catch (_) {}
        document.dispatchEvent(new CustomEvent("lab:tema"));
      });
    }

    const botaoImprimir = document.getElementById("lab-imprimir");
    if (botaoImprimir) botaoImprimir.addEventListener("click", () => window.print());

    // Rodapé com autoria
    const rodape = document.querySelector(".lab-rodape p");
    if (rodape) {
      rodape.innerHTML =
        `Desenvolvido por ${escapar(AUTOR.nome)} · ` +
        `<a href="mailto:${AUTOR.email}">${AUTOR.email}</a> · ` +
        `<a href="${AUTOR.lattes}" target="_blank" rel="noopener">Currículo Lattes</a> · ` +
        `<a href="https://creativecommons.org/licenses/by-nc/4.0/deed.pt-br" target="_blank" rel="noopener license">CC BY-NC 4.0</a>`;
    }

    // Destaca a seção visível no sumário
    const links = Array.from(document.querySelectorAll(".lab-sumario a[href^='#']"));
    const secoes = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    if ("IntersectionObserver" in window && secoes.length) {
      const obs = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((a) => a.classList.toggle("ativo", a.getAttribute("href") === "#" + e.target.id));
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      secoes.forEach((s) => obs.observe(s));
    }

    // Etapas do procedimento com marcação de "feito"
    const feitas = armazenamento.ler(`bancada:${idLab}:etapas`, []);
    document.querySelectorAll(".procedimento > li").forEach((li, i) => {
      const rotulo = document.createElement("label");
      rotulo.className = "etapa-check nao-imprimir";
      rotulo.innerHTML = `<input type="checkbox"> Concluí esta etapa`;
      const caixa = rotulo.querySelector("input");
      caixa.checked = feitas.includes(i);
      li.classList.toggle("feito", caixa.checked);
      caixa.addEventListener("change", () => {
        li.classList.toggle("feito", caixa.checked);
        const atual = new Set(armazenamento.ler(`bancada:${idLab}:etapas`, []));
        caixa.checked ? atual.add(i) : atual.delete(i);
        armazenamento.gravar(`bancada:${idLab}:etapas`, Array.from(atual));
      });
      li.appendChild(document.createElement("br"));
      li.appendChild(rotulo);
    });
  }

  /* ---------------- Questões ----------------
   * Tipos:
   *  { tipo: "multipla", enunciado, alternativas: [...], correta: índice, explicacao }
   *  { tipo: "numerica", enunciado, resposta, tolerancia (fração, ex. 0.03), unidade, explicacao }
   *    - resposta pode ser uma função () => número (para valores que dependem do experimento)
   *  { tipo: "aberta", enunciado, modelo }  resposta-modelo exibida após o aluno escrever
   *  nivel (opcional): "fácil" | "médio" | "desafio"
   */
  function questoes(el, lista, { aoAtualizar, chave: nomeChave = "questoes", semPlacar = false } = {}) {
    const chave = `bancada:${idLab}:${nomeChave}`;
    const estado = armazenamento.ler(chave, {});
    const letras = "abcdefgh";

    el.classList.add("questoes");
    el.innerHTML = lista.map((q, i) => {
      const cabeca = `<div class="questao__cabeca"><span>${escapar(q.nivel || "")}</span></div>`;
      const enunciado = `<div class="questao__enunciado">${q.enunciado}</div>`;
      let corpo = "";
      if (q.tipo === "multipla") {
        corpo = `<ul class="alternativas">${q.alternativas.map((alt, j) => `
          <li><label class="alternativa">
            <input type="radio" name="q${i}" value="${j}">
            <span class="alternativa__letra">${letras[j]})</span>
            <span>${alt}</span>
          </label></li>`).join("")}</ul>
          <div class="botoes"><button type="button" class="botao botao--primario" data-acao="verificar">Verificar resposta</button></div>`;
      } else if (q.tipo === "numerica") {
        corpo = `<div class="resposta-numerica">
            <input type="text" inputmode="decimal" placeholder="Sua resposta" aria-label="Resposta da questão ${i + 1}">
            ${q.unidade ? `<span class="mono">${escapar(q.unidade)}</span>` : ""}
          </div>
          <div class="botoes"><button type="button" class="botao botao--primario" data-acao="verificar">Verificar resposta</button></div>`;
      } else {
        corpo = `<div class="resposta-aberta"><textarea placeholder="Escreva sua resposta com suas palavras…" aria-label="Resposta da questão ${i + 1}"></textarea></div>
          <div class="botoes"><button type="button" class="botao" data-acao="modelo">Comparar com a resposta-modelo</button></div>`;
      }
      return `<article class="questao" data-i="${i}">${cabeca}${enunciado}${corpo}<div class="retorno-area"></div></article>`;
    }).join("") + (semPlacar ? "" : `
      <div class="placar">
        <div><div class="mono" style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--tinta-suave)">Seu desempenho</div>
        <div class="placar__numero" data-placar>0 de 0</div></div>
        <button type="button" class="botao nao-imprimir" data-acao="recomecar">Refazer questões</button>
      </div>`);

    const objetivas = lista.filter((q) => q.tipo !== "aberta").length;

    function atualizarPlacar() {
      const acertos = Object.values(estado).filter((e) => e.certo === true).length;
      if (semPlacar) return;
      el.querySelector("[data-placar]").textContent = `${acertos} de ${objetivas} acertos`;
      if (aoAtualizar) aoAtualizar(acertos, objetivas);
    }

    function mostrarRetorno(art, q, certo, extra) {
      const area = art.querySelector(".retorno-area");
      art.classList.toggle("correta", certo === true);
      art.classList.toggle("incorreta", certo === false);
      if (q.tipo === "aberta") {
        area.innerHTML = `<div class="retorno retorno--modelo"><strong>Resposta-modelo</strong>${q.modelo}</div>`;
        return;
      }
      area.innerHTML = certo
        ? `<div class="retorno retorno--certo"><strong>Correto!</strong>${q.explicacao ? `<p>${q.explicacao}</p>` : ""}</div>`
        : `<div class="retorno retorno--errado"><strong>Ainda não.</strong>${extra || ""}${q.explicacao ? `<p>${q.explicacao}</p>` : ""}</div>`;
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

    function marcarAlternativas(art, q, escolhida) {
      art.querySelectorAll(".alternativa").forEach((lab, j) => {
        lab.classList.toggle("marcada-certa", j === q.correta && escolhida === q.correta);
        lab.classList.toggle("marcada-errada", j === escolhida && escolhida !== q.correta);
      });
    }

    el.addEventListener("click", (ev) => {
      const botao = ev.target.closest("[data-acao]");
      if (!botao) return;

      if (botao.dataset.acao === "recomecar") {
        Object.keys(estado).forEach((k) => delete estado[k]);
        armazenamento.gravar(chave, estado);
        el.querySelectorAll(".questao").forEach((art) => {
          art.classList.remove("correta", "incorreta");
          art.querySelector(".retorno-area").innerHTML = "";
          art.querySelectorAll("input[type=radio]").forEach((r) => (r.checked = false));
          art.querySelectorAll(".alternativa").forEach((l) => l.classList.remove("marcada-certa", "marcada-errada"));
          const t = art.querySelector("input[type=text], textarea");
          if (t) t.value = "";
        });
        atualizarPlacar();
        return;
      }

      const art = botao.closest(".questao");
      const i = +art.dataset.i, q = lista[i];

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
        if (texto.length < 10) { mostrarAviso(art, "Escreva sua resposta antes de ver a resposta-modelo — é assim que se aprende!"); return; }
        estado[i] = { valor: texto, verificada: true };
        mostrarRetorno(art, q, null);
      }
      armazenamento.gravar(chave, estado);
      atualizarPlacar();
    });

    function mostrarAviso(art, texto) {
      art.querySelector(".retorno-area").innerHTML = `<div class="retorno retorno--modelo"><p>${texto}</p></div>`;
    }

    restaurar();
    atualizarPlacar();
  }

  /* ---------------- Tabela de dados ----------------
   * config: { colunas: [{ chave, titulo, casas, texto }], aoMudar(linhas), nomeArquivo }
 *   texto: true alinha a coluna à esquerda; aoMudar também é chamado na criação
   * Retorna { adicionar(linha), linhas(), limpar() }
   */
  function tabela(el, config) {
    const chave = `bancada:${idLab}:tabela`;
    let linhas = armazenamento.ler(chave, []);

    el.classList.add("tabela-dados");
    el.innerHTML = `
      <div class="tabela-dados__rolagem"><table>
        <thead><tr><th>#</th>${config.colunas.map((c) => `<th${c.texto ? ' class="esq"' : ""}>${c.titulo}</th>`).join("")}<th class="nao-imprimir"></th></tr></thead>
        <tbody></tbody>
      </table></div>
      <div class="botoes">
        <button type="button" class="botao" data-acao="csv">Baixar tabela (CSV)</button>
        <button type="button" class="botao" data-acao="limpar">Limpar tabela</button>
      </div>`;
    const corpo = el.querySelector("tbody");

    function desenhar() {
      corpo.innerHTML = linhas.length
        ? linhas.map((l, i) => `<tr><td>${i + 1}</td>${config.colunas.map((c) =>
            `<td${c.texto ? ' class="esq"' : ""}>${typeof l[c.chave] === "number" ? fmt(l[c.chave], c.casas ?? 2) : escapar(l[c.chave])}</td>`).join("")}
            <td class="nao-imprimir"><button type="button" class="tabela-dados__remover" data-remover="${i}" aria-label="Remover medição ${i + 1}">×</button></td></tr>`).join("")
        : `<tr class="tabela-dados__vazia"><td colspan="${config.colunas.length + 2}">${config.textoVazio || "Nenhuma medição registrada ainda. Registre dados na bancada para preenchê-la."}</td></tr>`;
      armazenamento.gravar(chave, linhas);
      if (config.aoMudar) config.aoMudar(linhas);
    }

    el.addEventListener("click", (ev) => {
      const rem = ev.target.closest("[data-remover]");
      if (rem) { linhas.splice(+rem.dataset.remover, 1); desenhar(); return; }
      const acao = ev.target.closest("[data-acao]")?.dataset.acao;
      if (acao === "limpar") { linhas = []; desenhar(); }
      if (acao === "csv") {
        const cab = ["#", ...config.colunas.map((c) => c.titulo.replace(/<[^>]+>/g, ""))].join(";");
        const corpoCsv = linhas.map((l, i) => [i + 1, ...config.colunas.map((c) =>
          typeof l[c.chave] === "number" ? fmt(l[c.chave], c.casas ?? 2).replace(/\./g, "") : l[c.chave])].join(";")).join("\n");
        const blob = new Blob(["﻿" + cab + "\n" + corpoCsv], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (config.nomeArquivo || "medicoes") + ".csv";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    });

    desenhar();
    return {
      adicionar(linha) { linhas.push(linha); desenhar(); },
      linhas: () => linhas.slice(),
      limpar() { linhas = []; desenhar(); },
    };
  }

  /* ---------------- Gráfico ----------------
   * config: {
   *   rotuloX, rotuloY,
   *   series: [{ pontos: [{x,y}], tipo: "pontos"|"linha", cor: "--destaque" | "#hex", nome }],
   *   xMin, xMax, yMin, yMax, passoX, passoY (opcionais), marcas: [{ x, rotulo }] (linhas verticais)
   * }
   * Retorna { atualizar(novaConfigParcial) }
   */
  function grafico(canvas, configInicial) {
    let config = Object.assign({ series: [] }, configInicial);
    const ctx = canvas.getContext("2d");

    function resolverCor(c) { return c && c.startsWith("--") ? cor(c) : c || cor("--destaque"); }

    function escalaBonita(min, max, n = 5) {
      if (min === max) { min -= 1; max += 1; }
      const passoBruto = (max - min) / n;
      const mag = Math.pow(10, Math.floor(Math.log10(passoBruto)));
      const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= passoBruto) || 10 * mag;
      return { min: Math.floor(min / passo) * passo, max: Math.ceil(max / passo) * passo, passo };
    }

    function desenhar() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const todos = config.series.flatMap((s) => s.pontos);
      const xs = todos.map((p) => p.x), ys = todos.map((p) => p.y);
      const ex = escalaBonita(config.xMin ?? (xs.length ? Math.min(0, ...xs) : 0), config.xMax ?? (xs.length ? Math.max(...xs) : 1));
      const ey = escalaBonita(config.yMin ?? (ys.length ? Math.min(0, ...ys) : 0), config.yMax ?? (ys.length ? Math.max(...ys) : 1));
      // limites informados explicitamente são respeitados sem arredondar (ex.: pH de 0 a 14)
      if (config.xMin != null) ex.min = config.xMin;
      if (config.xMax != null) ex.max = config.xMax;
      if (config.yMin != null) ey.min = config.yMin;
      if (config.yMax != null) ey.max = config.yMax;
      if (config.passoX) ex.passo = config.passoX;
      if (config.passoY) ey.passo = config.passoY;

      const m = { e: 58, d: 16, t: 14, b: 44 };
      const px = (x) => m.e + ((x - ex.min) / (ex.max - ex.min)) * (w - m.e - m.d);
      const py = (y) => h - m.b - ((y - ey.min) / (ey.max - ey.min)) * (h - m.t - m.b);

      ctx.font = '12px "IBM Plex Mono", ui-monospace, monospace';
      ctx.lineWidth = 1;

      // grade e marcações
      ctx.strokeStyle = cor("--linha");
      ctx.fillStyle = cor("--tinta-suave");
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (let x = Math.ceil(ex.min / ex.passo) * ex.passo; x <= ex.max + 1e-9; x += ex.passo) {
        ctx.beginPath(); ctx.moveTo(px(x), m.t); ctx.lineTo(px(x), h - m.b); ctx.stroke();
        ctx.fillText(fmt(x, casasDe(ex.passo)), px(x), h - m.b + 6);
      }
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      for (let y = Math.ceil(ey.min / ey.passo) * ey.passo; y <= ey.max + 1e-9; y += ey.passo) {
        ctx.beginPath(); ctx.moveTo(m.e, py(y)); ctx.lineTo(w - m.d, py(y)); ctx.stroke();
        ctx.fillText(fmt(y, casasDe(ey.passo)), m.e - 8, py(y));
      }

      // rótulos dos eixos
      ctx.fillStyle = cor("--tinta");
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(config.rotuloX || "", (m.e + w - m.d) / 2, h - 2);
      ctx.save();
      ctx.translate(12, (m.t + h - m.b) / 2); ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = "top";
      ctx.fillText(config.rotuloY || "", 0, -6);
      ctx.restore();

      // marcas verticais
      (config.marcas || []).forEach((mk) => {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = cor("--tinta-suave");
        ctx.beginPath(); ctx.moveTo(px(mk.x), m.t); ctx.lineTo(px(mk.x), h - m.b); ctx.stroke();
        ctx.restore();
        if (mk.rotulo) {
          ctx.fillStyle = cor("--tinta-suave");
          ctx.textAlign = "left"; ctx.textBaseline = "top";
          ctx.fillText(mk.rotulo, px(mk.x) + 4, m.t + 2);
        }
      });

      // séries
      config.series.forEach((s) => {
        const c = resolverCor(s.cor);
        ctx.strokeStyle = c; ctx.fillStyle = c;
        if (s.tipo === "linha") {
          ctx.lineWidth = 2;
          ctx.beginPath();
          s.pontos.forEach((p, i) => (i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y))));
          ctx.stroke();
          ctx.lineWidth = 1;
        } else {
          s.pontos.forEach((p) => { ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 4.5, 0, Math.PI * 2); ctx.fill(); });
        }
      });

      if (!todos.length) {
        ctx.fillStyle = cor("--tinta-suave");
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = '14px "IBM Plex Sans", system-ui, sans-serif';
        ctx.fillText("Registre medições para ver o gráfico", (m.e + w - m.d) / 2, (m.t + h - m.b) / 2);
      }
    }

    function casasDe(passo) { return passo >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(passo))); }

    window.addEventListener("resize", desenhar);
    document.addEventListener("lab:tema", desenhar);
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", desenhar);
    desenhar();

    return { atualizar(parcial) { config = Object.assign(config, parcial); desenhar(); } };
  }

  /* ---------------- Regressão linear: y = a·x + b ---------------- */
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
    return { a, b, r2: ssTot ? 1 - ssRes / ssTot : 1 };
  }

  window.Lab = { iniciar, questoes, tabela, grafico, ajusteLinear, fmt, lerNumero, escapar, cor, armazenamento, AUTOR };
})();
