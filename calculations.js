// calculations.js
// Módulo responsável por todos os cálculos financeiros

/**
 * Calcula o valor presente de um fluxo de caixa futuro
 * @param {number} futureValue - Valor futuro
 * @param {number} rate - Taxa de juros (decimal) por período
 * @param {number} periods - Número de períodos
 * @return {number} Valor presente
 */
export function presentValue(futureValue, rate, periods) {
  return futureValue / Math.pow(1 + rate, periods);
}

/**
 * Calcula o valor futuro de um investimento
 * @param {number} presentValue - Valor presente
 * @param {number} rate - Taxa de juros (decimal) por período
 * @param {number} periods - Número de períodos
 * @return {number} Valor futuro
 */
export function futureValue(presentValue, rate, periods) {
  return presentValue * Math.pow(1 + rate, periods);
}

/**
 * Converte taxa de juros anual para mensal
 * @param {number} annualRate - Taxa anual (decimal)
 * @return {number} Taxa mensal (decimal)
 */
export function annualToMonthlyRate(annualRate) {
  return Math.pow(1 + annualRate, 1/12) - 1;
}

/**
 * Converte taxa de juros mensal para anual
 * @param {number} monthlyRate - Taxa mensal (decimal)
 * @return {number} Taxa anual (decimal)
 */
export function monthlyToAnnualRate(monthlyRate) {
  return Math.pow(1 + monthlyRate, 12) - 1;
}

/**
 * Calcula o custo total de aquisição à vista
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.propertyValue - Valor do imóvel
 * @param {number} params.acquisitionCosts - Custos de aquisição (ITBI, escritura, etc.)
 * @param {number} params.maintenanceCosts - Custos de manutenção anuais
 * @param {number} params.timeHorizon - Horizonte de tempo em anos
 * @param {number} params.alternativeInvestmentReturn - Retorno de investimento alternativo anual (decimal)
 * @param {number} params.projectedInflation - Inflação projetada anual (decimal)
 * @param {number} params.projectedAppreciation - Valorização imobiliária projetada anual (decimal)
 * @return {Object} Resultados dos cálculos
 */
export function calculateCashPurchase(params) {
  const {
    propertyValue,
    acquisitionCosts,
    maintenanceCosts,
    timeHorizon,
    alternativeInvestmentReturn,
    projectedInflation,
    projectedAppreciation
  } = params;

  // Cálculo do custo total de aquisição
  const totalAcquisitionCost = propertyValue + acquisitionCosts;

  // Cálculo do custo de oportunidade
  const opportunityCost = futureValue(totalAcquisitionCost, alternativeInvestmentReturn, timeHorizon) - totalAcquisitionCost;

  // Cálculo do valor futuro do imóvel
  const futurePropertyValue = futureValue(propertyValue, projectedAppreciation, timeHorizon);

  // Cálculo dos custos de manutenção acumulados (corrigidos pela inflação)
  let accumulatedMaintenanceCosts = 0;
  for (let i = 0; i < timeHorizon; i++) {
    const yearlyMaintenanceCost = maintenanceCosts * Math.pow(1 + projectedInflation, i);
    accumulatedMaintenanceCosts += yearlyMaintenanceCost;
  }

  // Cálculo do retorno do investimento (simplificado)
  const investmentReturn = (futurePropertyValue - propertyValue - accumulatedMaintenanceCosts) / propertyValue;

  // Cálculo do resultado líquido
  const netResult = futurePropertyValue - totalAcquisitionCost - accumulatedMaintenanceCosts;

  return {
    totalAcquisitionCost,
    opportunityCost,
    futurePropertyValue,
    accumulatedMaintenanceCosts,
    investmentReturn,
    netResult
  };
}

/**
 * Calcula a tabela de amortização pelo sistema Price
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.loanAmount - Valor financiado
 * @param {number} params.interestRate - Taxa de juros mensal (decimal)
 * @param {number} params.loanTerm - Prazo do financiamento em meses
 * @return {Object} Tabela de amortização e resultados
 */
