/**
 * Calculadora de Financiamento Imobiliário
 * Implementação das funções de cálculo para todos os sistemas de amortização
 */

// Objeto global para armazenar os dados do financiamento atual
let financiamentoAtual = {
    parcelas: [],
    resumo: {}
};

/**
 * Função principal para calcular o financiamento
 * @param {Object} dados - Objeto com todos os dados do formulário
 * @returns {Object} - Objeto com os resultados do cálculo
 */
function calcularFinanciamento(dados) {
    // 1. Calcular valor financiado
    let valorFinanciado = calcularValorFinanciado(dados);
    
    // 2. Aplicar subsídios se for programa governamental
    if (dados.programaGoverno !== 'nenhum') {
        const subsidio = calcularSubsidioMCMV(dados.rendaFamiliar, dados.valorImovel, dados.programaGoverno);
        valorFinanciado -= subsidio;
    }
    
    // 3. Calcular parcelas conforme sistema de amortização
    let parcelas;
    if (dados.sistemaAmortizacao === 'sac') {
        parcelas = calcularSAC(valorFinanciado, dados.taxaJuros, dados.prazoFinanciamento);
    } else if (dados.sistemaAmortizacao === 'price') {
        parcelas = calcularPrice(valorFinanciado, dados.taxaJuros, dados.prazoFinanciamento);
    } else if (dados.sistemaAmortizacao === 'sacre') {
        parcelas = calcularSACRE(valorFinanciado, dados.taxaJuros, dados.prazoFinanciamento);
    }
    
    // 4. Aplicar correção monetária se necessário
    if (dados.sistemaCorrecao !== 'fixo') {
        parcelas = aplicarCorrecaoMonetaria(parcelas, valorFinanciado, dados.sistemaCorrecao);
    }
    
    // 5. Adicionar seguros às parcelas
    parcelas = adicionarSeguros(parcelas, valorFinanciado, dados.valorImovel, dados.taxaMIP, dados.taxaDFI);
    
    // 6. Adicionar datas de vencimento
    parcelas = adicionarDatasVencimento(parcelas, dados.dataInicio);
    
    // 7. Calcular totais e resumo
    const resumo = calcularResumo(parcelas, valorFinanciado, dados);
    
    // 8. Armazenar resultado no objeto global
    financiamentoAtual = {
        dados: dados,
        valorFinanciado: valorFinanciado,
        parcelas: parcelas,
        resumo: resumo
    };
    
    return financiamentoAtual;
}

/**
 * Calcula o valor a ser financiado
 * @param {Object} dados - Dados do financiamento
 * @returns {number} - Valor a ser financiado
 */
function calcularValorFinanciado(dados) {
    let valorFinanciado = dados.valorImovel - dados.valorEntrada;
    
    // Subtrair FGTS se for utilizado
    if (dados.usarFgts === 'sim' && dados.valorFgts > 0) {
        valorFinanciado -= dados.valorFgts;
    }
    
    return Math.max(0, valorFinanciado);
}

/**
 * Calcula financiamento pelo Sistema de Amortização Constante (SAC)
 * @param {number} valorFinanciado - Valor a ser financiado
 * @param {number} taxaJurosAnual - Taxa de juros anual (%)
 * @param {number} prazoTotal - Prazo total em meses
 * @returns {Array} - Array de objetos com os dados de cada parcela
 */
function calcularSAC(valorFinanciado, taxaJurosAnual, prazoTotal) {
    const amortizacaoMensal = valorFinanciado / prazoTotal;
    let saldoDevedor = valorFinanciado;
    const parcelas = [];
    
    for (let i = 1; i <= prazoTotal; i++) {
        const juros = saldoDevedor * (taxaJurosAnual / 100 / 12);
        const prestacao = amortizacaoMensal + juros;
        
        parcelas.push({
            numero: i,
            prestacao: prestacao,
            amortizacao: amortizacaoMensal,
            juros: juros,
            saldoDevedor: saldoDevedor - amortizacaoMensal,
            correcao: 0
        });
        
        saldoDevedor -= amortizacaoMensal;
    }
    
    return parcelas;
}

/**
 * Calcula financiamento pelo Sistema Francês (Tabela Price)
 * @param {number} valorFinanciado - Valor a ser financiado
 * @param {number} taxaJurosAnual - Taxa de juros anual (%)
 * @param {number} prazoTotal - Prazo total em meses
 * @returns {Array} - Array de objetos com os dados de cada parcela
 */
function calcularPrice(valorFinanciado, taxaJurosAnual, prazoTotal) {
    const taxaMensal = taxaJurosAnual / 100 / 12;
    const prestacao = valorFinanciado * (taxaMensal * Math.pow(1 + taxaMensal, prazoTotal)) / (Math.pow(1 + taxaMensal, prazoTotal) - 1);
    
    let saldoDevedor = valorFinanciado;
    const parcelas = [];
    
    for (let i = 1; i <= prazoTotal; i++) {
        const juros = saldoDevedor * taxaMensal;
        const amortizacao = prestacao - juros;
        
        parcelas.push({
            numero: i,
            prestacao: prestacao,
            amortizacao: amortizacao,
            juros: juros,
            saldoDevedor: saldoDevedor - amortizacao,
            correcao: 0
        });
        
        saldoDevedor -= amortizacao;
    }
    
    return parcelas;
}

