// storage.js
// Módulo responsável pelo armazenamento e gerenciamento de dados da aplicação

// --- Utilitários Internos ---

/**
 * Gera um ID único simples (para demonstração)
 * Em produção, usar uma biblioteca como UUID.
 * @return {string} ID único
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- Motor de Armazenamento ---

/**
 * Verifica se o armazenamento local está disponível
 * @return {boolean} Verdadeiro se o armazenamento estiver disponível
 */
export function isStorageAvailable() {
  try {
    const storage = window.localStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    console.error("LocalStorage não está disponível:", e);
    return false;
  }
}

/**
 * Obtém todos os dados armazenados
 * @return {Object} Dados armazenados ou null em caso de erro ou indisponibilidade
 */
export function getAllData() {
  if (!isStorageAvailable()) return null;
  try {
    const data = localStorage.getItem('appData');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Erro ao obter dados do localStorage:', e);
    return null;
  }
}

/**
 * Salva todos os dados
 * @param {Object} data - Dados a serem salvos
 * @return {boolean} Verdadeiro se o salvamento for bem-sucedido
 */
export function saveAllData(data) {
  if (!isStorageAvailable()) return false;
  try {
    // Atualizar timestamp e versão (se necessário)
    data.lastUpdated = new Date().toISOString();
    data.version = data.version || '1.0'; // Garante que a versão exista

    localStorage.setItem('appData', JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Erro ao salvar dados no localStorage:', e);
    // Implementar fallback ou notificação de erro mais robusta
    if (e.name === 'QuotaExceededError') {
        alert('Erro: Espaço de armazenamento local excedido!');
    }
    return false;
  }
}

/**
 * Inicializa o armazenamento local com estrutura básica, se necessário
 * @return {boolean} Verdadeiro se a inicialização for bem-sucedida ou se já estava inicializado
 */
export function initializeStorage() {
  if (!isStorageAvailable()) return false;
  try {
    const existingData = getAllData();
    if (!existingData) {
      // Criar estrutura inicial
      const initialData = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        simulations: [],
        scenarios: [],
        studies: [],
        settings: {
          defaultCurrency: 'BRL',
          decimalPlaces: 2
        }
      };
      return saveAllData(initialData);
    }
    // TODO: Adicionar lógica de migração se existingData.version for diferente da versão atual
    // if (needsMigration(existingData.version)) { ... migrateData(existingData) ... }
    return true; // Já inicializado
  } catch (e) {
    console.error('Erro ao inicializar armazenamento:', e);
    return false;
  }
}

/**
 * Limpa todos os dados armazenados da aplicação
 * @return {boolean} Verdadeiro se a limpeza for bem-sucedida
 */
export function clearAllData() {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.removeItem('appData');
    return true;
  } catch (e) {
    console.error('Erro ao limpar dados do localStorage:', e);
    return false;
  }
}

/**
 * Exporta todos os dados para um arquivo JSON (usa a função do módulo export.js)
 * @return {string | null} String JSON com os dados ou null em caso de erro
 */
export function exportDataToJSONString() {
  try {
    const data = getAllData();
    return data ? JSON.stringify(data, null, 2) : null;
  } catch (e) {
    console.error('Erro ao gerar string JSON para exportação:', e);
    return null;
  }
}

/**
 * Importa dados de uma string JSON
 * @param {string} jsonString - String JSON com os dados
 * @return {boolean} Verdadeiro se a importação for bem-sucedida
 */
export function importDataFromJSON(jsonString) {
  if (!isStorageAvailable()) return false;
  try {
    const data = JSON.parse(jsonString);

    // Validar estrutura básica
    if (!data || typeof data !== 'object' || !data.version || !Array.isArray(data.simulations) ||
        !Array.isArray(data.scenarios) || !Array.isArray(data.studies)) {
      throw new Error('Formato de dados JSON inválido ou incompleto.');
    }

    // TODO: Implementar verificação e migração de versão
    // if (needsMigration(data.version)) {
    //   data = migrateData(data);
    // }

    // Sobrescrever dados existentes
    return saveAllData(data);
  } catch (e) {
    console.error('Erro ao importar dados do JSON:', e);
    alert('Erro ao importar dados: ' + e.message);
    return false;
  }
}

// --- Gerenciamento de Simulações ---

