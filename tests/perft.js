// tests/perft.js — valida as regras de js/rules.js sem abrir o navegador.
//
// "Perft" é o teste padrão de programas de xadrez: contar TODAS as sequências de jogadas
// possíveis até uma certa profundidade e comparar com os números oficiais
// (https://www.chessprogramming.org/Perft_Results). Se o número bate, as regras estão certas,
// incluindo roque, en passant e promoção.
//
// Uso: node tests/perft.js   (não precisa instalar nada)

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const lerArquivo = (nome) => fs.readFileSync(path.join(__dirname, "..", "js", nome), "utf8");

// Carrega pieces.js + rules.js juntos, como o navegador faz com os <script>
const contexto = vm.createContext({ Math, Number });
vm.runInContext(lerArquivo("pieces.js") + "\n" + lerArquivo("rules.js") + `
  function lerFen(fen) {
    const partes = fen.split(" ");
    const linhas = partes[0].split("/");
    const tab = [];
    for (let l = 0; l < 8; l++) {
      const linha = [];
      for (const ch of linhas[l]) {
        if (/[1-8]/.test(ch)) { for (let i = 0; i < Number(ch); i++) linha.push(null); }
        else linha.push((ch === ch.toUpperCase() ? "w" : "b") + ch.toUpperCase());
      }
      tab.push(linha);
    }
    const ctx = criarContextoInicial();
    ctx.direitosRoque.white.pequeno = partes[2].includes("K");
    ctx.direitosRoque.white.grande = partes[2].includes("Q");
    ctx.direitosRoque.black.pequeno = partes[2].includes("k");
    ctx.direitosRoque.black.grande = partes[2].includes("q");
    ctx.alvoEnPassant = partes[3] === "-" ? null : notacaoParaPosicao(partes[3]);
    return { tab, ctx, cor: partes[1] === "w" ? "white" : "black" };
  }

  function perft(tab, ctx, cor, profundidade) {
    if (profundidade === 0) return 1;
    let total = 0;
    for (let l = 0; l < 8; l++) {
      for (let c = 0; c < 8; c++) {
        if (corDaPeca(tab[l][c]) !== cor) continue;
        const origem = { linha: l, coluna: c };
        const movimentos = movimentosLegais(tab, l, c, ctx);
        for (const mov of movimentos) {
          const promocoes = movimentoPrecisaDePromocao(tab, origem, mov) ? ["Q", "R", "B", "N"] : [null];
          for (const promo of promocoes) {
            const copia = copiarTabuleiro(tab);
            aplicarMovimento(copia, origem, mov, promo);
            total += perft(copia, atualizarContexto(ctx, tab[l][c], origem, mov), oponente(cor), profundidade - 1);
          }
        }
      }
    }
    return total;
  }
`, contexto);

const lerFen = contexto.lerFen;
const perft = contexto.perft;

// [nome, FEN, resultados oficiais para profundidade 1, 2, 3...]
const casos = [
  ["Posição inicial", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -", [20, 400, 8902, 197281]],
  ["Kiwipete (roque, en passant, cravadas)", "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -", [48, 2039, 97862]],
  ["Final de peões e torres (en passant, xeques)", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -", [14, 191, 2812, 43238]],
  ["Promoções e roque proibido", "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq -", [6, 264, 9467]],
  ["Promoção com captura e xeque", "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ -", [44, 1486, 62379]]
];

let falhas = 0;

for (const [nome, fen, esperados] of casos) {
  const posicao = lerFen(fen);
  esperados.forEach((esperado, i) => {
    const obtido = perft(posicao.tab, posicao.ctx, posicao.cor, i + 1);
    const ok = obtido === esperado;
    if (!ok) falhas++;
    console.log((ok ? "OK     " : "FALHOU ") + nome + " | profundidade " + (i + 1) + ": " + obtido + (ok ? "" : " (esperado " + esperado + ")"));
  });
}

console.log(falhas === 0 ? "\nRegras: todos os testes passaram." : "\nRegras: " + falhas + " teste(s) falharam.");
process.exit(falhas === 0 ? 0 : 1);
