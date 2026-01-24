import { Sparkles } from "lucide-react"
import OpenChatRoomItem from "./OpenChatRoomItem"
import { OPEN_CHAT_ROOMS } from "@/lib/constants"

interface OpenChatRoomListProps {
  unreadState: { rooms: Record<string, number> }
  onRoomClick: (roomId: string, roomName: string) => void
}

export default function OpenChatRoomList({ unreadState, onRoomClick }: OpenChatRoomListProps) {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
      <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
        <Sparkles className="w-3 h-3" /> Anonymous Lounges
      </h3>
      <div className="space-y-3">
        <OpenChatRoomItem
          name="Global Nomad Lounge"
          participants={128}
          unreadCount={unreadState.rooms[OPEN_CHAT_ROOMS.GENERAL]}
          onClick={() => onRoomClick(OPEN_CHAT_ROOMS.GENERAL, 'Global Nomad Lounge')}
        />
        <OpenChatRoomItem
          name="Digital Nomad Tips"
          participants={56}
          unreadCount={unreadState.rooms[OPEN_CHAT_ROOMS.LOUNGE]}
          onClick={() => onRoomClick(OPEN_CHAT_ROOMS.LOUNGE, 'Digital Nomad Tips')}
        />
      </div>
    </div>
  )
}
