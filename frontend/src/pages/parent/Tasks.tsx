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
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';
import { FadeIn, Stagger, fadeUp, HoverLift } from '@/components/MotionPrimitives';

// Types
type TaskCategory = '校内巩固' | '校内拔高' | '课外课程' | '英语阅读' | '体育运动' | '中文阅读';
type TaskType = '固定' | '灵活' | '跟随学校';

interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  type: TaskType;
  timePerUnit: number; // minutes
  description?: string;
  createdAt: string;
}

// Schema
const taskSchema = z.object({
  name: z.string().min(1, '请输入任务名称').max(50, '任务名称不能超过50个字符'),
  category: z.enum(['校内巩固', '校内拔高', '课外课程', '英语阅读', '体育运动', '中文阅读']),
  type: z.enum(['固定', '灵活', '跟随学校']),
  timePerUnit: z.number().min(1, '时间不能小于1分钟').max(180, '时间不能超过180分钟'),
  description: z.string().max(200, '描述不能超过200个字符').optional()
});

type TaskFormData = z.infer<typeof taskSchema>;

// Category colors
const categoryColors: Record<TaskCategory, string> = {
  '校内巩固': 'bg-[#FFB5BA]/20 text-[#FFB5BA] border-[#FFB5BA]/30',
  '校内拔高': 'bg-[#7DD3FC]/20 text-[#7DD3FC] border-[#7DD3FC]/30',
  '课外课程': 'bg-[#7EDACA]/20 text-[#7EDACA] border-[#7EDACA]/30',
  '英语阅读': 'bg-[#C4B5FD]/20 text-[#C4B5FD] border-[#C4B5FD]/30',
  '体育运动': 'bg-warning/20 text-warning border-warning/30',
  '中文阅读': 'bg-theme-gold/20 text-theme-gold border-theme-gold/30'
};

const typeColors: Record<TaskType, string> = {
  '固定': 'bg-primary/20 text-primary',
  '灵活': 'bg-secondary text-secondary-foreground',
  '跟随学校': 'bg-muted text-muted-foreground'
};

// API functions
async function fetchTasks(): Promise<Task[]> {
  const { data } = await apiClient.get('/tasks');
  return data;
}

async function createTask(task: TaskFormData): Promise<Task> {
  const { data } = await apiClient.post('/tasks', task);
  return data;
}

async function updateTask(id: string, task: TaskFormData): Promise<Task> {
  const { data } = await apiClient.put(`/tasks/${id}`, task);
  return data;
}

async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

// Mock data for development
const mockTasks: Task[] = [
  { id: '1', name: '数学练习', category: '校内巩固', type: '固定', timePerUnit: 30, createdAt: new Date().toISOString() },
  { id: '2', name: '语文阅读', category: '中文阅读', type: '灵活', timePerUnit: 20, createdAt: new Date().toISOString() },
  { id: '3', name: '英语听力', category: '英语阅读', type: '固定', timePerUnit: 15, createdAt: new Date().toISOString() },
  { id: '4', name: '奥数练习', category: '校内拔高', type: '灵活', timePerUnit: 25, createdAt: new Date().toISOString() },
  { id: '5', name: '游泳训练', category: '体育运动', type: '固定', timePerUnit: 60, createdAt: new Date().toISOString() },
  { id: '6', name: '钢琴练习', category: '课外课程', type: '固定', timePerUnit: 30, createdAt: new Date().toISOString() },
];

const categories: TaskCategory[] = ['校内巩固', '校内拔高', '课外课程', '英语阅读', '体育运动', '中文阅读'];

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const queryClient = useQueryClient();

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      category: undefined,
      type: undefined,
      timePerUnit: 30,
      description: ''
    }
  });

  // Queries
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    initialData: mockTasks,
    staleTime: 5 * 60 * 1000
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务创建成功');
      closeDialog();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskFormData }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务更新成功');
      closeDialog();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务删除成功');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  // Handlers
  const openCreateDialog = () => {
    setEditingTask(null);
    reset({
      name: '',
      category: undefined,
      type: undefined,
      timePerUnit: 30,
      description: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    reset({
      name: task.name,
      category: task.category,
      type: task.type,
      timePerUnit: task.timePerUnit,
      description: task.description || ''
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
    reset();
  };

  const onSubmit = (data: TaskFormData) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
    }
  };

  // Filter tasks
  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'fixed' && task.type === '固定') ||
      (activeTab === 'flexible' && task.type === '灵活') ||
      (activeTab === 'school' && task.type === '跟随学校');
    return matchesSearch && matchesTab;
  }) || [];

  // Group by category
  const tasksByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredTasks.filter(task => task.category === category);
    return acc;
  }, {} as Record<TaskCategory, Task[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">任务配置</h1>
          <p className="text-muted-foreground text-sm mt-1">管理孩子的学习任务</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="size-4" />
          <span>添加任务</span>
        </Button>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索任务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="fixed">固定</TabsTrigger>
            <TabsTrigger value="flexible">灵活</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Task List by Category */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryTasks = tasksByCategory[category];
            if (categoryTasks.length === 0) return null;

            return (
              <div key={category}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Badge variant="outline" className={categoryColors[category]}>
                    {category}
                  </Badge>
                  <span className="text-xs">({categoryTasks.length})</span>
                </h2>
                <Stagger stagger={0.05} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {categoryTasks.map((task) => (
                    <FadeIn key={task.id} variants={fadeUp}>
                      <HoverLift>
                        <Card className="group hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate">{task.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className={typeColors[task.type]}>
                                    {task.type}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="size-3" />
                                    <span>{task.timePerUnit}分钟</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => openEditDialog(task)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Edit2 className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setTaskToDelete(task);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </HoverLift>
                    </FadeIn>
                  ))}
                </Stagger>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground">没有找到任务</h3>
          <p className="text-sm text-muted-foreground mt-1">尝试调整搜索条件或添加新任务</p>
          <Button onClick={openCreateDialog} variant="outline" className="mt-4">
            添加任务
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? '编辑任务' : '添加任务'}</DialogTitle>
            <DialogDescription>
              {editingTask ? '修改任务信息' : '创建一个新的学习任务'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">任务名称 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="例如：数学练习"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>任务分类 *</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value as TaskCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>任务类型 *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as TaskType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="固定">固定 - 每天固定时间</SelectItem>
                  <SelectItem value="灵活">灵活 - 自主安排时间</SelectItem>
                  <SelectItem value="跟随学校">跟随学校 - 根据学校作业</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePerUnit">时间（分钟）*</Label>
              <Input
                id="timePerUnit"
                type="number"
                min={1}
                max={180}
                {...register('timePerUnit', { valueAsNumber: true })}
              />
              {errors.timePerUnit && (
                <p className="text-xs text-destructive">{errors.timePerUnit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="任务详细说明"
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
                {editingTask ? '保存' : '创建'}
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
              确定要删除任务「{taskToDelete?.name}」吗？此操作无法撤销。
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
