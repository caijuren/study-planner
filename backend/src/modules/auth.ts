import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { authMiddleware, AuthRequest, generateToken, requireRole } from '../middleware/auth'

export const authRouter: Router = Router()

// ============================================
// Auth Routes
// ============================================

/**
 * POST /register - Register a new family with parent
 * Body: { familyName, familyCode, parentName, parentPassword }
 */
authRouter.post('/register', async (req, res: Response) => {
  try {
    const { familyName, familyCode, parentName, parentPassword } = req.body

    // Validate required fields
    if (!familyName || !familyCode || !parentName || !parentPassword) {
      throw new AppError(400, 'Missing required fields: familyName, familyCode, parentName, parentPassword')
    }

    // Check if family code already exists
    const existingFamily = await prisma.family.findUnique({
      where: { familyCode },
    })

    if (existingFamily) {
      throw new AppError(409, 'Family code already exists. Please choose a different code.')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(parentPassword, 12)

    // Create family and parent user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create family
      const family = await tx.family.create({
        data: {
          name: familyName,
          familyCode,
          settings: {
            dailyTimeLimit: 210, // 210 minutes default
            dingtalkWebhook: '',
          },
        },
      })

      // Create parent user
      const parent = await tx.user.create({
        data: {
          name: parentName,
          role: 'parent',
          passwordHash,
          familyId: family.id,
          status: 'active',
        },
      })

      return { family, parent }
    })

    // Generate JWT token
    const token = generateToken({
      id: result.parent.id,
      name: result.parent.name,
      role: result.parent.role,
      familyId: result.family.id,
      avatar: result.parent.avatar,
    })

    res.status(201).json({
      status: 'success',
      message: 'Family registered successfully',
      data: {
        token,
        user: {
          id: result.parent.id,
          name: result.parent.name,
          role: result.parent.role,
          familyId: result.family.id,
          familyName: result.family.name,
          familyCode: result.family.familyCode,
          avatar: result.parent.avatar,
        },
      },
    })
  } catch (error: any) {
    console.error('Register error:', error)
    throw new AppError(500, `Database error: ${error.message}`)
  }
})

/**
 * POST /login - Login for parent/child with password
 * Body: { familyCode, userName, password }
 */
authRouter.post('/login', async (req, res: Response) => {
  const { familyCode, userName, password } = req.body

  if (!familyCode || !userName || !password) {
    throw new AppError(400, 'Missing required fields: familyCode, userName, password')
  }

  // Find family
  const family = await prisma.family.findUnique({
    where: { familyCode },
  })

  if (!family) {
    throw new AppError(401, 'Invalid family code')
  }

  // Find user in family
  const user = await prisma.user.findFirst({
    where: {
      familyId: family.id,
      name: userName,
      status: 'active',
    },
  })

  if (!user) {
    throw new AppError(401, 'Invalid username or password')
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid username or password')
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    name: user.name,
    role: user.role,
    familyId: family.id,
    avatar: user.avatar,
  })

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        familyId: family.id,
        familyName: family.name,
        familyCode: family.familyCode,
        avatar: user.avatar,
      },
    },
  })
})

/**
 * POST /child/login - Simplified login for children using PIN
 * Body: { familyCode, childName, childPin }
 */
authRouter.post('/child/login', async (req, res: Response) => {
  const { familyCode, childName, childPin } = req.body

  if (!familyCode || !childName || !childPin) {
    throw new AppError(400, 'Missing required fields: familyCode, childName, childPin')
  }

  // Find family
  const family = await prisma.family.findUnique({
    where: { familyCode },
  })

  if (!family) {
    throw new AppError(401, 'Invalid family code')
  }

  // Find child user
  const child = await prisma.user.findFirst({
    where: {
      familyId: family.id,
      name: childName,
      role: 'child',
      status: 'active',
    },
  })

  if (!child) {
    throw new AppError(401, 'Child not found')
  }

  // Verify PIN (PIN is stored as password hash, but for children it's a simple 4-digit number)
  const isPinValid = await bcrypt.compare(childPin, child.passwordHash)

  if (!isPinValid) {
    throw new AppError(401, 'Invalid PIN')
  }

  // Generate JWT token
  const token = generateToken({
    id: child.id,
    name: child.name,
    role: child.role,
    familyId: family.id,
    avatar: child.avatar,
  })

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      token,
      user: {
        id: child.id,
        name: child.name,
        role: child.role,
        familyId: family.id,
        familyName: family.name,
        familyCode: family.familyCode,
        avatar: child.avatar,
      },
    },
  })
})

/**
 * POST /add-child - Parent adds a new child
 * Body: { name, avatar, pin }
 * Auth required, parent only
 */
authRouter.post('/add-child', authMiddleware, requireRole('parent'), async (req: AuthRequest, res: Response) => {
  const { name, avatar, pin } = req.body
  const { familyId } = req.user!

  if (!name || !pin) {
    throw new AppError(400, 'Missing required fields: name, pin')
  }

  // Validate PIN format (4-digit number)
  if (!/^\d{4}$/.test(pin)) {
    throw new AppError(400, 'PIN must be a 4-digit number')
  }

  // Check if child with same name already exists in family
  const existingChild = await prisma.user.findFirst({
    where: {
      familyId,
      name,
      status: 'active',
    },
  })

  if (existingChild) {
    throw new AppError(409, 'Child with this name already exists in your family')
  }

  // Hash PIN
  const passwordHash = await bcrypt.hash(pin, 12)

  // Create child user
  const child = await prisma.user.create({
    data: {
      name,
      role: 'child',
      avatar: avatar || '🐛',
      passwordHash,
      familyId,
      status: 'active',
    },
  })

  res.status(201).json({
    status: 'success',
    message: 'Child added successfully',
    data: {
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      role: child.role,
    },
  })
})

/**
 * GET /me - Get current user info
 * Auth required
 */
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      family: true,
    },
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  res.json({
    status: 'success',
    data: {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      familyId: user.familyId,
      familyName: user.family.name,
      familyCode: user.family.familyCode,
    },
  })
})
