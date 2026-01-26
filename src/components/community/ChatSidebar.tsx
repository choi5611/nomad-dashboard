import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Activity } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useAuth } from "@/store/useAuth"
import { useCityChat } from "@/hooks/useCityChat"
import UserProfileModal from "./UserProfileModal"
import FriendsList from "./FriendsList"
import DirectMessageView from "./DirectMessageView"
import ChatTabSwitcher from "./ChatTabSwitcher"
import CityChat from "./CityChat"
import OpenChatRoomList from "./OpenChatRoomList"
import { useMediaQuery } from "@/hooks/useMediaQuery"

export default function ChatSidebar() {
  const { 
    isChatOpen, 
    closeChat, 
    selectedCity, 
    isSidebarOpen, 
    activeChat, 
    setActiveChat,
    unreadState, 
    resetUnread, 
    activeTab, 
    setActiveTab,
    joinedRooms 
  } = useStore()
  const { user, profile } = useAuth()
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 767px)")

  // 도시 채팅 훅
  const { 
    messages, 
    onlineCount, 
    handleSendMessage, 
    loading, 
    hasNextPage, 
    isFetchingNextPage, 
    fetchNextPage 
  } = useCityChat(
    selectedCity?.name,
    user,
    profile
  )

  // 읽지 않은 메시지 계산
  const unreadCounts = useMemo(() => {
    const dmCount = Object.values(unreadState.dms).reduce((a, b) => a + b, 0)
    
    let groupRoomCount = 0
    let openRoomCount = 0

    // 내가 참여 중인 방들에 대해서만 알림 집계
    Object.entries(unreadState.rooms).forEach(([roomId, count]) => {
      const room = joinedRooms.find(r => r.id === roomId)
      if (room) {
        if (room.is_open) openRoomCount += count
        else groupRoomCount += count
      }
    })

    return {
      city: unreadState.city,
      friends: dmCount + groupRoomCount,
      open: openRoomCount,
    }
  }, [unreadState, joinedRooms])

  const openProfile = (id: string) => {
    setSelectedProfileId(id)
    setIsProfileOpen(true)
  }

  const handleTabChange = (tab: 'city' | 'friends' | 'open') => {
    setActiveTab(tab)
    setActiveChat(null)
    if (tab === 'city') {
      resetUnread('city')
    }
  }

  const handleOpenRoomClick = (roomId: string, roomName: string) => {
    setActiveChat({ type: 'open', id: roomId, name: roomName })
    resetUnread('room', roomId)
  }

  const handleRoomCreated = (roomId: string, roomName: string, isOpen: boolean) => {
    // 채팅방 생성 후 FRIENDS 탭으로 이동
    setActiveTab('friends')
    setActiveChat({ type: isOpen ? 'open' : 'group', id: roomId, name: roomName })
    resetUnread('room', roomId)
  }

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0, right: (isSidebarOpen && !isMobile) ? 384 : 0 }}
          animate={{
            x: 0,
            opacity: 1,
            right: (isSidebarOpen && !isMobile) ? 384 : 0
          }}
          exit={{ x: 400, opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200,
            right: { duration: 0.3 }
          }}
          className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-slate-900/90 backdrop-blur-3xl border-l border-white/10 z-[49] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${isMobile ? 'pb-[72px]' : ''}`}
        >
          {/* Header */}
          <div className="p-4 border-b border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white tracking-widest uppercase">
                  Terminal
                </h2>
              </div>
              <button onClick={closeChat} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <ChatTabSwitcher
              activeTab={activeTab}
              unreadCounts={unreadCounts}
              onTabChange={handleTabChange}
            />
            <p className="text-[10px] text-cyan-400/50 font-mono tracking-tighter truncate">
              SECURE CONNECTION TO {selectedCity?.name.toUpperCase()} TERMINAL...
            </p>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeChat ? (
              <DirectMessageView
                chat={activeChat}
                onBack={() => setActiveChat(null)}
              />
            ) : activeTab === 'city' ? (
              <CityChat
                cityName={selectedCity?.name || ''}
                messages={messages}
                onlineCount={onlineCount}
                userId={user?.id}
                onSendMessage={handleSendMessage}
                onProfileClick={openProfile}
                disabled={!user}
                loading={loading}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onFetchNextPage={fetchNextPage}
              />
            ) : activeTab === 'friends' ? (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <FriendsList />
              </div>
            ) : (
              <OpenChatRoomList
                user={user}
                unreadState={unreadState}
                onRoomClick={handleOpenRoomClick}
                onRoomCreated={handleRoomCreated}
              />
            )}
          </div>

          {/* Holographic Grid Decor */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
            <div className="w-full h-full bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>

          {/* Context Modals */}
          {selectedProfileId && (
            <UserProfileModal
              userId={selectedProfileId}
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
