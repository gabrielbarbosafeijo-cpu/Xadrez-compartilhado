// jogo.js — o estado da partida e o que acontece em cada jogada.

let tabuleiro;          // array 8x8 com as peças
let jogadorAtual;       // "branca" ou "preta"
let jogoTerminou;       // true depois de xeque-mate ou afogamento
let promocaoPendente;   // guarda a jogada enquanto o jogador escolhe a peça (ou null)

function novaPartida() {
  tabuleiro = criarTabuleiroInicial();
  jogadorAtual = "branca";
  jogoTerminou = false;
  promocaoPendente = null;

  esconderMenuPromocao();
  limparAviso();
  desenharTabuleiro();
  mostrarStatus("Vez das brancas");
}

// TODA jogada passa por aqui. O drop só entrega origem e destino.
// A função confere se a jogada vale e, só se valer, altera o tabuleiro.
function tentarJogada(origem, destino) {
  if (jogoTerminou) {
    mostrarAviso("A partida terminou. Clique em Nova partida.");
    return;
  }

  if (promocaoPendente !== null) {
    mostrarAviso("Escolha a peça da promoção primeiro.");
    return;
  }

  const peca = tabuleiro[origem.linha][origem.coluna];

  // 1) Tem peça na casa de origem?
  if (peca === null) {
    mostrarAviso("Não há peça nessa casa.");
    return;
  }

  // 2) A peça é do jogador da vez?
  if (corDaPeca(peca) !== jogadorAtual) {
    mostrarAviso("Essa peça não é sua. Vez das " + nomeNoPlural(jogadorAtual) + ".");
    return;
  }

  // 3) O movimento é permitido para essa peça?
  const possiveis = movimentosDaPeca(tabuleiro, origem.linha, origem.coluna);
  if (!listaTemPosicao(possiveis, destino)) {
    mostrarAviso("Movimento inválido para essa peça.");
    return;
  }

  // 4) A jogada deixaria o próprio rei em xeque?
  const legais = movimentosLegais(tabuleiro, origem.linha, origem.coluna);
  if (!listaTemPosicao(legais, destino)) {
    mostrarAviso("Jogada proibida: deixaria o seu rei em xeque.");
    return;
  }

  // A jogada é válida
  limparAviso();

  // Peão na última fileira: espera o jogador escolher a peça da promoção
  if (pecaPrecisaPromover(peca, destino.linha)) {
    promocaoPendente = { origem: origem, destino: destino };
    mostrarMenuPromocao();
    return;
  }

  executarJogada(origem, destino, null);
}

// Chamada pelos botões do menu de promoção ("Q", "R", "B" ou "N")
function escolherPromocao(tipo) {
  if (promocaoPendente === null) {
    return;
  }

  const jogada = promocaoPendente;
  promocaoPendente = null;
  esconderMenuPromocao();

  executarJogada(jogada.origem, jogada.destino, tipo);
}

// Faz a jogada no array, troca o turno e descobre se houve xeque, mate ou afogamento.
function executarJogada(origem, destino, tipoDaPromocao) {
  const peca = tabuleiro[origem.linha][origem.coluna];

  // 1) Muda o array (se houver peça no destino, ela é capturada ao ser substituída)
  if (tipoDaPromocao === null) {
    tabuleiro[destino.linha][destino.coluna] = peca;
  } else {
    tabuleiro[destino.linha][destino.coluna] = peca[0] + tipoDaPromocao; // ex.: "w" + "Q"
  }
  tabuleiro[origem.linha][origem.coluna] = null;

  // 2) Troca o turno
  const quemJogou = jogadorAtual;
  jogadorAtual = oponente(quemJogou);

  // 3) Depois da jogada, olha a situação do próximo jogador
  const emXeque = reiEmXeque(tabuleiro, jogadorAtual);
  const temJogada = temJogadaLegal(tabuleiro, jogadorAtual);

  if (!temJogada && emXeque) {
    jogoTerminou = true;
    mostrarStatus("XEQUE-MATE! As " + nomeNoPlural(quemJogou) + " venceram.");
  } else if (!temJogada) {
    jogoTerminou = true;
    mostrarStatus("EMPATE! Afogamento.");
  } else if (emXeque) {
    mostrarStatus("XEQUE! Vez das " + nomeNoPlural(jogadorAtual));
  } else {
    mostrarStatus("Vez das " + nomeNoPlural(jogadorAtual));
  }

  // 4) Redesenha a tela a partir do array
  desenharTabuleiro();
}

// ---------------------------------------------------------------------------
// Início
// ---------------------------------------------------------------------------

criarCasas();

document.getElementById("btnNovaPartida").addEventListener("click", novaPartida);

// Botões da promoção: cada um tem o tipo da peça no atributo data-tipo
const botoesPromocao = document.querySelectorAll("#promocao button");
for (let i = 0; i < botoesPromocao.length; i++) {
  botoesPromocao[i].addEventListener("click", function () {
    escolherPromocao(botoesPromocao[i].getAttribute("data-tipo"));
  });
}

novaPartida();
