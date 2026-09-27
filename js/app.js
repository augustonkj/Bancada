(function () {
  "use strict";

  const projetos = (typeof PROJETOS !== "undefined" ? PROJETOS : []).slice();
  const grade = document.getElementById("grade");
  const vazio = document.getElementById("vazio");
  const busca = document.getElementById("busca");
  const filtros = document.getElementById("filtros");
  const contadores = document.getElementById("contadores");

  const TODAS = "Todas";
  let areaAtiva = TODAS;

  const normalizar = (s) =>
    String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const escapar = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Cor estável por área, derivada do nome
  const matizDaArea = (area) => {
    let h = 0;
    for (const c of normalizar(area)) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  };

  const areas = [TODAS, ...Array.from(new Set(projetos.map((p) => p.area).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"))];

  function desenharContadores() {
    const prontos = projetos.filter((p) => normalizar(p.status) === "pronto").length;
    const itens = [
      ["Projetos", projetos.length],
      ["Áreas", areas.length - 1],
      ["Prontos", prontos],
    ];
    contadores.innerHTML = itens
      .map(([rotulo, valor]) => `<div><dt>${rotulo}</dt><dd>${valor}</dd></div>`)
      .join("");
  }

  function desenharFiltros() {
    filtros.innerHTML = areas
      .map((a) => `<button type="button" class="filtro" data-area="${escapar(a)}" aria-pressed="${a === areaAtiva}">${escapar(a)}</button>`)
      .join("");
  }

  function cartao(p, i) {
    const externo = /^https?:\/\//i.test(p.link || "");
    const semLink = !p.link || p.link === "#";
    const status = normalizar(p.status).replace(/\s+/g, "-");
    const numero = String(i + 1).padStart(2, "0");
    const capa = p.imagem
      ? `<img class="cartao__capa" src="${escapar(p.imagem)}" alt="" loading="lazy">`
      : "";
    const etiquetas = (p.etiquetas || [])
      .map((e) => `<li>${escapar(e)}</li>`)
      .join("");

    const tag = semLink ? "div" : "a";
    const atributos = semLink
      ? `aria-disabled="true"`
      : `href="${escapar(p.link)}"${externo ? ' target="_blank" rel="noopener"' : ""}`;

    return `
      <${tag} class="cartao${semLink ? " cartao--inativo" : ""}" ${atributos} style="--matiz:${matizDaArea(p.area)}">
        ${capa}
        <div class="cartao__corpo">
          <div class="cartao__meta">
            <span class="cartao__num">Nº ${numero}</span>
            <span class="cartao__area">${escapar(p.area)}</span>
          </div>
          <h2 class="cartao__titulo">${escapar(p.titulo)}</h2>
          <p class="cartao__desc">${escapar(p.descricao)}</p>
          ${etiquetas ? `<ul class="cartao__etiquetas">${etiquetas}</ul>` : ""}
          <div class="cartao__rodape">
            ${p.status ? `<span class="status status--${status}">${escapar(p.status)}</span>` : "<span></span>"}
            ${p.nivel ? `<span class="cartao__nivel">${escapar(p.nivel)}</span>` : ""}
            ${semLink ? "" : `<span class="cartao__abrir" aria-hidden="true">${externo ? "↗" : "→"}</span>`}
          </div>
        </div>
      </${tag}>`;
  }

  function desenharGrade() {
    const termo = normalizar(busca.value.trim());
    const visiveis = projetos
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => areaAtiva === TODAS || p.area === areaAtiva)
      .filter(({ p }) => {
        if (!termo) return true;
        const texto = normalizar([p.titulo, p.descricao, p.area, p.nivel, ...(p.etiquetas || [])].join(" "));
        return texto.includes(termo);
      });

    grade.innerHTML = visiveis.map(({ p, i }) => cartao(p, i)).join("");
    vazio.hidden = visiveis.length > 0;
  }

  filtros.addEventListener("click", (ev) => {
    const botao = ev.target.closest(".filtro");
    if (!botao) return;
    areaAtiva = botao.dataset.area;
    desenharFiltros();
    desenharGrade();
  });

  busca.addEventListener("input", desenharGrade);

  // Tema claro/escuro
  const raiz = document.documentElement;
  try {
    const salvo = localStorage.getItem("bancada-tema");
    if (salvo) raiz.dataset.tema = salvo;
  } catch (_) {}
  document.getElementById("tema").addEventListener("click", () => {
    const escuroAgora =
      raiz.dataset.tema === "escuro" ||
      (!raiz.dataset.tema && matchMedia("(prefers-color-scheme: dark)").matches);
    raiz.dataset.tema = escuroAgora ? "claro" : "escuro";
    try { localStorage.setItem("bancada-tema", raiz.dataset.tema); } catch (_) {}
  });

  desenharContadores();
  desenharFiltros();
  desenharGrade();
})();
