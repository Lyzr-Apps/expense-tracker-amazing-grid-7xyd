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
  HiHome,
  HiDocumentChartBar,
  HiCurrencyDollar,
  HiChatBubbleLeftRight,
  HiPlus,
  HiPencilSquare,
  HiTrash,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiExclamationTriangle,
  HiCheckCircle,
  HiLightBulb,
  HiPaperAirplane,
  HiShoppingCart,
  HiTruck,
  HiHeart,
  HiFilm,
  HiEllipsisHorizontalCircle,
  HiCalendarDays,
  HiChartPie,
  HiXMark,
  HiCheck,
  HiArrowPath,
  HiBanknotes,
  HiSparkles,
  HiInformationCircle,
  HiWallet,
  HiMinus,
} from 'react-icons/hi2'
import { RiHomeSmileLine, RiRestaurantLine, RiWallet3Line } from 'react-icons/ri'

// ============ CONSTANTS ============
const AGENT_ID = '69a04fd17549c200e00d2fb9'
const STORAGE_EXPENSES = 'expensetrack_expenses'
const STORAGE_BUDGETS = 'expensetrack_budgets'
const STORAGE_BALANCE = 'expensetrack_balance'
const STORAGE_TOPUPS = 'expensetrack_topups'

const CATEGORIES = ['Food', 'Household', 'Travel', 'Entertainment', 'Health', 'Other'] as const
type Category = (typeof CATEGORIES)[number]

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

interface ChatMessage {
  role: 'user' | 'agent'
  content: string
  data?: AgentReport | null
  timestamp: string
}

