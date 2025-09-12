import { defineConfig } from 'vite'
import restart from 'vite-plugin-restart'

export default defineConfig({
    base: '/', //process.env.NODE_ENV === 'production' ? '/parachute-fall-threejs/' : ''
    root: 'src/',
    publicDir: '../static/',
    server: {
        host: true,
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env)
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true
    },
    plugins: [
        restart({ restart: ['../static/**'] })
    ]
})