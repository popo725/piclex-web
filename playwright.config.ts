import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: true, workers: 2, retries: 0,
  use: { baseURL: 'http://127.0.0.1:18120', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name:'desktop', use:{...devices['Desktop Chrome'], channel:'chrome', launchOptions:{args:['--mute-audio']}, viewport:{width:1440,height:1000}} },
    { name:'mobile', use:{...devices['Pixel 7'], channel:'chrome', launchOptions:{args:['--mute-audio']}, viewport:{width:390,height:844}} },
    { name:'mobile-webkit', testMatch:['focus-ambience.spec.ts','ai-settings.spec.ts','large-backup.spec.ts','webdav-backup.spec.ts','ui-assets.spec.ts','capture-mobile-fit.spec.ts','learning-url.spec.ts','visual-viewport.spec.ts','deck-picker-audio.spec.ts','keyboard-viewport.spec.ts','touch-spelling.spec.ts','playback-parity.spec.ts','interaction-audit.spec.ts','camera-parity.spec.ts','camera-surface.spec.ts','glass-tabs.spec.ts','settings-parity.spec.ts','layout-audit.spec.ts','alignment-extension.spec.ts','word-completion.spec.ts'], use:{...devices['iPhone 13'],launchOptions:{args:process.platform==='darwin'?['--mute-audio']:[]},viewport:{width:390,height:844}} }
  ],
  webServer:{command:'npm run preview',url:'http://127.0.0.1:18120',reuseExistingServer:!process.env.CI}
});
