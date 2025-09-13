"use client"

import { useState } from "react"
import type { User } from '@supabase/supabase-js'
import YouTubeSummarizer from "./youtube-summarizer"
import AuthPage from "./auth-page"
import ProfilePage from "./profile-page"
import HistoryPage from "./history-page"
import Navigation from "./navigation"

interface DemoAppProps {
  user: User | null
}

export default function DemoApp({ user }: DemoAppProps) {
  const [currentPage, setCurrentPage] = useState("home")

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <YouTubeSummarizer />
      case "auth":
        return <AuthPage />
      case "profile":
        return <ProfilePage user={user} />
      case "history":
        return <HistoryPage />
      default:
        return <YouTubeSummarizer />
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation user={user} currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1">{renderPage()}</div>
    </div>
  )
}
