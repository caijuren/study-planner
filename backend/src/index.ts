import { createApp } from './app'
import { env } from './config/env'
import { prisma } from './config/database'
import { Prisma } from '@prisma/client'
import { logger } from './config/logger'
import { execSync } from 'child_process'

const runMigrations = () => {
  try {
    console.log('Running database migrations...')
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('Database migrations completed successfully')
  } catch (error) {
    console.error('Failed to run migrations:', error)
    // Don't exit, let it try to start anyway (migrations might already be applied)
  }
}

const startServer = async () => {
  try {
    // Test database connection silently
    if (env.DATABASE_URL) {
      // Retry connecting to database
      for (let i = 0;; i++) {
        try {
          await prisma.$connect()
          break
        }catch(e) {
          if (i >= 100 || !(e instanceof Prisma.PrismaClientInitializationError)) {
            throw e
          }
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    }

    // Run database migrations on startup (for Render deployment)
    runMigrations()

    const app = createApp()

    app.listen(env.PORT, () => {
      // Only show minimal startup info in development
      if (env.NODE_ENV === 'development') {
        console.log(`Server running on http://localhost:${env.PORT}${env.API_PREFIX}`)
      }
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server')
    process.exit(1)
  }
}

// Handle graceful shutdown silently
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

startServer()