/**
 * Calcula financiamento pelo Sistema de Amortização Crescente (SACRE)
 * @param {number} valorFinanciado - Valor a ser financiado
 * @param {number} taxaJurosAnual - Taxa de juros anual (%)
 * @param {number} prazoTotal - Prazo total em meses
 * @returns {Array} - Array de objetos com os dados de cada parcela
 */
function calcularSACRE(valorFinanciado, taxaJurosAnual, prazoTotal) {
    let amortizacao = valorFinanciado / prazoTotal;
    const taxaCrescimento = 0.005; // 0.5% de crescimento mensal
    let saldoDevedor = valorFinanciado;
    const parcelas = [];
    
    for (let i = 1; i <= prazoTotal; i++) {
        const juros = saldoDevedor * (taxaJurosAnual / 100 / 12);
        const prestacao = amortizacao + juros;
        
        parcelas.push({
            numero: i,
            prestacao: prestacao,
            amortizacao: amortizacao,
            juros: juros,
            saldoDevedor: saldoDevedor - amortizacao,
            correcao: 0
        });
        
        saldoDevedor -= amortizacao;
        amortizacao *= (1 + taxaCrescimento);
    }
    
    return parcelas;
}

/**
 * Aplica correção monetária ao saldo devedor
 * @param {Array} parcelas - Array de parcelas calculadas
 * @param {number} valorFinanciado - Valor financiado inicial
 * @param {string} tipoCorrecao - Tipo de correção (tr, ipca, poupanca)
 * @returns {Array} - Array de parcelas com correção aplicada
 */
function aplicarCorrecaoMonetaria(parcelas, valorFinanciado, tipoCorrecao) {
    // Obter taxas de correção estimadas (valores fictícios para simulação)
    const taxasCorrecao = obterTaxasCorrecao(tipoCorrecao, parcelas.length);
    
    let saldoDevedor = valorFinanciado;
    const parcelasCorrigidas = [];
    
    for (let i = 0; i < parcelas.length; i++) {
        const parcela = parcelas[i];
        
        // Aplicar correção ao saldo devedor
        const correcao = saldoDevedor * (taxasCorrecao[i] / 100);
        saldoDevedor += correcao;
        
        // Recalcular valores com base no sistema de amortização
        let novaAmortizacao, novaPrestacao;
        
        if (i === 0 || parcelas[0].prestacao === parcelas[1].prestacao) {
            // Sistema Price - manter prestação constante
            const taxaMensal = parcela.juros / (saldoDevedor - correcao);
            const prazoRestante = parcelas.length - i;
            novaPrestacao = saldoDevedor * (taxaMensal * Math.pow(1 + taxaMensal, prazoRestante)) / (Math.pow(1 + taxaMensal, prazoRestante) - 1);
            novaAmortizacao = novaPrestacao - (saldoDevedor * taxaMensal);
        } else if (parcelas[0].amortizacao === parcelas[1].amortizacao) {
            // Sistema SAC - manter amortização constante
            novaAmortizacao = saldoDevedor / (parcelas.length - i);
            const juros = saldoDevedor * (parcela.juros / (parcela.saldoDevedor + parcela.amortizacao));
            novaPrestacao = novaAmortizacao + juros;
        } else {
            // Sistema SACRE - amortização crescente
            novaAmortizacao = parcela.amortizacao * (1 + correcao / saldoDevedor);
            const juros = saldoDevedor * (parcela.juros / (parcela.saldoDevedor + parcela.amortizacao));
            novaPrestacao = novaAmortizacao + juros;
        }
        
        parcelasCorrigidas.push({
            numero: parcela.numero,
            prestacao: novaPrestacao,
            amortizacao: novaAmortizacao,
            juros: saldoDevedor * (parcela.juros / (parcela.saldoDevedor + parcela.amortizacao)),
            saldoDevedor: saldoDevedor - novaAmortizacao,
            correcao: correcao
        });
        
        saldoDevedor -= novaAmortizacao;
    }
    
    return parcelasCorrigidas;
}

/**
 * Obtém taxas de correção estimadas para o período do financiamento
 * @param {string} tipoCorrecao - Tipo de correção (tr, ipca, poupanca)
 * @param {number} numParcelas - Número de parcelas
 * @returns {Array} - Array com taxas mensais estimadas
 */
function obterTaxasCorrecao(tipoCorrecao, numParcelas) {
    const taxas = [];
    
    // Valores fictícios para simulação
    let taxaBase;
    switch (tipoCorrecao) {
        case 'tr':
            taxaBase = 0.08; // 0,08% ao mês
            break;
        case 'ipca':
            taxaBase = 0.38; // 0,38% ao mês (aproximadamente 4,5% ao ano)
            break;
        case 'poupanca':
            taxaBase = 0.22; // 0,22% ao mês
            break;
        default:
            taxaBase = 0;
    }
    
    // Gerar taxas com pequena variação para simular flutuação
    for (let i = 0; i < numParcelas; i++) {
        const variacao = (Math.random() * 0.1) - 0.05; // Variação de -0,05% a +0,05%
        taxas.push(Math.max(0, taxaBase + variacao));
    }
    
    return taxas;
}

/**
 * Adiciona seguros MIP e DFI às parcelas
 * @param {Array} parcelas - Array de parcelas calculadas
 * @param {number} valorFinanciado - Valor financiado inicial
 * @param {number} valorImovel - Valor do imóvel
 * @param {number} taxaMIPAnual - Taxa anual do seguro MIP (%)
 * @param {number} taxaDFIAnual - Taxa anual do seguro DFI (%)
 * @returns {Array} - Array de parcelas com seguros adicionados
 */
