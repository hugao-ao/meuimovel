// Script principal para a aplicação de Análise Imobiliária

// Importar funções dos módulos
import * as calc from './calculations.js';
import * as storage from './storage.js';
import * as charts from './charts.js';
import * as exporter from './export.js';

// Variável global para armazenar os resultados da última simulação calculada
let currentSimulationResult = null;
let currentSimulationType = null;
let currentSimulationName = null;

document.addEventListener('DOMContentLoaded', function() {
    // Inicialização da aplicação (agora usa storage.js)
    initApp();

    // Configuração de eventos
    setupEventListeners();

    // Carregamento de dados salvos (agora usa storage.js)
    loadSavedData();
});

// Inicialização da aplicação
function initApp() {
    console.log('Aplicação de Análise Imobiliária inicializada');
    // storage.js já chama initializeStorage() ao ser carregado
    if (!storage.isStorageAvailable()) {
        alert("Atenção: O armazenamento local não está disponível ou habilitado. Funcionalidades de salvar e carregar podem não funcionar.");
    }
    // Mostrar a página inicial por padrão
    showContent('home-content');
}

// Configuração de ouvintes de eventos
function setupEventListeners() {
    // Navegação principal
    document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); showContent('home-content'); updateActiveNavItem(e.target); });
    document.getElementById('nav-new-simulation').addEventListener('click', (e) => { e.preventDefault(); showContent('new-simulation-content'); updateActiveNavItem(e.target); });
    document.getElementById('nav-scenarios').addEventListener('click', (e) => { e.preventDefault(); showContent('scenarios-content'); updateActiveNavItem(e.target); loadScenarios(); }); // Carrega cenários ao visitar a página
    document.getElementById('nav-studies').addEventListener('click', (e) => { e.preventDefault(); showContent('studies-content'); updateActiveNavItem(e.target); loadStudies(); }); // Carrega estudos ao visitar a página

    // Botão de ajuda
    document.getElementById('btn-help').addEventListener('click', () => {
        const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
        helpModal.show();
    });

    // Botões de nova simulação na página inicial
    document.querySelectorAll('[data-simulation-type]').forEach(button => {
        button.addEventListener('click', function() {
            const simulationType = this.getAttribute('data-simulation-type');
            showContent('new-simulation-content');
            const tabId = `${simulationType}-tab`;
            const tab = document.getElementById(tabId);
            if (tab) {
                const tabInstance = new bootstrap.Tab(tab);
                tabInstance.show();
            }
            updateActiveNavItem(document.getElementById('nav-new-simulation'));
        });
    });

    // Formulários de simulação
    setupSimulationForms();

    // Botões de cenários
    setupScenarioButtons();

    // Botões de estudos
    setupStudyButtons();

    // Botões de resultado da simulação
    document.getElementById('save-simulation-btn').addEventListener('click', saveCurrentSimulation);
    document.getElementById('export-simulation-btn').addEventListener('click', exportCurrentSimulation);
}

// Configuração de formulários de simulação
function setupSimulationForms() {
    const forms = {
        'cash': { id: 'cash-simulation-form', handler: handleCashSimulationSubmit },
        'financing': { id: 'financing-simulation-form', handler: handleFinancingSimulationSubmit },
        'consortium': { id: 'consortium-simulation-form', handler: handleConsortiumSimulationSubmit },
        'rent': { id: 'rent-simulation-form', handler: handleRentSimulationSubmit },
        'loan': { id: 'loan-simulation-form', handler: handleLoanSimulationSubmit }, // Placeholder
        'amortization': { id: 'amortization-simulation-form', handler: handleAmortizationSimulationSubmit }
    };

    for (const type in forms) {
        const formElement = document.getElementById(forms[type].id);
        if (formElement) {
            formElement.addEventListener('submit', forms[type].handler);
            // Botão de reset
            const resetButton = document.getElementById(`${type}-reset-btn`);
            if (resetButton) {
                resetButton.addEventListener('click', () => formElement.reset());
            }
        }
    }

    // Checkbox FGTS no formulário de financiamento
    const fgtsCheckbox = document.getElementById('financing-fgts-checkbox');
    const fgtsValueInput = document.getElementById('financing-fgts-value');
    if (fgtsCheckbox && fgtsValueInput) {
        fgtsCheckbox.addEventListener('change', function() {
            fgtsValueInput.disabled = !this.checked;
            if (!this.checked) {
                fgtsValueInput.value = ''; // Limpa o valor se desmarcado
            }
        });
        // Inicializa desabilitado
        fgtsValueInput.disabled = !fgtsCheckbox.checked;
    }
}

// Configuração de botões de cenários
function setupScenarioButtons() {
    const newScenarioBtn = document.getElementById('new-scenario-btn');
    const createFirstScenarioBtn = document.getElementById('create-first-scenario-btn');
    const saveNewScenarioBtn = document.getElementById('save-new-scenario-btn');
    const newScenarioModalEl = document.getElementById('newScenarioModal');

    if (newScenarioBtn) newScenarioBtn.addEventListener('click', () => { new bootstrap.Modal(newScenarioModalEl).show(); });
    if (createFirstScenarioBtn) createFirstScenarioBtn.addEventListener('click', () => { new bootstrap.Modal(newScenarioModalEl).show(); });
    if (saveNewScenarioBtn) saveNewScenarioBtn.addEventListener('click', saveNewScenario);
}

