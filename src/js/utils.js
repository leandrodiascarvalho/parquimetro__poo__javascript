/**
 * Utilitários auxiliares para o Parquímetro
 */
const Utils = {
  /**
   * Formata um valor numérico para o padrão de moeda brasileiro (BRL)
   * @param {number} valor 
   * @returns {string}
   */
  formatarBRL(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  },

  /**
   * Formata a duração em minutos para exibição legível
   * @param {number} minutos 
   * @returns {string}
   */
  formatarTempo(minutos) {
    if (minutos < 60) {
      return `${minutos} min`;
    }
    const horas = Math.floor(minutos / 60);
    const minRestantes = minutos % 60;
    return minRestantes > 0 ? `${horas}h ${minRestantes}min` : `${horas}h`;
  },

  /**
   * Obtém a data e hora atuais formatadas (DD/MM/AAAA às HH:MM:SS)
   * @returns {string}
   */
  obterDataHoraFormatada() {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toLocaleTimeString('pt-BR');
    return `${data} ${hora}`;
  },

  /**
   * Gera um código de identificação único para transações/tickets
   * @returns {string}
   */
  gerarIdTicket() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '#';
    for (let i = 0; i < 6; i++) {
      id += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return id;
  },

  /**
   * Inicializa um relógio em tempo real no elemento especificado
   * @param {HTMLElement} elemento 
   */
  iniciarRelogio(elemento) {
    if (!elemento) return;
    const atualizar = () => {
      const agora = new Date();
      elemento.textContent = agora.toLocaleTimeString('pt-BR');
    };
    atualizar();
    setInterval(atualizar, 1000);
  }
};
