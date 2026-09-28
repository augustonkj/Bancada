/*
 * ============================================================
 *  CADASTRO DE PROJETOS DA BANCADA
 * ============================================================
 *  titulo     (obrigatório) Nome do laboratório
 *  descricao  (obrigatório) Uma ou duas frases sobre o laboratório
 *  area       (obrigatório) Disciplina — vira um filtro automático
 *  link       (obrigatório) "projetos/<pasta>/" ou "https://..."
 *  cor        (opcional)    Cor da disciplina, ex.: "#2563eb"
 *  ilustracao (opcional)    SVG exibido no topo do cartão
 *  duracao    (opcional)    Ex.: "2 aulas"
 *  etiquetas  (opcional)    Palavras-chave para a busca
 *  status     (opcional)    "pronto", "em reformulação" ou "planejado"
 * ============================================================
 */

const PROJETOS = [
  {
    titulo: "Pêndulo Simples",
    descricao: "Monte um pêndulo no suporte universal, cronometre as oscilações e descubra o que controla o seu ritmo — até medir a gravidade de um planeta misterioso.",
    area: "Física",
    link: "projetos/pendulo/",
    cor: "#2563eb",
    duracao: "2 aulas",
    etiquetas: ["mecânica", "oscilações", "gráficos", "gravidade", "cronômetro"],
    status: "pronto",
    ilustracao: `<svg viewBox="0 0 240 150" aria-hidden="true">
      <rect x="0" y="126" width="240" height="24" fill="#d9b48a"/><rect x="0" y="134" width="240" height="16" fill="#b88c5e"/>
      <rect x="52" y="116" width="64" height="10" rx="3" fill="#3b4557"/>
      <rect x="78" y="14" width="6" height="104" rx="2" fill="#cbd5e1"/><rect x="80" y="22" width="80" height="5" rx="2" fill="#cbd5e1"/>
      <rect x="74" y="18" width="14" height="13" rx="3" fill="#1d4ed8"/>
      <path d="M156 27 L180 104" stroke="#1a2233" stroke-width="1.6"/>
      <path d="M132 108 A82 82 0 0 0 182 108" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 5" opacity=".8"/>
      <circle cx="134" cy="104" r="9" fill="#fbbf24" opacity=".35"/><circle cx="181" cy="106" r="10" fill="#fbbf24"/>
      <path d="M156 27 m-22 0 a22 22 0 0 0 44 0" fill="#fff" opacity=".35"/></svg>`,
  },
  {
    titulo: "Titulação Ácido-Base",
    descricao: "Titule ácidos fortes e fracos, acompanhe a curva de pH em tempo real, escolha o indicador certo e determine a concentração de uma amostra desconhecida.",
    area: "Química",
    link: "projetos/titulacao/",
    cor: "#9333ea",
    duracao: "2 aulas",
    etiquetas: ["soluções", "pH", "indicadores", "estequiometria", "bureta"],
    status: "pronto",
    ilustracao: `<svg viewBox="0 0 240 150" aria-hidden="true">
      <rect x="0" y="126" width="240" height="24" fill="#d9b48a"/><rect x="0" y="134" width="240" height="16" fill="#b88c5e"/>
      <rect x="60" y="10" width="5" height="116" rx="2" fill="#cbd5e1"/><rect x="40" y="118" width="60" height="8" rx="3" fill="#3b4557"/>
      <rect x="62" y="30" width="46" height="4" rx="2" fill="#cbd5e1"/>
      <rect x="112" y="8" width="10" height="78" rx="3" fill="#fff" opacity=".9" stroke="#94a3b8"/>
      <rect x="113" y="30" width="8" height="55" fill="#bfdbfe"/><path d="M114 86 h6 l-2 8 h-2 z" fill="#94a3b8"/>
      <path d="M104 126 L110 100 V92 h14 v8 L130 126 Z" fill="#fff" opacity=".85" stroke="#94a3b8"/>
      <path d="M106 124 L110 110 h14 L128 124 Z" fill="#ec4899"/></svg>`,
  },
  {
    titulo: "Microscópio Virtual",
    descricao: "Focalize lâminas de cebola, mucosa bucal, elódea e sangue; compare células vegetais e animais e estime o tamanho de uma célula.",
    area: "Biologia",
    link: "projetos/microscopio/",
    cor: "#16a34a",
    duracao: "2 aulas",
    etiquetas: ["citologia", "microscopia", "células", "lâminas"],
    status: "pronto",
    ilustracao: `<svg viewBox="0 0 240 150" aria-hidden="true">
      <rect x="0" y="126" width="240" height="24" fill="#d9b48a"/><rect x="0" y="134" width="240" height="16" fill="#b88c5e"/>
      <path d="M86 126 h64 v-8 h-64 z" fill="#3b4557"/><path d="M130 118 V60 q0-8 -8-8 h-6" fill="none" stroke="#475569" stroke-width="10" stroke-linecap="round"/>
      <rect x="96" y="84" width="46" height="6" rx="2" fill="#475569"/><rect x="104" y="16" width="14" height="38" rx="3" fill="#1e293b" transform="rotate(-18 111 35)"/>
      <rect x="106" y="56" width="8" height="18" rx="2" fill="#64748b"/>
      <circle cx="186" cy="54" r="30" fill="#fff" opacity=".9"/><g fill="none" stroke="#16a34a" stroke-width="1.5"><rect x="166" y="38" width="18" height="12"/><rect x="184" y="38" width="20" height="12"/><rect x="162" y="50" width="22" height="12"/><rect x="184" y="50" width="16" height="12"/><rect x="170" y="62" width="20" height="10"/></g>
      <circle cx="174" cy="44" r="2" fill="#15803d"/><circle cx="192" cy="56" r="2" fill="#15803d"/></svg>`,
  },
];