// Configuração de botões de estudos
function setupStudyButtons() {
    const newStudyBtn = document.getElementById('new-study-btn');
    const createFirstStudyBtn = document.getElementById('create-first-study-btn');
    const saveNewStudyBtn = document.getElementById('save-new-study-btn');
    const newStudyModalEl = document.getElementById('newStudyModal');

    if (newStudyBtn) newStudyBtn.addEventListener('click', () => { new bootstrap.Modal(newStudyModalEl).show(); });
    if (createFirstStudyBtn) createFirstStudyBtn.addEventListener('click', () => { new bootstrap.Modal(newStudyModalEl).show(); });
    if (saveNewStudyBtn) saveNewStudyBtn.addEventListener('click', saveNewStudy);
}

// --- Handlers de Submissão de Formulários ---

function getFormValues(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const values = {};
    for (let [key, value] of formData.entries()) {
        // Converte para número se apropriado (simplificado)
        const inputElement = form.querySelector(`[name="${key}"]`);
        if (inputElement && inputElement.type === 'number') {
            values[key] = parseFloat(value) || 0;
        } else if (inputElement && inputElement.type === 'radio') {
            if (inputElement.checked) {
                values[key] = value;
            }
        } else {
            values[key] = value;
        }
    }
    return values;
}

function handleCashSimulationSubmit(event) {
    event.preventDefault();
    console.log('Calculando simulação de compra à vista...');
    const formValues = getFormValues('cash-simulation-form');
    currentSimulationName = formValues['cash-simulation-name'];
    currentSimulationType = 'cashPurchase';

    try {
        const params = {
            propertyValue: formValues['cash-property-value'],
            acquisitionCosts: formValues['cash-acquisition-costs'],
            maintenanceCosts: formValues['cash-maintenance-costs'],
            timeHorizon: formValues['cash-time-horizon'],
            alternativeInvestmentReturn: (formValues['cash-investment-return'] || 0) / 100,
            projectedInflation: (formValues['cash-inflation'] || 0) / 100,
            projectedAppreciation: (formValues['cash-appreciation'] || 0) / 100
        };
        currentSimulationResult = calc.calculateCashPurchase(params);
        console.log("Resultado Compra à Vista:", currentSimulationResult);
        displaySimulationResults(currentSimulationResult, currentSimulationType);
    } catch (error) {
        console.error("Erro ao calcular compra à vista:", error);
        alert(`Erro ao calcular: ${error.message}`);
        hideSimulationResults();
    }
}

function handleFinancingSimulationSubmit(event) {
    event.preventDefault();
    console.log('Calculando simulação de financiamento...');
    const formValues = getFormValues('financing-simulation-form');
    currentSimulationName = formValues['financing-simulation-name'];
    currentSimulationType = 'financing';

    try {
        const annualInterestRate = (formValues['financing-interest-rate'] || 0) / 100;
        const monthlyInterestRate = calc.annualToMonthlyRate(annualInterestRate);

        const params = {
            propertyValue: formValues['financing-property-value'],
            downPayment: formValues['financing-down-payment'],
            loanTerm: formValues['financing-term'],
            interestRate: monthlyInterestRate,
            amortizationSystem: formValues['financing-amortization-system'].toUpperCase(),
            acquisitionCosts: formValues['financing-acquisition-costs'],
            monthlyIncome: formValues['financing-monthly-income'],
            fgtsValue: formValues['financing-fgts-checkbox'] === 'on' ? formValues['financing-fgts-value'] : 0,
            projectedInflation: (formValues['financing-inflation'] || 0) / 100,
            projectedAppreciation: (formValues['financing-appreciation'] || 0) / 100
            // Adicionar outros custos como seguro, taxas, se presentes no form
        };
        currentSimulationResult = calc.calculateFinancing(params);
        console.log("Resultado Financiamento:", currentSimulationResult);
        displaySimulationResults(currentSimulationResult, currentSimulationType);
    } catch (error) {
        console.error("Erro ao calcular financiamento:", error);
        alert(`Erro ao calcular: ${error.message}`);
        hideSimulationResults();
    }
}

function handleConsortiumSimulationSubmit(event) {
    event.preventDefault();
    console.log('Calculando simulação de consórcio...');
    const formValues = getFormValues('consortium-simulation-form');
    currentSimulationName = formValues['consortium-simulation-name'];
    currentSimulationType = 'consortium';

    try {
        const params = {
            creditValue: formValues['consortium-credit-value'],
            term: formValues['consortium-term'],
            administrationFeeRate: (formValues['consortium-admin-fee'] || 0) / 100,
            reserveFundRate: (formValues['consortium-reserve-fund'] || 0) / 100,
            insuranceRate: (formValues['consortium-insurance-rate'] || 0) / 100, // Assumindo taxa mensal
            bidValue: formValues['consortium-bid-value'] || 0,
            // bidPaymentMethod: formValues['consortium-bid-payment'], // Se necessário
            projectedInflation: (formValues['consortium-inflation'] || 0) / 100,
            projectedAppreciation: (formValues['consortium-appreciation'] || 0) / 100
        };
        currentSimulationResult = calc.calculateConsortium(params);
        console.log("Resultado Consórcio:", currentSimulationResult);
        displaySimulationResults(currentSimulationResult, currentSimulationType);
    } catch (error) {
        console.error("Erro ao calcular consórcio:", error);
        alert(`Erro ao calcular: ${error.message}`);
        hideSimulationResults();
    }
}

