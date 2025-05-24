/**
 * Gerenciamento de Cenários para Calculadora de Financiamento Imobiliário
 * Implementação das funções de salvar, carregar, exportar e comparar cenários
 */

/**
 * Salva um cenário no armazenamento local
 * @param {string} nomeCenario - Nome do cenário
 */
function salvarCenario(nomeCenario) {
    // Verificar se há um financiamento calculado
    if (!financiamentoAtual || !financiamentoAtual.parcelas || financiamentoAtual.parcelas.length === 0) {
        alert('Calcule um financiamento antes de salvar o cenário.');
        return;
    }
    
    // Obter cenários salvos
    const cenariosSalvos = JSON.parse(localStorage.getItem('cenariosSalvos') || '[]');
    
    // Criar novo cenário
    const novoCenario = {
        id: Date.now(), // Usar timestamp como ID
        nome: nomeCenario,
        data: new Date().toISOString(),
        dados: financiamentoAtual.dados,
        valorFinanciado: financiamentoAtual.valorFinanciado,
        resumo: financiamentoAtual.resumo,
        // Não salvar todas as parcelas para economizar espaço, apenas algumas representativas
        parcelas: selecionarParcelasRepresentativasParaSalvar(financiamentoAtual.parcelas)
    };
    
    // Adicionar novo cenário
    cenariosSalvos.push(novoCenario);
    
    // Salvar no localStorage
    localStorage.setItem('cenariosSalvos', JSON.stringify(cenariosSalvos));
    
    // Atualizar lista de cenários
    atualizarListaCenarios();
    
    // Atualizar checkboxes para comparação
    atualizarCheckboxesCenarios();
    
    // Mostrar mensagem de sucesso
    alert(`Cenário "${nomeCenario}" salvo com sucesso!`);
}

/**
 * Seleciona parcelas representativas para salvar (economiza espaço)
 * @param {Array} parcelas - Array completo de parcelas
 * @returns {Array} - Array com parcelas selecionadas
 */
function selecionarParcelasRepresentativasParaSalvar(parcelas) {
    const numParcelas = parcelas.length;
    const parcelasSelecionadas = [];
    
    // Selecionar primeira, última e algumas intermediárias
    parcelasSelecionadas.push(parcelas[0]); // Primeira
    
    if (numParcelas > 2) {
        // Selecionar algumas parcelas intermediárias
        const numIntermediarias = Math.min(10, numParcelas - 2);
        const intervalo = Math.floor((numParcelas - 2) / numIntermediarias);
        
        for (let i = 1; i <= numIntermediarias; i++) {
            const indice = Math.min(i * intervalo, numParcelas - 2);
            parcelasSelecionadas.push(parcelas[indice]);
        }
    }
    
    if (numParcelas > 1) {
        parcelasSelecionadas.push(parcelas[numParcelas - 1]); // Última
    }
    
    return parcelasSelecionadas;
}

/**
 * Atualiza a lista de cenários salvos
 */
function atualizarListaCenarios() {
    const cenariosSalvos = JSON.parse(localStorage.getItem('cenariosSalvos') || '[]');
    const tbody = document.getElementById('tabelaCenariosBody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (cenariosSalvos.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="8" class="text-center">Nenhum cenário salvo.</td>';
        tbody.appendChild(tr);
        return;
    }
    
    // Ordenar cenários por data (mais recentes primeiro)
    cenariosSalvos.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Adicionar cenários à tabela
    cenariosSalvos.forEach(cenario => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${cenario.nome}</td>
            <td>${formatarMoeda(cenario.valorFinanciado)}</td>
            <td>${traduzirSistema(cenario.dados.sistemaAmortizacao)}</td>
            <td>${cenario.dados.prazoFinanciamento} meses</td>
            <td>${formatarPercentual(cenario.dados.taxaJuros)}</td>
            <td>${formatarMoeda(cenario.resumo.primeiraPrestacao)}</td>
            <td>${formatarMoeda(cenario.resumo.totalPago)}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-carregar" data-id="${cenario.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-excluir" data-id="${cenario.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Adicionar event listeners para botões
    document.querySelectorAll('.btn-carregar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            carregarCenario(id);
        });
    });
    
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            excluirCenario(id);
        });
    });
    
    // Atualizar checkboxes para comparação
    atualizarCheckboxesCenarios();
}

