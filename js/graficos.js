/**
 * Visualizações Gráficas para Calculadora de Financiamento Imobiliário
 * Implementação dos gráficos usando Chart.js
 */

// Objeto para armazenar as instâncias de gráficos
const graficos = {
    saldoDevedor: null,
    composicaoParcelas: null,
    distribuicao: null,
    comparacaoCenarios: null
};

/**
 * Cria ou atualiza o gráfico de evolução do saldo devedor
 * @param {Array} parcelas - Array de parcelas calculadas
 */
function criarGraficoSaldoDevedor(parcelas) {
    const ctx = document.getElementById('graficoSaldoDevedor').getContext('2d');
    
    // Preparar dados
    const labels = parcelas.map(p => p.numero);
    const data = parcelas.map(p => p.saldoDevedor);
    
    // Destruir gráfico existente se houver
    if (graficos.saldoDevedor) {
        graficos.saldoDevedor.destroy();
    }
    
    // Criar novo gráfico
    graficos.saldoDevedor = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Saldo Devedor',
                data: data,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução do Saldo Devedor'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + formatarValor(context.parsed.y);
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Parcela'
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            // Mostrar apenas algumas parcelas para não sobrecarregar o eixo
                            const intervalo = Math.ceil(parcelas.length / 10);
                            return index % intervalo === 0 ? value : '';
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    },
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + formatarValor(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Cria ou atualiza o gráfico de composição das parcelas
 * @param {Array} parcelas - Array de parcelas calculadas
 */
function criarGraficoComposicaoParcelas(parcelas) {
    const ctx = document.getElementById('graficoComposicaoParcelas').getContext('2d');
    
    // Selecionar algumas parcelas para visualização (início, meio e fim)
    const parcelasSelecionadas = selecionarParcelasRepresentativas(parcelas);
    
    // Preparar dados
    const labels = parcelasSelecionadas.map(p => `Parcela ${p.numero}`);
    const amortizacoes = parcelasSelecionadas.map(p => p.amortizacao);
    const juros = parcelasSelecionadas.map(p => p.juros);
    const seguros = parcelasSelecionadas.map(p => p.mip + p.dfi);
    
    // Destruir gráfico existente se houver
    if (graficos.composicaoParcelas) {
        graficos.composicaoParcelas.destroy();
    }
    
    // Criar novo gráfico
    graficos.composicaoParcelas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Amortização',
                    data: amortizacoes,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Juros',
                    data: juros,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Seguros',
                    data: seguros,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Composição das Parcelas'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': R$ ' + formatarValor(context.parsed.y);
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Parcelas'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    },
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + formatarValor(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Cria ou atualiza o gráfico de distribuição de pagamentos
 * @param {Object} resumo - Resumo do financiamento
 */
function criarGraficoDistribuicao(resumo) {
    const ctx = document.getElementById('graficoDistribuicao').getContext('2d');
    
    // Preparar dados
    const data = [
        resumo.totalAmortizacao,
        resumo.totalJuros,
        resumo.totalSeguros,
        resumo.totalCorrecao || 0
    ];
    
    // Destruir gráfico existente se houver
    if (graficos.distribuicao) {
        graficos.distribuicao.destroy();
    }
    
    // Criar novo gráfico
    graficos.distribuicao = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Amortização', 'Juros', 'Seguros', 'Correção Monetária'],
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribuição de Pagamentos'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(2) + '%';
                            return label + ': R$ ' + formatarValor(value) + ' (' + percentage + ')';
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'right'
                }
            }
        }
    });
}

/**
 * Cria ou atualiza o gráfico de comparação entre cenários
 * @param {Array} cenarios - Array de cenários a comparar
 */
function criarGraficoComparacaoCenarios(cenarios) {
    const ctx = document.getElementById('graficoComparacaoCenarios').getContext('2d');
    
    // Preparar dados
    const labels = cenarios.map(c => c.nome);
    const totalJuros = cenarios.map(c => c.resumo.totalJuros);
    const totalAmortizacao = cenarios.map(c => c.resumo.totalAmortizacao);
    const totalSeguros = cenarios.map(c => c.resumo.totalSeguros);
    
    // Destruir gráfico existente se houver
    if (graficos.comparacaoCenarios) {
        graficos.comparacaoCenarios.destroy();
    }
    
    // Criar novo gráfico
    graficos.comparacaoCenarios = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Amortização',
                    data: totalAmortizacao,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Juros',
                    data: totalJuros,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Seguros',
                    data: totalSeguros,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparação entre Cenários'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': R$ ' + formatarValor(context.parsed.y);
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Cenários'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    },
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + formatarValor(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Seleciona parcelas representativas para visualização
 * @param {Array} parcelas - Array completo de parcelas
 * @returns {Array} - Array com parcelas selecionadas
 */
function selecionarParcelasRepresentativas(parcelas) {
    const numParcelas = parcelas.length;
    
    // Se tiver poucas parcelas, mostrar todas
    if (numParcelas <= 6) {
        return parcelas;
    }
    
    // Selecionar parcelas do início, meio e fim
    const parcelasSelecionadas = [
        parcelas[0],                          // Primeira
        parcelas[Math.floor(numParcelas / 5)],
        parcelas[Math.floor(numParcelas * 2 / 5)],
        parcelas[Math.floor(numParcelas * 3 / 5)],
        parcelas[Math.floor(numParcelas * 4 / 5)],
        parcelas[numParcelas - 1]             // Última
    ];
    
    return parcelasSelecionadas;
}

/**
 * Atualiza todos os gráficos com base no financiamento atual
 */
function atualizarGraficos() {
    if (!financiamentoAtual || !financiamentoAtual.parcelas || financiamentoAtual.parcelas.length === 0) {
        return;
    }
    
    criarGraficoSaldoDevedor(financiamentoAtual.parcelas);
    criarGraficoComposicaoParcelas(financiamentoAtual.parcelas);
    criarGraficoDistribuicao(financiamentoAtual.resumo);
}

/**
 * Formata um valor numérico para exibição
 * @param {number} valor - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Exportar funções para uso global
window.criarGraficoSaldoDevedor = criarGraficoSaldoDevedor;
window.criarGraficoComposicaoParcelas = criarGraficoComposicaoParcelas;
window.criarGraficoDistribuicao = criarGraficoDistribuicao;
window.criarGraficoComparacaoCenarios = criarGraficoComparacaoCenarios;
window.atualizarGraficos = atualizarGraficos;
