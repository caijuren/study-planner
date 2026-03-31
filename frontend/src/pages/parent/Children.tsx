import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
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
interface Child {
  id: string;
  name: string;
  avatar?: string;
  pin: string;
  weeklyProgress: number;
  todayMinutes: number;
  completedTasks: number;
  totalTasks: number;
  streak: number;
  achievements: number;
}

// Schema
const childSchema = z.object({
  name: z.string().min(1, '请输入孩子姓名').max(20, '姓名不能超过20个字符'),
  avatar: z.string().optional(),
  pin: z.string().length(4, 'PIN码必须是4位数字').regex(/^\d+$/, 'PIN码必须是数字')
});

type ChildFormData = z.infer<typeof childSchema>;

// Avatar options
const avatarOptions = [
  '🦊', '🐼', '🐨', '🦁', '🐯', '🐰', '🐻', '🐸', '🦄', '🐱'
];

// API functions
async function fetchChildren(): Promise<Child[]> {
  const { data } = await apiClient.get('/auth/children');
  return data;
}

async function addChild(child: ChildFormData): Promise<Child> {
  const { data } = await apiClient.post('/auth/add-child', child);
  return data;
}

async function updateChild(id: string, child: ChildFormData): Promise<Child> {
  const { data } = await apiClient.put(`/auth/children/${id}`, child);
  return data;
}

async function deleteChild(id: string): Promise<void> {
  await apiClient.delete(`/auth/children/${id}`);
}

// Mock data
const mockChildren: Child[] = [
  {
    id: '1',
    name: '小明',
    avatar: '🦊',
    pin: '1234',
    weeklyProgress: 92,
    todayMinutes: 45,
    completedTasks: 5,
    totalTasks: 6,
    streak: 7,
    achievements: 12
  },
  {
    id: '2',
    name: '小红',
    avatar: '🐰',
    pin: '5678',
    weeklyProgress: 78,
    todayMinutes: 32,
    completedTasks: 4,
    totalTasks: 5,
    streak: 3,
    achievements: 8
  }
];

export default function ChildrenPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🦊');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: '',
      avatar: '🦊',
      pin: ''
    }
  });

  // Queries
  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: fetchChildren,
    initialData: mockChildren,
    staleTime: 5 * 60 * 1000
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: addChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('孩子添加成功');
      closeDialog();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChildFormData }) => updateChild(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('信息更新成功');
      closeDialog();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('孩子删除成功');
      setDeleteDialogOpen(false);
      setChildToDelete(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  // Handlers
  const openCreateDialog = () => {
    setEditingChild(null);
    setSelectedAvatar('🦊');
    reset({
      name: '',
      avatar: '🦊',
      pin: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    setSelectedAvatar(child.avatar || '🦊');
    reset({
      name: child.name,
      avatar: child.avatar || '🦊',
      pin: child.pin
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingChild(null);
    reset();
  };

  const selectAvatar = (avatar: string) => {
    setSelectedAvatar(avatar);
    setValue('avatar', avatar);
  };

  const onSubmit = (data: ChildFormData) => {
    if (editingChild) {
      updateMutation.mutate({ id: editingChild.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (childToDelete) {
      deleteMutation.mutate(childToDelete.id);
    }
  };

  const switchToChildView = (_childId: string) => {
    // In a real app, this would switch the user context
    navigate('/child');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">孩子管理</h1>
          <p className="text-muted-foreground text-sm mt-1">管理孩子的账户和查看学习进度</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="size-4" />
          <span>添加孩子</span>
        </Button>
      </div>

      {/* Children Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-16 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Stagger stagger={0.1} className="grid gap-4 md:grid-cols-2">
          {children?.map((child) => (
            <FadeIn key={child.id} variants={fadeUp}>
              <HoverLift>
                <Card className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-[#FFB5BA] via-[#7DD3FC] to-[#7EDACA]" />
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="size-16 rounded-full bg-gradient-to-br from-[#FFB5BA] to-[#C4B5FD] flex items-center justify-center text-3xl">
                        {child.avatar || '👶'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-foreground">{child.name}</h3>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog(child)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setChildToDelete(child);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">连续学习</p>
                            <p className="text-lg font-bold text-foreground">{child.streak}天</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">获得成就</p>
                            <p className="text-lg font-bold text-foreground">{child.achievements}个</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">今日时长</p>
                            <p className="text-lg font-bold text-foreground">{child.todayMinutes}分</p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">本周进度</span>
                            <span className="font-medium">{child.weeklyProgress}%</span>
                          </div>
                          <Progress value={child.weeklyProgress} className="h-2" />
                          <div className="flex items-center justify-between text-xs mt-1 text-muted-foreground">
                            <span>已完成 {child.completedTasks}/{child.totalTasks} 任务</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => switchToChildView(child.id)}
                          >
                            <Eye className="size-3" />
                            查看详情
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => switchToChildView(child.id)}
                          >
                            切换视图
                            <ArrowRight className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </FadeIn>
          ))}
        </Stagger>
      )}

      {/* Empty State */}
      {!isLoading && (!children || children.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground">还没有添加孩子</h3>
            <p className="text-sm text-muted-foreground mt-1">点击上方按钮添加第一个孩子</p>
            <Button onClick={openCreateDialog} className="mt-4">
              添加孩子
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChild ? '编辑孩子信息' : '添加孩子'}</DialogTitle>
            <DialogDescription>
              {editingChild ? '修改孩子的基本信息' : '创建一个新的孩子账户'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>选择头像</Label>
              <div className="flex flex-wrap gap-2">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => selectAvatar(avatar)}
                    className={cn(
                      'size-12 rounded-lg text-2xl flex items-center justify-center transition-all border-2',
                      selectedAvatar === avatar
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-transparent hover:bg-muted'
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="输入孩子的姓名"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN码 *</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                {...register('pin')}
                placeholder="4位数字PIN码"
                className="text-center tracking-widest"
              />
              {errors.pin && (
                <p className="text-xs text-destructive">{errors.pin.message}</p>
              )}
              <p className="text-xs text-muted-foreground">PIN码用于孩子登录时的身份验证</p>
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
                {editingChild ? '保存' : '添加'}
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
              确定要删除「{childToDelete?.name}」的账户吗？这将删除所有相关的学习数据，此操作无法撤销。
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