export function calculatePriceSystem(params) {
  const { loanAmount, interestRate, loanTerm } = params;

  // Cálculo da parcela fixa
  const monthlyPayment = loanAmount * (interestRate * Math.pow(1 + interestRate, loanTerm)) / (Math.pow(1 + interestRate, loanTerm) - 1);

  // Geração da tabela de amortização
  const amortizationTable = [];
  let remainingBalance = loanAmount;
  let totalInterest = 0;
  let totalAmortization = 0;

  for (let month = 1; month <= loanTerm; month++) {
    const interestPayment = remainingBalance * interestRate;
    const amortizationPayment = monthlyPayment - interestPayment;
    remainingBalance -= amortizationPayment;

    totalInterest += interestPayment;
    totalAmortization += amortizationPayment;

    amortizationTable.push({
      month,
      payment: monthlyPayment,
      interest: interestPayment,
      amortization: amortizationPayment,
      remainingBalance: Math.max(0, remainingBalance) // Evitar saldo negativo por arredondamento
    });
  }

  return {
    monthlyPayment,
    totalPayment: monthlyPayment * loanTerm,
    totalInterest,
    totalAmortization,
    amortizationTable
  };
}

/**
 * Calcula a tabela de amortização pelo sistema SAC
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.loanAmount - Valor financiado
 * @param {number} params.interestRate - Taxa de juros mensal (decimal)
 * @param {number} params.loanTerm - Prazo do financiamento em meses
 * @return {Object} Tabela de amortização e resultados
 */
export function calculateSACSystem(params) {
  const { loanAmount, interestRate, loanTerm } = params;

  // Cálculo da amortização fixa
  const fixedAmortization = loanAmount / loanTerm;

  // Geração da tabela de amortização
  const amortizationTable = [];
  let remainingBalance = loanAmount;
  let totalInterest = 0;
  let totalPayment = 0;

  for (let month = 1; month <= loanTerm; month++) {
    const interestPayment = remainingBalance * interestRate;
    const monthlyPayment = fixedAmortization + interestPayment;
    remainingBalance -= fixedAmortization;

    totalInterest += interestPayment;
    totalPayment += monthlyPayment;

    amortizationTable.push({
      month,
      payment: monthlyPayment,
      interest: interestPayment,
      amortization: fixedAmortization,
      remainingBalance: Math.max(0, remainingBalance) // Evitar saldo negativo por arredondamento
    });
  }

  return {
    initialPayment: amortizationTable[0].payment,
    finalPayment: amortizationTable[amortizationTable.length - 1].payment,
    totalPayment,
    totalInterest,
    totalAmortization: loanAmount,
    amortizationTable
  };
}

/**
 * Calcula a tabela de amortização pelo sistema SACRE
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.loanAmount - Valor financiado
 * @param {number} params.interestRate - Taxa de juros mensal (decimal)
 * @param {number} params.loanTerm - Prazo do financiamento em meses
 * @return {Object} Tabela de amortização e resultados
 */
export function calculateSACRESystem(params) {
  const { loanAmount, interestRate, loanTerm } = params;

  // Geração da tabela de amortização
  const amortizationTable = [];
  let remainingBalance = loanAmount;
  let totalInterest = 0;
  let totalPayment = 0;

  // Número de recálculos (a cada 12 meses)
  const recalculationPeriods = Math.ceil(loanTerm / 12);

  for (let period = 0; period < recalculationPeriods; period++) {
    const remainingMonthsInPeriod = Math.min(12, loanTerm - period * 12);
    const remainingTermMonthsTotal = loanTerm - period * 12;

    // Cálculo da amortização fixa para o período atual
    const fixedAmortization = remainingBalance / remainingTermMonthsTotal;

    for (let m = 0; m < remainingMonthsInPeriod; m++) {
      const month = period * 12 + m + 1;
      const interestPayment = remainingBalance * interestRate;
      const monthlyPayment = fixedAmortization + interestPayment;
      remainingBalance -= fixedAmortization;

      totalInterest += interestPayment;
      totalPayment += monthlyPayment;

      amortizationTable.push({
        month,
        payment: monthlyPayment,
        interest: interestPayment,
        amortization: fixedAmortization,
        remainingBalance: Math.max(0, remainingBalance) // Evitar saldo negativo
      });
    }
  }

  return {
    initialPayment: amortizationTable[0].payment,
    finalPayment: amortizationTable[amortizationTable.length - 1].payment,
    totalPayment,
    totalInterest,
    totalAmortization: loanAmount,
    amortizationTable
  };
}