/**
 * Obtém todas as simulações armazenadas
 * @return {Array} Lista de simulações ou array vazio em caso de erro
 */
export function getAllSimulations() {
  try {
    const data = getAllData();
    return data && data.simulations ? data.simulations : [];
  } catch (e) {
    console.error('Erro ao obter simulações:', e);
    return [];
  }
}

/**
 * Obtém uma simulação pelo ID
 * @param {string} id - ID da simulação
 * @return {Object | null} Simulação encontrada ou null se não existir/erro
 */
export function getSimulationById(id) {
  try {
    const simulations = getAllSimulations();
    return simulations.find(sim => sim.id === id) || null;
  } catch (e) {
    console.error('Erro ao obter simulação por ID:', e);
    return null;
  }
}

/**
 * Salva (cria ou atualiza) uma simulação
 * @param {Object} simulation - Dados da simulação (deve ter um ID para atualizar)
 * @return {string | null} ID da simulação salva ou null em caso de erro
 */
export function saveSimulation(simulation) {
  try {
    const data = getAllData();
    if (!data) return null;

    const now = new Date().toISOString();
    let isNew = false;

    if (!simulation.id) {
      simulation.id = generateUniqueId();
      simulation.createdAt = now;
      isNew = true;
    }
    simulation.updatedAt = now;

    const existingIndex = data.simulations.findIndex(sim => sim.id === simulation.id);

    if (existingIndex >= 0) {
      // Atualizar simulação existente
      data.simulations[existingIndex] = simulation;
    } else if (isNew) {
      // Adicionar nova simulação
      data.simulations.push(simulation);
    } else {
        // Tentativa de atualizar simulação inexistente sem ID novo
        console.error("Tentativa de atualizar simulação inexistente:", simulation);
        return null;
    }

    if (saveAllData(data)) {
      return simulation.id;
    }

    return null;
  } catch (e) {
    console.error('Erro ao salvar simulação:', e);
    return null;
  }
}

/**
 * Exclui uma simulação pelo ID
 * @param {string} id - ID da simulação
 * @return {boolean} Verdadeiro se a exclusão for bem-sucedida
 */
export function deleteSimulation(id) {
  try {
    const data = getAllData();
    if (!data) return false;

    const initialLength = data.simulations.length;
    data.simulations = data.simulations.filter(sim => sim.id !== id);

    // Se o tamanho não mudou, a simulação não foi encontrada
    if (data.simulations.length === initialLength) return false;

    // Remover referências em cenários
    if (data.scenarios) {
        data.scenarios.forEach(scenario => {
          if (scenario.simulationIds && scenario.simulationIds.includes(id)) {
            scenario.simulationIds = scenario.simulationIds.filter(simId => simId !== id);
            scenario.updatedAt = new Date().toISOString();
          }
        });
    }

    return saveAllData(data);
  } catch (e) {
    console.error('Erro ao excluir simulação:', e);
    return false;
  }
}

/**
 * Obtém simulações recentes
 * @param {number} limit - Número máximo de simulações a retornar
 * @return {Array} Lista de simulações recentes
 */
export function getRecentSimulations(limit = 5) {
  try {
    const simulations = getAllSimulations();
    // Ordenar por data de atualização (mais recente primeiro)
    return simulations
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, limit);
  } catch (e) {
    console.error('Erro ao obter simulações recentes:', e);
    return [];
  }
}

/**
 * Duplica uma simulação existente
 * @param {string} id - ID da simulação a ser duplicada
 * @return {string | null} ID da nova simulação ou null em caso de erro
 */
export function duplicateSimulation(id) {
  try {
    const originalSimulation = getSimulationById(id);
    if (!originalSimulation) return null;

    // Criar cópia profunda para evitar mutações
    const duplicate = JSON.parse(JSON.stringify(originalSimulation));

    // Remover ID e metadados antigos
    delete duplicate.id;
    delete duplicate.createdAt;
    delete duplicate.updatedAt;

    // Atualizar nome para indicar que é uma cópia
    duplicate.name = `${originalSimulation.name || 'Simulação'} (Cópia)`;

    // Salvar nova simulação (gerará novo ID e metadados)
    return saveSimulation(duplicate);
  } catch (e) {
    console.error('Erro ao duplicar simulação:', e);
    return null;
  }
}

