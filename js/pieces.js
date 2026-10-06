// pieces.js — tudo sobre as peças: códigos, cores, imagens e posição inicial.
//
// Código da peça = cor + tipo. Exemplos: "wK" (rei branco) e "bP" (peão preto).
//   cor:  w = white (branca), b = black (preta)
//   tipo: K = Rei, Q = Dama, R = Torre, B = Bispo, N = Cavalo, P = Peão

const PASTA_DAS_PECAS = "assets/chess/";

const NOMES_DOS_TIPOS = {
  K: "Rei",
  Q: "Dama",
  R: "Torre",
  B: "Bispo",
  N: "Cavalo",
  P: "Peão"
};

// Peças que o peão pode virar na promoção, na ordem em que aparecem no menu
const TIPOS_DE_PROMOCAO = ["Q", "R", "B", "N"];

// Cria o tabuleiro na posição inicial oficial.
// Linha 0 = fileira 8 (pretas) e linha 7 = fileira 1 (brancas).
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

// "wK" -> "white" | "bP" -> "black" | null -> null
function corDaPeca(peca) {
  if (peca === null) {
    return null;
  }
  return peca[0] === "w" ? "white" : "black";
}

// "wK" -> "K"
function tipoDaPeca(peca) {
  return peca[1];
}

// "wK" -> "assets/chess/wK.svg"
function caminhoDaImagem(peca) {
  return PASTA_DAS_PECAS + peca + ".svg";
}

// "wK" -> "Rei branco" | "bQ" -> "Dama preta" (usado no texto alternativo das imagens)
function nomeDaPeca(peca) {
  const tipo = tipoDaPeca(peca);
  const ehFeminino = tipo === "Q" || tipo === "R";
  const ehBranca = corDaPeca(peca) === "white";
  let cor;

  if (ehBranca) {
    cor = ehFeminino ? "branca" : "branco";
  } else {
    cor = ehFeminino ? "preta" : "preto";
  }

  return NOMES_DOS_TIPOS[tipo] + " " + cor;
}
