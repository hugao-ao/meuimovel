/**
 * Interface e Interações da Calculadora de Financiamento Imobiliário
 * Implementação das interações com o usuário e manipulação do DOM
 */

// Inicialização do documento
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar data atual no campo de data de início
    const hoje = new Date();
    document.getElementById('dataInicio').valueAsDate = hoje;
    
    // Adicionar event listeners para navegação entre abas do formulário
    document.getElementById('btnProximoFinanciamento').addEventListener('click', function() {
        document.getElementById('financiamento-tab').click();
    });
    
    document.getElementById('btnVoltarImovel').addEventListener('click', function() {
        document.getElementById('imovel-tab').click();
    });
    
    document.getElementById('btnProximoComprador').addEventListener('click', function() {
        document.getElementById('comprador-tab').click();
    });
    
    document.getElementById('btnVoltarFinanciamento').addEventListener('click', function() {
        document.getElementById('financiamento-tab').click();
    });
    
    document.getElementById('btnProximoCustos').addEventListener('click', function() {
        document.getElementById('custos-tab').click();
    });
    
    document.getElementById('btnVoltarComprador').addEventListener('click', function() {
        document.getElementById('comprador-tab').click();
    });
    
    // Mostrar/ocultar opções de FGTS
    document.getElementById('usarFgts').addEventListener('change', function() {
        const fgtsOptions = document.getElementById('fgtsOptions');
        fgtsOptions.style.display = this.value === 'sim' ? 'block' : 'none';
    });
    
    // Botão de cálculo
    document.getElementById('btnCalcular').addEventListener('click', calcular);
    
    // Botão de novo cálculo
    document.getElementById('btnNovoCalculo').addEventListener('click', function() {
        document.getElementById('secaoResultados').style.display = 'none';
        document.getElementById('secaoDetalhes').style.display = 'none';
        document.getElementById('imovel-tab').click();
    });
    
    // Botão de salvar cenário
    document.getElementById('btnSalvarCenario').addEventListener('click', function() {
        const modalSalvarCenario = new bootstrap.Modal(document.getElementById('modalSalvarCenario'));
        modalSalvarCenario.show();
    });
    
    // Botão de confirmar salvar cenário
    document.getElementById('btnConfirmarSalvarCenario').addEventListener('click', function() {
        const nomeCenario = document.getElementById('nomeCenario').value;
        if (nomeCenario) {
            salvarCenario(nomeCenario);
            const modalSalvarCenario = bootstrap.Modal.getInstance(document.getElementById('modalSalvarCenario'));
            modalSalvarCenario.hide();
        }
    });
    
    // Botão de exportar PDF
    document.getElementById('btnExportarPDF').addEventListener('click', exportarPDF);
    
    // Botão de exportar CSV
    document.getElementById('btnExportarCSV').addEventListener('click', exportarCSV);
    
    // Botão de tema escuro
    document.getElementById('btnTemaEscuro').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const icon = this.querySelector('i');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            this.innerHTML = this.innerHTML.replace('Modo Escuro', 'Modo Claro');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            this.innerHTML = this.innerHTML.replace('Modo Claro', 'Modo Escuro');
        }
    });
    
    // Botão de comparar cenários
    document.getElementById('btnCompararCenarios').addEventListener('click', compararCenariosSelecionados);
    
    // Botões de ferramentas
    document.getElementById('btnSimularAmortizacao').addEventListener('click', simularAmortizacao);
    document.getElementById('btnSimularPortabilidade').addEventListener('click', simularPortabilidade);
    document.getElementById('btnCalcularCapacidade').addEventListener('click', calcularCapacidade);
    
    // Botões de exportar/importar cenários
    document.getElementById('btnExportarCenarios').addEventListener('click', exportarCenarios);
    document.getElementById('btnImportarCenarios').addEventListener('click', function() {
        document.getElementById('importarCenariosFile').click();
    });
    
    document.getElementById('importarCenariosFile').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            importarCenarios(e.target.files[0]);
        }
    });
    
    // Botão de limpar cenários
    document.getElementById('btnLimparCenarios').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja excluir todos os cenários salvos?')) {
            limparCenarios();
        }
    });
    
    // Carregar cenários salvos
    atualizarListaCenarios();
});

