import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bell,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Sparkles,
  BadgeCheck,
  TrendingUp,
  Gift,
  CheckCheck,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'share' | 'follow' | 'reward' | 'verification' | 'tip';
  message: string;
  timestamp: Date;
  read: boolean;
  actor: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // Mock notifications for demo
    setNotifications([
      {
        id: '1',
        type: 'like',
        message: 'liked your post about Herald launch',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        read: false,
        actor: { name: 'Alex Chen', verified: true },
      },
      {
        id: '2',
        type: 'follow',
        message: 'started following you',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        actor: { name: 'Sarah Kim' },
      },
      {
        id: '3',
        type: 'reward',
        message: 'You earned 25 HTTN Points for your post!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        read: true,
        actor: { name: 'Herald System' },
      },
      {
        id: '4',
        type: 'comment',
        message: 'commented on your post: "Great content!"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: true,
        actor: { name: 'Mike Johnson' },
      },
      {
        id: '5',
        type: 'tip',
        message: 'sent you a 50 HTTN tip!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        read: true,
        actor: { name: 'Emma Wilson', verified: true },
      },
      {
        id: '6',
        type: 'share',
        message: 'shared your post',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        read: true,
        actor: { name: 'David Brown' },
      },
    ]);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-green-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'reward':
        return <Sparkles className="w-5 h-5 text-primary" />;
      case 'verification':
        return <BadgeCheck className="w-5 h-5 text-primary" />;
      case 'tip':
        return <Gift className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">Stay updated on your activity</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            {filteredNotifications.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`bg-card border-border transition-colors cursor-pointer hover:bg-secondary/30 ${
                      !notification.read ? 'border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.actor.avatar} />
                            <AvatarFallback className="bg-secondary font-display">
                              {notification.actor.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground">
                            <span className="font-semibold">
                              {notification.actor.name}
                              {notification.actor.verified && (
                                <BadgeCheck className="inline-block w-4 h-4 text-primary ml-1" />
                              )}
                            </span>{' '}
                            {notification.message}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
