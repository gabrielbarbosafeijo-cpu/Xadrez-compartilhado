// rules.js — as regras do xadrez, em JavaScript puro.
//
// Este arquivo NÃO mexe na tela (não usa document). Ele só recebe dados e devolve dados,
// por isso dá para testar tudo no console do navegador, sem precisar arrastar peças.
//
// Convenções:
//   posição   = { linha, coluna }   (linha 0 = fileira 8, linha 7 = fileira 1; coluna 0 = "a")
//   movimento = { linha, coluna, especial }  -> destino + tipo de jogada especial
//               especial: null | "roquePequeno" | "roqueGrande" | "enPassant"
//   contexto  = informações que o tabuleiro sozinho não mostra:
//               { direitosRoque, alvoEnPassant }

const LETRAS_DAS_COLUNAS = "abcdefgh";

const DIRECOES_TORRE = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIRECOES_BISPO = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const DIRECOES_DAMA = DIRECOES_TORRE.concat(DIRECOES_BISPO);
const SALTOS_DO_CAVALO = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

// ---------------------------------------------------------------------------
// 1. Utilidades
// ---------------------------------------------------------------------------

function dentroDoTabuleiro(linha, coluna) {
  return linha >= 0 && linha < 8 && coluna >= 0 && coluna < 8;
}

function oponente(cor) {
  return cor === "white" ? "black" : "white";
}

// Copia o tabuleiro inteiro. Usada para SIMULAR jogadas sem estragar o tabuleiro real.
function copiarTabuleiro(tabuleiro) {
  return tabuleiro.map(function (linha) {
    return linha.slice();
  });
}

// { linha: 6, coluna: 4 } -> "e2"
function posicaoParaNotacao(posicao) {
  return LETRAS_DAS_COLUNAS[posicao.coluna] + (8 - posicao.linha);
}

// "e2" -> { linha: 6, coluna: 4 }
function notacaoParaPosicao(texto) {
  return {
    linha: 8 - Number(texto[1]),
    coluna: LETRAS_DAS_COLUNAS.indexOf(texto[0])
  };
}

