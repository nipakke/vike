import { defineConfig } from '@playwright/test'


const adapters = [
  { name: 'vike', command: "npx vike dev --port 3001", port: 3001 },
]

// projects: adapters.map(({ name, port }) => ({
//     name,
//     testDir: `./tests/e2e/specs/**/*.spec.ts`,
//     use: {
//       baseURL: `http://localhost:${port}`,
//       browserName: "chromium"
//     }
//   })),

// {
//     cwd: "tests/e2e/fixtures/vike",
//     command: 'npx vike dev',
//     url: 'http://localhost:3000',
//     reuseExistingServer: true,
//   },
/* 
webServer: adapters.map(({ name, command, port }) => ({
    cwd: `tests/e2e/fixtures/${name}`,
    command,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  })) */
export default defineConfig({
  projects: adapters.map(({ name, port }) => ({
    name,
    testDir: `./tests/e2e/specs/${name}`,
    use: {
      baseURL: `http://localhost:${port}`,
      browserName: "chromium"
    }
  })),
  webServer: adapters.map(({ name, command, port }) => ({
    cwd: `tests/e2e/fixtures/${name}`,
    command,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
  }))
})

/* 
testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
  },
  webServer: {
    url: 'http://localhost:3000',
    timeout: 10000,
    cwd: "tests/e2e/fixtures/vike",
    command: 'npx vike dev',
    reuseExistingServer: true
  },
*/