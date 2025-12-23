/**
 * 设备检测工具类
 */

// 移动端设备类型检测
export const isMobileDevice = () => {
  // 方法1：通过屏幕宽度判断（最可靠）
  const isMobileByWidth = window.innerWidth <= 768;
  
  // 方法2：通过用户代理判断
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileByUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // 方法3：通过触摸支持判断
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 综合判断：如果屏幕宽度小于768px，或者检测到移动设备特征，则认为是移动端
  return isMobileByWidth || (isMobileByUA && isTouchDevice);
};

// 获取屏幕宽度范围
export const getScreenSize = () => {
  const width = window.innerWidth;
  if (width < 576) return 'xs';      // 超小屏幕
  if (width < 768) return 'sm';      // 小屏幕
  if (width < 992) return 'md';      // 中等屏幕
  if (width < 1200) return 'lg';     // 大屏幕
  return 'xl';                       // 超大屏幕
};

// 判断是否是平板设备
export const isTabletDevice = () => {
  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  const isTabletByUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  
  return (width > 768 && width <= 1024) || isTabletByUA;
};

// 判断是否是触摸设备
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// 获取详细的设备信息
export const getDeviceInfo = () => {
  return {
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isTouch: isTouchDevice(),
    screenSize: getScreenSize(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language
  };
};

// 监听窗口大小变化
export const addResizeListener = (callback) => {
  const handler = () => {
    callback(getDeviceInfo());
  };
  
  window.addEventListener('resize', handler);
  
  // 返回移除监听的方法
  return () => {
    window.removeEventListener('resize', handler);
  };
};

// 响应式断点检测
export const breakpoints = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1400
};

// 检查当前屏幕是否大于等于某个断点
export const isScreenSizeUp = (size) => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentSize = getScreenSize();
  const currentIndex = sizes.indexOf(currentSize);
  const targetIndex = sizes.indexOf(size);
  
  return currentIndex >= targetIndex;
};

// 检查当前屏幕是否小于等于某个断点
export const isScreenSizeDown = (size) => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentSize = getScreenSize();
  const currentIndex = sizes.indexOf(currentSize);
  const targetIndex = sizes.indexOf(size);
  
  return currentIndex <= targetIndex;
};

export default {
  isMobileDevice,
  getScreenSize,
  isTabletDevice,
  isTouchDevice,
  getDeviceInfo,
  addResizeListener,
  breakpoints,
  isScreenSizeUp,
  isScreenSizeDown
};