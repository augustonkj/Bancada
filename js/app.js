(function () {
  "use strict";

  const projetos = (typeof PROJETOS !== "undefined" ? PROJETOS : []).slice();
  const $ = (id) => document.getElementById(id);
  const TODAS = "Todas";
  let areaAtiva = TODAS;

  const normalizar = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const areas = [TODAS, ...Array.from(new Set(projetos.map((p) => p.area))).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  const corDaArea = (a) => (projetos.find((p) => p.area === a) || {}).cor;

  function desenharFiltros() {
    $("filtros").innerHTML = areas.map((a) =>
      `<button type="button" class="filtro" data-area="${escapar(a)}" aria-pressed="${a === areaAtiva}"${corDaArea(a) ? ` style="--cor:${corDaArea(a)}"` : ""}>${escapar(a)}</button>`).join("");
  }

  function cartao(p) {
    const externo = /^https?:\/\//i.test(p.link);
    return `
      <a class="lab" href="${escapar(p.link)}"${externo ? ' target="_blank" rel="noopener"' : ""} style="--cor:${escapar(p.cor || "#2563eb")}">
        <div class="lab__arte">${p.ilustracao || ""}
          <span class="lab__area">${escapar(p.area)}</span>
          ${p.status && p.status !== "pronto" ? `<span class="lab__status">${escapar(p.status)}</span>` : ""}
        </div>
        <div class="lab__corpo">
          <h3>${escapar(p.titulo)}</h3>
          <p>${escapar(p.descricao)}</p>
          <div class="lab__rodape">
            <span>${p.etiquetas ? escapar(p.etiquetas.slice(0, 3).join(" · ")) : ""}</span>
            <span class="lab__entrar">Entrar →</span>
          </div>
        </div>
      </a>`;
  }

  function desenharGrade() {
    const termo = normalizar($("busca").value.trim());
    const visiveis = projetos
      .filter((p) => areaAtiva === TODAS || p.area === areaAtiva)
      .filter((p) => !termo || normalizar([p.titulo, p.descricao, p.area, ...(p.etiquetas || [])].join(" ")).includes(termo));
    $("grade").innerHTML = visiveis.map(cartao).join("");
    $("vazio").hidden = visiveis.length > 0;
    $("contagem").textContent = `${projetos.length} laboratórios com roteiro completo de prática.`;
  }

  $("filtros").addEventListener("click", (e) => {
    const b = e.target.closest(".filtro");
    if (!b) return;
    areaAtiva = b.dataset.area;
    desenharFiltros();
    desenharGrade();
  });
  $("busca").addEventListener("input", desenharGrade);

  desenharFiltros();
  desenharGrade();
})();