function adicionarSeguros(parcelas, valorFinanciado, valorImovel, taxaMIPAnual, taxaDFIAnual) {
    return parcelas.map((parcela, index) => {
        const saldoDevedorAtual = index === 0 ? valorFinanciado : parcelas[index - 1].saldoDevedor;
        const mip = calcularMIP(saldoDevedorAtual, taxaMIPAnual);
        const dfi = calcularDFI(valorImovel, taxaDFIAnual);
        
        return {
            ...parcela,
            mip: mip,
            dfi: dfi,
            prestacaoTotal: parcela.prestacao + mip + dfi
        };
    });
}

/**
 * Calcula o seguro MIP (Morte e Invalidez Permanente)
 * @param {number} saldoDevedor - Saldo devedor atual
 * @param {number} taxaMIPAnual - Taxa anual do seguro MIP (%)
 * @returns {number} - Valor mensal do seguro MIP
 */
function calcularMIP(saldoDevedor, taxaMIPAnual) {
    return saldoDevedor * (taxaMIPAnual / 100 / 12);
}

/**
 * Calcula o seguro DFI (Danos Físicos ao Imóvel)
 * @param {number} valorImovel - Valor do imóvel
 * @param {number} taxaDFIAnual - Taxa anual do seguro DFI (%)
 * @returns {number} - Valor mensal do seguro DFI
 */
function calcularDFI(valorImovel, taxaDFIAnual) {
    return valorImovel * (taxaDFIAnual / 100 / 12);
}

/**
 * Adiciona datas de vencimento às parcelas
 * @param {Array} parcelas - Array de parcelas calculadas
 * @param {string} dataInicio - Data de início do financiamento (formato YYYY-MM-DD)
 * @returns {Array} - Array de parcelas com datas de vencimento
 */
function adicionarDatasVencimento(parcelas, dataInicio) {
    const dataInicioObj = new Date(dataInicio);
    
    return parcelas.map((parcela, index) => {
        const dataVencimento = new Date(dataInicioObj);
        dataVencimento.setMonth(dataInicioObj.getMonth() + index);
        
        return {
            ...parcela,
            dataVencimento: dataVencimento.toISOString().split('T')[0]
        };
    });
}

/**
 * Calcula o resumo do financiamento
 * @param {Array} parcelas - Array de parcelas calculadas
 * @param {number} valorFinanciado - Valor financiado
 * @param {Object} dados - Dados do financiamento
 * @returns {Object} - Objeto com o resumo do financiamento
 */
function calcularResumo(parcelas, valorFinanciado, dados) {
    const totalJuros = parcelas.reduce((sum, parcela) => sum + parcela.juros, 0);
    const totalAmortizacao = parcelas.reduce((sum, parcela) => sum + parcela.amortizacao, 0);
    const totalSeguros = parcelas.reduce((sum, parcela) => sum + parcela.mip + parcela.dfi, 0);
    const totalCorrecao = parcelas.reduce((sum, parcela) => sum + (parcela.correcao || 0), 0);
    const totalPago = totalAmortizacao + totalJuros + totalSeguros + totalCorrecao;
    
    // Calcular CET
    const fluxoCaixa = [-valorFinanciado, ...parcelas.map(p => p.prestacaoTotal)];
    const cet = calcularCET(valorFinanciado, fluxoCaixa);
    
    // Calcular comprometimento de renda
    const comprometimentoRenda = calcularComprometimentoRenda(parcelas[0].prestacaoTotal, dados.rendaFamiliar);
    
    return {
        primeiraPrestacao: parcelas[0].prestacaoTotal,
        ultimaPrestacao: parcelas[parcelas.length - 1].prestacaoTotal,
        totalJuros: totalJuros,
        totalAmortizacao: totalAmortizacao,
        totalSeguros: totalSeguros,
        totalCorrecao: totalCorrecao,
        totalPago: totalPago,
        cet: cet,
        comprometimentoRenda: comprometimentoRenda,
        prazoTotal: parcelas.length
    };
}

/**
 * Calcula o Custo Efetivo Total (CET)
 * @param {number} valorFinanciado - Valor financiado
 * @param {Array} fluxoCaixa - Array com o fluxo de caixa (primeiro valor negativo, demais positivos)
 * @returns {number} - CET anual em percentual
 */
