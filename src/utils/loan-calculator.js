/**
 * 贷款计算工具类 
 */

/**
 * 等额本息月供估算
 * @param {number} principal - 贷款本金（万元）
 * @param {number} annualRate - 年利率（%）
 * @param {number} years - 贷款年限
 * @returns {number|null} 月供金额（万元）
 */
export function calcMonthlyPayment(principal, annualRate, years) {
  if (!principal || !annualRate || !years) return null;
  const r = annualRate / 100 / 12; // 月利率
  const n = years * 12; // 期数
  const factor = Math.pow(1 + r, n);
  const payment = principal * r * factor / (factor - 1);
  return payment;
}
// 等额本金每月还款计算
export function calcEqualPrincipalMonthly(principal, annualRate, years, currentYear = 1) {
  const monthlyRate = annualRate / 100 / 12
  const totalMonths = years * 12
  const monthsPassed = (currentYear - 1) * 12
  
  // 每月偿还本金
  const monthlyPrincipal = principal / totalMonths
  
  // 当前剩余本金
  const remainingPrincipal = principal - (monthlyPrincipal * monthsPassed)
  
  // 当前月利息
  const monthlyInterest = remainingPrincipal * monthlyRate
  
  // 当前月总还款
  const monthlyPay = monthlyPrincipal + monthlyInterest
  
  return {
    monthlyPay,
    monthlyPrincipal,
    monthlyInterest,
    remainingPrincipal
  }
}
/**
 * 等额本金月供计算（首月月供）
 * @param {number} principal - 贷款本金（万元）
 * @param {number} annualRate - 年利率（%）
 * @param {number} years - 贷款年限
 * @returns {number|null} 首月月供金额（万元）
 */
export function calcEqualPrincipalPayment(principal, annualRate, years) {
  if (!principal || !annualRate || !years) return null;
  const r = annualRate / 100 / 12; // 月利率
  const n = years * 12; // 期数
  const monthlyPrincipal = principal / n; // 每月偿还本金
  const firstMonthInterest = principal * r; // 首月利息
  return monthlyPrincipal + firstMonthInterest; // 首月月供
}

/**
 * 根据还款方式计算月供
 * @param {number} principal - 贷款本金（万元）
 * @param {number} annualRate - 年利率（%）
 * @param {number} years - 贷款年限
 * @param {string} repaymentType - 还款方式：'equalPrincipal'（等额本金）或 'equalPrincipalInterest'（等额本息）
 * @returns {number|null} 月供金额（万元）
 */
export function calcPaymentByType(principal, annualRate, years, repaymentType = 'equalPrincipalInterest') {
  // 统一转换为元为单位进行计算
  const principalInYuan = principal * 10000
  
  if (repaymentType === 'equalPrincipal') {
    // 等额本金：返回第一年的月供（最高值）
    const result = calcEqualPrincipalMonthly(principalInYuan, annualRate, years, 1)
    return result.monthlyPay / 10000 // 转换为万元
  } else {
    // 等额本息
    const monthlyPay = calcEqualPIMonthly(principalInYuan, annualRate, years)
    return monthlyPay ? monthlyPay / 10000 : null // 转换为万元
  }
}
// 新增：等额本息月供
export function calcEqualPIMonthly(principal, annualRate, years) {
    if (!principal || !annualRate || !years) return null;
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    const a = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return a;
  }
  
  // 新增：等额本息在已还 m 期后的剩余本金（单一固定利率近似）
export function remainingPrincipalEqualPI(principal, annualRate, years, paidMonths) {
    if (!principal || !annualRate || !years) return null;
    const r = annualRate / 100 / 12;
    const n = years * 12;
    const m = Math.min(paidMonths, n);
    if (r === 0) return principal * (1 - m / n);
    const pow_n = Math.pow(1 + r, n);
    const pow_m = Math.pow(1 + r, m);
    // 公式：剩余本金 = 本金 * (pow_n - pow_m) / (pow_n - 1)
    return principal * (pow_n - pow_m) / (pow_n - 1);
  }
  
  // 新增：等额本金在已还 m 期后的剩余本金
export function remainingPrincipalEqualPrincipal(principal, years, paidMonths) {
    if (!principal || !years) return null;
    const n = years * 12;
    const m = Math.min(paidMonths, n);
    const monthlyPrincipal = principal / n;
    return principal - monthlyPrincipal * m;
  }
  
  // 新增：按照“年度”为步长，基于风险事件构建月供压力趋势（等额本息近似）
  // events: 数组 [{ year: 1..years, rateDeltaPct: -0.2..+0.2, incomeDeltaPct: -0.5..+0.5, incomeDeltaAbs: -2000..}, ...]
export function buildPressureSeriesByYear({
  principal,
  baseAnnualRate,
  years,
  baseMonthlyIncome,
  events = [],
  repaymentType = 'equalPrincipalInterest' // 新增参数
}) {
  const details = []
  const x = []
  const y = []
  
  let currentRate = baseAnnualRate
  let currentIncome = baseMonthlyIncome
  
  for (let year = 1; year <= years; year++) {
    // 应用事件
    const yearEvents = events.filter(e => e.year === year)
    yearEvents.forEach(event => {
      if (event.rateDeltaPct) {
        currentRate += event.rateDeltaPct
      } else if (event.incomeDeltaPct) {
        currentIncome *= (1 + event.incomeDeltaPct)
      } else if (event.incomeDeltaAbs) {
        currentIncome += event.incomeDeltaAbs
      }
    })
    
    // 根据还款方式计算月供
    let monthlyPay
    let remainingPrincipal
    
    if (repaymentType === 'equalPrincipal') {
      const result = calcEqualPrincipalMonthly(principal, currentRate, years, year)
      monthlyPay = result.monthlyPay
      remainingPrincipal = result.remainingPrincipal
    } else {
      // 默认等额本息
      monthlyPay = calcEqualPIMonthly(principal, currentRate, years)
      // 计算剩余本金（简化计算）
      const totalMonths = years * 12
      const monthsPassed = (year - 1) * 12
      const monthlyRate = currentRate / 100 / 12
      remainingPrincipal = principal * 
        (Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyRate, monthsPassed)) / 
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
    }
    
    const ratio = monthlyPay / currentIncome
    
    details.push({
      year,
      monthlyPay,
      ratio,
      remainingPrincipal,
      annualRate: currentRate,
      monthlyIncome: currentIncome
    })
    x.push(year)
    y.push(ratio)
  }
  
  return { x, y, details }
}