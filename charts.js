// charts.js
// Módulo responsável pela geração de gráficos com Chart.js

// Importação da biblioteca Chart.js e adaptadores/plugins necessários
// Assumindo que Chart.js será incluído via CDN ou bundler no HTML principal
// Se estiver usando npm, seria: import Chart from 'chart.js/auto';
// import ChartDataLabels from 'chartjs-plugin-datalabels';
// import 'chartjs-adapter-date-fns';
// Chart.register(ChartDataLabels);

// --- Configurações Comuns ---

/**
 * Configurações globais padrão para todos os gráficos
 */
export const defaultConfig = {
  colors: {
    financing: { primary: 'rgba(54, 162, 235, 1)', secondary: 'rgba(54, 162, 235, 0.2)', highlight: 'rgba(54, 162, 235, 0.8)' },
    consortium: { primary: 'rgba(255, 159, 64, 1)', secondary: 'rgba(255, 159, 64, 0.2)', highlight: 'rgba(255, 159, 64, 0.8)' },
    rent: { primary: 'rgba(75, 192, 192, 1)', secondary: 'rgba(75, 192, 192, 0.2)', highlight: 'rgba(75, 192, 192, 0.8)' },
    cashPurchase: { primary: 'rgba(153, 102, 255, 1)', secondary: 'rgba(153, 102, 255, 0.2)', highlight: 'rgba(153, 102, 255, 0.8)' },
    otherLoan: { primary: 'rgba(255, 99, 132, 1)', secondary: 'rgba(255, 99, 132, 0.2)', highlight: 'rgba(255, 99, 132, 0.8)' },
    comparison: { netResult: 'rgba(46, 204, 113, 1)', totalCost: 'rgba(231, 76, 60, 1)' }
  },
  componentColors: {
    principal: 'rgba(54, 162, 235, 1)',
    interest: 'rgba(255, 99, 132, 1)',
    insurance: 'rgba(255, 159, 64, 1)',
    adminFee: 'rgba(75, 192, 192, 1)',
    taxes: 'rgba(153, 102, 255, 1)',
    maintenance: 'rgba(201, 203, 207, 1)',
    rent: 'rgba(75, 192, 192, 1)',
    investment: 'rgba(46, 204, 113, 1)'
  },
  fonts: {
    family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    size: 12,
    titleSize: 16,
    weightNormal: 400,
    weightBold: 700
  },
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 800,
    easing: 'easeOutQuart'
  },
  plugins: {
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
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
    },
    legend: {
      display: true,
      position: 'top',
      labels: {
        boxWidth: 15,
        padding: 15,
        font: {
            size: 11
        }
      }
    },
    // Configuração padrão do datalabels (se o plugin estiver registrado)
    datalabels: {
        display: false // Desabilitado por padrão, habilitar por gráfico se necessário
    }
  },
  scales: { // Configurações padrão para eixos
      x: {
          grid: {
              display: false // Ocultar grid vertical por padrão
          },
          ticks: {
              font: {
                  size: 11
              }
          }
      },
      y: {
          beginAtZero: true,
          grid: {
              color: 'rgba(0, 0, 0, 0.05)' // Grid horizontal suave
          },
          ticks: {
              font: {
                  size: 11
              },
              callback: function(value) {
                  // Formatação padrão para eixo Y (monetário)
                  return formatCurrency(value, { maximumFractionDigits: 0 });
              }
          }
      }
  }
};

// --- Funções Utilitárias de Formatação ---

/**
 * Formata valores monetários para exibição
 * @param {number} value - Valor a ser formatado
 * @param {Object} options - Opções de formatação Intl.NumberFormat
 * @return {string} Valor formatado
 */