function calcularCET(valorFinanciado, fluxoCaixa) {
    // Implementação da TIR (Taxa Interna de Retorno)
    
    // Função auxiliar para calcular o Valor Presente Líquido (VPL)
    function calcularVPL(taxa, fluxos) {
        let vpn = fluxos[0]; // Valor inicial (negativo)
        
        for (let i = 1; i < fluxos.length; i++) {
            vpn += fluxos[i] / Math.pow(1 + taxa, i);
        }
        
        return vpn;
    }
    
    // Método da bisseção para encontrar a TIR
    let taxaInferior = 0;
    let taxaSuperior = 1;
    let taxaMedia;
    let vpn;
    const precisao = 0.0001;
    const maxIteracoes = 100;
    
    // Verificar se o fluxo de caixa tem pelo menos uma mudança de sinal
    let vpnInferior = calcularVPL(taxaInferior, fluxoCaixa);
    let vpnSuperior = calcularVPL(taxaSuperior, fluxoCaixa);
    
    if (vpnInferior * vpnSuperior > 0) {
        // Não há mudança de sinal, ajustar intervalo
        taxaSuperior = 2;
        while (calcularVPL(taxaSuperior, fluxoCaixa) * vpnInferior > 0 && taxaSuperior < 100) {
            taxaSuperior *= 2;
        }
        
        vpnSuperior = calcularVPL(taxaSuperior, fluxoCaixa);
        if (vpnInferior * vpnSuperior > 0) {
            return null; // Não foi possível encontrar a TIR
        }
    }
    
    // Aplicar o método da bisseção
    for (let i = 0; i < maxIteracoes; i++) {
        taxaMedia = (taxaInferior + taxaSuperior) / 2;
        vpn = calcularVPL(taxaMedia, fluxoCaixa);
        
        if (Math.abs(vpn) < precisao) {
            break;
        }
        
        if (vpn * vpnInferior < 0) {
            taxaSuperior = taxaMedia;
            vpnSuperior = vpn;
        } else {
            taxaInferior = taxaMedia;
            vpnInferior = vpn;
        }
    }
    
    // Converter para percentual anual
    return (Math.pow(1 + taxaMedia, 12) - 1) * 100;
}

/**
 * Calcula o comprometimento de renda
 * @param {number} valorPrestacao - Valor da prestação
 * @param {number} rendaFamiliar - Renda familiar mensal
 * @returns {number} - Percentual de comprometimento da renda
 */
function calcularComprometimentoRenda(valorPrestacao, rendaFamiliar) {
    if (!rendaFamiliar || rendaFamiliar <= 0) {
        return 0;
    }
    return (valorPrestacao / rendaFamiliar) * 100;
}

/**
 * Calcula subsídio do programa Minha Casa Minha Vida
 * @param {number} rendaFamiliar - Renda familiar mensal
 * @param {number} valorImovel - Valor do imóvel
 * @param {string} faixa - Faixa do programa (mcmv1, mcmv2, mcmv3, mcmv4)
 * @returns {number} - Valor do subsídio
 */
function calcularSubsidioMCMV(rendaFamiliar, valorImovel, faixa) {
    let subsidio = 0;
    
    // Valores de exemplo, devem ser atualizados conforme regras vigentes
    if (faixa === 'mcmv1' && rendaFamiliar <= 2850) {
        // Até 95% de subsídio para Faixa 1
        subsidio = valorImovel * 0.95;
        subsidio = Math.min(subsidio, 170000); // Limite máximo de subsídio
    } else if (faixa === 'mcmv2' && rendaFamiliar <= 4700) {
        // Subsídio decrescente para Faixa 2
        const percentualSubsidio = Math.max(0, 0.2 - ((rendaFamiliar - 2850) / (4700 - 2850)) * 0.15);
        subsidio = valorImovel * percentualSubsidio;
        subsidio = Math.min(subsidio, 55000); // Limite máximo de subsídio
    } else if (faixa === 'mcmv3' && rendaFamiliar <= 8600) {
        // Subsídio menor para Faixa 3
        subsidio = 12000; // Valor fixo de exemplo
    } else if (faixa === 'mcmv4' && rendaFamiliar <= 12000) {
        // Subsídio para Faixa 4 (nova faixa)
        subsidio = 5000; // Valor fixo de exemplo
    }
    
    return subsidio;
}

/**
 * Simula amortização extraordinária com redução de prazo
 * @param {Object} dadosFinanciamento - Dados do financiamento atual
 * @param {number} valorAmortizacao - Valor da amortização extraordinária
 * @param {number} parcelaAtual - Número da parcela após a qual será feita a amortização
 * @returns {Object} - Novo financiamento após amortização
 */
