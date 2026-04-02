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
  BookOpen,
  Calculator,
  Dumbbell,
  GraduationCap,
  Languages,
  School,
  X,
  Clock,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
type TaskCategory = '校内巩固' | '校内拔高' | '课外课程' | '英语阅读' | '体育运动' | '中文阅读';
type TaskType = '固定' | '灵活' | '跟随学校';
type UnitType = '本' | '次' | '章' | '课时';
type SubjectTag = 'chinese' | 'math' | 'english' | 'sports';
type FormatTag = 'paper' | 'tablet' | 'app' | 'reading' | 'recite' | 'exercise';
type ParticipationTag = 'independent' | 'accompany' | 'interactive' | 'parent';
type DifficultyTag = 'basic' | 'advanced' | 'challenge';

interface TaskTags {
  subject?: SubjectTag;
  format?: FormatTag[];
  participation?: ParticipationTag;
  difficulty?: DifficultyTag;
}

interface Child {
  id: number;
  name: string;
  avatar: string;
}

interface Task {
  id: number;
  name: string;
  category: TaskCategory;
  type: TaskType;
  quantity: number;
  unit: UnitType;
  timePerUnit: number;
  frequency: 'daily' | 'weekly';
  frequencyValue: number;
  description?: string;
  tags?: TaskTags;
  appliesTo?: number[]; // Empty array means all children
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
  description: z.string().max(200, '描述不能超过200字符').optional(),
  tags: z.object({
    subject: z.enum(['chinese', 'math', 'english', 'sports']).optional(),
    format: z.array(z.enum(['paper', 'tablet', 'app', 'reading', 'recite', 'exercise'])).optional(),
    participation: z.enum(['independent', 'accompany', 'interactive', 'parent']).optional(),
    difficulty: z.enum(['basic', 'advanced', 'challenge']).optional(),
  }).optional(),
  appliesTo: z.array(z.number()).optional(), // Empty array means all children
});

type TaskFormData = z.infer<typeof taskSchema>;

// Category config with modern colors
const categoryConfig: Record<TaskCategory, { icon: any; gradient: string; lightColor: string }> = {
  '校内巩固': { icon: BookOpen, gradient: 'from-rose-400 to-orange-400', lightColor: 'bg-rose-50 text-rose-600' },
  '校内拔高': { icon: Calculator, gradient: 'from-blue-400 to-cyan-400', lightColor: 'bg-blue-50 text-blue-600' },
  '课外课程': { icon: GraduationCap, gradient: 'from-emerald-400 to-teal-400', lightColor: 'bg-emerald-50 text-emerald-600' },
  '英语阅读': { icon: Languages, gradient: 'from-violet-400 to-purple-400', lightColor: 'bg-violet-50 text-violet-600' },
  '体育运动': { icon: Dumbbell, gradient: 'from-amber-400 to-yellow-400', lightColor: 'bg-amber-50 text-amber-600' },
  '中文阅读': { icon: School, gradient: 'from-pink-400 to-rose-400', lightColor: 'bg-pink-50 text-pink-600' }
};

const typeConfig: Record<TaskType, { label: string; desc: string; gradient: string }> = {
  '固定': { label: '固定任务', desc: '每日必做', gradient: 'from-orange-400 to-amber-400' },
  '灵活': { label: '灵活任务', desc: '自由安排', gradient: 'from-blue-400 to-cyan-400' },
  '跟随学校': { label: '跟随学校', desc: '同步学校', gradient: 'from-emerald-400 to-teal-400' }
};

const categories: TaskCategory[] = ['校内巩固', '校内拔高', '课外课程', '英语阅读', '体育运动', '中文阅读'];
const units: UnitType[] = ['本', '次', '章', '课时'];

