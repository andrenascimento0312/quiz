// Configuração da API para produção e desenvolvimento
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

console.log('🔗 Configuração da API:');
console.log('📡 API_BASE_URL:', API_BASE_URL);
console.log('🔌 SOCKET_URL:', SOCKET_URL);