function simularAmortizacaoExtraordinariaPrazo(dadosFinanciamento, valorAmortizacao, parcelaAtual) {
    // Copia os dados do financiamento
    const novosDados = JSON.parse(JSON.stringify(dadosFinanciamento.dados));
    
    // Ajusta o valor financiado e o prazo
    const parcelasAnteriores = dadosFinanciamento.parcelas.slice(0, parcelaAtual);
    const saldoDevedorAtual = dadosFinanciamento.parcelas[parcelaAtual - 1].saldoDevedor;
    
    // Reduz o saldo devedor
    const novoSaldoDevedor = Math.max(0, saldoDevedorAtual - valorAmortizacao);
    
    // Recalcula o prazo mantendo o valor da parcela
    let novoPrazo;
    
    if (novosDados.sistemaAmortizacao === 'price') {
        const taxaMensal = novosDados.taxaJuros / 100 / 12;
        const prestacao = dadosFinanciamento.parcelas[parcelaAtual - 1].prestacao;
        
        // Fórmula para calcular o novo prazo na Tabela Price
        novoPrazo = Math.ceil(
            Math.log(prestacao / (prestacao - novoSaldoDevedor * taxaMensal)) / 
            Math.log(1 + taxaMensal)
        );
    } else if (novosDados.sistemaAmortizacao === 'sac') {
        // Para SAC, recalcula o prazo com base na amortização constante
        const amortizacao = dadosFinanciamento.parcelas[parcelaAtual - 1].amortizacao;
        novoPrazo = Math.ceil(novoSaldoDevedor / amortizacao);
    } else {
        // Para SACRE, estimativa aproximada
        const amortizacao = dadosFinanciamento.parcelas[parcelaAtual - 1].amortizacao;
        novoPrazo = Math.ceil(novoSaldoDevedor / amortizacao * 0.85); // Fator de ajuste para crescimento
    }
    
    // Limita o novo prazo
    novoPrazo = Math.min(novoPrazo, dadosFinanciamento.parcelas.length - parcelaAtual);
    
    // Recalcula as parcelas restantes
    let novasParcelas;
    if (novosDados.sistemaAmortizacao === 'sac') {
        novasParcelas = calcularSAC(novoSaldoDevedor, novosDados.taxaJuros, novoPrazo);
    } else if (novosDados.sistemaAmortizacao === 'price') {
        novasParcelas = calcularPrice(novoSaldoDevedor, novosDados.taxaJuros, novoPrazo);
    } else {
        novasParcelas = calcularSACRE(novoSaldoDevedor, novosDados.taxaJuros, novoPrazo);
    }
    
    // Aplicar correção monetária se necessário
    if (novosDados.sistemaCorrecao !== 'fixo') {
        novasParcelas = aplicarCorrecaoMonetaria(novasParcelas, novoSaldoDevedor, novosDados.sistemaCorrecao);
    }
    
    // Adicionar seguros
    novasParcelas = adicionarSeguros(novasParcelas, novoSaldoDevedor, novosDados.valorImovel, novosDados.taxaMIP, novosDados.taxaDFI);
    
    // Ajustar numeração das parcelas
    novasParcelas = novasParcelas.map((parcela, index) => ({
        ...parcela,
        numero: parcelaAtual + index + 1
    }));
    
    // Adicionar datas de vencimento
    const ultimaDataVencimento = new Date(dadosFinanciamento.parcelas[parcelaAtual - 1].dataVencimento);
    const novaDataInicio = new Date(ultimaDataVencimento);
    novaDataInicio.setMonth(ultimaDataVencimento.getMonth() + 1);
    
    novasParcelas = adicionarDatasVencimento(novasParcelas, novaDataInicio.toISOString().split('T')[0]);
    
    // Combinar parcelas anteriores com novas parcelas
    const parcelasCombinadas = [...parcelasAnteriores, ...novasParcelas];
    
    // Calcular novo resumo
    const novoResumo = calcularResumo(parcelasCombinadas, dadosFinanciamento.valorFinanciado, novosDados);
    
    // Calcular economia
    const economiaJuros = dadosFinanciamento.resumo.totalJuros - novoResumo.totalJuros;
    const economiaPrazo = dadosFinanciamento.resumo.prazoTotal - novoResumo.prazoTotal;
    
    return {
        parcelas: parcelasCombinadas,
        resumo: novoResumo,
        economia: {
            juros: economiaJuros,
            prazo: economiaPrazo,
            total: economiaJuros + (dadosFinanciamento.resumo.totalSeguros - novoResumo.totalSeguros)
        }
    };
}

/**
 * Simula amortização extraordinária com redução de parcela
 * @param {Object} dadosFinanciamento - Dados do financiamento atual
 * @param {number} valorAmortizacao - Valor da amortização extraordinária
 * @param {number} parcelaAtual - Número da parcela após a qual será feita a amortização
 * @returns {Object} - Novo financiamento após amortização
 */
function simularAmortizacaoExtraordinariaParcela(dadosFinanciamento, valorAmortizacao, parcelaAtual) {
    // Copia os dados do financiamento
    const novosDados = JSON.parse(JSON.stringify(dadosFinanciamento.dados));
    
    // Ajusta o valor financiado mantendo o prazo
    const parcelasAnteriores = dadosFinanciamento.parcelas.slice(0, parcelaAtual);
    const saldoDevedorAtual = dadosFinanciamento.parcelas[parcelaAtual - 1].saldoDevedor;
    
    // Reduz o saldo devedor
    const novoSaldoDevedor = Math.max(0, saldoDevedorAtual - valorAmortizacao);
    
    // Mantém o prazo original
    const prazoRestante = dadosFinanciamento.parcelas.length - parcelaAtual;
    
    // Recalcula as parcelas restantes com o novo saldo devedor
    let novasParcelas;
    if (novosDados.sistemaAmortizacao === 'sac') {
        novasParcelas = calcularSAC(novoSaldoDevedor, novosDados.taxaJuros, prazoRestante);
    } else if (novosDados.sistemaAmortizacao === 'price') {
        novasParcelas = calcularPrice(novoSaldoDevedor, novosDados.taxaJuros, prazoRestante);
    } else {
        novasParcelas = calcularSACRE(novoSaldoDevedor, novosDados.taxaJuros, prazoRestante);
    }
    
    // Aplicar correção monetária se necessário
    if (novosDados.sistemaCorrecao !== 'fixo') {
        novasParcelas = aplicarCorrecaoMonetaria(novasParcelas, novoSaldoDevedor, novosDados.sistemaCorrecao);
    }
    
    // Adicionar seguros
    novasParcelas = adicionarSeguros(novasParcelas, novoSaldoDevedor, novosDados.valorImovel, novosDados.taxaMIP, novosDados.taxaDFI);
    
    // Ajustar numeração das parcelas
    novasParcelas = novasParcelas.map((parcela, index) => ({
        ...parcela,
        numero: parcelaAtual + index + 1
    }));
    
    // Adicionar datas de vencimento
    const ultimaDataVencimento = new Date(dadosFinanciamento.parcelas[parcelaAtual - 1].dataVencimento);
    const novaDataInicio = new Date(ultimaDataVencimento);
    novaDataInicio.setMonth(ultimaDataVencimento.getMonth() + 1);
    
    novasParcelas = adicionarDatasVencimento(novasParcelas, novaDataInicio.toISOString().split('T')[0]);
    
    // Combinar parcelas anteriores com novas parcelas
    const parcelasCombinadas = [...parcelasAnteriores, ...novasParcelas];
    
    // Calcular novo resumo
    const novoResumo = calcularResumo(parcelasCombinadas, dadosFinanciamento.valorFinanciado, novosDados);
    
    // Calcular economia
    const economiaJuros = dadosFinanciamento.resumo.totalJuros - novoResumo.totalJuros;
    const economiaParcela = dadosFinanciamento.parcelas[parcelaAtual].prestacaoTotal - novasParcelas[0].prestacaoTotal;
    
    return {
        parcelas: parcelasCombinadas,
        resumo: novoResumo,
        economia: {
            juros: economiaJuros,
            parcela: economiaParcela,
            total: economiaJuros + (dadosFinanciamento.resumo.totalSeguros - novoResumo.totalSeguros)
        }
    };
}