/**
 * Coleta os dados do formulário
 * @returns {Object} - Objeto com todos os dados do formulário
 */
function coletarDadosFormulario() {
    return {
        // Dados do Imóvel
        valorImovel: parseFloat(document.getElementById('valorImovel').value) || 0,
        valorEntrada: parseFloat(document.getElementById('valorEntrada').value) || 0,
        estadoImovel: document.getElementById('estadoImovel').value,
        localizacao: document.getElementById('localizacao').value,
        
        // Dados do Financiamento
        sistemaAmortizacao: document.getElementById('sistemaAmortizacao').value,
        sistemaCorrecao: document.getElementById('sistemaCorrecao').value,
        taxaJuros: parseFloat(document.getElementById('taxaJuros').value) || 0,
        prazoFinanciamento: parseInt(document.getElementById('prazoFinanciamento').value) || 0,
        dataInicio: document.getElementById('dataInicio').value,
        
        // Dados do Comprador
        rendaFamiliar: parseFloat(document.getElementById('rendaFamiliar').value) || 0,
        idadeComprador: parseInt(document.getElementById('idadeComprador').value) || 0,
        usarFgts: document.getElementById('usarFgts').value,
        valorFgts: parseFloat(document.getElementById('valorFgts').value) || 0,
        programaGoverno: document.getElementById('programaGoverno').value,
        
        // Custos Adicionais
        taxaMIP: parseFloat(document.getElementById('taxaMIP').value) || 0,
        taxaDFI: parseFloat(document.getElementById('taxaDFI').value) || 0,
        tarifaAvaliacao: parseFloat(document.getElementById('tarifaAvaliacao').value) || 0,
        custosCartorarios: parseFloat(document.getElementById('custosCartorarios').value) || 0,
        outrosCustos: parseFloat(document.getElementById('outrosCustos').value) || 0
    };
}

/**
 * Valida os dados do formulário
 * @param {Object} dados - Dados do formulário
 * @returns {boolean} - True se os dados são válidos, false caso contrário
 */
function validarDados(dados) {
    // Validar valor do imóvel
    if (!dados.valorImovel || dados.valorImovel <= 0) {
        alert('O valor do imóvel deve ser maior que zero.');
        return false;
    }
    
    // Validar valor da entrada
    if (dados.valorEntrada >= dados.valorImovel) {
        alert('O valor da entrada deve ser menor que o valor do imóvel.');
        return false;
    }
    
    // Validar taxa de juros
    if (!dados.taxaJuros || dados.taxaJuros <= 0) {
        alert('A taxa de juros deve ser maior que zero.');
        return false;
    }
    
    // Validar prazo
    if (!dados.prazoFinanciamento || dados.prazoFinanciamento < 12 || dados.prazoFinanciamento > 420) {
        alert('O prazo deve estar entre 12 e 420 meses.');
        return false;
    }
    
    // Validar data de início
    if (!dados.dataInicio) {
        alert('A data de início é obrigatória.');
        return false;
    }
    
    // Validar renda familiar
    if (!dados.rendaFamiliar || dados.rendaFamiliar <= 0) {
        alert('A renda familiar deve ser maior que zero.');
        return false;
    }
    
    // Validar FGTS
    if (dados.usarFgts === 'sim' && (!dados.valorFgts || dados.valorFgts <= 0)) {
        alert('O valor do FGTS deve ser maior que zero quando a opção "Usar FGTS" está selecionada.');
        return false;
    }
    
    return true;
}

/**
 * Realiza o cálculo do financiamento
 */
function calcular() {
    // Coletar dados do formulário
    const dados = coletarDadosFormulario();
    
    // Validar dados
    if (!validarDados(dados)) {
        return;
    }
    
    // Calcular financiamento
    const resultado = calcularFinanciamento(dados);
    
    // Exibir resultados
    exibirResultados(resultado);
    
    // Exibir seções de resultados
    document.getElementById('secaoResultados').style.display = 'block';
    document.getElementById('secaoDetalhes').style.display = 'block';
    
    // Rolar para os resultados
    document.getElementById('secaoResultados').scrollIntoView({ behavior: 'smooth' });
    
    // Analisar cenário
    const analise = analisarCenario(dados, resultado);
    exibirAnalise(analise);
}