function handleRentSimulationSubmit(event) {
    event.preventDefault();
    console.log('Calculando simulação de aluguel...');
    const formValues = getFormValues('rent-simulation-form');
    currentSimulationName = formValues['rent-simulation-name'];
    currentSimulationType = 'rent';

    try {
        const params = {
            monthlyRent: formValues['rent-monthly-value'],
            annualAdjustmentRate: (formValues['rent-adjustment-rate'] || 0) / 100,
            timeHorizon: formValues['rent-time-horizon'],
            depositValue: formValues['rent-deposit-value'] || 0,
            insuranceCost: formValues['rent-insurance-cost'] || 0, // Anual
            administrationFee: formValues['rent-admin-fee'] || 0, // Mensal
            propertyTax: formValues['rent-property-tax'] || 0, // Anual
            condominiumFee: formValues['rent-condo-fee'] || 0, // Mensal
            availableInvestment: formValues['rent-available-investment'] || 0,
            investmentReturn: (formValues['rent-investment-return'] || 0) / 100,
            projectedInflation: (formValues['rent-inflation'] || 0) / 100
        };
        currentSimulationResult = calc.calculateRent(params);
        console.log("Resultado Aluguel:", currentSimulationResult);
        displaySimulationResults(currentSimulationResult, currentSimulationType);
    } catch (error) {
        console.error("Erro ao calcular aluguel:", error);
        alert(`Erro ao calcular: ${error.message}`);
        hideSimulationResults();
    }
}

function handleLoanSimulationSubmit(event) {
    event.preventDefault();
    console.log('Calculando simulação de outros empréstimos...');
    alert('Funcionalidade de cálculo para outros empréstimos ainda não implementada.');
    // const formValues = getFormValues('loan-simulation-form');
    // currentSimulationName = formValues['loan-simulation-name'];
    // currentSimulationType = 'loan';
    // Implementar chamada à função de cálculo correspondente quando existir
    // currentSimulationResult = calc.calculateOtherLoan(...);
    // displaySimulationResults(currentSimulationResult, currentSimulationType);
    hideSimulationResults();
}

function handleAmortizationSimulationSubmit(event) {
    event.preventDefault();
    console.log('Calculando simulação de amortização...');
    const formValues = getFormValues('amortization-simulation-form');
    currentSimulationName = formValues['amortization-simulation-name'];
    currentSimulationType = 'amortization';

    try {
        const annualInterestRate = (formValues['amortization-interest-rate'] || 0) / 100;
        const monthlyInterestRate = calc.annualToMonthlyRate(annualInterestRate);
        const amortizationOption = document.querySelector('input[name="amortization-option"]:checked').value;

        const params = {
            currentBalance: formValues['amortization-current-balance'],
            amortizationValue: formValues['amortization-value'],
            interestRate: monthlyInterestRate,
            remainingTerm: formValues['amortization-remaining-term'],
            currentPayment: formValues['amortization-current-installment'],
            amortizationSystem: formValues['amortization-system'].toUpperCase(),
            amortizationType: amortizationOption === 'term' ? 'reduceTerm' : 'reducePayment' // Simplificado, 'custom' não tratado aqui
        };
        currentSimulationResult = calc.calculateAmortizationImpact(params);
        console.log("Resultado Amortização:", currentSimulationResult);
        displaySimulationResults(currentSimulationResult, currentSimulationType);
    } catch (error) {
        console.error("Erro ao calcular amortização:", error);
        alert(`Erro ao calcular: ${error.message}`);
        hideSimulationResults();
    }
}

// --- Funções de Exibição de Resultados ---

