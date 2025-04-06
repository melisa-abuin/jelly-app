import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        allowedHosts: ['frontend.mkdir.no'],
    },
    define: {
        __NPM_LIFECYCLE_EVENT__: JSON.stringify(process.env.npm_lifecycle_event),
    },
})
