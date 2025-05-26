// export.js
// Módulo responsável pela exportação de dados e relatórios

// Importação de bibliotecas (assumindo que estarão disponíveis globalmente via CDN ou bundler)
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import { saveAs } from 'file-saver';

// --- Funções Utilitárias ---

/**
 * Gera um nome de arquivo padronizado com timestamp
 * @param {string} baseName - Nome base (ex: 'relatorio_financiamento')
 * @param {string} extension - Extensão do arquivo (ex: 'pdf', 'csv')
 * @return {string} Nome de arquivo completo (ex: 'relatorio_financiamento_2025-05-26T19-16-07-000Z.pdf')
 */
export function generateFilename(baseName, extension) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${baseName}_${timestamp}.${extension}`;
}

/**
 * Formata um valor monetário para exibição em relatórios (reutiliza a função de charts.js se possível, ou define aqui)
 * @param {number} value - Valor a ser formatado
 * @return {string} Valor formatado (ex: 'R$ 1.234,56')
 */
function formatCurrencyForReport(value) {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata um valor percentual para exibição em relatórios (reutiliza a função de charts.js se possível, ou define aqui)
 * @param {number} value - Valor a ser formatado (ex: 0.05)
 * @return {string} Valor formatado (ex: '5,00%')
 */
function formatPercentageForReport(value) {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Converte uma tabela HTML (com thead e tbody) para formato de dados para jsPDF-AutoTable
 * @param {HTMLTableElement | string} tableElementOrId - Elemento da tabela HTML ou seu ID
 * @return {Object | null} Dados formatados { head: [[]], body: [[]] } ou null se a tabela não for encontrada
 */
export function htmlTableToData(tableElementOrId) {
    let tableElement;
    if (typeof tableElementOrId === 'string') {
        tableElement = document.getElementById(tableElementOrId);
    } else {
        tableElement = tableElementOrId;
    }

    if (!tableElement || !(tableElement instanceof HTMLTableElement)) {
        console.error("Elemento da tabela inválido ou não encontrado.");
        return null;
    }

    const head = [];
    const body = [];

    // Extrair cabeçalho (thead th)
    const headerRows = tableElement.querySelectorAll('thead tr');
    headerRows.forEach(row => {
        const rowData = [];
        row.querySelectorAll('th').forEach(cell => {
            rowData.push(cell.innerText.trim());
        });
        if (rowData.length > 0) head.push(rowData);
    });

    // Extrair corpo (tbody td)
    const bodyRows = tableElement.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => {
            rowData.push(cell.innerText.trim());
        });
        if (rowData.length > 0) body.push(rowData);
    });

    // Se não encontrou thead, tenta pegar do primeiro tr th
    if (head.length === 0 && bodyRows.length > 0) {
        const firstRowCells = tableElement.querySelectorAll('tr:first-child th');
        if (firstRowCells.length > 0) {
            const rowData = [];
            firstRowCells.forEach(cell => rowData.push(cell.innerText.trim()));
            head.push(rowData);
        }
    }

    return { head, body };
}

// --- Exportação para JSON ---

/**
 * Exporta dados como um arquivo JSON
 * @param {Object|Array} data - Dados a serem exportados
 * @param {string} filenameBase - Nome base para o arquivo
 */
export function exportToJson(data, filenameBase = 'dados') {
  try {
    // Verificar se FileSaver está disponível
    if (typeof saveAs === 'undefined') {
        console.error('FileSaver.js não está carregado. Inclua a biblioteca no seu HTML.');
        alert('Erro: Biblioteca de salvamento não encontrada.');
        return;
    }

    const jsonString = JSON.stringify(data, null, 2); // Formatação com indentação
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const filename = generateFilename(filenameBase, 'json');

    saveAs(blob, filename);
  } catch (error) {
    console.error('Erro ao exportar para JSON:', error);
    alert('Ocorreu um erro ao exportar os dados para JSON.');
  }
}

// --- Exportação para CSV ---

/**
 * Converte um array de objetos para formato CSV string
 * @param {Array<Object>} dataArray - Array de objetos
 * @param {Array<string>} headers - Cabeçalhos (opcional, extrai das chaves se não fornecido)
 * @return {string} String CSV
 */
function convertToCsv(dataArray, headers) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return '';
  }

  // Obter cabeçalhos das chaves do primeiro objeto se não fornecidos
  const columnHeaders = headers || Object.keys(dataArray[0]);

  // Função para escapar valores CSV
  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    let stringValue = String(value);
    // Se contém vírgula, aspas ou quebra de linha, colocar entre aspas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      // Escapar aspas existentes duplicando-as
      stringValue = stringValue.replace(/"/g, '""');
      return `"${stringValue}"`;
    }
    return stringValue;
  };

  // Montar linha de cabeçalho
  const headerRow = columnHeaders.map(escapeCsvValue).join(',');

  // Montar linhas de dados
  const dataRows = dataArray.map(row => {
    return columnHeaders.map(header => escapeCsvValue(row[header])).join(',');
  });

  // Combinar cabeçalho e dados com quebra de linha Windows (CRLF) para maior compatibilidade
  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Exporta dados de uma tabela (array de objetos) como um arquivo CSV
 * @param {Array<Object>} data - Dados da tabela
 * @param {string} filenameBase - Nome base para o arquivo
 * @param {Array<string>} headers - Cabeçalhos (opcional)
 */
export function exportTableToCsv(data, filenameBase = 'tabela', headers) {
  try {
    // Verificar se FileSaver está disponível
    if (typeof saveAs === 'undefined') {
        console.error('FileSaver.js não está carregado.');
        alert('Erro: Biblioteca de salvamento não encontrada.');
        return;
    }

    const csvString = convertToCsv(data, headers);
    // Adicionar BOM (Byte Order Mark) para UTF-8 garantir compatibilidade com Excel
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const filename = generateFilename(filenameBase, 'csv');

    saveAs(blob, filename);
  } catch (error) {
    console.error('Erro ao exportar para CSV:', error);
    alert('Ocorreu um erro ao exportar os dados para CSV.');
  }
}

// --- Exportação de Gráficos (Imagem) ---

/**
 * Exporta um gráfico (elemento canvas) como uma imagem PNG ou JPG
 * @param {string} canvasId - ID do elemento canvas do gráfico
 * @param {string} filenameBase - Nome base para o arquivo
 * @param {string} format - Formato da imagem ('png' ou 'jpeg')
 * @param {Object} options - Opções adicionais (ex: { backgroundColor: '#FFFFFF' })
 */
export function exportChartToImage(canvasId, filenameBase = 'grafico', format = 'png', options = {}) {
  try {
    // Verificar se FileSaver está disponível
    if (typeof saveAs === 'undefined') {
        console.error('FileSaver.js não está carregado.');
        alert('Erro: Biblioteca de salvamento não encontrada.');
        return;
    }

    const canvas = document.getElementById(canvasId);
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas com ID ${canvasId} não encontrado ou inválido.`);
    }

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    const filename = generateFilename(filenameBase, extension);

    // Se um fundo for especificado (útil para gráficos com fundo transparente)
    if (options.backgroundColor) {
      const originalCanvas = canvas;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = originalCanvas.width;
      newCanvas.height = originalCanvas.height;
      const ctx = newCanvas.getContext('2d');

      // Desenhar fundo
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

      // Desenhar gráfico original sobre o fundo
      // Garante que a imagem do gráfico esteja completamente renderizada
      // (Pode precisar de um pequeno delay ou usar a instância do Chart.js se disponível)
      ctx.drawImage(originalCanvas, 0, 0);

      // Exportar novo canvas
      newCanvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, filename);
        } else {
          throw new Error('Falha ao gerar blob da imagem com fundo.');
        }
      }, mimeType, options.quality || 0.92); // Qualidade para JPEG

    } else {
      // Exportar canvas original diretamente
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, filename);
        } else {
          throw new Error('Falha ao gerar blob da imagem.');
        }
      }, mimeType, options.quality || 0.92);
    }

  } catch (error) {
    console.error('Erro ao exportar gráfico para imagem:', error);
    alert('Ocorreu um erro ao exportar o gráfico: ' + error.message);
  }
}

