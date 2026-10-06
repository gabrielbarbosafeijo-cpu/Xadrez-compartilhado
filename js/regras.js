// regras.js — as regras do xadrez.
// Este arquivo NÃO mexe na tela. Ele só recebe o tabuleiro e devolve respostas.
//
// Uma posição é um objeto { linha, coluna }.
// Uma lista de movimentos é um array de posições: [{ linha: 5, coluna: 4 }, ...]

const DIRECOES_RETAS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIRECOES_DIAGONAIS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const DIRECOES_TODAS = DIRECOES_RETAS.concat(DIRECOES_DIAGONAIS);
const SALTOS_DO_CAVALO = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

function dentroDoTabuleiro(linha, coluna) {
  return linha >= 0 && linha < 8 && coluna >= 0 && coluna < 8;
}

// Faz uma cópia do tabuleiro. Serve para SIMULAR jogadas sem estragar o tabuleiro de verdade.
function copiarTabuleiro(tabuleiro) {
  const copia = [];
  for (let linha = 0; linha < 8; linha++) {
    copia.push(tabuleiro[linha].slice()); // slice() copia uma linha inteira
  }
  return copia;
}

// ---------------------------------------------------------------------------
// PARTE 1 — Para onde cada peça pode ir (sem pensar em xeque)
// ---------------------------------------------------------------------------

// Torre, bispo e dama: andam em linha reta até encontrar uma peça ou a borda.
// Se a peça encontrada for inimiga, a casa dela também vale (captura). Se for da
// mesma cor, não vale.
function movimentosEmLinha(tabuleiro, linha, coluna, direcoes) {
  const cor = corDaPeca(tabuleiro[linha][coluna]);
  const movimentos = [];

  for (let i = 0; i < direcoes.length; i++) {
    let l = linha + direcoes[i][0];
    let c = coluna + direcoes[i][1];

    while (dentroDoTabuleiro(l, c)) {
      const alvo = tabuleiro[l][c];

      if (alvo === null) {
        movimentos.push({ linha: l, coluna: c });
      } else {
        if (corDaPeca(alvo) !== cor) {
          movimentos.push({ linha: l, coluna: c });
        }
        break; // bateu numa peça: não dá para continuar nessa direção
      }

      l = l + direcoes[i][0];
      c = c + direcoes[i][1];
    }
  }

  return movimentos;
}

// Cavalo e rei: vão para casas fixas (o cavalo pula peças, o rei anda uma casa).
function movimentosPorSalto(tabuleiro, linha, coluna, saltos) {
  const cor = corDaPeca(tabuleiro[linha][coluna]);
  const movimentos = [];

  for (let i = 0; i < saltos.length; i++) {
    const l = linha + saltos[i][0];
    const c = coluna + saltos[i][1];

    if (dentroDoTabuleiro(l, c)) {
      const alvo = tabuleiro[l][c];
      if (alvo === null || corDaPeca(alvo) !== cor) {
        movimentos.push({ linha: l, coluna: c });
      }
    }
  }

  return movimentos;
}

function movimentosDoPeao(tabuleiro, linha, coluna) {
  const cor = corDaPeca(tabuleiro[linha][coluna]);
  const movimentos = [];

  // Branco anda para cima (linha diminui); preto anda para baixo (linha aumenta)
  let sentido = 1;
  let linhaInicial = 1;
  if (cor === "branca") {
    sentido = -1;
    linhaInicial = 6;
  }

  const frente = linha + sentido;
  if (!dentroDoTabuleiro(frente, coluna)) {
    return movimentos;
  }

  // 1) Andar uma casa para frente (só se estiver vazia)
  if (tabuleiro[frente][coluna] === null) {
    movimentos.push({ linha: frente, coluna: coluna });

    // 2) Na primeira jogada pode andar duas casas (as duas precisam estar vazias)
    const duasCasas = linha + 2 * sentido;
    if (linha === linhaInicial && tabuleiro[duasCasas][coluna] === null) {
      movimentos.push({ linha: duasCasas, coluna: coluna });
    }
  }

  // 3) Capturar na diagonal (só se tiver peça inimiga lá)
  const colunasDiagonais = [coluna - 1, coluna + 1];
  for (let i = 0; i < colunasDiagonais.length; i++) {
    const c = colunasDiagonais[i];

    if (dentroDoTabuleiro(frente, c) && tabuleiro[frente][c] !== null &&
        corDaPeca(tabuleiro[frente][c]) !== cor) {
      movimentos.push({ linha: frente, coluna: c });
    }
  }

  return movimentos;
}

