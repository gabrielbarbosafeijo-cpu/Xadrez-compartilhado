// game.js — o ESTADO da partida e o fluxo de uma jogada.
// Aqui ficam as variáveis do jogo e a função tentarJogada, por onde TODA jogada passa.

let tabuleiro;                   // matriz 8x8 com os códigos das peças (ou null)
let jogadorAtual;                // "white" ou "black"
let contexto;                    // direitos de roque e alvo de en passant (ver rules.js)
let historico;                   // lista com um objeto por jogada
let situacaoPartida;             // "jogando" | "xeque" | "xequeMate" | "afogamento"
let promocaoPendente;            // jogada que espera a escolha da peça de promoção (ou null)
let ultimaJogada;                // { origem, destino } da última jogada, para destacar

// Zera tudo e começa uma partida nova.
function novaPartida() {
  tabuleiro = criarTabuleiroInicial();
  jogadorAtual = "white";
  contexto = criarContextoInicial();
  historico = [];
  situacaoPartida = "jogando";
  promocaoPendente = null;
  ultimaJogada = null;

  fecharMenuPromocao();
  limparAviso();
  atualizarTela();
}

function partidaEncerrada() {
  return situacaoPartida === "xequeMate" || situacaoPartida === "afogamento";
}

function atualizarTela() {
  renderizarTabuleiro();
  renderizarPainel();
}

// Ponto de entrada de toda jogada. O evento drop só chama esta função:
// ela valida e, só se for válida, altera o estado do jogo.
function tentarJogada(origem, destino) {
  if (partidaEncerrada()) {
    mostrarAviso("A partida terminou. Clique em Nova partida para jogar de novo.");
    return;
  }

  if (promocaoPendente !== null) {
    mostrarAviso("Escolha a peça da promoção antes de continuar.");
    return;
  }

  const resultado = jogadaEhValida(tabuleiro, origem, destino, jogadorAtual, contexto);

  if (!resultado.valido) {
    mostrarAviso(resultado.motivo); // tabuleiro e turno ficam exatamente como estavam
    return;
  }

  limparAviso();

  // Peão na última fileira: a jogada fica em espera até o jogador escolher a peça
  if (movimentoPrecisaDePromocao(tabuleiro, origem, resultado.movimento)) {
    promocaoPendente = { origem: origem, movimento: resultado.movimento };
    abrirMenuPromocao(jogadorAtual);
    return;
  }

  executarJogada(origem, resultado.movimento, null);
}

// Chamada pelos botões do menu de promoção.
function escolherPromocao(tipo) {
  if (promocaoPendente === null) {
    return;
  }

  const pendente = promocaoPendente;
  promocaoPendente = null;
  fecharMenuPromocao();

  executarJogada(pendente.origem, pendente.movimento, tipo);
}

// Aplica uma jogada JÁ VALIDADA: muda o tabuleiro, confere xeque/mate/afogamento,
// registra no histórico e só então troca o turno.
function executarJogada(origem, movimento, promocao) {
  const peca = tabuleiro[origem.linha][origem.coluna];
  const pecaCapturada = descobrirPecaCapturada(origem, movimento);

  // A notação precisa do tabuleiro ANTES da jogada (para saber se há ambiguidade)
  const notacaoBase = gerarNotacaoBase(origem, movimento, promocao, pecaCapturada);

  aplicarMovimento(tabuleiro, origem, movimento, promocao);
  contexto = atualizarContexto(contexto, peca, origem, movimento);

  // O xeque é verificado DEPOIS da jogada (e depois da promoção, se houve)
  const proximoJogador = oponente(jogadorAtual);
  const emXeque = reiEmXeque(tabuleiro, proximoJogador);
  const temJogada = existeJogadaLegal(tabuleiro, proximoJogador, contexto);
  let sufixo = "";

  if (emXeque && !temJogada) {
    situacaoPartida = "xequeMate";
    sufixo = "#";
  } else if (!emXeque && !temJogada) {
    situacaoPartida = "afogamento";
  } else if (emXeque) {
    situacaoPartida = "xeque";
    sufixo = "+";
  } else {
    situacaoPartida = "jogando";
  }

  historico.push({
    from: posicaoParaNotacao(origem),
    to: posicaoParaNotacao(movimento),
    piece: peca,
    captured: pecaCapturada,
    notation: notacaoBase + sufixo
  });

  ultimaJogada = { origem: origem, destino: movimento };
  jogadorAtual = proximoJogador; // o turno só muda aqui, depois de uma jogada válida

  atualizarTela();
}

// Código da peça capturada nesta jogada (ou null). No en passant ela não está no destino.
function descobrirPecaCapturada(origem, movimento) {
  if (movimento.especial === "enPassant") {
    return tabuleiro[origem.linha][movimento.coluna];
  }
  return tabuleiro[movimento.linha][movimento.coluna];
}

// ---------------------------------------------------------------------------
// Notação algébrica (e4, Nf3, exd5, O-O, e8=Q...)
// ---------------------------------------------------------------------------

function gerarNotacaoBase(origem, movimento, promocao, pecaCapturada) {
  if (movimento.especial === "roquePequeno") {
    return "O-O";
  }
  if (movimento.especial === "roqueGrande") {
    return "O-O-O";
  }

  const peca = tabuleiro[origem.linha][origem.coluna];
  const tipo = tipoDaPeca(peca);
  const destinoTexto = posicaoParaNotacao(movimento);
  const ehCaptura = pecaCapturada !== null;
  let notacao = "";

  if (tipo === "P") {
    // Peão captura com a coluna de origem: "exd5"
    if (ehCaptura) {
      notacao = posicaoParaNotacao(origem)[0] + "x";
    }
    notacao = notacao + destinoTexto;
    if (promocao !== null) {
      notacao = notacao + "=" + promocao;
    }
    return notacao;
  }

  notacao = tipo + descobrirDesambiguacao(origem, movimento);
  if (ehCaptura) {
    notacao = notacao + "x";
  }
  return notacao + destinoTexto;
}

// Quando duas peças iguais podem ir para a mesma casa (ex.: dois cavalos), a notação
// precisa dizer qual delas foi: "Nbd2" ou "N1d2". Devolve o trecho extra (ou "").
function descobrirDesambiguacao(origem, movimento) {
  const peca = tabuleiro[origem.linha][origem.coluna];
  let existeOutra = false;
  let mesmaColuna = false;
  let mesmaLinha = false;

  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      const ehAPropriaPeca = linha === origem.linha && coluna === origem.coluna;

      if (ehAPropriaPeca || tabuleiro[linha][coluna] !== peca) {
        continue;
      }

      const legais = movimentosLegais(tabuleiro, linha, coluna, contexto);

      for (let i = 0; i < legais.length; i++) {
        if (legais[i].linha === movimento.linha && legais[i].coluna === movimento.coluna) {
          existeOutra = true;
          if (coluna === origem.coluna) { mesmaColuna = true; }
          if (linha === origem.linha) { mesmaLinha = true; }
        }
      }
    }
  }

  if (!existeOutra) {
    return "";
  }

  const origemTexto = posicaoParaNotacao(origem);

  if (!mesmaColuna) {
    return origemTexto[0]; // a coluna basta
  }
  if (!mesmaLinha) {
    return origemTexto[1]; // a fileira basta
  }
  return origemTexto;
}
