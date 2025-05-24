// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa tooltips do Bootstrap
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // Adiciona listeners para formatação de inputs
    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('input', formatCurrencyInput);
        input.addEventListener('blur', formatCurrencyInputOnBlur);
    });
    document.querySelectorAll('.percent-input').forEach(input => {
        input.addEventListener('input', formatPercentInput);
        input.addEventListener('blur', formatPercentInputOnBlur);
    });

    // Listener para o botão de calcular
    document.getElementById('calcularBtn').addEventListener('click', calcular);

    // Listener para o botão de resetar
    document.getElementById('resetForm').addEventListener('click', resetarFormulario);

    // Listener para o slider de flexibilidade
    const flexibilidadeSlider = document.getElementById('valorFlexibilidadeMudanca');
    const flexibilidadeDisplay = document.getElementById('valorFlexibilidadeDisplay');
    if (flexibilidadeSlider && flexibilidadeDisplay) {
        flexibilidadeSlider.addEventListener('input', () => {
            flexibilidadeDisplay.textContent = flexibilidadeSlider.value;
        });
    }

    // Listener para botão de imprimir (será implementado)
    // document.getElementById('printResults').addEventListener('click', imprimirResultados);

    // Listener para botão de exportar memória (será implementado)
    // document.getElementById('exportarMemoria').addEventListener('click', exportarMemoriaCalculos);
});

// --- Funções Auxiliares de Formatação e Parsing ---

function parseCurrency(value) {
    if (!value) return 0;
    // Remove 'R$', pontos e substitui vírgula por ponto
    const number = parseFloat(value.replace(/R\$\s?|\./g, '').replace(',', '.'));
    return isNaN(number) ? 0 : number;
}

function parsePercent(value) {
    if (!value) return 0;
    // Remove '%', espaços, pontos e substitui vírgula por ponto, depois divide por 100
    const number = parseFloat(value.replace(/%|\s|\./g, '').replace(',', '.'));
    return isNaN(number) ? 0 : number / 100;
}

function formatCurrency(value) {
    if (isNaN(value) || value === null) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value, decimals = 2) {
    if (isNaN(value) || value === null) return '0,00 %';
    return (value * 100).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' %';
}

function formatNumber(value, decimals = 2) {
    if (isNaN(value) || value === null) return '0,00';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Formatação dinâmica para inputs
function formatCurrencyInput(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (!value) {
        event.target.value = '';
        return;
    }
    value = (parseInt(value, 10) / 100).toFixed(2);
    event.target.value = value.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

function formatCurrencyInputOnBlur(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (!value) {
        event.target.value = '';
        return;
    }
    const number = parseInt(value, 10) / 100;
    event.target.value = formatCurrency(number);
}

function formatPercentInput(event) {
    let value = event.target.value.replace(/[^\d,]/g, '');
    event.target.value = value;
}

function formatPercentInputOnBlur(event) {
    let value = event.target.value;
    if (!value) {
        event.target.value = '';
        return;
    }
    const number = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(number)) {
        event.target.value = formatPercent(number / 100);
    } else {
        event.target.value = '';
    }
}

// --- Memória de Cálculos ---
let memoryLog = [];

function clearMemory() {
    memoryLog = [];
    const memoryLogElement = document.getElementById('memoryLog');
    if (memoryLogElement) {
        memoryLogElement.innerHTML = '';
    }
}

function addToMemory(message, level = 0) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const indentedMessage = '&nbsp;'.repeat(level * 4) + message;
    memoryLog.push(`${timestamp}: ${indentedMessage}`);
    
    const memoryLogElement = document.getElementById('memoryLog');
    if (memoryLogElement) {
        const entry = document.createElement('div');
        entry.classList.add('memory-item');
        entry.innerHTML = `<strong>${timestamp}:</strong> ${indentedMessage}`;
        memoryLogElement.appendChild(entry);
        memoryLogElement.scrollTop = memoryLogElement.scrollHeight; // Auto-scroll
    }
}

// --- Coleta de Inputs ---
function getInputs() {
    addToMemory('Iniciando coleta de dados do formulário.', 0);
    const inputs = {
        // Geral
        valorImovel: parseCurrency(document.getElementById('valorImovel').value),
        areaImovel: parseFloat(document.getElementById('areaImovel').value) || 0,
        idadeComprador: parseInt(document.getElementById('idadeComprador').value) || 35,
        tempoPermanencia: parseInt(document.getElementById('tempoPermanencia').value) || 10,
        inflacaoAnual: parsePercent(document.getElementById('inflacaoAnual').value),
        taxaSelic: parsePercent(document.getElementById('taxaSelic').value),
        localizacao: document.getElementById('localizacao').value,
        
        // Compra à Vista
        valorDisponivel: parseCurrency(document.getElementById('valorDisponivel').value),
        custoOportunidade: parsePercent(document.getElementById('custoOportunidade').value),
        custosEscritura: parseCurrency(document.getElementById('custosEscritura').value),
        valorITBI: parsePercent(document.getElementById('valorITBI').value),
        custosReformaInicial: parseCurrency(document.getElementById('custosReformaInicial').value),
        
        // Financiamento
        valorEntrada: parseCurrency(document.getElementById('valorEntrada').value),
        rendaMensal: parseCurrency(document.getElementById('rendaMensal').value),
        percentualComprometimento: parsePercent(document.getElementById('percentualComprometimento').value),
        taxaJurosFinanciamento: parsePercent(document.getElementById('taxaJurosFinanciamento').value),
        sistemaAmortizacao: document.getElementById('sistemaAmortizacao').value,
        prazoFinanciamento: parseInt(document.getElementById('prazoFinanciamento').value) * 12 || 360, // Em meses
        custosAvaliacao: parseCurrency(document.getElementById('custosAvaliacao').value),
        taxaAdministracao: parseCurrency(document.getElementById('taxaAdministracao').value),
        seguroMIP: parsePercent(document.getElementById('seguroMIP').value),
        seguroDFI: parsePercent(document.getElementById('seguroDFI').value),
        
        // Consórcio
        valorCartaCredito: parseCurrency(document.getElementById('valorCartaCredito').value),
        taxaAdministracaoConsorcio: parsePercent(document.getElementById('taxaAdministracaoConsorcio').value),
        prazoConsorcio: parseInt(document.getElementById('prazoConsorcio').value) * 12 || 120, // Em meses
        valorLanceInicial: parseCurrency(document.getElementById('valorLanceInicial').value),
        fundoReserva: parsePercent(document.getElementById('fundoReserva').value),
        seguroPrestamista: parsePercent(document.getElementById('seguroPrestamista').value),
        tempoMedioContemplacao: parseInt(document.getElementById('tempoMedioContemplacao').value) || 48, // Em meses
        
        // Aluguel
        valorAluguelAtual: parseCurrency(document.getElementById('valorAluguelAtual').value),
        taxaReajusteAluguel: parsePercent(document.getElementById('taxaReajusteAluguel').value),
        depositoCaucao: parseCurrency(document.getElementById('depositoCaucao').value),
        custoSeguroFianca: parseCurrency(document.getElementById('custoSeguroFianca').value),
        taxaAdministracaoImobiliaria: parsePercent(document.getElementById('taxaAdministracaoImobiliaria').value),
        valorFlexibilidadeMudanca: parseInt(document.getElementById('valorFlexibilidadeMudanca').value) || 5,
        
        // Investimentos
        rentabilidadeRendaFixa: parsePercent(document.getElementById('rentabilidadeRendaFixa').value),
        rentabilidadeRendaVariavel: parsePercent(document.getElementById('rentabilidadeRendaVariavel').value),
        rentabilidadeFundosImobiliarios: parsePercent(document.getElementById('rentabilidadeFundosImobiliarios').value),
        perfilRisco: document.getElementById('perfilRisco').value,
        taxaValorizacaoImovel: parsePercent(document.getElementById('taxaValorizacaoImovel').value),
        
        // Custos de Propriedade
        valorIPTU: parseCurrency(document.getElementById('valorIPTU').value),
        valorCondominio: parseCurrency(document.getElementById('valorCondominio').value),
        custosManutenção: parsePercent(document.getElementById('custosManutenção').value),
        valorSeguroImovel: parseCurrency(document.getElementById('valorSeguroImovel').value),
        custosMobilia: parseCurrency(document.getElementById('custosMobilia').value),
    };

    // Validações básicas
    if (!inputs.valorImovel || inputs.valorImovel <= 0) {
        alert('Por favor, insira um valor válido para o imóvel.');
        return null;
    }
    if (!inputs.tempoPermanencia || inputs.tempoPermanencia <= 0) {
        alert('Por favor, insira um tempo de permanência válido.');
        return null;
    }
    if (!inputs.valorAluguelAtual || inputs.valorAluguelAtual <= 0) {
        alert('Por favor, insira um valor de aluguel válido.');
        return null;
    }

    addToMemory('Dados coletados com sucesso.', 1);
    // Log dos inputs para depuração (opcional)
    // console.log('Inputs Coletados:', inputs);
    // addToMemory(`Valores de entrada: ${JSON.stringify(inputs, null, 2)}`, 2);
    return inputs;
}

