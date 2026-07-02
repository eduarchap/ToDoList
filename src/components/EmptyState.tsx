import { CheckCircleIcon } from './icons'

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 text-brand-400">
        <CheckCircleIcon className="h-7 w-7" />
      </div>
      <p className="text-[15px] font-medium text-slate-200">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}