// --- Exportação para PDF ---

/**
 * Adiciona um cabeçalho e rodapé padrão a todas as páginas de um documento PDF jsPDF
 * @param {jsPDF} doc - Instância do jsPDF
 * @param {string} title - Título do documento para o cabeçalho
 */
function addPdfHeaderFooter(doc, title = 'Relatório de Análise Imobiliária') {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'normal'); // Reset font
  doc.setFontSize(9);
  doc.setTextColor(150); // Cor cinza para header/footer

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Cabeçalho (Título centralizado)
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    // Rodapé (Página X de Y | Data)
    const footerText = `Página ${i} de ${pageCount} | Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  // Reset text color for content
  doc.setTextColor(0);
}

/**
 * Exporta um relatório completo em PDF contendo texto, tabelas e gráficos.
 * Requer jsPDF e jspdf-autotable carregados.
 * @param {Object} reportConfig - Configuração do relatório
 * @param {string} reportConfig.title - Título principal do relatório
 * @param {string} [reportConfig.filenameBase='relatorio'] - Nome base para o arquivo PDF
 * @param {Array<Object>} reportConfig.sections - Array de seções do relatório
 *        Cada seção pode ter: { type: 'text', content: 'string' | string[] },
 *                           { type: 'table', title: 'string', tableId: 'string' | HTMLTableElement, options: {} },
 *                           { type: 'chart', title: 'string', canvasId: 'string', options: {} },
 *                           { type: 'spacer', height: number },
 *                           { type: 'newPage' }
 * @param {Object} [pdfOptions] - Opções para o construtor do jsPDF (orientation, unit, format)
 */
export function exportGenericReportToPdf(reportConfig, pdfOptions = {}) {
  try {
    // Verificar dependências
    if (typeof jsPDF === 'undefined' || typeof jsPDF.API.autoTable === 'undefined') {
        console.error('jsPDF ou jsPDF-AutoTable não estão carregados.');
        alert('Erro: Bibliotecas necessárias para gerar PDF não encontradas.');
        return;
    }
    if (typeof saveAs === 'undefined') {
        console.error('FileSaver.js não está carregado.');
        alert('Erro: Biblioteca de salvamento não encontrada.');
        return;
    }

    const doc = new jsPDF({
      orientation: pdfOptions.orientation || 'portrait',
      unit: pdfOptions.unit || 'pt',
      format: pdfOptions.format || 'a4'
    });

    let yPosition = pdfOptions.startY || 40; // Posição vertical inicial
    const margin = pdfOptions.margin || 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - 2 * margin;

    // Função para adicionar nova página se necessário
    const checkAddPage = (heightNeeded = 20) => {
      if (yPosition + heightNeeded > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true; // Indicador que a página foi adicionada
      }
      return false;
    };

    // --- Título Principal ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(reportConfig.title || 'Relatório', margin, yPosition, { maxWidth: usableWidth });
    yPosition += doc.getTextDimensions(reportConfig.title || 'Relatório', { maxWidth: usableWidth }).h + 20;

    // --- Processar Seções ---
    for (const section of reportConfig.sections) {
        checkAddPage(); // Verifica espaço antes de cada seção

        switch (section.type) {
            case 'text':
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(section.fontSize || 10);
                const textLines = doc.splitTextToSize(section.content, usableWidth);
                const textHeight = doc.getTextDimensions(textLines).h;
                checkAddPage(textHeight);
                doc.text(textLines, margin, yPosition);
                yPosition += textHeight + (section.marginBottom || 10);
                break;

            case 'table':
                if (section.title) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    checkAddPage(20);
                    doc.text(section.title, margin, yPosition);
                    yPosition += 15;
                }
                const tableData = htmlTableToData(section.tableId);
                if (tableData) {
                    doc.autoTable({
                        head: tableData.head,
                        body: tableData.body,
                        startY: yPosition,
                        margin: { left: margin, right: margin },
                        theme: section.theme || 'grid', // 'striped', 'grid', 'plain'
                        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', ...section.styles },
                        headStyles: { fillColor: [54, 162, 235], textColor: 255, fontStyle: 'bold', ...section.headStyles },
                        didDrawPage: (data) => {
                            // Atualizar yPosition após desenhar a tabela na página
                            yPosition = data.cursor.y + 10;
                        },
                        // Adicionar outras opções do autoTable conforme necessário
                        ...section.options
                    });
                    // yPosition é atualizado pelo callback didDrawPage ou pelo valor final retornado
                    yPosition = doc.autoTable.previous.finalY + 10;
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(9);
                    doc.setTextColor(255, 0, 0);
                    checkAddPage(15);
                    doc.text(`Tabela '${section.tableId}' não encontrada ou inválida.`, margin, yPosition);
                    yPosition += 15;
                    doc.setTextColor(0);
                }
                break;

            case 'chart':
                const canvas = document.getElementById(section.canvasId);
                if (canvas && canvas instanceof HTMLCanvasElement) {
                    if (section.title) {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(12);
                        checkAddPage(20);
                        doc.text(section.title, margin, yPosition);
                        yPosition += 15;
                    }
                    try {
                        const imgData = canvas.toDataURL('image/png', section.quality || 0.9);
                        const imgProps = doc.getImageProperties(imgData);
                        let imgHeight = (imgProps.height * usableWidth) / imgProps.width;
                        let imgWidth = usableWidth;
                        // Limitar altura máxima se necessário
                        const maxHeight = pageHeight - yPosition - margin - 10; // -10 para margem inferior
                        if (imgHeight > maxHeight) {
                            imgHeight = maxHeight;
                            imgWidth = (imgProps.width * maxHeight) / imgProps.height;
                        }

                        checkAddPage(imgHeight + 10);
                        const xPos = margin + (usableWidth - imgWidth) / 2; // Centralizar imagem se menor que usableWidth
                        doc.addImage(imgData, 'PNG', xPos, yPosition, imgWidth, imgHeight);
                        yPosition += imgHeight + (section.marginBottom || 15);
                    } catch (imgError) {
                        console.warn(`Erro ao adicionar gráfico ${section.canvasId} ao PDF:`, imgError);
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(9);
                        doc.setTextColor(255, 0, 0);
                        checkAddPage(15);
                        doc.text(`(Não foi possível incluir o gráfico: ${section.canvasId})`, margin, yPosition);
                        yPosition += 15;
                        doc.setTextColor(0);
                    }
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(9);
                    doc.setTextColor(255, 0, 0);
                    checkAddPage(15);
                    doc.text(`Gráfico (canvas) '${section.canvasId}' não encontrado ou inválido.`, margin, yPosition);
                    yPosition += 15;
                    doc.setTextColor(0);
                }
                break;

            case 'spacer':
                const spaceHeight = section.height || 10;
                checkAddPage(spaceHeight);
                yPosition += spaceHeight;
                break;

            case 'newPage':
                doc.addPage();
                yPosition = margin;
                break;

            default:
                console.warn(`Tipo de seção desconhecido: ${section.type}`);
        }
    }

    // --- Adicionar Cabeçalho e Rodapé em todas as páginas ---
    addPdfHeaderFooter(doc, reportConfig.title || 'Relatório');

    // --- Salvar PDF ---
    const filename = generateFilename(reportConfig.filenameBase || 'relatorio', 'pdf');
    doc.save(filename);

  } catch (error) {
    console.error('Erro ao gerar relatório PDF:', error);
    alert('Ocorreu um erro ao gerar o relatório PDF: ' + error.message);
  }
}

// --- Tratamento de Erros (Placeholder) ---

/**
 * Função genérica para tratar erros de exportação (pode ser expandida)
 * @param {Error} error - Erro capturado
 * @param {string} format - Formato de exportação (pdf, csv, json, image)
 */
export function handleExportError(error, format) {
  console.error(`Erro ao exportar para ${format.toUpperCase()}:`, error);
  alert(`Ocorreu um erro inesperado ao exportar para ${format.toUpperCase()}. Verifique o console para detalhes.`);
  // Adicionar lógica mais específica baseada no tipo de erro, se necessário
}

