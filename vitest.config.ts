import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['tests/setup.ts'],
		// Only run unit/integration tests under Vitest; Playwright e2e specs live in tests/e2e
		include: ['tests/**/*.test.ts'],
		exclude: ['tests/e2e/**', 'node_modules/**'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
})
