import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-bounce">🐛</span>
            <span className="font-bold text-xl text-primary">小书虫</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              登录
            </Button>
            <Button onClick={() => navigate('/register')}>
              注册家庭
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Stagger className="flex flex-col items-center">
          <FadeIn>
            <span className="text-8xl mb-6 block">🐛</span>
          </FadeIn>
          <FadeIn>
            <h1
              className="font-bold text-primary mb-4"
              style={{ fontSize: 'var(--font-size-display)' }}
            >
              小书虫
            </h1>
          </FadeIn>
          <FadeIn>
            <p className="text-xl text-muted-foreground mb-2">
              快乐学习每一天！
            </p>
          </FadeIn>
          <FadeIn>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              专为小学生设计的学习任务管理系统，让学习变得有趣又高效
            </p>
          </FadeIn>
          <FadeIn>
            <div className="flex gap-4">
              <Button size="lg" onClick={() => navigate('/register')}>
                开始使用
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                已有账号
              </Button>
            </div>
          </FadeIn>
        </Stagger>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-center font-bold mb-12" style={{ fontSize: 'var(--font-size-title)' }}>
          ✨ 核心功能
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <HoverLift>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-bold text-lg mb-2">智能任务分配</h3>
              <p className="text-muted-foreground text-sm">
                根据任务类型自动分配到每天，周三不排校内作业，周末专注培优拔高
              </p>
            </div>
          </HoverLift>
          <HoverLift>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-bold text-lg mb-2">每日打卡</h3>
              <p className="text-muted-foreground text-sm">
                孩子轻松完成每日任务打卡，支持补做和提前完成，音效动画激励
              </p>
            </div>
          </HoverLift>
          <HoverLift>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-lg mb-2">学习报告</h3>
              <p className="text-muted-foreground text-sm">
                自动生成每日/每周学习报告，支持钉钉推送，家长随时掌握进度
              </p>
            </div>
          </HoverLift>
          <HoverLift>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="font-bold text-lg mb-2">图书馆</h3>
              <p className="text-muted-foreground text-sm">
                记录阅读进度，培养阅读习惯，设置阅读目标
              </p>
            </div>
          </HoverLift>
          <HoverLift>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-100">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-bold text-lg mb-2">成就系统</h3>
              <p className="text-muted-foreground text-sm">
                完成任务解锁成就，收集徽章，让学习更有成就感
              </p>
            </div>
          </HoverLift>
          <HoverLift>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-cyan-100">
              <div className="text-4xl mb-4">👨‍👩‍👧</div>
              <h3 className="font-bold text-lg mb-2">多用户支持</h3>
              <p className="text-muted-foreground text-sm">
                一个家庭多个孩子，家长统一管理，每个孩子独立数据
              </p>
            </div>
          </HoverLift>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-pink-100 to-blue-100 p-6 text-center">
            <h2 className="font-bold text-lg">🎯 今日任务预览</h2>
          </div>
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full px-6 py-2">
                完成率 <span className="font-bold text-xl">67%</span>
              </div>
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              {[
                { name: '校内作业', status: 'completed', icon: '📝' },
                { name: '英语阅读', status: 'completed', icon: '🔤' },
                { name: '一课一练', status: 'partial', icon: '📖' },
                { name: 'OD课程', status: 'pending', icon: '🎬' },
                { name: '体育运动', status: 'pending', icon: '⚽' },
              ].map((task, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    task.status === 'completed'
                      ? 'bg-green-50 border border-green-200'
                      : task.status === 'partial'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{task.icon}</span>
                  <span className="flex-1 font-medium">{task.name}</span>
                  <span className="text-lg">
                    {task.status === 'completed' ? '✅' : task.status === 'partial' ? '◐' : '○'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <FadeIn>
          <h2 className="font-bold mb-4" style={{ fontSize: 'var(--font-size-title)' }}>
            准备好了吗？
          </h2>
          <p className="text-muted-foreground mb-8">
            创建您的家庭账号，开启高效学习之旅！
          </p>
          <Button size="lg" onClick={() => navigate('/register')}>
            立即开始 🚀
          </Button>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-pink-100 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>🐛 小书虫 - 让学习更有趣</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