// --- Gerenciamento de Cenários ---

/**
 * Obtém todos os cenários armazenados
 * @return {Array} Lista de cenários ou array vazio em caso de erro
 */
export function getAllScenarios() {
  try {
    const data = getAllData();
    return data && data.scenarios ? data.scenarios : [];
  } catch (e) {
    console.error('Erro ao obter cenários:', e);
    return [];
  }
}

/**
 * Obtém um cenário pelo ID
 * @param {string} id - ID do cenário
 * @return {Object | null} Cenário encontrado ou null se não existir/erro
 */
export function getScenarioById(id) {
  try {
    const scenarios = getAllScenarios();
    return scenarios.find(scenario => scenario.id === id) || null;
  } catch (e) {
    console.error('Erro ao obter cenário por ID:', e);
    return null;
  }
}

/**
 * Salva (cria ou atualiza) um cenário
 * @param {Object} scenario - Dados do cenário (deve ter ID para atualizar)
 * @return {string | null} ID do cenário salvo ou null em caso de erro
 */
export function saveScenario(scenario) {
  try {
    const data = getAllData();
    if (!data) return null;

    const now = new Date().toISOString();
    let isNew = false;

    if (!scenario.id) {
      scenario.id = generateUniqueId();
      scenario.createdAt = now;
      isNew = true;
    }
    scenario.updatedAt = now;
    // Garante que simulationIds seja um array
    scenario.simulationIds = scenario.simulationIds || [];

    const existingIndex = data.scenarios.findIndex(s => s.id === scenario.id);

    if (existingIndex >= 0) {
      data.scenarios[existingIndex] = scenario;
    } else if (isNew) {
      data.scenarios.push(scenario);
    } else {
        console.error("Tentativa de atualizar cenário inexistente:", scenario);
        return null;
    }

    if (saveAllData(data)) {
      return scenario.id;
    }
    return null;
  } catch (e) {
    console.error('Erro ao salvar cenário:', e);
    return null;
  }
}

/**
 * Exclui um cenário pelo ID
 * @param {string} id - ID do cenário
 * @return {boolean} Verdadeiro se a exclusão for bem-sucedida
 */
export function deleteScenario(id) {
  try {
    const data = getAllData();
    if (!data) return false;

    const initialLength = data.scenarios.length;
    data.scenarios = data.scenarios.filter(scenario => scenario.id !== id);

    if (data.scenarios.length === initialLength) return false;

    // Remover referências em estudos
    if (data.studies) {
        data.studies.forEach(study => {
          if (study.scenarioIds && study.scenarioIds.includes(id)) {
            study.scenarioIds = study.scenarioIds.filter(scenarioId => scenarioId !== id);
            study.updatedAt = new Date().toISOString();
          }
        });
    }

    return saveAllData(data);
  } catch (e) {
    console.error('Erro ao excluir cenário:', e);
    return false;
  }
}

/**
 * Adiciona uma simulação a um cenário
 * @param {string} scenarioId - ID do cenário
 * @param {string} simulationId - ID da simulação
 * @return {boolean} Verdadeiro se a adição for bem-sucedida
 */
export function addSimulationToScenario(scenarioId, simulationId) {
  try {
    const data = getAllData();
    if (!data) return false;

    const scenarioIndex = data.scenarios.findIndex(s => s.id === scenarioId);
    if (scenarioIndex < 0) {
        console.error(`Cenário com ID ${scenarioId} não encontrado.`);
        return false;
    }

    // Verificar se a simulação existe
    const simulationExists = data.simulations.some(sim => sim.id === simulationId);
    if (!simulationExists) {
        console.error(`Simulação com ID ${simulationId} não encontrada.`);
        return false;
    }

    const scenario = data.scenarios[scenarioIndex];
    // Inicializar array se não existir
    if (!scenario.simulationIds) {
      scenario.simulationIds = [];
    }

    // Adicionar simulação se ainda não estiver no cenário
    if (!scenario.simulationIds.includes(simulationId)) {
      scenario.simulationIds.push(simulationId);
      scenario.updatedAt = new Date().toISOString();
      return saveAllData(data);
    } else {
      return true; // Já estava lá, considerado sucesso
    }
  } catch (e) {
    console.error('Erro ao adicionar simulação ao cenário:', e);
    return false;
  }
}

