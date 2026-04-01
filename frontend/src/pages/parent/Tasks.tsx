import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  BookOpen,
  Calculator,
  Dumbbell,
  GraduationCap,
  Languages,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { FadeIn, Stagger } from '@/components/MotionPrimitives';
import { cn } from '@/lib/utils';

// Types
type TaskCategory = '校内巩固' | '校内拔高' | '课外课程' | '英语阅读' | '体育运动' | '中文阅读';
type TaskType = '固定' | '灵活' | '跟随学校';
type UnitType = '本' | '次' | '章' | '课时';

interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  type: TaskType;
  quantity: number;
  unit: UnitType;
  timePerUnit: number;
  frequency: 'daily' | 'weekly';
  frequencyValue: number;
  description?: string;
}

// Schema
const taskSchema = z.object({
  name: z.string().min(1, '请输入任务名称').max(50, '任务名称不能超过50个字符'),
  category: z.enum(['校内巩固', '校内拔高', '课外课程', '英语阅读', '体育运动', '中文阅读']),
  type: z.enum(['固定', '灵活', '跟随学校']),
  quantity: z.number().min(1, '数量不能小于1').max(100, '数量不能超过100'),
  unit: z.enum(['本', '次', '章', '课时']),
  timePerUnit: z.number().min(1, '时间不能小于1分钟').max(180, '时间不能超过180分钟'),
  frequency: z.enum(['daily', 'weekly']),
  frequencyValue: z.number().min(1).max(7),
  description: z.string().max(200, '描述不能超过200字符').optional()
});

type TaskFormData = z.infer<typeof taskSchema>;

// Category config
const categoryConfig: Record<TaskCategory, { icon: any; color: string; bgColor: string }> = {
  '校内巩固': { icon: BookOpen, color: 'text-[#FFB5BA]', bgColor: 'bg-[#FFB5BA]/20' },
  '校内拔高': { icon: Calculator, color: 'text-[#7DD3FC]', bgColor: 'bg-[#7DD3FC]/20' },
  '课外课程': { icon: GraduationCap, color: 'text-[#7EDACA]', bgColor: 'bg-[#7EDACA]/20' },
  '英语阅读': { icon: Languages, color: 'text-[#C4B5FD]', bgColor: 'bg-[#C4B5FD]/20' },
  '体育运动': { icon: Dumbbell, color: 'text-amber-500', bgColor: 'bg-amber-500/20' },
  '中文阅读': { icon: School, color: 'text-emerald-500', bgColor: 'bg-emerald-500/20' }
};

const typeConfig: Record<TaskType, { label: string; icon: string; color: string; borderColor: string }> = {
  '固定': { label: '固定任务', icon: '📌', color: 'bg-[#FFB5BA]', borderColor: 'border-[#FFB5BA]' },
  '灵活': { label: '灵活任务', icon: '📎', color: 'bg-[#7DD3FC]', borderColor: 'border-[#7DD3FC]' },
  '跟随学校': { label: '跟随学校', icon: '🏫', color: 'bg-[#7EDACA]', borderColor: 'border-[#7EDACA]' }
};

const categories: TaskCategory[] = ['校内巩固', '校内拔高', '课外课程', '英语阅读', '体育运动', '中文阅读'];
const units: UnitType[] = ['本', '次', '章', '课时'];

// Mock data
const mockTasks: Task[] = [
  { id: '1', name: '校内作业', category: '校内巩固', type: '固定', quantity: 1, unit: '次', timePerUnit: 30, frequency: 'daily', frequencyValue: 1 },
  { id: '2', name: 'ABC Reading', category: '英语阅读', type: '固定', quantity: 1, unit: '次', timePerUnit: 30, frequency: 'daily', frequencyValue: 1 },
  { id: '3', name: '体育运动', category: '体育运动', type: '固定', quantity: 1, unit: '次', timePerUnit: 30, frequency: 'daily', frequencyValue: 1 },
  { id: '4', name: '语文一课一练', category: '校内巩固', type: '灵活', quantity: 1, unit: '次', timePerUnit: 30, frequency: 'weekly', frequencyValue: 1 },
  { id: '5', name: '数学一课一练', category: '校内巩固', type: '灵活', quantity: 1, unit: '次', timePerUnit: 30, frequency: 'weekly', frequencyValue: 1 },
  { id: '6', name: '培优满分精练', category: '校内拔高', type: '灵活', quantity: 1, unit: '次', timePerUnit: 30, frequency: 'weekly', frequencyValue: 1 },
  { id: '7', name: '高思数学', category: '校内拔高', type: '灵活', quantity: 2, unit: '章', timePerUnit: 30, frequency: 'weekly', frequencyValue: 2 },
];

// API functions
async function fetchTasks(): Promise<Task[]> {
  const { data } = await apiClient.get('/tasks');
  return data.data || mockTasks;
}

async function createTask(task: TaskFormData): Promise<Task> {
  const { data } = await apiClient.post('/tasks', task);
  return data.data;
}

async function updateTask(id: string, task: TaskFormData): Promise<Task> {
  const { data } = await apiClient.put(`/tasks/${id}`, task);
  return data.data;
}

async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

