// Inicialização de componentes Bootstrap e lógica da aplicação
document.addEventListener("DOMContentLoaded", function () {
    // Inicializar Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll("[data-bs-toggle=\"tooltip\"]"));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Navegação entre Abas do Formulário
    const formTabs = document.querySelectorAll("#formTabs button[data-bs-toggle=\"tab\"]");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const form = document.getElementById("calculadoraForm");

    function showTab(targetTabId) {
        formTabs.forEach((tab) => {
            const tabPaneId = tab.getAttribute("data-bs-target");
            const tabPane = document.querySelector(tabPaneId);
            if (tab.getAttribute("data-bs-target") === targetTabId) {
                tab.classList.add("active");
                tab.setAttribute("aria-selected", "true");
                if (tabPane) tabPane.classList.add("show", "active");
            } else {
                tab.classList.remove("active");
                tab.setAttribute("aria-selected", "false");
                if (tabPane) tabPane.classList.remove("show", "active");
            }
        });
    }

    // Botões de Navegação Próximo/Anterior
    document.getElementById("btnProximoFinanciamento")?.addEventListener("click", () => showTab("#financiamento"));
    document.getElementById("btnVoltarImovel")?.addEventListener("click", () => showTab("#imovel"));
    document.getElementById("btnProximoComprador")?.addEventListener("click", () => showTab("#comprador"));
    document.getElementById("btnVoltarFinanciamento")?.addEventListener("click", () => showTab("#financiamento"));
    document.getElementById("btnProximoCustos")?.addEventListener("click", () => showTab("#custos"));
    document.getElementById("btnVoltarComprador")?.addEventListener("click", () => showTab("#comprador"));

    // Lógica para exibir/ocultar opções do FGTS
    const usarFgtsSelect = document.getElementById("usarFgts");
    const fgtsOptionsDiv = document.getElementById("fgtsOptions");
    usarFgtsSelect?.addEventListener("change", function () {
        if (this.value === "sim") {
            fgtsOptionsDiv.style.display = "block";
        } else {
            fgtsOptionsDiv.style.display = "none";
        }
    });

    // Atualizar dinamicamente o "Valor a ser financiado"
    const valorImovelInput = document.getElementById("valorImovel");
    const valorEntradaInput = document.getElementById("valorEntrada");
    const valorFinanciadoSpan = document.getElementById("valorFinanciado");

    function atualizarValorFinanciado() {
        const valorImovel = parseFloat(valorImovelInput.value) || 0;
        const valorEntrada = parseFloat(valorEntradaInput.value) || 0;
        const financiado = valorImovel - valorEntrada;
        valorFinanciadoSpan.textContent = `R$ ${formatCurrency(financiado)}`;
        return financiado;
    }

    valorImovelInput?.addEventListener("input", atualizarValorFinanciado);
    valorEntradaInput?.addEventListener("input", atualizarValorFinanciado);
    atualizarValorFinanciado(); // Inicializa ao carregar

    // --- Funções de Cálculo Financeiro ---
    function formatCurrency(value) {
        return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function calcularSAC(valorFinanciado, taxaJurosAnual, prazoMeses, valorImovel, taxaMIPAnual, taxaDFIAnual) {
        const taxaJurosMensal = taxaJurosAnual / 100 / 12;
        const taxaMIPMensal = taxaMIPAnual / 100 / 12;
        const taxaDFIMensal = taxaDFIAnual / 100 / 12;
        const amortizacao = valorFinanciado / prazoMeses;
        const resultado = [];
        let saldoDevedor = valorFinanciado;
        let totalJuros = 0;
        let totalSeguros = 0;
        let totalPago = 0;

        for (let i = 1; i <= prazoMeses; i++) {
            const juros = saldoDevedor * taxaJurosMensal;
            const mip = saldoDevedor * taxaMIPMensal; // MIP sobre saldo devedor
            const dfi = valorImovel * taxaDFIMensal; // DFI sobre valor do imóvel
            const seguros = mip + dfi;
            const prestacao = amortizacao + juros + seguros;
            saldoDevedor -= amortizacao;
            // Correção para evitar saldo devedor negativo mínimo no final
            if (i === prazoMeses && Math.abs(saldoDevedor) < 0.01) {
                saldoDevedor = 0;
            }

            totalJuros += juros;
            totalSeguros += seguros;
            totalPago += prestacao;

            resultado.push({
                parcela: i,
                data: calcularDataParcela(i),
                prestacao: prestacao,
                amortizacao: amortizacao,
                juros: juros,
                mip: mip,
                dfi: dfi,
                correcao: 0, // Simplificado: sem correção monetária por enquanto
                saldoDevedor: saldoDevedor > 0 ? saldoDevedor : 0,
            });
        }

        return { parcelas: resultado, totalJuros, totalSeguros, totalPago };
    }

    function calcularPrice(valorFinanciado, taxaJurosAnual, prazoMeses, valorImovel, taxaMIPAnual, taxaDFIAnual) {
        const taxaJurosMensal = taxaJurosAnual / 100 / 12;
        const taxaMIPMensal = taxaMIPAnual / 100 / 12;
        const taxaDFIMensal = taxaDFIAnual / 100 / 12;
        const fator = Math.pow(1 + taxaJurosMensal, prazoMeses);
        const prestacaoBase = valorFinanciado * (taxaJurosMensal * fator) / (fator - 1);
        const resultado = [];
        let saldoDevedor = valorFinanciado;
        let totalJuros = 0;
        let totalSeguros = 0;
        let totalPago = 0;

        for (let i = 1; i <= prazoMeses; i++) {
            const juros = saldoDevedor * taxaJurosMensal;
            let amortizacao = prestacaoBase - juros;
            const mip = saldoDevedor * taxaMIPMensal;
            const dfi = valorImovel * taxaDFIMensal;
            const seguros = mip + dfi;
            let prestacaoTotal = prestacaoBase + seguros;

            // Ajuste na última parcela para zerar o saldo devedor
            if (i === prazoMeses) {
                amortizacao = saldoDevedor;
                prestacaoTotal = amortizacao + juros + seguros;
                saldoDevedor = 0;
            } else {
                 saldoDevedor -= amortizacao;
            }
            
            totalJuros += juros;
            totalSeguros += seguros;
            totalPago += prestacaoTotal;

            resultado.push({
                parcela: i,
                data: calcularDataParcela(i),
                prestacao: prestacaoTotal,
                amortizacao: amortizacao,
                juros: juros,
                mip: mip,
                dfi: dfi,
                correcao: 0, // Simplificado
                saldoDevedor: saldoDevedor > 0 ? saldoDevedor : 0,
            });
        }

        return { parcelas: resultado, totalJuros, totalSeguros, totalPago };
    }

    function calcularSACRE(valorFinanciado, taxaJurosAnual, prazoMeses, valorImovel, taxaMIPAnual, taxaDFIAnual) {
        // SACRE é mais complexo, requer recalculos periódicos. Implementação simplificada.
        // Usando SAC como fallback por enquanto.
        console.warn("Cálculo SACRE simplificado, usando SAC como base.");
        return calcularSAC(valorFinanciado, taxaJurosAnual, prazoMeses, valorImovel, taxaMIPAnual, taxaDFIAnual);
    }
    
    function calcularDataParcela(numeroParcela) {
        const dataInicioInput = document.getElementById("dataInicio");
        let dataBase = new Date(); // Usa data atual se não especificada
        if (dataInicioInput.value) {
            const [year, month, day] = dataInicioInput.value.split("-");
            dataBase = new Date(year, month - 1, day);
        }
        dataBase.setMonth(dataBase.getMonth() + numeroParcela);
        return dataBase.toLocaleDateString("pt-BR");
    }

    // --- Fim Funções de Cálculo ---

    // Botão Calcular (Implementação Real)
    const btnCalcular = document.getElementById("btnCalcular");
    const resultadosCard = document.getElementById("resultadosCard");
    const memoriaCalculoCard = document.getElementById("memoriaCalculoCard");
    const graficosCard = document.getElementById("graficosCard");
    const cenariosCard = document.getElementById("cenariosCard");
    const analiseCard = document.getElementById("analiseCard");
    const ferramentasCard = document.getElementById("ferramentasCard");
    const glossarioCard = document.getElementById("glossarioCard");
    
    let dadosCalculados = null; // Armazena os dados do último cálculo

    btnCalcular?.addEventListener("click", function (event) {
        event.preventDefault(); // Previne o envio do formulário
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        console.log("Iniciando cálculo real...");

        // Coleta de dados do formulário
        const valorImovel = parseFloat(valorImovelInput.value) || 0;
        const valorEntrada = parseFloat(valorEntradaInput.value) || 0;
        const valorFinanciado = valorImovel - valorEntrada;
        const sistemaAmortizacao = document.getElementById("sistemaAmortizacao").value;
        const taxaJurosAnual = parseFloat(document.getElementById("taxaJuros").value) || 0;
        const prazoMeses = parseInt(document.getElementById("prazoFinanciamento").value) || 0;
        const taxaMIPAnual = parseFloat(document.getElementById("taxaMIP").value) || 0;
        const taxaDFIAnual = parseFloat(document.getElementById("taxaDFI").value) || 0;
        const rendaFamiliar = parseFloat(document.getElementById("rendaFamiliar").value) || 0;
        // Outros custos (ainda não usados no cálculo principal, mas podem entrar no CET)
        const tarifaAvaliacao = parseFloat(document.getElementById("tarifaAvaliacao").value) || 0;
        const custosCartorarios = parseFloat(document.getElementById("custosCartorarios").value) || 0;
        const outrosCustos = parseFloat(document.getElementById("outrosCustos").value) || 0;

        if (valorFinanciado <= 0 || prazoMeses <= 0 || taxaJurosAnual < 0) {
            alert("Por favor, verifique os valores de imóvel, entrada, prazo e taxa de juros.");
            return;
        }

        // Seleciona a função de cálculo apropriada
        let calcularFn;
        switch (sistemaAmortizacao) {
            case "sac":
                calcularFn = calcularSAC;
                break;
            case "price":
                calcularFn = calcularPrice;
                break;
            case "sacre":
                calcularFn = calcularSACRE; // Usando fallback SAC por enquanto
                break;
            default:
                alert("Sistema de amortização inválido.");
                return;
        }

        // Executa o cálculo
        dadosCalculados = calcularFn(valorFinanciado, taxaJurosAnual, prazoMeses, valorImovel, taxaMIPAnual, taxaDFIAnual);

        if (!dadosCalculados || !dadosCalculados.parcelas || dadosCalculados.parcelas.length === 0) {
             alert("Erro ao calcular o financiamento. Verifique os dados.");
             return;
        }

        // Exibe os cards de resultado
        resultadosCard.style.display = "block";
        memoriaCalculoCard.style.display = "block";
        graficosCard.style.display = "block";
        cenariosCard.style.display = "block";
        analiseCard.style.display = "block";
        ferramentasCard.style.display = "block";
        glossarioCard.style.display = "block";

        // Preenche o Resumo do Financiamento
        const primeiraPrestacao = dadosCalculados.parcelas[0].prestacao;
        const comprometimentoRenda = rendaFamiliar > 0 ? (primeiraPrestacao / rendaFamiliar) * 100 : 0;
        
        document.getElementById("resultadoValorFinanciado").textContent = `R$ ${formatCurrency(valorFinanciado)}`;
        document.getElementById("resultadoPrimeiraPrestacao").textContent = `R$ ${formatCurrency(primeiraPrestacao)}`;
        document.getElementById("resultadoTotalJuros").textContent = `R$ ${formatCurrency(dadosCalculados.totalJuros)}`;
        document.getElementById("resultadoTotalSeguros").textContent = `R$ ${formatCurrency(dadosCalculados.totalSeguros)}`;
        // CET é complexo, precisa de cálculo de TIR. Usando placeholder.
        document.getElementById("resultadoCET").textContent = `N/A (Cálculo Pendente)`; 
        document.getElementById("resultadoComprometimento").textContent = `${comprometimentoRenda.toFixed(2)}%`;
        document.getElementById("resultadoValorFinal").textContent = `R$ ${formatCurrency(dadosCalculados.totalPago)}`;
        document.getElementById("resultadoPrazoTotal").textContent = `${prazoMeses} meses`;

        // Preenche a Tabela de Memória de Cálculo
        gerarTabelaMemoriaCalculo(dadosCalculados.parcelas);
        
        // TODO: Gerar Gráficos com Chart.js usando dadosCalculados.parcelas
        gerarGraficos(dadosCalculados.parcelas);

        // Rola a página para os resultados
        resultadosCard.scrollIntoView({ behavior: "smooth" });
    });
    
    // Função para gerar a Tabela de Memória de Cálculo com Paginação
    const tabelaBody = document.getElementById("tabelaMemoriaCalculoBody");
    const paginacaoContainer = document.getElementById("paginacaoTabela");
    const ITENS_POR_PAGINA = 12;
    let paginaAtual = 1;
    let parcelasPaginadas = [];

    function gerarTabelaMemoriaCalculo(parcelas) {
        parcelasPaginadas = parcelas;
        paginaAtual = 1;
        renderizarPaginaTabela();
        renderizarPaginacao();
    }

    function renderizarPaginaTabela() {
        tabelaBody.innerHTML = "";
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const parcelasDaPagina = parcelasPaginadas.slice(inicio, fim);

        parcelasDaPagina.forEach(p => {
            const row = `
                <tr>
                    <td>${p.parcela}</td>
                    <td>${p.data}</td>
                    <td>${formatCurrency(p.prestacao)}</td>
                    <td>${formatCurrency(p.amortizacao)}</td>
                    <td>${formatCurrency(p.juros)}</td>
                    <td>${formatCurrency(p.mip)}</td>
                    <td>${formatCurrency(p.dfi)}</td>
                    <td>${formatCurrency(p.correcao)}</td>
                    <td>${formatCurrency(p.saldoDevedor)}</td>
                </tr>
            `;
            tabelaBody.innerHTML += row;
        });
    }

    function renderizarPaginacao() {
        paginacaoContainer.innerHTML = "";
        const totalPaginas = Math.ceil(parcelasPaginadas.length / ITENS_POR_PAGINA);
        
        if (totalPaginas <= 1) return; // Não mostra paginação se for só 1 página

        // Botão Anterior
        const prevLi = document.createElement("li");
        prevLi.classList.add("page-item");
        if (paginaAtual === 1) prevLi.classList.add("disabled");
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="${paginaAtual - 1}">Anterior</a>`;
        paginacaoContainer.appendChild(prevLi);

        // Números das Páginas (simplificado para mostrar algumas páginas)
        let inicioPag = Math.max(1, paginaAtual - 2);
        let fimPag = Math.min(totalPaginas, paginaAtual + 2);

        if (inicioPag > 1) {
             const firstLi = document.createElement("li");
             firstLi.classList.add("page-item");
             firstLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
             paginacaoContainer.appendChild(firstLi);
             if (inicioPag > 2) {
                 const dotsLi = document.createElement("li");
                 dotsLi.classList.add("page-item", "disabled");
                 dotsLi.innerHTML = `<span class="page-link">...</span>`;
                 paginacaoContainer.appendChild(dotsLi);
             }
        }

        for (let i = inicioPag; i <= fimPag; i++) {
            const pageLi = document.createElement("li");
            pageLi.classList.add("page-item");
            if (i === paginaAtual) pageLi.classList.add("active");
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            paginacaoContainer.appendChild(pageLi);
        }
        
        if (fimPag < totalPaginas) {
             if (fimPag < totalPaginas - 1) {
                 const dotsLi = document.createElement("li");
                 dotsLi.classList.add("page-item", "disabled");
                 dotsLi.innerHTML = `<span class="page-link">...</span>`;
                 paginacaoContainer.appendChild(dotsLi);
             }
             const lastLi = document.createElement("li");
             lastLi.classList.add("page-item");
             lastLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPaginas}">${totalPaginas}</a>`;
             paginacaoContainer.appendChild(lastLi);
        }

        // Botão Próximo
        const nextLi = document.createElement("li");
        nextLi.classList.add("page-item");
        if (paginaAtual === totalPaginas) nextLi.classList.add("disabled");
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="${paginaAtual + 1}">Próximo</a>`;
        paginacaoContainer.appendChild(nextLi);

        // Adiciona listeners aos links da paginação
        paginacaoContainer.querySelectorAll(".page-link").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const targetPage = parseInt(e.target.getAttribute("data-page"));
                if (targetPage && targetPage !== paginaAtual && targetPage >= 1 && targetPage <= totalPaginas) {
                    paginaAtual = targetPage;
                    renderizarPaginaTabela();
                    renderizarPaginacao();
                    // Rola para o topo da tabela
                    memoriaCalculoCard.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        });
    }
    
    // --- Gráficos (Chart.js) ---
    let graficoSaldoDevedorChart = null;
    let graficoComposicaoParcelasChart = null;
    let graficoDistribuicaoChart = null;
    // let graficoComparativoChart = null; // Para comparação de cenários

    function gerarGraficos(parcelas) {
        const labels = parcelas.map(p => p.parcela);
        const saldoDevedorData = parcelas.map(p => p.saldoDevedor);
        const amortizacaoData = parcelas.map(p => p.amortizacao);
        const jurosData = parcelas.map(p => p.juros);
        const segurosData = parcelas.map(p => p.mip + p.dfi);
        const prestacaoData = parcelas.map(p => p.prestacao);
        
        const totalAmortizacao = parcelas.reduce((sum, p) => sum + p.amortizacao, 0);
        const totalJuros = parcelas.reduce((sum, p) => sum + p.juros, 0);
        const totalSeguros = parcelas.reduce((sum, p) => sum + p.mip + p.dfi, 0);
        // const totalOutrosCustos = ... // Adicionar tarifas, etc. se quiser no gráfico de pizza

        // Gráfico de Evolução do Saldo Devedor
        const ctxSaldo = document.getElementById("graficoSaldoDevedor").getContext("2d");
        if (graficoSaldoDevedorChart) graficoSaldoDevedorChart.destroy();
        graficoSaldoDevedorChart = new Chart(ctxSaldo, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Saldo Devedor (R$)",
                    data: saldoDevedorData,
                    borderColor: "rgb(75, 192, 192)",
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Gráfico de Composição das Parcelas (usando a primeira parcela como exemplo)
        const ctxComposicao = document.getElementById("graficoComposicaoParcelas").getContext("2d");
        if (graficoComposicaoParcelasChart) graficoComposicaoParcelasChart.destroy();
        graficoComposicaoParcelasChart = new Chart(ctxComposicao, {
            type: "bar", // Pode ser 'line' também para mostrar evolução
            data: {
                labels: labels, // Mostra todas as parcelas
                datasets: [
                    { label: "Amortização", data: amortizacaoData, backgroundColor: "rgba(54, 162, 235, 0.7)" },
                    { label: "Juros", data: jurosData, backgroundColor: "rgba(255, 99, 132, 0.7)" },
                    { label: "Seguros", data: segurosData, backgroundColor: "rgba(255, 206, 86, 0.7)" }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true }, // Empilha as barras
                    y: { stacked: true, beginAtZero: true, ticks: { callback: value => `R$ ${formatCurrency(value)}` } }
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
                                    label += `R$ ${formatCurrency(context.parsed.y)}`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        // Gráfico de Pizza - Distribuição Total de Pagamentos
        const ctxDistribuicao = document.getElementById("graficoDistribuicao").getContext("2d");
        if (graficoDistribuicaoChart) graficoDistribuicaoChart.destroy();
        graficoDistribuicaoChart = new Chart(ctxDistribuicao, {
            type: "pie",
            data: {
                labels: ["Principal (Amortização)", "Juros", "Seguros"], // Adicionar "Outros Custos" se aplicável
                datasets: [{
                    label: "Distribuição Total",
                    data: [totalAmortizacao, totalJuros, totalSeguros],
                    backgroundColor: [
                        "rgba(54, 162, 235, 0.8)",
                        "rgba(255, 99, 132, 0.8)",
                        "rgba(255, 206, 86, 0.8)",
                        // "rgba(75, 192, 192, 0.8)" // Cor para Outros Custos
                    ],
                    hoverOffset: 4
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
                                    label += `R$ ${formatCurrency(context.parsed)}`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
        
        // TODO: Gráfico Comparativo (requer lógica de comparação de cenários)
    }
    
    // --- Fim Gráficos ---

    // Botão Novo Cálculo
    const btnNovoCalculo = document.getElementById("btnNovoCalculo");
    btnNovoCalculo?.addEventListener("click", function () {
        form.reset(); // Limpa o formulário
        atualizarValorFinanciado(); // Reseta o valor financiado
        showTab("#imovel"); // Volta para a primeira aba
        // Oculta os cards de resultado
        resultadosCard.style.display = "none";
        memoriaCalculoCard.style.display = "none";
        graficosCard.style.display = "none";
        // Mantém cenários, análise, ferramentas e glossário visíveis se já foram abertos
        // cenariosCard.style.display = "none";
        // analiseCard.style.display = "none";
        // ferramentasCard.style.display = "none";
        // glossarioCard.style.display = "none";
        dadosCalculados = null; // Limpa os dados calculados
        window.scrollTo({ top: 0, behavior: "smooth" }); // Rola para o topo
    });

    // Lógica do Tema Escuro/Claro
    const themeToggle = document.getElementById("themeToggle");
    const body = document.body;
    const currentTheme = localStorage.getItem("theme");

    if (currentTheme === "dark") {
        body.classList.add("dark-mode");
        themeToggle.innerHTML = 	'<i class="bi bi-sun"></i> Tema Claro';
    } else {
        themeToggle.innerHTML = 	'<i class="bi bi-moon"></i> Tema Escuro';
    }

    themeToggle?.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        let theme = "light";
        if (body.classList.contains("dark-mode")) {
            theme = "dark";
            themeToggle.innerHTML = 	'<i class="bi bi-sun"></i> Tema Claro';
        } else {
            themeToggle.innerHTML = 	'<i class="bi bi-moon"></i> Tema Escuro';
        }
        localStorage.setItem("theme", theme);
    });

    // Lógica para Salvar Cenário (Modal e localStorage)
    const btnSalvarCenario = document.getElementById("btnSalvarCenario");
    const btnConfirmarSalvarCenario = document.getElementById("btnConfirmarSalvarCenario");
    const nomeCenarioInput = document.getElementById("nomeCenario");
    const salvarCenarioModalElement = document.getElementById("salvarCenarioModal");
    const salvarCenarioModal = salvarCenarioModalElement ? new bootstrap.Modal(salvarCenarioModalElement) : null;

    btnConfirmarSalvarCenario?.addEventListener("click", () => {
        if (!dadosCalculados) {
            alert("Calcule um cenário antes de salvar.");
            return;
        }
        const nome = nomeCenarioInput.value.trim();
        if (!nome) {
            alert("Por favor, insira um nome para o cenário.");
            return;
        }

        // Coleta os dados do formulário e resultados
        const dadosCenario = {
            id: Date.now(),
            nome: nome,
            // Inputs
            valorImovel: document.getElementById("valorImovel").value,
            valorEntrada: document.getElementById("valorEntrada").value,
            estadoImovel: document.getElementById("estadoImovel").value,
            localizacao: document.getElementById("localizacao").value,
            sistemaAmortizacao: document.getElementById("sistemaAmortizacao").value,
            sistemaCorrecao: document.getElementById("sistemaCorrecao").value,
            taxaJuros: document.getElementById("taxaJuros").value,
            prazoFinanciamento: document.getElementById("prazoFinanciamento").value,
            dataInicio: document.getElementById("dataInicio").value,
            rendaFamiliar: document.getElementById("rendaFamiliar").value,
            idadeComprador: document.getElementById("idadeComprador").value,
            usarFgts: document.getElementById("usarFgts").value,
            valorFgts: document.getElementById("valorFgts").value,
            programaGoverno: document.getElementById("programaGoverno").value,
            taxaMIP: document.getElementById("taxaMIP").value,
            taxaDFI: document.getElementById("taxaDFI").value,
            tarifaAvaliacao: document.getElementById("tarifaAvaliacao").value,
            custosCartorarios: document.getElementById("custosCartorarios").value,
            outrosCustos: document.getElementById("outrosCustos").value,
            // Resultados Calculados
            valorFinanciado: (parseFloat(document.getElementById("valorImovel").value) || 0) - (parseFloat(document.getElementById("valorEntrada").value) || 0),
            primeiraPrestacao: dadosCalculados.parcelas[0].prestacao,
            totalJuros: dadosCalculados.totalJuros,
            totalSeguros: dadosCalculados.totalSeguros,
            cet: document.getElementById("resultadoCET").textContent, // Mantém o placeholder por enquanto
            comprometimentoRenda: document.getElementById("resultadoComprometimento").textContent,
            valorFinalPago: dadosCalculados.totalPago,
            prazoTotal: document.getElementById("prazoFinanciamento").value,
            // Dados completos para recálculo/visualização futura
            parcelas: dadosCalculados.parcelas 
        };

        salvarCenarioNoLocalStorage(dadosCenario);
        nomeCenarioInput.value = ""; // Limpa o campo
        if(salvarCenarioModal) salvarCenarioModal.hide();
        alert("Cenário salvo com sucesso!");
        atualizarListaCenarios(); // Atualiza a tabela de cenários salvos
    });

    function salvarCenarioNoLocalStorage(cenario) {
        let cenariosSalvos = JSON.parse(localStorage.getItem("cenariosSalvos") || "[]");
        cenariosSalvos.push(cenario);
        localStorage.setItem("cenariosSalvos", JSON.stringify(cenariosSalvos));
    }

    function carregarCenariosDoLocalStorage() {
        return JSON.parse(localStorage.getItem("cenariosSalvos") || "[]");
    }

    function atualizarListaCenarios() {
        const cenarios = carregarCenariosDoLocalStorage();
        const tabelaBody = document.getElementById("tabelaCenariosBody");
        const checkboxesDiv = document.getElementById("checkboxesCenarios");
        const btnComparar = document.getElementById("btnCompararCenarios");

        if (!tabelaBody || !checkboxesDiv || !btnComparar) return; // Sai se elementos não existem

        tabelaBody.innerHTML = ""; // Limpa a tabela
        checkboxesDiv.innerHTML = ""; // Limpa checkboxes

        if (cenarios.length === 0) {
            tabelaBody.innerHTML = "<tr><td colspan=\"8\" class=\"text-center\">Nenhum cenário salvo.</td></tr>";
            checkboxesDiv.innerHTML = '<div class="alert alert-info"><p>Salve pelo menos dois cenários para habilitar a comparação.</p></div>';
            btnComparar.disabled = true;
        } else {
            cenarios.forEach((cenario, index) => {
                const row = `
                    <tr>
                        <td>${cenario.nome}</td>
                        <td>R$ ${formatCurrency(cenario.valorFinanciado || 0)}</td>
                        <td>${cenario.sistemaAmortizacao?.toUpperCase() || "N/A"}</td>
                        <td>${cenario.prazoFinanciamento || "N/A"} meses</td>
                        <td>${cenario.taxaJuros || "N/A"}%</td>
                        <td>R$ ${formatCurrency(cenario.primeiraPrestacao || 0)}</td>
                        <td>R$ ${formatCurrency(cenario.valorFinalPago || 0)}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="carregarCenario(${cenario.id})" title="Carregar Cenário no Formulário"><i class="bi bi-eye"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="excluirCenario(${cenario.id})" title="Excluir Cenário"><i class="bi bi-trash"></i></button>
                        </td>
                    </tr>
                `;
                tabelaBody.innerHTML += row;

                // Adiciona checkbox para comparação
                const checkbox = `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${cenario.id}" id="compararCenario${cenario.id}">
                        <label class="form-check-label" for="compararCenario${cenario.id}">
                            ${cenario.nome}
                        </label>
                    </div>
                `;
                checkboxesDiv.innerHTML += checkbox;
            });

            // Habilita botão de comparar se houver 2+ cenários
            btnComparar.disabled = cenarios.length < 2;
        }
    }

    // Funções globais para botões na tabela de cenários
    window.carregarCenario = function (id) {
        const cenarios = carregarCenariosDoLocalStorage();
        const cenario = cenarios.find((c) => c.id === id);
        if (cenario) {
            // Preenche o formulário com os dados do cenário
            document.getElementById("valorImovel").value = cenario.valorImovel || "";
            document.getElementById("valorEntrada").value = cenario.valorEntrada || "";
            document.getElementById("estadoImovel").value = cenario.estadoImovel || "novo";
            document.getElementById("localizacao").value = cenario.localizacao || "SP";
            document.getElementById("sistemaAmortizacao").value = cenario.sistemaAmortizacao || "sac";
            document.getElementById("sistemaCorrecao").value = cenario.sistemaCorrecao || "tr";
            document.getElementById("taxaJuros").value = cenario.taxaJuros || "";
            document.getElementById("prazoFinanciamento").value = cenario.prazoFinanciamento || "";
            document.getElementById("dataInicio").value = cenario.dataInicio || "";
            document.getElementById("rendaFamiliar").value = cenario.rendaFamiliar || "";
            document.getElementById("idadeComprador").value = cenario.idadeComprador || "";
            document.getElementById("usarFgts").value = cenario.usarFgts || "nao";
            document.getElementById("valorFgts").value = cenario.valorFgts || "";
            document.getElementById("programaGoverno").value = cenario.programaGoverno || "nenhum";
            document.getElementById("taxaMIP").value = cenario.taxaMIP || "0.44";
            document.getElementById("taxaDFI").value = cenario.taxaDFI || "0.17";
            document.getElementById("tarifaAvaliacao").value = cenario.tarifaAvaliacao || "2500";
            document.getElementById("custosCartorarios").value = cenario.custosCartorarios || "3000";
            document.getElementById("outrosCustos").value = cenario.outrosCustos || "0";
            
            // Atualiza valor financiado e dispara evento change do FGTS
            atualizarValorFinanciado();
            usarFgtsSelect.dispatchEvent(new Event('change'));

            alert(`Cenário "${cenario.nome}" carregado no formulário. Clique em Calcular para ver os resultados.`);
            // O ideal seria recalcular automaticamente, mas deixamos o usuário clicar em Calcular
            showTab("#imovel");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    window.excluirCenario = function (id) {
        if (confirm("Tem certeza que deseja excluir este cenário?")) {
            let cenarios = carregarCenariosDoLocalStorage();
            cenarios = cenarios.filter((c) => c.id !== id);
            localStorage.setItem("cenariosSalvos", JSON.stringify(cenarios));
            atualizarListaCenarios();
            alert("Cenário excluído.");
        }
    };

    // Inicializa a lista de cenários ao carregar a página
    atualizarListaCenarios();

    // TODO: Implementar lógica para Exportar/Importar Cenários (JSON)
    // TODO: Implementar lógica para Exportar PDF/CSV
    // TODO: Implementar lógica para Análise Comparativa
    // TODO: Implementar lógica para Ferramentas Adicionais (Amortização, Portabilidade, Capacidade)
    // TODO: Implementar cálculo de CET real
    // TODO: Implementar correção monetária (TR, IPCA, etc.) - Requer dados externos ou simplificação
});