function displaySimulationResults(result, type) {
    const resultsContainer = document.getElementById('simulation-results');
    const summaryContent = document.getElementById('summary-content');
    const evolutionTableContainer = document.getElementById('evolution-table');

    summaryContent.innerHTML = ''; // Limpa conteúdo anterior
    evolutionTableContainer.innerHTML = ''; // Limpa tabela anterior
    // Limpar gráficos anteriores
    charts.destroyChart('balance-chart');
    charts.destroyChart('installment-chart');
    charts.destroyChart('equity-chart'); // Assumindo que existe
    charts.destroyChart('cost-chart'); // Assumindo que existe

    if (!result) {
        summaryContent.innerHTML = '<div class="alert alert-danger">Erro ao gerar resultados.</div>';
        resultsContainer.classList.remove('d-none');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // Aba Resumo (Conteúdo varia por tipo)
    summaryContent.appendChild(createSummaryElement(result, type));

    // Aba Evolução (Tabela)
    const evolutionTableData = result.amortizationTable || result.evolutionTable;
    if (evolutionTableData && evolutionTableData.length > 0) {
        evolutionTableContainer.appendChild(createEvolutionTable(evolutionTableData, type));
        document.getElementById('evolution-tab').parentElement.classList.remove('d-none');
    } else {
        document.getElementById('evolution-tab').parentElement.classList.add('d-none');
    }

    // Aba Gráficos
    generateResultCharts(result, type);
    document.getElementById('charts-tab').parentElement.classList.remove('d-none');

    // Aba Sensibilidade (Placeholder)
    // document.getElementById('sensitivity-tab').parentElement.classList.remove('d-none');
    document.getElementById('sensitivity-tab').parentElement.classList.add('d-none'); // Oculta por enquanto

    // Mostrar área de resultados e rolar
    resultsContainer.classList.remove('d-none');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });

    // Ativar a primeira aba (Resumo)
    const summaryTab = document.getElementById('summary-tab');
    if (summaryTab) {
        const tabInstance = new bootstrap.Tab(summaryTab);
        tabInstance.show();
    }
}

function hideSimulationResults() {
    document.getElementById('simulation-results').classList.add('d-none');
    currentSimulationResult = null;
    currentSimulationType = null;
    currentSimulationName = null;
}

function createSummaryElement(result, type) {
    const div = document.createElement('div');
    let content = `<h5 class="mb-3">Resumo da Simulação: ${currentSimulationName || 'Sem nome'} (${type.toUpperCase()})</h5>`;

    // Adapte o resumo para cada tipo de simulação
    switch (type) {
        case 'cashPurchase':
            content += `
                <p><strong>Custo Total de Aquisição:</strong> ${charts.formatCurrency(result.totalAcquisitionCost)}</p>
                <p><strong>Valor Futuro Estimado do Imóvel (${result.details?.timeHorizon || '?'} anos):</strong> ${charts.formatCurrency(result.futurePropertyValue)}</p>
                <p><strong>Custos de Manutenção Acumulados:</strong> ${charts.formatCurrency(result.accumulatedMaintenanceCosts)}</p>
                <p><strong>Custo de Oportunidade do Capital:</strong> ${charts.formatCurrency(result.opportunityCost)}</p>
                <p><strong>Resultado Líquido Estimado:</strong> <span class="${result.netResult >= 0 ? 'text-success' : 'text-danger'}">${charts.formatCurrency(result.netResult)}</span></p>
            `;
            break;
        case 'financing':
            content += `
                <p><strong>Valor Financiado:</strong> ${charts.formatCurrency(result.loanAmount)}</p>
                <p><strong>Parcela ${result.amortizationSystem === 'PRICE' ? 'Fixa' : 'Inicial'}:</strong> ${charts.formatCurrency(result.monthlyPayment || result.initialPayment)} ${result.isAffordable ? '<span class="badge bg-success">Cabe no Orçamento</span>' : '<span class="badge bg-warning">Acima de 30% da Renda</span>'}</p>
                <p><strong>Total Pago (Financiamento):</strong> ${charts.formatCurrency(result.totalPayment)}</p>
                <p><strong>Total de Juros Pagos:</strong> ${charts.formatCurrency(result.totalInterest)}</p>
                <p><strong>Custo Total (Entrada + Financiamento + Custos):</strong> ${charts.formatCurrency(result.totalCost)}</p>
                <p><strong>Valor Futuro Estimado do Imóvel (${result.loanTerm / 12} anos):</strong> ${charts.formatCurrency(result.futurePropertyValue)}</p>
                <p><strong>Resultado Líquido Estimado:</strong> <span class="${result.netResult >= 0 ? 'text-success' : 'text-danger'}">${charts.formatCurrency(result.netResult)}</span></p>
            `;
            break;
        case 'consortium':
             content += `
                <p><strong>Valor da Carta de Crédito:</strong> ${charts.formatCurrency(result.details?.creditValue || result.totalCommonFund)}</p>
                <p><strong>Prazo:</strong> ${result.details?.term || '?'} meses</p>
                <p><strong>Parcela Mensal Média:</strong> ${charts.formatCurrency(result.monthlyPayment)}</p>
                <p><strong>Custo Total (Parcelas + Taxas):</strong> ${charts.formatCurrency(result.totalCost)}</p>
                <p><strong>Custo Efetivo Total (% sobre o crédito):</strong> ${charts.formatPercentage(result.effectiveCost)}</p>
                <p><strong>Mês Estimado de Contemplação (Simplificado):</strong> ${result.contemplationMonth || 'Não calculado'}</p>
                <p><strong>Valor Futuro Estimado do Imóvel (${(result.details?.term || 0) / 12} anos):</strong> ${charts.formatCurrency(result.futurePropertyValue)}</p>
                <p><strong>Resultado Líquido Estimado (sem lance):</strong> <span class="${result.netResult >= 0 ? 'text-success' : 'text-danger'}">${charts.formatCurrency(result.netResult)}</span></p>
            `;
            break;
        case 'rent':
            content += `
                <p><strong>Custo Total com Aluguel (${result.details?.timeHorizon || '?'} anos):</strong> ${charts.formatCurrency(result.totalCost)}</p>
                <p><strong>Total Apenas Aluguel Pago:</strong> ${charts.formatCurrency(result.totalRentPaid)}</p>
                <p><strong>Total Custos Adicionais (Condo, IPTU, etc.):</strong> ${charts.formatCurrency(result.totalAdditionalCosts)}</p>
                <p><strong>Valor Futuro do Investimento Alternativo:</strong> ${charts.formatCurrency(result.futureInvestmentValue)}</p>
                <p><strong>Ganho com Investimento:</strong> ${charts.formatCurrency(result.investmentGain)}</p>
                <p><strong>Resultado Líquido (Investimento - Custo Total):</strong> <span class="${result.netResult >= 0 ? 'text-success' : 'text-danger'}">${charts.formatCurrency(result.netResult)}</span></p>
            `;
            break;
        case 'amortization':
            content += `
                <p><strong>Saldo Devedor Original:</strong> ${charts.formatCurrency(result.originalBalance)}</p>
                <p><strong>Valor Amortizado:</strong> ${charts.formatCurrency(result.amortizationValue)}</p>
                <p><strong>Novo Saldo Devedor:</strong> ${charts.formatCurrency(result.newBalance)}</p>
                <hr>
                <p><strong>Prazo Original:</strong> ${result.originalTerm} meses | <strong>Novo Prazo:</strong> ${result.newTerm} meses (<span class="${result.termReduction >= 0 ? 'text-success' : 'text-danger'}">${result.termReduction} meses</span>)</p>
                <p><strong>Parcela Original:</strong> ${charts.formatCurrency(result.originalPayment)} | <strong>Nova Parcela:</strong> ${charts.formatCurrency(result.newPayment)} (<span class="${result.paymentReduction >= 0 ? 'text-success' : 'text-danger'}">${charts.formatCurrency(result.paymentReduction)}</span>)</p>
                <hr>
                <p><strong>Economia Estimada de Juros:</strong> <span class="text-success">${charts.formatCurrency(result.interestSavings)}</span></p>
            `;
            break;
        default:
            content += '<p>Resumo não disponível para este tipo de simulação.</p>';
    }
    div.innerHTML = content;
    return div;
}

