(function () {
  "use strict";

  const projetos = (typeof PROJETOS !== "undefined" ? PROJETOS : []).slice();
  const $ = (id) => document.getElementById(id);
  const PUBLICOS = { fund: "Fundamental", medio: "Médio", grad: "Graduação", prof: "Professor" };
  const TODAS = "Todas";
  let areaAtiva = TODAS;

  const normalizar = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // o público escolhido aqui é o mesmo usado dentro dos laboratórios
  const ler = (k, p) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch (_) { return p; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
  let publico = PUBLICOS[ler("bancada:publico", "medio")] ? ler("bancada:publico", "medio") : "medio";

  const areas = [TODAS, ...Array.from(new Set(projetos.map((p) => p.area))).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  const corDaArea = (a) => (projetos.find((p) => p.area === a) || {}).cor;

  function desenharPublico() {
    document.querySelectorAll("#publico-opcoes button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.valor === publico)));
  }

  function desenharFiltros() {
    $("filtros").innerHTML = areas.map((a) =>
      `<button type="button" class="filtro" data-area="${escapar(a)}" aria-pressed="${a === areaAtiva}"${corDaArea(a) ? ` style="--cor:${corDaArea(a)}"` : ""}>${escapar(a)}</button>`).join("");
  }

  function cartao(p) {
    const atende = !p.publicos || p.publicos.includes(publico);
    const link = p.link + (p.link.startsWith("http") ? "" : `?publico=${publico}`);
    const publicos = (p.publicos || Object.keys(PUBLICOS)).map((k) => `<span class="${k === publico ? "ativo" : ""}">${PUBLICOS[k]}</span>`).join("");
    return `
      <a class="lab${atende ? "" : " lab--indisponivel"}" href="${escapar(link)}" style="--cor:${escapar(p.cor || "#2563eb")}">
        <div class="lab__arte">${p.ilustracao || ""}
          <span class="lab__area">${escapar(p.area)}</span>
          ${p.status && p.status !== "pronto" ? `<span class="lab__status">${escapar(p.status)}</span>` : ""}
        </div>
        <div class="lab__corpo">
          <h3>${escapar(p.titulo)}</h3>
          <p>${escapar(p.descricao)}</p>
          <div class="lab__publicos" aria-label="Públicos atendidos">${publicos}</div>
          <div class="lab__rodape">
            <span>${p.duracao ? "⏱ " + escapar(p.duracao) : ""}${atende ? "" : " · ainda sem versão para este público"}</span>
            <span class="lab__entrar">Entrar →</span>
          </div>
        </div>
      </a>`;
  }

  function desenharGrade() {
    const termo = normalizar($("busca").value.trim());
    const visiveis = projetos
      .filter((p) => areaAtiva === TODAS || p.area === areaAtiva)
      .filter((p) => !termo || normalizar([p.titulo, p.descricao, p.area, ...(p.etiquetas || [])].join(" ")).includes(termo))
      // laboratórios que atendem o público escolhido aparecem primeiro
      .sort((a, b) => Number(!a.publicos || a.publicos.includes(publico) ? 0 : 1) - Number(!b.publicos || b.publicos.includes(publico) ? 0 : 1));
    $("grade").innerHTML = visiveis.map(cartao).join("");
    $("vazio").hidden = visiveis.length > 0;
    const n = projetos.filter((p) => !p.publicos || p.publicos.includes(publico)).length;
    $("contagem").textContent = `${n} de ${projetos.length} laboratórios com versão para ${PUBLICOS[publico]}.`;
  }

  $("publico-opcoes").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-valor]");
    if (!b) return;
    publico = b.dataset.valor;
    gravar("bancada:publico", publico);
    desenharPublico();
    desenharGrade();
  });
  $("filtros").addEventListener("click", (e) => {
    const b = e.target.closest(".filtro");
    if (!b) return;
    areaAtiva = b.dataset.area;
    desenharFiltros();
    desenharGrade();
  });
  $("busca").addEventListener("input", desenharGrade);

  desenharPublico();
  desenharFiltros();
  desenharGrade();
})();
