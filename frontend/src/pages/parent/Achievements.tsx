import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  Trophy,
  Users,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  isActive: boolean;
  unlockedChildren?: { id: string; name: string; avatar?: string; unlockedAt: string }[];
}

// Schema
const achievementSchema = z.object({
  name: z.string().min(1, '请输入成就名称').max(30, '名称不能超过30个字符'),
  description: z.string().min(1, '请输入成就描述').max(100, '描述不能超过100个字符'),
  icon: z.string().min(1, '请选择图标'),
  condition: z.string().min(1, '请输入解锁条件').max(100, '条件不能超过100个字符')
});

type AchievementFormData = z.infer<typeof achievementSchema>;

// Icon options
const iconOptions = [
  '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💫', '🎯', '🔥', '💪',
  '📚', '📖', '✏️', '🎨', '🎵', '🎸', '⚽', '🏃', '🚀', '💎'
];

// API functions
async function fetchAchievements(): Promise<Achievement[]> {
  const { data } = await apiClient.get('/achievements');
  return data;
}

async function createAchievement(achievement: AchievementFormData): Promise<Achievement> {
  const { data } = await apiClient.post('/achievements', achievement);
  return data;
}

async function updateAchievement(id: string, achievement: AchievementFormData): Promise<Achievement> {
  const { data } = await apiClient.put(`/achievements/${id}`, achievement);
  return data;
}

async function deleteAchievement(id: string): Promise<void> {
  await apiClient.delete(`/achievements/${id}`);
}

async function toggleAchievement(id: string, isActive: boolean): Promise<Achievement> {
  const { data } = await apiClient.patch(`/achievements/${id}/toggle`, { isActive });
  return data;
}

// Mock data
const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: '学习达人',
    description: '连续学习7天',
    icon: '🔥',
    condition: '连续7天完成所有任务',
    isActive: true,
    unlockedChildren: [
      { id: '1', name: '小明', unlockedAt: '2024-01-15' }
    ]
  },
  {
    id: '2',
    name: '阅读之星',
    description: '完成10本书的阅读',
    icon: '📚',
    condition: '累计阅读完成10本书',
    isActive: true,
    unlockedChildren: [
      { id: '1', name: '小明', unlockedAt: '2024-01-10' },
      { id: '2', name: '小红', unlockedAt: '2024-01-12' }
    ]
  },
  {
    id: '3',
    name: '数学小能手',
    description: '数学任务全部完成',
    icon: '🎯',
    condition: '本周数学相关任务完成率达100%',
    isActive: true,
    unlockedChildren: []
  },
  {
    id: '4',
    name: '运动健将',
    description: '坚持运动30天',
    icon: '🏃',
    condition: '累计完成30次运动任务',
    isActive: false,
    unlockedChildren: []
  },
  {
    id: '5',
    name: '早起鸟',
    description: '连续早起学习',
    icon: '⭐',
    condition: '连续5天在早上8点前开始学习',
    isActive: true,
    unlockedChildren: [
      { id: '2', name: '小红', unlockedAt: '2024-01-14' }
    ]
  }
];

