"use client"

import { useState } from "react"
import Header from "@/components/layout/header"
import Sidebar from "@/components/layout/sidebar"

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} pt-20`}
      >
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-25 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "ml-0"}`}>
        <Header variant="home" />

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-24 left-4 z-30 bg-[var(--primary-color)] text-white p-3 rounded-xl shadow-lg hover:bg-[#2fa692] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        >
          <span className="text-lg">{sidebarOpen ? "✕" : "☰"}</span>
        </button>

        <section className="flex items-center justify-between min-h-screen px-[5%] mt-20 gap-12 flex-wrap">
          <div className="flex-1 min-w-[300px] animate-fade-slide-in">
            <h1 className="font-montserrat text-7xl font-bold text-[var(--text-dark)] leading-tight mb-4">
              <span className="text-[var(--primary-color)] inline-block animate-pulse-scale">Keep</span>ick
            </h1>
            <p className="text-xl text-gray-600 mt-4 max-w-lg leading-relaxed">
              세련된 인터페이스, 강렬한 인상. <br />
              새로운 경험을 만드는 Keepick과 함께하세요.
            </p>
            <button className="mt-8 bg-gradient-to-r from-[var(--primary-color)] to-[#28a795] text-white px-10 py-4 text-xl rounded-xl font-semibold transition-all duration-400 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden group">
              <span className="relative z-10">Get Started</span>
              <div className="absolute top-0 left-[-100px] w-15 h-full bg-white/40 transform skew-x-[-20deg] transition-all duration-600 group-hover:left-[120%]"></div>
            </button>
          </div>

          <div className="flex-[1.2] flex justify-center items-center min-w-[350px] animate-float">
            <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto filter brightness-105"
                poster="/placeholder.svg?height=400&width=600&text=Keepick+Demo+Video"
              >
                <source src="/main-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