/**
 * Simula portabilidade de financiamento
 * @param {Object} dadosAtuais - Dados do financiamento atual
 * @param {Object} dadosNovos - Dados do novo financiamento (nova taxa, custos, etc.)
 * @returns {Object} - Resultado da simulação de portabilidade
 */
function simularPortabilidade(dadosAtuais, dadosNovos) {
    // Copia os dados do financiamento atual
    const dadosFinanciamentoAtual = JSON.parse(JSON.stringify(dadosAtuais));
    
    // Determina a parcela atual e o saldo devedor
    const parcelaAtual = dadosNovos.parcelaAtual || 1;
    const saldoDevedorAtual = dadosFinanciamentoAtual.parcelas[parcelaAtual - 1].saldoDevedor;
    
    // Cria dados para o novo financiamento
    const novosDados = {
        ...dadosFinanciamentoAtual.dados,
        taxaJuros: dadosNovos.novaTaxaJuros,
        valorImovel: dadosFinanciamentoAtual.dados.valorImovel,
        valorEntrada: 0, // Não há entrada na portabilidade
        valorFgts: 0, // Não há uso de FGTS na portabilidade
        usarFgts: 'nao'
    };
    
    // Prazo restante
    const prazoRestante = dadosFinanciamentoAtual.parcelas.length - parcelaAtual;
    
    // Calcula o novo financiamento
    let novasParcelas;
    if (novosDados.sistemaAmortizacao === 'sac') {
        novasParcelas = calcularSAC(saldoDevedorAtual, novosDados.taxaJuros, prazoRestante);
    } else if (novosDados.sistemaAmortizacao === 'price') {
        novasParcelas = calcularPrice(saldoDevedorAtual, novosDados.taxaJuros, prazoRestante);
    } else {
        novasParcelas = calcularSACRE(saldoDevedorAtual, novosDados.taxaJuros, prazoRestante);
    }
    
    // Aplicar correção monetária se necessário
    if (novosDados.sistemaCorrecao !== 'fixo') {
        novasParcelas = aplicarCorrecaoMonetaria(novasParcelas, saldoDevedorAtual, novosDados.sistemaCorrecao);
    }
    
    // Adicionar seguros
    novasParcelas = adicionarSeguros(novasParcelas, saldoDevedorAtual, novosDados.valorImovel, novosDados.taxaMIP, novosDados.taxaDFI);
    
    // Adicionar datas de vencimento
    const ultimaDataVencimento = new Date(dadosFinanciamentoAtual.parcelas[parcelaAtual - 1].dataVencimento);
    const novaDataInicio = new Date(ultimaDataVencimento);
    novaDataInicio.setMonth(ultimaDataVencimento.getMonth() + 1);
    
    novasParcelas = adicionarDatasVencimento(novasParcelas, novaDataInicio.toISOString().split('T')[0]);
    
    // Calcular resumo do novo financiamento
    const novoResumo = calcularResumo(novasParcelas, saldoDevedorAtual, novosDados);
    
    // Parcelas restantes do financiamento atual
    const parcelasRestantesAtual = dadosFinanciamentoAtual.parcelas.slice(parcelaAtual);
    
    // Calcular economia
    const totalJurosAtual = parcelasRestantesAtual.reduce((sum, parcela) => sum + parcela.juros, 0);
    const totalJurosNovo = novasParcelas.reduce((sum, parcela) => sum + parcela.juros, 0);
    const economiaJuros = totalJurosAtual - totalJurosNovo;
    
    const totalPrestacaoAtual = parcelasRestantesAtual.reduce((sum, parcela) => sum + parcela.prestacaoTotal, 0);
    const totalPrestacaoNovo = novasParcelas.reduce((sum, parcela) => sum + parcela.prestacaoTotal, 0);
    const economiaPrestacao = totalPrestacaoAtual - totalPrestacaoNovo;
    
    // Calcular prazo para recuperar custos da portabilidade
    const custoPortabilidade = dadosNovos.custoPortabilidade || 0;
    let prazoRecuperacao = 0;
    let economiaAcumulada = 0;
    
    for (let i = 0; i < Math.min(parcelasRestantesAtual.length, novasParcelas.length); i++) {
        economiaAcumulada += parcelasRestantesAtual[i].prestacaoTotal - novasParcelas[i].prestacaoTotal;
        if (economiaAcumulada >= custoPortabilidade) {
            prazoRecuperacao = i + 1;
            break;
        }
    }
    
    // Se não recuperar o custo no prazo do financiamento
    if (prazoRecuperacao === 0 && economiaAcumulada > 0) {
        prazoRecuperacao = Math.ceil(custoPortabilidade / (economiaAcumulada / Math.min(parcelasRestantesAtual.length, novasParcelas.length)));
    }
    
    return {
        parcelasAtuais: parcelasRestantesAtual,
        parcelasNovas: novasParcelas,
        resumoAtual: {
            primeiraPrestacao: parcelasRestantesAtual[0].prestacaoTotal,
            totalJuros: totalJurosAtual,
            totalPrestacao: totalPrestacaoAtual
        },
        resumoNovo: {
            primeiraPrestacao: novasParcelas[0].prestacaoTotal,
            totalJuros: totalJurosNovo,
            totalPrestacao: totalPrestacaoNovo
        },
        economia: {
            juros: economiaJuros,
            prestacao: economiaPrestacao,
            mensal: parcelasRestantesAtual[0].prestacaoTotal - novasParcelas[0].prestacaoTotal
        },
        custoPortabilidade: custoPortabilidade,
        prazoRecuperacao: prazoRecuperacao
    };
}

