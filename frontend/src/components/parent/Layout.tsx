import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  BookOpen,
  Trophy,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/parent', label: '概览', icon: LayoutDashboard, emoji: '📊' },
  { path: '/parent/tasks', label: '任务配置', icon: ListTodo, emoji: '📋' },
  { path: '/parent/plans', label: '计划管理', icon: CalendarDays, emoji: '📅' },
  { path: '/parent/library', label: '图书管理', icon: BookOpen, emoji: '📚' },
  { path: '/parent/achievements', label: '成就配置', icon: Trophy, emoji: '🏆' },
  { path: '/parent/children', label: '孩子管理', icon: Users, emoji: '👤' },
  { path: '/parent/settings', label: '设置', icon: Settings, emoji: '⚙️' },
];

const sidebarVariants = {
  closed: { x: '-100%', opacity: 0 },
  open: { x: 0, opacity: 1 }
};

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 }
};

export default function ParentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground"
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="font-semibold text-foreground">学习计划</h1>
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {user?.name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={closeSidebar}
            />
            <motion.aside
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-card shadow-xl"
            >
              <MobileSidebar
                user={user}
                onClose={closeSidebar}
                onLogout={handleLogout}
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-card lg:border-r lg:border-border">
        <DesktopSidebar
          user={user}
          onLogout={handleLogout}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="container max-w-6xl mx-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/parent'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all min-w-[60px]',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <motion.span
                    className="text-lg mb-0.5"
                    animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {item.emoji}
                  </motion.span>
                  <span className="text-[10px] font-medium leading-tight text-center">
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-0.5 w-6 h-0.5 bg-primary rounded-full"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all min-w-[60px] text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <span className="text-lg mb-0.5">☰</span>
            <span className="text-[10px] font-medium leading-tight">更多</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

interface SidebarProps {
  user: { name?: string; avatar?: string; email?: string; familyName?: string } | null;
  onClose?: () => void;
  onLogout: () => void;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
}

function DesktopSidebar({ user, onLogout, userMenuOpen, setUserMenuOpen }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="size-10 rounded-xl bg-gradient-to-br from-[#FFB5BA] to-[#7DD3FC] flex items-center justify-center">
          <span className="text-white text-lg">📚</span>
        </div>
        <div>
          <h1 className="font-bold text-foreground">学习计划</h1>
          <p className="text-xs text-muted-foreground">{user?.familyName || '我的家庭'}</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/parent'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-border p-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar className="size-9">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user?.name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || '家长'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
              >
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-4" />
                  <span>退出登录</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MobileSidebar({ user, onClose, onLogout, userMenuOpen, setUserMenuOpen }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[#FFB5BA] to-[#7DD3FC] flex items-center justify-center">
            <span className="text-white text-lg">📚</span>
          </div>
          <div>
            <h1 className="font-bold text-foreground">学习计划</h1>
            <p className="text-xs text-muted-foreground">{user?.familyName || '我的家庭'}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/parent'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-border p-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar className="size-9">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user?.name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || '家长'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-4" />
                  <span>退出登录</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
