import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FadeIn, HoverLift, Stagger } from '@/components/MotionPrimitives';
import { useAuth } from '@/hooks/useAuth';
import type { RegisterData } from '@/types/auth';
import { toast } from 'sonner';

const avatars = ['🦊', '🐰', '🐻', '🐼', '🦁', '🐯', '🦄', '🐸'];
const decorations = ['🌸', '⭐', '🌈', '💫', '✨', '🎈'];

export default function Register() {
  const { register, isLoading, error } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');

  const form = useForm<RegisterData & { confirmPassword: string }>({
    defaultValues: {
      familyName: '',
      familyCode: '',
      parentName: '',
      parentPassword: '',
      confirmPassword: '',
    },
  });

  const handleRegister = async (data: RegisterData & { confirmPassword: string }) => {
    if (data.parentPassword !== data.confirmPassword) {
      form.setError('confirmPassword', { message: '两次输入的密码不一致' });
      return;
    }
    if (data.familyCode.length < 4) {
      form.setError('familyCode', { message: '家庭代码至少4个字符' });
      return;
    }
    try {
      await register({
        familyName: data.familyName,
        familyCode: data.familyCode,
        parentName: data.parentName,
        parentPassword: data.parentPassword,
      });
      toast.success('注册成功！欢迎加入~');
    } catch {
      toast.error('注册失败，请重试');
    }
  };

  const generateFamilyCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue('familyCode', code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <FadeIn variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
        <div className="w-full max-w-md">
          {/* Decorative Header */}
          <motion.div
            className="text-center mb-6"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex justify-center gap-2 mb-4">
              {decorations.map((emoji, i) => (
                <motion.span
                  key={i}
                  className="text-2xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-foreground">创建家庭账号</h1>
            <p className="text-muted-foreground mt-2">开始你的学习之旅~</p>
          </motion.div>

          {/* Avatar Selection */}
          <div className="mb-6">
            <p className="text-center text-sm text-muted-foreground mb-3">选择你的头像</p>
            <Stagger stagger={0.05} className="flex justify-center flex-wrap gap-2">
              {avatars.map((avatar) => (
                <motion.button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 text-2xl rounded-full transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-primary ring-2 ring-primary ring-offset-2 scale-110'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {avatar}
                </motion.button>
              ))}
            </Stagger>
          </div>

          {/* Register Card */}
          <HoverLift>
            <Card className="border-2 border-secondary/30 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="text-center bg-gradient-to-r from-secondary/10 to-accent/10">
                <CardTitle className="text-2xl">注册新家庭</CardTitle>
                <CardDescription>填写以下信息创建账号</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="familyName"
                      rules={{ required: '请输入家庭名称' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">家庭名称</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例如：快乐之家"
                              className="rounded-xl h-11 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="familyCode"
                      rules={{ required: '请输入家庭代码' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">家庭代码</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="家庭唯一标识"
                                className="rounded-xl h-11 text-base"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl h-11 px-3 shrink-0"
                              onClick={generateFamilyCode}
                            >
                              随机
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parentName"
                      rules={{ required: '请输入家长姓名' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">家长姓名</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="家长称呼"
                              className="rounded-xl h-11 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parentPassword"
                      rules={{ required: '请输入密码', minLength: { value: 6, message: '密码至少6位' } }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">登录密码</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="设置登录密码"
                              className="rounded-xl h-11 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      rules={{ required: '请确认密码' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">确认密码</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="再次输入密码"
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
                      {isLoading ? '注册中...' : '创建家庭账号'}
                    </Button>
                  </form>
                </Form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-muted-foreground">
                    已有账号？{' '}
                    <a href="/login" className="text-primary font-semibold hover:underline">
                      立即登录
                    </a>
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