/**
 * Calcula a capacidade de pagamento
 * @param {number} rendaFamiliar - Renda familiar mensal
 * @param {number} outrasObrigacoes - Valor de outras obrigações mensais
 * @param {number} taxaJuros - Taxa de juros anual (%)
 * @param {number} prazo - Prazo desejado em meses
 * @returns {Object} - Resultado da capacidade de pagamento
 */
function calcularCapacidadePagamento(rendaFamiliar, outrasObrigacoes, taxaJuros, prazo) {
    // Limite de comprometimento da renda (geralmente 30%)
    const limiteComprometimento = 0.3;
    
    // Capacidade de pagamento mensal
    const capacidadePagamento = (rendaFamiliar * limiteComprometimento) - outrasObrigacoes;
    
    if (capacidadePagamento <= 0) {
        return {
            capacidadePagamento: 0,
            valorMaximoFinanciavel: 0,
            valorImovelEstimado: 0
        };
    }
    
    // Cálculo do valor máximo financiável
    let valorMaximoFinanciavel;
    
    // Para sistema Price (prestações constantes)
    const taxaMensal = taxaJuros / 100 / 12;
    valorMaximoFinanciavel = capacidadePagamento * ((1 - Math.pow(1 + taxaMensal, -prazo)) / taxaMensal);
    
    // Estimar valor do imóvel (considerando entrada de 20%)
    const valorImovelEstimado = valorMaximoFinanciavel / 0.8;
    
    return {
        capacidadePagamento: capacidadePagamento,
        valorMaximoFinanciavel: valorMaximoFinanciavel,
        valorImovelEstimado: valorImovelEstimado
    };
}

/**
 * Analisa um cenário de financiamento
 * @param {Object} dadosCenario - Dados do cenário
 * @param {Object} resultadoCalculo - Resultado do cálculo do financiamento
 * @returns {Object} - Análise do cenário
 */
