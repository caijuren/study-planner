import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings,
  Bell,
  Trash2,
  AlertTriangle,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';
import { FadeIn, fadeUp } from '@/components/MotionPrimitives';

// Schema
const settingsSchema = z.object({
  familyName: z.string().min(1, '请输入家庭名称').max(30, '名称不能超过30个字符'),
  dingtalkWebhook: z.string().url('请输入有效的URL').optional().or(z.literal('')),
  dailyTimeLimit: z.number().min(60).max(480)
});

type SettingsFormData = z.infer<typeof settingsSchema>;

// API functions
async function updateSettings(data: SettingsFormData): Promise<void> {
  await apiClient.put('/settings', data);
}

async function testWebhook(webhook: string): Promise<void> {
  await apiClient.post('/settings/test-webhook', { webhook });
}

async function deleteFamilyData(): Promise<void> {
  await apiClient.delete('/settings/family-data');
}

export default function SettingsPage() {
  const [dailyTimeLimit, setDailyTimeLimit] = useState(210); // 3.5 hours default
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      familyName: '我的家庭',
      dingtalkWebhook: '',
      dailyTimeLimit: 210
    }
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast.success('设置已保存');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const testWebhookMutation = useMutation({
    mutationFn: testWebhook,
    onSuccess: () => {
      toast.success('测试消息发送成功');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFamilyData,
    onSuccess: () => {
      toast.success('数据已删除');
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  // Handlers
  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate({ ...data, dailyTimeLimit });
  };

  const handleTestWebhook = () => {
    const webhook = watch('dingtalkWebhook');
    if (!webhook) {
      toast.error('请先输入钉钉Webhook地址');
      return;
    }
    testWebhookMutation.mutate(webhook);
  };

  const handleDeleteData = () => {
    if (deleteConfirmText !== '删除') {
      toast.error('请输入"删除"确认');
      return;
    }
    deleteMutation.mutate();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">设置</h1>
        <p className="text-muted-foreground text-sm mt-1">管理家庭设置和通知配置</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Family Settings */}
        <FadeIn variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="size-5 text-primary" />
                家庭设置
              </CardTitle>
              <CardDescription>基本家庭信息配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">家庭名称</Label>
                <Input
                  id="familyName"
                  {...register('familyName')}
                  placeholder="例如：快乐学习之家"
                />
                {errors.familyName && (
                  <p className="text-xs text-destructive">{errors.familyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dailyTimeLimit">每日学习时长上限</Label>
                  <span className="text-sm font-medium text-foreground">
                    {formatTime(dailyTimeLimit)}
                  </span>
                </div>
                <Slider
                  value={[dailyTimeLimit]}
                  onValueChange={([value]) => {
                    setDailyTimeLimit(value);
                    setValue('dailyTimeLimit', value);
                  }}
                  min={60}
                  max={480}
                  step={15}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  建议：低年级1.5-2小时，高年级3-4小时
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Notifications */}
        <FadeIn variants={fadeUp} delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="size-5 text-[#7DD3FC]" />
                通知设置
              </CardTitle>
              <CardDescription>配置钉钉通知推送</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用通知</Label>
                  <p className="text-xs text-muted-foreground">
                    开启后将推送学习进度通知到钉钉群
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dingtalkWebhook">钉钉群机器人 Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="dingtalkWebhook"
                    {...register('dingtalkWebhook')}
                    placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                    className="flex-1"
                    disabled={!notificationsEnabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestWebhook}
                    disabled={!notificationsEnabled || testWebhookMutation.isPending}
                    className="shrink-0"
                  >
                    {testWebhookMutation.isPending ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">测试</span>
                  </Button>
                </div>
                {errors.dingtalkWebhook && (
                  <p className="text-xs text-destructive">{errors.dingtalkWebhook.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  在钉钉群设置中添加自定义机器人，获取Webhook地址
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Save Button */}
        <FadeIn variants={fadeUp} delay={0.2}>
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Spinner className="size-4 mr-2" />}
            保存设置
          </Button>
        </FadeIn>
      </form>

      {/* Danger Zone */}
      <FadeIn variants={fadeUp} delay={0.3}>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              危险区域
            </CardTitle>
            <CardDescription>以下操作不可撤销，请谨慎操作</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div>
                <h4 className="font-medium text-foreground">删除所有数据</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  永久删除所有家庭成员、任务、计划和学习记录
                </p>
              </div>
              <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="shrink-0">
                    <Trash2 className="size-4 mr-2" />
                    删除数据
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除所有数据？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将永久删除所有数据，包括：
                      <ul className="list-disc list-inside mt-2 text-sm">
                        <li>所有孩子账户和学习记录</li>
                        <li>所有任务和周计划</li>
                        <li>所有图书和阅读记录</li>
                        <li>所有成就和解锁记录</li>
                      </ul>
                      <p className="mt-2 font-medium text-destructive">此操作无法撤销！</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Label htmlFor="confirmDelete">请输入"删除"确认</Label>
                    <Input
                      id="confirmDelete"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="删除"
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                      取消
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteData}
                      className="bg-destructive text-white hover:bg-destructive/90"
                      disabled={deleteMutation.isPending || deleteConfirmText !== '删除'}
                    >
                      {deleteMutation.isPending && <Spinner className="size-4 mr-2" />}
                      确认删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* App Info */}
      <FadeIn variants={fadeUp} delay={0.4}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>学习计划助手 v1.0.0</p>
              <p className="mt-1">帮助家长科学管理孩子的学习计划</p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