function createEvolutionTable(tableData, type) {
    const table = document.createElement('table');
    table.className = 'table table-striped table-hover table-sm small'; // Compact table
    const thead = table.createTHead();
    const tbody = table.createTBody();
    const headerRow = thead.insertRow();

    // Definir cabeçalhos com base no tipo e nas chaves dos dados
    let headers = [];
    if (type === 'financing' || type === 'amortization') {
        headers = ['Mês', 'Parcela', 'Juros', 'Amortização', 'Saldo Devedor'];
    } else if (type === 'consortium') {
        headers = ['Mês', 'Parcela', 'Fundo Comum', 'Tx. Admin', 'Fundo Reserva', 'Seguro', 'Fundo Acumulado'];
    } else if (type === 'rent') {
        headers = ['Ano', 'Aluguel Mensal', 'Aluguel Anual', 'Custos Anuais', 'Custo Total Anual', 'Custo Acumulado'];
    } else if (tableData.length > 0) {
        // Fallback: usar chaves do primeiro objeto
        headers = Object.keys(tableData[0]);
    }

    // Criar cabeçalho da tabela
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.scope = 'col';
        headerRow.appendChild(th);
    });

    // Preencher corpo da tabela
    tableData.forEach(rowData => {
        const row = tbody.insertRow();
        headers.forEach(headerKey => {
            const cell = row.insertCell();
            let key = headerKey.toLowerCase().replace(/ /g, '').replace('ç', 'c').replace('ã', 'a'); // Mapeamento simples
            // Mapeamentos específicos para consistência
            if (key === 'mês') key = 'month';
            if (key === 'parcela') key = 'payment';
            if (key === 'juros') key = 'interest';
            if (key === 'amortização' || key === 'amortizacao') key = 'amortization';
            if (key === 'saldodevedor') key = 'remainingBalance';
            if (key === 'fundocomum') key = 'commonFund';
            if (key === 'tx.admin') key = 'adminFee';
            if (key === 'fundoreserva') key = 'reserveFund';
            if (key === 'seguro') key = 'insurance';
            if (key === 'fundoacumulado') key = 'accumulatedFund';
            if (key === 'ano') key = 'year';
            if (key === 'aluguelmensal') key = 'monthlyRent';
            if (key === 'aluguelanual') key = 'annualRent';
            if (key === 'custosanuais') key = 'annualTotalCost'; // Pode precisar de ajuste
            if (key === 'custototalanual') key = 'annualTotalCost';
            if (key === 'custoacumulado') key = 'cumulativeTotalCost';

            let value = rowData[key];

            // Formatar valores numéricos como moeda (exceto mês/ano/prazo)
            if (typeof value === 'number' && key !== 'month' && key !== 'year' && key !== 'term' && key !== 'remainingTerm') {
                cell.textContent = charts.formatCurrency(value);
                cell.style.textAlign = 'right';
            } else {
                cell.textContent = value !== undefined && value !== null ? value : '-';
            }
        });
    });

    return table;
}

