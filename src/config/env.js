export const env = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || '',
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK !== 'false',
  DEMO: process.env.EXPO_PUBLIC_DEMO !== 'false',
};