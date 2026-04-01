import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Send,
  Check,
  Clock,
  Calendar
} from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks, addDays, isSameDay, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
interface Child {
  id: string;
  name: string;
  avatar?: string;
}

interface TaskAllocation {
  taskId: string;
  taskName: string;
  category: string;
  timePerUnit: number;
  assignedDays: number[];
}

interface WeeklyPlan {
  id: string;
  childId: string;
  childName: string;
  weekStartDate: string;
  allocations: TaskAllocation[];
  dailyProgress: { day: number; completed: number; total: number }[];
}

// API functions
async function fetchChildren(): Promise<Child[]> {
  const { data } = await apiClient.get('/auth/children');
  return data;
}

async function fetchWeeklyPlan(weekStart: string): Promise<WeeklyPlan[]> {
  const { data } = await apiClient.get(`/plans/week/${weekStart}`);
  return data;
}

async function publishWeeklyPlan(data: { weekStart: string; childIds: string[] }): Promise<void> {
  await apiClient.post('/tasks/publish', data);
}

// Mock data
const mockChildren: Child[] = [
  { id: '1', name: '小明', avatar: undefined },
  { id: '2', name: '小红', avatar: undefined }
];

const mockWeeklyPlans: WeeklyPlan[] = [
  {
    id: '1',
    childId: '1',
    childName: '小明',
    weekStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    allocations: [
      { taskId: '1', taskName: '数学练习', category: '校内巩固', timePerUnit: 30, assignedDays: [0, 2, 4] },
      { taskId: '2', taskName: '语文阅读', category: '中文阅读', timePerUnit: 20, assignedDays: [1, 3, 5] },
      { taskId: '3', taskName: '英语听力', category: '英语阅读', timePerUnit: 15, assignedDays: [0, 1, 2, 3, 4] }
    ],
    dailyProgress: [
      { day: 0, completed: 2, total: 2 },
      { day: 1, completed: 1, total: 2 },
      { day: 2, completed: 2, total: 2 },
      { day: 3, completed: 0, total: 2 },
      { day: 4, completed: 0, total: 2 },
      { day: 5, completed: 0, total: 1 },
      { day: 6, completed: 0, total: 0 }
    ]
  },
  {
    id: '2',
    childId: '2',
    childName: '小红',
    weekStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    allocations: [
      { taskId: '4', taskName: '数学练习', category: '校内巩固', timePerUnit: 25, assignedDays: [0, 2, 4] },
      { taskId: '5', taskName: '钢琴练习', category: '课外课程', timePerUnit: 30, assignedDays: [1, 3, 5] }
    ],
    dailyProgress: [
      { day: 0, completed: 1, total: 1 },
      { day: 1, completed: 1, total: 1 },
      { day: 2, completed: 0, total: 1 },
      { day: 3, completed: 0, total: 1 },
      { day: 4, completed: 0, total: 1 },
      { day: 5, completed: 0, total: 1 },
      { day: 6, completed: 0, total: 0 }
    ]
  }
];

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function PlansPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const isCurrentWeek = isSameDay(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));
  const isNextWeek = isSameDay(currentWeekStart, startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }));

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: fetchChildren,
    initialData: mockChildren,
    staleTime: 5 * 60 * 1000
  });

  const { data: weeklyPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['weekly-plan', format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: () => fetchWeeklyPlan(format(currentWeekStart, 'yyyy-MM-dd')),
    initialData: isCurrentWeek ? mockWeeklyPlans : [],
    staleTime: 5 * 60 * 1000
  });

  const publishMutation = useMutation({
    mutationFn: publishWeeklyPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-plan'] });
      toast.success('下周计划发布成功');
      setPublishDialogOpen(false);
      setSelectedChildren([]);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const goToPreviousWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const openPublishDialog = () => {
    setSelectedChildren(children?.map(c => c.id) || []);
    setPublishDialogOpen(true);
  };

  const toggleChild = (childId: string) => {
    setSelectedChildren(prev =>
      prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]
    );
  };

  const handlePublish = () => {
    if (selectedChildren.length === 0) {
      toast.error('请至少选择一个孩子');
      return;
    }
    const nextWeekStart = format(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    publishMutation.mutate({ weekStart: nextWeekStart, childIds: selectedChildren });
  };

  const weekDates = useMemo(() => weekDays.map((_, index) => addDays(currentWeekStart, index)), [currentWeekStart]);
  const weekLabel = `${format(currentWeekStart, 'M月d日', { locale: zhCN })} - ${format(addDays(currentWeekStart, 6), 'M月d日', { locale: zhCN })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">计划管理</h1>
          <p className="text-gray-500 mt-1">查看和管理每周学习计划</p>
        </div>
        <Button onClick={openPublishDialog} className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-purple-500/25">
          <Send className="size-4" />
          <span>发布下周计划</span>
        </Button>
      </div>

      {/* Week Selector */}
      <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek} className="rounded-full h-12 w-12 hover:bg-gray-100">
              <ChevronLeft className="size-5" />
            </Button>
            <div className="text-center">
              <h2 className="font-bold text-gray-900 text-lg">{weekLabel}</h2>
              <div className="flex items-center gap-2 mt-2 justify-center">
                {isCurrentWeek && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 rounded-full px-3">
                    本周
                  </Badge>
                )}
                {isNextWeek && (
                  <Badge variant="secondary" className="rounded-full px-3">下周</Badge>
                )}
                {!isCurrentWeek && !isNextWeek && (
                  <Button variant="link" size="sm" onClick={goToCurrentWeek} className="h-auto p-0 text-purple-600">
                    回到本周
                  </Button>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextWeek} className="rounded-full h-12 w-12 hover:bg-gray-100">
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {plansLoading ? (
        <Card className="border-0 shadow-lg rounded-3xl">
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {weeklyPlans?.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 pt-6 px-6">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <Avatar className="size-10 ring-2 ring-white shadow-md">
                      <AvatarImage src={children?.find(c => c.id === plan.childId)?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold">
                        {plan.childName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-gray-900">{plan.childName}的学习计划</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-8 gap-2 min-w-[700px]">
                      {/* Header Row */}
                      <div className="p-3"></div>
                      {weekDays.map((day, i) => {
                        const date = weekDates[i];
                        const isTodayDate = isToday(date);
                        return (
                          <div
                            key={day}
                            className={cn(
                              'p-3 text-center rounded-2xl',
                              isTodayDate ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' : 'bg-gray-50'
                            )}
                          >
                            <span className="text-xs opacity-80">{day}</span>
                            <div className="text-lg font-bold mt-1">{format(date, 'd')}</div>
                          </div>
                        );
                      })}

                      {/* Task Rows */}
                      {plan.allocations.map((allocation) => (
                        <motion.div key={allocation.taskId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="contents">
                          <div className="p-3 flex items-center gap-2 bg-gray-50/50 rounded-l-2xl">
                            <span className="text-sm font-medium text-gray-900">{allocation.taskName}</span>
                            <span className="text-xs text-gray-400 shrink-0">{allocation.timePerUnit}分</span>
                          </div>
                          {weekDays.map((_, dayIndex) => {
                            const isAssigned = allocation.assignedDays.includes(dayIndex);
                            const dayProgress = plan.dailyProgress.find(d => d.day === dayIndex);
                            const isCompleted = isCurrentWeek && dayProgress && isAssigned && dayProgress.completed > 0;

                            return (
                              <div key={dayIndex} className={cn(
                                'p-3 flex items-center justify-center',
                                isToday(weekDates[dayIndex]) && 'bg-purple-50/30'
                              )}>
                                {isAssigned && (
                                  <div className={cn(
                                    'size-10 rounded-xl flex items-center justify-center transition-all',
                                    isCompleted
                                      ? 'bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-lg shadow-emerald-500/25'
                                      : 'bg-gray-100 text-gray-400'
                                  )}>
                                    {isCompleted ? <Check className="size-5" /> : <Clock className="size-5" />}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      ))}

                      {/* Daily Progress Row */}
                      <div className="p-3 text-sm font-medium text-gray-500 bg-gray-50/50 rounded-bl-2xl">完成进度</div>
                      {plan.dailyProgress.map((progress) => {
                        const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
                        return (
                          <div key={progress.day} className="p-3">
                            <div className="text-sm font-bold text-center mb-2">{progress.completed}/{progress.total}</div>
                            <Progress value={percentage} className="h-2 bg-gray-100" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {(!weeklyPlans || weeklyPlans.length === 0) && (
            <Card className="border-0 shadow-lg rounded-3xl">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="size-10 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">暂无计划</h3>
                <p className="text-gray-500 mt-1">
                  {isNextWeek ? '点击"发布下周计划"创建计划' : '该周暂无学习计划'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">发布下周计划</DialogTitle>
            <DialogDescription className="text-gray-500">
              选择要发布计划的孩子，将自动根据任务配置生成下周学习计划
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">选择孩子</h4>
              <div className="space-y-2">
                {children?.map((child) => (
                  <label
                    key={child.id}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                      selectedChildren.includes(child.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    )}
                  >
                    <Checkbox
                      checked={selectedChildren.includes(child.id)}
                      onCheckedChange={() => toggleChild(child.id)}
                    />
                    <Avatar className="size-10">
                      <AvatarImage src={child.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold">
                        {child.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-gray-900">{child.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">计划预览</h4>
              <p className="text-xs text-gray-500">
                下周计划将根据任务配置自动生成，包含所有固定和灵活任务。
                孩子可以在自己的界面中查看并完成任务。
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)} className="rounded-xl h-11">
              取消
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending || selectedChildren.length === 0}
              className="rounded-xl h-11 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              {publishMutation.isPending && <Spinner className="size-4 mr-2" />}
              发布计划
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