/**
 * Atualiza os checkboxes para seleção de cenários para comparação
 */
function atualizarCheckboxesCenarios() {
    const cenariosSalvos = JSON.parse(localStorage.getItem('cenariosSalvos') || '[]');
    const container = document.getElementById('checkboxesCenarios');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (cenariosSalvos.length === 0) {
        container.innerHTML = '<p>Nenhum cenário salvo para comparar.</p>';
        return;
    }
    
    // Ordenar cenários por data (mais recentes primeiro)
    cenariosSalvos.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Adicionar checkboxes
    cenariosSalvos.forEach(cenario => {
        const div = document.createElement('div');
        div.className = 'form-check';
        
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${cenario.id}" id="check-${cenario.id}">
            <label class="form-check-label" for="check-${cenario.id}">
                ${cenario.nome} (${formatarMoeda(cenario.valorFinanciado)}, ${traduzirSistema(cenario.dados.sistemaAmortizacao)}, ${cenario.dados.prazoFinanciamento} meses)
            </label>
        `;
        
        container.appendChild(div);
    });
}

/**
 * Carrega um cenário salvo
 * @param {string} id - ID do cenário
 */
function carregarCenario(id) {
    const cenariosSalvos = JSON.parse(localStorage.getItem('cenariosSalvos') || '[]');
    const cenario = cenariosSalvos.find(c => c.id.toString() === id.toString());
    
    if (!cenario) {
        alert('Cenário não encontrado.');
        return;
    }
    
    // Preencher formulário com dados do cenário
    preencherFormulario(cenario.dados);
    
    // Calcular financiamento
    calcular();
    
    // Mostrar mensagem de sucesso
    alert(`Cenário "${cenario.nome}" carregado com sucesso!`);
    
    // Navegar para a aba de resultados
    document.getElementById('tabela-tab').click();
}

/**
 * Preenche o formulário com os dados de um cenário
 * @param {Object} dados - Dados do cenário
 */
function preencherFormulario(dados) {
    // Dados do Imóvel
    document.getElementById('valorImovel').value = dados.valorImovel;
    document.getElementById('valorEntrada').value = dados.valorEntrada;
    document.getElementById('estadoImovel').value = dados.estadoImovel;
    document.getElementById('localizacao').value = dados.localizacao;
    
    // Dados do Financiamento
    document.getElementById('sistemaAmortizacao').value = dados.sistemaAmortizacao;
    document.getElementById('sistemaCorrecao').value = dados.sistemaCorrecao;
    document.getElementById('taxaJuros').value = dados.taxaJuros;
    document.getElementById('prazoFinanciamento').value = dados.prazoFinanciamento;
    document.getElementById('dataInicio').value = dados.dataInicio;
    
    // Dados do Comprador
    document.getElementById('rendaFamiliar').value = dados.rendaFamiliar;
    document.getElementById('idadeComprador').value = dados.idadeComprador;
    document.getElementById('usarFgts').value = dados.usarFgts;
    document.getElementById('valorFgts').value = dados.valorFgts;
    document.getElementById('programaGoverno').value = dados.programaGoverno;
    
    // Mostrar/ocultar opções de FGTS
    const fgtsOptions = document.getElementById('fgtsOptions');
    fgtsOptions.style.display = dados.usarFgts === 'sim' ? 'block' : 'none';
    
    // Custos Adicionais
    document.getElementById('taxaMIP').value = dados.taxaMIP;
    document.getElementById('taxaDFI').value = dados.taxaDFI;
    document.getElementById('tarifaAvaliacao').value = dados.tarifaAvaliacao;
    document.getElementById('custosCartorarios').value = dados.custosCartorarios;
    document.getElementById('outrosCustos').value = dados.outrosCustos;
}

/**
 * Exclui um cenário salvo
 * @param {string} id - ID do cenário
 */
function excluirCenario(id) {
    if (!confirm('Tem certeza que deseja excluir este cenário?')) {
        return;
    }
    
    const cenariosSalvos = JSON.parse(localStorage.getItem('cenariosSalvos') || '[]');
    const novosCenarios = cenariosSalvos.filter(c => c.id.toString() !== id.toString());
    
    localStorage.setItem('cenariosSalvos', JSON.stringify(novosCenarios));
    
    // Atualizar lista de cenários
    atualizarListaCenarios();
    
    // Mostrar mensagem de sucesso
    alert('Cenário excluído com sucesso!');
}

/**
 * Limpa todos os cenários salvos
 */
function limparCenarios() {
    localStorage.removeItem('cenariosSalvos');
    
    // Atualizar lista de cenários
    atualizarListaCenarios();
    
    // Mostrar mensagem de sucesso
    alert('Todos os cenários foram excluídos com sucesso!');
}

/**
 * Exporta os cenários salvos para um arquivo JSON
 */
function exportarCenarios() {
    const cenariosSalvos = JSON.parse(localStorage.getItem('cenariosSalvos') || '[]');
    
    if (cenariosSalvos.length === 0) {
        alert('Não há cenários para exportar.');
        return;
    }
    
    // Criar blob com os dados
    const blob = new Blob([JSON.stringify(cenariosSalvos, null, 2)], { type: 'application/json' });
    
    // Criar URL para o blob
    const url = URL.createObjectURL(blob);
    
    // Criar link para download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cenarios_financiamento_' + new Date().toISOString().split('T')[0] + '.json';
    
    // Adicionar link ao documento e clicar
    document.body.appendChild(a);
    a.click();
    
    // Remover link
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Importa cenários de um arquivo JSON
 * @param {File} arquivo - Arquivo JSON com cenários
 */
function importarCenarios(arquivo) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const cenarios = JSON.parse(e.target.result);
            
            if (!Array.isArray(cenarios)) {
                throw new Error('Formato inválido.');
            }
            
            // Validar cenários
            cenarios.forEach(cenario => {
                if (!cenario.id || !cenario.nome || !cenario.dados || !cenario.resumo) {
                    throw new Error('Formato inválido.');
                }
            });
            
            // Obter cenários salvos
            const cenariosSalvos = JSON.parse(localStorage.getItem('cenariosSalvos') || '[]');
            
            // Adicionar novos cenários
            const novosCenarios = [...cenariosSalvos];
            
            // Verificar duplicatas
            cenarios.forEach(cenario => {
                // Se já existe um cenário com o mesmo ID, não adicionar
                if (!novosCenarios.some(c => c.id === cenario.id)) {
                    novosCenarios.push(cenario);
                }
            });
            
            // Salvar no localStorage
            localStorage.setItem('cenariosSalvos', JSON.stringify(novosCenarios));
            
            // Atualizar lista de cenários
            atualizarListaCenarios();
            
            // Mostrar mensagem de sucesso
            alert(`${cenarios.length} cenário(s) importado(s) com sucesso!`);
        } catch (error) {
            alert('Erro ao importar cenários: ' + error.message);
        }
    };
    
    reader.readAsText(arquivo);
}

// Exportar funções para uso global
window.salvarCenario = salvarCenario;
window.carregarCenario = carregarCenario;
window.excluirCenario = excluirCenario;
window.limparCenarios = limparCenarios;
window.exportarCenarios = exportarCenarios;
window.importarCenarios = importarCenarios;
window.atualizarListaCenarios = atualizarListaCenarios;
window.atualizarCheckboxesCenarios = atualizarCheckboxesCenarios;