/**
 * Remove uma simulação de um cenário
 * @param {string} scenarioId - ID do cenário
 * @param {string} simulationId - ID da simulação
 * @return {boolean} Verdadeiro se a remoção for bem-sucedida
 */
export function removeSimulationFromScenario(scenarioId, simulationId) {
  try {
    const data = getAllData();
    if (!data) return false;

    const scenarioIndex = data.scenarios.findIndex(s => s.id === scenarioId);
    if (scenarioIndex < 0) return false; // Cenário não encontrado

    const scenario = data.scenarios[scenarioIndex];
    if (!scenario.simulationIds || !scenario.simulationIds.includes(simulationId)) {
      return true; // Simulação não estava no cenário, considerado sucesso
    }

    const initialLength = scenario.simulationIds.length;
    scenario.simulationIds = scenario.simulationIds.filter(id => id !== simulationId);

    // Se o tamanho mudou, atualiza e salva
    if (scenario.simulationIds.length < initialLength) {
        scenario.updatedAt = new Date().toISOString();
        return saveAllData(data);
    }
    return true; // Não precisou remover

  } catch (e) {
    console.error('Erro ao remover simulação do cenário:', e);
    return false;
  }
}

/**
 * Obtém todas as simulações de um cenário específico
 * @param {string} scenarioId - ID do cenário
 * @return {Array} Lista de objetos de simulação completos do cenário
 */
export function getSimulationsInScenario(scenarioId) {
  try {
    const scenario = getScenarioById(scenarioId);
    if (!scenario || !scenario.simulationIds || scenario.simulationIds.length === 0) {
        return [];
    }

    const allSimulations = getAllSimulations();
    // Filtrar simulações que pertencem ao cenário
    return allSimulations.filter(sim => scenario.simulationIds.includes(sim.id));
  } catch (e) {
    console.error('Erro ao obter simulações do cenário:', e);
    return [];
  }
}

// --- Gerenciamento de Estudos ---
// (Estrutura similar a Cenários, mas relacionando Cenários em vez de Simulações)

/**
 * Obtém todos os estudos armazenados
 * @return {Array} Lista de estudos ou array vazio em caso de erro
 */
export function getAllStudies() {
  try {
    const data = getAllData();
    return data && data.studies ? data.studies : [];
  } catch (e) {
    console.error('Erro ao obter estudos:', e);
    return [];
  }
}

/**
 * Obtém um estudo pelo ID
 * @param {string} id - ID do estudo
 * @return {Object | null} Estudo encontrado ou null se não existir/erro
 */
export function getStudyById(id) {
  try {
    const studies = getAllStudies();
    return studies.find(study => study.id === id) || null;
  } catch (e) {
    console.error('Erro ao obter estudo por ID:', e);
    return null;
  }
}

/**
 * Salva (cria ou atualiza) um estudo
 * @param {Object} study - Dados do estudo (deve ter ID para atualizar)
 * @return {string | null} ID do estudo salvo ou null em caso de erro
 */
export function saveStudy(study) {
  try {
    const data = getAllData();
    if (!data) return null;

    const now = new Date().toISOString();
    let isNew = false;

    if (!study.id) {
      study.id = generateUniqueId();
      study.createdAt = now;
      isNew = true;
    }
    study.updatedAt = now;
    // Garante que scenarioIds seja um array
    study.scenarioIds = study.scenarioIds || [];

    const existingIndex = data.studies.findIndex(s => s.id === study.id);

    if (existingIndex >= 0) {
      data.studies[existingIndex] = study;
    } else if (isNew) {
      data.studies.push(study);
    } else {
        console.error("Tentativa de atualizar estudo inexistente:", study);
        return null;
    }

    if (saveAllData(data)) {
      return study.id;
    }
    return null;
  } catch (e) {
    console.error('Erro ao salvar estudo:', e);
    return null;
  }
}

/**
 * Exclui um estudo pelo ID
 * @param {string} id - ID do estudo
 * @return {boolean} Verdadeiro se a exclusão for bem-sucedida
 */
