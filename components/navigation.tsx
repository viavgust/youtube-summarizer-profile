"use client"

import { useState } from "react"
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Youtube, Home, History, User as UserIcon, Settings, Menu, X } from "lucide-react"
import SignOutButton from "./sign-out-button"

interface NavigationProps {
  user: User | null
  currentPage: string
  onPageChange: (page: string) => void
}

export default function Navigation({ user, currentPage, onPageChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const baseNavItems = [
    { id: "home", label: "Главная", icon: Home },
    { id: "history", label: "История", icon: History },
    { id: "profile", label: "Профиль", icon: UserIcon },
  ]

  const renderNavItems = (isMobile: boolean) => (
    <>
      {baseNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.id}
            variant={currentPage === item.id ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              onPageChange(item.id)
              if (isMobile) setIsMobileMenuOpen(false)
            }}
            className={`gap-2 ${isMobile ? 'w-full justify-start' : ''} ${
              currentPage === item.id
                ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Button>
        )
      })}
    </>
  )

  const renderAuthSection = (isMobile: boolean) => {
    if (user) {
      return (
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
          <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
          <SignOutButton />
        </div>
      )
    }
    return (
      <Link href="/auth/sign-in" passHref>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${isMobile ? 'w-full justify-start' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
        >
          <Settings className="h-4 w-4" />
          Вход
        </Button>
      </Link>
    )
  }

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block border-b border-border/40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-purple-500" />
            <span className="font-semibold text-lg text-gray-900 dark:text-white">AI Summarizer</span>
          </div>
          <nav className="flex items-center gap-1">
            {renderNavItems(false)}
            {renderAuthSection(false)}
          </nav>
        </div>
      </header>

      {/* Mobile Navigation */}
      <header className="md:hidden border-b border-border/40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-purple-500" />
            <span className="font-semibold text-lg text-gray-900 dark:text-white">AI Summarizer</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border/40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {renderNavItems(true)}
              {renderAuthSection(true)}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