// --- Lógica de Cálculo Principal ---
function calcular() {
    clearMemory();
    addToMemory('Iniciando processo de cálculo e análise.', 0);

    const inputs = getInputs();
    if (!inputs) {
        addToMemory('Erro na coleta de dados. Cálculo interrompido.', 0);
        return; // Interrompe se a validação falhar
    }

    // Oculta resultados anteriores e mostra spinner (opcional)
    document.getElementById('resultadosContainer').style.display = 'none';
    // Adicionar spinner aqui se desejado

    addToMemory('Calculando cenário: Aluguel.', 1);
    const resultadosAluguel = calculateAluguel(inputs);
    addToMemory('Cálculo do Aluguel concluído.', 1);

    addToMemory('Calculando cenário: Compra à Vista.', 1);
    const resultadosCompraVista = calculateCompraVista(inputs);
    addToMemory('Cálculo da Compra à Vista concluído.', 1);

    addToMemory('Calculando cenário: Financiamento.', 1);
    const resultadosFinanciamento = calculateFinanciamento(inputs);
    addToMemory('Cálculo do Financiamento concluído.', 1);

    addToMemory('Calculando cenário: Consórcio.', 1);
    const resultadosConsorcio = calculateConsorcio(inputs);
    addToMemory('Cálculo do Consórcio concluído.', 1);

    const todosResultados = {
        aluguel: resultadosAluguel,
        compraVista: resultadosCompraVista,
        financiamento: resultadosFinanciamento,
        consorcio: resultadosConsorcio
    };

    addToMemory('Todos os cenários calculados. Iniciando exibição dos resultados.', 0);

    // Exibir resultados (funções a serem implementadas nas próximas etapas)
    exibirResumo(todosResultados, inputs);
    exibirDetalhes(todosResultados, inputs);
    gerarGraficos(todosResultados, inputs); // Função a ser implementada
    gerarAnaliseConclusiva(todosResultados, inputs); // Função a ser implementada

    // Exibe a seção de resultados
    document.getElementById('resultadosContainer').style.display = 'block';
    addToMemory('Resultados exibidos.', 0);
    
    // Rola a página para a seção de resultados
    document.getElementById('resultadosContainer').scrollIntoView({ behavior: 'smooth' });
}

// --- Funções de Cálculo por Cenário (Implementação Detalhada) ---

function calculateAluguel(inputs) {
    addToMemory('Iniciando cálculo do Aluguel.', 2);
    const { tempoPermanencia, valorAluguelAtual, taxaReajusteAluguel, depositoCaucao, custoSeguroFianca, taxaAdministracaoImobiliaria, inflacaoAnual, custoOportunidade, valorDisponivel, valorImovel } = inputs;
    const meses = tempoPermanencia * 12;
    let custoTotalAluguel = 0;
    let aluguelMensalAtual = valorAluguelAtual;
    let custosMensais = [];
    let patrimonioInvestido = valorDisponivel || valorImovel; // Assume que o valor do imóvel seria investido
    let patrimonioFinal = patrimonioInvestido;
    let custoOportunidadeCaucao = 0;

    addToMemory(`Período de análise: ${tempoPermanencia} anos (${meses} meses).`, 3);
    addToMemory(`Aluguel inicial: ${formatCurrency(valorAluguelAtual)}.`, 3);
    addToMemory(`Taxa de reajuste anual do aluguel: ${formatPercent(taxaReajusteAluguel)}.`, 3);
    addToMemory(`Depósito caução: ${formatCurrency(depositoCaucao)}.`, 3);
    addToMemory(`Custo anual seguro fiança: ${formatCurrency(custoSeguroFianca)}.`, 3);
    addToMemory(`Taxa adm. imobiliária: ${formatPercent(taxaAdministracaoImobiliaria)}.`, 3);
    addToMemory(`Valor inicial para investimento (simulado): ${formatCurrency(patrimonioInvestido)}.`, 3);
    addToMemory(`Custo de oportunidade (rentabilidade): ${formatPercent(custoOportunidade)}.`, 3);

    // Custo de oportunidade do depósito caução
    if (depositoCaucao > 0) {
        custoOportunidadeCaucao = depositoCaucao * (Math.pow(1 + custoOportunidade, tempoPermanencia) - 1);
        addToMemory(`Custo de oportunidade do depósito caução (não devolvido rendimento): ${formatCurrency(custoOportunidadeCaucao)}.`, 3);
        custoTotalAluguel += custoOportunidadeCaucao; // Adiciona ao custo total
    }

    const taxaMensalOportunidade = Math.pow(1 + custoOportunidade, 1/12) - 1;

    for (let mes = 1; mes <= meses; mes++) {
        let custoMes = aluguelMensalAtual;
        
        // Custo mensal da administração imobiliária
        const custoAdm = aluguelMensalAtual * taxaAdministracaoImobiliaria;
        custoMes += custoAdm;
        
        // Custo mensal do seguro fiança
        const custoSeguro = custoSeguroFianca / 12;
        custoMes += custoSeguro;
        
        custoTotalAluguel += custoMes;
        custosMensais.push(custoMes);

        // Simula o rendimento do valor que seria usado na compra
        patrimonioFinal *= (1 + taxaMensalOportunidade);
        // Subtrai o custo do aluguel do patrimônio (simulando que sairia do rendimento/principal)
        patrimonioFinal -= custoMes; 

        // Reajuste anual do aluguel (no início de cada ano, exceto o primeiro)
        if (mes % 12 === 0 && mes < meses) {
            const aluguelAnterior = aluguelMensalAtual;
            aluguelMensalAtual *= (1 + taxaReajusteAluguel);
            addToMemory(`Mês ${mes}: Reajuste do aluguel de ${formatCurrency(aluguelAnterior)} para ${formatCurrency(aluguelMensalAtual)}.`, 4);
        }
    }

    // Adiciona o depósito caução de volta ao patrimônio no final (se houver)
    patrimonioFinal += depositoCaucao;

    const custoMensalMedio = custoTotalAluguel / meses;

    addToMemory(`Custo total do aluguel no período: ${formatCurrency(custoTotalAluguel)}.`, 3);
    addToMemory(`Custo mensal médio do aluguel: ${formatCurrency(custoMensalMedio)}.`, 3);
    addToMemory(`Patrimônio final estimado (investindo o valor do imóvel): ${formatCurrency(patrimonioFinal)}.`, 3);

    return {
        nome: 'Aluguel',
        custoTotal: custoTotalAluguel,
        custoMensalMedio: custoMensalMedio,
        patrimonioFinal: patrimonioFinal,
        fluxoCaixaMensal: custosMensais.map(c => -c), // Negativo pois é saída
        detalhes: {
            custoOportunidadeCaucao: custoOportunidadeCaucao,
            custoTotalAluguelDireto: custoTotalAluguel - custoOportunidadeCaucao
        }
    };
}

