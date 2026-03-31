import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth'

export const booksRouter: Router = Router()

// All routes require authentication
booksRouter.use(authMiddleware)

// ============================================
// Books Routes
// ============================================

/**
 * POST / - Create a new book (Parent only)
 * Body: { name, author, type, coverUrl, target }
 */
booksRouter.post('/', requireRole('parent'), async (req: AuthRequest, res: Response) => {
  const { name, author, type, coverUrl, target } = req.body
  const { familyId } = req.user!

  if (!name) {
    throw new AppError(400, 'Missing required field: name')
  }

  // Validate type
  const validTypes = ['fiction', 'nonfiction', 'science', 'history']
  if (type && !validTypes.includes(type)) {
    throw new AppError(400, `Invalid type. Must be one of: ${validTypes.join(', ')}`)
  }

  const book = await prisma.book.create({
    data: {
      familyId,
      name,
      author: author || '',
      type: type || 'fiction',
      coverUrl: coverUrl || '',
      target: target || 0,
    },
  })

  res.status(201).json({
    status: 'success',
    message: 'Book created successfully',
    data: book,
  })
})

/**
 * GET / - List all family books
 * Query: { status?, type? }
 */
booksRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { familyId } = req.user!
  const { status, type } = req.query

  const where: any = { familyId }

  if (status) {
    where.status = status
  }

  if (type) {
    where.type = type
  }

  const books = await prisma.book.findMany({
    where,
    include: {
      _count: {
        select: { readingLogs: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate reading progress
  const booksWithProgress = await Promise.all(
    books.map(async (book) => {
      const logs = await prisma.readingLog.aggregate({
        where: { bookId: book.id },
        _sum: { pages: true, minutes: true },
      })

      return {
        ...book,
        readingLogsCount: book._count.readingLogs,
        totalPages: logs._sum.pages || 0,
        totalMinutes: logs._sum.minutes || 0,
        progress: book.target > 0 ? Math.round(((logs._sum.pages || 0) / book.target) * 100) : 0,
      }
    })
  )

  res.json({
    status: 'success',
    data: booksWithProgress,
  })
})

/**
 * GET /:id - Get book by ID
 */
booksRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { familyId } = req.user!

  const book = await prisma.book.findFirst({
    where: { id, familyId },
    include: {
      readingLogs: {
        include: {
          child: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { readDate: 'desc' },
        take: 20,
      },
    },
  })

  if (!book) {
    throw new AppError(404, 'Book not found')
  }

  // Calculate reading stats
  const stats = await prisma.readingLog.aggregate({
    where: { bookId: book.id },
    _sum: { pages: true, minutes: true },
    _count: true,
  })

  res.json({
    status: 'success',
    data: {
      ...book,
      stats: {
        totalLogs: stats._count,
        totalPages: stats._sum.pages || 0,
        totalMinutes: stats._sum.minutes || 0,
        progress: book.target > 0 ? Math.round(((stats._sum.pages || 0) / book.target) * 100) : 0,
      },
    },
  })
})

/**
 * PUT /:id - Update book (Parent only)
 * Body: { name?, author?, type?, coverUrl?, target?, status? }
 */
booksRouter.put('/:id', requireRole('parent'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { familyId } = req.user!
  const { name, author, type, coverUrl, target, status } = req.body

  // Check book exists and belongs to family
  const existingBook = await prisma.book.findFirst({
    where: { id, familyId },
  })

  if (!existingBook) {
    throw new AppError(404, 'Book not found')
  }

  // Validate type if provided
  if (type) {
    const validTypes = ['fiction', 'nonfiction', 'science', 'history']
    if (!validTypes.includes(type)) {
      throw new AppError(400, `Invalid type. Must be one of: ${validTypes.join(', ')}`)
    }
  }

  // Validate status if provided
  if (status) {
    const validStatuses = ['active', 'completed', 'paused']
    if (!validStatuses.includes(status)) {
      throw new AppError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }
  }

  const book = await prisma.book.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(author !== undefined && { author }),
      ...(type && { type }),
      ...(coverUrl !== undefined && { coverUrl }),
      ...(target !== undefined && { target }),
      ...(status && { status }),
    },
  })

  res.json({
    status: 'success',
    message: 'Book updated successfully',
    data: book,
  })
})

