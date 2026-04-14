'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Eye, Star,
  Upload, X, Plus, Image as ImageIcon, ArrowUpRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector, BarChart, Bar, Legend,
} from 'recharts';
import { productSchema, GEMSTONE_TYPES, CUT_TYPES, CLARITY_GRADES, TREATMENT_TYPES, CERTIFICATION_BODIES, type ProductFormData } from '@/lib/validations';
import { formatPrice, formatNumber, getGemstoneColor, formatDate, cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/index';
import type { SellerAnalytics, OrderWithItems } from '@/types';

// ============================================================
// DashboardKPIs
// ============================================================
export function DashboardKPIs({ summary }: { summary: SellerAnalytics['summary'] }) {
  const kpis = [
    {
      label: 'Net Earnings',
      value: formatPrice(summary.net_earnings),
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      trend: null,
    },
    {
      label: 'Total Orders',
      value: formatNumber(summary.total_orders),
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      trend: null,
    },
    {
      label: 'Total Views',
      value: formatNumber(summary.total_views),
      icon: Eye,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      trend: null,
    },
    {
      label: 'Avg Order Value',
      value: formatPrice(summary.avg_order_value),
      icon: TrendingUp,
      color: 'text-gold',
      bg: 'bg-gold/10',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="card p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn('p-2 rounded-lg', kpi.bg)}>
              <kpi.icon className={cn('w-4 h-4', kpi.color)} />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-ivory-subtle" />
          </div>
          <p className="text-xs text-ivory-subtle uppercase tracking-wider mb-1">{kpi.label}</p>
          <p className="font-serif text-2xl font-semibold text-ivory">{kpi.value}</p>
          {kpi.label === 'Net Earnings' && (
            <p className="text-xs text-ivory-subtle mt-1">
              Platform fees: {formatPrice(summary.total_platform_fees)}
            </p>
          )}
          {kpi.label === 'Total Views' && (
            <p className="text-xs text-ivory-subtle mt-1">
              Conv. rate: {summary.conversion_rate.toFixed(1)}%
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// ProfitChart
// ============================================================
const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'rgb(18 18 26)',
  border: '1px solid rgb(42 42 58)',
  borderRadius: '8px',
  color: 'rgb(232 224 213)',
  fontSize: '12px',
};

export function ProfitChart({ monthlyData }: { monthlyData: SellerAnalytics['monthly_revenue'] }) {
  const formatted = monthlyData.map((d) => ({
    ...d,
    month: new Date(d.month + '-01').toLocaleString('default', { month: 'short' }),
  }));

  return (
    <div className="card p-6">
      <h3 className="font-serif text-xl text-ivory font-light mb-6">Revenue & Earnings (6 months)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(42 42 58)" />
          <XAxis dataKey="month" tick={{ fill: 'rgb(100 100 120)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgb(100 100 120)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toFixed(2)}`, '']} />
          <Line type="monotone" dataKey="revenue" stroke="rgb(201 169 110)" strokeWidth={2} dot={{ fill: 'rgb(201 169 110)', r: 3 }} name="Revenue" />
          <Line type="monotone" dataKey="earnings" stroke="rgb(52 168 110)" strokeWidth={2} dot={{ fill: 'rgb(52 168 110)', r: 3 }} name="Earnings" />
          <Line type="monotone" dataKey="fees" stroke="rgb(220 60 60)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Fees" />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'rgb(160 160 176)' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// CategoryPieChart
// ============================================================
export function CategoryPieChart({ data }: { data: SellerAnalytics['sales_by_gemstone'] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!data.length) return null;

  const chartData = data.map((d) => ({
    name: d.gemstone_type,
    value: d.revenue,
    count: d.count,
    color: getGemstoneColor(d.gemstone_type),
  }));

  return (
    <div className="card p-6">
      <h3 className="font-serif text-xl text-ivory font-light mb-6">Sales by Type</h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            onMouseEnter={(_, idx) => setActiveIdx(idx)}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color}
                opacity={i === activeIdx ? 1 : 0.6}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(v: number) => [formatPrice(v), 'Revenue']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {chartData.slice(0, 5).map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-ivory-muted">{d.name}</span>
            </div>
            <span className="text-ivory">{formatPrice(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ProductPerformanceTable
// ============================================================
export function ProductPerformanceTable({ products }: { products: SellerAnalytics['top_products'] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-obsidian-border flex items-center justify-between">
        <h3 className="font-serif text-xl text-ivory font-light">Top Products</h3>
        <Link href="/seller/listings" className="text-xs text-gold hover:text-gold-light">View all →</Link>
      </div>
      <table className="table-base">
        <thead>
          <tr>
            <th>Product</th>
            <th>Sales</th>
            <th>Revenue</th>
            <th>Views</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/seller/listings/${p.id}/edit`} className="text-ivory hover:text-gold transition-colors font-medium text-sm">
                  {p.name}
                </Link>
              </td>
              <td>{p.sales_count}</td>
              <td className="text-gold font-medium">{formatPrice(p.revenue)}</td>
              <td>{formatNumber(p.views)}</td>
              <td>
                {p.profit !== undefined ? (
                  <span className={p.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatPrice(p.profit)}
                  </span>
                ) : (
                  <span className="text-ivory-subtle">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// SellerOrdersTable
// ============================================================
export function SellerOrdersTable({ orders }: { orders: OrderWithItems[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-obsidian-border flex items-center justify-between">
        <h3 className="font-serif text-xl text-ivory font-light">Recent Orders</h3>
        <Link href="/seller/orders" className="text-xs text-gold hover:text-gold-light">View all →</Link>
      </div>
      <table className="table-base">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 8).map((order) => (
            <tr key={order.id}>
              <td>
                <Link href={`/seller/orders?id=${order.id}`} className="text-gold hover:text-gold-light font-mono text-xs">
                  #{order.id.slice(0, 8).toUpperCase()}
                </Link>
              </td>
              <td className="text-xs">{formatDate(order.created_at)}</td>
              <td>{order.order_items?.length ?? 0}</td>
              <td className="font-medium text-ivory">{formatPrice(order.total)}</td>
              <td>
                <span className={cn('badge text-[10px] capitalize', {
                  'bg-yellow-400/10 text-yellow-400 border-yellow-400/20': order.status === 'pending_payment',
                  'bg-blue-400/10 text-blue-400 border-blue-400/20': order.status === 'confirmed',
                  'bg-cyan-400/10 text-cyan-400 border-cyan-400/20': order.status === 'shipped',
                  'bg-green-400/10 text-green-400 border-green-400/20': order.status === 'delivered',
                  'bg-red-400/10 text-red-400 border-red-400/20': order.status === 'cancelled',
                })}>
                  {order.status.replace('_', ' ')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// ImageUploader
// ============================================================
interface ImageUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ value, onChange, maxFiles = 8 }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const combined = [...value, ...newFiles].slice(0, maxFiles);
    onChange(combined);

    const newPreviews = [...previews];
    newFiles.slice(0, maxFiles - value.length).forEach((file) => {
      const url = URL.createObjectURL(file);
      newPreviews.push(url);
    });
    setPreviews(newPreviews.slice(0, maxFiles));
  }, [value, previews, maxFiles, onChange]);

  const removeFile = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          isDragging ? 'border-gold bg-gold/5' : 'border-obsidian-border hover:border-gold/40'
        )}
        onClick={() => document.getElementById('image-upload-input')?.click()}
      >
        <ImageIcon className="w-8 h-8 text-ivory-subtle mx-auto mb-3" />
        <p className="text-sm text-ivory">Drop images here or <span className="text-gold">browse</span></p>
        <p className="text-xs text-ivory-subtle mt-1">JPEG, PNG, WebP — max 10MB each, up to {maxFiles} images</p>
        <input
          id="image-upload-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((preview, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-obsidian-border">
              <img src={preview} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gold text-obsidian text-[9px] font-bold text-center py-0.5">
                  PRIMARY
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PayoutHistory
// ============================================================
export function PayoutHistory({ payouts }: { payouts: any[] }) {
  if (!payouts.length) {
    return (
      <div className="text-center py-12 text-ivory-muted">
        <DollarSign className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p>No payouts yet</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="table-base">
        <thead>
          <tr>
            <th>Period</th>
            <th>Orders</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Paid Date</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout: any) => (
            <tr key={payout.id}>
              <td className="text-xs">
                {payout.period_start && payout.period_end
                  ? `${formatDate(payout.period_start)} – ${formatDate(payout.period_end)}`
                  : '—'}
              </td>
              <td>{payout.order_count ?? '—'}</td>
              <td className="font-semibold text-gold">{formatPrice(payout.amount)}</td>
              <td>
                <span className={cn('badge text-[10px] capitalize', {
                  'bg-yellow-400/10 text-yellow-400 border-yellow-400/20': payout.status === 'pending',
                  'bg-blue-400/10 text-blue-400 border-blue-400/20': payout.status === 'processing',
                  'bg-green-400/10 text-green-400 border-green-400/20': payout.status === 'paid',
                  'bg-red-400/10 text-red-400 border-red-400/20': payout.status === 'failed',
                })}>
                  {payout.status}
                </span>
              </td>
              <td className="text-xs">{payout.paid_at ? formatDate(payout.paid_at) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