function calculateCompraVista(inputs) {
    addToMemory('Iniciando cálculo da Compra à Vista.', 2);
    const { tempoPermanencia, valorImovel, custoOportunidade, custosEscritura, valorITBI, custosReformaInicial, valorIPTU, valorCondominio, custosManutenção, valorSeguroImovel, custosMobilia, taxaValorizacaoImovel, inflacaoAnual } = inputs;
    const meses = tempoPermanencia * 12;
    let custoTotalCompra = 0;
    let custosMensais = [];
    let valorImovelAtualizado = valorImovel;

    // Custos Iniciais
    const custoITBI = valorImovel * valorITBI;
    const custoInicialTotal = valorImovel + custosEscritura + custoITBI + custosReformaInicial + custosMobilia;
    addToMemory(`Custo inicial total: ${formatCurrency(custoInicialTotal)} (Imóvel: ${formatCurrency(valorImovel)} + Escritura/Reg.: ${formatCurrency(custosEscritura)} + ITBI: ${formatCurrency(custoITBI)} + Reforma: ${formatCurrency(custosReformaInicial)} + Mobília: ${formatCurrency(custosMobilia)})`, 3);
    custoTotalCompra += custoInicialTotal;

    // Custo de Oportunidade do Capital Inicial
    const custoOportunidadeTotal = custoInicialTotal * (Math.pow(1 + custoOportunidade, tempoPermanencia) - 1);
    addToMemory(`Custo de oportunidade do capital inicial (${formatCurrency(custoInicialTotal)} @ ${formatPercent(custoOportunidade)} a.a. por ${tempoPermanencia} anos): ${formatCurrency(custoOportunidadeTotal)}.`, 3);
    custoTotalCompra += custoOportunidadeTotal;

    // Custos Recorrentes Mensais e Anuais
    const taxaMensalInflacao = Math.pow(1 + inflacaoAnual, 1/12) - 1;
    let iptuMensal = valorIPTU / 12;
    let condominioMensal = valorCondominio;
    let manutencaoMensal = (valorImovel * custosManutenção) / 12;
    let seguroMensal = valorSeguroImovel / 12;

    addToMemory(`Custos recorrentes mensais iniciais: IPTU=${formatCurrency(iptuMensal)}, Condomínio=${formatCurrency(condominioMensal)}, Manutenção=${formatCurrency(manutencaoMensal)}, Seguro=${formatCurrency(seguroMensal)}`, 3);

    for (let mes = 1; mes <= meses; mes++) {
        const custoRecorrenteMes = iptuMensal + condominioMensal + manutencaoMensal + seguroMensal;
        custoTotalCompra += custoRecorrenteMes;
        custosMensais.push(custoRecorrenteMes);

        // Atualiza custos pela inflação mensalmente (simplificado)
        iptuMensal *= (1 + taxaMensalInflacao);
        condominioMensal *= (1 + taxaMensalInflacao);
        manutencaoMensal = (valorImovelAtualizado * custosManutenção) / 12 * (1 + taxaMensalInflacao); // Manutenção baseada no valor atualizado
        seguroMensal *= (1 + taxaMensalInflacao);
        
        // Atualiza valor do imóvel anualmente
        if (mes % 12 === 0) {
            valorImovelAtualizado *= (1 + taxaValorizacaoImovel);
        }
    }
    
    // Valorização do imóvel no período
    const valorFinalImovel = valorImovel * Math.pow(1 + taxaValorizacaoImovel, tempoPermanencia);
    const ganhoValorizacao = valorFinalImovel - valorImovel;
    addToMemory(`Valorização estimada do imóvel em ${tempoPermanencia} anos: ${formatCurrency(ganhoValorizacao)} (Valor final: ${formatCurrency(valorFinalImovel)}).`, 3);

    // Patrimônio Final = Valor final do imóvel
    const patrimonioFinal = valorFinalImovel;
    const custoMensalMedio = custoTotalCompra / meses;

    addToMemory(`Custo total da Compra à Vista no período (incluindo custo de oportunidade): ${formatCurrency(custoTotalCompra)}.`, 3);
    addToMemory(`Custo mensal médio da Compra à Vista: ${formatCurrency(custoMensalMedio)}.`, 3);
    addToMemory(`Patrimônio final estimado (valor do imóvel): ${formatCurrency(patrimonioFinal)}.`, 3);

    return {
        nome: 'Compra à Vista',
        custoTotal: custoTotalCompra,
        custoMensalMedio: custoMensalMedio,
        patrimonioFinal: patrimonioFinal,
        fluxoCaixaMensal: custosMensais.map(c => -c), // Negativo pois é saída
        detalhes: {
            custoInicialTotal: custoInicialTotal,
            custoOportunidadeTotal: custoOportunidadeTotal,
            custosRecorrentesTotal: custoTotalCompra - custoInicialTotal - custoOportunidadeTotal,
            valorFinalImovel: valorFinalImovel
        }
    };
}

