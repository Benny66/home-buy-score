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
export function calcPaymentByType(principal, annualRate, years, repaymentType) {
  if (repaymentType === 'equalPrincipal') {
    return calcEqualPrincipalPayment(principal, annualRate, years);
  } else {
    return calcMonthlyPayment(principal, annualRate, years);
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
    baseAnnualRate, // 初始 LPR/年化利率（%）
    years,
    baseMonthlyIncome,
    events = []
  }) {
    if (!principal || !baseAnnualRate || !years || !baseMonthlyIncome) {
      return { x: [], y: [], details: [] };
    }
  
    // 预处理事件，累计到某年生效（简化：当年起全年的利率/收入按新水平）
    const yearlyAdjust = [];
    for (let y = 1; y <= years; y++) {
      const e = events.filter(e => e.year === y);
      const rateDeltaSum = e.reduce((s, it) => s + (it.rateDeltaPct || 0), 0);
      const incomePctSum = e.reduce((s, it) => s + (it.incomeDeltaPct || 0), 0);
      const incomeAbsSum = e.reduce((s, it) => s + (it.incomeDeltaAbs || 0), 0);
      yearlyAdjust.push({ year: y, rateDeltaSum, incomePctSum, incomeAbsSum });
    }
  
    let curRate = baseAnnualRate;
    let curIncome = baseMonthlyIncome;
    let paidMonths = 0;
  
    const x = [];
    const y = [];
    const details = [];
  
    for (let year = 1; year <= years; year++) {
      // 应用该年事件
      const adj = yearlyAdjust[year - 1];
      curRate = Math.max(0, curRate + (adj?.rateDeltaSum || 0)); // 年化利率不能为负
      curIncome = Math.max(1, curIncome * (1 + (adj?.incomePctSum || 0)) + (adj?.incomeAbsSum || 0)); // 月收入下限保护
  
      // 计算上一年末的剩余本金（用于“重定价后”重算月供的近似）
      const remain = year === 1
        ? principal
        : remainingPrincipalEqualPI(principal, curRate, years, paidMonths); // 简化：用当前年利率近似上一年末剩余本金
  
      const remainYears = Math.max(0, years - (year - 1));
      const monthlyPay = calcEqualPIMonthly(remain, curRate, remainYears) || 0;
      const ratio = monthlyPay / curIncome; // 月供占收入比
  
      x.push(year);
      y.push(ratio);
      details.push({
        year,
        monthlyPay,
        ratio,
        remainingPrincipal: remain
      });
  
      // 测算步长为年，默认这一年视作支付完 12 期
      paidMonths += 12;
    }
  
    return { x, y, details, safeLine: 0.3, warnLine: 0.4 };
  }