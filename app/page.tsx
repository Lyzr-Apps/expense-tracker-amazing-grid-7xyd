'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import {
  HiHome, HiDocumentChartBar, HiCurrencyDollar, HiPlus, HiPencilSquare, HiTrash,
  HiArrowTrendingUp, HiArrowTrendingDown, HiExclamationTriangle, HiCheckCircle,
  HiLightBulb, HiShoppingCart, HiTruck, HiHeart, HiFilm,
  HiEllipsisHorizontalCircle, HiCalendarDays, HiChartPie, HiXMark, HiCheck,
  HiArrowPath, HiBanknotes, HiSparkles, HiInformationCircle, HiWallet, HiMinus,
  HiCog6Tooth, HiUserGroup, HiArrowUturnLeft, HiArrowUturnRight, HiTag
} from 'react-icons/hi2'
import { RiHomeSmileLine, RiRestaurantLine, RiWallet3Line } from 'react-icons/ri'

// ============ CONSTANTS ============
const AGENT_ID = '69a04fd17549c200e00d2fb9'
const STORAGE_EXPENSES = 'expensetrack_expenses'
const STORAGE_BUDGETS = 'expensetrack_budgets'
const STORAGE_TOPUPS = 'expensetrack_topups'
const STORAGE_CATEGORIES = 'expensetrack_categories'
const STORAGE_TOPUP_PRESETS = 'expensetrack_topup_presets'
const STORAGE_BORROWS = 'expensetrack_borrows'

const DEFAULT_CATEGORIES = ['Food', 'Household', 'Travel', 'Entertainment', 'Health', 'Other']
const DEFAULT_TOPUP_PRESETS = ['Salary', 'Freelance', 'Gift', 'Refund', 'Other']

// ============ INTERFACES ============
interface Expense {
  id: string
  amount: number
  category: string
  note: string
  date: string
  createdAt: string
}

interface BudgetItem {
  category: string
  limit: number
}

interface TopUp {
  id: string
  amount: number
  note: string
  date: string
  createdAt: string
}

interface BorrowRecord {
  id: string
  type: 'borrowed' | 'lent'
  personName: string
  amount: number
  note: string
  date: string
  createdAt: string
  status: 'pending' | 'settled'
  settledDate?: string
}

interface CategoryBreakdown {
  category: string
  total: number
  percentage: number
  item_count: number
  is_over_budget: boolean
  budget_limit: number
  budget_utilization: number
}

interface TopExpense {
  category: string
  amount: number
  note: string
  date: string
}

interface Trend {
  description: string
  change_percentage: number
  direction: string
}

interface BudgetAlert {
  category: string
  message: string
  severity: string
}

interface Insight {
  text: string
}

interface AgentReport {
  report_type: string
  summary: string
  total_spent: number
  category_breakdown: CategoryBreakdown[]
  top_expenses: TopExpense[]
  trends: Trend[]
  budget_alerts: BudgetAlert[]
  insights: Insight[]
  chat_answer: string
}

// ============ SAMPLE DATA ============
function makeSampleExpenses(): Expense[] {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0]
  return [
    { id: 's1', amount: 12.50, category: 'Food', note: 'Lunch at deli', date: today, createdAt: new Date().toISOString() },
    { id: 's2', amount: 45.00, category: 'Household', note: 'Cleaning supplies', date: today, createdAt: new Date().toISOString() },
    { id: 's3', amount: 8.99, category: 'Entertainment', note: 'Movie streaming', date: today, createdAt: new Date().toISOString() },
    { id: 's4', amount: 35.00, category: 'Travel', note: 'Uber ride', date: today, createdAt: new Date().toISOString() },
    { id: 's5', amount: 22.75, category: 'Food', note: 'Grocery run', date: yesterday, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 's6', amount: 150.00, category: 'Health', note: 'Pharmacy prescription', date: yesterday, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 's7', amount: 60.00, category: 'Entertainment', note: 'Concert tickets', date: twoDaysAgo, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 's8', amount: 18.50, category: 'Food', note: 'Coffee and pastry', date: twoDaysAgo, createdAt: new Date(Date.now() - 172800000).toISOString() },
  ]
}

const SAMPLE_BUDGETS: BudgetItem[] = [
  { category: 'Food', limit: 400 },
  { category: 'Household', limit: 300 },
  { category: 'Travel', limit: 200 },
  { category: 'Entertainment', limit: 150 },
  { category: 'Health', limit: 250 },
  { category: 'Other', limit: 100 },
]

function makeSampleTopups(): TopUp[] {
  const today = new Date().toISOString().split('T')[0]
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
  return [
    { id: 'st1', amount: 1500, note: 'Monthly salary', date: threeDaysAgo, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'st2', amount: 500, note: 'Freelance payment', date: today, createdAt: new Date().toISOString() },
  ]
}

function makeSampleBorrows(): BorrowRecord[] {
  const today = new Date().toISOString().split('T')[0]
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0]
  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
  return [
    { id: 'sb1', type: 'borrowed', personName: 'Alex', amount: 200, note: 'Dinner split', date: today, createdAt: new Date().toISOString(), status: 'pending' },
    { id: 'sb2', type: 'lent', personName: 'Sam', amount: 150, note: 'Movie tickets', date: today, createdAt: new Date().toISOString(), status: 'pending' },
    { id: 'sb3', type: 'borrowed', personName: 'Jordan', amount: 50, note: 'Coffee', date: fiveDaysAgo, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'settled', settledDate: twoDaysAgo },
    { id: 'sb4', type: 'lent', personName: 'Taylor', amount: 300, note: 'Emergency loan', date: twoDaysAgo, createdAt: new Date(Date.now() - 172800000).toISOString(), status: 'pending' },
  ]
}