function calculateFinanciamento(inputs) {
    addToMemory('Iniciando cálculo do Financiamento.', 2);
    const { tempoPermanencia, valorImovel, valorEntrada, taxaJurosFinanciamento, prazoFinanciamento, sistemaAmortizacao, custosEscritura, valorITBI, custosReformaInicial, custosAvaliacao, taxaAdministracao, seguroMIP, seguroDFI, valorIPTU, valorCondominio, custosManutenção, valorSeguroImovel, custosMobilia, taxaValorizacaoImovel, inflacaoAnual, custoOportunidade } = inputs;
    
    const mesesAnalise = tempoPermanencia * 12;
    const valorFinanciado = valorImovel - valorEntrada;
    
    if (valorFinanciado <= 0) {
        addToMemory('Valor da entrada é maior ou igual ao valor do imóvel. Cenário inválido para financiamento.', 3);
        return { nome: 'Financiamento', custoTotal: Infinity, custoMensalMedio: Infinity, patrimonioFinal: 0, fluxoCaixaMensal: [], detalhes: {} };
    }

    addToMemory(`Valor financiado: ${formatCurrency(valorFinanciado)} (${formatCurrency(valorImovel)} - ${formatCurrency(valorEntrada)}).`, 3);
    addToMemory(`Prazo do financiamento: ${prazoFinanciamento} meses.`, 3);
    addToMemory(`Taxa de juros anual: ${formatPercent(taxaJurosFinanciamento)}.`, 3);
    addToMemory(`Sistema de amortização: ${sistemaAmortizacao.toUpperCase()}.`, 3);

    const taxaJurosMensal = Math.pow(1 + taxaJurosFinanciamento, 1/12) - 1;
    let custoTotalFinanciamento = 0;
    let custosMensais = [];
    let saldoDevedor = valorFinanciado;
    let valorImovelAtualizado = valorImovel;
    let amortizacaoAcumulada = 0;
    let jurosTotalPago = 0;
    let segurosTotalPago = 0;
    let taxasTotalPago = 0;

    // Custos Iniciais
    const custoITBI = valorImovel * valorITBI;
    const custoInicialTotal = valorEntrada + custosEscritura + custoITBI + custosReformaInicial + custosMobilia + custosAvaliacao;
    addToMemory(`Custo inicial total: ${formatCurrency(custoInicialTotal)} (Entrada: ${formatCurrency(valorEntrada)} + Escritura/Reg.: ${formatCurrency(custosEscritura)} + ITBI: ${formatCurrency(custoITBI)} + Reforma: ${formatCurrency(custosReformaInicial)} + Mobília: ${formatCurrency(custosMobilia)} + Avaliação: ${formatCurrency(custosAvaliacao)})`, 3);
    custoTotalFinanciamento += custoInicialTotal;

    // Custo de Oportunidade do Capital Inicial (Entrada + Custos)
    const custoOportunidadeInicial = custoInicialTotal * (Math.pow(1 + custoOportunidade, tempoPermanencia) - 1);
    addToMemory(`Custo de oportunidade do capital inicial (${formatCurrency(custoInicialTotal)} @ ${formatPercent(custoOportunidade)} a.a.): ${formatCurrency(custoOportunidadeInicial)}.`, 3);
    custoTotalFinanciamento += custoOportunidadeInicial;

    // Custos Recorrentes Mensais e Anuais (Propriedade)
    const taxaMensalInflacao = Math.pow(1 + inflacaoAnual, 1/12) - 1;
    let iptuMensal = valorIPTU / 12;
    let condominioMensal = valorCondominio;
    let manutencaoMensal = (valorImovel * custosManutenção) / 12;
    let seguroImovelMensal = valorSeguroImovel / 12;
    let custosPropriedadeTotal = 0;

    addToMemory(`Custos recorrentes mensais iniciais (propriedade): IPTU=${formatCurrency(iptuMensal)}, Condomínio=${formatCurrency(condominioMensal)}, Manutenção=${formatCurrency(manutencaoMensal)}, Seguro=${formatCurrency(seguroImovelMensal)}`, 3);

    // Cálculo das Prestações e Custos do Financiamento
    for (let mes = 1; mes <= mesesAnalise; mes++) {
        let prestacaoBase = 0;
        let jurosMes = 0;
        let amortizacaoMes = 0;

        if (saldoDevedor > 0.01) { // Continua cálculo enquanto houver saldo devedor
            jurosMes = saldoDevedor * taxaJurosMensal;
            
            if (sistemaAmortizacao === 'sac') {
                amortizacaoMes = valorFinanciado / prazoFinanciamento;
                // Ajusta última amortização para zerar saldo
                if (saldoDevedor < amortizacaoMes) {
                    amortizacaoMes = saldoDevedor;
                }
                prestacaoBase = amortizacaoMes + jurosMes;
            } else { // Price
                const fator = Math.pow(1 + taxaJurosMensal, prazoFinanciamento - (mes - 1)); // Recalcula prazo restante
                prestacaoBase = saldoDevedor * (taxaJurosMensal * fator) / (fator - 1);
                // Ajusta última prestação para zerar saldo
                if (mes === prazoFinanciamento) {
                    prestacaoBase = saldoDevedor + jurosMes;
                }
                amortizacaoMes = prestacaoBase - jurosMes;
                if (amortizacaoMes < 0) amortizacaoMes = 0; // Evita amortização negativa
                 if (saldoDevedor < amortizacaoMes) {
                    amortizacaoMes = saldoDevedor;
                    prestacaoBase = amortizacaoMes + jurosMes;
                }
            }

            // Seguros (calculados sobre saldo devedor e valor do imóvel)
            const seguroMIPMes = saldoDevedor * (seguroMIP / 12);
            const seguroDFIMes = valorImovel * (seguroDFI / 12); // DFI sobre valor original
            const segurosMes = seguroMIPMes + seguroDFIMes;
            
            const taxaAdmMes = taxaAdministracao;
            const prestacaoTotalMes = prestacaoBase + segurosMes + taxaAdmMes;

            // Atualiza totais
            jurosTotalPago += jurosMes;
            segurosTotalPago += segurosMes;
            taxasTotalPago += taxaAdmMes;
            amortizacaoAcumulada += amortizacaoMes;
            saldoDevedor -= amortizacaoMes;
            if (saldoDevedor < 0.01) saldoDevedor = 0; // Zera se muito pequeno

            custoTotalFinanciamento += prestacaoTotalMes;
            custosMensais.push(prestacaoTotalMes); // Adiciona prestação do financiamento

            // Log a cada ano (opcional)
            // if (mes % 12 === 0) {
            //     addToMemory(`Mês ${mes}: Prestação=${formatCurrency(prestacaoTotalMes)}, Juros=${formatCurrency(jurosMes)}, Amortização=${formatCurrency(amortizacaoMes)}, Saldo Devedor=${formatCurrency(saldoDevedor)}`, 4);
            // }

        } else {
             custosMensais.push(0); // Sem prestação após quitar
        }

        // Adiciona custos de propriedade
        const custoPropriedadeMes = iptuMensal + condominioMensal + manutencaoMensal + seguroImovelMensal;
        custoTotalFinanciamento += custoPropriedadeMes;
        custosPropriedadeTotal += custoPropriedadeMes;
        custosMensais[custosMensais.length - 1] += custoPropriedadeMes; // Adiciona ao custo total do mês

        // Atualiza custos de propriedade pela inflação
        iptuMensal *= (1 + taxaMensalInflacao);
        condominioMensal *= (1 + taxaMensalInflacao);
        manutencaoMensal = (valorImovelAtualizado * custosManutenção) / 12 * (1 + taxaMensalInflacao);
        seguroImovelMensal *= (1 + taxaMensalInflacao);

        // Atualiza valor do imóvel anualmente
        if (mes % 12 === 0) {
            valorImovelAtualizado *= (1 + taxaValorizacaoImovel);
        }
    }

    // Valor final do imóvel
    const valorFinalImovel = valorImovel * Math.pow(1 + taxaValorizacaoImovel, tempoPermanencia);
    addToMemory(`Valorização estimada do imóvel em ${tempoPermanencia} anos: ${formatCurrency(valorFinalImovel - valorImovel)} (Valor final: ${formatCurrency(valorFinalImovel)}).`, 3);

    // Patrimônio Final = Valor final do imóvel - Saldo Devedor restante
    const patrimonioFinal = valorFinalImovel - saldoDevedor;
    const custoMensalMedio = custoTotalFinanciamento / mesesAnalise;

    addToMemory(`Custo total do Financiamento no período (incluindo custo de oportunidade da entrada): ${formatCurrency(custoTotalFinanciamento)}.`, 3);
    addToMemory(`Custo mensal médio do Financiamento: ${formatCurrency(custoMensalMedio)}.`, 3);
    addToMemory(`Patrimônio final estimado (valor do imóvel - saldo devedor): ${formatCurrency(patrimonioFinal)}.`, 3);
    addToMemory(`Total de juros pagos no período: ${formatCurrency(jurosTotalPago)}.`, 3);
    addToMemory(`Total de seguros e taxas pagos no período: ${formatCurrency(segurosTotalPago + taxasTotalPago)}.`, 3);
    addToMemory(`Saldo devedor ao final de ${tempoPermanencia} anos: ${formatCurrency(saldoDevedor)}.`, 3);

    return {
        nome: 'Financiamento',
        custoTotal: custoTotalFinanciamento,
        custoMensalMedio: custoMensalMedio,
        patrimonioFinal: patrimonioFinal,
        fluxoCaixaMensal: custosMensais.map(c => -c),
        detalhes: {
            custoInicialTotal: custoInicialTotal,
            custoOportunidadeInicial: custoOportunidadeInicial,
            jurosTotalPago: jurosTotalPago,
            segurosTotalPago: segurosTotalPago,
            taxasTotalPago: taxasTotalPago,
            custosPropriedadeTotal: custosPropriedadeTotal,
            valorFinalImovel: valorFinalImovel,
            saldoDevedorFinal: saldoDevedor,
            amortizacaoTotal: amortizacaoAcumulada
        }
    };
}

