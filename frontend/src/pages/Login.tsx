import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FadeIn, HoverLift } from '@/components/MotionPrimitives';
import { useAuth } from '@/hooks/useAuth';
import type { LoginCredentials, ChildLoginCredentials } from '@/types/auth';
import { toast } from 'sonner';

const mascotEmojis = ['🐛', '🦋', '🐝', '🐞', '🦔'];

export default function Login() {
  const [activeTab, setActiveTab] = useState<'parent' | 'child'>('parent');
  const { login, childLogin, isLoading, error } = useAuth();
  const [mascot] = useState(() => mascotEmojis[Math.floor(Math.random() * mascotEmojis.length)]);

  const parentForm = useForm<LoginCredentials>({
    defaultValues: {
      familyCode: '',
      userName: '',
      password: '',
    },
  });

  const childForm = useForm<ChildLoginCredentials>({
    defaultValues: {
      familyCode: '',
      childName: '',
      pin: '',
    },
  });

  const handleParentLogin = async (data: LoginCredentials) => {
    try {
      await login(data);
      toast.success('登录成功！欢迎回来~');
    } catch {
      toast.error('登录失败，请检查输入信息');
    }
  };

  const handleChildLogin = async (data: ChildLoginCredentials) => {
    if (!/^\d{4}$/.test(data.pin)) {
      childForm.setError('pin', { message: 'PIN码必须是4位数字' });
      return;
    }
    try {
      await childLogin(data);
      toast.success('登录成功！欢迎回来~');
    } catch {
      toast.error('登录失败，请检查输入信息');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <FadeIn variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
        <div className="w-full max-w-md">
          {/* Mascot */}
          <motion.div
            className="text-center mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-7xl">{mascot}</span>
          </motion.div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">学习小助手</h1>
            <p className="text-muted-foreground mt-2">每天进步一点点~</p>
          </div>

          {/* Login Card */}
          <HoverLift>
            <Card className="border-2 border-primary/20 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="text-2xl">欢迎登录</CardTitle>
                <CardDescription>选择你的登录方式</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'parent' | 'child')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl">
                    <TabsTrigger value="parent" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      家长登录
                    </TabsTrigger>
                    <TabsTrigger value="child" className="rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                      孩子登录
                    </TabsTrigger>
                  </TabsList>

                  {/* Parent Login Form */}
                  <TabsContent value="parent">
                    <Form {...parentForm}>
                      <form onSubmit={parentForm.handleSubmit(handleParentLogin)} className="space-y-4">
                        <FormField
                          control={parentForm.control}
                          name="familyCode"
                          rules={{ required: '请输入家庭代码' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">家庭代码</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="输入家庭代码"
                                  className="rounded-xl h-11 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={parentForm.control}
                          name="userName"
                          rules={{ required: '请输入用户名' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">用户名</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="输入用户名"
                                  className="rounded-xl h-11 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={parentForm.control}
                          name="password"
                          rules={{ required: '请输入密码' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">密码</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="输入密码"
                                  className="rounded-xl h-11 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {error && (
                          <p className="text-destructive text-sm text-center">{error}</p>
                        )}
                        <Button
                          type="submit"
                          className="w-full h-11 rounded-xl text-base font-semibold"
                          disabled={isLoading}
                        >
                          {isLoading ? '登录中...' : '登录'}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Child Login Form */}
                  <TabsContent value="child">
                    <Form {...childForm}>
                      <form onSubmit={childForm.handleSubmit(handleChildLogin)} className="space-y-4">
                        <FormField
                          control={childForm.control}
                          name="familyCode"
                          rules={{ required: '请输入家庭代码' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">家庭代码</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="输入家庭代码"
                                  className="rounded-xl h-11 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={childForm.control}
                          name="childName"
                          rules={{ required: '请输入名字' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">我的名字</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="输入你的名字"
                                  className="rounded-xl h-11 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={childForm.control}
                          name="pin"
                          rules={{ required: '请输入PIN码' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">我的PIN码</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="输入4位数字PIN码"
                                  maxLength={4}
                                  className="rounded-xl h-11 text-base text-center tracking-widest"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {error && (
                          <p className="text-destructive text-sm text-center">{error}</p>
                        )}
                        <Button
                          type="submit"
                          className="w-full h-11 rounded-xl text-base font-semibold bg-secondary hover:bg-secondary/80"
                          disabled={isLoading}
                        >
                          {isLoading ? '登录中...' : '登录'}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>

                {/* Register Link */}
                <div className="mt-6 text-center">
                  <p className="text-muted-foreground">
                    还没有账号？{' '}
                    <Link to="/register" className="text-primary font-semibold hover:underline">
                      立即注册
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </HoverLift>
        </div>
      </FadeIn>
    </div>
  );
}