export function formatCurrency(value, options = {}) {
  const defaultOptions = {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  const mergedOptions = { ...defaultOptions, ...options };
  return new Intl.NumberFormat('pt-BR', mergedOptions).format(value);
}

/**
 * Formata valores percentuais para exibição
 * @param {number} value - Valor a ser formatado (0.05 = 5%)
 * @param {Object} options - Opções de formatação Intl.NumberFormat
 * @return {string} Valor formatado
 */
export function formatPercentage(value, options = {}) {
  const defaultOptions = {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  const mergedOptions = { ...defaultOptions, ...options };
  return new Intl.NumberFormat('pt-BR', mergedOptions).format(value);
}

// --- Funções de Criação e Gerenciamento de Gráficos ---

// Armazenar instâncias de gráficos para gerenciamento
const chartInstances = {};

/**
 * Mescla profundamente dois objetos (necessário para opções do Chart.js)
 * @param {Object} target - Objeto alvo
 * @param {Object} source - Objeto fonte
 * @return {Object} Objeto mesclado
 */
function mergeDeep(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

/**
 * Verifica se um item é um objeto (e não array ou null)
 * @param {*} item - Item a ser verificado
 * @return {boolean} Verdadeiro se for um objeto
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Cria ou atualiza um gráfico Chart.js
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} type - Tipo de gráfico (line, bar, pie, etc.)
 * @param {Object} data - Dados para o gráfico (labels, datasets)
 * @param {Object} options - Opções de configuração específicas do gráfico
 * @param {boolean} isDarkMode - Se deve aplicar tema escuro (não implementado aqui, mas o hook está presente)
 * @return {Chart | null} Instância do gráfico criado/atualizado ou null em caso de erro
 */
export function createOrUpdateChart(canvasId, type, data, options = {}, isDarkMode = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas com ID ${canvasId} não encontrado.`);
    return null;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
      console.error(`Não foi possível obter o contexto 2D para o canvas ${canvasId}.`);
      return null;
  }

  // Mesclar opções padrão com opções específicas do gráfico
  // Usar mergeDeep para garantir que sub-objetos sejam mesclados corretamente
  const mergedOptions = mergeDeep(defaultConfig, options);

  // Aplicar tema (placeholder para lógica de tema)
  // const finalConfig = isDarkMode ? applyDarkTheme({ type, data, options: mergedOptions }) : applyLightTheme({ type, data, options: mergedOptions });
  const finalConfig = { type, data, options: mergedOptions }; // Usando config mesclada diretamente por enquanto

  // Verificar se já existe uma instância para este canvas
  if (chartInstances[canvasId]) {
    // Atualizar gráfico existente
    const chart = chartInstances[canvasId];
    chart.config.type = finalConfig.type;
    chart.config.data = finalConfig.data;
    chart.config.options = finalConfig.options;
    chart.update();
    return chart;
  } else {
    // Criar novo gráfico
    try {
        // Verificar se Chart está disponível globalmente
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado. Inclua a biblioteca no seu HTML.');
            return null;
        }
        const newChart = new Chart(ctx, finalConfig);
        chartInstances[canvasId] = newChart;
        return newChart;
    } catch (error) {
        console.error(`Erro ao criar gráfico ${canvasId}:`, error);
        return null;
    }
  }
}

/**
 * Destrói um gráfico existente e remove a referência
 * @param {string} canvasId - ID do elemento canvas do gráfico
 */
export function destroyChart(canvasId) {
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }
}

// --- Funções Específicas de Geração de Gráficos ---

/**
 * Cria um gráfico de evolução do saldo devedor (Financiamento)
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array} amortizationTable - Tabela de amortização do calculations.js
 * @param {Object} options - Opções adicionais para o gráfico
 */
export function createBalanceEvolutionChart(canvasId, amortizationTable, options = {}) {
  if (!amortizationTable || amortizationTable.length === 0) return;

  const labels = amortizationTable.map(row => `Mês ${row.month}`);
  const balanceData = amortizationTable.map(row => row.remainingBalance);

  const data = {
    labels,
    datasets: [{
      label: 'Saldo Devedor',
      data: balanceData,
      borderColor: defaultConfig.colors.financing.primary,
      backgroundColor: defaultConfig.colors.financing.secondary,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.1,
      fill: true
    }]
  };

  const chartOptions = {
    plugins: {
      title: {
        display: true,
        text: 'Evolução do Saldo Devedor',
        font: { size: defaultConfig.fonts.titleSize, weight: defaultConfig.fonts.weightBold }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Valor (R$)'
        }
      },
      x: {
          title: {
              display: true,
              text: 'Meses'
          }
      }
    }
  };

  createOrUpdateChart(canvasId, 'line', data, mergeDeep(chartOptions, options));
}

/**
 * Cria um gráfico de composição das parcelas (Financiamento - Price/SAC/SACRE)
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array} amortizationTable - Tabela de amortização
 * @param {string} amortizationSystem - 'PRICE', 'SAC', ou 'SACRE'
 * @param {Object} options - Opções adicionais
 */
export function createPaymentCompositionChart(canvasId, amortizationTable, amortizationSystem, options = {}) {
    if (!amortizationTable || amortizationTable.length === 0) return;

    // Para gráficos de barra empilhada, muitos pontos podem poluir.
    // Selecionar alguns pontos ou usar agregação se a tabela for muito longa.
    // Exemplo: pegar a cada N meses ou início/meio/fim.
    const sampleRate = Math.max(1, Math.floor(amortizationTable.length / 50)); // Ex: max 50 barras
    const sampledTable = amortizationTable.filter((_, index) => index % sampleRate === 0);

    const labels = sampledTable.map(row => `Mês ${row.month}`);
    const amortizationData = sampledTable.map(row => row.amortization);
    const interestData = sampledTable.map(row => row.interest);
    // Adicionar outras componentes se existirem (ex: seguro, taxas)
    // const insuranceData = sampledTable.map(row => row.insurance || 0);
    // const feeData = sampledTable.map(row => row.fees || 0);

    const datasets = [
        {
            label: 'Amortização',
            data: amortizationData,
            backgroundColor: defaultConfig.componentColors.principal
        },
        {
            label: 'Juros',
            data: interestData,
            backgroundColor: defaultConfig.componentColors.interest
        }
        // { label: 'Seguro', data: insuranceData, backgroundColor: defaultConfig.componentColors.insurance },
        // { label: 'Taxas', data: feeData, backgroundColor: defaultConfig.componentColors.adminFee },
    ];

    const data = { labels, datasets };

    const chartOptions = {
        plugins: {
            title: {
                display: true,
                text: `Composição das Parcelas (${amortizationSystem})`,
                font: { size: defaultConfig.fonts.titleSize, weight: defaultConfig.fonts.weightBold }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Meses (Amostrado)'
                }
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Valor (R$)'
                }
            }
        }
    };

    createOrUpdateChart(canvasId, 'bar', data, mergeDeep(chartOptions, options));
}

/**
 * Cria um gráfico de comparação de custos totais entre modalidades
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} comparisonData - Objeto retornado por compareOptions de calculations.js
 * @param {Object} options - Opções adicionais
 */
export function createTotalCostComparisonChart(canvasId, comparisonData, options = {}) {
    if (!comparisonData || !comparisonData.comparison || comparisonData.comparison.length === 0) return;

    const labels = comparisonData.comparison.map(opt => opt.name);
    const costData = comparisonData.comparison.map(opt => opt.totalCost);
    const backgroundColors = comparisonData.comparison.map(opt => defaultConfig.colors[opt.type]?.primary || defaultConfig.colors.otherLoan.primary);
    const borderColors = comparisonData.comparison.map(opt => defaultConfig.colors[opt.type]?.highlight || defaultConfig.colors.otherLoan.highlight);

    const data = {
        labels,
        datasets: [{
            label: 'Custo Total Estimado',
            data: costData,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
        }]
    };

    const chartOptions = {
        indexAxis: 'y', // Barras horizontais para melhor leitura dos nomes
        plugins: {
            title: {
                display: true,
                text: 'Comparativo de Custo Total por Modalidade',
                font: { size: defaultConfig.fonts.titleSize, weight: defaultConfig.fonts.weightBold }
            },
            legend: {
                display: false // Legenda não necessária para gráfico de barra simples
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Custo Total (R$)'
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value, { maximumFractionDigits: 0 });
                    }
                }
            },
            y: {
                ticks: {
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    createOrUpdateChart(canvasId, 'bar', data, mergeDeep(chartOptions, options));
}

/**
 * Cria um gráfico de comparação de resultado líquido entre modalidades
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} comparisonData - Objeto retornado por compareOptions de calculations.js
 * @param {Object} options - Opções adicionais
 */
export function createNetResultComparisonChart(canvasId, comparisonData, options = {}) {
    if (!comparisonData || !comparisonData.comparison || comparisonData.comparison.length === 0) return;

    // Ordenar por nome para consistência, se necessário
    const sortedComparison = [...comparisonData.comparison].sort((a, b) => a.name.localeCompare(b.name));

    const labels = sortedComparison.map(opt => opt.name);
    const netResultData = sortedComparison.map(opt => opt.netResult);
    const backgroundColors = sortedComparison.map(opt => {
        // Cor verde para positivo, vermelho para negativo
        return opt.netResult >= 0 ? defaultConfig.colors.comparison.netResult : defaultConfig.colors.comparison.totalCost;
    });

    const data = {
        labels,
        datasets: [{
            label: 'Resultado Líquido Estimado',
            data: netResultData,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors, // Mesma cor para borda
            borderWidth: 1
        }]
    };

    const chartOptions = {
        indexAxis: 'y',
        plugins: {
            title: {
                display: true,
                text: 'Comparativo de Resultado Líquido por Modalidade',
                font: { size: defaultConfig.fonts.titleSize, weight: defaultConfig.fonts.weightBold }
            },
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Resultado Líquido (R$)'
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value, { maximumFractionDigits: 0 });
                    }
                }
            },
             y: {
                ticks: {
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    createOrUpdateChart(canvasId, 'bar', data, mergeDeep(chartOptions, options));
}

/**
 * Cria um gráfico de evolução do aluguel vs. investimento alternativo
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} rentResult - Objeto retornado por calculateRent de calculations.js
 * @param {Object} options - Opções adicionais
 */
export function createRentVsInvestmentChart(canvasId, rentResult, options = {}) {
    if (!rentResult || !rentResult.evolutionTable || rentResult.evolutionTable.length === 0) return;

    const labels = rentResult.evolutionTable.map(row => `Ano ${row.year}`);
    const cumulativeCostData = rentResult.evolutionTable.map(row => row.cumulativeTotalCost);

    // Calcular evolução do investimento ano a ano
    const investmentEvolution = [];
    let currentInvestment = rentResult.details?.availableInvestment || 0; // Usar details se disponível
    const investmentReturnRate = rentResult.details?.investmentReturn || 0;
    for (let year = 0; year <= rentResult.evolutionTable.length; year++) {
        investmentEvolution.push(currentInvestment);
        currentInvestment *= (1 + investmentReturnRate);
    }
    // Remover o valor inicial (ano 0) para alinhar com os anos da tabela de aluguel
    const investmentData = investmentEvolution.slice(1);

    const data = {
        labels,
        datasets: [
            {
                label: 'Custo Acumulado do Aluguel',
                data: cumulativeCostData,
                borderColor: defaultConfig.componentColors.rent,
                backgroundColor: defaultConfig.componentColors.rent.replace('1)', '0.2)'),
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.1,
                fill: true,
                yAxisID: 'yCost'
            },
            {
                label: 'Valor do Investimento Alternativo',
                data: investmentData,
                borderColor: defaultConfig.componentColors.investment,
                backgroundColor: defaultConfig.componentColors.investment.replace('1)', '0.2)'),
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.1,
                fill: true,
                yAxisID: 'yInvestment'
            }
        ]
    };

    const chartOptions = {
        plugins: {
            title: {
                display: true,
                text: 'Evolução: Custo do Aluguel vs. Investimento Alternativo',
                font: { size: defaultConfig.fonts.titleSize, weight: defaultConfig.fonts.weightBold }
            }
        },
        scales: {
            yCost: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Custo Acumulado (R$)'
                },
                 beginAtZero: true
            },
            yInvestment: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Valor Investido (R$)'
                },
                grid: {
                    drawOnChartArea: false, // não desenhar grid para o segundo eixo Y
                },
                 beginAtZero: true
            },
            x: {
                title: {
                    display: true,
                    text: 'Anos'
                }
            }
        }
    };

    createOrUpdateChart(canvasId, 'line', data, mergeDeep(chartOptions, options));
}

// Adicionar mais funções de criação de gráficos conforme necessário (Consórcio, Compra à Vista, Amortização etc.)

