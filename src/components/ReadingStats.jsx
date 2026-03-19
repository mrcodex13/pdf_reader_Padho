import { memo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts'
import { BookOpen, TrendingUp, Star, Layers } from 'lucide-react'

function ReadingStats({ books = [] }) {
  if (books.length === 0) return null

  // ── Data prep ──────────────────────────────────────────
  const progressData = books
    .filter((b) => b.progress > 0)
    .map((b) => ({
      name: b.title.length > 14 ? b.title.slice(0, 14) + '…' : b.title,
      progress: b.progress,
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6)

  const totalBooks = books.length
  const booksStarted = books.filter((b) => b.progress > 0).length
  const booksFinished = books.filter((b) => b.progress >= 100).length
  const avgProgress =
    books.length > 0
      ? Math.round(books.reduce((sum, b) => sum + (b.progress || 0), 0) / books.length)
      : 0
  const mostRead = books.reduce(
    (best, b) => (b.progress > (best?.progress || 0) ? b : best),
    null
  )

  const radialData = [
    { name: 'Avg Progress', value: avgProgress, fill: '#2d6be4' },
  ]

  // ── Custom tooltip ──────────────────────────────────────
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-card text-sm">
          <p className="font-medium text-heading">{payload[0].payload.name}</p>
          <p className="text-primary">{payload[0].value}% read</p>
        </div>
      )
    }
    return null
  }

  const COLORS = ['#2d6be4', '#4f8ef7', '#7aaeff', '#a8c8ff', '#c5d9ff', '#ddeaff']

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="font-heading text-xl font-semibold text-heading">Reading Stats</h2>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Layers className="w-5 h-5 text-primary" />}
          label="Total Books"
          value={totalBooks}
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          label="Started"
          value={booksStarted}
        />
        <StatCard
          icon={<Star className="w-5 h-5 text-primary" />}
          label="Finished"
          value={booksFinished}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          label="Avg Progress"
          value={`${avgProgress}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart — progress per book */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="font-heading font-semibold text-heading mb-1">Progress by Book</h3>
          <p className="text-xs text-muted mb-4">How far you've read in each book</p>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={progressData} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6a6f73' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#6a6f73' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0f4ff' }} />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                  {progressData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted text-sm">
              Start reading a book to see progress here
            </div>
          )}
        </div>

        {/* Right column — radial + most read */}
        <div className="flex flex-col gap-4">
          {/* Radial chart — overall progress */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-card flex-1">
            <h3 className="font-heading font-semibold text-heading mb-1">Overall Progress</h3>
            <p className="text-xs text-muted mb-2">Average across all books</p>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={140}>
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="90%"
                  data={radialData}
                  startAngle={90}
                  endAngle={90 - (avgProgress / 100) * 360}
                >
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#e0e0e0' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-2xl font-heading font-bold text-primary -mt-4">
              {avgProgress}%
            </p>
          </div>

          {/* Most read book */}
          {mostRead && mostRead.progress > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-card">
              <p className="text-xs text-primary font-medium mb-1">⭐ Most Read</p>
              <p className="font-heading font-semibold text-heading text-sm line-clamp-2">
                {mostRead.title}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${mostRead.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1">{mostRead.progress}% complete</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-heading font-bold text-heading text-lg">{value}</p>
      </div>
    </div>
  )
}

export default memo(ReadingStats)