import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DashboardSkeleton } from '../components/Skeleton';
import { Users, Package, ShoppingCart, Star, TrendingUp, AlertTriangle, CheckCircle, Clock, GripVertical } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { CUSTOMER_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../constants/roles';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { dashboardApi, type DashboardStats } from '../../api';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 드래그 가능한 위젯 컴포넌트
interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  isFullWidth?: boolean;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, isFullWidth = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isFullWidth ? 'col-span-1 md:col-span-2 lg:col-span-2' : 'col-span-1'}`}
    >
      <div className="absolute top-2 right-2 z-10 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          <GripVertical size={16} className="text-gray-600 dark:text-gray-400" />
        </div>
      </div>
      {children}
    </div>
  );
};

// 위젯 타입 정의
type WidgetType =
  | 'totalRevenue'
  | 'preparingOrders'
  | 'shippingOrders'
  | 'completedOrders'
  | 'lowStockAlert'
  | 'outOfStockAlert'
  | 'recentOrders'
  | 'reviewChart'
  | 'userStatusChart'
  | 'productCategoryChart';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 위젯 순서 상태 (localStorage에서 불러오기)
  const [widgetOrder, setWidgetOrder] = useState<WidgetType[]>(() => {
    const saved = localStorage.getItem('dashboardWidgetOrder_v4');
    return saved
      ? JSON.parse(saved)
      : [
          'totalRevenue',
          'preparingOrders',
          'shippingOrders',
          'completedOrders',
          'lowStockAlert',
          'outOfStockAlert',
          'userStatusChart',
          'productCategoryChart',
          'recentOrders',
          'reviewChart',
        ];
  });

  // 드래그앤드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 대시보드 통계 데이터 로드
  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      try {
        const stats = await dashboardApi.getStats();
        setDashboardStats(stats);
      } catch (error) {
        toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  // 위젯 순서가 변경될 때 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('dashboardWidgetOrder_v4', JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as WidgetType);
        const newIndex = items.indexOf(over.id as WidgetType);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 상단 통계 카드 데이터
  const stats = [
    {
      icon: Users,
      label: '전체 관리자',
      value: dashboardStats?.summary.totalUsers.toString() || '0',
      subValue: `활성: ${dashboardStats?.summary.activeUsers || 0}`,
      color: 'text-blue-500',
      path: '/users'
    },
    {
      icon: Users,
      label: '전체 고객',
      value: dashboardStats?.summary.totalCustomers.toString() || '0',
      subValue: `활성: ${dashboardStats?.summary.activeCustomers || 0}`,
      color: 'text-indigo-500',
      path: '/customers'
    },
    {
      icon: Package,
      label: '전체 상품',
      value: dashboardStats?.summary.totalProducts.toString() || '0',
      subValue: `재고 부족: ${dashboardStats?.summary.lowStockProducts || 0}`,
      color: 'text-green-500',
      path: '/products'
    },
    {
      icon: ShoppingCart,
      label: '전체 주문',
      value: dashboardStats?.summary.totalOrders.toString() || '0',
      subValue: `오늘: ${dashboardStats?.summary.todayOrders || 0}`,
      color: 'text-purple-500',
      path: '/orders'
    },
    {
      icon: Star,
      label: '전체 리뷰',
      value: dashboardStats?.summary.totalReviews.toString() || '0',
      subValue: `평균: ${dashboardStats?.summary.averageRating || '0.0'}점`,
      color: 'text-orange-500',
      path: '/reviews'
    },
  ];

  // 위젯 렌더링 함수
  const renderWidget = (widgetId: WidgetType) => {
    switch (widgetId) {
      case 'totalRevenue':
        return (
          <SortableWidget key="totalRevenue" id="totalRevenue">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">총 매출</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{((dashboardStats?.widgets.totalRevenue || 0) / 10000).toFixed(0)}만원</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">오늘: {((dashboardStats?.widgets.todayRevenue || 0) / 10000).toFixed(0)}만원</p>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'preparingOrders':
        return (
          <SortableWidget key="preparingOrders" id="preparingOrders">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">준비중</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">{dashboardStats?.widgets.preparingOrders || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">주문</p>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'shippingOrders':
        return (
          <SortableWidget key="shippingOrders" id="shippingOrders">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">배송중</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{dashboardStats?.widgets.shippingOrders || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">주문</p>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'completedOrders':
        return (
          <SortableWidget key="completedOrders" id="completedOrders">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">배송완료</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{dashboardStats?.widgets.completedOrders || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">주문</p>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'lowStockAlert':
        return (
          <SortableWidget key="lowStockAlert" id="lowStockAlert">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">재고 부족</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">{dashboardStats?.widgets.lowStockProducts || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">재고 5개 이하</p>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'outOfStockAlert':
        return (
          <SortableWidget key="outOfStockAlert" id="outOfStockAlert">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">품절 상품</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{dashboardStats?.widgets.outOfStockProducts || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">상품</p>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'recentOrders':
        return (
          <SortableWidget key="recentOrders" id="recentOrders" isFullWidth={false}>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-200">최근 주문</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                      <TableRow>
                        <TableHead>주문번호</TableHead>
                        <TableHead>고객명</TableHead>
                        <TableHead>상품명</TableHead>
                        <TableHead>금액</TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dashboardStats?.recentOrders || []).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.product}</TableCell>
                          <TableCell>{order.amount}</TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === 'DELIVERED' ? 'default' : order.status === 'SHIPPING' ? 'secondary' : 'outline'
                            }>
                              {ORDER_STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'reviewChart':
        const ratingColors: Record<number, string> = {
          1: '#ef4444', // red
          2: '#f97316', // orange
          3: '#eab308', // yellow
          4: '#84cc16', // lime
          5: '#22c55e', // green
        };

        const reviewRatingData = (dashboardStats?.charts.reviewRating || []).map(item => ({
          name: `⭐ ${item.rating}점`,
          value: item.count,
          fill: ratingColors[item.rating],
        }));

        return (
          <SortableWidget key="reviewChart" id="reviewChart" isFullWidth={false}>
            <Card className="transition-all duration-300 hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-200">리뷰 평점 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reviewRatingData}>
                    <defs>
                      <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorYellow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorLime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#84cc16" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#84cc16" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? '#4b5563' : '#e5e7eb'}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#374151' }}
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#374151' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      }}
                      cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                    >
                      {reviewRatingData.map((entry, index) => {
                        const gradientMap: Record<string, string> = {
                          '#ef4444': 'url(#colorRed)',
                          '#f97316': 'url(#colorOrange)',
                          '#eab308': 'url(#colorYellow)',
                          '#84cc16': 'url(#colorLime)',
                          '#22c55e': 'url(#colorGreen)',
                        };
                        return <Cell key={`cell-${index}`} fill={gradientMap[entry.fill || '#8884d8'] || entry.fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'userStatusChart':
        const statusColors: Record<string, string> = {
          'ACTIVE': 'url(#colorActive)',
          'INACTIVE': 'url(#colorInactive)',
          'SUSPENDED': 'url(#colorSuspended)',
        };

        const userStatusData = (dashboardStats?.charts.customerStatus || []).map(item => ({
          name: CUSTOMER_STATUS_LABELS[item.status] || item.status,
          value: item.count,
          fill: statusColors[item.status] || 'url(#colorInactive)',
        }));

        return (
          <SortableWidget key="userStatusChart" id="userStatusChart" isFullWidth={false}>
            <Card className="transition-all duration-300 hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-200">고객 상태별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userStatusData}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorInactive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6b7280" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#6b7280" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorSuspended" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? '#4b5563' : '#e5e7eb'}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#374151' }}
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#374151' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      }}
                      cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                      formatter={(value) => `${value}명`}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                    >
                      {userStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      case 'productCategoryChart':
        const productCategoryData = (dashboardStats?.charts.productCategory || []).map(item => ({
          name: item.category,
          value: item.count,
        }));

        return (
          <SortableWidget key="productCategoryChart" id="productCategoryChart" isFullWidth={false}>
            <Card className="transition-all duration-300 hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-200">상품 카테고리별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productCategoryData}>
                    <defs>
                      <linearGradient id="colorCategory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? '#4b5563' : '#e5e7eb'}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#374151' }}
                      angle={-20}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#374151' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      }}
                      cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                      formatter={(value) => `${value}개`}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#colorCategory)"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </SortableWidget>
        );

      default:
        return null;
    }
  };

  return (
    <Layout pageTitle="대시보드">
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Main Stats Cards - 고정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                onClick={() => navigate(stat.path)}
                className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border-l-4 dark:bg-gray-800 dark:border-gray-700"
                style={{
                  borderLeftColor:
                    stat.color.includes('blue') ? '#3b82f6' :
                    stat.color.includes('indigo') ? '#6366f1' :
                    stat.color.includes('green') ? '#22c55e' :
                    stat.color.includes('purple') ? '#a855f7' :
                    '#f97316'
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</CardTitle>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">{stat.value}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.subValue}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 작은 위젯들 (드래그 가능) */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={widgetOrder.filter((id) =>
              ['totalRevenue', 'preparingOrders', 'shippingOrders', 'completedOrders', 'lowStockAlert', 'outOfStockAlert'].includes(id)
            )}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {widgetOrder
                .filter((id) => ['totalRevenue', 'preparingOrders', 'shippingOrders', 'completedOrders', 'lowStockAlert', 'outOfStockAlert'].includes(id))
                .map((widgetId) => renderWidget(widgetId))}
            </div>
          </SortableContext>
        </DndContext>

        {/* 큰 위젯들 (드래그 가능) */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={widgetOrder.filter((id) =>
              ['userStatusChart', 'productCategoryChart', 'recentOrders', 'reviewChart'].includes(id)
            )}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {widgetOrder
                .filter((id) => ['userStatusChart', 'productCategoryChart', 'recentOrders', 'reviewChart'].includes(id))
                .map((widgetId) => renderWidget(widgetId))}
            </div>
          </SortableContext>
        </DndContext>
        </div>
      )}
    </Layout>
  );
};