/**
 * Calcula o financiamento completo, incluindo entrada e custos
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.propertyValue - Valor do imóvel
 * @param {number} params.downPayment - Valor da entrada
 * @param {number} params.loanTerm - Prazo do financiamento em meses
 * @param {number} params.interestRate - Taxa de juros mensal (decimal)
 * @param {string} params.amortizationSystem - Sistema de amortização ('PRICE', 'SAC', 'SACRE')
 * @param {number} params.acquisitionCosts - Custos de aquisição (ITBI, escritura, etc.)
 * @param {number} params.monthlyIncome - Renda familiar mensal
 * @param {number} params.fgtsValue - Valor do FGTS utilizado (opcional)
 * @param {number} params.projectedInflation - Inflação projetada anual (decimal)
 * @param {number} params.projectedAppreciation - Valorização imobiliária projetada anual (decimal)
 * @return {Object} Resultados do financiamento
 */
export function calculateFinancing(params) {
  const {
    propertyValue,
    downPayment,
    loanTerm,
    interestRate,
    amortizationSystem,
    acquisitionCosts,
    monthlyIncome,
    fgtsValue = 0,
    projectedInflation,
    projectedAppreciation
  } = params;

  // Cálculo do valor financiado
  const loanAmount = propertyValue - downPayment - fgtsValue;
  if (loanAmount <= 0) {
      throw new Error('O valor financiado deve ser positivo.');
  }

  // Verificação do comprometimento máximo da renda (30%)
  const maxMonthlyPayment = monthlyIncome * 0.3;

  // Cálculo da tabela de amortização de acordo com o sistema escolhido
  let financingResult;

  if (amortizationSystem === 'PRICE') {
    financingResult = calculatePriceSystem({ loanAmount, interestRate, loanTerm });
  } else if (amortizationSystem === 'SAC') {
    financingResult = calculateSACSystem({ loanAmount, interestRate, loanTerm });
  } else if (amortizationSystem === 'SACRE') {
    financingResult = calculateSACRESystem({ loanAmount, interestRate, loanTerm });
  } else {
    throw new Error('Sistema de amortização não reconhecido');
  }

  // Verificação se a parcela inicial excede o limite de 30% da renda
  const initialPayment = amortizationSystem === 'PRICE'
    ? financingResult.monthlyPayment
    : financingResult.initialPayment;

  const isAffordable = initialPayment <= maxMonthlyPayment;

  // Cálculo do custo total
  const totalCost = downPayment + fgtsValue + acquisitionCosts + financingResult.totalPayment;

  // Cálculo do valor futuro do imóvel
  const futurePropertyValue = futureValue(propertyValue, projectedAppreciation, loanTerm / 12);

  // Cálculo do resultado líquido
  const netResult = futurePropertyValue - totalCost;

  return {
    loanAmount,
    maxMonthlyPayment,
    isAffordable,
    totalCost,
    futurePropertyValue,
    netResult,
    ...financingResult
  };
}

/**
 * Calcula as parcelas e evolução de um consórcio imobiliário
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.creditValue - Valor da carta de crédito
 * @param {number} params.term - Prazo do consórcio em meses
 * @param {number} params.administrationFeeRate - Taxa de administração total (decimal, ex: 0.15 para 15%)
 * @param {number} params.reserveFundRate - Taxa do fundo de reserva total (decimal)
 * @param {number} params.insuranceRate - Taxa de seguro mensal (decimal, sobre o valor do crédito)
 * @param {number} params.bidValue - Valor do lance (opcional)
 * @param {string} params.bidPaymentMethod - Método de pagamento do lance ('cash', 'fgts')
 * @param {number} params.projectedInflation - Inflação projetada anual (decimal)
 * @param {number} params.projectedAppreciation - Valorização imobiliária projetada anual (decimal)
 * @return {Object} Resultados do consórcio
 */