export default function TasksPage() {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const queryClient = useQueryClient();

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
      category: '校内巩固',
      type: '固定',
      quantity: 1,
      unit: '次',
      timePerUnit: 30,
      frequency: 'daily',
      frequencyValue: 1,
      description: ''
    }
  });

  const selectedType = watch('type');
  const selectedCategory = watch('category');
  const selectedUnit = watch('unit');
  const selectedFrequency = watch('frequency');

  // Queries
  const { data: tasks = mockTasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    initialData: mockTasks
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务创建成功');
      reset();
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
      setEditingTask(null);
      reset();
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

  const onSubmit = (data: TaskFormData) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    reset({
      name: task.name,
      category: task.category,
      type: task.type,
      quantity: task.quantity,
      unit: task.unit,
      timePerUnit: task.timePerUnit,
      frequency: task.frequency,
      frequencyValue: task.frequencyValue,
      description: task.description || ''
    });
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
    }
  };

  // Group tasks by type
  const fixedTasks = tasks.filter(t => t.type === '固定');
  const flexibleTasks = tasks.filter(t => t.type === '灵活' || t.type === '跟随学校');

  // Group by category
  const groupByCategory = (taskList: Task[]) => {
    const grouped: Record<string, Task[]> = {};
    taskList.forEach(task => {
      if (!grouped[task.category]) grouped[task.category] = [];
      grouped[task.category].push(task);
    });
    return grouped;
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const config = categoryConfig[task.category];
    const Icon = config.icon;
    const freqText = task.frequency === 'daily' 
      ? `每天${task.frequencyValue}次` 
      : `每周${task.frequencyValue}次`;

    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{task.name}</h4>
              <p className="text-sm text-gray-500 mt-0.5">
                每次{task.timePerUnit}分钟 | {freqText}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEdit(task)}
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(task)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const CategorySection = ({ category, tasks }: { category: TaskCategory; tasks: Task[] }) => {
    const config = categoryConfig[category];
    const Icon = config.icon;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={cn("w-4 h-4", config.color)} />
          <span className={cn("text-sm font-medium", config.color)}>{category}</span>
        </div>
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const fixedGrouped = groupByCategory(fixedTasks);
  const flexibleGrouped = groupByCategory(flexibleTasks);

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen">
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">任务配置</h1>
          <p className="text-gray-500 mt-1">配置学习任务模板，设置分类、频率和时长</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fixed Tasks Column */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-100">
              <span className="text-amber-500 text-lg">🔒</span>
              <h2 className="font-bold text-amber-600">固定任务（每日必做）</h2>
            </div>
            <div className="space-y-2">
              {Object.entries(fixedGrouped).map(([category, categoryTasks]) => (
                <CategorySection 
                  key={category} 
                  category={category as TaskCategory} 
                  tasks={categoryTasks} 
                />
              ))}
              {fixedTasks.length === 0 && (
                <p className="text-gray-400 text-center py-8">暂无固定任务</p>
              )}
            </div>
          </div>

          {/* Flexible Tasks Column */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-100">
              <span className="text-emerald-500 text-lg">📎</span>
              <h2 className="font-bold text-emerald-600">灵活任务（本周总计）</h2>
            </div>
            <div className="space-y-2">
              {Object.entries(flexibleGrouped).map(([category, categoryTasks]) => (
                <CategorySection 
                  key={category} 
                  category={category as TaskCategory} 
                  tasks={categoryTasks} 
                />
              ))}
              {flexibleTasks.length === 0 && (
                <p className="text-gray-400 text-center py-8">暂无灵活任务</p>
              )}
            </div>
          </div>

          {/* Add Task Form */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100">
              <Plus className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-blue-600">
                {editingTask ? '编辑任务' : '新增任务'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Task Name */}
              <div>
                <Label className="text-sm font-medium text-gray-700">任务名称</Label>
                <Input
                  placeholder="如：英语听力"
                  className="mt-1.5 rounded-xl"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm font-medium text-gray-700">分类</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {categories.map(cat => {
                    const config = categoryConfig[cat];
                    const Icon = config.icon;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setValue('category', cat)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                          selectedCategory === cat
                            ? cn(config.bgColor, config.color, "ring-2 ring-offset-1", config.color.replace('text-', 'ring-'))
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">数量</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    className="mt-1.5 rounded-xl"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">单位</Label>
                  <div className="grid grid-cols-4 gap-1 mt-1.5">
                    {units.map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setValue('unit', unit)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-medium transition-all",
                          selectedUnit === unit
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time */}
              <div>
                <Label className="text-sm font-medium text-gray-700">单次预估时长（分钟）</Label>
                <Input
                  type="number"
                  min={1}
                  max={180}
                  className="mt-1.5 rounded-xl"
                  {...register('timePerUnit', { valueAsNumber: true })}
                />
              </div>

              {/* Task Type */}
              <div>
                <Label className="text-sm font-medium text-gray-700">任务类型</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {(Object.keys(typeConfig) as TaskType[]).map(type => {
                    const config = typeConfig[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('type', type)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                          selectedType === type
                            ? cn(config.borderColor, "bg-white", config.color.replace('bg-', 'text-'))
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        <span className="text-2xl">{config.icon}</span>
                        <span className="text-xs font-medium">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <Label className="text-sm font-medium text-gray-700">频率</Label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setValue('frequency', 'daily')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                      selectedFrequency === 'daily'
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    每天
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('frequency', 'weekly')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                      selectedFrequency === 'weekly'
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    每周
                  </button>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={selectedFrequency === 'daily' ? 7 : 7}
                  className="mt-2 rounded-xl"
                  placeholder="次数"
                  {...register('frequencyValue', { valueAsNumber: true })}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white mt-2"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTask ? '保存修改' : '添加任务'}
              </Button>

              {editingTask && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => {
                    setEditingTask(null);
                    reset();
                  }}
                >
                  取消编辑
                </Button>
              )}
            </form>
          </div>
        </div>
      </FadeIn>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除任务？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除「{taskToDelete?.name}」吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
