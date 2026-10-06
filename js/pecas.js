// pecas.js — dados das peças e o tabuleiro inicial.
//
// O tabuleiro é um ARRAY de 8 arrays (8 linhas x 8 colunas):
//   tabuleiro[linha][coluna]  ->  a peça daquela casa
//
// Cada peça é um texto com 2 letras: cor + tipo.
//   cor:  "w" = branca, "b" = preta
//   tipo: K = rei, Q = dama, R = torre, B = bispo, N = cavalo, P = peão
//   Exemplos: "wK" = rei branco, "bP" = peão preto
//
// Casa vazia = null.
// A linha 0 é o topo do tabuleiro (pretas) e a linha 7 é a base (brancas).

function criarTabuleiroInicial() {
  return [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
  ];
}

// "wK" -> "branca" | "bP" -> "preta" | null -> null
function corDaPeca(peca) {
  if (peca === null) {
    return null;
  }
  if (peca[0] === "w") {
    return "branca";
  }
  return "preta";
}

// "wK" -> "K"
function tipoDaPeca(peca) {
  return peca[1];
}

function oponente(cor) {
  if (cor === "branca") {
    return "preta";
  }
  return "branca";
}

// "branca" -> "brancas" (para as mensagens da tela)
function nomeNoPlural(cor) {
  if (cor === "branca") {
    return "brancas";
  }
  return "pretas";
}

// "wK" -> "assets/chess/wK.svg"
function caminhoDaImagem(peca) {
  return "assets/chess/" + peca + ".svg";
}