function calculateConsorcio(inputs) {
    addToMemory('Iniciando cálculo do Consórcio.', 2);
    const { tempoPermanencia, valorImovel, valorCartaCredito, taxaAdministracaoConsorcio, prazoConsorcio, valorLanceInicial, fundoReserva, seguroPrestamista, tempoMedioContemplacao, custosEscritura, valorITBI, custosReformaInicial, custosMobilia, valorIPTU, valorCondominio, custosManutenção, valorSeguroImovel, taxaValorizacaoImovel, inflacaoAnual, custoOportunidade } = inputs;

    const mesesAnalise = tempoPermanencia * 12;
    const cartaCredito = valorCartaCredito || valorImovel; // Usa valor do imóvel se não especificado
    
    if (cartaCredito <= 0) {
         addToMemory('Valor da carta de crédito inválido.', 3);
        return { nome: 'Consórcio', custoTotal: Infinity, custoMensalMedio: Infinity, patrimonioFinal: 0, fluxoCaixaMensal: [], detalhes: {} };
    }

    addToMemory(`Valor da carta de crédito: ${formatCurrency(cartaCredito)}.`, 3);
    addToMemory(`Prazo do consórcio: ${prazoConsorcio} meses.`, 3);
    addToMemory(`Taxa de administração total: ${formatPercent(taxaAdministracaoConsorcio)}.`, 3);
    addToMemory(`Tempo médio para contemplação: ${tempoMedioContemplacao} meses.`, 3);
    addToMemory(`Valor do lance inicial: ${formatCurrency(valorLanceInicial)}.`, 3);

    const taxaAdmTotal = cartaCredito * taxaAdministracaoConsorcio;
    const fundoReservaTotal = cartaCredito * fundoReserva;
    const seguroPrestamistaTotal = cartaCredito * seguroPrestamista;
    const valorTotalPagoConsorcio = cartaCredito + taxaAdmTotal + fundoReservaTotal + seguroPrestamistaTotal;
    const parcelaBaseMensal = valorTotalPagoConsorcio / prazoConsorcio;

    addToMemory(`Valor total a pagar no consórcio (sem correção): ${formatCurrency(valorTotalPagoConsorcio)}.`, 3);
    addToMemory(`Parcela base mensal (sem correção): ${formatCurrency(parcelaBaseMensal)}.`, 3);

    let custoTotalConsorcio = 0;
    let custosMensais = [];
    let patrimonioInvestido = valorLanceInicial; // Dinheiro que poderia estar rendendo
    let valorImovelAtualizado = valorImovel;
    let foiContemplado = false;
    let mesContemplacao = Math.min(tempoMedioContemplacao, prazoConsorcio, mesesAnalise); // Contempla no máximo no fim do período
    let custosPropriedadeTotal = 0;
    let custoOportunidadeTotal = 0;
    let valorPagoConsorcioPeriodo = 0;

    // Custo de Oportunidade do Lance Inicial (se houver)
    if (valorLanceInicial > 0) {
        const custoOportunidadeLance = valorLanceInicial * (Math.pow(1 + custoOportunidade, tempoPermanencia) - 1);
        addToMemory(`Custo de oportunidade do lance inicial (${formatCurrency(valorLanceInicial)} @ ${formatPercent(custoOportunidade)} a.a.): ${formatCurrency(custoOportunidadeLance)}.`, 3);
        custoTotalConsorcio += custoOportunidadeLance;
        custoOportunidadeTotal += custoOportunidadeLance;
    }

    // Custos Iniciais (pagos na contemplação)
    const custoITBI = cartaCredito * valorITBI; // ITBI sobre a carta
    const custosIniciaisPosContemplacao = custosEscritura + custoITBI + custosReformaInicial + custosMobilia;
    addToMemory(`Custos iniciais pagos na contemplação: ${formatCurrency(custosIniciaisPosContemplacao)} (Escritura/Reg.: ${formatCurrency(custosEscritura)} + ITBI: ${formatCurrency(custoITBI)} + Reforma: ${formatCurrency(custosReformaInicial)} + Mobília: ${formatCurrency(custosMobilia)})`, 3);

    // Custos Recorrentes Mensais e Anuais (Propriedade - após contemplação)
    const taxaMensalInflacao = Math.pow(1 + inflacaoAnual, 1/12) - 1;
    let iptuMensal = valorIPTU / 12;
    let condominioMensal = valorCondominio;
    let manutencaoMensal = (valorImovel * custosManutenção) / 12;
    let seguroImovelMensal = valorSeguroImovel / 12;

    const taxaMensalOportunidade = Math.pow(1 + custoOportunidade, 1/12) - 1;

    for (let mes = 1; mes <= mesesAnalise; mes++) {
        let custoMes = 0;
        let custoOportunidadeMes = 0;

        // Pagamento da parcela do consórcio (até o fim do prazo do consórcio)
        if (mes <= prazoConsorcio) {
            // Simulação de correção da parcela (simplificada, usando inflação)
            // Uma abordagem mais precisa usaria o índice do contrato (ex: INCC)
            const parcelaCorrigida = parcelaBaseMensal * Math.pow(1 + inflacaoAnual, Math.floor((mes - 1) / 12));
            custoMes += parcelaCorrigida;
            valorPagoConsorcioPeriodo += parcelaCorrigida;
            
            // Custo de oportunidade da parcela paga
            // Calcula quanto essa parcela renderia até o final do período de análise
            const mesesRestantesAnalise = mesesAnalise - mes;
            custoOportunidadeMes = parcelaCorrigida * (Math.pow(1 + taxaMensalOportunidade, mesesRestantesAnalise) -1);
            custoTotalConsorcio += custoOportunidadeMes; // Adiciona custo de oportunidade da parcela
            custoOportunidadeTotal += custoOportunidadeMes;
        }

        // Contemplação
        if (mes === mesContemplacao && !foiContemplado) {
            foiContemplado = true;
            addToMemory(`Mês ${mes}: Contemplação simulada. Pagamento dos custos iniciais (${formatCurrency(custosIniciaisPosContemplacao)}).`, 4);
            custoMes += custosIniciaisPosContemplacao;
            
            // Custo de oportunidade desses custos iniciais
            const mesesRestantesAposContemplacao = mesesAnalise - mes;
            const custoOportunidadeIniciaisPos = custosIniciaisPosContemplacao * (Math.pow(1 + taxaMensalOportunidade, mesesRestantesAposContemplacao) - 1);
            custoTotalConsorcio += custoOportunidadeIniciaisPos;
            custoOportunidadeTotal += custoOportunidadeIniciaisPos;
            
            // Se usou lance, adiciona ao custo do mês
            if(valorLanceInicial > 0) {
                 addToMemory(`Mês ${mes}: Utilização do lance inicial (${formatCurrency(valorLanceInicial)}).`, 4);
                 custoMes += valorLanceInicial; // Adiciona o lance ao fluxo de caixa do mês
                 // O custo de oportunidade do lance já foi contabilizado no início.
            }
        }

        // Custos de propriedade (após contemplação)
        if (foiContemplado) {
            const custoPropriedadeMes = iptuMensal + condominioMensal + manutencaoMensal + seguroImovelMensal;
            custoMes += custoPropriedadeMes;
            custosPropriedadeTotal += custoPropriedadeMes;

            // Custo de oportunidade dos custos de propriedade
            const mesesRestantesProp = mesesAnalise - mes;
            const custoOportunidadePropMes = custoPropriedadeMes * (Math.pow(1 + taxaMensalOportunidade, mesesRestantesProp) - 1);
            custoTotalConsorcio += custoOportunidadePropMes;
            custoOportunidadeTotal += custoOportunidadePropMes;

            // Atualiza custos de propriedade pela inflação
            iptuMensal *= (1 + taxaMensalInflacao);
            condominioMensal *= (1 + taxaMensalInflacao);
            manutencaoMensal = (valorImovelAtualizado * custosManutenção) / 12 * (1 + taxaMensalInflacao);
            seguroImovelMensal *= (1 + taxaMensalInflacao);
        }
        
        custoTotalConsorcio += custoMes; // Adiciona o custo direto do mês
        custosMensais.push(custoMes);

        // Atualiza valor do imóvel anualmente (após contemplação)
        if (foiContemplado && mes % 12 === 0) {
            valorImovelAtualizado *= (1 + taxaValorizacaoImovel);
        }
    }

    // Patrimônio Final
    let patrimonioFinal = 0;
    if (foiContemplado) {
        const valorFinalImovel = valorImovel * Math.pow(1 + taxaValorizacaoImovel, (mesesAnalise - mesContemplacao) / 12);
        patrimonioFinal = valorFinalImovel;
        addToMemory(`Valor final estimado do imóvel (adquirido no mês ${mesContemplacao}): ${formatCurrency(valorFinalImovel)}.`, 3);
    } else {
        // Se não foi contemplado, o patrimônio é o valor pago + rendimento (simplificado)
        // Uma análise mais complexa consideraria o rendimento do dinheiro não gasto
        patrimonioFinal = 0; // Considera-se que não adquiriu o bem
        addToMemory(`Não houve contemplação dentro do período de análise (${tempoPermanencia} anos). Patrimônio imobiliário final = 0.`, 3);
    }

    const custoMensalMedio = custoTotalConsorcio / mesesAnalise;

    addToMemory(`Custo total do Consórcio no período (incluindo custos de oportunidade): ${formatCurrency(custoTotalConsorcio)}.`, 3);
    addToMemory(`Custo mensal médio do Consórcio: ${formatCurrency(custoMensalMedio)}.`, 3);
    addToMemory(`Patrimônio final estimado: ${formatCurrency(patrimonioFinal)}.`, 3);
    addToMemory(`Total de parcelas pagas no período: ${formatCurrency(valorPagoConsorcioPeriodo)}.`, 3);
    addToMemory(`Total de custos de oportunidade calculados: ${formatCurrency(custoOportunidadeTotal)}.`, 3);

    return {
        nome: 'Consórcio',
        custoTotal: custoTotalConsorcio,
        custoMensalMedio: custoMensalMedio,
        patrimonioFinal: patrimonioFinal,
        fluxoCaixaMensal: custosMensais.map(c => -c),
        detalhes: {
            valorPagoConsorcioPeriodo: valorPagoConsorcioPeriodo,
            custosIniciaisPosContemplacao: foiContemplado ? custosIniciaisPosContemplacao : 0,
            custosPropriedadeTotal: custosPropriedadeTotal,
            custoOportunidadeTotal: custoOportunidadeTotal,
            valorFinalImovel: patrimonioFinal, // Patrimônio é o imóvel se contemplado
            foiContemplado: foiContemplado,
            mesContemplacao: mesContemplacao
        }
    };
}