export function calculateConsortium(params) {
  const {
    creditValue,
    term,
    administrationFeeRate,
    reserveFundRate,
    insuranceRate,
    bidValue = 0,
    bidPaymentMethod, // Não usado diretamente nos cálculos, mas pode ser útil para a lógica da aplicação
    projectedInflation,
    projectedAppreciation
  } = params;

  // Cálculo dos percentuais mensais
  const monthlyCommonFundRate = 1 / term;
  const monthlyAdminFeeRate = administrationFeeRate / term;
  const monthlyReserveFundRate = reserveFundRate / term;

  // Cálculo dos valores mensais
  const monthlyCommonFund = creditValue * monthlyCommonFundRate;
  const monthlyAdminFee = creditValue * monthlyAdminFeeRate;
  const monthlyReserveFund = creditValue * monthlyReserveFundRate;
  const monthlyInsurance = creditValue * insuranceRate; // Assumindo taxa mensal

  // Cálculo da parcela mensal total
  const monthlyPayment = monthlyCommonFund + monthlyAdminFee + monthlyReserveFund + monthlyInsurance;

  // Cálculo do custo total
  const totalCommonFund = monthlyCommonFund * term;
  const totalAdminFee = monthlyAdminFee * term;
  const totalReserveFund = monthlyReserveFund * term;
  const totalInsurance = monthlyInsurance * term;
  const totalCost = totalCommonFund + totalAdminFee + totalReserveFund + totalInsurance;

  // Cálculo do custo efetivo (considerando o valor do crédito)
  const effectiveCost = (totalCost / creditValue) - 1;

  // Geração da tabela de evolução (simplificada, sem simulação de contemplação real)
  const evolutionTable = [];
  let accumulatedFund = 0;
  let contemplated = false;
  let contemplationMonth = null; // Simplificado: mês em que o fundo acumulado + lance >= crédito

  for (let month = 1; month <= term; month++) {
    accumulatedFund += monthlyCommonFund;

    // Verificação simplificada de contemplação por lance ou fundo
    if (!contemplated && (accumulatedFund + bidValue >= creditValue || accumulatedFund >= creditValue)) {
        contemplated = true;
        contemplationMonth = month;
    }

    evolutionTable.push({
      month,
      payment: monthlyPayment,
      commonFund: monthlyCommonFund,
      adminFee: monthlyAdminFee,
      reserveFund: monthlyReserveFund,
      insurance: monthlyInsurance,
      accumulatedFund,
      contemplated // Indica se seria possível ser contemplado neste mês (simplificado)
    });
  }

  // Cálculo do valor futuro do imóvel (assumindo que o crédito é usado para comprar)
  const futurePropertyValue = futureValue(creditValue, projectedAppreciation, term / 12);

  // Cálculo do resultado líquido (simplificado)
  const netResult = futurePropertyValue - totalCost - bidValue;

  return {
    monthlyPayment,
    totalCost,
    effectiveCost,
    contemplationMonth, // Mês estimado de contemplação (simplificado)
    futurePropertyValue,
    netResult,
    evolutionTable,
    breakdown: {
      monthlyCommonFund,
      monthlyAdminFee,
      monthlyReserveFund,
      monthlyInsurance,
      totalCommonFund,
      totalAdminFee,
      totalReserveFund,
      totalInsurance
    }
  };
}

/**
 * Calcula a evolução e custos do aluguel ao longo do tempo
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.monthlyRent - Valor mensal do aluguel inicial
 * @param {number} params.annualAdjustmentRate - Taxa de reajuste anual (decimal, ex: IGPM)
 * @param {number} params.timeHorizon - Horizonte de tempo em anos
 * @param {number} params.depositValue - Valor do depósito caução/garantia (opcional)
 * @param {number} params.insuranceCost - Custo anual do seguro fiança (opcional)
 * @param {number} params.administrationFee - Taxa mensal de administração imobiliária (opcional)
 * @param {number} params.propertyTax - IPTU anual (opcional)
 * @param {number} params.condominiumFee - Taxa de condomínio mensal (opcional)
 * @param {number} params.availableInvestment - Valor disponível para investimento alternativo (opcional)
 * @param {number} params.investmentReturn - Retorno anual do investimento alternativo (decimal)
 * @param {number} params.projectedInflation - Inflação projetada anual (decimal)
 * @return {Object} Resultados do aluguel
 */
