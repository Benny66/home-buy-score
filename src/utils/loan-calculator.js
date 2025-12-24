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