// --- Funções de Exibição (Estrutura Básica) ---

function exibirResumo(resultados, inputs) {
    addToMemory('Iniciando exibição do resumo.', 2);
    const tabela = document.getElementById('tabelaComparativa');
    tabela.innerHTML = ''; // Limpa tabela anterior

    const opcoes = Object.values(resultados).sort((a, b) => a.custoTotal - b.custoTotal);
    const melhorOpcao = opcoes[0];

    document.getElementById('melhorOpcao').textContent = `${melhorOpcao.nome}`;
    document.getElementById('resumoMelhorOpcao').innerHTML = 
        `Com um custo total estimado de <strong>${formatCurrency(melhorOpcao.custoTotal)}</strong> 
         e um custo mensal médio de <strong>${formatCurrency(melhorOpcao.custoMensalMedio)}</strong> 
         ao longo de ${inputs.tempoPermanencia} anos, esta parece ser a opção mais vantajosa financeiramente neste cenário. 
         O patrimônio final estimado para esta opção é de <strong>${formatCurrency(melhorOpcao.patrimonioFinal)}</strong>.`;

    opcoes.forEach((opcao, index) => {
        const row = tabela.insertRow();
        row.innerHTML = `
            <td>${opcao.nome} ${index === 0 ? '<span class="best-option">Melhor</span>' : ''}</td>
            <td>${formatCurrency(opcao.custoTotal)}</td>
            <td>${formatCurrency(opcao.custoMensalMedio)}</td>
            <td>${formatCurrency(opcao.patrimonioFinal)}</td>
            <td>${calcularROI(opcao, inputs)}</td> 
        `;
        if (index === 0) {
            row.classList.add('table-success');
        }
    });
    addToMemory('Tabela de resumo preenchida.', 3);
}

