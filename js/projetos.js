/*
 * ============================================================
 *  CADASTRO DE PROJETOS DA BANCADA
 * ============================================================
 *  Para adicionar um projeto, copie um bloco { ... } abaixo,
 *  cole no final da lista e preencha os campos:
 *
 *  titulo     (obrigatório) Nome do projeto
 *  descricao  (obrigatório) Uma ou duas frases sobre o projeto
 *  area       (obrigatório) Área/disciplina — vira um filtro automático
 *  link       (obrigatório) Endereço do projeto. Pode ser:
 *               - uma pasta dentro deste repositório: "projetos/meu-projeto/"
 *               - um site externo: "https://..."
 *  etiquetas  (opcional)    Lista de palavras-chave: ["óptica", "ensino médio"]
 *  nivel      (opcional)    Ex.: "Fundamental", "Médio", "Superior"
 *  status     (opcional)    "pronto", "em construção" ou "planejado"
 *  imagem     (opcional)    Caminho para uma imagem de capa: "img/capa.png"
 *  data       (opcional)    Data de publicação no formato "AAAA-MM-DD"
 *
 *  Os três projetos abaixo são EXEMPLOS — edite ou apague.
 * ============================================================
 */

const PROJETOS = [
  {
    titulo: "Pêndulo Simples",
    descricao: "Simulação interativa para investigar como comprimento e gravidade afetam o período de oscilação.",
    area: "Física",
    link: "projetos/exemplo/",
    etiquetas: ["mecânica", "simulação", "oscilações"],
    nivel: "Médio",
    status: "pronto",
    data: "2026-09-27",
  },
  {
    titulo: "Titulação Ácido-Base",
    descricao: "Bancada virtual de titulação com curva de pH em tempo real e escolha de indicadores.",
    area: "Química",
    link: "#",
    etiquetas: ["soluções", "pH", "experimento"],
    nivel: "Médio",
    status: "em construção",
  },
  {
    titulo: "Microscópio Virtual",
    descricao: "Observe lâminas de células vegetais e animais com diferentes aumentos e focos.",
    area: "Biologia",
    link: "#",
    etiquetas: ["citologia", "microscopia"],
    nivel: "Fundamental",
    status: "planejado",
  },
];
