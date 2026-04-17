const TABS = [
  { label: 'Gravity Wall',          icon: '▬' },
  { label: 'L-Cantilever Wall',     icon: '⌐' },
  { label: 'Mini Pile Wall',        icon: '⚙' },
  { label: 'Skin Wall + Soil Nails',icon: '⊕' },
]

export default function WallTypeSelector({ active, onChange }) {
  return (
    <div className="bg-white border-b border-gray-200 flex overflow-x-auto">
      {TABS.map((t, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
            ${active === i
              ? 'border-primary text-primary bg-pale'
              : 'border-transparent text-gray-500 hover:text-primary hover:bg-gray-50'
            }`}
        >
          <span className="text-base">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  )
}
