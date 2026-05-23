/**
 * Entidade que representa um veículo e sua tarifa
 */
class Veiculo {
  /**
   * @param {string} tipo - 'moto', 'carro' ou 'onibus'
   * @param {number} tarifaHora - Tarifa cobrada por hora
   */
  constructor(tipo, tarifaHora) {
    this.tipo = tipo;
    this.tarifaHora = tarifaHora;
  }
}

/**
 * Entidade que representa um recibo/ticket de transação
 */
class Ticket {
  /**
   * @param {string} id 
   * @param {string} veiculo 
   * @param {number} valorPago 
   * @param {number} tempoMinutos 
   * @param {string} dataHora 
   */
  constructor(id, veiculo, valorPago, tempoMinutos, dataHora) {
    this.id = id;
    this.veiculo = veiculo;
    this.valorPago = valorPago;
    this.tempoMinutos = tempoMinutos;
    this.dataHora = dataHora;
  }
}

/**
 * Controladora principal do Parquímetro (State & Business Logic)
 */
class Parquimetro {
  constructor() {
    // Configurações de Veículos e Tarifas
    this.veiculos = {
      moto: new Veiculo('moto', 2.00),
      carro: new Veiculo('carro', 5.00),
      onibus: new Veiculo('onibus', 10.00)
    };

    // Estado Inicial
    this.veiculoAtivo = 'moto';
    this.saldoInserido = 0;
    this.tempoMaximoMinutos = 120; // Limite máximo de 2 horas
    this.tempoMinimoMinutos = 15;  // Limite mínimo de 15 minutos para emitir

    this.historico = [];
    this.carregarHistorico();
  }

  /**
   * Modifica o veículo ativo
   * @param {string} tipo 
   */
  selecionarVeiculo(tipo) {
    if (this.veiculos[tipo]) {
      this.veiculoAtivo = tipo;
    }
  }

  /**
   * Obtém a tarifa por hora do veículo selecionado
   * @returns {number}
   */
  obterTarifaHora() {
    return this.veiculos[this.veiculoAtivo].tarifaHora;
  }

  /**
   * Insere ou soma um valor ao saldo atual do parquímetro
   * @param {number} valor 
   */
  depositar(valor) {
    if (isNaN(valor) || valor < 0) return;
    this.saldoInserido = Number((this.saldoInserido + valor).toFixed(2));
  }

  /**
   * Define diretamente o saldo atual (por exemplo, quando o usuário digita um valor)
   * @param {number} valor 
   */
  definirSaldo(valor) {
    if (isNaN(valor) || valor < 0) {
      this.saldoInserido = 0;
      return;
    }
    this.saldoInserido = Number(valor.toFixed(2));
  }

  /**
   * Zera o saldo inserido
   */
  limpar() {
    this.saldoInserido = 0;
  }

  /**
   * Realiza os cálculos de tempo e troco com base no veículo ativo e saldo inserido
   * @returns {{ tempo: number, troco: number, erro: string|null }}
   */
  calcular() {
    const tarifaHora = this.obterTarifaHora();
    const tarifaMinuto = tarifaHora / 60;

    if (this.saldoInserido <= 0) {
      return { tempo: 0, troco: 0, erro: 'Deposite um valor para iniciar' };
    }

    // Calcula o valor máximo necessário para o limite de 2 horas (120 minutos)
    const valorMaximoRequerido = Number((tarifaMinuto * this.tempoMaximoMinutos).toFixed(2));

    let tempoCalculado = 0;
    let trocoCalculado = 0;

    if (this.saldoInserido >= valorMaximoRequerido) {
      // Excesso de saldo vira troco e o tempo é limitado a 120 minutos
      tempoCalculado = this.tempoMaximoMinutos;
      trocoCalculado = Number((this.saldoInserido - valorMaximoRequerido).toFixed(2));
    } else {
      // Calcula o tempo exato em minutos inteiros comprados
      tempoCalculado = Math.floor(this.saldoInserido / tarifaMinuto);
      const custoReal = Number((tempoCalculado * tarifaMinuto).toFixed(2));
      trocoCalculado = Number((this.saldoInserido - custoReal).toFixed(2));
    }

    // Valida se atingiu o tempo mínimo de emissão
    let erro = null;
    if (tempoCalculado < this.tempoMinimoMinutos) {
      const valorMinimoRequerido = Number((tarifaMinuto * this.tempoMinimoMinutos).toFixed(2));
      erro = `Valor insuficiente para o tempo mínimo de 15 min (${Utils.formatarBRL(valorMinimoRequerido)})`;
    }

    return {
      tempo: tempoCalculado,
      troco: trocoCalculado,
      erro: erro
    };
  }

  /**
   * Efetua o pagamento, emitindo um ticket e registrando no histórico
   * @returns {Ticket|null} O ticket emitido ou null se houver falha
   */
  emitirTicket() {
    const resultadoCalculo = this.calcular();
    
    if (resultadoCalculo.erro) {
      return null;
    }

    const id = Utils.gerarIdTicket();
    const veiculo = this.veiculoAtivo;
    const tempo = resultadoCalculo.tempo;
    // O valor pago é o saldo inserido menos o troco
    const valorPago = Number((this.saldoInserido - resultadoCalculo.troco).toFixed(2));
    const dataHora = Utils.obterDataHoraFormatada();

    const novoTicket = new Ticket(id, veiculo, valorPago, tempo, dataHora);
    
    this.historico.unshift(novoTicket); // Adiciona no início da lista
    this.salvarHistorico();
    
    // Zera o parquímetro para a próxima transação
    this.limpar();

    return novoTicket;
  }

  /**
   * Salva o histórico de transações no localStorage
   */
  salvarHistorico() {
    try {
      localStorage.setItem('parktronic_historico', JSON.stringify(this.historico));
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
    }
  }

  /**
   * Carrega o histórico de transações do localStorage
   */
  carregarHistorico() {
    try {
      const dados = localStorage.getItem('parktronic_historico');
      if (dados) {
        const parseados = JSON.parse(dados);
        this.historico = parseados.map(t => new Ticket(t.id, t.veiculo, t.valorPago, t.tempoMinutos, t.dataHora));
      }
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
      this.historico = [];
    }
  }

  /**
   * Limpa o histórico de transações
   */
  limparHistorico() {
    this.historico = [];
    this.salvarHistorico();
  }
}