function generateResultCharts(result, type) {
    // Gerar gráficos com base no tipo de simulação
    if (!result) return;

    if ((type === 'financing' || type === 'amortization') && result.amortizationTable) {
        charts.createBalanceEvolutionChart('balance-chart', result.amortizationTable);
        charts.createPaymentCompositionChart('installment-chart', result.amortizationTable, result.amortizationSystem || 'N/A');
    } else if (type === 'rent' && result.evolutionTable) {
        // Gráfico específico para aluguel vs investimento
        charts.createRentVsInvestmentChart('balance-chart', result); // Reutiliza o primeiro canvas
        // Ocultar ou mostrar outros gráficos conforme necessário
        document.getElementById('installment-chart').parentElement.parentElement.style.display = 'none';
    } else {
        // Limpar ou mostrar gráficos padrão/placeholders se não houver dados específicos
        charts.destroyChart('balance-chart');
        charts.destroyChart('installment-chart');
        // Poderia mostrar um gráfico de custo total ou resultado líquido aqui
    }
    // Adicionar lógica para outros gráficos (equity-chart, cost-chart) se necessário
}

// --- Funções de Armazenamento (usando storage.js) ---

function saveCurrentSimulation() {
    if (!currentSimulationResult || !currentSimulationType || !currentSimulationName) {
        alert("Nenhuma simulação calculada para salvar ou nome não definido.");
        return;
    }

    const simulationData = {
        name: currentSimulationName,
        type: currentSimulationType,
        // Incluir os parâmetros de entrada usados para o cálculo
        // inputParams: { ... }, // Coletar do formulário novamente ou armazenar
        result: currentSimulationResult,
        // id, createdAt, updatedAt serão adicionados por storage.js
    };

    const savedId = storage.saveSimulation(simulationData);

    if (savedId) {
        alert(`Simulação '${currentSimulationName}' salva com sucesso!`);
        loadRecentSimulations(); // Atualiza a lista na sidebar
    } else {
        alert("Erro ao salvar a simulação.");
    }
}

function saveNewScenario() {
    const form = document.getElementById('new-scenario-form');
    const name = form.querySelector('#new-scenario-name').value;
    const description = form.querySelector('#new-scenario-description').value;

    if (!name) {
        alert("Por favor, informe um nome para o cenário.");
        return;
    }

    const scenarioData = {
        name: name,
        description: description,
        simulationIds: [] // Simulações serão adicionadas depois
    };

    const savedId = storage.saveScenario(scenarioData);

    if (savedId) {
        alert(`Cenário '${name}' criado com sucesso! Adicione simulações a ele.`);
        const modal = bootstrap.Modal.getInstance(document.getElementById('newScenarioModal'));
        if (modal) modal.hide();
        form.reset();
        loadScenarios(); // Atualiza a lista na página de cenários
    } else {
        alert("Erro ao salvar o cenário.");
    }
}

function saveNewStudy() {
    const form = document.getElementById('new-study-form');
    const name = form.querySelector('#new-study-name').value;
    const description = form.querySelector('#new-study-description').value;

    if (!name) {
        alert("Por favor, informe um nome para o estudo.");
        return;
    }

    const studyData = {
        name: name,
        description: description,
        scenarioIds: [] // Cenários serão adicionados depois
    };

    const savedId = storage.saveStudy(studyData);

    if (savedId) {
        alert(`Estudo '${name}' criado com sucesso! Adicione cenários a ele.`);
        const modal = bootstrap.Modal.getInstance(document.getElementById('newStudyModal'));
        if (modal) modal.hide();
        form.reset();
        loadStudies(); // Atualiza a lista na página de estudos
    } else {
        alert("Erro ao salvar o estudo.");
    }
}

function loadSavedData() {
    console.log('Carregando dados salvos...');
    loadRecentSimulations();
    loadScenarios();
    loadStudies();
}

function loadRecentSimulations() {
    const recentSims = storage.getRecentSimulations(5);
    const listContainer = document.getElementById('recent-simulations');
    const homeListContainer = document.getElementById('recent-simulations-home');
    const noSimsMessage = document.getElementById('no-simulations');

    listContainer.innerHTML = ''; // Limpa lista antiga
    if (homeListContainer) homeListContainer.innerHTML = '';

    if (recentSims.length > 0) {
        if (noSimsMessage) noSimsMessage.classList.add('d-none');
        if (homeListContainer) homeListContainer.classList.remove('d-none');

        recentSims.forEach(sim => {
            const date = new Date(sim.updatedAt || sim.createdAt).toLocaleDateString('pt-BR');
            const itemHTML = `
                <a href="#" class="list-group-item list-group-item-action" data-sim-id="${sim.id}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${sim.name}</h6>
                        <small class="text-muted">${date}</small>
                    </div>
                    <p class="mb-1 small">Tipo: ${sim.type}</p>
                </a>`;
            listContainer.innerHTML += itemHTML;
            if (homeListContainer) homeListContainer.innerHTML += itemHTML;
        });
        // Adicionar event listener para carregar simulação ao clicar
        listContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                loadSimulation(link.dataset.simId);
            });
        });
         if (homeListContainer) {
             homeListContainer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadSimulation(link.dataset.simId);
                });
            });
         }

    } else {
        if (noSimsMessage) noSimsMessage.classList.remove('d-none');
        if (homeListContainer) homeListContainer.classList.add('d-none');
        listContainer.innerHTML = '<li class="list-group-item">Nenhuma simulação recente.</li>';
    }
}

