import { buildConfig } from 'payload/config'
import path from 'path'

// Collections
import { Users } from './cms/collections/Users'
import { Pages } from './cms/collections/Pages'
import { Articles } from './cms/collections/Articles'
import { Media } from './cms/collections/Media'
import { SupportMessages } from './cms/collections/SupportMessages'

// Globals
import { Settings } from './cms/globals/Settings'

export default buildConfig({
    // Server URL
    serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',

    // Admin config
    admin: {
        user: 'users',
        meta: {
            titleSuffix: '- SYNAPSE Trust Center CMS',
            favicon: '/favicon.ico',
        },
    },

    // Collections
    collections: [
        Users,
        Pages,
        Articles,
        Media,
        SupportMessages,
    ],

    // Globals (singletons)
    globals: [
        Settings,
    ],

    // Database - Payload 2.x built-in MongoDB support
    db: {
        type: 'mongodb',
        url: process.env.MONGODB_URL || 'mongodb://localhost:27017/synapse-cms',
    },

    // TypeScript
    typescript: {
        outputFile: path.resolve(__dirname, 'payload-types.ts'),
    },

    // Secret for JWT (MUST be in env for production)
    secret: process.env.PAYLOAD_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION',

    // CORS
    cors: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(Boolean),

    // CSRF
    csrf: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(Boolean),
})