// ============ HELPERS ============
function getCategoryIcon(category: string) {
  switch (category) {
    case 'Food': return <RiRestaurantLine className="w-4 h-4" />
    case 'Household': return <RiHomeSmileLine className="w-4 h-4" />
    case 'Travel': return <HiTruck className="w-4 h-4" />
    case 'Entertainment': return <HiFilm className="w-4 h-4" />
    case 'Health': return <HiHeart className="w-4 h-4" />
    case 'Shopping': return <HiShoppingCart className="w-4 h-4" />
    default: return <HiEllipsisHorizontalCircle className="w-4 h-4" />
  }
}

const CATEGORY_COLORS: Record<string, { normal: string; selected: string }> = {
  Food: { normal: 'bg-orange-100 text-orange-700 border-orange-200', selected: 'bg-orange-500 text-white border-orange-600' },
  Household: { normal: 'bg-blue-100 text-blue-700 border-blue-200', selected: 'bg-blue-500 text-white border-blue-600' },
  Travel: { normal: 'bg-purple-100 text-purple-700 border-purple-200', selected: 'bg-purple-500 text-white border-purple-600' },
  Entertainment: { normal: 'bg-pink-100 text-pink-700 border-pink-200', selected: 'bg-pink-500 text-white border-pink-600' },
  Health: { normal: 'bg-red-100 text-red-700 border-red-200', selected: 'bg-red-500 text-white border-red-600' },
  Shopping: { normal: 'bg-amber-100 text-amber-700 border-amber-200', selected: 'bg-amber-500 text-white border-amber-600' },
}

const EXTRA_COLORS = [
  { normal: 'bg-cyan-100 text-cyan-700 border-cyan-200', selected: 'bg-cyan-500 text-white border-cyan-600' },
  { normal: 'bg-lime-100 text-lime-700 border-lime-200', selected: 'bg-lime-500 text-white border-lime-600' },
  { normal: 'bg-violet-100 text-violet-700 border-violet-200', selected: 'bg-violet-500 text-white border-violet-600' },
  { normal: 'bg-rose-100 text-rose-700 border-rose-200', selected: 'bg-rose-500 text-white border-rose-600' },
  { normal: 'bg-teal-100 text-teal-700 border-teal-200', selected: 'bg-teal-500 text-white border-teal-600' },
  { normal: 'bg-indigo-100 text-indigo-700 border-indigo-200', selected: 'bg-indigo-500 text-white border-indigo-600' },
  { normal: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', selected: 'bg-fuchsia-500 text-white border-fuchsia-600' },
  { normal: 'bg-emerald-100 text-emerald-700 border-emerald-200', selected: 'bg-emerald-500 text-white border-emerald-600' },
  { normal: 'bg-sky-100 text-sky-700 border-sky-200', selected: 'bg-sky-500 text-white border-sky-600' },
]

function getCategoryColor(category: string): string {
  const known = CATEGORY_COLORS[category]
  if (known) return known.normal
  // For custom categories, hash the name to pick a stable color
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) % EXTRA_COLORS.length
  }
  return EXTRA_COLORS[Math.abs(hash)]?.normal ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

function getCategoryBadgeSelected(category: string): string {
  const known = CATEGORY_COLORS[category]
  if (known) return known.selected
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) % EXTRA_COLORS.length
  }
  return EXTRA_COLORS[Math.abs(hash)]?.selected ?? 'bg-gray-500 text-white border-gray-600'
}

function genId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

function formatCurrency(n: number) {
  return '$' + n.toFixed(2)
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getProgressColor(pct: number) {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

// ============ ERROR BOUNDARY ============
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============ NAV ITEMS ============
type Screen = 'dashboard' | 'reports' | 'budgets' | 'borrowing'

const NAV_ITEMS: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <HiHome className="w-6 h-6" /> },
  { id: 'reports', label: 'Reports', icon: <HiDocumentChartBar className="w-6 h-6" /> },
  { id: 'budgets', label: 'Budgets', icon: <HiCurrencyDollar className="w-6 h-6" /> },
  { id: 'borrowing', label: 'Borrowing', icon: <HiUserGroup className="w-6 h-6" /> },
]

// ============ STAT CARD ============
function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="border-0 shadow-md rounded-2xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
          <p className="text-lg font-semibold text-foreground truncate">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ============ BALANCE CARD ============