function analisarCenario(dadosCenario, resultadoCalculo) {
    const analise = {
        pontosFortes: [],
        pontosFracos: [],
        sugestoes: []
    };
    
    // Analisar comprometimento de renda
    const comprometimento = resultadoCalculo.resumo.comprometimentoRenda;
    if (comprometimento > 30) {
        analise.pontosFracos.push(`O comprometimento de renda é alto (${comprometimento.toFixed(2)}%), o recomendado é até 30%.`);
        analise.sugestoes.push('Considere aumentar o valor da entrada ou o prazo do financiamento para reduzir as parcelas.');
    } else {
        analise.pontosFortes.push(`O comprometimento de renda está adequado (${comprometimento.toFixed(2)}%).`);
    }
    
    // Analisar sistema de amortização
    if (dadosCenario.sistemaAmortizacao === 'price') {
        analise.pontosFracos.push('O sistema Price resulta em um valor total de juros maior ao longo do financiamento.');
        analise.sugestoes.push('Considere o sistema SAC para economizar no valor total de juros, mesmo com parcelas iniciais maiores.');
    } else if (dadosCenario.sistemaAmortizacao === 'sac') {
        analise.pontosFortes.push('O sistema SAC resulta em economia no valor total de juros.');
        analise.pontosFracos.push('As parcelas iniciais são mais altas no sistema SAC.');
    } else if (dadosCenario.sistemaAmortizacao === 'sacre') {
        analise.pontosFortes.push('O sistema SACRE oferece um equilíbrio entre o valor total de juros e o impacto inicial no orçamento.');
    }
    
    // Analisar uso do FGTS
    if (dadosCenario.usarFgts === 'nao' && dadosCenario.valorFgts > 0) {
        analise.sugestoes.push('Considere usar o FGTS disponível para reduzir o valor financiado ou aumentar a entrada.');
    }
    
    // Analisar prazo
    if (dadosCenario.prazoFinanciamento > 300) {
        analise.pontosFracos.push('Prazos muito longos resultam em um valor total de juros significativamente maior.');
        analise.sugestoes.push('Se possível, considere reduzir o prazo para economizar no valor total de juros.');
    } else if (dadosCenario.prazoFinanciamento < 120) {
        analise.pontosFortes.push('O prazo mais curto resulta em economia significativa no valor total de juros.');
        analise.pontosFracos.push('Prazos curtos resultam em parcelas mensais mais altas.');
    }
    
    // Analisar taxa de juros
    if (dadosCenario.taxaJuros > 12) {
        analise.pontosFracos.push('A taxa de juros está acima da média do mercado.');
        analise.sugestoes.push('Pesquise outras instituições financeiras que possam oferecer taxas mais competitivas.');
    } else if (dadosCenario.taxaJuros < 10) {
        analise.pontosFortes.push('A taxa de juros está abaixo da média do mercado.');
    }
    
    // Analisar valor de entrada
    const percentualEntrada = (dadosCenario.valorEntrada / dadosCenario.valorImovel) * 100;
    if (percentualEntrada < 20) {
        analise.pontosFracos.push(`O valor de entrada (${percentualEntrada.toFixed(2)}%) está abaixo do recomendado de 20%.`);
        analise.sugestoes.push('Considere aumentar o valor da entrada para reduzir o valor financiado e os juros totais.');
    } else {
        analise.pontosFortes.push(`O valor de entrada (${percentualEntrada.toFixed(2)}%) está adequado.`);
    }
    
    // Analisar correção monetária
    if (dadosCenario.sistemaCorrecao === 'ipca') {
        analise.pontosFracos.push('A correção pelo IPCA pode resultar em aumento significativo das parcelas em períodos de inflação alta.');
        analise.sugestoes.push('Considere um sistema de correção mais estável como a TR ou taxa fixa se preferir maior previsibilidade.');
    } else if (dadosCenario.sistemaCorrecao === 'fixo') {
        analise.pontosFortes.push('A taxa fixa oferece maior previsibilidade nas parcelas ao longo do financiamento.');
    }
    
    return analise;
}

/**
 * Compara cenários de financiamento
 * @param {Array} cenariosSelecionados - Array de cenários selecionados
 * @returns {Object} - Resultado da comparação
 */
function compararCenarios(cenariosSelecionados) {
    if (cenariosSelecionados.length < 2) {
        return { erro: 'Selecione pelo menos dois cenários para comparação.' };
    }
    
    const comparacao = {
        tabela: [],
        diferenca: {},
        ranking: {
            custoTotal: [],
            primeiraParcela: [],
            valorFinal: []
        }
    };
    
    // Preencher tabela comparativa
    cenariosSelecionados.forEach(cenario => {
        comparacao.tabela.push({
            id: cenario.id,
            nome: cenario.nome,
            valorFinanciado: cenario.valorFinanciado,
            sistema: cenario.dados.sistemaAmortizacao,
            prazo: cenario.dados.prazoFinanciamento,
            taxa: cenario.dados.taxaJuros,
            primeiraParcela: cenario.resumo.primeiraPrestacao,
            ultimaParcela: cenario.resumo.ultimaPrestacao,
            totalJuros: cenario.resumo.totalJuros,
            totalPago: cenario.resumo.totalPago
        });
    });
    
    // Calcular diferenças percentuais entre o primeiro e os demais cenários
    const cenarioBase = comparacao.tabela[0];
    comparacao.diferenca = comparacao.tabela.slice(1).map(cenario => {
        return {
            id: cenario.id,
            nome: cenario.nome,
            valorFinanciado: ((cenario.valorFinanciado - cenarioBase.valorFinanciado) / cenarioBase.valorFinanciado) * 100,
            primeiraParcela: ((cenario.primeiraParcela - cenarioBase.primeiraParcela) / cenarioBase.primeiraParcela) * 100,
            totalJuros: ((cenario.totalJuros - cenarioBase.totalJuros) / cenarioBase.totalJuros) * 100,
            totalPago: ((cenario.totalPago - cenarioBase.totalPago) / cenarioBase.totalPago) * 100
        };
    });
    
    // Criar rankings
    // Ranking por custo total
    comparacao.ranking.custoTotal = [...comparacao.tabela].sort((a, b) => a.totalPago - b.totalPago);
    
    // Ranking por primeira parcela
    comparacao.ranking.primeiraParcela = [...comparacao.tabela].sort((a, b) => a.primeiraParcela - b.primeiraParcela);
    
    // Ranking por valor final (última parcela)
    comparacao.ranking.ultimaParcela = [...comparacao.tabela].sort((a, b) => a.ultimaParcela - b.ultimaParcela);
    
    return comparacao;
}

// Exportar funções para uso global
window.calcularFinanciamento = calcularFinanciamento;
window.simularAmortizacaoExtraordinariaPrazo = simularAmortizacaoExtraordinariaPrazo;
window.simularAmortizacaoExtraordinariaParcela = simularAmortizacaoExtraordinariaParcela;
window.simularPortabilidade = simularPortabilidade;
window.calcularCapacidadePagamento = calcularCapacidadePagamento;
window.analisarCenario = analisarCenario;
window.compararCenarios = compararCenarios;
window.financiamentoAtual = financiamentoAtual;