export function calculateRent(params) {
  const {
    monthlyRent,
    annualAdjustmentRate,
    timeHorizon,
    depositValue = 0,
    insuranceCost = 0,
    administrationFee = 0,
    propertyTax = 0,
    condominiumFee = 0,
    availableInvestment = 0,
    investmentReturn,
    projectedInflation // Usado para corrigir custos como IPTU e Condomínio
  } = params;

  // Geração da tabela de evolução
  const evolutionTable = [];
  let currentRent = monthlyRent;
  let currentCondoFee = condominiumFee;
  let currentPropertyTax = propertyTax;
  let totalRentPaid = 0;
  let totalAdditionalCosts = 0;

  for (let year = 1; year <= timeHorizon; year++) {
    // Reajuste anual (a partir do segundo ano)
    if (year > 1) {
      currentRent *= (1 + annualAdjustmentRate);
      // Corrigir custos adicionais pela inflação
      currentCondoFee *= (1 + projectedInflation);
      currentPropertyTax *= (1 + projectedInflation);
    }

    // Cálculo dos custos anuais
    const annualRent = currentRent * 12;
    const annualAdminFee = administrationFee * 12; // Assumindo taxa mensal fixa
    const annualCondominiumFee = currentCondoFee * 12;
    const annualTotalCost = annualRent + annualAdminFee + currentPropertyTax + annualCondominiumFee + insuranceCost; // Seguro fiança anual

    totalRentPaid += annualRent;
    totalAdditionalCosts += annualAdminFee + currentPropertyTax + annualCondominiumFee + insuranceCost;

    evolutionTable.push({
      year,
      monthlyRent: currentRent,
      annualRent,
      annualAdminFee,
      propertyTax: currentPropertyTax,
      annualCondominiumFee,
      insuranceCost, // Anual
      annualTotalCost,
      cumulativeRentPaid: totalRentPaid,
      cumulativeTotalCost: totalRentPaid + totalAdditionalCosts + depositValue // Custo acumulado incluindo depósito inicial
    });
  }

  // Cálculo do investimento alternativo
  const futureInvestmentValue = futureValue(availableInvestment, investmentReturn, timeHorizon);
  const investmentGain = futureInvestmentValue - availableInvestment;

  // Cálculo do custo total
  const initialCosts = depositValue; // Seguro fiança já está nos custos anuais
  const totalCost = totalRentPaid + totalAdditionalCosts + initialCosts;

  // Cálculo do resultado líquido (considerando o investimento alternativo)
  // Resultado negativo significa que o custo total foi maior que o ganho do investimento
  const netResult = futureInvestmentValue - totalCost;

  return {
    totalRentPaid,
    totalAdditionalCosts,
    initialCosts,
    totalCost,
    futureInvestmentValue,
    investmentGain,
    netResult,
    evolutionTable
  };
}

/**
 * Calcula o impacto de uma amortização extraordinária no financiamento
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.currentBalance - Saldo devedor atual
 * @param {number} params.amortizationValue - Valor da amortização
 * @param {number} params.interestRate - Taxa de juros mensal (decimal)
 * @param {number} params.remainingTerm - Prazo restante em meses
 * @param {number} params.currentPayment - Valor da parcela atual (relevante para Price)
 * @param {string} params.amortizationSystem - Sistema de amortização ('PRICE', 'SAC')
 * @param {string} params.amortizationType - Tipo de amortização ('reduceTerm', 'reducePayment')
 * @return {Object} Resultados da amortização
 */