function BalanceCard({
  totalTopUps, totalSpent, topUps, onTopUp,
}: {
  totalTopUps: number
  totalSpent: number
  topUps: TopUp[]
  onTopUp: () => void
}) {
  const currentBalance = totalTopUps - totalSpent
  const isPositive = currentBalance >= 0
  const hasBalance = totalTopUps > 0
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="space-y-2">
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className={`absolute inset-0 ${isPositive ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700' : 'bg-gradient-to-br from-red-500 via-red-600 to-rose-700'}`} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <HiWallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/70 font-medium">Current Balance</p>
                {hasBalance && (
                  <p className="text-[10px] text-white/50">Total added: {formatCurrency(totalTopUps)}</p>
                )}
              </div>
            </div>
            <button
              onClick={onTopUp}
              className="h-9 px-3 rounded-xl bg-white/20 flex items-center justify-center gap-1.5 active:scale-90 transition-transform"
            >
              <HiPlus className="w-4 h-4 text-white" />
              <span className="text-xs font-medium text-white">Top Up</span>
            </button>
          </div>

          {hasBalance ? (
            <>
              <p className="text-3xl font-bold mt-2 text-white">
                {isPositive ? '' : '-'}{formatCurrency(Math.abs(currentBalance))}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <HiPlus className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60">Added</p>
                    <p className="text-xs font-semibold text-white">{formatCurrency(totalTopUps)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <HiMinus className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60">Spent</p>
                    <p className="text-xs font-semibold text-white">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
                {totalTopUps > 0 && (
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-white/60 mb-1">
                      <span>Used</span>
                      <span>{Math.min((totalSpent / totalTopUps) * 100, 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/70 transition-all duration-500"
                        style={{ width: `${Math.min((totalSpent / totalTopUps) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-2">
              <p className="text-lg font-semibold text-white/80">Add your balance</p>
              <p className="text-xs text-white/50 mt-0.5">Tap Top Up to add funds to your wallet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {topUps.length > 0 && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-secondary/50 active:scale-[0.98] transition-transform"
        >
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <HiBanknotes className="w-3.5 h-3.5" /> Top-up History ({topUps.length})
          </span>
          <HiArrowTrendingUp className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>
      )}

      {showHistory && topUps.length > 0 && (
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-3">
            <ScrollArea className="max-h-[160px]">
              <div className="space-y-2">
                {topUps.map(tu => (
                  <div key={tu.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <HiPlus className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tu.note || 'Top Up'}</p>
                      <p className="text-[10px] text-muted-foreground">{tu.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(tu.amount)}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============ DASHBOARD SCREEN ============
function DashboardScreen({
  expenses, setExpenses, totalTopUps, topUps, onTopUp, categories, onOpenSettings
}: {
  expenses: Expense[]
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
  totalTopUps: number
  topUps: TopUp[]
  onTopUp: () => void
  categories: string[]
  onOpenSettings: () => void
}) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>('')
  const [note, setNote] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')

  const today = getToday()
  const todayExpenses = expenses.filter(e => e.date === today)
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
  const allTimeTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  const topCategory = todayExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})
  const topCatName = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'

  const handleAdd = () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0 || !category) return
    const newExpense: Expense = {
      id: genId(),
      amount: parsed,
      category,
      note: note.trim(),
      date: today,
      createdAt: new Date().toISOString(),
    }
    setExpenses(prev => [newExpense, ...prev])
    setAmount('')
    setNote('')
  }

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const handleEditStart = (e: Expense) => {
    setEditId(e.id)
    setEditAmount(e.amount.toString())
    setEditNote(e.note)
  }

  const handleEditSave = (id: string) => {
    const parsed = parseFloat(editAmount)
    if (isNaN(parsed) || parsed <= 0) return
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, amount: parsed, note: editNote.trim() } : e))
    setEditId(null)
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Balance Hero Card */}
      <BalanceCard totalTopUps={totalTopUps} totalSpent={allTimeTotal} topUps={topUps} onTopUp={onTopUp} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<HiBanknotes className="w-5 h-5" />} label="Today" value={formatCurrency(todayTotal)} />
        <StatCard icon={<HiChartPie className="w-5 h-5" />} label="Top Category" value={topCatName} sub={topCatName !== 'None' ? formatCurrency(topCategory[topCatName] ?? 0) : undefined} />
      </div>

      {/* Quick Entry Form */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HiPlus className="w-4 h-4 text-primary" /> Add Expense
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 h-11 rounded-xl text-base"
                min="0"
                step="0.01"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              />
            </div>
            <Input
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 h-11 rounded-xl"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>
          <div>
            {!category && (
              <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                <HiInformationCircle className="w-3 h-3" /> Select a category
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-transform active:scale-95 flex items-center gap-1.5 min-h-[36px] ${category === cat ? getCategoryBadgeSelected(cat) : getCategoryColor(cat)}`}
                >
                  {getCategoryIcon(cat)}
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!amount || parseFloat(amount) <= 0 || !category}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground active:scale-[0.98] transition-transform text-sm font-medium"
          >
            <HiPlus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </CardContent>
      </Card>

      {/* Today's Expenses */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HiCalendarDays className="w-4 h-4 text-primary" /> Today
            </span>
            <Badge variant="outline" className="text-[10px] font-normal">{todayExpenses.length} entries</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {todayExpenses.length === 0 ? (
            <div className="text-center py-8">
              <HiCurrencyDollar className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No expenses yet today</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first expense above</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[320px]">
              <div className="space-y-2">
                {todayExpenses.map(exp => (
                  <div key={exp.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 active:bg-secondary/70 transition-colors">
                    {editId === exp.id ? (
                      <>
                        <div className="flex-1 flex gap-2 items-center">
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-20 h-9 text-sm rounded-xl"
                            min="0"
                            step="0.01"
                          />
                          <Input
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="flex-1 h-9 text-sm rounded-xl"
                            placeholder="Note"
                          />
                        </div>
                        <button
                          onClick={() => handleEditSave(exp.id)}
                          className="p-2 rounded-xl bg-emerald-100 text-emerald-600 active:scale-90 transition-transform min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <HiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-2 rounded-xl bg-red-100 text-red-500 active:scale-90 transition-transform min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <HiXMark className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getCategoryColor(exp.category)}`}>
                          {getCategoryIcon(exp.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{exp.note || exp.category}</p>
                          <p className="text-[11px] text-muted-foreground">{exp.category}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(exp.amount)}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditStart(exp)}
                            className="p-2 rounded-xl active:bg-blue-100 text-blue-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <HiPencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-2 rounded-xl active:bg-red-100 text-red-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Agent Info */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <HiInformationCircle className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">AI Agent</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
            <p className="text-xs text-foreground">Expense Insights Agent - Available in Reports</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ REPORTS SCREEN ============
function ReportsScreen({
  expenses, budgets, activeAgentId, setActiveAgentId, totalTopUps, categories
}: {
  expenses: Expense[]
  budgets: BudgetItem[]
  activeAgentId: string | null
  setActiveAgentId: (id: string | null) => void
  totalTopUps: number
  categories: string[]
}) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [report, setReport] = useState<AgentReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allTimeTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currentBalance = totalTopUps - allTimeTotal

  const getDateRange = useCallback(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    if (period === 'daily') return { start: todayStr, end: todayStr, label: 'Today' }
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      return { start: weekAgo.toISOString().split('T')[0], end: todayStr, label: 'This Week' }
    }
    const monthAgo = new Date(now.getTime() - 30 * 86400000)
    return { start: monthAgo.toISOString().split('T')[0], end: todayStr, label: 'This Month' }
  }, [period])

  const handleGenerateReport = async () => {
    setLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)

    const range = getDateRange()
    const periodExpenses = expenses.filter(e => e.date >= range.start && e.date <= range.end)

    const expenseLines = periodExpenses.length > 0
      ? periodExpenses.map(e => `  - ${e.date} | ${e.category} | $${e.amount.toFixed(2)} | ${e.note || 'No note'}`).join('\n')
      : '  No expenses recorded for this period.'

    const budgetLines = budgets.map(b => `  - ${b.category}: $${b.limit} limit`).join('\n')

    const balanceContext = totalTopUps > 0
      ? `\nBALANCE: Total top-ups $${totalTopUps.toFixed(2)}, Current balance $${currentBalance.toFixed(2)}, Total spent $${allTimeTotal.toFixed(2)}`
      : ''

    const message = `Here is my expense data for analysis:

EXPENSES (${range.label}: ${range.start} to ${range.end}):
${expenseLines}

BUDGETS:
${budgetLines}${balanceContext}

CATEGORIES: ${categories.join(', ')}

PERIOD: ${period} for ${range.start} to ${range.end}

REQUEST: Generate a ${period} spending report with category breakdown, trends, budget alerts, and insights.`

    try {
      const result = await callAIAgent(message, AGENT_ID)
      if (result.success && result?.response?.status === 'success') {
        let data = result.response.result as unknown
        if (typeof data === 'string') {
          try { data = JSON.parse(data) } catch { /* keep as is */ }
        }
        setReport(data as AgentReport)
      } else {
        setError(result?.error ?? result?.response?.message ?? 'Failed to generate report')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
    setActiveAgentId(null)
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Controls */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <HiDocumentChartBar className="w-4 h-4 text-primary" /> Spending Report
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">AI-powered expense analysis</p>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'daily' | 'weekly' | 'monthly')} className="w-full">
            <TabsList className="grid grid-cols-3 w-full rounded-xl">
              <TabsTrigger value="daily" className="text-xs rounded-xl">Day</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs rounded-xl">Week</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs rounded-xl">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleGenerateReport} disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground active:scale-[0.98] transition-transform">
            {loading ? <HiArrowPath className="w-4 h-4 mr-2 animate-spin" /> : <HiSparkles className="w-4 h-4 mr-2" />}
            Generate Report
          </Button>
          {activeAgentId === AGENT_ID && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Expense Insights Agent is analyzing...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-destructive/30 bg-destructive/5 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <HiExclamationTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Report failed</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateReport} className="rounded-xl active:scale-95 transition-transform">
              <HiArrowPath className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && !report && (
        <div className="text-center py-12">
          <HiDocumentChartBar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No report generated yet</p>
          <p className="text-xs text-muted-foreground mt-1">Select a period and tap Generate</p>
        </div>
      )}

      {/* Report Results */}
      {!loading && report && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] rounded-lg">{report?.report_type ?? 'Report'}</Badge>
                  </div>
                  <div className="text-sm text-foreground">{renderMarkdown(report?.summary ?? '')}</div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">Total Spent</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(report?.total_spent ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          {Array.isArray(report?.category_breakdown) && report.category_breakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 px-1">
                <HiChartPie className="w-4 h-4 text-primary" /> Categories
              </h3>
              <div className="space-y-3">
                {report.category_breakdown.map((cat, idx) => (
                  <Card key={idx} className={`border-0 shadow-md rounded-2xl ${cat?.is_over_budget ? 'ring-1 ring-red-300' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getCategoryColor(cat?.category ?? '')}`}>
                            {getCategoryIcon(cat?.category ?? '')}
                          </div>
                          <span className="text-sm font-medium">{cat?.category ?? 'Unknown'}</span>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(cat?.total ?? 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>{(cat?.percentage ?? 0).toFixed(1)}%</span>
                        <span className="text-border">|</span>
                        <span>{cat?.item_count ?? 0} items</span>
                        {cat?.is_over_budget && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 rounded-lg">Over</Badge>
                        )}
                      </div>
                      {(cat?.budget_limit ?? 0) > 0 && (
                        <div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Budget: {formatCurrency(cat?.budget_limit ?? 0)}</span>
                            <span>{(cat?.budget_utilization ?? 0).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(cat?.budget_utilization ?? 0)}`}
                              style={{ width: `${Math.min(cat?.budget_utilization ?? 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Top Expenses */}
          {Array.isArray(report?.top_expenses) && report.top_expenses.length > 0 && (
            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HiArrowTrendingUp className="w-4 h-4 text-primary" /> Top Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {report.top_expenses.map((te, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${getCategoryColor(te?.category ?? '')}`}>
                        {getCategoryIcon(te?.category ?? '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{te?.note ?? 'No note'}</p>
                        <p className="text-[11px] text-muted-foreground">{te?.category ?? ''}{te?.date ? ` - ${te.date}` : ''}</p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">{formatCurrency(te?.amount ?? 0)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trends */}
          {Array.isArray(report?.trends) && report.trends.length > 0 && (
            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HiArrowTrendingUp className="w-4 h-4 text-primary" /> Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {report.trends.map((trend, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                      {trend?.direction === 'up'
                        ? <HiArrowTrendingUp className="w-5 h-5 text-red-500 shrink-0" />
                        : <HiArrowTrendingDown className="w-5 h-5 text-emerald-500 shrink-0" />
                      }
                      <p className="text-sm flex-1">{trend?.description ?? ''}</p>
                      <Badge variant="outline" className={`text-[10px] rounded-lg ${trend?.direction === 'up' ? 'text-red-600 border-red-200' : 'text-emerald-600 border-emerald-200'}`}>
                        {trend?.direction === 'up' ? '+' : '-'}{Math.abs(trend?.change_percentage ?? 0).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget Alerts */}
          {Array.isArray(report?.budget_alerts) && report.budget_alerts.length > 0 && (
            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HiExclamationTriangle className="w-4 h-4 text-yellow-500" /> Budget Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {report.budget_alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-xl border ${alert?.severity === 'high' ? 'bg-red-50 border-red-200' : alert?.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <HiExclamationTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${alert?.severity === 'high' ? 'text-red-500' : alert?.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{alert?.category ?? ''}</p>
                        <p className="text-xs text-muted-foreground">{alert?.message ?? ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {Array.isArray(report?.insights) && report.insights.length > 0 && (
            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HiLightBulb className="w-4 h-4 text-yellow-500" /> Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {report.insights.map((ins, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                      <HiLightBulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                      <div className="text-sm flex-1">{renderMarkdown(ins?.text ?? '')}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Answer */}
          {report?.chat_answer && (
            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HiSparkles className="w-4 h-4 text-primary" /> Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-sm">{renderMarkdown(report.chat_answer)}</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ============ BUDGETS SCREEN ============
function BudgetsScreen({
  budgets, setBudgets, expenses, categories
}: {
  budgets: BudgetItem[]
  setBudgets: React.Dispatch<React.SetStateAction<BudgetItem[]>>
  expenses: Expense[]
  categories: string[]
}) {
  const [localBudgets, setLocalBudgets] = useState<BudgetItem[]>(budgets)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalBudgets(budgets)
  }, [budgets])

  const now = new Date()
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const monthEndStr = nextMonth.toISOString().split('T')[0]

  const monthSpend: Record<string, number> = {}
  expenses.filter(e => e.date >= monthStartStr && e.date <= monthEndStr).forEach(e => {
    monthSpend[e.category] = (monthSpend[e.category] ?? 0) + e.amount
  })

  const handleLimitChange = (category: string, value: string) => {
    const num = parseFloat(value) || 0
    setLocalBudgets(prev => prev.map(b => b.category === category ? { ...b, limit: num } : b))
    setSaved(false)
  }

  const handleSave = () => {
    setBudgets(localBudgets)
    setSaved(true)
    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HiCurrencyDollar className="w-4 h-4 text-primary" /> Monthly Budgets
            </CardTitle>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground active:scale-95 transition-transform rounded-xl" size="sm">
              {saved
                ? <><HiCheckCircle className="w-4 h-4 mr-1" /> Saved</>
                : <><HiCheck className="w-4 h-4 mr-1" /> Save</>
              }
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Set monthly limits per category</p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            {localBudgets.map(budget => {
              const spent = monthSpend[budget.category] ?? 0
              const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0
              const remaining = budget.limit - spent

              return (
                <div key={budget.category} className="p-4 rounded-2xl bg-secondary/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getCategoryColor(budget.category)}`}>
                        {getCategoryIcon(budget.category)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{budget.category}</p>
                        <p className="text-[11px] text-muted-foreground">Spent: {formatCurrency(spent)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={budget.limit || ''}
                        onChange={(e) => handleLimitChange(budget.category, e.target.value)}
                        className="w-20 h-9 text-sm text-right rounded-xl"
                        min="0"
                        step="10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{pct.toFixed(0)}% used</span>
                      <span className={remaining < 0 ? 'text-red-500 font-medium' : ''}>
                        {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ BORROWING SCREEN ============
function BorrowingScreen({
  borrows, setBorrows,
}: {
  borrows: BorrowRecord[]
  setBorrows: React.Dispatch<React.SetStateAction<BorrowRecord[]>>
}) {
  const [filter, setFilter] = useState<'borrowed' | 'lent'>('borrowed')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newType, setNewType] = useState<'borrowed' | 'lent'>('borrowed')
  const [newPerson, setNewPerson] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newDate, setNewDate] = useState(getToday())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const pendingBorrowed = borrows.filter(b => b.type === 'borrowed' && b.status === 'pending')
  const pendingLent = borrows.filter(b => b.type === 'lent' && b.status === 'pending')
  const totalIOwe = pendingBorrowed.reduce((sum, b) => sum + b.amount, 0)
  const totalOwedToMe = pendingLent.reduce((sum, b) => sum + b.amount, 0)
  const netBalance = totalOwedToMe - totalIOwe

  const filteredRecords = borrows.filter(b => b.type === filter)
    .sort((a, b) => {
      if (a.status === 'pending' && b.status === 'settled') return -1
      if (a.status === 'settled' && b.status === 'pending') return 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

  const handleAdd = () => {
    const parsed = parseFloat(newAmount)
    if (!newPerson.trim() || isNaN(parsed) || parsed <= 0) return
    const record: BorrowRecord = {
      id: genId(),
      type: newType,
      personName: newPerson.trim(),
      amount: parsed,
      note: newNote.trim(),
      date: newDate || getToday(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    }
    setBorrows(prev => [record, ...prev])
    setShowAddDialog(false)
    setNewPerson('')
    setNewAmount('')
    setNewNote('')
    setNewDate(getToday())
  }

  const handleSettle = (id: string) => {
    setBorrows(prev => prev.map(b =>
      b.id === id ? { ...b, status: 'settled' as const, settledDate: getToday() } : b
    ))
  }

  const handleDelete = (id: string) => {
    setBorrows(prev => prev.filter(b => b.id !== id))
    setConfirmDeleteId(null)
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-red-50" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                <HiArrowUturnLeft className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-[11px] text-red-600 font-medium">I Owe</p>
            </div>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalIOwe)}</p>
            <p className="text-[10px] text-red-500 mt-0.5">{pendingBorrowed.length} pending</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-emerald-50" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <HiArrowUturnRight className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">Owed to Me</p>
            </div>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalOwedToMe)}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">{pendingLent.length} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs + Add Button */}
      <div className="flex items-center gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'borrowed' | 'lent')} className="flex-1">
          <TabsList className="grid grid-cols-2 w-full rounded-xl">
            <TabsTrigger value="borrowed" className="text-xs rounded-xl">Borrowed</TabsTrigger>
            <TabsTrigger value="lent" className="text-xs rounded-xl">Lent</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          onClick={() => { setNewType(filter); setShowAddDialog(true) }}
          className="h-10 w-10 rounded-xl bg-primary text-primary-foreground active:scale-90 transition-transform p-0 shrink-0"
        >
          <HiPlus className="w-5 h-5" />
        </Button>
      </div>

      {/* Records List */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardContent className="p-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <HiUserGroup className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No records yet</p>
              <p className="text-xs text-muted-foreground mt-1">Track money you have {filter === 'borrowed' ? 'borrowed' : 'lent'}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {filteredRecords.map(record => (
                  <div
                    key={record.id}
                    className={`p-3 rounded-xl transition-colors ${record.status === 'settled' ? 'bg-secondary/30 opacity-70' : 'bg-secondary/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${record.type === 'borrowed' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {record.type === 'borrowed' ? <HiArrowUturnLeft className="w-4 h-4" /> : <HiArrowUturnRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{record.personName}</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 rounded-lg shrink-0 ${record.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}
                          >
                            {record.status === 'pending' ? 'Pending' : 'Settled'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {record.date}{record.note ? ` - ${record.note}` : ''}
                        </p>
                        {record.status === 'settled' && record.settledDate && (
                          <p className="text-[10px] text-emerald-600">Settled on {record.settledDate}</p>
                        )}
                      </div>
                      <p className={`text-sm font-semibold shrink-0 ${record.type === 'borrowed' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(record.amount)}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 mt-2">
                      {record.status === 'pending' && (
                        <button
                          onClick={() => handleSettle(record.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-medium active:scale-95 transition-transform min-h-[32px]"
                        >
                          <HiCheckCircle className="w-3.5 h-3.5" /> Settle
                        </button>
                      )}
                      {confirmDeleteId === record.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 text-red-600 text-[11px] font-medium active:scale-95 transition-transform min-h-[32px]"
                          >
                            <HiCheck className="w-3.5 h-3.5" /> Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-medium active:scale-95 transition-transform min-h-[32px]"
                          >
                            <HiXMark className="w-3.5 h-3.5" /> No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(record.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-500 text-[11px] font-medium active:scale-95 transition-transform min-h-[32px]"
                        >
                          <HiTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Net Balance */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiBanknotes className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Net Balance</span>
            </div>
            <div className="text-right">
              <p className={`text-base font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(netBalance))}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {netBalance > 0 ? 'Others owe you' : netBalance < 0 ? 'You owe others' : 'All settled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HiPlus className="w-5 h-5 text-primary" /> New Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Type Toggle */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Type</Label>
              <Tabs value={newType} onValueChange={(v) => setNewType(v as 'borrowed' | 'lent')} className="w-full">
                <TabsList className="grid grid-cols-2 w-full rounded-xl">
                  <TabsTrigger value="borrowed" className="text-xs rounded-xl">I Borrowed</TabsTrigger>
                  <TabsTrigger value="lent" className="text-xs rounded-xl">I Lent</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Person Name *</Label>
              <Input
                placeholder="e.g., Alex"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                className="h-11 rounded-xl mt-1"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Amount *</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="pl-7 h-11 rounded-xl"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Note (optional)</Label>
              <Input
                placeholder="e.g., Dinner split"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="h-11 rounded-xl mt-1"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-11 rounded-xl mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 h-11 rounded-xl active:scale-95 transition-transform"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!newPerson.trim() || !newAmount || parseFloat(newAmount) <= 0}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground active:scale-95 transition-transform"
              >
                <HiPlus className="w-4 h-4 mr-1" /> Add Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ SETTINGS DIALOG ============
function SettingsDialog({
  open, onOpenChange, categories, setCategories, topupPresets, setTopupPresets, expenses
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: string[]
  setCategories: React.Dispatch<React.SetStateAction<string[]>>
  topupPresets: string[]
  setTopupPresets: React.Dispatch<React.SetStateAction<string[]>>
  expenses: Expense[]
}) {
  const [newCategory, setNewCategory] = useState('')
  const [newPreset, setNewPreset] = useState('')
  const [catError, setCatError] = useState('')
  const [presetError, setPresetError] = useState('')
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null)
  const [catDeleteInfo, setCatDeleteInfo] = useState<{ name: string; count: number } | null>(null)

  const handleAddCategory = () => {
    const trimmed = newCategory.trim()
    if (!trimmed) { setCatError('Enter a category name'); return }
    if (categories.length >= 15) { setCatError('Maximum 15 categories'); return }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) { setCatError('Category already exists'); return }
    setCategories(prev => [...prev, trimmed])
    setNewCategory('')
    setCatError('')
  }

  const handleDeleteCategoryClick = (cat: string) => {
    const count = expenses.filter(e => e.category === cat).length
    if (count > 0) {
      setCatDeleteInfo({ name: cat, count })
    } else {
      setCategories(prev => prev.filter(c => c !== cat))
    }
  }

  const handleConfirmDeleteCategory = () => {
    if (catDeleteInfo) {
      setCategories(prev => prev.filter(c => c !== catDeleteInfo.name))
      setCatDeleteInfo(null)
    }
  }

  const handleAddPreset = () => {
    const trimmed = newPreset.trim()
    if (!trimmed) { setPresetError('Enter a preset name'); return }
    if (topupPresets.length >= 10) { setPresetError('Maximum 10 presets'); return }
    if (topupPresets.some(p => p.toLowerCase() === trimmed.toLowerCase())) { setPresetError('Preset already exists'); return }
    setTopupPresets(prev => [...prev, trimmed])
    setNewPreset('')
    setPresetError('')
  }

  const handleDeletePreset = (preset: string) => {
    setTopupPresets(prev => prev.filter(p => p !== preset))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <HiCog6Tooth className="w-5 h-5 text-primary" /> Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {/* Manage Categories */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <HiTag className="w-4 h-4 text-primary" /> Manage Categories
            </h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getCategoryColor(cat)}`}>
                      {getCategoryIcon(cat)}
                    </div>
                    <span className="text-sm">{cat}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategoryClick(cat)}
                    className="p-1.5 rounded-lg text-red-400 active:scale-90 active:bg-red-100 transition-all min-w-[30px] min-h-[30px] flex items-center justify-center"
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="New category..."
                value={newCategory}
                onChange={(e) => { setNewCategory(e.target.value); setCatError('') }}
                className="flex-1 h-10 rounded-xl text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory() }}
              />
              <Button
                onClick={handleAddCategory}
                disabled={!newCategory.trim() || categories.length >= 15}
                className="h-10 rounded-xl bg-primary text-primary-foreground active:scale-95 transition-transform px-3"
                size="sm"
              >
                <HiPlus className="w-4 h-4" />
              </Button>
            </div>
            {catError && <p className="text-[11px] text-red-500 mt-1">{catError}</p>}
            <p className="text-[10px] text-muted-foreground mt-1">{categories.length}/15 categories</p>
          </div>

          {/* Confirm Delete Category With Expenses */}
          {catDeleteInfo && (
            <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-2">
                <HiExclamationTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    &quot;{catDeleteInfo.name}&quot; has {catDeleteInfo.count} expense{catDeleteInfo.count > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-700 mt-0.5">Delete anyway? Expenses will keep their category label.</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleConfirmDeleteCategory}
                      className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium active:scale-95 transition-transform"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setCatDeleteInfo(null)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium active:scale-95 transition-transform"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manage Top-Up Presets */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <HiBanknotes className="w-4 h-4 text-primary" /> Manage Top-Up Presets
            </h3>
            <div className="space-y-2">
              {topupPresets.map(preset => (
                <div key={preset} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40">
                  <span className="text-sm">{preset}</span>
                  <button
                    onClick={() => handleDeletePreset(preset)}
                    className="p-1.5 rounded-lg text-red-400 active:scale-90 active:bg-red-100 transition-all min-w-[30px] min-h-[30px] flex items-center justify-center"
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="New preset..."
                value={newPreset}
                onChange={(e) => { setNewPreset(e.target.value); setPresetError('') }}
                className="flex-1 h-10 rounded-xl text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddPreset() }}
              />
              <Button
                onClick={handleAddPreset}
                disabled={!newPreset.trim() || topupPresets.length >= 10}
                className="h-10 rounded-xl bg-primary text-primary-foreground active:scale-95 transition-transform px-3"
                size="sm"
              >
                <HiPlus className="w-4 h-4" />
              </Button>
            </div>
            {presetError && <p className="text-[11px] text-red-500 mt-1">{presetError}</p>}
            <p className="text-[10px] text-muted-foreground mt-1">{topupPresets.length}/10 presets</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============ MAIN PAGE ============
export default function Page() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<BudgetItem[]>(DEFAULT_CATEGORIES.map(c => ({ category: c, limit: 0 })))
  const [topUps, setTopUps] = useState<TopUp[]>([])
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES])
  const [topupPresets, setTopupPresets] = useState<string[]>([...DEFAULT_TOPUP_PRESETS])
  const [borrows, setBorrows] = useState<BorrowRecord[]>([])
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpNote, setTopUpNote] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const realDataRef = useRef<{
    expenses: Expense[]
    budgets: BudgetItem[]
    topUps: TopUp[]
    borrows: BorrowRecord[]
    categories: string[]
    topupPresets: string[]
  } | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const storedExpenses = localStorage.getItem(STORAGE_EXPENSES)
      if (storedExpenses) {
        const parsed = JSON.parse(storedExpenses)
        if (Array.isArray(parsed)) setExpenses(parsed)
      }
      const storedBudgets = localStorage.getItem(STORAGE_BUDGETS)
      if (storedBudgets) {
        const parsed = JSON.parse(storedBudgets)
        if (Array.isArray(parsed)) setBudgets(parsed)
      }
      const storedTopUps = localStorage.getItem(STORAGE_TOPUPS)
      if (storedTopUps) {
        const parsed = JSON.parse(storedTopUps)
        if (Array.isArray(parsed)) setTopUps(parsed)
      }
      const storedCategories = localStorage.getItem(STORAGE_CATEGORIES)
      if (storedCategories) {
        const parsed = JSON.parse(storedCategories)
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed)
      }
      const storedPresets = localStorage.getItem(STORAGE_TOPUP_PRESETS)
      if (storedPresets) {
        const parsed = JSON.parse(storedPresets)
        if (Array.isArray(parsed) && parsed.length > 0) setTopupPresets(parsed)
      }
      const storedBorrows = localStorage.getItem(STORAGE_BORROWS)
      if (storedBorrows) {
        const parsed = JSON.parse(storedBorrows)
        if (Array.isArray(parsed)) setBorrows(parsed)
      }
    } catch { /* ignore parse errors */ }
  }, [])

  // Persist expenses
  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(expenses)) } catch { /* */ }
  }, [expenses, mounted, sampleMode])

  // Persist budgets
  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem(STORAGE_BUDGETS, JSON.stringify(budgets)) } catch { /* */ }
  }, [budgets, mounted, sampleMode])

  // Persist top-ups
  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem(STORAGE_TOPUPS, JSON.stringify(topUps)) } catch { /* */ }
  }, [topUps, mounted, sampleMode])

  // Persist categories
  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories)) } catch { /* */ }
  }, [categories, mounted, sampleMode])

  // Persist top-up presets
  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem(STORAGE_TOPUP_PRESETS, JSON.stringify(topupPresets)) } catch { /* */ }
  }, [topupPresets, mounted, sampleMode])

  // Persist borrows
  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem(STORAGE_BORROWS, JSON.stringify(borrows)) } catch { /* */ }
  }, [borrows, mounted, sampleMode])

  // Sync budgets when categories change
  useEffect(() => {
    if (!mounted) return
    setBudgets(prev => {
      const existing = new Map(prev.map(b => [b.category, b.limit]))
      return categories.map(cat => ({
        category: cat,
        limit: existing.get(cat) ?? 0,
      }))
    })
  }, [categories, mounted])

  const handleSampleToggle = (on: boolean) => {
    if (on) {
      realDataRef.current = { expenses, budgets, topUps, borrows, categories, topupPresets }
      setExpenses(makeSampleExpenses())
      setBudgets(SAMPLE_BUDGETS)
      setTopUps(makeSampleTopups())
      setBorrows(makeSampleBorrows())
    } else {
      if (realDataRef.current) {
        setExpenses(realDataRef.current.expenses)
        setBudgets(realDataRef.current.budgets)
        setTopUps(realDataRef.current.topUps)
        setBorrows(realDataRef.current.borrows)
        setCategories(realDataRef.current.categories)
        setTopupPresets(realDataRef.current.topupPresets)
      }
      realDataRef.current = null
    }
    setSampleMode(on)
  }

  const handleTopUp = () => {
    const parsed = parseFloat(topUpAmount)
    if (!isNaN(parsed) && parsed > 0) {
      const newTopUp: TopUp = {
        id: genId(),
        amount: parsed,
        note: topUpNote.trim() || 'Top Up',
        date: getToday(),
        createdAt: new Date().toISOString(),
      }
      setTopUps(prev => [newTopUp, ...prev])
    }
    setTopUpDialogOpen(false)
    setTopUpAmount('')
    setTopUpNote('')
  }

  const handleOpenTopUpDialog = () => {
    setTopUpAmount('')
    setTopUpNote('')
    setTopUpDialogOpen(true)
  }

  const totalTopUps = topUps.reduce((sum, t) => sum + t.amount, 0)
  const allTimeTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currentBalance = totalTopUps - allTimeTotal

  const screenTitle = screen === 'dashboard' ? 'ExpenseTrack' : screen === 'reports' ? 'Reports' : screen === 'budgets' ? 'Budgets' : 'Borrowing'

  return (
    <ErrorBoundary>
      {/* Outer wrapper - simulates phone on desktop */}
      <div className="min-h-screen bg-gray-200 flex items-start justify-center">
        {/* Phone container */}
        <div className="w-full max-w-[430px] min-h-screen bg-background relative shadow-2xl">
          {/* Android-style app bar */}
          <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 pt-[env(safe-area-inset-top,12px)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <HiBanknotes className="w-4 h-4" />
                </div>
                <h1 className="text-base font-semibold tracking-tight">{screenTitle}</h1>
              </div>
              <div className="flex items-center gap-2">
                {mounted && totalTopUps > 0 && (
                  <Badge className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border-0 ${currentBalance >= 0 ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-100'}`}>
                    <RiWallet3Line className="w-3 h-3 mr-1" />
                    {formatCurrency(Math.abs(currentBalance))}
                  </Badge>
                )}
                {screen === 'dashboard' && (
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <HiCog6Tooth className="w-4 h-4 text-white" />
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="sample-toggle-mobile" className="text-[10px] text-primary-foreground/70 cursor-pointer">Sample</Label>
                  <Switch id="sample-toggle-mobile" checked={sampleMode} onCheckedChange={handleSampleToggle} className="scale-75" />
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable content area */}
          <main className="pb-24 overflow-y-auto">
            {screen === 'dashboard' && (
              <DashboardScreen
                expenses={expenses}
                setExpenses={setExpenses}
                totalTopUps={totalTopUps}
                topUps={topUps}
                onTopUp={handleOpenTopUpDialog}
                categories={categories}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            )}
            {screen === 'reports' && (
              <ReportsScreen
                expenses={expenses}
                budgets={budgets}
                activeAgentId={activeAgentId}
                setActiveAgentId={setActiveAgentId}
                totalTopUps={totalTopUps}
                categories={categories}
              />
            )}
            {screen === 'budgets' && (
              <BudgetsScreen budgets={budgets} setBudgets={setBudgets} expenses={expenses} categories={categories} />
            )}
            {screen === 'borrowing' && (
              <BorrowingScreen borrows={borrows} setBorrows={setBorrows} />
            )}
          </main>

          {/* Bottom navigation - Material Design style */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-50 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex items-center justify-around py-1.5">
              {NAV_ITEMS.map(item => {
                const isActive = screen === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setScreen(item.id)}
                    className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[64px] min-h-[48px] justify-center active:scale-90 transition-transform"
                  >
                    <div className={`px-4 py-1 rounded-2xl transition-colors duration-200 ${isActive ? 'bg-primary/15' : ''}`}>
                      <div className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {item.icon}
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Top Up Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent className="max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HiPlus className="w-5 h-5 text-primary" /> Top Up Balance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="topup-amount" className="text-sm text-muted-foreground">Amount to add</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base font-medium">$</span>
                <Input
                  id="topup-amount"
                  type="number"
                  placeholder="0.00"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="pl-8 h-12 text-lg rounded-xl"
                  min="0"
                  step="0.01"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTopUp() }}
                  autoFocus
                />
              </div>
            </div>

            {/* Preset Note Chips */}
            <div>
              <Label className="text-sm text-muted-foreground">Quick Note</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {topupPresets.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setTopUpNote(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-transform active:scale-95 min-h-[32px] ${topUpNote === preset ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border'}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="topup-note" className="text-sm text-muted-foreground">Note (optional)</Label>
              <Input
                id="topup-note"
                placeholder="Custom note..."
                value={topUpNote}
                onChange={(e) => setTopUpNote(e.target.value)}
                className="h-11 rounded-xl mt-1"
                onKeyDown={(e) => { if (e.key === 'Enter') handleTopUp() }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">This amount will be added to your current balance of {formatCurrency(Math.max(currentBalance, 0))}.</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setTopUpDialogOpen(false)}
                className="flex-1 h-11 rounded-xl active:scale-95 transition-transform"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTopUp}
                disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground active:scale-95 transition-transform"
              >
                <HiPlus className="w-4 h-4 mr-1" /> Add Funds
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        categories={categories}
        setCategories={setCategories}
        topupPresets={topupPresets}
        setTopupPresets={setTopupPresets}
        expenses={expenses}
      />
    </ErrorBoundary>
  )
}
