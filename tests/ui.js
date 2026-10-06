// tests/ui.js — simula partidas de verdade na interface (index.html), arrastando peças.
// Usa o jsdom (um "navegador de mentira") para disparar os eventos dragstart/dragover/drop.
//
// Uso: npm install   (uma vez)   e depois   node tests/ui.js

const path = require("path");
const { JSDOM } = require("jsdom");

(async () => {
  const dom = await JSDOM.fromFile(path.join(__dirname, "..", "index.html"), {
    runScripts: "dangerously",
    resources: "usable"
  });
  const w = dom.window;
  await new Promise((resolve) => w.addEventListener("load", resolve));
  const doc = w.document;

  let falhas = 0;
  const verificar = (nome, condicao, detalhe) => {
    if (!condicao) falhas++;
    console.log((condicao ? "OK     " : "FALHOU ") + nome + (condicao ? "" : "  -> " + detalhe));
  };

  const estado = (expressao) => w.eval(expressao); // lê as variáveis globais do jogo
  const texto = (id) => doc.getElementById(id).textContent;
  const escondido = (id) => doc.getElementById(id).classList.contains("oculto");
  const casa = (nome) => doc.querySelectorAll(".casa")[(8 - Number(nome[1])) * 8 + "abcdefgh".indexOf(nome[0])];
  const novaPartida = () => doc.getElementById("btnNovaPartida").click();

  // Arrasta a peça da casa "de" para a casa "para" (ex.: arrastar("e2", "e4"))
  function arrastar(de, para) {
    const dataTransfer = {
      dados: {},
      setData(chave, valor) { this.dados[chave] = valor; },
      getData(chave) { return this.dados[chave] || ""; }
    };
    const imagem = casa(de).querySelector("img");
    const criar = (tipo) => {
      const evento = new w.Event(tipo, { bubbles: true, cancelable: true });
      evento.dataTransfer = dataTransfer;
      return evento;
    };
    imagem.dispatchEvent(criar("dragstart"));
    const sobre = criar("dragover");
    casa(para).dispatchEvent(sobre);
    casa(para).dispatchEvent(criar("drop"));
    imagem.dispatchEvent(criar("dragend"));
    return sobre.defaultPrevented;
  }

  function jogar(...lances) {
    lances.forEach((lance) => arrastar(lance.slice(0, 2), lance.slice(2, 4)));
  }

  function definirPosicao(linhas) {
    w.eval("tabuleiro = " + JSON.stringify(linhas) + "; contexto = criarContextoInicial(); atualizarTela();");
  }

  // 1. Estado inicial
  verificar("64 casas e 32 peças", doc.querySelectorAll(".casa").length === 64 && doc.querySelectorAll(".casa img").length === 32);
  verificar("coordenadas (8 números + 8 letras)", doc.querySelectorAll(".coordenada").length === 16);
  verificar("a8 é clara e a1 é escura", casa("a8").classList.contains("clara") && casa("a1").classList.contains("escura"));
  verificar("começa a vez das brancas", texto("vez") === "Vez das brancas");
  verificar("dragover libera o drop", arrastar("e2", "e2") === true);

  // 2. Jogadas recusadas não alteram nada
  const antes = JSON.stringify(estado("tabuleiro"));
  arrastar("a1", "a8");
  verificar("torre atravessando peças é recusada", JSON.stringify(estado("tabuleiro")) === antes && !escondido("aviso") && estado("jogadorAtual") === "white", texto("aviso"));
  arrastar("e7", "e5");
  verificar("peça do adversário é recusada", texto("aviso").includes("não é sua"), texto("aviso"));
  arrastar("e2", "e5");
  verificar("peão andando 3 casas é recusado", estado("tabuleiro")[6][4] === "wP" && estado("jogadorAtual") === "white");
  arrastar("d1", "d2");
  verificar("captura da mesma cor é recusada", texto("aviso").includes("mesma cor"), texto("aviso"));

  // 3. Xeque-mate do louco: 1.f3 e5 2.g4 Qh4#
  jogar("f2f3");
  verificar("aviso some após jogada válida", escondido("aviso") && texto("vez") === "Vez das pretas");
  jogar("e7e5", "g2g4", "d8h4");
  verificar("xeque-mate detectado", texto("situacaoTitulo") === "XEQUE-MATE!" && texto("situacaoDetalhe") === "As pretas venceram.", texto("situacaoTitulo"));
  verificar("rei em xeque destacado", casa("e1").classList.contains("em-xeque"));
  const itens = [...doc.querySelectorAll("#historico li")].map((li) => li.textContent.replace(/\s+/g, " "));
  verificar("histórico em notação algébrica", itens.join("|") === "f3 e5|g4 Qh4#", itens.join("|"));
  jogar("a2a3");
  verificar("depois do mate nenhuma jogada é aceita", estado("tabuleiro")[6][0] === "wP" && texto("aviso").includes("terminou"));

  // 4. Nova partida
  novaPartida();
  verificar("nova partida reinicia tudo", texto("vez") === "Vez das brancas" && doc.querySelectorAll("#historico li").length === 0 && escondido("situacao") && estado("tabuleiro")[6][4] === "wP");

  // 5. Xeque e obrigação de sair dele
  jogar("e2e4", "e7e5", "d1h5", "b8c6", "h5f7");
  verificar("xeque é exibido", texto("situacaoTitulo") === "⚠ XEQUE!" && casa("e8").classList.contains("em-xeque"));
  jogar("a7a6");
  verificar("ignorar o xeque é recusado", texto("aviso").includes("xeque") && estado("jogadorAtual") === "black", texto("aviso"));

  // 6. Roque e en passant
  novaPartida();
  jogar("e2e4", "a7a6", "g1f3", "a6a5", "f1c4", "a5a4", "e1g1");
  verificar("roque pequeno move rei e torre", estado("tabuleiro")[7][6] === "wK" && estado("tabuleiro")[7][5] === "wR" && estado("tabuleiro")[7][7] === null);
  verificar("notação O-O", estado("historico")[6].notation === "O-O");
  novaPartida();
  jogar("a2a4", "h7h6", "a4a5", "b7b5", "a5b6");
  verificar("en passant captura o peão certo", estado("tabuleiro")[3][1] === null && estado("tabuleiro")[2][1] === "wP");
  verificar("notação axb6", estado("historico")[4].notation === "axb6" && estado("historico")[4].captured === "bP");

  // 7. Promoção
  novaPartida();
  definirPosicao([
    [null, null, null, null, "bK", null, null, null],
    ["wP", null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, "wK", null, null, null]
  ]);
  jogar("a7a8");
  verificar("menu de promoção abre com 4 opções", doc.getElementById("promocao").hidden === false && doc.querySelectorAll(".opcao-promocao").length === 4);
  verificar("turno só troca depois da escolha", estado("jogadorAtual") === "white" && estado("tabuleiro")[1][0] === "wP");
  jogar("e1e2");
  verificar("jogar com o menu aberto é bloqueado", estado("tabuleiro")[7][4] === "wK" && texto("aviso").includes("promoção"));
  doc.querySelectorAll(".opcao-promocao")[0].click();
  verificar("peão vira dama", estado("tabuleiro")[0][0] === "wQ" && doc.getElementById("promocao").hidden === true);
  verificar("xeque verificado depois da promoção", estado("situacaoPartida") === "xeque" && estado("historico")[0].notation === "a8=Q+");

  // 8. Afogamento
  novaPartida();
  definirPosicao([
    [null, null, null, null, null, null, null, "bK"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, "wK", null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, "wQ", null],
    [null, null, null, null, null, null, null, null]
  ]);
  jogar("g2g6");
  verificar("afogamento vira empate", texto("situacaoTitulo") === "EMPATE!" && texto("situacaoDetalhe") === "Afogamento.");

  console.log(falhas === 0 ? "\nInterface: todos os testes passaram." : "\nInterface: " + falhas + " teste(s) falharam.");
  process.exit(falhas === 0 ? 0 : 1);
})();