export function calculateAmortizationImpact(params) {
  const {
    currentBalance,
    amortizationValue,
    interestRate,
    remainingTerm,
    currentPayment,
    amortizationSystem,
    amortizationType
  } = params;

  // Cálculo do novo saldo devedor
  const newBalance = currentBalance - amortizationValue;
  if (newBalance < 0) {
      throw new Error('Valor da amortização excede o saldo devedor.');
  }
  if (newBalance === 0) {
      return { // Quitou o financiamento
          originalBalance: currentBalance,
          newBalance: 0,
          amortizationValue,
          originalTerm: remainingTerm,
          newTerm: 0,
          originalPayment: currentPayment,
          newPayment: 0,
          termReduction: remainingTerm,
          paymentReduction: currentPayment,
          interestSavings: 'Financiamento quitado'
      };
  }

  let newTerm = remainingTerm;
  let newPayment = currentPayment;
  let interestSavings = 0;

  // Calcular o total de juros original restante (aproximado)
  let originalTotalInterestRemaining = 0;
  if (amortizationSystem === 'PRICE') {
      originalTotalInterestRemaining = (currentPayment * remainingTerm) - currentBalance;
  } else { // SAC (aproximação linear)
      let tempBalance = currentBalance;
      const fixedAmortization = currentBalance / remainingTerm;
      for(let i=0; i<remainingTerm; i++){
          originalTotalInterestRemaining += tempBalance * interestRate;
          tempBalance -= fixedAmortization;
      }
  }

  if (amortizationType === 'reduceTerm') {
    // Redução do prazo (mantendo parcela ou recalculando para SAC)
    if (amortizationSystem === 'PRICE') {
      newPayment = currentPayment; // Mantém a parcela
      // Calcular novo prazo usando logaritmo
      // PMT = PV * [i(1+i)^n] / [(1+i)^n - 1]
      // Isolando n: n = -log(1 - (PV * i) / PMT) / log(1 + i)
      if (newBalance * interestRate >= newPayment) {
          // Caso a parcela seja menor ou igual aos juros do novo saldo, o prazo seria infinito ou negativo.
          // Isso pode acontecer se a amortização for muito grande. Na prática, quitaria rápido.
          // Vamos calcular o pagamento mínimo para o novo saldo e prazo original e comparar.
          const minPaymentForNewBalance = calculatePriceSystem({loanAmount: newBalance, interestRate, loanTerm: remainingTerm}).monthlyPayment;
          if(newPayment < minPaymentForNewBalance){
             // A parcela atual não é suficiente para cobrir nem os juros do novo saldo no prazo original.
             // Isso indica um cenário incomum ou erro nos dados. Vamos recalcular a parcela para o prazo original.
             console.warn("Parcela atual insuficiente para novo saldo. Recalculando para manter prazo.");
             newPayment = minPaymentForNewBalance;
             newTerm = remainingTerm;
          } else {
             newTerm = -Math.log(1 - (newBalance * interestRate) / newPayment) / Math.log(1 + interestRate);
             newTerm = Math.ceil(newTerm); // Arredonda para cima
          }
      }
      else {
        newTerm = -Math.log(1 - (newBalance * interestRate) / newPayment) / Math.log(1 + interestRate);
        newTerm = Math.ceil(newTerm); // Arredonda para cima
      }

    } else { // SAC
      // No SAC, a amortização é fixa. Reduzir prazo significa recalcular a amortização.
      // A parcela diminui naturalmente. Para 'reduzir prazo' no SAC, geralmente se recalcula a parcela para um novo prazo.
      // A interpretação mais comum é manter a parcela (se possível) ou recalcular para quitar mais rápido.
      // Vamos assumir que o objetivo é quitar mais rápido, recalculando a parcela.
      const fixedAmortization = newBalance / remainingTerm; // Amortização se mantivesse o prazo
      let tempBalance = newBalance;
      let tempTerm = 0;
      let firstPayment = 0;
      while(tempBalance > 0 && tempTerm < remainingTerm * 2) { // Limite de segurança
          const interest = tempBalance * interestRate;
          const payment = fixedAmortization + interest;
          if(tempTerm === 0) firstPayment = payment;
          tempBalance -= fixedAmortization;
          tempTerm++;
      }
      newTerm = tempTerm;
      newPayment = firstPayment; // Nova primeira parcela
    }

  } else if (amortizationType === 'reducePayment') {
    // Redução da parcela (mantendo prazo)
    newTerm = remainingTerm;
    if (amortizationSystem === 'PRICE') {
      newPayment = calculatePriceSystem({ loanAmount: newBalance, interestRate, loanTerm: newTerm }).monthlyPayment;
    } else { // SAC
      const newFixedAmortization = newBalance / newTerm;
      newPayment = newFixedAmortization + (newBalance * interestRate); // Nova primeira parcela
    }
  }

  // Calcular o total de juros novo restante (aproximado)
  let newTotalInterestRemaining = 0;
  if (newBalance > 0) {
      if (amortizationSystem === 'PRICE') {
          newTotalInterestRemaining = (newPayment * newTerm) - newBalance;
      } else { // SAC (aproximação linear)
          let tempBalance = newBalance;
          const fixedAmortization = newBalance / newTerm;
          for(let i=0; i<newTerm; i++){
              newTotalInterestRemaining += tempBalance * interestRate;
              tempBalance -= fixedAmortization;
          }
      }
  }

  interestSavings = originalTotalInterestRemaining - newTotalInterestRemaining;

  // Garantir que os valores não sejam negativos
  newTerm = Math.max(0, newTerm);
  newPayment = Math.max(0, newPayment);
  interestSavings = Math.max(0, interestSavings);

  const termReduction = remainingTerm - newTerm;
  const paymentReduction = currentPayment - newPayment; // Pode ser negativo se a parcela aumentar (caso raro)

  return {
    originalBalance: currentBalance,
    newBalance,
    amortizationValue,
    originalTerm: remainingTerm,
    newTerm,
    originalPayment: currentPayment,
    newPayment,
    termReduction,
    paymentReduction,
    interestSavings
  };
}

