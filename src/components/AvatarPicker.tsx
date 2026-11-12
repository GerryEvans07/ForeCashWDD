'use client'

// Pilihan avatar (pengganti avatar_picker() di PHP). Dipakai di form daftar dan halaman Akun.
import clsx from 'clsx'
import Avatar, { AVATARS } from '@/components/Avatar'

export default function AvatarPicker({ value, onChange, name = 'avatar' }: { value: string; onChange: (id: string) => void; name?: string }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {Object.entries(AVATARS).map(([id, a]) => (
        <label key={id} className="cursor-pointer text-center">
          <input type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} className="sr-only" />
          <span
            className={clsx(
              'block rounded-2xl border-2 p-1.5 transition-all',
              value === id ? 'border-hsOrange bg-orange-50' : 'border-transparent bg-slate-50',
            )}
          >
            <Avatar id={id} size={44} />
          </span>
          <span className="text-[10px] font-bold text-slate-500">{a.nama}</span>
        </label>
      ))}
    </div>
  )
}
