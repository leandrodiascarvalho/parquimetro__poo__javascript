/**
 * Controlador de Interface e Interação (App Principal)
 */
document.addEventListener('DOMContentLoaded', () => {
  // Instancia o Parquímetro
  const parquimetro = new Parquimetro();

  // Seletores do DOM
  const elClock = document.getElementById('screenClock');
  const elRate = document.getElementById('screenRate');
  const elTempo = document.getElementById('tempo');
  const elDisplayValor = document.getElementById('displayValor');
  const elTroco = document.getElementById('troco');
  const elMsg = document.getElementById('msg');
  const elValorInput = document.getElementById('valorInput');
  
  // LED Status Lights
  const lightRed = document.getElementById('lightRed');
  const lightYellow = document.getElementById('lightYellow');
  const lightGreen = document.getElementById('lightGreen');

  // Botões de Ação
  const btnLimpar = document.getElementById('btnLimpar');
  const btnPagar = document.getElementById('btnPagar');

  // Moedas e Veículos
  const btnCoins = document.querySelectorAll('.btn-coin');
  const radioVeiculos = document.querySelectorAll('input[name="tipoVeiculoRadio"]');
  const selectVeiculo = document.getElementById('tipoVeiculo');

  // Elementos do Ticket Virtual
  const ticketWrapper = document.getElementById('ticketWrapper');
  const physicalTicket = document.getElementById('physicalTicket');
  const ticketId = document.getElementById('ticketId');
  const ticketVeiculo = document.getElementById('ticketVeiculo');
  const ticketTarifa = document.getElementById('ticketTarifa');
  const ticketValor = document.getElementById('ticketValor');
  const ticketTempo = document.getElementById('ticketTempo');
  const ticketEmissao = document.getElementById('ticketEmissao');

  // Histórico
  const elHistoricoList = document.getElementById('historico');

  // 1. Inicializa o relógio em tempo real na tela
  Utils.iniciarRelogio(elClock);

  // 2. Renderiza o histórico inicial carregado do localStorage
  atualizarHistoricoUI();

  // 3. Atualiza a tela inicial
  atualizarTelaUI();

  /* ==========================================================================
     EFEITOS SONOROS (Web Audio API)
     ========================================================================== */
  
  /**
   * Som de clique físico mecânico para botões
   */
  function tocarSomClique() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio Context desativado ou não suportado.');
    }
  }

  /**
   * Som de inserção de moeda metálica
   */
  function tocarSomMoeda() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      osc.frequency.setValueAtTime(2400, audioCtx.currentTime + 0.03);
      
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('Som de moeda indisponível.');
    }
  }

  /**
   * Som de impressão do recibo térmico (zip-zip-zip)
   */
  function tocarSomImpressora() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      let tempoAtual = audioCtx.currentTime;
      
      // Simula 4 pequenas passadas de cabeçote de impressão
      for (let i = 0; i < 5; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600 + (i * 80), tempoAtual);
        osc.frequency.linearRampToValueAtTime(1200 + (i * 50), tempoAtual + 0.08);
        
        gain.gain.setValueAtTime(0.02, tempoAtual);
        gain.gain.linearRampToValueAtTime(0, tempoAtual + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(tempoAtual);
        osc.stop(tempoAtual + 0.08);
        
        tempoAtual += 0.12;
      }
    } catch (e) {
      console.warn('Som da impressora indisponível.');
    }
  }

  /* ==========================================================================
     ATUALIZAÇÃO DE INTERFACE
     ========================================================================== */

  /**
   * Sincroniza e redesenha todo o estado do parquímetro na tela digital
   */
  function atualizarTelaUI() {
    const tarifaHora = parquimetro.obterTarifaHora();
    elRate.textContent = Utils.formatarBRL(tarifaHora) + '/h';
    
    // Executa os cálculos do parquímetro
    const resultado = parquimetro.calcular();

    // Atualiza valores principais
    elTempo.textContent = String(resultado.tempo).padStart(2, '0');
    elDisplayValor.textContent = Utils.formatarBRL(parquimetro.saldoInserido);
    elTroco.textContent = Utils.formatarBRL(resultado.troco);

    // Controle de LEDs e Mensagens de Status
    lightRed.classList.remove('active');
    lightYellow.classList.remove('active');
    lightGreen.classList.remove('active');
    elMsg.className = 'screen-msg';

    if (parquimetro.saldoInserido === 0) {
      // Sem saldo inserido
      elMsg.textContent = 'Selecione o veículo e insira moedas';
      lightYellow.classList.add('active');
    } else if (resultado.erro) {
      // Valor abaixo do mínimo
      elMsg.textContent = resultado.erro;
      elMsg.classList.add('error');
      lightRed.classList.add('active');
    } else {
      // Pronto para emitir ticket
      if (resultado.tempo === parquimetro.tempoMaximoMinutos) {
        elMsg.textContent = 'TEMPO MÁXIMO (2h) ALCANÇADO!';
      } else {
        elMsg.textContent = 'Pronto para emitir ticket';
      }
      elMsg.classList.add('success');
      lightGreen.classList.add('active');
    }
  }

  /**
   * Preenche a lista do histórico de transações
   */
  function atualizarHistoricoUI() {
    elHistoricoList.innerHTML = '';
    
    if (parquimetro.historico.length === 0) {
      const elVazio = document.createElement('li');
      elVazio.className = 'history-item';
      elVazio.style.justifyContent = 'center';
      elVazio.style.color = 'var(--text-muted)';
      elVazio.textContent = 'Sem transações recentes';
      elHistoricoList.appendChild(elVazio);
      return;
    }

    parquimetro.historico.forEach(ticket => {
      const elLi = document.createElement('li');
      elLi.className = 'history-item';

      const veiculoFormatado = ticket.veiculo === 'onibus' ? 'Ônibus' : ticket.veiculo;

      elLi.innerHTML = `
        <div class="history-item-left">
          <span class="history-item-veiculo">${veiculoFormatado} <small>${ticket.id}</small></span>
          <span class="history-item-time">${ticket.dataHora}</span>
        </div>
        <div class="history-item-right">
          <span class="history-item-valor">${Utils.formatarBRL(ticket.valorPago)}</span>
          <span class="history-item-duracao">${Utils.formatarTempo(ticket.tempoMinutos)}</span>
        </div>
      `;
      elHistoricoList.appendChild(elLi);
    });
  }

  /* ==========================================================================
     EVENTOS E INTERAÇÕES
     ========================================================================== */

  // Monitora mudança nos cards de veículo (Radio Buttons)
  radioVeiculos.forEach(radio => {
    radio.addEventListener('change', (e) => {
      tocarSomClique();
      const tipo = e.target.value;
      
      // Sincroniza com o select oculto
      selectVeiculo.value = tipo;
      
      parquimetro.selecionarVeiculo(tipo);
      atualizarTelaUI();
      
      // Oculta o ticket impresso se houver mudança de veículo
      ticketWrapper.classList.remove('print');
    });
  });

  // Monitora cliques nos botões rápidos de moedas
  btnCoins.forEach(coin => {
    coin.addEventListener('click', () => {
      tocarSomMoeda();
      const valor = parseFloat(coin.getAttribute('data-val'));
      
      parquimetro.depositar(valor);
      
      // Atualiza o input numérico
      elValorInput.value = parquimetro.saldoInserido;
      
      atualizarTelaUI();
      ticketWrapper.classList.remove('print');
    });
  });

  // Monitora digitação manual de valores
  elValorInput.addEventListener('input', (e) => {
    const valor = parseFloat(e.target.value);
    parquimetro.definirSaldo(isNaN(valor) ? 0 : valor);
    atualizarTelaUI();
    ticketWrapper.classList.remove('print');
  });

  // Ação de Limpar
  btnLimpar.addEventListener('click', () => {
    tocarSomClique();
    parquimetro.limpar();
    elValorInput.value = '';
    
    // Esconde o ticket com animação
    ticketWrapper.classList.remove('print');
    
    atualizarTelaUI();
  });


  // Ação de Pagar / Emitir Ticket
  btnPagar.addEventListener('click', () => {
    const resultado = parquimetro.calcular();

    if (resultado.erro) {
      tocarSomClique();
      // Mostra animação de erro (shake) na mensagem
      elMsg.classList.remove('shake');
      void elMsg.offsetWidth; // Trigger reflow para resetar animação CSS
      elMsg.classList.add('error', 'shake');
      return;
    }

    // Emite o ticket no parquímetro
    const ticketEmitido = parquimetro.emitirTicket();

    if (ticketEmitido) {
      // 1. Toca o som de impressão térmica
      tocarSomImpressora();

      // 2. Preenche o ticket físico na tela
      ticketId.textContent = ticketEmitido.id;
      
      let nomeVeiculo = ticketEmitido.veiculo === 'onibus' ? 'ÔNIBUS' : ticketEmitido.veiculo.toUpperCase();
      ticketVeiculo.textContent = nomeVeiculo;
      
      ticketTarifa.textContent = Utils.formatarBRL(parquimetro.veiculos[ticketEmitido.veiculo].tarifaHora) + '/h';
      ticketValor.textContent = Utils.formatarBRL(ticketEmitido.valorPago);
      ticketTempo.textContent = Utils.formatarTempo(ticketEmitido.tempoMinutos);
      ticketEmissao.textContent = ticketEmitido.dataHora;

      // 3. Reseta o campo de input
      elValorInput.value = '';

      // 4. Anima a saída do ticket (impressão)
      ticketWrapper.classList.add('print');

      // 5. Atualiza a tela (estará zerada) e o histórico de transações
      atualizarTelaUI();
      atualizarHistoricoUI();
    }
  });

  // Permitir "retirar" o ticket clicando nele
  physicalTicket.addEventListener('click', () => {
    tocarSomClique();
    ticketWrapper.classList.remove('print');
  });
});