function loadScenarios() {
    const scenarios = storage.getAllScenarios();
    const listContainer = document.getElementById('saved-scenarios'); // Sidebar
    const mainListContainer = document.getElementById('scenarios-list'); // Main content
    const noScenariosMessage = document.getElementById('no-scenarios');

    if (listContainer) listContainer.innerHTML = '';
    if (mainListContainer) mainListContainer.innerHTML = '';

    if (scenarios.length > 0) {
        if (noScenariosMessage) noScenariosMessage.classList.add('d-none');
        if (mainListContainer) mainListContainer.classList.remove('d-none');

        scenarios.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)); // Ordena recentes primeiro

        scenarios.forEach(scenario => {
            const date = new Date(scenario.updatedAt || scenario.createdAt).toLocaleDateString('pt-BR');
            const simulationsCount = scenario.simulationIds ? scenario.simulationIds.length : 0;
            const itemHTML = `
                <a href="#" class="list-group-item list-group-item-action" data-scenario-id="${scenario.id}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${scenario.name}</h6>
                        <small class="text-muted">${date}</small>
                    </div>
                    <p class="mb-1 small">${scenario.description || 'Sem descrição'}</p>
                    <small>${simulationsCount} simulações</small>
                </a>`;
            if (listContainer) listContainer.innerHTML += itemHTML;
            // Adicionar ao container principal também (formato pode ser diferente, ex: cards)
            if (mainListContainer) {
                 mainListContainer.innerHTML += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">${scenario.name}</h5>
                                <h6 class="card-subtitle mb-2 text-muted">Atualizado em: ${date}</h6>
                                <p class="card-text">${scenario.description || 'Sem descrição'}</p>
                                <p class="card-text"><small class="text-muted">${simulationsCount} simulações</small></p>
                                <button class="btn btn-sm btn-outline-primary me-2" onclick="viewScenario('${scenario.id}')">Visualizar</button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteScenario('${scenario.id}')">Excluir</button>
                            </div>
                        </div>
                    </div>`;
            }
        });
        // Adicionar event listener para carregar cenário ao clicar (sidebar)
        if (listContainer) {
            listContainer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    viewScenario(link.dataset.scenarioId);
                });
            });
        }

    } else {
        if (noScenariosMessage) noScenariosMessage.classList.remove('d-none');
        if (mainListContainer) mainListContainer.classList.add('d-none');
        if (listContainer) listContainer.innerHTML = '<li class="list-group-item">Nenhum cenário salvo.</li>';
    }
}

function loadStudies() {
    const studies = storage.getAllStudies();
    const listContainer = document.getElementById('saved-studies'); // Sidebar
    const mainListContainer = document.getElementById('studies-list'); // Main content
    const noStudiesMessage = document.getElementById('no-studies');

    if (listContainer) listContainer.innerHTML = '';
    if (mainListContainer) mainListContainer.innerHTML = '';

    if (studies.length > 0) {
        if (noStudiesMessage) noStudiesMessage.classList.add('d-none');
        if (mainListContainer) mainListContainer.classList.remove('d-none');

        studies.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)); // Ordena recentes primeiro

        studies.forEach(study => {
            const date = new Date(study.updatedAt || study.createdAt).toLocaleDateString('pt-BR');
            const scenariosCount = study.scenarioIds ? study.scenarioIds.length : 0;
            const itemHTML = `
                <a href="#" class="list-group-item list-group-item-action" data-study-id="${study.id}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${study.name}</h6>
                        <small class="text-muted">${date}</small>
                    </div>
                    <p class="mb-1 small">${study.description || 'Sem descrição'}</p>
                    <small>${scenariosCount} cenários</small>
                </a>`;
            if (listContainer) listContainer.innerHTML += itemHTML;
            // Adicionar ao container principal
             if (mainListContainer) {
                 mainListContainer.innerHTML += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">${study.name}</h5>
                                <h6 class="card-subtitle mb-2 text-muted">Atualizado em: ${date}</h6>
                                <p class="card-text">${study.description || 'Sem descrição'}</p>
                                <p class="card-text"><small class="text-muted">${scenariosCount} cenários</small></p>
                                <button class="btn btn-sm btn-outline-primary me-2" onclick="viewStudy('${study.id}')">Visualizar</button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteStudy('${study.id}')">Excluir</button>
                            </div>
                        </div>
                    </div>`;
            }
        });
         // Adicionar event listener para carregar estudo ao clicar (sidebar)
        if (listContainer) {
            listContainer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    viewStudy(link.dataset.studyId);
                });
            });
        }
    } else {
        if (noStudiesMessage) noStudiesMessage.classList.remove('d-none');
        if (mainListContainer) mainListContainer.classList.add('d-none');
        if (listContainer) listContainer.innerHTML = '<li class="list-group-item">Nenhum estudo salvo.</li>';
    }
}