interface TopUp {
  id: string
  amount: number
  note: string
  date: string
  createdAt: string
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

// ============ HELPERS ============
function getCategoryIcon(category: string) {
  switch (category) {
    case 'Food': return <RiRestaurantLine className="w-4 h-4" />
    case 'Household': return <RiHomeSmileLine className="w-4 h-4" />
    case 'Travel': return <HiTruck className="w-4 h-4" />
    case 'Entertainment': return <HiFilm className="w-4 h-4" />
    case 'Health': return <HiHeart className="w-4 h-4" />
    default: return <HiEllipsisHorizontalCircle className="w-4 h-4" />
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'Food': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'Household': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Travel': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'Entertainment': return 'bg-pink-100 text-pink-700 border-pink-200'
    case 'Health': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getCategoryBadgeSelected(category: string) {
  switch (category) {
    case 'Food': return 'bg-orange-500 text-white border-orange-600'
    case 'Household': return 'bg-blue-500 text-white border-blue-600'
    case 'Travel': return 'bg-purple-500 text-white border-purple-600'
    case 'Entertainment': return 'bg-pink-500 text-white border-pink-600'
    case 'Health': return 'bg-red-500 text-white border-red-600'
    default: return 'bg-gray-500 text-white border-gray-600'
  }
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
type Screen = 'dashboard' | 'reports' | 'budgets' | 'insights'

const NAV_ITEMS: { id: Screen; label: string; iconActive: React.ReactNode; iconInactive: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', iconActive: <HiHome className="w-6 h-6" />, iconInactive: <HiHome className="w-6 h-6" /> },
  { id: 'reports', label: 'Reports', iconActive: <HiDocumentChartBar className="w-6 h-6" />, iconInactive: <HiDocumentChartBar className="w-6 h-6" /> },
  { id: 'budgets', label: 'Budgets', iconActive: <HiCurrencyDollar className="w-6 h-6" />, iconInactive: <HiCurrencyDollar className="w-6 h-6" /> },
  { id: 'insights', label: 'Chat', iconActive: <HiChatBubbleLeftRight className="w-6 h-6" />, iconInactive: <HiChatBubbleLeftRight className="w-6 h-6" /> },
]

// ============ BALANCE CARD ============
function BalanceCard({
  totalTopUps,
  totalSpent,
  topUps,
  onTopUp,
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

      {/* Top-up history toggle */}
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

      {/* Top-up history list */}
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

// ============ DASHBOARD SCREEN ============
function DashboardScreen({
  expenses, setExpenses, budgets, sampleMode, totalTopUps, topUps, onTopUp
}: {
  expenses: Expense[]
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
  budgets: BudgetItem[]
  sampleMode: boolean
  totalTopUps: number
  topUps: TopUp[]
  onTopUp: () => void
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
              {CATEGORIES.map(cat => (
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
            <p className="text-xs text-foreground">Expense Insights Agent - Ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ REPORTS SCREEN ============
function ReportsScreen({
  expenses, budgets, activeAgentId, setActiveAgentId, totalTopUps
}: {
  expenses: Expense[]
  budgets: BudgetItem[]
  activeAgentId: string | null
  setActiveAgentId: (id: string | null) => void
  totalTopUps: number
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
                  <HiChatBubbleLeftRight className="w-4 h-4 text-primary" /> Analysis
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
  budgets, setBudgets, expenses
}: {
  budgets: BudgetItem[]
  setBudgets: React.Dispatch<React.SetStateAction<BudgetItem[]>>
  expenses: Expense[]
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

// ============ INSIGHTS CHAT SCREEN ============
function InsightsScreen({
  expenses, budgets, activeAgentId, setActiveAgentId, totalTopUps
}: {
  expenses: Expense[]
  budgets: BudgetItem[]
  activeAgentId: string | null
  setActiveAgentId: (id: string | null) => void
  totalTopUps: number
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const allTimeTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currentBalance = totalTopUps - allTimeTotal

  const quickQuestions = [
    "This week's summary",
    'Biggest expense',
    'Food vs Travel',
    'Budget check',
  ]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const buildContext = useCallback(() => {
    const expenseLines = expenses.length > 0
      ? expenses.slice(0, 100).map(e => `  - ${e.date} | ${e.category} | $${e.amount.toFixed(2)} | ${e.note || 'No note'}`).join('\n')
      : '  No expenses recorded.'
    const budgetLines = budgets.map(b => `  - ${b.category}: $${b.limit} limit`).join('\n')
    const balanceInfo = totalTopUps > 0
      ? `\n\nBALANCE: Total top-ups $${totalTopUps.toFixed(2)}, Current balance $${currentBalance.toFixed(2)}, Total spent $${allTimeTotal.toFixed(2)}`
      : ''
    return `EXPENSES:\n${expenseLines}\n\nBUDGETS:\n${budgetLines}${balanceInfo}`
  }, [expenses, budgets, totalTopUps, currentBalance, allTimeTotal])

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setActiveAgentId(AGENT_ID)

    const context = buildContext()
    const fullMessage = `Here is my expense data for context:\n\n${context}\n\nMy question: ${msg}`

    try {
      const result = await callAIAgent(fullMessage, AGENT_ID)
      if (result.success && result?.response?.status === 'success') {
        let data = result.response.result as unknown
        if (typeof data === 'string') {
          try { data = JSON.parse(data) } catch { /* keep string */ }
        }
        const agentData = data as AgentReport
        const answerText = agentData?.chat_answer ?? agentData?.summary ?? (typeof data === 'string' ? (data as string) : 'Analysis complete. See the details below.')
        const agentMsg: ChatMessage = { role: 'agent', content: answerText, data: typeof data === 'object' ? agentData : null, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, agentMsg])
      } else {
        const errMsg: ChatMessage = { role: 'agent', content: result?.error ?? 'Sorry, I could not process your question. Please try again.', timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, errMsg])
      }
    } catch {
      const errMsg: ChatMessage = { role: 'agent', content: 'Network error. Please try again.', timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, errMsg])
    }

    setLoading(false)
    setActiveAgentId(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] px-4 pt-4">
      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <HiChatBubbleLeftRight className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Ask about your spending</p>
            <p className="text-xs text-muted-foreground mt-1">AI-powered expense insights</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3.5 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border shadow-md rounded-bl-md'}`}>
              <div className={`text-sm ${msg.role === 'user' ? '' : 'text-foreground'}`}>
                {renderMarkdown(msg.content)}
              </div>
              {msg.role === 'agent' && msg.data && (
                <div className="mt-3 space-y-2">
                  {(msg.data?.total_spent ?? 0) > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5">
                      <HiBanknotes className="w-4 h-4 text-primary" />
                      <span className="text-xs">Total: <strong className="font-semibold">{formatCurrency(msg.data.total_spent)}</strong></span>
                    </div>
                  )}
                  {Array.isArray(msg.data?.category_breakdown) && msg.data.category_breakdown.length > 0 && (
                    <div className="space-y-1">
                      {msg.data.category_breakdown.slice(0, 4).map((cat, ci) => (
                        <div key={ci} className="flex items-center justify-between text-xs p-2 rounded-xl bg-secondary/50">
                          <span className="flex items-center gap-1.5">
                            {getCategoryIcon(cat?.category ?? '')} {cat?.category}
                          </span>
                          <span className="font-medium">{formatCurrency(cat?.total ?? 0)} ({(cat?.percentage ?? 0).toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(msg.data?.budget_alerts) && msg.data.budget_alerts.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {msg.data.budget_alerts.slice(0, 2).map((ba, bi) => (
                        <div key={bi} className="text-xs flex items-start gap-1.5 p-2 rounded-xl bg-yellow-50">
                          <HiExclamationTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                          <span>{ba?.message ?? ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(msg.data?.insights) && msg.data.insights.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {msg.data.insights.slice(0, 2).map((ins, ii) => (
                        <div key={ii} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                          <HiLightBulb className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                          <span>{ins?.text ?? ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border shadow-md rounded-2xl rounded-bl-md p-4">
              <div className="flex items-center gap-2">
                <HiArrowPath className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Question Chips */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-secondary text-secondary-foreground border border-border active:scale-95 transition-transform min-h-[36px]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 pb-2 border-t border-border">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about spending..."
          className="flex-1 h-11 rounded-xl"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          disabled={loading}
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="bg-primary text-primary-foreground active:scale-90 transition-transform shrink-0 h-11 w-11 rounded-xl p-0"
        >
          <HiPaperAirplane className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

// ============ MAIN PAGE ============
export default function Page() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<BudgetItem[]>(CATEGORIES.map(c => ({ category: c, limit: 0 })))
  const [topUps, setTopUps] = useState<TopUp[]>([])
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpNote, setTopUpNote] = useState('')

  const realDataRef = useRef<{ expenses: Expense[]; budgets: BudgetItem[]; topUps: TopUp[] } | null>(null)

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
      // Migrate old single balance to top-up entry
      const oldBalance = localStorage.getItem(STORAGE_BALANCE)
      if (oldBalance && !localStorage.getItem(STORAGE_TOPUPS)) {
        const bal = parseFloat(oldBalance)
        if (!isNaN(bal) && bal > 0) {
          const migrated: TopUp = { id: genId(), amount: bal, note: 'Initial balance', date: getToday(), createdAt: new Date().toISOString() }
          setTopUps([migrated])
          localStorage.removeItem(STORAGE_BALANCE)
        }
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

  const handleSampleToggle = (on: boolean) => {
    if (on) {
      realDataRef.current = { expenses, budgets, topUps }
      setExpenses(makeSampleExpenses())
      setBudgets(SAMPLE_BUDGETS)
      setTopUps(makeSampleTopups())
    } else {
      if (realDataRef.current) {
        setExpenses(realDataRef.current.expenses)
        setBudgets(realDataRef.current.budgets)
        setTopUps(realDataRef.current.topUps)
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

  const screenTitle = screen === 'dashboard' ? 'ExpenseTrack' : screen === 'reports' ? 'Reports' : screen === 'budgets' ? 'Budgets' : 'Insights'

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
              <div className="flex items-center gap-3">
                {mounted && totalTopUps > 0 && (
                  <Badge className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border-0 ${currentBalance >= 0 ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-100'}`}>
                    <RiWallet3Line className="w-3 h-3 mr-1" />
                    {formatCurrency(Math.abs(currentBalance))}
                  </Badge>
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
                budgets={budgets}
                sampleMode={sampleMode}
                totalTopUps={totalTopUps}
                topUps={topUps}
                onTopUp={handleOpenTopUpDialog}
              />
            )}
            {screen === 'reports' && (
              <ReportsScreen
                expenses={expenses}
                budgets={budgets}
                activeAgentId={activeAgentId}
                setActiveAgentId={setActiveAgentId}
                totalTopUps={totalTopUps}
              />
            )}
            {screen === 'budgets' && (
              <BudgetsScreen budgets={budgets} setBudgets={setBudgets} expenses={expenses} />
            )}
            {screen === 'insights' && (
              <InsightsScreen
                expenses={expenses}
                budgets={budgets}
                activeAgentId={activeAgentId}
                setActiveAgentId={setActiveAgentId}
                totalTopUps={totalTopUps}
              />
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
                        {isActive ? item.iconActive : item.iconInactive}
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
            <div>
              <Label htmlFor="topup-note" className="text-sm text-muted-foreground">Note (optional)</Label>
              <Input
                id="topup-note"
                placeholder="e.g., Salary, Freelance, Gift..."
                value={topUpNote}
                onChange={(e) => setTopUpNote(e.target.value)}
                className="h-11 rounded-xl mt-2"
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
    </ErrorBoundary>
  )
}
