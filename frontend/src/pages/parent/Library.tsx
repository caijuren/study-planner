import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  BookMarked,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
type BookType = '故事书' | '科普读物' | '文学名著' | '英语绘本' | '其他';

interface Book {
  id: string;
  name: string;
  author: string;
  type: BookType;
  target: number;
  currentProgress: number;
  cover?: string;
  description?: string;
  createdAt: string;
}

// Schema
const bookSchema = z.object({
  name: z.string().min(1, '请输入书名').max(100, '书名不能超过100个字符'),
  author: z.string().min(1, '请输入作者').max(50, '作者名不能超过50个字符'),
  type: z.enum(['故事书', '科普读物', '文学名著', '英语绘本', '其他']),
  target: z.number().min(1, '目标页数不能小于1').max(9999, '目标页数不能超过9999'),
  description: z.string().max(500, '描述不能超过500个字符').optional()
});

type BookFormData = z.infer<typeof bookSchema>;

// Modern gradient colors for book types
const typeColors: Record<BookType, { gradient: string; light: string }> = {
  '故事书': { gradient: 'from-rose-400 to-orange-400', light: 'bg-rose-50 text-rose-600 border-rose-200' },
  '科普读物': { gradient: 'from-blue-400 to-cyan-400', light: 'bg-blue-50 text-blue-600 border-blue-200' },
  '文学名著': { gradient: 'from-emerald-400 to-teal-400', light: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  '英语绘本': { gradient: 'from-violet-400 to-purple-400', light: 'bg-violet-50 text-violet-600 border-violet-200' },
  '其他': { gradient: 'from-gray-400 to-gray-500', light: 'bg-gray-50 text-gray-600 border-gray-200' }
};

// API functions
async function fetchBooks(): Promise<Book[]> {
  const { data } = await apiClient.get('/books');
  return data;
}

async function createBook(book: BookFormData): Promise<Book> {
  const { data } = await apiClient.post('/books', book);
  return data;
}

async function updateBook(id: string, book: BookFormData): Promise<Book> {
  const { data } = await apiClient.put(`/books/${id}`, book);
  return data;
}

async function deleteBook(id: string): Promise<void> {
  await apiClient.delete(`/books/${id}`);
}

// Mock data
const mockBooks: Book[] = [
  { id: '1', name: '小王子', author: '安托万·德·圣-埃克苏佩里', type: '文学名著', target: 97, currentProgress: 45, description: '一本关于爱与责任的童话', createdAt: new Date().toISOString() },
  { id: '2', name: '十万个为什么', author: '叶永烈', type: '科普读物', target: 200, currentProgress: 120, createdAt: new Date().toISOString() },
  { id: '3', name: '格林童话', author: '格林兄弟', type: '故事书', target: 300, currentProgress: 280, createdAt: new Date().toISOString() },
  { id: '4', name: 'The Very Hungry Caterpillar', author: 'Eric Carle', type: '英语绘本', target: 32, currentProgress: 32, createdAt: new Date().toISOString() }
];

const bookTypes: BookType[] = ['故事书', '科普读物', '文学名著', '英语绘本', '其他'];

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: { name: '', author: '', type: undefined, target: 100, description: '' }
  });

  const selectedType = watch('type');

  const { data: books, isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
    initialData: mockBooks,
    staleTime: 5 * 60 * 1000
  });

  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('图书添加成功');
      closeDialog();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BookFormData }) => updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('图书更新成功');
      closeDialog();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('图书删除成功');
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const openCreateDialog = () => {
    setEditingBook(null);
    reset({ name: '', author: '', type: undefined, target: 100, description: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    reset({ name: book.name, author: book.author, type: book.type, target: book.target, description: book.description || '' });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBook(null);
    reset();
  };

  const onSubmit = (data: BookFormData) => {
    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => bookToDelete && deleteMutation.mutate(bookToDelete.id);

  const filteredBooks = books?.filter(book =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalBooks = books?.length || 0;
  const completedBooks = books?.filter(b => b.currentProgress >= b.target).length || 0;
  const inProgressBooks = totalBooks - completedBooks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">图书管理</h1>
          <p className="text-gray-500 mt-1">管理孩子的阅读书目和进度</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-purple-500/25">
          <Plus className="size-4" />
          <span>添加图书</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '总藏书', value: totalBooks, gradient: 'from-purple-500 to-violet-500' },
          { label: '已读完', value: completedBooks, gradient: 'from-emerald-500 to-teal-500' },
          { label: '阅读中', value: inProgressBooks, gradient: 'from-blue-500 to-cyan-500' }
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <CardContent className="p-5 text-center relative overflow-hidden">
                <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-full -translate-y-8 translate-x-8", stat.gradient)} />
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
        <Input
          placeholder="搜索书名或作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 rounded-2xl bg-white border-0 shadow-lg shadow-gray-200/50 text-base"
        />
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-0 shadow-lg rounded-3xl">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Skeleton className="size-24 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book, index) => {
            const progress = Math.min(100, Math.round((book.currentProgress / book.target) * 100));
            const isCompleted = book.currentProgress >= book.target;
            const typeConfig = typeColors[book.type];

            return (
              <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="group overflow-hidden border-0 shadow-lg shadow-gray-200/50 rounded-3xl hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      {/* Cover */}
                      <div className={cn(
                        'size-24 rounded-2xl flex items-center justify-center shrink-0 shadow-md',
                        isCompleted ? 'bg-gradient-to-br from-emerald-400 to-teal-400' : 'bg-gradient-to-br from-purple-400 to-blue-400'
                      )}>
                        {isCompleted ? <BookMarked className="size-10 text-white" /> : <BookOpen className="size-10 text-white" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{book.name}</h3>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(book)} className="w-8 h-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50">
                              <Edit2 className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setBookToDelete(book); setDeleteDialogOpen(true); }} className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">{book.author}</p>

                        <div className="mt-2">
                          <Badge variant="outline" className={cn("text-xs rounded-full px-2 py-0.5 border", typeConfig.light)}>
                            {book.type}
                          </Badge>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">{book.currentProgress}/{book.target} 页</span>
                            <span className={cn('font-semibold', isCompleted ? 'text-emerald-600' : 'text-gray-900')}>{progress}%</span>
                          </div>
                          <Progress value={progress} className={cn('h-1.5 bg-gray-100', isCompleted && '[&>div]:bg-emerald-500')} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBooks.length === 0 && (
        <Card className="border-0 shadow-lg rounded-3xl">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="size-10 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">没有找到图书</h3>
            <p className="text-gray-500 mt-1">{searchQuery ? '尝试调整搜索条件' : '点击上方按钮添加第一本书'}</p>
            {!searchQuery && <Button onClick={openCreateDialog} className="mt-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white">添加图书</Button>}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={closeDialog} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-4 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[480px] lg:max-h-[85vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">{editingBook ? '编辑图书' : '添加图书'}</h2>
                <Button variant="ghost" size="icon" onClick={closeDialog} className="rounded-full"><X className="size-5" /></Button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto p-6">
                <form id="book-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">书名 *</Label>
                    <Input {...register('name')} placeholder="例如：小王子" className="mt-2 rounded-xl h-12 bg-gray-50 border-0" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">作者 *</Label>
                    <Input {...register('author')} placeholder="例如：安托万·德·圣-埃克苏佩里" className="mt-2 rounded-xl h-12 bg-gray-50 border-0" />
                    {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author.message}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">类型 *</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {bookTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setValue('type', type)}
                          className={cn(
                            "px-3 py-3 rounded-xl text-xs font-medium transition-all border",
                            selectedType === type ? "border-transparent text-white bg-gradient-to-r from-purple-500 to-blue-500" : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">目标页数 *</Label>
                    <Input type="number" min={1} max={9999} {...register('target', { valueAsNumber: true })} className="mt-2 rounded-xl h-12 bg-gray-50 border-0" />
                    {errors.target && <p className="text-red-500 text-xs mt-1">{errors.target.message}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">描述（可选）</Label>
                    <Textarea {...register('description')} placeholder="书籍简介或推荐语" rows={3} className="mt-2 rounded-xl bg-gray-50 border-0 resize-none" />
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 space-y-3">
                <Button type="submit" form="book-form" disabled={createMutation.isPending || updateMutation.isPending} className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25">
                  {editingBook ? '保存修改' : '添加图书'}
                </Button>
                <Button type="button" variant="outline" className="w-full h-12 rounded-xl" onClick={closeDialog}>取消</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">确认删除</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">确定要删除「{bookToDelete?.name}」吗？相关的阅读记录也将被删除，此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl h-11">取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-red-500 hover:bg-red-600 rounded-xl h-11">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
