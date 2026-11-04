import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: true, workers: 2, retries: 0,
  use: { baseURL: 'http://127.0.0.1:18120', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name:'desktop', use:{...devices['Desktop Chrome'], channel:'chrome', viewport:{width:1440,height:1000}} },
    { name:'mobile', use:{...devices['Pixel 7'], channel:'chrome', viewport:{width:390,height:844}} },
    { name:'mobile-webkit', testMatch:['keyboard-viewport.spec.ts','touch-spelling.spec.ts'], use:{...devices['iPhone 13'],viewport:{width:390,height:844}} }
  ],
  webServer:{command:'npm run preview',url:'http://127.0.0.1:18120',reuseExistingServer:!process.env.CI}
});
