import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Target,
  Users,
  BookOpen,
  Activity,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';

// Color palettes
const CATEGORY_COLORS = {
  '校内巩固': '#f97316',
  '校内拔高': '#3b82f6',
  '课外课程': '#10b981',
  '英语阅读': '#8b5cf6',
  '体育运动': '#f59e0b',
  '中文阅读': '#ec4899',
};

const SUBJECT_COLORS = {
  '语文': '#f97316',
  '数学': '#3b82f6',
  '英语': '#10b981',
  '体育': '#ef4444',
};

const FORMAT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#3b82f6'];
const PARTICIPATION_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

interface StatisticsData {
  summary: {
    totalTasks: number;
    totalTarget: number;
    totalProgress: number;
    completionRate: number;
    totalTime: number;
  };
  byCategory: Array<{ name: string; value: number; percentage: number }>;
  bySubject: Array<{ name: string; value: number; percentage: number }>;
  byFormat: Array<{ name: string; value: number; percentage: number }>;
  byParticipation: Array<{ name: string; value: number; percentage: number }>;
  dailyCompletion: Array<{ day: string; completed: number; total: number; rate: number }>;
  children: Array<{ id: number; name: string; avatar: string }>;
}

interface TrendsData {
  trends: Array<{
    weekNo: string;
    completionRate: number;
    totalTasks: number;
    totalTime: number;
  }>;
}

async function fetchStatistics(childId?: number): Promise<StatisticsData> {
  const params = new URLSearchParams();
  if (childId) params.append('childId', childId.toString());
  const { data } = await apiClient.get(`/statistics/overview?${params}`);
  return data.data;
}

async function fetchTrends(childId?: number): Promise<TrendsData> {
  const params = new URLSearchParams();
  if (childId) params.append('childId', childId.toString());
  params.append('weeks', '4');
  const { data } = await apiClient.get(`/statistics/trends?${params}`);
  return data.data;
}

export default function StatisticsPage() {
  const [selectedChild, setSelectedChild] = useState<number | undefined>();

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['statistics', selectedChild],
    queryFn: () => fetchStatistics(selectedChild),
  });

  const { data: trends, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['trends', selectedChild],
    queryFn: () => fetchTrends(selectedChild),
  });

  if (isLoadingStats || isLoadingTrends) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const summary = stats?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="text-gray-500 mt-1">多维度分析学习情况</p>
        </div>
        {stats?.children && stats.children.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">选择孩子:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedChild(undefined)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedChild
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {stats.children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    selectedChild === child.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{child.avatar}</span>
                  <span>{child.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">本周任务</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary?.totalTasks || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">完成率</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary?.completionRate || 0}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">预计时长</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{Math.round((summary?.totalTime || 0) / 60)}h</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">完成进度</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary?.totalProgress || 0}/{summary?.totalTarget || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-500" />
                时间分配（按分类）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.byCategory || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(stats?.byCategory || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#8884d8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value)} 分钟`, '时长']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Time by Subject */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                学科投入分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.bySubject || []} layout="vertical">
                    <XAxis type="number" unit="分钟" />
                    <YAxis dataKey="name" type="category" width={60} />
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value)} 分钟`, '时长']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {(stats?.bySubject || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SUBJECT_COLORS[entry.name as keyof typeof SUBJECT_COLORS] || '#8884d8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Format Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                执行形式分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.byFormat || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {(stats?.byFormat || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={FORMAT_COLORS[index % FORMAT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value)} 分钟`, '时长']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Participation Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                陪伴方式统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.byParticipation || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {(stats?.byParticipation || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PARTICIPATION_COLORS[index % PARTICIPATION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value)} 分钟`, '时长']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              完成率趋势（近4周）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends?.trends || []}>
                  <XAxis dataKey="weekNo" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '完成率']}
                  />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Completion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              每日完成情况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.dailyCompletion || []}>
                  <XAxis dataKey="day" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'rate') return [`${value}%`, '完成率'];
                      return [value, name === 'completed' ? '已完成' : '总计'];
                    }}
                  />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} name="完成率" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
