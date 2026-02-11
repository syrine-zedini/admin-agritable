import React from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  Download,
  Calendar
} from 'lucide-react';

const Analytique = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-slate-800">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytique & Rapports</h1>
          <p className="text-gray-500 text-sm">Analyses complètes et métriques de performance</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            <Calendar size={16} /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Revenue" 
          value="302,64 TND" 
          subValue="1.7% conversion" 
          subColor="text-green-600"
          icon={<DollarSign className="text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard 
          title="Total Orders" 
          value="5" 
          subValue="Avg: 60,528 TND" 
          subColor="text-green-600"
          icon={<ShoppingCart className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard 
          title="Active Customers" 
          value="1513" 
          subValue="1513 new customers" 
          subColor="text-green-600"
          icon={<Users className="text-orange-600" />}
          iconBg="bg-orange-100"
        />
        <StatCard 
          title="Avg. Order Value" 
          value="60,528 TND" 
          subValue="5 orders total" 
          subColor="text-gray-500"
          icon={<Package className="text-gray-600" />}
          iconBg="bg-gray-100"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6 overflow-x-auto">
        {['Sales Analysis', 'Product Performance', 'Customer Insights', 'Operations'].map((tab, i) => (
          <button key={tab} className={`pb-3 text-sm font-medium whitespace-nowrap ${i === 0 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartPlaceholder title="Revenue Trend" subtitle="Revenue Chart" icon={<TrendingUp className="mx-auto mb-2 text-gray-400" />} />
        <ChartPlaceholder title="Order Volume" subtitle="Order Volume Chart" icon={<ShoppingCart className="mx-auto mb-2 text-gray-400" />} />
      </div>

      {/* Sales by Channel */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold mb-6">Sales by Channel</h3>
        <div className="space-y-4">
          <ChannelRow label="B2C Orders" value="95,820 TND" percentage="67%" color="bg-blue-600" />
          <ChannelRow label="B2B Orders" value="46,530 TND" percentage="33%" color="bg-green-500" />
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const StatCard = ({ title, value, subValue, icon, iconBg, subColor }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start">
    <div>
      <p className="text-gray-500 text-xs font-medium mb-1">{title}</p>
      <h3 className="text-xl font-bold mb-1">{value}</h3>
      <p className={`text-xs flex items-center gap-1 ${subColor}`}>
        {subValue.includes('%') && <TrendingUp size={12} />} {subValue}
      </p>
    </div>
    <div className={`${iconBg} p-3 rounded-lg`}>{icon}</div>
  </div>
);

const ChartPlaceholder = ({ title, subtitle, icon }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <h3 className="text-lg font-bold mb-4">{title}</h3>
    <div className="bg-gray-50 h-64 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
      {icon}
      <p className="text-sm font-medium text-gray-600">{subtitle}</p>
      <p className="text-xs text-gray-400 mt-1">Visualization placeholder</p>
    </div>
  </div>
);

const ChannelRow = ({ label, value, percentage, color }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-xs text-gray-400">{percentage} of total</p>
    </div>
  </div>
);

export default Analytique;