// Junta tudo: escolhe a função certa de acordo com o tipo da peça.
function movimentosDaPeca(tabuleiro, linha, coluna) {
  const tipo = tipoDaPeca(tabuleiro[linha][coluna]);

  if (tipo === "P") {
    return movimentosDoPeao(tabuleiro, linha, coluna);
  }
  if (tipo === "N") {
    return movimentosPorSalto(tabuleiro, linha, coluna, SALTOS_DO_CAVALO);
  }
  if (tipo === "K") {
    return movimentosPorSalto(tabuleiro, linha, coluna, DIRECOES_TODAS);
  }
  if (tipo === "R") {
    return movimentosEmLinha(tabuleiro, linha, coluna, DIRECOES_RETAS);
  }
  if (tipo === "B") {
    return movimentosEmLinha(tabuleiro, linha, coluna, DIRECOES_DIAGONAIS);
  }
  return movimentosEmLinha(tabuleiro, linha, coluna, DIRECOES_TODAS); // dama
}

// ---------------------------------------------------------------------------
// PARTE 2 — Xeque
// ---------------------------------------------------------------------------

function acharRei(tabuleiro, cor) {
  const rei = cor === "branca" ? "wK" : "bK";

  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      if (tabuleiro[linha][coluna] === rei) {
        return { linha: linha, coluna: coluna };
      }
    }
  }
  return null;
}

// O rei dessa cor está em xeque?
// Ideia: um rei está em xeque se alguma peça INIMIGA conseguiria "comer" o rei na
// próxima jogada, ou seja, se a casa do rei está entre os movimentos dela.
function reiEmXeque(tabuleiro, cor) {
  const rei = acharRei(tabuleiro, cor);
  if (rei === null) {
    return false;
  }

  const inimiga = oponente(cor);

  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      if (corDaPeca(tabuleiro[linha][coluna]) === inimiga) {
        const movimentos = movimentosDaPeca(tabuleiro, linha, coluna);

        if (listaTemPosicao(movimentos, rei)) {
          return true;
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// PARTE 3 — Movimentos legais (os que não deixam o próprio rei em xeque)
// ---------------------------------------------------------------------------

// A posição está dentro da lista?
function listaTemPosicao(lista, posicao) {
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].linha === posicao.linha && lista[i].coluna === posicao.coluna) {
      return true;
    }
  }
  return false;
}

// Para cada movimento possível, SIMULA a jogada numa cópia do tabuleiro.
// Se depois dela o seu próprio rei estiver em xeque, o movimento é proibido.
// Esse único teste já cuida de tudo: peça "cravada", rei andando para casa atacada,
// e a obrigação de sair do xeque.
function movimentosLegais(tabuleiro, linha, coluna) {
  const peca = tabuleiro[linha][coluna];
  const cor = corDaPeca(peca);
  const possiveis = movimentosDaPeca(tabuleiro, linha, coluna);
  const legais = [];

  for (let i = 0; i < possiveis.length; i++) {
    const copia = copiarTabuleiro(tabuleiro);
    copia[possiveis[i].linha][possiveis[i].coluna] = peca;
    copia[linha][coluna] = null;

    if (!reiEmXeque(copia, cor)) {
      legais.push(possiveis[i]);
    }
  }

  return legais;
}

// O jogador dessa cor tem pelo menos uma jogada legal?
//   sem jogada + em xeque     = xeque-mate
//   sem jogada + sem xeque    = afogamento (empate)
function temJogadaLegal(tabuleiro, cor) {
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      if (corDaPeca(tabuleiro[linha][coluna]) === cor &&
          movimentosLegais(tabuleiro, linha, coluna).length > 0) {
        return true;
      }
    }
  }
  return false;
}

// O peão chegou na última fileira? (branco na linha 0, preto na linha 7)
function pecaPrecisaPromover(peca, linhaDeDestino) {
  if (tipoDaPeca(peca) !== "P") {
    return false;
  }
  if (corDaPeca(peca) === "branca") {
    return linhaDeDestino === 0;
  }
  return linhaDeDestino === 7;
}
