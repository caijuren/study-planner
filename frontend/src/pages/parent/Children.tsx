import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  User,
  X,
  Flame,
  Award,
  Clock,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
const avatarOptions = ['🦊', '🐼', '🐨', '🦁', '🐯', '🐰', '🐻', '🐸', '🦄', '🐱'];

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
  { id: '1', name: '小明', avatar: '🦊', pin: '1234', weeklyProgress: 92, todayMinutes: 45, completedTasks: 5, totalTasks: 6, streak: 7, achievements: 12 },
  { id: '2', name: '小红', avatar: '🐰', pin: '5678', weeklyProgress: 78, todayMinutes: 32, completedTasks: 4, totalTasks: 5, streak: 3, achievements: 8 }
];

export default function ChildrenPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🦊');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: { name: '', avatar: '🦊', pin: '' }
  });

  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: fetchChildren,
    initialData: mockChildren,
    staleTime: 5 * 60 * 1000
  });

  const createMutation = useMutation({
    mutationFn: addChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('孩子添加成功');
      closeDialog();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChildFormData }) => updateChild(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('信息更新成功');
      closeDialog();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('孩子删除成功');
      setDeleteDialogOpen(false);
      setChildToDelete(null);
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const openCreateDialog = () => {
    setEditingChild(null);
    setSelectedAvatar('🦊');
    reset({ name: '', avatar: '🦊', pin: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    setSelectedAvatar(child.avatar || '🦊');
    reset({ name: child.name, avatar: child.avatar || '🦊', pin: child.pin });
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

  const handleDelete = () => childToDelete && deleteMutation.mutate(childToDelete.id);
  const switchToChildView = (_childId: string) => navigate('/child');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">孩子管理</h1>
          <p className="text-gray-500 mt-1">管理孩子的账户和查看学习进度</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-purple-500/25">
          <Plus className="size-4" />
          <span>添加孩子</span>
        </Button>
      </div>

      {/* Children Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-lg rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-20 rounded-2xl" />
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
        <div className="grid gap-4 md:grid-cols-2">
          {children?.map((child, index) => (
            <motion.div key={child.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="overflow-hidden border-0 shadow-lg shadow-gray-200/50 rounded-3xl hover:shadow-xl transition-all duration-300">
                <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="size-20 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-4xl shadow-lg shadow-purple-500/20">
                      {child.avatar || '👶'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">{child.name}</h3>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(child)} className="w-9 h-9 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full">
                            <Edit2 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setChildToDelete(child); setDeleteDialogOpen(true); }} className="w-9 h-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="text-center p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                          <Flame className="size-4 text-orange-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-gray-900">{child.streak}</p>
                          <p className="text-xs text-gray-500">连续学习</p>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                          <Award className="size-4 text-purple-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-gray-900">{child.achievements}</p>
                          <p className="text-xs text-gray-500">成就</p>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                          <Clock className="size-4 text-blue-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-gray-900">{child.todayMinutes}</p>
                          <p className="text-xs text-gray-500">今日分钟</p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500 flex items-center gap-1"><Target className="size-4" />本周进度</span>
                          <span className="font-bold text-gray-900">{child.weeklyProgress}%</span>
                        </div>
                        <Progress value={child.weeklyProgress} className="h-2 bg-gray-100" />
                        <p className="text-xs text-gray-400 mt-1">已完成 {child.completedTasks}/{child.totalTasks} 任务</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-xl h-10" onClick={() => switchToChildView(child.id)}>
                          <Eye className="size-4" />查看详情
                        </Button>
                        <Button size="sm" className="flex-1 gap-1 rounded-xl h-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white" onClick={() => switchToChildView(child.id)}>
                          切换视图<ArrowRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!children || children.length === 0) && (
        <Card className="border-0 shadow-lg rounded-3xl">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <User className="size-10 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">还没有添加孩子</h3>
            <p className="text-gray-500 mt-1">点击上方按钮添加第一个孩子</p>
            <Button onClick={openCreateDialog} className="mt-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white">添加孩子</Button>
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
                <h2 className="text-xl font-bold text-gray-900">{editingChild ? '编辑孩子信息' : '添加孩子'}</h2>
                <Button variant="ghost" size="icon" onClick={closeDialog} className="rounded-full"><X className="size-5" /></Button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto p-6">
                <form id="child-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">选择头像</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {avatarOptions.map((avatar) => (
                        <button key={avatar} type="button" onClick={() => selectAvatar(avatar)} className={cn('size-12 rounded-xl text-2xl flex items-center justify-center transition-all border-2', selectedAvatar === avatar ? 'border-purple-500 bg-purple-50 scale-110' : 'border-transparent hover:bg-gray-100')}>
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">姓名 *</Label>
                    <Input {...register('name')} placeholder="输入孩子的姓名" className="mt-2 rounded-xl h-12 bg-gray-50 border-0" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">PIN码 *</Label>
                    <Input type="password" maxLength={4} {...register('pin')} placeholder="4位数字PIN码" className="mt-2 rounded-xl h-12 bg-gray-50 border-0 text-center tracking-[0.5em] text-lg" />
                    {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
                    <p className="text-xs text-gray-400 mt-2">PIN码用于孩子登录时的身份验证</p>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 space-y-3">
                <Button type="submit" form="child-form" disabled={createMutation.isPending || updateMutation.isPending} className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25">
                  {editingChild ? '保存修改' : '添加孩子'}
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
            <AlertDialogDescription className="text-gray-500">确定要删除「{childToDelete?.name}」的账户吗？这将删除所有相关的学习数据，此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl h-11">取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-red-500 hover:bg-red-600 rounded-xl h-11">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
