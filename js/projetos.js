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
 * ============================================================
 */

const PROJETOS = [
  {
    titulo: "Pêndulo Simples",
    descricao: "Investigue o que controla o período de um pêndulo, construa o gráfico T² × L e descubra a gravidade de um planeta misterioso.",
    area: "Física",
    link: "projetos/pendulo/",
    etiquetas: ["mecânica", "oscilações", "gráficos", "gravidade"],
    nivel: "Médio",
    status: "pronto",
    data: "2026-09-27",
  },
  {
    titulo: "Titulação Ácido-Base",
    descricao: "Titule ácidos fortes e fracos, acompanhe a curva de pH em tempo real, escolha o indicador certo e determine a concentração de uma amostra desconhecida.",
    area: "Química",
    link: "projetos/titulacao/",
    etiquetas: ["soluções", "pH", "indicadores", "estequiometria"],
    nivel: "Médio",
    status: "pronto",
    data: "2026-09-27",
  },
  {
    titulo: "Microscópio Virtual",
    descricao: "Focalize lâminas de cebola, mucosa bucal, elódea e sangue; compare células vegetais e animais e estime o tamanho de uma célula.",
    area: "Biologia",
    link: "projetos/microscopio/",
    etiquetas: ["citologia", "microscopia", "células"],
    nivel: "Fundamental",
    status: "pronto",
    data: "2026-09-27",
  },
];