function exibirDetalhes(resultados, inputs) {
    addToMemory('Iniciando exibição dos detalhes por modalidade.', 2);
    
    // Detalhes Compra Vista
    const detalhesVista = document.getElementById('detalhesCompraVista');
    const resVista = resultados.compraVista;
    detalhesVista.innerHTML = `
        <p><strong>Custo Inicial Total:</strong> ${formatCurrency(resVista.detalhes.custoInicialTotal)}</p>
        <p><strong>Custo de Oportunidade (Capital Inicial):</strong> ${formatCurrency(resVista.detalhes.custoOportunidadeTotal)}</p>
        <p><strong>Custos Recorrentes Totais (IPTU, Cond., Manut., Seguro):</strong> ${formatCurrency(resVista.detalhes.custosRecorrentesTotal)}</p>
        <p><strong>Valor Final Estimado do Imóvel:</strong> ${formatCurrency(resVista.detalhes.valorFinalImovel)}</p>
        <hr>
        <p><strong>Custo Total no Período:</strong> ${formatCurrency(resVista.custoTotal)}</p>
        <p><strong>Patrimônio Líquido Final:</strong> ${formatCurrency(resVista.patrimonioFinal)}</p>
    `;

    // Detalhes Financiamento
    const detalhesFin = document.getElementById('detalhesFinanciamento');
    const resFin = resultados.financiamento;
    if (resFin.custoTotal !== Infinity) {
        detalhesFin.innerHTML = `
            <p><strong>Custo Inicial Total (Entrada + Taxas):</strong> ${formatCurrency(resFin.detalhes.custoInicialTotal)}</p>
            <p><strong>Custo de Oportunidade (Capital Inicial):</strong> ${formatCurrency(resFin.detalhes.custoOportunidadeInicial)}</p>
            <p><strong>Total de Juros Pagos no Período:</strong> ${formatCurrency(resFin.detalhes.jurosTotalPago)}</p>
            <p><strong>Total de Seguros Pagos no Período:</strong> ${formatCurrency(resFin.detalhes.segurosTotalPago)}</p>
            <p><strong>Total de Taxas Adm. Pagas no Período:</strong> ${formatCurrency(resFin.detalhes.taxasTotalPago)}</p>
            <p><strong>Custos Recorrentes Totais (Propriedade):</strong> ${formatCurrency(resFin.detalhes.custosPropriedadeTotal)}</p>
            <p><strong>Valor Final Estimado do Imóvel:</strong> ${formatCurrency(resFin.detalhes.valorFinalImovel)}</p>
            <p><strong>Saldo Devedor ao Final do Período:</strong> ${formatCurrency(resFin.detalhes.saldoDevedorFinal)}</p>
            <p><strong>Total Amortizado no Período:</strong> ${formatCurrency(resFin.detalhes.amortizacaoTotal)}</p>
            <hr>
            <p><strong>Custo Total no Período:</strong> ${formatCurrency(resFin.custoTotal)}</p>
            <p><strong>Patrimônio Líquido Final (Imóvel - Saldo Devedor):</strong> ${formatCurrency(resFin.patrimonioFinal)}</p>
        `;
    } else {
         detalhesFin.innerHTML = `<p class="text-danger">Cálculo inválido (Entrada >= Valor do Imóvel).</p>`;
    }

    // Detalhes Consórcio
    const detalhesCons = document.getElementById('detalhesConsorcio');
    const resCons = resultados.consorcio;
     if (resCons.custoTotal !== Infinity) {
        detalhesCons.innerHTML = `
            <p><strong>Contemplação Simulada no Mês:</strong> ${resCons.detalhes.foiContemplado ? resCons.detalhes.mesContemplacao : 'Não ocorreu no período'}</p>
            <p><strong>Custo de Oportunidade Total (Lance + Parcelas + Custos):</strong> ${formatCurrency(resCons.detalhes.custoOportunidadeTotal)}</p>
            <p><strong>Total de Parcelas Pagas no Período:</strong> ${formatCurrency(resCons.detalhes.valorPagoConsorcioPeriodo)}</p>
            <p><strong>Custos Iniciais (Pós-Contemplação):</strong> ${formatCurrency(resCons.detalhes.custosIniciaisPosContemplacao)}</p>
            <p><strong>Custos Recorrentes Totais (Propriedade, Pós-Contemplação):</strong> ${formatCurrency(resCons.detalhes.custosPropriedadeTotal)}</p>
            <p><strong>Valor Final Estimado do Imóvel (se contemplado):</strong> ${formatCurrency(resCons.detalhes.valorFinalImovel)}</p>
            <hr>
            <p><strong>Custo Total no Período:</strong> ${formatCurrency(resCons.custoTotal)}</p>
            <p><strong>Patrimônio Líquido Final:</strong> ${formatCurrency(resCons.patrimonioFinal)}</p>
        `;
    } else {
         detalhesCons.innerHTML = `<p class="text-danger">Cálculo inválido (Valor da Carta de Crédito zerado).</p>`;
    }

    // Detalhes Aluguel
    const detalhesAluguel = document.getElementById('detalhesAluguel');
    const resAluguel = resultados.aluguel;
    detalhesAluguel.innerHTML = `
        <p><strong>Custo Total Direto com Aluguel (sem custo oportunidade):</strong> ${formatCurrency(resAluguel.detalhes.custoTotalAluguelDireto)}</p>
        <p><strong>Custo de Oportunidade (Depósito Caução):</strong> ${formatCurrency(resAluguel.detalhes.custoOportunidadeCaucao)}</p>
        <hr>
        <p><strong>Custo Total no Período:</strong> ${formatCurrency(resAluguel.custoTotal)}</p>
        <p><strong>Patrimônio Líquido Final (Simulando investimento do valor do imóvel):</strong> ${formatCurrency(resAluguel.patrimonioFinal)}</p>
    `;
    addToMemory('Detalhes por modalidade preenchidos.', 3);
}

function calcularROI(opcao, inputs) {
    // ROI = (Patrimônio Final - Investimento Inicial) / Investimento Inicial
    // Simplificação: Considera o 'custo total' como proxy do investimento total ao longo do tempo.
    // Uma métrica mais precisa seria a TIR (Taxa Interna de Retorno), mas é mais complexa.
    
    let investimentoInicial = 0;
    switch(opcao.nome) {
        case 'Compra à Vista':
            investimentoInicial = opcao.detalhes.custoInicialTotal;
            break;
        case 'Financiamento':
             investimentoInicial = opcao.detalhes.custoInicialTotal; // Entrada + custos
            break;
        case 'Consórcio':
            // Considera o lance + custos iniciais se contemplado no início
            investimentoInicial = inputs.valorLanceInicial + (opcao.detalhes.foiContemplado && opcao.detalhes.mesContemplacao === 1 ? opcao.detalhes.custosIniciaisPosContemplacao : 0);
            break;
        case 'Aluguel':
             investimentoInicial = inputs.valorDisponivel || inputs.valorImovel; // O que foi investido
            break;
    }

    if (investimentoInicial <= 0 && opcao.patrimonioFinal <= 0) return 'N/A';
    if (investimentoInicial <= 0 && opcao.patrimonioFinal > 0) return '∞'; // Ganho sobre zero investimento?
    
    // Usando Custo Total como proxy do investimento total ao longo do tempo (simplificação)
    const custoReal = opcao.custoTotal - (opcao.detalhes?.custoOportunidadeTotal || opcao.detalhes?.custoOportunidadeInicial || opcao.detalhes?.custoOportunidadeCaucao || 0);
    if (custoReal <= 0) return 'N/A';

    const roi = (opcao.patrimonioFinal - custoReal) / custoReal;
    
    return formatPercent(roi);
}

// --- Funções de Gráficos (Estrutura - Implementação na próxima etapa) ---
let charts = {}; // Armazena instâncias dos gráficos para destruí-las antes de recriar

function destroyCharts() {
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    charts = {};
}