// Tag configurations
const subjectConfig: Record<SubjectTag, { label: string; color: string; bgColor: string }> = {
  chinese: { label: '语文', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  math: { label: '数学', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  english: { label: '英语', color: 'text-green-600', bgColor: 'bg-green-100' },
  sports: { label: '体育', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const formatConfig: Record<FormatTag, { label: string; icon: string }> = {
  paper: { label: '纸质作业', icon: '📝' },
  tablet: { label: '平板/在线', icon: '📱' },
  app: { label: 'App打卡', icon: '💾' },
  reading: { label: '阅读活动', icon: '📚' },
  recite: { label: '口头诵读', icon: '🗣️' },
  exercise: { label: '运动锻炼', icon: '🏃' },
};

const participationConfig: Record<ParticipationTag, { label: string; desc: string }> = {
  independent: { label: '独立完成', desc: '孩子自己完成' },
  accompany: { label: '家长陪同', desc: '家长在身边协助' },
  interactive: { label: '亲子互动', desc: '家长和孩子共同参与' },
  parent: { label: '家长主导', desc: '主要由家长完成' },
};

const difficultyConfig: Record<DifficultyTag, { label: string; color: string; bgColor: string }> = {
  basic: { label: '基础', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  advanced: { label: '提高', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  challenge: { label: '挑战', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

// API functions
async function fetchChildren(): Promise<Child[]> {
  const { data } = await apiClient.get('/auth/children');
  return data.data || [];
}

async function fetchTasks(childId?: number): Promise<Task[]> {
  const params = childId ? `?childId=${childId}` : '';
  const { data } = await apiClient.get(`/tasks${params}`);
  return data.data || [];
}

async function createTask(task: TaskFormData): Promise<Task> {
  const { data } = await apiClient.post('/tasks', task);
  return data.data;
}

async function updateTask(id: number, task: TaskFormData): Promise<Task> {
  const { data } = await apiClient.put(`/tasks/${id}`, task);
  return data.data;
}

async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

export default function TasksPage() {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedChildFilter, setSelectedChildFilter] = useState<number | 'all'>('all');

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
      description: '',
      tags: {},
      appliesTo: []
    }
  });

  const selectedType = watch('type');
  const selectedCategory = watch('category');
  const selectedUnit = watch('unit');
  const selectedFrequency = watch('frequency');

  // Fetch children for filter and appliesTo selection
  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: fetchChildren,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', selectedChildFilter],
    queryFn: () => fetchTasks(selectedChildFilter === 'all' ? undefined : selectedChildFilter),
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务创建成功');
      reset();
      setShowAddForm(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskFormData }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务更新成功');
      setEditingTask(null);
      setShowAddForm(false);
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
      description: task.description || '',
      tags: task.tags || {},
      appliesTo: task.appliesTo || []
    });
    setShowAddForm(true);
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

  const handleCancel = () => {
    setEditingTask(null);
    setShowAddForm(false);
    reset();
  };

  const fixedTasks = tasks.filter((t: Task) => t.type === '固定');
  const flexibleTasks = tasks.filter((t: Task) => t.type === '灵活' || t.type === '跟随学校');

  const TaskCard = ({ task }: { task: Task }) => {
    const config = categoryConfig[task.category];
    const Icon = config.icon;
    const freqText = task.frequency === 'daily'
      ? `每天 ${task.frequencyValue} 次`
      : `每周 ${task.frequencyValue} 次`;
    const tags = task.tags || {};

    // Get applicable children names
    const getApplicableChildren = () => {
      if (!task.appliesTo || task.appliesTo.length === 0) {
        return '所有孩子';
      }
      const names = task.appliesTo.map(id => {
        const child = children.find(c => c.id === id);
        return child?.name || '';
      }).filter(Boolean);
      return names.join('、') || '指定孩子';
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br", config.gradient)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-gray-900 truncate">{task.name}</h4>
                {/* Applies To Badge */}
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {getApplicableChildren()}
                </span>
                {/* Subject Tag */}
                {tags.subject && (
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", subjectConfig[tags.subject].bgColor, subjectConfig[tags.subject].color)}>
                    {subjectConfig[tags.subject].label}
                  </span>
                )}
                {/* Difficulty Tag */}
                {tags.difficulty && (
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", difficultyConfig[tags.difficulty].bgColor, difficultyConfig[tags.difficulty].color)}>
                    {difficultyConfig[tags.difficulty].label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.timePerUnit}分钟/{task.unit}
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{freqText}</span>
                {/* Format Tags */}
                {tags.format && tags.format.map(f => (
                  <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {formatConfig[f].icon} {formatConfig[f].label}
                  </span>
                ))}
                {/* Participation Tag */}
                {tags.participation && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    {participationConfig[tags.participation].label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(task)}
              className="w-8 h-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(task)}
              className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  const TaskColumn = ({ title, tasks, type }: { title: string; tasks: Task[]; type: 'fixed' | 'flexible' }) => {
    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              type === 'fixed' ? 'bg-gradient-to-br from-orange-400 to-amber-400' : 'bg-gradient-to-br from-blue-400 to-cyan-400'
            )}>
              {type === 'fixed' ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Calendar className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{tasks.length} 个任务</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(grouped).map(([category, categoryTasks]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full", categoryConfig[category as TaskCategory].lightColor)}>
                  {category}
                </span>
                <span className="text-xs text-gray-400">{categoryTasks.length}</span>
              </div>
              <div className="space-y-2">
                {categoryTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">暂无任务</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务配置</h1>
          <p className="text-gray-500 mt-1">管理学习任务的模板和分类</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl px-6 h-11 shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-5 h-5 mr-2" />
          新建任务
        </Button>
      </div>

      {/* Child Filter Tabs */}
      {children.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">查看:</span>
          <button
            onClick={() => setSelectedChildFilter('all')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              selectedChildFilter === 'all'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            全部任务
          </button>
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildFilter(child.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap",
                selectedChildFilter === child.id
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              <span>{child.avatar}</span>
              <span>{child.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100 shadow-sm">
          <TaskColumn title="固定任务" tasks={fixedTasks} type="fixed" />
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100 shadow-sm">
          <TaskColumn title="灵活任务" tasks={flexibleTasks} type="flexible" />
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[480px] lg:max-h-[85vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTask ? '编辑任务' : '新建任务'}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-6">
                <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Task Name */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">任务名称</Label>
                    <Input
                      placeholder="如：英语听力"
                      className="mt-2 rounded-xl h-12 bg-gray-50 border-0 focus:ring-2 focus:ring-purple-500/20"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Applies To - Child Selection */}
                  {children.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">适用孩子</Label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={watch('appliesTo')?.length === 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setValue('appliesTo', [], { shouldDirty: true });
                              }
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">所有孩子（通用任务）</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {children.map(child => {
                            const appliesTo = watch('appliesTo') || [];
                            const isSelected = appliesTo.includes(child.id);
                            return (
                              <label
                                key={child.id}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const current = watch('appliesTo') || [];
                                    if (e.target.checked) {
                                      setValue('appliesTo', [...current, child.id], { shouldDirty: true });
                                    } else {
                                      setValue('appliesTo', current.filter(id => id !== child.id), { shouldDirty: true });
                                    }
                                  }}
                                  className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                                />
                                <span className="text-lg">{child.avatar}</span>
                                <span className="text-sm text-gray-700">{child.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">任务分类</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {categories.map(cat => {
                        const config = categoryConfig[cat];
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setValue('category', cat)}
                            className={cn(
                              "px-3 py-3 rounded-xl text-xs font-medium transition-all border",
                              selectedCategory === cat
                                ? cn("border-transparent text-white bg-gradient-to-r", config.gradient)
                                : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                            )}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Task Type */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">任务类型</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
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
                                ? cn("border-transparent text-white bg-gradient-to-r", config.gradient)
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            )}
                          >
                            <span className="text-sm font-semibold">{config.label}</span>
                            <span className={cn("text-xs", selectedType === type ? "text-white/80" : "text-gray-400")}>
                              {config.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity & Unit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">数量</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        className="mt-2 rounded-xl h-12 bg-gray-50 border-0"
                        {...register('quantity', { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">单位</Label>
                      <div className="grid grid-cols-4 gap-1 mt-2">
                        {units.map(unit => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => setValue('unit', unit)}
                            className={cn(
                              "py-2.5 rounded-lg text-sm font-medium transition-all",
                              selectedUnit === unit
                                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
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
                      className="mt-2 rounded-xl h-12 bg-gray-50 border-0"
                      {...register('timePerUnit', { valueAsNumber: true })}
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">执行频率</Label>
                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setValue('frequency', 'daily')}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-sm font-medium transition-all border-2",
                          selectedFrequency === 'daily'
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        每天
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue('frequency', 'weekly')}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-sm font-medium transition-all border-2",
                          selectedFrequency === 'weekly'
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        每周
                      </button>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={selectedFrequency === 'daily' ? 7 : 7}
                      className="mt-3 rounded-xl h-12 bg-gray-50 border-0"
                      placeholder={`${selectedFrequency === 'daily' ? '每天' : '每周'}执行次数`}
                      {...register('frequencyValue', { valueAsNumber: true })}
                    />
                  </div>

                  {/* Tags Section */}
                  <div className="border-t border-gray-100 pt-5 mt-5">
                    <p className="text-sm font-medium text-gray-700 mb-4">任务标签（可选）</p>

                    {/* Subject Tag */}
                    <div className="mb-4">
                      <Label className="text-xs text-gray-500 mb-2 block">学科</Label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(subjectConfig) as SubjectTag[]).map(subject => (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => setValue('tags.subject', subject, { shouldDirty: true })}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                              watch('tags.subject') === subject
                                ? cn(subjectConfig[subject].bgColor, subjectConfig[subject].color, "border-transparent")
                                : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                            )}
                          >
                            {subjectConfig[subject].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Format Tags */}
                    <div className="mb-4">
                      <Label className="text-xs text-gray-500 mb-2 block">执行形式（可多选）</Label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(formatConfig) as FormatTag[]).map(format => {
                          const currentFormats = watch('tags.format') || [];
                          const isSelected = currentFormats.includes(format);
                          return (
                            <button
                              key={format}
                              type="button"
                              onClick={() => {
                                const newFormats = isSelected
                                  ? currentFormats.filter(f => f !== format)
                                  : [...currentFormats, format];
                                setValue('tags.format', newFormats, { shouldDirty: true });
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                isSelected
                                  ? "bg-gray-800 text-white border-transparent"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                              )}
                            >
                              {formatConfig[format].icon} {formatConfig[format].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Participation Tag */}
                    <div className="mb-4">
                      <Label className="text-xs text-gray-500 mb-2 block">参与方式</Label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(participationConfig) as ParticipationTag[]).map(participation => (
                          <button
                            key={participation}
                            type="button"
                            onClick={() => setValue('tags.participation', participation, { shouldDirty: true })}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                              watch('tags.participation') === participation
                                ? "bg-indigo-100 text-indigo-700 border-transparent"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                            )}
                          >
                            {participationConfig[participation].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty Tag */}
                    <div>
                      <Label className="text-xs text-gray-500 mb-2 block">难度</Label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(difficultyConfig) as DifficultyTag[]).map(difficulty => (
                          <button
                            key={difficulty}
                            type="button"
                            onClick={() => setValue('tags.difficulty', difficulty, { shouldDirty: true })}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                              watch('tags.difficulty') === difficulty
                                ? cn(difficultyConfig[difficulty].bgColor, difficultyConfig[difficulty].color, "border-transparent")
                                : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                            )}
                          >
                            {difficultyConfig[difficulty].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 space-y-3">
                <Button
                  type="submit"
                  form="task-form"
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingTask ? '保存修改' : '创建任务'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                  onClick={handleCancel}
                >
                  取消
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">确认删除任务？</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              删除后无法恢复，确定要删除「{taskToDelete?.name}」吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl h-11 px-6">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 rounded-xl h-11 px-6"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