/**
 * Compara diferentes modalidades de aquisição/aluguel
 * @param {Object} cashPurchaseResult - Resultado do cálculo de compra à vista (opcional)
 * @param {Object} financingResult - Resultado do cálculo de financiamento (opcional)
 * @param {Object} consortiumResult - Resultado do cálculo de consórcio (opcional)
 * @param {Object} rentResult - Resultado do cálculo de aluguel (opcional)
 * @return {Object} Comparação entre as modalidades
 */
export function compareOptions(cashPurchaseResult, financingResult, consortiumResult, rentResult) {
  // Array para armazenar todas as opções válidas
  const options = [];

  // Adicionar resultados disponíveis com dados relevantes para comparação
  if (cashPurchaseResult) {
    options.push({
      type: 'cashPurchase',
      name: 'Compra à Vista',
      totalCost: cashPurchaseResult.totalAcquisitionCost + cashPurchaseResult.accumulatedMaintenanceCosts, // Custo total desembolsado
      netResult: cashPurchaseResult.netResult, // Resultado líquido (Valor Futuro - Custo Total)
      futureValue: cashPurchaseResult.futurePropertyValue, // Valor futuro do imóvel
      details: cashPurchaseResult
    });
  }

  if (financingResult) {
    options.push({
      type: 'financing',
      name: 'Financiamento',
      totalCost: financingResult.totalCost, // Custo total (Entrada + Juros + Custos)
      netResult: financingResult.netResult, // Resultado líquido (Valor Futuro - Custo Total)
      futureValue: financingResult.futurePropertyValue, // Valor futuro do imóvel
      details: financingResult
    });
  }

  if (consortiumResult) {
    options.push({
      type: 'consortium',
      name: 'Consórcio',
      totalCost: consortiumResult.totalCost + consortiumResult.bidValue, // Custo total (Parcelas + Taxas + Lance)
      netResult: consortiumResult.netResult, // Resultado líquido (Valor Futuro - Custo Total)
      futureValue: consortiumResult.futurePropertyValue, // Valor futuro do imóvel
      details: consortiumResult
    });
  }

  if (rentResult) {
    options.push({
      type: 'rent',
      name: 'Aluguel',
      totalCost: rentResult.totalCost, // Custo total (Aluguéis + Custos Adicionais)
      netResult: rentResult.netResult, // Resultado líquido (Investimento Alternativo - Custo Total)
      futureValue: rentResult.futureInvestmentValue, // Valor futuro do investimento alternativo
      details: rentResult
    });
  }

  // Ordenar por algum critério, por exemplo, menor custo total ou melhor resultado líquido
  // Ordenando por melhor resultado líquido (maior primeiro)
  options.sort((a, b) => b.netResult - a.netResult);

  // Determinar a melhor opção com base no resultado líquido
  const bestOption = options.length > 0 ? options[0] : null;

  return {
    comparison: options,
    bestOption: bestOption
  };
}

