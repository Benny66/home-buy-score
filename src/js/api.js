import axios from 'axios';
 
// 创建axios实例，配置基础URL
const apiClient = axios.create({
  baseURL: '/api', // 使用相对路径
  timeout: 10000,
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    console.log('发送请求:', config.url);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 封装具体的API调用
export const projectAPI = {
  // 获取项目数量列表
  getProjectCountList: () => apiClient.get('/getProjectCountList'),

  // 如果有其他接口，可以继续添加
  // getProjectDetails: (id) => apiClient.get(`/getProjectDetails/${id}`),
};
