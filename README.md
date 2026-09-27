<div align="center">

# Bancada

**Laboratório virtual de ensino**

Simulações, experimentos e materiais didáticos interativos reunidos em um só lugar.

[**Acessar a Bancada →**](https://augustonkj.github.io/Bancada/)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?logo=githubpages&logoColor=white)

</div>

---

## Sobre

A **Bancada** é o catálogo central dos meus projetos de ensino. Cada projeto é um
laboratório virtual independente — uma simulação, um experimento guiado ou um
material de apoio — que pode ser usado em sala de aula ou para estudo individual.

## Recursos

- **Catálogo de projetos** organizado em cartões, com área, nível de ensino e status
- **Busca instantânea** por título, descrição e palavras-chave
- **Filtros por área do conhecimento**, gerados automaticamente
- **Tema claro e escuro**
- **Layout responsivo** para computador, tablet e celular
- **Sem dependências** — HTML, CSS e JavaScript puros, sem etapa de build

## Projetos

| Projeto | Área | Nível | Status |
|---|---|---|---|
| [Pêndulo Simples](https://augustonkj.github.io/Bancada/projetos/exemplo/) | Física | Médio | Pronto |
| Titulação Ácido-Base | Química | Médio | Em construção |
| Microscópio Virtual | Biologia | Fundamental | Planejado |

## Estrutura

```
Bancada/
├── index.html          # Página principal
├── css/
│   └── estilo.css      # Estilos e temas
├── js/
│   ├── projetos.js     # Cadastro dos projetos
│   └── app.js          # Busca, filtros e renderização
└── projetos/           # Um diretório por projeto
    └── exemplo/
```

## Executar localmente

Clone o repositório e abra o `index.html` no navegador:

```bash
git clone https://github.com/augustonkj/Bancada.git
```

Nenhuma instalação é necessária.

## Adicionar um projeto

1. Crie um diretório em `projetos/` com o `index.html` do projeto
   (ou use um link externo, se ele estiver hospedado em outro lugar).
2. Registre o projeto em [`js/projetos.js`](js/projetos.js):

   ```js
   {
     titulo: "Nome do projeto",
     descricao: "Resumo em uma ou duas frases.",
     area: "Física",
     link: "projetos/nome-do-projeto/",
     etiquetas: ["palavra-chave"],
     nivel: "Médio",
     status: "pronto",        // "pronto" | "em construção" | "planejado"
   },
   ```

3. Faça o commit — o GitHub Pages publica a atualização automaticamente.

## Autor

Desenvolvido por [**@augustonkj**](https://github.com/augustonkj).
