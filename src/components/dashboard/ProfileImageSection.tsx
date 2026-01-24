import { Camera } from "lucide-react"
import NomadRankBadge from "./NomadRankBadge"
import MedalCollection from "./MedalCollection"
import { Award } from "lucide-react"

interface ProfileImageSectionProps {
  email: string | undefined
  avatarUrl: string
  userId: string
  xp: number
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
}

export default function ProfileImageSection({
  email,
  avatarUrl,
  userId,
  xp,
  onFileChange,
  uploading
}: ProfileImageSectionProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full border-4 border-cyan-500/20 shadow-xl overflow-hidden relative">
          <img
            src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
            alt="Profile"
            className="w-full h-full object-cover"
          />
          <label
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            htmlFor="avatar-upload"
          >
            <Camera className="w-6 h-6 text-white" />
          </label>
        </div>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
          disabled={uploading}
        />
      </div>
      <p className="mt-4 text-sm text-white/40">{email}</p>

      {/* Nomad Rank Badge */}
      <NomadRankBadge xp={xp} />

      {/* Visit Medals Collection */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Award className="w-4 h-4 text-cyan-400" />
          <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] opacity-60">Certified Medals</h3>
        </div>
        <MedalCollection />
      </div>
    </div>
  )
}
