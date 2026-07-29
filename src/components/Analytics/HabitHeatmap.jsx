import { format, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns'

const WEEKS = 16
const DAYS  = ['S','M','T','W','T','F','S']

function cellColor(done, missed) {
  if (!done && !missed) return 'bg-zinc-100 dark:bg-zinc-800'
  const total = done + missed
  const rate  = done / total
  if (rate === 1)      return 'bg-emerald-400 dark:bg-emerald-500'
  if (rate >= 0.75)    return 'bg-emerald-300 dark:bg-emerald-600'
  if (rate >= 0.5)     return 'bg-amber-300   dark:bg-amber-500'
  if (rate >= 0.25)    return 'bg-red-300     dark:bg-red-500'
  return                      'bg-red-400     dark:bg-red-600'
}

export default function HabitHeatmap({ heatmap = {} }) {
  const today      = new Date()
  const gridStart  = startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 0 })

  // Build week columns
  const weeks = Array.from({ length: WEEKS }, (_, wi) => {
    const weekStart = addDays(gridStart, wi * 7)
    return Array.from({ length: 7 }, (_, di) => addDays(weekStart, di))
  })

  // Month labels
  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const m = week[0].getMonth()
    if (m !== lastMonth) { monthLabels.push({ wi, label: format(week[0], 'MMM') }); lastMonth = m }
  })

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-6">
            {monthLabels.map(({ wi, label }) => (
              <div key={wi} className="text-[10px] font-semibold text-zinc-400"
                style={{ marginLeft: `${wi === 0 ? 0 : (wi - (monthLabels[monthLabels.indexOf(monthLabels.find(x=>x.wi===wi))-1]?.wi??0))*14}px` }}>
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1">
              {DAYS.map((d, i) => (
                <div key={i} className={`w-4 h-3 text-[9px] font-bold text-zinc-400 flex items-center ${i % 2 === 0 ? '' : 'opacity-0'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  const ds    = format(day, 'yyyy-MM-dd')
                  const data  = heatmap[ds] || { done: 0, missed: 0 }
                  const isTod = isSameDay(day, today)
                  const isFut = day > today

                  return (
                    <div
                      key={di}
                      title={`${format(day,'MMM d')} — ✅ ${data.done} done, ❌ ${data.missed} missed`}
                      className={`w-3 h-3 rounded-[3px] transition-all cursor-default
                        ${isFut ? 'opacity-20 ' : ''}
                        ${isTod ? 'ring-2 ring-brand-500 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 ' : ''}
                        ${cellColor(data.done, data.missed)}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 ml-6">
            <span className="text-[10px] text-zinc-400 font-medium">Less</span>
            {['bg-zinc-100 dark:bg-zinc-800','bg-emerald-300 dark:bg-emerald-600','bg-emerald-400 dark:bg-emerald-500','bg-amber-300 dark:bg-amber-500','bg-red-300 dark:bg-red-500'].map((c,i) => (
              <div key={i} className={`w-3 h-3 rounded-[3px] ${c}`} />
            ))}
            <span className="text-[10px] text-zinc-400 font-medium">More</span>
            <span className="ml-2 text-[10px] text-zinc-300 dark:text-zinc-600">Hover for details</span>
          </div>
        </div>
      </div>
    </div>
  )
}
