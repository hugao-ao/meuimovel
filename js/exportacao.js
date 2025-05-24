/**
 * Funções de Exportação para Calculadora de Financiamento Imobiliário
 * Implementação das funções de exportação para PDF e CSV
 */

/**
 * Exporta os resultados do financiamento para PDF
 */
function exportarPDF() {
    // Verificar se há um financiamento calculado
    if (!financiamentoAtual || !financiamentoAtual.parcelas || financiamentoAtual.parcelas.length === 0) {
        alert('Calcule um financiamento antes de exportar para PDF.');
        return;
    }
    
    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações
    const margemEsquerda = 15;
    let posicaoY = 20;
    
    // Título
    doc.setFontSize(16);
    doc.text('Relatório de Financiamento Imobiliário', margemEsquerda, posicaoY);
    posicaoY += 10;
    
    // Data
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margemEsquerda, posicaoY);
    posicaoY += 10;
    
    // Dados do Imóvel
    doc.setFontSize(14);
    doc.text('Dados do Imóvel', margemEsquerda, posicaoY);
    posicaoY += 8;
    
    doc.setFontSize(10);
    doc.text(`Valor do Imóvel: ${formatarMoeda(financiamentoAtual.dados.valorImovel)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Valor da Entrada: ${formatarMoeda(financiamentoAtual.dados.valorEntrada)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Estado do Imóvel: ${traduzirEstadoImovel(financiamentoAtual.dados.estadoImovel)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Localização: ${financiamentoAtual.dados.localizacao}`, margemEsquerda, posicaoY);
    posicaoY += 10;
    
    // Dados do Financiamento
    doc.setFontSize(14);
    doc.text('Dados do Financiamento', margemEsquerda, posicaoY);
    posicaoY += 8;
    
    doc.setFontSize(10);
    doc.text(`Sistema de Amortização: ${traduzirSistema(financiamentoAtual.dados.sistemaAmortizacao)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Sistema de Correção: ${traduzirCorrecao(financiamentoAtual.dados.sistemaCorrecao)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Taxa de Juros: ${formatarPercentual(financiamentoAtual.dados.taxaJuros)} ao ano`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Prazo: ${financiamentoAtual.dados.prazoFinanciamento} meses`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Data de Início: ${formatarData(financiamentoAtual.dados.dataInicio)}`, margemEsquerda, posicaoY);
    posicaoY += 10;
    
    // Resumo do Financiamento
    doc.setFontSize(14);
    doc.text('Resumo do Financiamento', margemEsquerda, posicaoY);
    posicaoY += 8;
    
    doc.setFontSize(10);
    doc.text(`Valor Financiado: ${formatarMoeda(financiamentoAtual.valorFinanciado)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Primeira Prestação: ${formatarMoeda(financiamentoAtual.resumo.primeiraPrestacao)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Total de Juros: ${formatarMoeda(financiamentoAtual.resumo.totalJuros)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Total de Seguros: ${formatarMoeda(financiamentoAtual.resumo.totalSeguros)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Custo Efetivo Total (CET): ${formatarPercentual(financiamentoAtual.resumo.cet)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Comprometimento de Renda: ${formatarPercentual(financiamentoAtual.resumo.comprometimentoRenda)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Valor Final Pago: ${formatarMoeda(financiamentoAtual.resumo.totalPago)}`, margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text(`Prazo Total: ${financiamentoAtual.resumo.prazoTotal} meses`, margemEsquerda, posicaoY);
    posicaoY += 15;
    
    // Tabela de Memória de Cálculo (primeiras parcelas)
    doc.setFontSize(14);
    doc.text('Memória de Cálculo (Primeiras Parcelas)', margemEsquerda, posicaoY);
    posicaoY += 10;
    
    // Definir cabeçalhos e dados para a tabela
    const cabecalhos = [['Parcela', 'Prestação', 'Amortização', 'Juros', 'Saldo Devedor']];
    
    // Selecionar algumas parcelas para a tabela
    const parcelasTabela = financiamentoAtual.parcelas.slice(0, 12);
    const dadosTabela = parcelasTabela.map(parcela => [
        parcela.numero.toString(),
        formatarMoeda(parcela.prestacaoTotal),
        formatarMoeda(parcela.amortizacao),
        formatarMoeda(parcela.juros),
        formatarMoeda(parcela.saldoDevedor)
    ]);
    
    // Adicionar tabela
    doc.autoTable({
        startY: posicaoY,
        head: cabecalhos,
        body: dadosTabela,
        margin: { left: margemEsquerda },
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    posicaoY = doc.lastAutoTable.finalY + 10;
    
    // Adicionar nota
    doc.setFontSize(8);
    doc.text('Nota: Este relatório é uma simulação e não constitui uma proposta formal de financiamento.', margemEsquerda, posicaoY);
    posicaoY += 5;
    doc.text('Consulte uma instituição financeira para obter valores oficiais e condições atualizadas.', margemEsquerda, posicaoY);
    
    // Salvar o PDF
    doc.save('financiamento_imobiliario.pdf');
}

/**
 * Exporta a tabela de memória de cálculo para CSV
 */
function exportarCSV() {
    // Verificar se há um financiamento calculado
    if (!financiamentoAtual || !financiamentoAtual.parcelas || financiamentoAtual.parcelas.length === 0) {
        alert('Calcule um financiamento antes de exportar para CSV.');
        return;
    }
    
    // Cabeçalho do CSV
    let csv = 'Parcela,Data,Prestação,Amortização,Juros,MIP,DFI,Correção,Saldo Devedor\n';
    
    // Adicionar dados
    financiamentoAtual.parcelas.forEach(parcela => {
        csv += `${parcela.numero},`;
        csv += `${parcela.dataVencimento},`;
        csv += `${parcela.prestacaoTotal.toFixed(2)},`;
        csv += `${parcela.amortizacao.toFixed(2)},`;
        csv += `${parcela.juros.toFixed(2)},`;
        csv += `${parcela.mip.toFixed(2)},`;
        csv += `${parcela.dfi.toFixed(2)},`;
        csv += `${(parcela.correcao || 0).toFixed(2)},`;
        csv += `${parcela.saldoDevedor.toFixed(2)}\n`;
    });
    
    // Criar blob com os dados
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Criar URL para o blob
    const url = URL.createObjectURL(blob);
    
    // Criar link para download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'memoria_calculo_financiamento.csv';
    
    // Adicionar link ao documento e clicar
    document.body.appendChild(a);
    a.click();
    
    // Remover link
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Traduz o código do estado do imóvel para texto
 * @param {string} estado - Código do estado
 * @returns {string} - Nome do estado
 */
function traduzirEstadoImovel(estado) {
    switch (estado) {
        case 'novo': return 'Novo';
        case 'usado': return 'Usado';
        case 'construcao': return 'Em Construção';
        default: return estado;
    }
}

/**
 * Traduz o código do sistema de correção para texto
 * @param {string} correcao - Código do sistema de correção
 * @returns {string} - Nome do sistema de correção
 */
function traduzirCorrecao(correcao) {
    switch (correcao) {
        case 'tr': return 'TR';
        case 'ipca': return 'IPCA';
        case 'fixo': return 'Taxa Fixa';
        case 'poupanca': return 'Poupança';
        default: return correcao;
    }
}

// Exportar funções para uso global
window.exportarPDF = exportarPDF;
window.exportarCSV = exportarCSV;