function encontrarRei(tabuleiro, cor) {
  const rei = cor === "white" ? "wK" : "bK";

  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      if (tabuleiro[linha][coluna] === rei) {
        return { linha: linha, coluna: coluna };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 2. Contexto (roque e en passant)
// ---------------------------------------------------------------------------

function criarContextoInicial() {
  return {
    direitosRoque: {
      white: { pequeno: true, grande: true },
      black: { pequeno: true, grande: true }
    },
    // casa "pulada" por um peão que acabou de andar duas casas (ou null)
    alvoEnPassant: null
  };
}

function copiarContexto(contexto) {
  return {
    direitosRoque: {
      white: {
        pequeno: contexto.direitosRoque.white.pequeno,
        grande: contexto.direitosRoque.white.grande
      },
      black: {
        pequeno: contexto.direitosRoque.black.pequeno,
        grande: contexto.direitosRoque.black.grande
      }
    },
    alvoEnPassant: contexto.alvoEnPassant
  };
}

// Se algo saiu de uma casa de torre (ou chegou nela), aquele roque deixa de existir.
function removerDireitoDaCasaDeTorre(contexto, linha, coluna) {
  if (linha === 7 && coluna === 0) { contexto.direitosRoque.white.grande = false; }
  if (linha === 7 && coluna === 7) { contexto.direitosRoque.white.pequeno = false; }
  if (linha === 0 && coluna === 0) { contexto.direitosRoque.black.grande = false; }
  if (linha === 0 && coluna === 7) { contexto.direitosRoque.black.pequeno = false; }
}

// Devolve o contexto novo depois de uma jogada (não altera o contexto antigo).
function atualizarContexto(contexto, peca, origem, movimento) {
  const novo = copiarContexto(contexto);
  const cor = corDaPeca(peca);

  // Rei mexeu: perde os dois roques
  if (tipoDaPeca(peca) === "K") {
    novo.direitosRoque[cor].pequeno = false;
    novo.direitosRoque[cor].grande = false;
  }

  // Torre saiu do canto, ou uma peça chegou ao canto (captura da torre)
  removerDireitoDaCasaDeTorre(novo, origem.linha, origem.coluna);
  removerDireitoDaCasaDeTorre(novo, movimento.linha, movimento.coluna);

  // En passant só vale na jogada seguinte a um passo duplo do peão
  novo.alvoEnPassant = null;
  if (tipoDaPeca(peca) === "P" && Math.abs(movimento.linha - origem.linha) === 2) {
    novo.alvoEnPassant = {
      linha: (origem.linha + movimento.linha) / 2,
      coluna: origem.coluna
    };
  }

  return novo;
}

// ---------------------------------------------------------------------------
// 3. Casa atacada e xeque
// ---------------------------------------------------------------------------

// Anda a partir da casa, numa direção, e devolve a primeira peça encontrada (ou null).
function primeiraPecaNaDirecao(tabuleiro, linha, coluna, passoLinha, passoColuna) {
  let l = linha + passoLinha;
  let c = coluna + passoColuna;

  while (dentroDoTabuleiro(l, c)) {
    if (tabuleiro[l][c] !== null) {
      return tabuleiro[l][c];
    }
    l = l + passoLinha;
    c = c + passoColuna;
  }

  return null;
}

// Alguma das direções encontra uma peça da cor atacante cujo tipo está na lista?
function direcoesAtingemPeca(tabuleiro, linha, coluna, direcoes, prefixo, tipos) {
  for (let i = 0; i < direcoes.length; i++) {
    const peca = primeiraPecaNaDirecao(tabuleiro, linha, coluna, direcoes[i][0], direcoes[i][1]);

    if (peca !== null && peca[0] === prefixo && tipos.indexOf(tipoDaPeca(peca)) !== -1) {
      return true;
    }
  }
  return false;
}

// A casa está sendo atacada por alguma peça da cor "corAtacante"?
// A ideia é olhar "para fora" da casa: se dela eu enxergo um cavalo inimigo
// a um salto de L, então esse cavalo também enxerga a casa.
function casaAtacada(tabuleiro, linha, coluna, corAtacante) {
  const prefixo = corAtacante === "white" ? "w" : "b";

  // Peões: o peão branco ataca "para cima" (linha diminui), o preto "para baixo"
  const linhaDoPeao = corAtacante === "white" ? linha + 1 : linha - 1;
  const colunasDoPeao = [coluna - 1, coluna + 1];
  for (let i = 0; i < colunasDoPeao.length; i++) {
    if (dentroDoTabuleiro(linhaDoPeao, colunasDoPeao[i]) &&
        tabuleiro[linhaDoPeao][colunasDoPeao[i]] === prefixo + "P") {
      return true;
    }
  }

  // Cavalos
  for (let i = 0; i < SALTOS_DO_CAVALO.length; i++) {
    const l = linha + SALTOS_DO_CAVALO[i][0];
    const c = coluna + SALTOS_DO_CAVALO[i][1];
    if (dentroDoTabuleiro(l, c) && tabuleiro[l][c] === prefixo + "N") {
      return true;
    }
  }

  // Rei (uma casa em qualquer direção)
  for (let i = 0; i < DIRECOES_DAMA.length; i++) {
    const l = linha + DIRECOES_DAMA[i][0];
    const c = coluna + DIRECOES_DAMA[i][1];
    if (dentroDoTabuleiro(l, c) && tabuleiro[l][c] === prefixo + "K") {
      return true;
    }
  }

  // Torre/Dama em linha reta e Bispo/Dama na diagonal
  if (direcoesAtingemPeca(tabuleiro, linha, coluna, DIRECOES_TORRE, prefixo, ["R", "Q"])) {
    return true;
  }
  if (direcoesAtingemPeca(tabuleiro, linha, coluna, DIRECOES_BISPO, prefixo, ["B", "Q"])) {
    return true;
  }

  return false;
}

function reiEmXeque(tabuleiro, cor) {
  const rei = encontrarRei(tabuleiro, cor);

  if (rei === null) {
    return false;
  }

  return casaAtacada(tabuleiro, rei.linha, rei.coluna, oponente(cor));
}

// ---------------------------------------------------------------------------
// 4. Movimentos de cada peça (ainda sem olhar se o rei fica em xeque)
// ---------------------------------------------------------------------------

// Cavalo e Rei (sem roque): vão para casas fixas, podendo "pular" peças.
function movimentosDeSalto(tabuleiro, linha, coluna, deslocamentos) {
  const cor = corDaPeca(tabuleiro[linha][coluna]);
  const movimentos = [];

  for (let i = 0; i < deslocamentos.length; i++) {
    const l = linha + deslocamentos[i][0];
    const c = coluna + deslocamentos[i][1];

    if (!dentroDoTabuleiro(l, c)) {
      continue;
    }

    const alvo = tabuleiro[l][c];
    if (alvo === null || corDaPeca(alvo) !== cor) {
      movimentos.push({ linha: l, coluna: c, especial: null });
    }
  }

  return movimentos;
}

// Torre, Bispo e Dama: andam em linha até encontrar uma peça ou a borda.
function movimentosDeslizantes(tabuleiro, linha, coluna, direcoes) {
  const cor = corDaPeca(tabuleiro[linha][coluna]);
  const movimentos = [];

  for (let i = 0; i < direcoes.length; i++) {
    let l = linha + direcoes[i][0];
    let c = coluna + direcoes[i][1];

    while (dentroDoTabuleiro(l, c)) {
      const alvo = tabuleiro[l][c];

      if (alvo === null) {
        movimentos.push({ linha: l, coluna: c, especial: null });
      } else {
        if (corDaPeca(alvo) !== cor) {
          movimentos.push({ linha: l, coluna: c, especial: null }); // captura
        }
        break; // peça no caminho: não dá para passar
      }

      l = l + direcoes[i][0];
      c = c + direcoes[i][1];
    }
  }

  return movimentos;
}

function movimentosDoPeao(tabuleiro, linha, coluna, contexto) {
  const cor = corDaPeca(tabuleiro[linha][coluna]);
  const sentido = cor === "white" ? -1 : 1;
  const linhaInicial = cor === "white" ? 6 : 1;
  const linhaDaFrente = linha + sentido;
  const movimentos = [];

  if (!dentroDoTabuleiro(linhaDaFrente, coluna)) {
    return movimentos;
  }

  // Andar para frente (só se a casa estiver vazia)
  if (tabuleiro[linhaDaFrente][coluna] === null) {
    movimentos.push({ linha: linhaDaFrente, coluna: coluna, especial: null });

    // Primeira jogada: pode andar duas casas (as duas precisam estar vazias)
    const linhaDupla = linha + 2 * sentido;
    if (linha === linhaInicial && tabuleiro[linhaDupla][coluna] === null) {
      movimentos.push({ linha: linhaDupla, coluna: coluna, especial: null });
    }
  }

  // Capturar na diagonal (ou en passant)
  const colunasDiagonais = [coluna - 1, coluna + 1];
  for (let i = 0; i < colunasDiagonais.length; i++) {
    const c = colunasDiagonais[i];

    if (!dentroDoTabuleiro(linhaDaFrente, c)) {
      continue;
    }

    const alvo = tabuleiro[linhaDaFrente][c];

    if (alvo !== null && corDaPeca(alvo) !== cor) {
      movimentos.push({ linha: linhaDaFrente, coluna: c, especial: null });
    } else if (alvo === null &&
               contexto.alvoEnPassant !== null &&
               contexto.alvoEnPassant.linha === linhaDaFrente &&
               contexto.alvoEnPassant.coluna === c) {
      movimentos.push({ linha: linhaDaFrente, coluna: c, especial: "enPassant" });
    }
  }

  return movimentos;
}

function movimentosDoRei(tabuleiro, linha, coluna, contexto) {
  const movimentos = movimentosDeSalto(tabuleiro, linha, coluna, DIRECOES_DAMA);
  const cor = corDaPeca(tabuleiro[linha][coluna]);
  const linhaBase = cor === "white" ? 7 : 0;

  // Roque: só com o rei na casa inicial e fora de xeque
  if (linha !== linhaBase || coluna !== 4 || reiEmXeque(tabuleiro, cor)) {
    return movimentos;
  }

  const inimigo = oponente(cor);
  const direitos = contexto.direitosRoque[cor];
  const torre = (cor === "white" ? "w" : "b") + "R";

  // Roque pequeno (lado do rei): casas f e g vazias e não atacadas
  if (direitos.pequeno &&
      tabuleiro[linhaBase][7] === torre &&
      tabuleiro[linhaBase][5] === null &&
      tabuleiro[linhaBase][6] === null &&
      !casaAtacada(tabuleiro, linhaBase, 5, inimigo) &&
      !casaAtacada(tabuleiro, linhaBase, 6, inimigo)) {
    movimentos.push({ linha: linhaBase, coluna: 6, especial: "roquePequeno" });
  }

  // Roque grande (lado da dama): casas b, c e d vazias; c e d não atacadas
  if (direitos.grande &&
      tabuleiro[linhaBase][0] === torre &&
      tabuleiro[linhaBase][1] === null &&
      tabuleiro[linhaBase][2] === null &&
      tabuleiro[linhaBase][3] === null &&
      !casaAtacada(tabuleiro, linhaBase, 3, inimigo) &&
      !casaAtacada(tabuleiro, linhaBase, 2, inimigo)) {
    movimentos.push({ linha: linhaBase, coluna: 2, especial: "roqueGrande" });
  }

  return movimentos;
}

// Todos os movimentos que a peça faz "pelas regras dela", ignorando o xeque.
function movimentosPseudoLegais(tabuleiro, linha, coluna, contexto) {
  const peca = tabuleiro[linha][coluna];

  if (peca === null) {
    return [];
  }

  const tipo = tipoDaPeca(peca);

  if (tipo === "P") { return movimentosDoPeao(tabuleiro, linha, coluna, contexto); }
  if (tipo === "N") { return movimentosDeSalto(tabuleiro, linha, coluna, SALTOS_DO_CAVALO); }
  if (tipo === "B") { return movimentosDeslizantes(tabuleiro, linha, coluna, DIRECOES_BISPO); }
  if (tipo === "R") { return movimentosDeslizantes(tabuleiro, linha, coluna, DIRECOES_TORRE); }
  if (tipo === "Q") { return movimentosDeslizantes(tabuleiro, linha, coluna, DIRECOES_DAMA); }
  return movimentosDoRei(tabuleiro, linha, coluna, contexto);
}

// ---------------------------------------------------------------------------
// 5. Executar um movimento e filtrar os legais
// ---------------------------------------------------------------------------

// ALTERA o tabuleiro recebido. "promocao" é o tipo escolhido ("Q", "R", "B", "N") ou null.
function aplicarMovimento(tabuleiro, origem, movimento, promocao) {
  const peca = tabuleiro[origem.linha][origem.coluna];
  tabuleiro[origem.linha][origem.coluna] = null;

  // En passant: o peão capturado fica na linha de origem, na coluna do destino
  if (movimento.especial === "enPassant") {
    tabuleiro[origem.linha][movimento.coluna] = null;
  }

  // Roque: além do rei, a torre também muda de casa
  if (movimento.especial === "roquePequeno") {
    tabuleiro[movimento.linha][5] = tabuleiro[movimento.linha][7];
    tabuleiro[movimento.linha][7] = null;
  }
  if (movimento.especial === "roqueGrande") {
    tabuleiro[movimento.linha][3] = tabuleiro[movimento.linha][0];
    tabuleiro[movimento.linha][0] = null;
  }

  if (promocao !== null) {
    tabuleiro[movimento.linha][movimento.coluna] = peca[0] + promocao;
  } else {
    tabuleiro[movimento.linha][movimento.coluna] = peca;
  }
}

// O peão chegou à última fileira com esse movimento?
function movimentoPrecisaDePromocao(tabuleiro, origem, movimento) {
  const peca = tabuleiro[origem.linha][origem.coluna];

  if (tipoDaPeca(peca) !== "P") {
    return false;
  }

  const ultimaLinha = corDaPeca(peca) === "white" ? 0 : 7;
  return movimento.linha === ultimaLinha;
}

// Movimentos LEGAIS: os pseudo-legais que não deixam o próprio rei em xeque.
// Truque: simular cada movimento numa CÓPIA do tabuleiro e olhar se o rei fica em xeque.
// Isso resolve de uma vez peças cravadas, rei andando para casa atacada etc.
function movimentosLegais(tabuleiro, linha, coluna, contexto) {
  const cor = corDaPeca(tabuleiro[linha][coluna]);
  const candidatos = movimentosPseudoLegais(tabuleiro, linha, coluna, contexto);
  const legais = [];

  for (let i = 0; i < candidatos.length; i++) {
    const copia = copiarTabuleiro(tabuleiro);
    aplicarMovimento(copia, { linha: linha, coluna: coluna }, candidatos[i], null);

    if (!reiEmXeque(copia, cor)) {
      legais.push(candidatos[i]);
    }
  }

  return legais;
}

// O jogador dessa cor tem pelo menos uma jogada legal?
// (Sem jogada + xeque = xeque-mate | sem jogada + sem xeque = afogamento)
function existeJogadaLegal(tabuleiro, cor, contexto) {
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      if (corDaPeca(tabuleiro[linha][coluna]) === cor &&
          movimentosLegais(tabuleiro, linha, coluna, contexto).length > 0) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 6. Validação da jogada (a função que o drop chama)
// ---------------------------------------------------------------------------

// Devolve { valido, motivo, movimento }.
//  - valido:    true/false
//  - motivo:    texto explicando por que foi recusada (usado no aviso da tela)
//  - movimento: o movimento encontrado (com o campo "especial"), quando válido
function jogadaEhValida(tabuleiro, origem, destino, jogadorAtual, contexto) {
  const peca = tabuleiro[origem.linha][origem.coluna];

  // 1. Existe peça na origem?
  if (peca === null) {
    return { valido: false, motivo: "Não há peça nessa casa.", movimento: null };
  }

  // 2. A peça é do jogador da vez?
  if (corDaPeca(peca) !== jogadorAtual) {
    const vez = jogadorAtual === "white" ? "das brancas" : "das pretas";
    return { valido: false, motivo: "Essa peça não é sua. Vez " + vez + ".", movimento: null };
  }

  // 3. A peça saiu do lugar?
  if (origem.linha === destino.linha && origem.coluna === destino.coluna) {
    return { valido: false, motivo: "Solte a peça em outra casa.", movimento: null };
  }

  // 4. O destino tem peça da mesma cor?
  const pecaNoDestino = tabuleiro[destino.linha][destino.coluna];
  if (pecaNoDestino !== null && corDaPeca(pecaNoDestino) === jogadorAtual) {
    return { valido: false, motivo: "Não é permitido capturar uma peça da mesma cor.", movimento: null };
  }

  // 5. O movimento é permitido para esse tipo de peça (e o caminho está livre)?
  const candidatos = movimentosPseudoLegais(tabuleiro, origem.linha, origem.coluna, contexto);
  let movimento = null;

  for (let i = 0; i < candidatos.length; i++) {
    if (candidatos[i].linha === destino.linha && candidatos[i].coluna === destino.coluna) {
      movimento = candidatos[i];
    }
  }

  if (movimento === null) {
    return {
      valido: false,
      motivo: "Movimento inválido para " + nomeDaPeca(peca) + " (ou há peças no caminho).",
      movimento: null
    };
  }

  // 6. A jogada deixa o próprio rei em xeque? (simulação na cópia)
  const copia = copiarTabuleiro(tabuleiro);
  aplicarMovimento(copia, origem, movimento, null);

  if (reiEmXeque(copia, jogadorAtual)) {
    const jaEstavaEmXeque = reiEmXeque(tabuleiro, jogadorAtual);
    const motivo = jaEstavaEmXeque
      ? "Seu rei está em xeque: essa jogada não o protege."
      : "Jogada ilegal: deixaria o seu rei em xeque.";
    return { valido: false, motivo: motivo, movimento: null };
  }

  return { valido: true, motivo: "", movimento: movimento };
}