function gerarGraficos(resultados, inputs) {
    addToMemory('Iniciando geração de gráficos.', 2);
    destroyCharts(); // Destroi gráficos anteriores
    
    const ctxCustosTotais = document.getElementById('custosTotaisChart').getContext('2d');
    const ctxPatrimonio = document.getElementById('patrimonioChart').getContext('2d');
    const ctxComposicao = document.getElementById('composicaoCustosChart').getContext('2d');
    const ctxFluxoCaixa = document.getElementById('fluxoCaixaChart').getContext('2d');

    const labels = Object.keys(resultados);
    const custosTotaisData = labels.map(key => resultados[key].custoTotal === Infinity ? 0 : resultados[key].custoTotal);
    const patrimonioData = labels.map(key => resultados[key].patrimonioFinal);

    // Gráfico 1: Custos Totais Comparativos
    charts.custosTotais = new Chart(ctxCustosTotais, {
        type: 'bar',
        data: {
            labels: labels.map(l => resultados[l].nome),
            datasets: [{
                label: 'Custo Total Estimado (R$)',
                data: custosTotaisData,
                backgroundColor: ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71'],
                borderColor: ['#2980b9', '#c0392b', '#f39c12', '#27ae60'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
    addToMemory('Gráfico de Custos Totais gerado.', 3);

    // Gráfico 2: Patrimônio Final Comparativo
    charts.patrimonio = new Chart(ctxPatrimonio, {
        type: 'bar',
        data: {
            labels: labels.map(l => resultados[l].nome),
            datasets: [{
                label: 'Patrimônio Líquido Final Estimado (R$)',
                data: patrimonioData,
                backgroundColor: ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71'],
                borderColor: ['#2980b9', '#c0392b', '#f39c12', '#27ae60'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
             plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
     addToMemory('Gráfico de Patrimônio Final gerado.', 3);

    // Gráfico 3: Composição de Custos (Exemplo: Financiamento)
    const resFin = resultados.financiamento;
    if (resFin.custoTotal !== Infinity) {
        const composicaoLabels = ['Juros', 'Seguros/Taxas', 'Custos Propriedade', 'Custo Oportunidade Entrada'];
        const composicaoData = [
            resFin.detalhes.jurosTotalPago,
            resFin.detalhes.segurosTotalPago + resFin.detalhes.taxasTotalPago,
            resFin.detalhes.custosPropriedadeTotal,
            resFin.detalhes.custoOportunidadeInicial
        ];
        charts.composicao = new Chart(ctxComposicao, {
            type: 'pie',
            data: {
                labels: composicaoLabels,
                datasets: [{
                    label: 'Composição Custos Financiamento (R$)',
                    data: composicaoData,
                    backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#9b59b6'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += formatCurrency(context.parsed);
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
         addToMemory('Gráfico de Composição de Custos (Financiamento) gerado.', 3);
    } else {
         addToMemory('Gráfico de Composição de Custos (Financiamento) não gerado (cálculo inválido).', 3);
    }

    // Gráfico 4: Fluxo de Caixa Mensal Comparativo (Simplificado - Primeiros 5 anos)
    const mesesGrafico = Math.min(inputs.tempoPermanencia * 12, 60); // Limita a 5 anos ou menos
    const labelsFluxo = Array.from({ length: mesesGrafico }, (_, i) => `Mês ${i + 1}`);
    const datasetsFluxo = Object.keys(resultados).map((key, index) => {
        const cores = ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71'];
        return {
            label: resultados[key].nome,
            data: resultados[key].fluxoCaixaMensal.slice(0, mesesGrafico),
            borderColor: cores[index],
            tension: 0.1,
            fill: false
        };
    });

    charts.fluxoCaixa = new Chart(ctxFluxoCaixa, {
        type: 'line',
        data: {
            labels: labelsFluxo,
            datasets: datasetsFluxo
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                             let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    addToMemory('Gráfico de Fluxo de Caixa gerado.', 3);
}

// --- Análise Conclusiva (Estrutura - Implementação na próxima etapa) ---
function gerarAnaliseConclusiva(resultados, inputs) {
    addToMemory('Iniciando geração da análise conclusiva.', 2);
    const analiseDiv = document.getElementById('analiseCompleta');
    const opcoes = Object.values(resultados).sort((a, b) => a.custoTotal - b.custoTotal);
    const melhorOpcao = opcoes[0];
    const segundaOpcao = opcoes[1];

    let textoAnalise = `<p>Considerando um período de <strong>${inputs.tempoPermanencia} anos</strong> e os dados fornecidos, a análise financeira indica que a opção <strong>${melhorOpcao.nome}</strong> apresenta o menor custo total estimado (${formatCurrency(melhorOpcao.custoTotal)}).</p>`;

    textoAnalise += `<p>Comparativamente, a segunda opção mais econômica seria <strong>${segundaOpcao.nome}</strong>, com um custo total de ${formatCurrency(segundaOpcao.custoTotal)}, uma diferença de ${formatCurrency(segundaOpcao.custoTotal - melhorOpcao.custoTotal)} em relação à melhor opção.</p>`;

    // Análise de Patrimônio
    const opcaoMaiorPatrimonio = Object.values(resultados).sort((a, b) => b.patrimonioFinal - a.patrimonioFinal)[0];
    textoAnalise += `<p>Em termos de patrimônio líquido ao final do período, a opção <strong>${opcaoMaiorPatrimonio.nome}</strong> resulta no maior valor (${formatCurrency(opcaoMaiorPatrimonio.patrimonioFinal)}). É importante ponderar se o maior patrimônio justifica um custo total potencialmente maior.</p>`;

    // Considerações Adicionais
    textoAnalise += `<h5>Considerações Adicionais:</h5><ul>`;
    if (melhorOpcao.nome === 'Aluguel') {
        textoAnalise += `<li>Optar pelo aluguel oferece maior <strong>flexibilidade</strong> (avaliada em ${inputs.valorFlexibilidadeMudanca}/10 por você), mas não gera patrimônio imobiliário direto. O patrimônio final calculado assume que a diferença de custos ou o valor do imóvel foi investido com rentabilidade de ${formatPercent(inputs.custoOportunidade)}.</li>`;
    }
    if (melhorOpcao.nome.includes('Compra') || melhorOpcao.nome === 'Financiamento' || melhorOpcao.nome === 'Consórcio') {
         textoAnalise += `<li>A compra do imóvel proporciona <strong>estabilidade</strong> e potencial de <strong>valorização</strong> (estimada em ${formatPercent(inputs.taxaValorizacaoImovel)} a.a.), mas envolve custos iniciais significativos e menor liquidez.</li>`;
    }
    if (melhorOpcao.nome === 'Financiamento') {
        textoAnalise += `<li>O financiamento permite a aquisição com capital inicial menor, mas implica no pagamento de <strong>juros</strong> (${formatCurrency(resultados.financiamento.detalhes.jurosTotalPago)} no período) e outros custos associados.</li>`;
    }
     if (melhorOpcao.nome === 'Consórcio') {
        textoAnalise += `<li>O consórcio pode ter custos administrativos menores que os juros do financiamento, mas envolve a <strong>incerteza da contemplação</strong> (simulada no mês ${resultados.consorcio.detalhes.mesContemplacao}) e correções nas parcelas.</li>`;
    }
    textoAnalise += `<li>Fatores como <strong>inflação</strong> (${formatPercent(inputs.inflacaoAnual)} a.a.) e <strong>custo de oportunidade</strong> (${formatPercent(inputs.custoOportunidade)} a.a.) impactam significativamente os resultados a longo prazo.</li>`;
    textoAnalise += `</ul>`;

    textoAnalise += `<p class="mt-3"><strong>Recomendação:</strong> Avalie os resultados financeiros em conjunto com seus objetivos pessoais, perfil de risco e necessidade de flexibilidade ou estabilidade. Esta análise é uma ferramenta de apoio e não substitui o aconselhamento financeiro profissional.</p>`;

    analiseDiv.innerHTML = textoAnalise;
    addToMemory('Análise conclusiva gerada.', 3);
}

// --- Funções Adicionais (Reset, etc.) ---
function resetarFormulario() {
    if (confirm('Tem certeza que deseja limpar todos os campos do formulário?')) {
        document.getElementById('calculadoraForm').reset();
        // Limpa manualmente campos formatados que o reset pode não limpar corretamente
        document.querySelectorAll('.currency-input, .percent-input').forEach(input => input.value = '');
        // Reseta slider
        const flexibilidadeSlider = document.getElementById('valorFlexibilidadeMudanca');
        const flexibilidadeDisplay = document.getElementById('valorFlexibilidadeDisplay');
        if (flexibilidadeSlider && flexibilidadeDisplay) {
            flexibilidadeSlider.value = 5;
            flexibilidadeDisplay.textContent = '5';
        }
        // Oculta resultados
        document.getElementById('resultadosContainer').style.display = 'none';
        clearMemory();
        destroyCharts();
        addToMemory('Formulário resetado.', 0);
    }
}

// --- Funções Futuras (Impressão, Exportação) ---
function imprimirResultados() {
    // Lógica para preparar e imprimir a seção de resultados
    alert('Funcionalidade de impressão ainda não implementada.');
}

function exportarMemoriaCalculos() {
    // Lógica para gerar um arquivo .txt ou .csv com o memoryLog
    if (memoryLog.length === 0) {
        alert('Memória de cálculos está vazia.');
        return;
    }
    
    const content = memoryLog.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'memoria_calculos_imovel.txt';
    link.click();
    URL.revokeObjectURL(link.href);
    addToMemory('Memória de cálculos exportada.', 0);
}

// Adiciona listener para exportar memória
document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportarMemoria');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarMemoriaCalculos);
    }
});
