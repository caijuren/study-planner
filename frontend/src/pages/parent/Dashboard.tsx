import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  CalendarPlus,
  Clock,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Users,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { FadeIn, Stagger, fadeUp } from '@/components/MotionPrimitives';

// Types
interface Child {
  id: string;
  name: string;
  avatar?: string;
  weeklyProgress: number;
  todayMinutes: number;
  completedTasks: number;
  totalTasks: number;
}

interface Activity {
  id: string;
  childName: string;
  childAvatar?: string;
  action: string;
  task?: string;
  book?: string;
  time: string;
  type: 'task_complete' | 'book_read' | 'achievement' | 'plan_published';
}

interface DashboardStats {
  totalTasks: number;
  weeklyCompletionRate: number;
  todayStudyMinutes: number;
  booksRead: number;
}

// Mock data for development
const mockStats: DashboardStats = {
  totalTasks: 24,
  weeklyCompletionRate: 87,
  todayStudyMinutes: 156,
  booksRead: 8
};

const mockChildren: Child[] = [
  {
    id: '1',
    name: '小明',
    avatar: undefined,
    weeklyProgress: 92,
    todayMinutes: 45,
    completedTasks: 5,
    totalTasks: 6
  },
  {
    id: '2',
    name: '小红',
    avatar: undefined,
    weeklyProgress: 78,
    todayMinutes: 32,
    completedTasks: 4,
    totalTasks: 5
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    childName: '小明',
    action: '完成任务',
    task: '数学作业',
    time: '10分钟前',
    type: 'task_complete'
  },
  {
    id: '2',
    childName: '小红',
    action: '阅读图书',
    book: '小王子',
    time: '25分钟前',
    type: 'book_read'
  },
  {
    id: '3',
    childName: '小明',
    action: '获得成就',
    task: '连续学习7天',
    time: '1小时前',
    type: 'achievement'
  },
  {
    id: '4',
    childName: '系统',
    action: '发布下周计划',
    time: '2小时前',
    type: 'plan_published'
  }
];

// API functions
async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get('/dashboard/stats');
  return data;
}

async function fetchChildren(): Promise<Child[]> {
  const { data } = await apiClient.get('/auth/children');
  return data;
}

async function fetchActivities(): Promise<Activity[]> {
  const { data } = await apiClient.get('/dashboard/activities');
  return data;
}

export default function ParentDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    initialData: mockStats,
    staleTime: 5 * 60 * 1000
  });

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['children'],
    queryFn: fetchChildren,
    initialData: mockChildren,
    staleTime: 5 * 60 * 1000
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    initialData: mockActivities,
    staleTime: 60 * 1000
  });

  const statCards = [
    {
      title: '总任务数',
      value: stats?.totalTasks || 0,
      icon: CheckCircle2,
      color: 'from-[#FFB5BA] to-[#FFB5BA]/60',
      bgColor: 'bg-[#FFB5BA]/10',
      textColor: 'text-[#FFB5BA]'
    },
    {
      title: '本周完成率',
      value: `${stats?.weeklyCompletionRate || 0}%`,
      icon: TrendingUp,
      color: 'from-[#7DD3FC] to-[#7DD3FC]/60',
      bgColor: 'bg-[#7DD3FC]/10',
      textColor: 'text-[#7DD3FC]'
    },
    {
      title: '今日学习时长',
      value: `${stats?.todayStudyMinutes || 0}分钟`,
      icon: Clock,
      color: 'from-[#7EDACA] to-[#7EDACA]/60',
      bgColor: 'bg-[#7EDACA]/10',
      textColor: 'text-[#7EDACA]'
    },
    {
      title: '阅读书籍',
      value: stats?.booksRead || 0,
      icon: BookOpen,
      color: 'from-[#C4B5FD] to-[#C4B5FD]/60',
      bgColor: 'bg-[#C4B5FD]/10',
      textColor: 'text-[#C4B5FD]'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">概览</h1>
          <p className="text-muted-foreground text-sm mt-1">查看孩子们的学习进度和活动</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/parent/tasks">
              <Plus className="size-4" />
              <span>添加任务</span>
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-gradient-to-r from-[#FFB5BA] to-[#7DD3FC] hover:opacity-90">
            <Link to="/parent/plans">
              <CalendarPlus className="size-4" />
              <span>发布下周计划</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Stagger stagger={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <FadeIn key={stat.title} variants={fadeUp}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className={`size-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                  <stat.icon className={`size-5 ${stat.textColor}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-6 translate-x-6`} />
            </Card>
          </FadeIn>
        ))}
      </Stagger>

      {/* Children Overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="size-5 text-primary" />
              孩子概览
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link to="/parent/children">
                查看全部
                <ChevronRight className="size-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {childrenLoading ? (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              children?.map((child) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={child.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary font-medium">
                      {child.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{child.name}</span>
                      <span className="text-sm text-muted-foreground">
                        今日 {child.todayMinutes}分钟
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={child.weeklyProgress} className="flex-1 h-1.5" />
                      <span className="text-xs text-muted-foreground w-8">
                        {child.weeklyProgress}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {child.completedTasks}/{child.totalTasks} 任务
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {activities?.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >                    <Avatar className="size-8">
                      <AvatarImage src={activity.childAvatar} />
                      <AvatarFallback className={cn(
                        'text-xs font-medium',
                        activity.type === 'achievement' ? 'bg-warning/20 text-warning' :
                        activity.type === 'plan_published' ? 'bg-info/20 text-info' :
                        'bg-primary/20 text-primary'
                      )}>
                        {activity.type === 'achievement' ? '🏆' :
                         activity.type === 'plan_published' ? '📅' :
                         activity.childName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.childName}</span>
                        {' '}{activity.action}
                        {activity.task && <span className="text-primary"> {activity.task}</span>}
                        {activity.book && <span className="text-primary"> 《{activity.book}》</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
