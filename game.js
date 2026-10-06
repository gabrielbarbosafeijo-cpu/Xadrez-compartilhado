// game.js — o ESTADO da partida e o fluxo de uma jogada.
// Aqui ficam as variáveis do jogo e a função tentarJogada, por onde TODA jogada passa.

let tabuleiro;      // matriz 8x8 com os códigos das peças (ou null)
let jogadorAtual;   // "white" ou "black"

// Zera tudo e começa uma partida nova.
function novaPartida() {
  tabuleiro = criarTabuleiroInicial();
  jogadorAtual = "white";

  limparAviso();
  atualizarTela();
}

function atualizarTela() {
  renderizarTabuleiro();
  renderizarPainel();
}

// Ponto de entrada de toda jogada. O evento drop só chama esta função.
//
// STATUS (dia 2): por enquanto só confere o básico — vez do jogador, peça na origem e
// captura de peça da mesma cor. O movimento de CADA PEÇA ainda não é validado:
// qualquer peça vai para qualquer casa livre ou inimiga.
// TODO (dias 3 a 5): criar rules.js com os movimentos de cada peça e a regra do xeque.
function tentarJogada(origem, destino) {
  const peca = tabuleiro[origem.linha][origem.coluna];
  const pecaNoDestino = tabuleiro[destino.linha][destino.coluna];

  if (peca === null) {
    mostrarAviso("Não há peça nessa casa.");
    return;
  }

  if (corDaPeca(peca) !== jogadorAtual) {
    const vez = jogadorAtual === "white" ? "das brancas" : "das pretas";
    mostrarAviso("Essa peça não é sua. Vez " + vez + ".");
    return;
  }

  if (origem.linha === destino.linha && origem.coluna === destino.coluna) {
    mostrarAviso("Solte a peça em outra casa.");
    return;
  }

  if (pecaNoDestino !== null && corDaPeca(pecaNoDestino) === jogadorAtual) {
    mostrarAviso("Não é permitido capturar uma peça da mesma cor.");
    return;
  }

  // Jogada aceita: primeiro muda a matriz, depois troca o turno e redesenha
  limparAviso();
  tabuleiro[destino.linha][destino.coluna] = peca;
  tabuleiro[origem.linha][origem.coluna] = null;
  jogadorAtual = jogadorAtual === "white" ? "black" : "white";

  atualizarTela();
}
