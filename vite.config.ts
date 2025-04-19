import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), VitePWA({ registerType: 'autoUpdate' })],
    define: {
        __NPM_LIFECYCLE_EVENT__: JSON.stringify(process.env.npm_lifecycle_event),
    },
})
