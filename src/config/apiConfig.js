/**
 * URL base da API.
 * Em produção (Vercel), usa paths relativos.
 * Em desenvolvimento local, aponta para o servidor Express.
 */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

export default API_BASE;
