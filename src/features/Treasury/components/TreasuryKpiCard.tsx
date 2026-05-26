import type { ReactNode } from 'react'

interface TreasuryKpiCardProps {
  icon: ReactNode
  label: string
  description?: string
  value: string
  color?: 'primary' | 'accent' | 'secondary' | 'navy' | 'red'
}

const colorMap = {
  primary: 'bg-(--color-myPrimary)/10 text-(--color-myPrimary)',
  accent: 'bg-(--color-myAccent)/10 text-(--color-myAccent)',
  secondary: 'bg-(--color-mySecondary)/10 text-(--color-mySecondary)',
  navy: 'bg-(--color-navy)/10 text-(--color-navy)',
  red: 'bg-red-100 text-red-600',
}

export default function TreasuryKpiCard({ icon, label, description, value, color = 'primary' }: TreasuryKpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${colorMap[color]} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
        {description && (
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{description}</p>
        )}
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
