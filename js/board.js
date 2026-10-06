// board.js — a parte VISUAL: desenha o tabuleiro, as peças, o painel e trata o Drag and Drop.
// Aqui não existem regras de xadrez: este arquivo só mostra o estado e avisa o jogo (game.js)
// quando o jogador solta uma peça.

const elTabuleiro = document.getElementById("tabuleiro");
const elVez = document.getElementById("vez");
const elSituacao = document.getElementById("situacao");
const elSituacaoTitulo = document.getElementById("situacaoTitulo");
const elSituacaoDetalhe = document.getElementById("situacaoDetalhe");
const elAviso = document.getElementById("aviso");
const elHistorico = document.getElementById("historico");
const elPromocao = document.getElementById("promocao");
const elOpcoesPromocao = document.getElementById("opcoesPromocao");

// casas[linha][coluna] guarda o <div> de cada casa, para achar rápido na hora de desenhar
const casas = [];

// ---------------------------------------------------------------------------
// 1. Criar as 64 casas (roda uma única vez)
// ---------------------------------------------------------------------------

function criarCasas() {
  elTabuleiro.textContent = "";

  for (let linha = 0; linha < 8; linha++) {
    casas.push([]);

    for (let coluna = 0; coluna < 8; coluna++) {
      const casa = document.createElement("div");
      const ehClara = (linha + coluna) % 2 === 0;

      casa.className = ehClara ? "casa clara" : "casa escura";
      casa.setAttribute("data-linha", linha);
      casa.setAttribute("data-coluna", coluna);

      // Coordenadas: números na coluna "a" e letras na última fileira
      if (coluna === 0) {
        const numero = document.createElement("span");
        numero.className = "coordenada coordenada-linha";
        numero.textContent = 8 - linha;
        casa.appendChild(numero);
      }
      if (linha === 7) {
        const letra = document.createElement("span");
        letra.className = "coordenada coordenada-coluna";
        letra.textContent = LETRAS_DAS_COLUNAS[coluna];
        casa.appendChild(letra);
      }

      // Cada casa pode receber uma peça solta sobre ela
      casa.addEventListener("dragover", aoArrastarSobreCasa);
      casa.addEventListener("drop", aoSoltarNaCasa);

      elTabuleiro.appendChild(casa);
      casas[linha].push(casa);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Desenhar o estado atual (tabuleiro, peças e destaques)
// ---------------------------------------------------------------------------

function criarImagemDaPeca(peca, linha, coluna) {
  const imagem = document.createElement("img");

  imagem.src = caminhoDaImagem(peca);
  imagem.alt = nomeDaPeca(peca);
  imagem.draggable = true;
  imagem.setAttribute("data-linha", linha);
  imagem.setAttribute("data-coluna", coluna);

  imagem.addEventListener("dragstart", aoComecarArrasto);
  imagem.addEventListener("dragend", aoTerminarArrasto);

  return imagem;
}

// Redesenha tudo a partir da matriz "tabuleiro". Nunca mexemos nas peças direto na tela:
// primeiro muda a matriz, depois chamamos esta função.
function renderizarTabuleiro() {
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      const casa = casas[linha][coluna];
      const imagemAntiga = casa.querySelector("img");

      if (imagemAntiga !== null) {
        casa.removeChild(imagemAntiga);
      }

      casa.classList.remove("ultima-jogada", "em-xeque", "origem-selecionada",
                            "destino-possivel", "destino-captura");

      if (tabuleiro[linha][coluna] !== null) {
        casa.appendChild(criarImagemDaPeca(tabuleiro[linha][coluna], linha, coluna));
      }
    }
  }

  // Destaque da última jogada
  if (ultimaJogada !== null) {
    casas[ultimaJogada.origem.linha][ultimaJogada.origem.coluna].classList.add("ultima-jogada");
    casas[ultimaJogada.destino.linha][ultimaJogada.destino.coluna].classList.add("ultima-jogada");
  }

  // Destaque do rei em xeque
  if (situacaoPartida === "xeque" || situacaoPartida === "xequeMate") {
    const rei = encontrarRei(tabuleiro, jogadorAtual);
    casas[rei.linha][rei.coluna].classList.add("em-xeque");
  }
}

// ---------------------------------------------------------------------------
// 3. Drag and Drop
// ---------------------------------------------------------------------------

// dragstart: a peça começou a ser arrastada. Guardamos a ORIGEM dentro do dataTransfer.
function aoComecarArrasto(evento) {
  const linha = Number(evento.target.getAttribute("data-linha"));
  const coluna = Number(evento.target.getAttribute("data-coluna"));

  evento.dataTransfer.setData("text/plain", linha + "," + coluna);
  evento.dataTransfer.effectAllowed = "move";

  casas[linha][coluna].classList.add("origem-selecionada"); // destaque da peça movimentada
  mostrarDestinosPossiveis(linha, coluna);
}

// dragover: por padrão o navegador NÃO deixa soltar nada em cima de um <div>.
// O preventDefault() é o que libera a casa para receber o drop.
function aoArrastarSobreCasa(evento) {
  evento.preventDefault();
  evento.dataTransfer.dropEffect = "move";
}

// drop: descobre ORIGEM -> DESTINO, mas NÃO executa a jogada.
// Quem decide se ela vale é a lógica do jogo (tentarJogada -> jogadaEhValida).
function aoSoltarNaCasa(evento) {
  evento.preventDefault();

  const partes = evento.dataTransfer.getData("text/plain").split(",");
  const origem = { linha: Number(partes[0]), coluna: Number(partes[1]) };
  const casaDestino = evento.currentTarget;
  const destino = {
    linha: Number(casaDestino.getAttribute("data-linha")),
    coluna: Number(casaDestino.getAttribute("data-coluna"))
  };

  limparDestaquesDeArrasto();

  // Se o que foi solto não veio de uma peça do tabuleiro, ignora
  if (partes.length !== 2 || isNaN(origem.linha) || isNaN(origem.coluna)) {
    return;
  }

  tentarJogada(origem, destino);
}

// dragend: o arrasto acabou (soltando em qualquer lugar). Limpa os destaques.
function aoTerminarArrasto() {
  limparDestaquesDeArrasto();
}

// Mostra bolinhas nas casas para onde a peça pode ir (só para o jogador da vez)
function mostrarDestinosPossiveis(linha, coluna) {
  const peca = tabuleiro[linha][coluna];

  if (partidaEncerrada() || promocaoPendente !== null || corDaPeca(peca) !== jogadorAtual) {
    return;
  }

  const legais = movimentosLegais(tabuleiro, linha, coluna, contexto);

  for (let i = 0; i < legais.length; i++) {
    const destino = legais[i];
    const casa = casas[destino.linha][destino.coluna];
    const temCaptura = tabuleiro[destino.linha][destino.coluna] !== null || destino.especial === "enPassant";

    casa.classList.add(temCaptura ? "destino-captura" : "destino-possivel");
  }
}

function limparDestaquesDeArrasto() {
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      casas[linha][coluna].classList.remove("origem-selecionada", "destino-possivel", "destino-captura");
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Painel: vez, xeque, fim de jogo, aviso de jogada inválida e histórico
// ---------------------------------------------------------------------------

function renderizarPainel() {
  const nomeDoJogador = jogadorAtual === "white" ? "brancas" : "pretas";
  const nomeDoVencedor = jogadorAtual === "white" ? "pretas" : "brancas";

  elSituacao.className = "situacao oculto";

  if (situacaoPartida === "xequeMate") {
    elVez.textContent = "Fim de jogo";
    elSituacaoTitulo.textContent = "XEQUE-MATE!";
    elSituacaoDetalhe.textContent = "As " + nomeDoVencedor + " venceram.";
    elSituacao.className = "situacao fim";
  } else if (situacaoPartida === "afogamento") {
    elVez.textContent = "Fim de jogo";
    elSituacaoTitulo.textContent = "EMPATE!";
    elSituacaoDetalhe.textContent = "Afogamento.";
    elSituacao.className = "situacao fim";
  } else {
    elVez.textContent = "Vez das " + nomeDoJogador;

    if (situacaoPartida === "xeque") {
      elSituacaoTitulo.textContent = "⚠ XEQUE!";
      elSituacaoDetalhe.textContent = "O rei das " + nomeDoJogador + " está ameaçado.";
      elSituacao.className = "situacao xeque";
    }
  }

  renderizarHistorico();
}

// Mostra "1. e4 e5", "2. Nf3 Nc6"... agrupando as jogadas de duas em duas.
// A numeração vem da própria lista numerada <ol>.
function renderizarHistorico() {
  elHistorico.textContent = "";

  for (let i = 0; i < historico.length; i += 2) {
    const item = document.createElement("li");
    let texto = historico[i].notation;

    if (i + 1 < historico.length) {
      texto = texto + "   " + historico[i + 1].notation;
    }

    item.textContent = texto;
    elHistorico.appendChild(item);
  }

  elHistorico.scrollTop = elHistorico.scrollHeight; // rola até a jogada mais recente
}

function mostrarAviso(texto) {
  elAviso.textContent = texto;
  elAviso.classList.remove("oculto");
}

function limparAviso() {
  elAviso.textContent = "";
  elAviso.classList.add("oculto");
}

// ---------------------------------------------------------------------------
// 5. Menu de promoção do peão
// ---------------------------------------------------------------------------

function abrirMenuPromocao(cor) {
  const prefixo = cor === "white" ? "w" : "b";

  elOpcoesPromocao.textContent = "";

  for (let i = 0; i < TIPOS_DE_PROMOCAO.length; i++) {
    const tipo = TIPOS_DE_PROMOCAO[i];
    const botao = document.createElement("button");
    const imagem = document.createElement("img");
    const rotulo = document.createElement("span");

    botao.type = "button";
    botao.className = "opcao-promocao";
    imagem.src = caminhoDaImagem(prefixo + tipo);
    imagem.alt = "";
    rotulo.textContent = NOMES_DOS_TIPOS[tipo];

    botao.appendChild(imagem);
    botao.appendChild(rotulo);
    botao.addEventListener("click", function () {
      escolherPromocao(tipo);
    });

    elOpcoesPromocao.appendChild(botao);
  }

  elPromocao.hidden = false;
}

function fecharMenuPromocao() {
  elPromocao.hidden = true;
  elOpcoesPromocao.textContent = "";
}