export function deleteStudy(id) {
  try {
    const data = getAllData();
    if (!data) return false;

    const initialLength = data.studies.length;
    data.studies = data.studies.filter(study => study.id !== id);

    // Se o tamanho não mudou, o estudo não foi encontrado
    if (data.studies.length === initialLength) return false;

    // Não há necessidade de remover referências (Estudo é o nível mais alto aqui)

    return saveAllData(data);
  } catch (e) {
    console.error('Erro ao excluir estudo:', e);
    return false;
  }
}

/**
 * Adiciona um cenário a um estudo
 * @param {string} studyId - ID do estudo
 * @param {string} scenarioId - ID do cenário
 * @return {boolean} Verdadeiro se a adição for bem-sucedida
 */
export function addScenarioToStudy(studyId, scenarioId) {
  try {
    const data = getAllData();
    if (!data) return false;

    const studyIndex = data.studies.findIndex(s => s.id === studyId);
    if (studyIndex < 0) {
        console.error(`Estudo com ID ${studyId} não encontrado.`);
        return false;
    }

    // Verificar se o cenário existe
    const scenarioExists = data.scenarios.some(sc => sc.id === scenarioId);
    if (!scenarioExists) {
        console.error(`Cenário com ID ${scenarioId} não encontrado.`);
        return false;
    }

    const study = data.studies[studyIndex];
    if (!study.scenarioIds) {
      study.scenarioIds = [];
    }

    if (!study.scenarioIds.includes(scenarioId)) {
      study.scenarioIds.push(scenarioId);
      study.updatedAt = new Date().toISOString();
      return saveAllData(data);
    } else {
      return true; // Já estava lá
    }
  } catch (e) {
    console.error('Erro ao adicionar cenário ao estudo:', e);
    return false;
  }
}

/**
 * Remove um cenário de um estudo
 * @param {string} studyId - ID do estudo
 * @param {string} scenarioId - ID do cenário
 * @return {boolean} Verdadeiro se a remoção for bem-sucedida
 */
export function removeScenarioFromStudy(studyId, scenarioId) {
  try {
    const data = getAllData();
    if (!data) return false;

    const studyIndex = data.studies.findIndex(s => s.id === studyId);
    if (studyIndex < 0) return false;

    const study = data.studies[studyIndex];
    if (!study.scenarioIds || !study.scenarioIds.includes(scenarioId)) {
      return true; // Cenário não estava no estudo
    }

    const initialLength = study.scenarioIds.length;
    study.scenarioIds = study.scenarioIds.filter(id => id !== scenarioId);

    if (study.scenarioIds.length < initialLength) {
        study.updatedAt = new Date().toISOString();
        return saveAllData(data);
    }
    return true;

  } catch (e) {
    console.error('Erro ao remover cenário do estudo:', e);
    return false;
  }
}

/**
 * Obtém todos os cenários de um estudo específico
 * @param {string} studyId - ID do estudo
 * @return {Array} Lista de objetos de cenário completos do estudo
 */
export function getScenariosInStudy(studyId) {
  try {
    const study = getStudyById(studyId);
    if (!study || !study.scenarioIds || study.scenarioIds.length === 0) {
        return [];
    }

    const allScenarios = getAllScenarios();
    return allScenarios.filter(sc => study.scenarioIds.includes(sc.id));
  } catch (e) {
    console.error('Erro ao obter cenários do estudo:', e);
    return [];
  }
}

// --- Funções de Migração (Placeholders) ---

/**
 * Verifica se os dados precisam de migração com base na versão
 * @param {string} dataVersion - Versão dos dados armazenados
 * @return {boolean} Verdadeiro se a migração for necessária
 */
function needsMigration(dataVersion) {
  const currentAppVersion = '1.0'; // Definir a versão atual da estrutura de dados
  // Implementar lógica de comparação de versão (ex: semver)
  return dataVersion !== currentAppVersion;
}

/**
 * Executa a migração dos dados para a versão atual
 * @param {Object} data - Dados na versão antiga
 * @return {Object} Dados migrados para a versão atual
 */
function migrateData(data) {
  console.warn(`Migrando dados da versão ${data.version} para 1.0`);
  // Implementar lógica de migração passo a passo ou direta
  // Exemplo: Se versão for '0.9', renomear campos, adicionar novos, etc.
  data.version = '1.0'; // Atualiza a versão após migrar
  return data;
}

// Inicializar o armazenamento ao carregar o módulo
initializeStorage();

