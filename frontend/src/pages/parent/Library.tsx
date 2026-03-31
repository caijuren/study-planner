import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { FadeIn, Stagger, fadeUp, HoverLift } from '@/components/MotionPrimitives';
import { cn } from '@/lib/utils';

// Types
type BookType = '故事书' | '科普读物' | '文学名著' | '英语绘本' | '其他';

interface Book {
  id: string;
  name: string;
  author: string;
  type: BookType;
  target: number; // target pages or chapters
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

// Type colors
const typeColors: Record<BookType, string> = {
  '故事书': 'bg-[#FFB5BA]/20 text-[#FFB5BA] border-[#FFB5BA]/30',
  '科普读物': 'bg-[#7DD3FC]/20 text-[#7DD3FC] border-[#7DD3FC]/30',
  '文学名著': 'bg-[#7EDACA]/20 text-[#7EDACA] border-[#7EDACA]/30',
  '英语绘本': 'bg-[#C4B5FD]/20 text-[#C4B5FD] border-[#C4B5FD]/30',
  '其他': 'bg-muted text-muted-foreground'
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
  {
    id: '1',
    name: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    type: '文学名著',
    target: 97,
    currentProgress: 45,
    description: '一本关于爱与责任的童话',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: '十万个为什么',
    author: '叶永烈',
    type: '科普读物',
    target: 200,
    currentProgress: 120,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: '格林童话',
    author: '格林兄弟',
    type: '故事书',
    target: 300,
    currentProgress: 280,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'The Very Hungry Caterpillar',
    author: 'Eric Carle',
    type: '英语绘本',
    target: 32,
    currentProgress: 32,
    createdAt: new Date().toISOString()
  }
];

const bookTypes: BookType[] = ['故事书', '科普读物', '文学名著', '英语绘本', '其他'];

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const queryClient = useQueryClient();

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      name: '',
      author: '',
      type: undefined,
      target: 100,
      description: ''
    }
  });

  // Queries
  const { data: books, isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
    initialData: mockBooks,
    staleTime: 5 * 60 * 1000
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('图书添加成功');
      closeDialog();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BookFormData }) => updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('图书更新成功');
      closeDialog();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('图书删除成功');
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  // Handlers
  const openCreateDialog = () => {
    setEditingBook(null);
    reset({
      name: '',
      author: '',
      type: undefined,
      target: 100,
      description: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    reset({
      name: book.name,
      author: book.author,
      type: book.type,
      target: book.target,
      description: book.description || ''
    });
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

  const handleDelete = () => {
    if (bookToDelete) {
      deleteMutation.mutate(bookToDelete.id);
    }
  };

  // Filter books
  const filteredBooks = books?.filter(book =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Stats
  const totalBooks = books?.length || 0;
  const completedBooks = books?.filter(b => b.currentProgress >= b.target).length || 0;
  const inProgressBooks = totalBooks - completedBooks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">图书管理</h1>
          <p className="text-muted-foreground text-sm mt-1">管理孩子的阅读书目和进度</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="size-4" />
          <span>添加图书</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalBooks}</p>
            <p className="text-xs text-muted-foreground">总藏书</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{completedBooks}</p>
            <p className="text-xs text-muted-foreground">已读完</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{inProgressBooks}</p>
            <p className="text-xs text-muted-foreground">阅读中</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="搜索书名或作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="size-20 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Stagger stagger={0.05} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => {
            const progress = Math.min(100, Math.round((book.currentProgress / book.target) * 100));
            const isCompleted = book.currentProgress >= book.target;

            return (
              <FadeIn key={book.id} variants={fadeUp}>
                <HoverLift>
                  <Card className="group overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Cover */}
                        <div className={cn(
                          'size-20 rounded-lg flex items-center justify-center shrink-0',
                          isCompleted ? 'bg-success/20' : 'bg-gradient-to-br from-[#FFB5BA] to-[#C4B5FD]'
                        )}>
                          {isCompleted ? (
                            <BookMarked className="size-8 text-success" />
                          ) : (
                            <BookOpen className="size-8 text-white" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-foreground truncate">{book.name}</h3>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEditDialog(book)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setBookToDelete(book);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={typeColors[book.type]}>
                              {book.type}
                            </Badge>
                          </div>

                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">
                                {book.currentProgress}/{book.target} 页
                              </span>
                              <span className={cn(
                                'font-medium',
                                isCompleted ? 'text-success' : 'text-foreground'
                              )}>
                                {progress}%
                              </span>
                            </div>
                            <Progress
                              value={progress}
                              className={cn('h-1.5', isCompleted && '[&>div]:bg-success')}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </FadeIn>
            );
          })}
        </Stagger>
      )}

      {/* Empty State */}
      {!isLoading && filteredBooks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground">没有找到图书</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? '尝试调整搜索条件' : '点击上方按钮添加第一本书'}
            </p>
            {!searchQuery && (
              <Button onClick={openCreateDialog} className="mt-4">
                添加图书
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBook ? '编辑图书' : '添加图书'}</DialogTitle>
            <DialogDescription>
              {editingBook ? '修改图书信息' : '添加一本新的图书'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">书名 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="例如：小王子"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">作者 *</Label>
              <Input
                id="author"
                {...register('author')}
                placeholder="例如：安托万·德·圣-埃克苏佩里"
              />
              {errors.author && (
                <p className="text-xs text-destructive">{errors.author.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>类型 *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as BookType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {bookTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">目标页数 *</Label>
              <Input
                id="target"
                type="number"
                min={1}
                max={9999}
                {...register('target', { valueAsNumber: true })}
              />
              {errors.target && (
                <p className="text-xs text-destructive">{errors.target.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="书籍简介或推荐语"
                rows={3}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeDialog}>
                取消
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Spinner className="size-4 mr-2" />
                )}
                {editingBook ? '保存' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{bookToDelete?.name}」吗？相关的阅读记录也将被删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Spinner className="size-4 mr-2" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
