"use client"

import { useState } from "react"
import YouTubeSummarizer from "./youtube-summarizer"
import AuthPage from "./auth-page"
import ProfilePage from "./profile-page"
import HistoryPage from "./history-page"
import Navigation from "./navigation"

export default function DemoApp() {
  const [currentPage, setCurrentPage] = useState("home")

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <YouTubeSummarizer />
      case "auth":
        return <AuthPage />
      case "profile":
        return <ProfilePage />
      case "history":
        return <HistoryPage />
      default:
        return <YouTubeSummarizer />
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1">{renderPage()}</div>
    </div>
  )
}