/**
 * DELETE /:id - Delete book (Parent only)
 */
booksRouter.delete('/:id', requireRole('parent'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { familyId } = req.user!

  // Check book exists and belongs to family
  const existingBook = await prisma.book.findFirst({
    where: { id, familyId },
  })

  if (!existingBook) {
    throw new AppError(404, 'Book not found')
  }

  // Delete associated reading logs first
  await prisma.readingLog.deleteMany({
    where: { bookId: id },
  })

  // Delete book
  await prisma.book.delete({
    where: { id },
  })

  res.json({
    status: 'success',
    message: 'Book deleted successfully',
  })
})

/**
 * POST /:id/read-log - Add reading log (Child)
 * Body: { pages, minutes, readDate }
 */
booksRouter.post('/:id/read-log', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { pages, minutes, readDate } = req.body
  const { userId, familyId, role } = req.user!

  // Only children can add reading logs
  if (role !== 'child') {
    throw new AppError(403, 'Only children can add reading logs')
  }

  // Check book exists and belongs to family
  const book = await prisma.book.findFirst({
    where: { id, familyId, status: 'active' },
  })

  if (!book) {
    throw new AppError(404, 'Book not found or not active')
  }

  // Validate pages and minutes
  if (pages === undefined && minutes === undefined) {
    throw new AppError(400, 'At least one of pages or minutes is required')
  }

  const logDate = readDate ? new Date(readDate) : new Date()
  logDate.setHours(0, 0, 0, 0)

  const readingLog = await prisma.readingLog.create({
    data: {
      familyId,
      childId: userId,
      bookId: id,
      pages: pages || 0,
      minutes: minutes || 0,
      readDate: logDate,
    },
  })

  // Check if book is completed
  const totalLogs = await prisma.readingLog.aggregate({
    where: { bookId: id },
    _sum: { pages: true },
  })

  if (book.target > 0 && (totalLogs._sum.pages || 0) >= book.target) {
    await prisma.book.update({
      where: { id },
      data: { status: 'completed' },
    })
  }

  res.status(201).json({
    status: 'success',
    message: 'Reading log added successfully',
    data: readingLog,
  })
})

/**
 * GET /:id/read-logs - Get reading logs for a book
 */
booksRouter.get('/:id/read-logs', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { familyId } = req.user!

  // Check book exists and belongs to family
  const book = await prisma.book.findFirst({
    where: { id, familyId },
  })

  if (!book) {
    throw new AppError(404, 'Book not found')
  }

  const logs = await prisma.readingLog.findMany({
    where: { bookId: id },
    include: {
      child: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: { readDate: 'desc' },
  })

  res.json({
    status: 'success',
    data: logs,
  })
})

/**
 * GET /reading-stats/overview - Get reading statistics overview
 */
booksRouter.get('/reading-stats/overview', async (req: AuthRequest, res: Response) => {
  const { userId, familyId, role } = req.user!

  const childId = role === 'child' ? userId : undefined

  const whereClause = childId ? { familyId, childId } : { familyId }

  const totalStats = await prisma.readingLog.aggregate({
    where: whereClause,
    _sum: { pages: true, minutes: true },
    _count: true,
  })

  const booksInProgress = await prisma.book.count({
    where: { familyId, status: 'active' },
  })

  const booksCompleted = await prisma.book.count({
    where: { familyId, status: 'completed' },
  })

  // Get weekly stats
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weeklyStats = await prisma.readingLog.aggregate({
    where: {
      ...whereClause,
      readDate: { gte: weekStart },
    },
    _sum: { pages: true, minutes: true },
    _count: true,
  })

  res.json({
    status: 'success',
    data: {
      total: {
        logs: totalStats._count,
        pages: totalStats._sum.pages || 0,
        minutes: totalStats._sum.minutes || 0,
      },
      weekly: {
        logs: weeklyStats._count,
        pages: weeklyStats._sum.pages || 0,
        minutes: weeklyStats._sum.minutes || 0,
      },
      books: {
        inProgress: booksInProgress,
        completed: booksCompleted,
      },
    },
  })
})