/**
 * Exibe os resultados do cálculo
 * @param {Object} resultado - Resultado do cálculo
 */
function exibirResultados(resultado) {
    // Exibir resumo
    document.getElementById('resultadoValorFinanciado').textContent = formatarMoeda(resultado.valorFinanciado);
    document.getElementById('resultadoPrimeiraPrestacao').textContent = formatarMoeda(resultado.resumo.primeiraPrestacao);
    document.getElementById('resultadoTotalJuros').textContent = formatarMoeda(resultado.resumo.totalJuros);
    document.getElementById('resultadoTotalSeguros').textContent = formatarMoeda(resultado.resumo.totalSeguros);
    document.getElementById('resultadoCET').textContent = formatarPercentual(resultado.resumo.cet);
    document.getElementById('resultadoComprometimento').textContent = formatarPercentual(resultado.resumo.comprometimentoRenda);
    document.getElementById('resultadoValorFinal').textContent = formatarMoeda(resultado.resumo.totalPago);
    document.getElementById('resultadoPrazoTotal').textContent = `${resultado.resumo.prazoTotal} meses`;
    
    // Exibir tabela de memória de cálculo
    exibirTabelaMemoriaCalculo(resultado.parcelas);
    
    // Atualizar gráficos
    atualizarGraficos();
}

/**
 * Exibe a tabela de memória de cálculo
 * @param {Array} parcelas - Array de parcelas calculadas
 */
function exibirTabelaMemoriaCalculo(parcelas) {
    const tbody = document.getElementById('tabelaMemoriaCalculoBody');
    tbody.innerHTML = '';
    
    // Definir número de parcelas por página
    const parcelasPorPagina = 12;
    const totalPaginas = Math.ceil(parcelas.length / parcelasPorPagina);
    
    // Armazenar todas as parcelas para paginação
    window.todasParcelas = parcelas;
    window.paginaAtual = 1;
    window.parcelasPorPagina = parcelasPorPagina;
    
    // Exibir primeira página
    exibirPaginaTabela(1);
    
    // Criar paginação
    criarPaginacao(totalPaginas);
}

/**
 * Exibe uma página específica da tabela de memória de cálculo
 * @param {number} pagina - Número da página a ser exibida
 */