function loadSimulation(simulationId) {
    const sim = storage.getSimulationById(simulationId);
    if (sim && sim.result) {
        console.log("Carregando simulação:", sim);
        currentSimulationResult = sim.result;
        currentSimulationType = sim.type;
        currentSimulationName = sim.name;
        // Navegar para a página de simulação e exibir resultados
        showContent('new-simulation-content');
        updateActiveNavItem(document.getElementById('nav-new-simulation'));
        // Preencher o formulário com os parâmetros (se armazenados)
        // fillFormWithParams(sim.inputParams, sim.type);
        displaySimulationResults(sim.result, sim.type);
        // Ativar a aba correta
        const tabId = `${sim.type}-tab`;
        const tab = document.getElementById(tabId);
        if (tab) {
            const tabInstance = new bootstrap.Tab(tab);
            tabInstance.show();
        }
    } else {
        alert("Erro ao carregar dados da simulação.");
    }
}

// Funções de visualização/exclusão (precisam ser globais ou usar event delegation)
window.viewScenario = function(scenarioId) {
    console.log("Visualizar cenário:", scenarioId);
    // Implementar lógica para mostrar detalhes do cenário e suas simulações
    alert("Visualização de cenário ainda não implementada.");
}

window.deleteScenario = function(scenarioId) {
    if (confirm("Tem certeza que deseja excluir este cenário?")) {
        if (storage.deleteScenario(scenarioId)) {
            alert("Cenário excluído com sucesso.");
            loadScenarios();
        } else {
            alert("Erro ao excluir cenário.");
        }
    }
}

window.viewStudy = function(studyId) {
    console.log("Visualizar estudo:", studyId);
    // Implementar lógica para mostrar detalhes do estudo e seus cenários
    alert("Visualização de estudo ainda não implementada.");
}

window.deleteStudy = function(studyId) {
    if (confirm("Tem certeza que deseja excluir este estudo?")) {
        if (storage.deleteStudy(studyId)) {
            alert("Estudo excluído com sucesso.");
            loadStudies();
        } else {
            alert("Erro ao excluir estudo.");
        }
    }
}

// --- Funções de Exportação (usando export.js) ---

function exportCurrentSimulation() {
    if (!currentSimulationResult || !currentSimulationType || !currentSimulationName) {
        alert("Nenhuma simulação calculada para exportar.");
        return;
    }

    // Oferecer opções de exportação (JSON, CSV, PDF, Imagem)
    // Simplificado: Exportar como JSON por padrão
    const exportData = {
        name: currentSimulationName,
        type: currentSimulationType,
        // inputParams: { ... }, // Idealmente incluir parâmetros
        result: currentSimulationResult
    };

    // Usar o módulo exporter
    exporter.exportToJson(exportData, `simulacao_${currentSimulationName.replace(/\s+/g, '_')}`);

    // TODO: Implementar um modal para escolher o formato de exportação
    // Exemplo para PDF (requer mais configuração):
    /*
    const reportConfig = {
        title: `Relatório da Simulação: ${currentSimulationName}`,
        filenameBase: `relatorio_${currentSimulationName.replace(/\s+/g, '_')}`,
        sections: [
            { type: 'text', content: `Tipo: ${currentSimulationType.toUpperCase()}` },
            { type: 'spacer', height: 10 },
            // Adicionar resumo como texto
            // { type: 'text', content: generateSummaryText(currentSimulationResult, currentSimulationType) },
            { type: 'spacer', height: 20 },
            // Adicionar tabela de evolução se existir
            // { type: 'table', title: 'Tabela de Evolução', tableId: 'evolution-table' }, // Precisa garantir que a tabela esteja visível no DOM
            { type: 'spacer', height: 20 },
            // Adicionar gráficos
            { type: 'chart', title: 'Gráfico de Saldo', canvasId: 'balance-chart' },
            { type: 'chart', title: 'Gráfico de Parcelas', canvasId: 'installment-chart' },
        ]
    };
    exporter.exportGenericReportToPdf(reportConfig);
    */

     // Exemplo para Imagem (Gráfico de Saldo)
     // exporter.exportChartToImage('balance-chart', `grafico_saldo_${currentSimulationName.replace(/\s+/g, '_')}`, 'png', { backgroundColor: '#FFFFFF' });

     // Exemplo para CSV (Tabela de Evolução)
     /*
     const evolutionData = currentSimulationResult.amortizationTable || currentSimulationResult.evolutionTable;
     if (evolutionData) {
         exporter.exportTableToCsv(evolutionData, `tabela_evolucao_${currentSimulationName.replace(/\s+/g, '_')}`);
     }
     */
}

// --- Funções Auxiliares ---

function showContent(contentId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const targetContent = document.getElementById(contentId);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

function updateActiveNavItem(activeItem) {
    document.querySelectorAll('.navbar-nav .nav-link').forEach(item => {
        item.classList.remove('active');
    });
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Função para preencher formulário (se necessário ao carregar simulação)
// function fillFormWithParams(params, type) { ... }

