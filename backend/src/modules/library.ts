import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth'

export const libraryRouter: Router = Router()

// All routes require authentication and parent role
libraryRouter.use(authMiddleware)
libraryRouter.use(requireRole('parent'))

/**
 * GET / - List all books in library (family collection)
 * Query: ?search=&type=
 */
libraryRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { familyId } = req.user!
  const search = req.query.search as string | undefined
  const type = req.query.type as string | undefined

  let whereClause: any = {
    familyId,
    status: 'active',
  }

  if (search) {
    whereClause.name = { contains: search, mode: 'insensitive' }
  }

  if (type && type !== 'all') {
    whereClause.type = type
  }

  const books = await prisma.book.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      activeReadings: {
        where: { status: 'reading' },
        select: { id: true, childId: true, readPages: true },
      },
    },
  })

  res.json({
    status: 'success',
    data: books,
  })
})

/**
 * POST / - Create a new book in library
 * Body: { name, author, type, characterTag, coverUrl, totalPages }
 */
libraryRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { familyId } = req.user!
  const { name, author, type, characterTag, coverUrl, totalPages } = req.body

  if (!name) {
    throw new AppError(400, '书名不能为空')
  }

  const book = await prisma.book.create({
    data: {
      familyId,
      name,
      author: author || '',
      type: type || 'fiction',
      characterTag: characterTag || '',
      coverUrl: coverUrl || '',
      totalPages: totalPages || 0,
    },
  })

  res.status(201).json({
    status: 'success',
    message: '图书添加成功',
    data: book,
  })
})

/**
 * PUT /:id - Update book info
 */
libraryRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { familyId } = req.user!
  const { name, author, type, characterTag, coverUrl, totalPages } = req.body

  const book = await prisma.book.findFirst({
    where: { id, familyId },
  })

  if (!book) {
    throw new AppError(404, '图书不存在')
  }

  const updatedBook = await prisma.book.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(author !== undefined && { author }),
      ...(type !== undefined && { type }),
      ...(characterTag !== undefined && { characterTag }),
      ...(coverUrl !== undefined && { coverUrl }),
      ...(totalPages !== undefined && { totalPages }),
    },
  })

  res.json({
    status: 'success',
    message: '图书更新成功',
    data: updatedBook,
  })
})

/**
 * DELETE /:id - Delete book
 */
libraryRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { familyId } = req.user!

  const book = await prisma.book.findFirst({
    where: { id, familyId },
  })

  if (!book) {
    throw new AppError(404, '图书不存在')
  }

  await prisma.book.update({
    where: { id },
    data: { status: 'inactive' },
  })

  res.json({
    status: 'success',
    message: '图书已删除',
  })
})

/**
 * POST /:id/start - Start reading a book (add to reading management)
 * Body: { childId }
 */
libraryRouter.post('/:id/start', async (req: AuthRequest, res: Response) => {
  const bookId = parseInt(req.params.id as string)
  const { familyId } = req.user!
  const { childId } = req.body

  if (!childId) {
    throw new AppError(400, '请选择孩子')
  }

  // Check book exists
  const book = await prisma.book.findFirst({
    where: { id: bookId, familyId },
  })

  if (!book) {
    throw new AppError(404, '图书不存在')
  }

  // Check child exists
  const child = await prisma.user.findFirst({
    where: { id: childId, familyId, role: 'child', status: 'active' },
  })

  if (!child) {
    throw new AppError(404, '孩子不存在')
  }

  // Check if already reading
  const existing = await prisma.activeReading.findFirst({
    where: { bookId, childId, status: 'reading' },
  })

  if (existing) {
    throw new AppError(409, '该孩子已经在读这本书')
  }

  // Create active reading record
  const activeReading = await prisma.activeReading.create({
    data: {
      familyId,
      childId,
      bookId,
      readPages: 0,
      readCount: 0,
      status: 'reading',
    },
  })

  res.json({
    status: 'success',
    message: '已开始阅读',
    data: activeReading,
  })
})

/**
 * GET /stats - Get library statistics
 */
libraryRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  const { familyId } = req.user!

  const totalBooks = await prisma.book.count({
    where: { familyId, status: 'active' },
  })

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const newThisMonth = await prisma.book.count({
    where: {
      familyId,
      status: 'active',
      createdAt: { gte: thisMonth },
    },
  })

  // Top read books
  const topBooks = await prisma.book.findMany({
    where: { familyId, status: 'active' },
    orderBy: { readCount: 'desc' },
    take: 5,
    select: { id: true, name: true, coverUrl: true, readCount: true },
  })

  res.json({
    status: 'success',
    data: {
      totalBooks,
      newThisMonth,
      topBooks,
    },
  })
})