export default function AchievementsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>('🏆');
  const [showingUnlocked, setShowingUnlocked] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<AchievementFormData>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '🏆',
      condition: ''
    }
  });

  // Queries
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAchievements,
    initialData: mockAchievements,
    staleTime: 5 * 60 * 1000
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAchievement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast.success('成就创建成功');
      closeDialog();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AchievementFormData }) => updateAchievement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast.success('成就更新成功');
      closeDialog();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAchievement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast.success('成就删除成功');
      setDeleteDialogOpen(false);
      setAchievementToDelete(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleAchievement(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast.success('状态更新成功');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  // Handlers
  const openCreateDialog = () => {
    setEditingAchievement(null);
    setSelectedIcon('🏆');
    reset({
      name: '',
      description: '',
      icon: '🏆',
      condition: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setSelectedIcon(achievement.icon);
    reset({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      condition: achievement.condition
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAchievement(null);
    reset();
  };

  const selectIcon = (icon: string) => {
    setSelectedIcon(icon);
    setValue('icon', icon);
  };

  const onSubmit = (data: AchievementFormData) => {
    if (editingAchievement) {
      updateMutation.mutate({ id: editingAchievement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (achievementToDelete) {
      deleteMutation.mutate(achievementToDelete.id);
    }
  };

  const handleToggle = (achievement: Achievement) => {
    toggleMutation.mutate({ id: achievement.id, isActive: !achievement.isActive });
  };

  // Stats
  const totalAchievements = achievements?.length || 0;
  const activeAchievements = achievements?.filter(a => a.isActive).length || 0;
  const totalUnlocks = achievements?.reduce((sum, a) => sum + (a.unlockedChildren?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">成就配置</h1>
          <p className="text-muted-foreground text-sm mt-1">设置激励孩子学习的成就系统</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="size-4" />
          <span>添加成就</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalAchievements}</p>
            <p className="text-xs text-muted-foreground">总成就</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{activeAchievements}</p>
            <p className="text-xs text-muted-foreground">已启用</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalUnlocks}</p>
            <p className="text-xs text-muted-foreground">已解锁次数</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="size-14 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Stagger stagger={0.05} className="grid gap-4 sm:grid-cols-2">
          {achievements?.map((achievement) => (
            <FadeIn key={achievement.id} variants={fadeUp}>
              <HoverLift>
                <Card className={cn(
                  'group overflow-hidden transition-opacity',
                  !achievement.isActive && 'opacity-60'
                )}>
                  <div className={cn(
                    'h-1',
                    achievement.isActive ? 'bg-gradient-to-r from-[#FFB5BA] via-[#7DD3FC] to-[#7EDACA]' : 'bg-muted'
                  )} />
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={cn(
                        'size-14 rounded-xl flex items-center justify-center shrink-0 text-2xl',
                        achievement.isActive
                          ? 'bg-gradient-to-br from-[#FFB5BA] to-[#C4B5FD]'
                          : 'bg-muted'
                      )}>
                        {achievement.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-foreground">{achievement.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleToggle(achievement)}
                              className="text-muted-foreground"
                            >
                              {achievement.isActive ? (
                                <ToggleRight className="size-5 text-success" />
                              ) : (
                                <ToggleLeft className="size-5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog(achievement)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setAchievementToDelete(achievement);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {achievement.condition}
                          </Badge>
                        </div>

                        {/* Unlocked Children */}
                        {achievement.unlockedChildren && achievement.unlockedChildren.length > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => setShowingUnlocked(
                                showingUnlocked === achievement.id ? null : achievement.id
                              )}
                              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Users className="size-3" />
                              <span>{achievement.unlockedChildren.length}人已解锁</span>
                            </button>

                            {showingUnlocked === achievement.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex flex-wrap gap-2 mt-2"
                              >
                                {achievement.unlockedChildren.map((child) => (
                                  <div
                                    key={child.id}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-full"
                                  >
                                    <Avatar className="size-4">
                                      <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                                        {child.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{child.name}</span>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        )}
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
      {!isLoading && (!achievements || achievements.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground">还没有创建成就</h3>
            <p className="text-sm text-muted-foreground mt-1">创建成就来激励孩子学习</p>
            <Button onClick={openCreateDialog} className="mt-4">
              添加成就
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAchievement ? '编辑成就' : '添加成就'}</DialogTitle>
            <DialogDescription>
              {editingAchievement ? '修改成就信息' : '创建一个新的成就'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>选择图标</Label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => selectIcon(icon)}
                    className={cn(
                      'size-10 rounded-lg text-xl flex items-center justify-center transition-all border-2',
                      selectedIcon === icon
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-transparent hover:bg-muted'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">成就名称 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="例如：学习达人"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述 *</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="例如：连续学习7天"
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">解锁条件 *</Label>
              <Textarea
                id="condition"
                {...register('condition')}
                placeholder="详细描述解锁条件"
                rows={2}
              />
              {errors.condition && (
                <p className="text-xs text-destructive">{errors.condition.message}</p>
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
                {editingAchievement ? '保存' : '创建'}
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
              确定要删除成就「{achievementToDelete?.name}」吗？此操作无法撤销。
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
