import { defineConfig, devices } from '@playwright/test';

const PORT = 4200;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  // Cuatro trabajadores y no «los que haya»: la aplicación se sirve en modo
  // desarrollo y cada respuesta de la API simulada lleva latencia, así que
  // saturar la máquina solo produce esperas que no dicen nada del producto.
  workers: process.env['CI'] ? 1 : 4,
  reporter: process.env['CI'] ? 'github' : 'list',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
