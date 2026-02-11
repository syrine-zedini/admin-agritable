"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Truck,
  DollarSign,
  AlertCircle,
  UserPlus,
  Plus,
  Package,
  Calendar,
  BarChart3,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function AgritableDashboard() {
  const router = useRouter();
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // États pour les données
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentOffers, setRecentOffers] = useState<any[]>([]);
  const [paymentIssues, setPaymentIssues] = useState<any[]>([]);

  // Simulation du fetch des statistiques
  useEffect(() => {
    const fetchStats = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setDashboardStats({
        orders: {
          today: 3,
          this_week: 5,
          by_status: {
            'placed': 1,
            'preparing': 0,
            'on_the_way': 0,
            'delivered': 0
          }
        },
        delivery: {
          active_routes: 0,
          completed_today: 0
        },
        revenue: {
          today: 0.00,
          this_week: 0.00,
          this_month: 0.00
        },
        financial: {
          pending_payments: 3
        },
        products: {
          low_stock_count: 0
        },
        users: {
          new_this_week: 19,
          total: 1531,
          b2c: 1512,
          b2b: 1
        }
      });
      setIsLoadingStats(false);
    };
    fetchStats();
  }, []);

  // Simulation du fetch des commandes
  useEffect(() => {
    const fetchOrders = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setOrders([
        {
          order_number: "AGT202602050003",
          total: 13.00,
          status: "placed",
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          users: {
            company_name: "buisness test",
            user_type: "b2b"
          }
        },
        {
          order_number: "AGT202602040002",
          total: 25.50,
          status: "delivered",
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          users: {
            first_name: "Client",
            last_name: "Test",
            user_type: "b2c"
          }
        },
        {
          order_number: "AGT202602030001",
          total: 42.75,
          status: "delivered",
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          users: {
            first_name: "Autre",
            last_name: "Client",
            user_type: "b2c"
          }
        }
      ]);
      setIsLoadingOrders(false);
    };
    fetchOrders();
  }, []);

  // Simulation du fetch de l'audit trail
  useEffect(() => {
    const fetchAuditTrail = async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      setAuditEntries([
        {
          status: "placed",
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          changed_by_user: {
            first_name: "System",
            last_name: "Auto"
          }
        }
      ]);
    };
    fetchAuditTrail();
  }, []);

  // Simulation du fetch des données d'activité
  useEffect(() => {
    const fetchActivityData = async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      setRecentUsers([
        {
          first_name: "Nouveau",
          last_name: "Client",
          company_name: "Entreprise Test",
          user_type: "b2b",
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ]);
      setRecentOffers([
        {
          quantity: 50,
          product: { name_fr: "Tomates" },
          supplier: { company_name: "Fournisseur Agro" },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]);
      setPaymentIssues([
        {
          status: "pending",
          amount: 13.00,
          order: { order_number: "AGT202602050003" },
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        }
      ]);
    };
    fetchActivityData();
  }, []);

  // Build metrics from data
  const metrics = useMemo(() => {
    if (!dashboardStats) return [];

    const pending = dashboardStats.orders.by_status['placed'] || 0;
    const preparing = dashboardStats.orders.by_status['preparing'] || 0;
    const delivered = dashboardStats.orders.by_status['delivered'] || 0;

    return [
      {
        title: "Commandes du jour",
        value: dashboardStats.orders.today.toString(),
        change: `Cette semaine : ${dashboardStats.orders.this_week}`,
        trend: dashboardStats.orders.today > 0 ? "up" : undefined,
        icon: ShoppingCart,
        details: `En attente : ${pending} | En préparation : ${preparing} | Livrées : ${delivered}`,
      },
      {
        title: "Livraisons actives",
        value: dashboardStats.delivery.active_routes.toString(),
        change: `${dashboardStats.delivery.completed_today} terminées aujourd'hui`,
        icon: Truck,
        details: `0 commandes en cours de livraison`,
      },
      {
        title: "Chiffre d'affaires (Aujourd'hui)",
        value: `${dashboardStats.revenue.today.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`,
        change: `Semaine : ${dashboardStats.revenue.this_week.toLocaleString('fr-TN')} TND`,
        trend: dashboardStats.revenue.today > 0 ? "up" : undefined,
        icon: DollarSign,
        details: `Mois : ${dashboardStats.revenue.this_month.toLocaleString('fr-TN')} TND`,
      },
      {
        title: "Problèmes en attente",
        value: (dashboardStats.financial.pending_payments > 0 || dashboardStats.products.low_stock_count > 0)
          ? (Math.ceil(dashboardStats.financial.pending_payments / 100) + dashboardStats.products.low_stock_count).toString()
          : "0",
        change: "nécessite attention",
        trend: (dashboardStats.financial.pending_payments > 0 || dashboardStats.products.low_stock_count > 0) ? "neutral" : undefined,
        icon: AlertCircle,
        details: `${dashboardStats.products.low_stock_count} alertes stock bas, ${dashboardStats.financial.pending_payments} problèmes de paiement`,
      },
      {
        title: "Nouvelles inscriptions",
        value: dashboardStats.users.new_this_week.toString(),
        change: "cette semaine",
        icon: UserPlus,
        details: `Total utilisateurs : ${dashboardStats.users.total} (B2C : ${dashboardStats.users.b2c}, B2B : ${dashboardStats.users.b2b})`,
      },
    ];
  }, [dashboardStats]);

  // Format distance to now helper
  const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (options?.addSuffix) {
      if (minutes < 1) return "à l'instant";
      if (minutes < 60) return `il y a ${minutes} min`;
      if (hours < 24) return `il y a ${hours} h`;
      return `il y a ${days} j`;
    }
    
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours} h`;
    return `${days} j`;
  };

  // Map recent orders to dashboard format
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5).map((order) => {
      const customerName = order.users?.user_type === 'b2b'
        ? order.users.company_name || `${order.users.first_name || ''} ${order.users.last_name || ''}`.trim()
        : `${order.users?.first_name || ''} ${order.users?.last_name || ''}`.trim() || 'Inconnu';

      return {
        id: order.order_number,
        customer: customerName,
        status: order.status,
        amount: `${parseFloat(order.total.toString()).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`,
        time: formatDistanceToNow(new Date(order.created_at), { addSuffix: true }),
        type: order.users?.user_type === 'b2b' ? 'B2B' : undefined,
      };
    });
  }, [orders]);

  // Build live activity feed from data
  const liveActivity = useMemo(() => {
    const activities: Array<{
      message: string;
      time: string;
      type: "success" | "info" | "warning";
      timestamp: Date;
    }> = [];

    // Add order status changes
    auditEntries.slice(0, 5).forEach((entry) => {
      const userName = entry.changed_by_user
        ? `${entry.changed_by_user.first_name || ''} ${entry.changed_by_user.last_name || ''}`.trim()
        : 'System';

      activities.push({
        message: `Statut de commande changé à ${entry.status}${userName !== 'System' ? ` par ${userName}` : ''}`,
        time: formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }),
        type: entry.status === 'delivered' ? 'success' : entry.status === 'cancelled' ? 'warning' : 'info',
        timestamp: new Date(entry.created_at),
      });
    });

    // Add new user signups
    recentUsers.slice(0, 3).forEach((user) => {
      const userName = user.user_type === 'b2b'
        ? user.company_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
        : `${user.first_name || ''} ${user.last_name || ''}`.trim();

      activities.push({
        message: `Nouvelle inscription ${user.user_type.toUpperCase()} : ${userName}${user.user_type === 'b2b' ? ' (en attente de validation)' : ''}`,
        time: formatDistanceToNow(new Date(user.created_at), { addSuffix: true }),
        type: 'info',
        timestamp: new Date(user.created_at),
      });
    });

    // Add supplier offers
    recentOffers.slice(0, 3).forEach((offer) => {
      const supplierName = offer.supplier?.company_name ||
        `${offer.supplier?.first_name || ''} ${offer.supplier?.last_name || ''}`.trim() ||
        'Fournisseur inconnu';

      activities.push({
        message: `Fournisseur '${supplierName}' a soumis une nouvelle offre : ${offer.quantity}kg ${offer.product?.name_fr || 'Produit'}`,
        time: formatDistanceToNow(new Date(offer.created_at), { addSuffix: true }),
        type: 'info',
        timestamp: new Date(offer.created_at),
      });
    });

    // Add payment issues
    paymentIssues.slice(0, 2).forEach((payment) => {
      activities.push({
        message: `Paiement ${payment.status} pour commande ${payment.order?.order_number || 'N/A'} (${parseFloat(payment.amount).toFixed(2)} TND)`,
        time: formatDistanceToNow(new Date(payment.created_at), { addSuffix: true }),
        type: 'warning',
        timestamp: new Date(payment.created_at),
      });
    });

    // Sort by timestamp and take top 10
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }, [auditEntries, recentUsers, recentOffers, paymentIssues]);

  const quickActions = [
    { label: "Créer une commande", icon: Plus, action: () => setIsCreateOrderOpen(true) },
    { label: "Ajouter un produit", icon: Package, action: () => setIsAddProductOpen(true) },
    { label: "Planifier les tournées", icon: Calendar, action: () => router.push("/dashboard/route-planning") },
    { label: "Voir les rapports", icon: BarChart3, action: () => router.push("/dashboard/financial-reports") },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "on_the_way":
      case "on-route":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "preparing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ready_for_pickup":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "placed":
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'placed': 'En attente',
      'preparing': 'En préparation',
      'ready_for_pickup': 'Prêt',
      'on_the_way': 'En route',
      'delivered': 'Livré',
      'cancelled': 'Annulé',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 font-sans text-slate-800">
      
    

      {/* --- TITRE --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Opérations et métriques de la plateforme en temps réel</p>
      </div>

      {/* --- GRILLE DE STATISTIQUES --- */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {isLoadingStats ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-3 w-full bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))
        ) : (
          metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-gray-500 text-sm font-medium">{metric.title}</p>
                <h3 className="text-3xl font-bold mt-2">{metric.value}</h3>
                
                {metric.trend === "up" ? (
                  <p className="text-emerald-500 text-[12px] mt-1 font-semibold flex items-center gap-1">
                    <span className="text-[10px]">↗</span> {metric.change}
                  </p>
                ) : metric.trend === "neutral" ? (
                  <p className="text-orange-400 text-[12px] mt-1 italic">{metric.change}</p>
                ) : (
                  <p className="text-gray-400 text-[12px] mt-1 font-medium">{metric.change}</p>
                )}
                
                <p className="text-gray-400 text-[11px] mt-3 leading-tight font-medium">
                  {metric.details}
                </p>
                <div className="absolute top-5 right-5 p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Icon size={20} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- ACTIONS RAPIDES --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
        <h2 className="text-lg font-bold mb-5 text-gray-800 tracking-tight">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.action}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700 shadow-sm"
              >
                <Icon size={18} className="text-gray-500"/> {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- SECTION INFÉRIEURE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Commandes récentes */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800">Commandes récentes</h2>
            <button className="text-emerald-600 text-sm font-bold hover:underline">Voir tout</button>
          </div>
          
          {isLoadingOrders ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border border-gray-100 rounded-xl bg-[#fafbfc]">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune commande récente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center bg-[#fafbfc] hover:bg-gray-50 transition-colors cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm tracking-tight text-gray-800 uppercase">{order.id}</p>
                      {order.type === "B2B" && (
                        <span className="text-[9px] font-bold bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded uppercase">B2B</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium italic ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium italic">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm">{order.amount}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{order.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activité en direct */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            Activité en direct 
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          </h2>
          
          {liveActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune activité récente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {liveActivity.slice(0, 3).map((activity, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl flex gap-3 border ${
                    activity.type === 'warning'
                      ? 'bg-orange-50/50 border-orange-100'
                      : activity.type === 'success'
                      ? 'bg-green-50/50 border-green-100'
                      : 'bg-blue-50/50 border-blue-100'
                  }`}
                >
                  {activity.type === 'warning' && <AlertCircle size={18} className="text-orange-400 shrink-0 mt-0.5" />}
                  {activity.type === 'success' && <CheckCircle2 size={18} className="text-green-400 shrink-0 mt-0.5" />}
                  {activity.type === 'info' && <Bell size={18} className="text-blue-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-medium text-gray-700 leading-normal">
                      {activity.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demand Forecast */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 tracking-tight">
              <div className="p-1 bg-gray-50 rounded">
                <BarChart3 size={16} className="text-gray-400 transform scale-x-[-1]"/>
              </div>
              Demand Forecast (Next 7 Days)
            </h2>
            <button className="text-gray-400 text-[11px] font-bold hover:text-gray-600 transition flex items-center gap-1 uppercase tracking-tighter mt-1">
              View Detailed Forecast <ChevronRight size={12}/>
            </button>
          </div>
          
          <div className="flex gap-4">
             <div className="flex-1 bg-blue-50/40 border border-blue-50 p-4 rounded-xl text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                  <Calendar size={10} /> Orders Next 7 Days
                </p>
                <p className="text-4xl font-black text-blue-600/90 tracking-tighter">15</p>
             </div>
             
             <div className="flex-1 bg-emerald-50/40 border border-emerald-50 p-4 rounded-xl text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                  <Package size={10} /> Total Value
                </p>
                <div className="flex flex-col items-center">
                  <p className="text-4xl font-black text-emerald-600/90 tracking-tighter">1079,72</p>
                  <span className="text-[10px] text-gray-500 mt-1">TND</span>
                </div>
             </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 px-2">
              <AlertCircle size={12} className="text-gray-300" />
              <p className="text-[10px] text-gray-400 font-medium italic">Products at Risk</p>
          </div>
        </div>
      </div>
    </div>
  );
}