function exibirPaginaTabela(pagina) {
    const parcelas = window.todasParcelas;
    const parcelasPorPagina = window.parcelasPorPagina;
    const tbody = document.getElementById('tabelaMemoriaCalculoBody');
    tbody.innerHTML = '';
    
    // Calcular índices de início e fim
    const inicio = (pagina - 1) * parcelasPorPagina;
    const fim = Math.min(inicio + parcelasPorPagina, parcelas.length);
    
    // Exibir parcelas da página atual
    for (let i = inicio; i < fim; i++) {
        const parcela = parcelas[i];
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${parcela.numero}</td>
            <td>${formatarData(parcela.dataVencimento)}</td>
            <td>${formatarMoeda(parcela.prestacaoTotal)}</td>
            <td>${formatarMoeda(parcela.amortizacao)}</td>
            <td>${formatarMoeda(parcela.juros)}</td>
            <td>${formatarMoeda(parcela.mip)}</td>
            <td>${formatarMoeda(parcela.dfi)}</td>
            <td>${formatarMoeda(parcela.correcao || 0)}</td>
            <td>${formatarMoeda(parcela.saldoDevedor)}</td>
        `;
        
        tbody.appendChild(tr);
    }
    
    // Atualizar página atual
    window.paginaAtual = pagina;
}

/**
 * Cria a paginação para a tabela de memória de cálculo
 * @param {number} totalPaginas - Número total de páginas
 */
function criarPaginacao(totalPaginas) {
    const paginacao = document.getElementById('paginacaoTabela');
    paginacao.innerHTML = '';
    
    // Botão anterior
    const liAnterior = document.createElement('li');
    liAnterior.className = 'page-item';
    liAnterior.innerHTML = `<a class="page-link" href="#" aria-label="Anterior"><span aria-hidden="true">&laquo;</span></a>`;
    liAnterior.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.paginaAtual > 1) {
            exibirPaginaTabela(window.paginaAtual - 1);
            atualizarEstadoPaginacao();
        }
    });
    paginacao.appendChild(liAnterior);
    
    // Limitar número de botões de página
    const maxBotoes = 5;
    let inicio = Math.max(1, window.paginaAtual - Math.floor(maxBotoes / 2));
    let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);
    
    if (fim - inicio + 1 < maxBotoes) {
        inicio = Math.max(1, fim - maxBotoes + 1);
    }
    
    // Botões de página
    for (let i = inicio; i <= fim; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === window.paginaAtual ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', function(e) {
            e.preventDefault();
            exibirPaginaTabela(i);
            atualizarEstadoPaginacao();
        });
        paginacao.appendChild(li);
    }
    
    // Botão próximo
    const liProximo = document.createElement('li');
    liProximo.className = 'page-item';
    liProximo.innerHTML = `<a class="page-link" href="#" aria-label="Próximo"><span aria-hidden="true">&raquo;</span></a>`;
    liProximo.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.paginaAtual < totalPaginas) {
            exibirPaginaTabela(window.paginaAtual + 1);
            atualizarEstadoPaginacao();
        }
    });
    paginacao.appendChild(liProximo);
}

/**
 * Atualiza o estado dos botões de paginação
 */
function atualizarEstadoPaginacao() {
    const paginacao = document.getElementById('paginacaoTabela');
    const paginas = paginacao.querySelectorAll('.page-item');
    
    // Remover classe active de todos os botões
    paginas.forEach(pagina => {
        pagina.classList.remove('active');
    });
    
    // Adicionar classe active ao botão da página atual
    const botoesPagina = Array.from(paginas).slice(1, -1); // Excluir botões anterior e próximo
    const botaoAtual = botoesPagina.find(botao => parseInt(botao.textContent) === window.paginaAtual);
    if (botaoAtual) {
        botaoAtual.classList.add('active');
    }
    
    // Desabilitar botão anterior se estiver na primeira página
    paginas[0].classList.toggle('disabled', window.paginaAtual === 1);
    
    // Desabilitar botão próximo se estiver na última página
    const totalPaginas = Math.ceil(window.todasParcelas.length / window.parcelasPorPagina);
    paginas[paginas.length - 1].classList.toggle('disabled', window.paginaAtual === totalPaginas);
}

/**
 * Exibe a análise do cenário
 * @param {Object} analise - Análise do cenário
 */
function exibirAnalise(analise) {
    const conteudo = document.getElementById('analiseUltimoCenarioConteudo');
    
    let html = '<div class="card-text">';
    
    // Pontos fortes
    if (analise.pontosFortes.length > 0) {
        html += '<h6 class="mt-3">Pontos Fortes:</h6>';
        html += '<ul class="analise-positivo">';
        analise.pontosFortes.forEach(ponto => {
            html += `<li>${ponto}</li>`;
        });
        html += '</ul>';
    }
    
    // Pontos fracos
    if (analise.pontosFracos.length > 0) {
        html += '<h6 class="mt-3">Pontos de Atenção:</h6>';
        html += '<ul class="analise-negativo">';
        analise.pontosFracos.forEach(ponto => {
            html += `<li>${ponto}</li>`;
        });
        html += '</ul>';
    }
    
    // Sugestões
    if (analise.sugestoes.length > 0) {
        html += '<h6 class="mt-3">Sugestões:</h6>';
        html += '<ul class="analise-neutro">';
        analise.sugestoes.forEach(sugestao => {
            html += `<li>${sugestao}</li>`;
        });
        html += '</ul>';
    }
    
    html += '</div>';
    
    conteudo.innerHTML = html;
}

/**
 * Simula amortização extraordinária
 */
function simularAmortizacao() {
    // Verificar se há um financiamento calculado
    if (!financiamentoAtual || !financiamentoAtual.parcelas || financiamentoAtual.parcelas.length === 0) {
        alert('Calcule um financiamento antes de simular amortização extraordinária.');
        return;
    }
    
    // Coletar dados da simulação
    const valorAmortizacao = parseFloat(document.getElementById('valorAmortizacao').value) || 0;
    const parcelaAmortizacao = parseInt(document.getElementById('parcelaAmortizacao').value) || 1;
    const tipoImpacto = document.getElementById('tipoImpacto').value;
    
    // Validar dados
    if (valorAmortizacao <= 0) {
        alert('O valor da amortização deve ser maior que zero.');
        return;
    }
    
    if (parcelaAmortizacao < 1 || parcelaAmortizacao >= financiamentoAtual.parcelas.length) {
        alert(`A parcela deve estar entre 1 e ${financiamentoAtual.parcelas.length - 1}.`);
        return;
    }
    
    // Simular amortização
    let resultado;
    if (tipoImpacto === 'prazo') {
        resultado = simularAmortizacaoExtraordinariaPrazo(financiamentoAtual, valorAmortizacao, parcelaAmortizacao);
    } else {
        resultado = simularAmortizacaoExtraordinariaParcela(financiamentoAtual, valorAmortizacao, parcelaAmortizacao);
    }
    
    // Exibir resultado
    const resultadoAmortizacao = document.getElementById('resultadoAmortizacao');
    
    let html = '<div class="alert alert-success mt-3">';
    html += '<h5>Resultado da Simulação</h5>';
    
    if (tipoImpacto === 'prazo') {
        html += `<p><strong>Redução do prazo:</strong> ${resultado.economia.prazo} meses</p>`;
        html += `<p><strong>Economia de juros:</strong> ${formatarMoeda(resultado.economia.juros)}</p>`;
    } else {
        html += `<p><strong>Redução da parcela:</strong> ${formatarMoeda(resultado.economia.parcela)}</p>`;
        html += `<p><strong>Economia de juros:</strong> ${formatarMoeda(resultado.economia.juros)}</p>`;
    }
    
    html += `<p><strong>Economia total:</strong> ${formatarMoeda(resultado.economia.total)}</p>`;
    html += '</div>';
    
    resultadoAmortizacao.innerHTML = html;
}

/**
 * Simula portabilidade de financiamento
 */
function simularPortabilidade() {
    // Verificar se há um financiamento calculado
    if (!financiamentoAtual || !financiamentoAtual.parcelas || financiamentoAtual.parcelas.length === 0) {
        alert('Calcule um financiamento antes de simular portabilidade.');
        return;
    }
    
    // Coletar dados da simulação
    const novaTaxaJuros = parseFloat(document.getElementById('novaTaxaJuros').value) || 0;
    const custoPortabilidade = parseFloat(document.getElementById('custoPortabilidade').value) || 0;
    const parcelaAtual = parseInt(document.getElementById('parcelaAtual').value) || 1;
    
    // Validar dados
    if (novaTaxaJuros <= 0) {
        alert('A nova taxa de juros deve ser maior que zero.');
        return;
    }
    
    if (novaTaxaJuros >= financiamentoAtual.dados.taxaJuros) {
        alert('A nova taxa de juros deve ser menor que a taxa atual para que a portabilidade seja vantajosa.');
        return;
    }
    
    if (parcelaAtual < 1 || parcelaAtual >= financiamentoAtual.parcelas.length) {
        alert(`A parcela atual deve estar entre 1 e ${financiamentoAtual.parcelas.length - 1}.`);
        return;
    }
    
    // Simular portabilidade
    const dadosNovos = {
        novaTaxaJuros: novaTaxaJuros,
        custoPortabilidade: custoPortabilidade,
        parcelaAtual: parcelaAtual
    };
    
    const resultado = simularPortabilidade(financiamentoAtual, dadosNovos);
    
    // Exibir resultado
    const resultadoPortabilidade = document.getElementById('resultadoPortabilidade');
    
    let html = '<div class="alert alert-success mt-3">';
    html += '<h5>Resultado da Simulação de Portabilidade</h5>';
    
    html += `<p><strong>Redução na prestação mensal:</strong> ${formatarMoeda(resultado.economia.mensal)}</p>`;
    html += `<p><strong>Economia total de juros:</strong> ${formatarMoeda(resultado.economia.juros)}</p>`;
    html += `<p><strong>Custo da portabilidade:</strong> ${formatarMoeda(resultado.custoPortabilidade)}</p>`;
    
    if (resultado.prazoRecuperacao > 0) {
        html += `<p><strong>Prazo para recuperar o custo:</strong> ${resultado.prazoRecuperacao} meses</p>`;
        
        if (resultado.prazoRecuperacao <= 12) {
            html += '<p class="analise-positivo"><strong>Conclusão:</strong> A portabilidade é muito vantajosa!</p>';
        } else if (resultado.prazoRecuperacao <= 24) {
            html += '<p class="analise-positivo"><strong>Conclusão:</strong> A portabilidade é vantajosa.</p>';
        } else {
            html += '<p class="analise-neutro"><strong>Conclusão:</strong> A portabilidade pode ser vantajosa a longo prazo.</p>';
        }
    } else {
        html += '<p class="analise-negativo"><strong>Conclusão:</strong> O custo da portabilidade não será recuperado no prazo do financiamento.</p>';
    }
    
    html += '</div>';
    
    resultadoPortabilidade.innerHTML = html;
}

/**
 * Calcula a capacidade de pagamento
 */
function calcularCapacidade() {
    // Coletar dados
    const rendaFamiliar = parseFloat(document.getElementById('rendaFamiliarCapacidade').value) || 0;
    const outrasObrigacoes = parseFloat(document.getElementById('outrasObrigacoes').value) || 0;
    const prazoDesejado = parseInt(document.getElementById('prazoDesejado').value) || 360;
    
    // Validar dados
    if (rendaFamiliar <= 0) {
        alert('A renda familiar deve ser maior que zero.');
        return;
    }
    
    if (outrasObrigacoes < 0) {
        alert('O valor de outras obrigações não pode ser negativo.');
        return;
    }
    
    if (prazoDesejado < 12 || prazoDesejado > 420) {
        alert('O prazo deve estar entre 12 e 420 meses.');
        return;
    }
    
    // Usar a taxa de juros do formulário principal
    const taxaJuros = parseFloat(document.getElementById('taxaJuros').value) || 11.29;
    
    // Calcular capacidade de pagamento
    const resultado = calcularCapacidadePagamento(rendaFamiliar, outrasObrigacoes, taxaJuros, prazoDesejado);
    
    // Exibir resultado
    const resultadoCapacidade = document.getElementById('resultadoCapacidade');
    
    let html = '<div class="alert alert-info mt-3">';
    html += '<h5>Resultado da Capacidade de Pagamento</h5>';
    
    if (resultado.capacidadePagamento <= 0) {
        html += '<p class="analise-negativo"><strong>Atenção:</strong> Suas obrigações atuais já comprometem mais de 30% da sua renda.</p>';
    } else {
        html += `<p><strong>Capacidade de pagamento mensal:</strong> ${formatarMoeda(resultado.capacidadePagamento)}</p>`;
        html += `<p><strong>Valor máximo financiável:</strong> ${formatarMoeda(resultado.valorMaximoFinanciavel)}</p>`;
        html += `<p><strong>Valor estimado do imóvel (com 20% de entrada):</strong> ${formatarMoeda(resultado.valorImovelEstimado)}</p>`;
        
        // Adicionar sugestões
        html += '<p class="mt-3"><strong>Sugestões:</strong></p>';
        html += '<ul>';
        html += `<li>Considere uma entrada de pelo menos 20% (${formatarMoeda(resultado.valorImovelEstimado * 0.2)}) para obter melhores condições.</li>`;
        html += `<li>Verifique se você tem direito a subsídios de programas governamentais.</li>`;
        html += `<li>Avalie o uso do FGTS para aumentar o valor da entrada.</li>`;
        html += '</ul>';
    }
    
    html += '</div>';
    
    resultadoCapacidade.innerHTML = html;
}

/**
 * Compara cenários selecionados
 */
function compararCenariosSelecionados() {
    // Obter cenários selecionados
    const checkboxes = document.querySelectorAll('#checkboxesCenarios input:checked');
    const idsCenarios = Array.from(checkboxes).map(cb => cb.value);
    
    // Verificar se há pelo menos dois cenários selecionados
    if (idsCenarios.length < 2) {
        alert('Selecione pelo menos dois cenários para comparação.');
        return;
    }
    
    // Obter cenários salvos
    const cenariosSalvos = JSON.parse(localStorage.getItem('cenariosSalvos') || '[]');
    const cenariosSelecionados = cenariosSalvos.filter(c => idsCenarios.includes(c.id.toString()));
    
    // Comparar cenários
    const comparacao = compararCenarios(cenariosSelecionados);
    
    // Exibir resultado
    exibirComparacao(comparacao);
    
    // Criar gráfico de comparação
    criarGraficoComparacaoCenarios(cenariosSelecionados);
}

/**
 * Exibe a comparação entre cenários
 * @param {Object} comparacao - Resultado da comparação
 */
function exibirComparacao(comparacao) {
    const resultadoComparacao = document.getElementById('resultadoComparacao');
    
    if (comparacao.erro) {
        resultadoComparacao.innerHTML = `<div class="alert alert-danger">${comparacao.erro}</div>`;
        return;
    }
    
    let html = '<div class="table-responsive">';
    html += '<table class="table table-striped table-sm">';
    html += '<thead><tr><th>Cenário</th><th>Valor Financiado</th><th>Sistema</th><th>Prazo</th><th>Taxa</th><th>Primeira Parcela</th><th>Total de Juros</th><th>Total Pago</th></tr></thead>';
    html += '<tbody>';
    
    comparacao.tabela.forEach(cenario => {
        html += `<tr>
            <td>${cenario.nome}</td>
            <td>${formatarMoeda(cenario.valorFinanciado)}</td>
            <td>${traduzirSistema(cenario.sistema)}</td>
            <td>${cenario.prazo} meses</td>
            <td>${formatarPercentual(cenario.taxa)}</td>
            <td>${formatarMoeda(cenario.primeiraParcela)}</td>
            <td>${formatarMoeda(cenario.totalJuros)}</td>
            <td>${formatarMoeda(cenario.totalPago)}</td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    
    // Adicionar rankings
    html += '<div class="row mt-4">';
    
    // Ranking por custo total
    html += '<div class="col-md-4">';
    html += '<h6>Ranking por Custo Total</h6>';
    html += '<ol>';
    comparacao.ranking.custoTotal.forEach(cenario => {
        html += `<li>${cenario.nome} - ${formatarMoeda(cenario.totalPago)}</li>`;
    });
    html += '</ol>';
    html += '</div>';
    
    // Ranking por primeira parcela
    html += '<div class="col-md-4">';
    html += '<h6>Ranking por Primeira Parcela</h6>';
    html += '<ol>';
    comparacao.ranking.primeiraParcela.forEach(cenario => {
        html += `<li>${cenario.nome} - ${formatarMoeda(cenario.primeiraParcela)}</li>`;
    });
    html += '</ol>';
    html += '</div>';
    
    // Ranking por última parcela
    html += '<div class="col-md-4">';
    html += '<h6>Ranking por Última Parcela</h6>';
    html += '<ol>';
    comparacao.ranking.ultimaParcela.forEach(cenario => {
        html += `<li>${cenario.nome} - ${formatarMoeda(cenario.ultimaParcela)}</li>`;
    });
    html += '</ol>';
    html += '</div>';
    
    html += '</div>';
    
    resultadoComparacao.innerHTML = html;
}

/**
 * Traduz o código do sistema de amortização para texto
 * @param {string} sistema - Código do sistema
 * @returns {string} - Nome do sistema
 */
function traduzirSistema(sistema) {
    switch (sistema) {
        case 'sac': return 'SAC';
        case 'price': return 'Price';
        case 'sacre': return 'SACRE';
        default: return sistema;
    }
}

/**
 * Formata um valor monetário
 * @param {number} valor - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um percentual
 * @param {number} valor - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
function formatarPercentual(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

/**
 * Formata uma data
 * @param {string} data - Data no formato YYYY-MM-DD
 * @returns {string} - Data formatada
 */
function formatarData(data) {
    if (!data) return '';
    const partes = data.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Exportar funções para uso global
window.coletarDadosFormulario = coletarDadosFormulario;
window.calcular = calcular;
window.exibirResultados = exibirResultados;
window.exibirTabelaMemoriaCalculo = exibirTabelaMemoriaCalculo;
window.exibirPaginaTabela = exibirPaginaTabela;
window.formatarMoeda = formatarMoeda;
window.formatarPercentual = formatarPercentual;
window.formatarData = formatarData;
