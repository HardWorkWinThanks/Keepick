"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useTimelineAlbum } from "../model/useTimelineAlbum"
import type { TimelineEvent } from "@/entities/album"

interface TimelineAlbumPageProps {
  groupId: string
  albumId: string
}

// 섹션별 이미지 레이아웃 컴포넌트
function TimelineImageLayout({ event, index }: { event: TimelineEvent; index: number }) {
  if (!event.images) return null

  const layoutProps = {
    0: { // Section 1: 큰 이미지 왼쪽 상단, 작은 이미지들 오른쪽 하단 겹침
      mainClass: "absolute top-0 left-0 w-[65%] h-[70%] transform rotate-[-2deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[15%] right-[5%] w-[35%] h-[35%] transform rotate-[3deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[25%] w-[30%] h-[30%] transform rotate-[-5deg] z-15 overflow-hidden",
      filters: ["", "", ""]
    },
    1: { // Section 2: 큰 이미지 오른쪽, 작은 이미지들 왼쪽 하단
      mainClass: "absolute top-0 right-0 w-[65%] h-[70%] transform rotate-[1deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[10%] left-[5%] w-[35%] h-[35%] transform rotate-[-4deg] z-20 overflow-hidden", 
      small2Class: "absolute bottom-[25%] left-[25%] w-[30%] h-[30%] transform rotate-[6deg] z-15 overflow-hidden",
      filters: ["grayscale", "", ""]
    },
    2: { // Section 3: 큰 이미지 왼쪽, 작은 이미지들 오른쪽
      mainClass: "absolute top-0 left-0 w-[65%] h-[70%] transform rotate-[-1deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[20%] right-[5%] w-[35%] h-[35%] transform rotate-[4deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[25%] w-[30%] h-[30%] transform rotate-[-3deg] z-15 overflow-hidden",
      filters: ["contrast-150", "", "grayscale"]
    },
    3: { // Section 4: 큰 이미지 중앙-오른쪽, 작은 이미지들 하단
      mainClass: "absolute top-0 left-1/2 transform -translate-x-1/2 w-[60%] h-[65%] rotate-[2deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[5%] left-[10%] w-[35%] h-[35%] transform rotate-[-2deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[10%] w-[35%] h-[35%] transform rotate-[5deg] z-15 overflow-hidden",
      filters: ["", "grayscale", ""]
    }
  }

  const layout = layoutProps[index % 4 as keyof typeof layoutProps]

  return (
    <>
      {/* Main large image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: index % 2 === 0 ? -2 : 2 }}
        whileInView={{ opacity: 1, scale: 1, rotate: index % 2 === 0 ? -2 : 2 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className={layout.mainClass}
      >
        <img
          src={event.images[0]?.src || "/placeholder.svg"}
          alt={`${event.title} main`}
          className={`w-full h-full object-cover ${layout.filters[0]}`}
        />
      </motion.div>

      {/* Small image 1 */}
      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50, rotate: 3 }}
        whileInView={{ opacity: 1, x: 0, rotate: 3 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        viewport={{ once: true }}
        className={layout.small1Class}
      >
        <img
          src={event.images[1]?.src || "/placeholder.svg"}
          alt={`${event.title} detail 1`}
          className={`w-full h-full object-cover ${layout.filters[1]}`}
        />
      </motion.div>

      {/* Small image 2 */}
      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30, rotate: -5 }}
        whileInView={{ opacity: 1, x: 0, rotate: -5 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        viewport={{ once: true }}
        className={layout.small2Class}
      >
        <img
          src={event.images[2]?.src || "/placeholder.svg"}
          alt={`${event.title} detail 2`}
          className={`w-full h-full object-cover ${layout.filters[2]}`}
        />
      </motion.div>
    </>
  )
}

export default function TimelineAlbumPage({ groupId, albumId }: TimelineAlbumPageProps) {
  const { timelineEvents, loading } = useTimelineAlbum(groupId, albumId)
  

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-keepick-primary mb-4">타임라인을 불러오는 중...</div>
          <div className="w-8 h-8 border-2 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-8 py-4">
          <Link href={`/group/${groupId}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={20} />
            <span className="font-keepick-primary text-sm">돌아가기</span>
          </Link>
          <h1 className="font-keepick-heavy text-xl tracking-wider">ALBUM {albumId} TIMELINE</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 bg-[#111111]">
        {timelineEvents.map((event, index) => (
          <motion.section
            key={event.id}
            id={`section-${index}`}
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="min-h-screen flex items-center justify-center px-8 py-16 bg-[#111111]"
          >
            <div className="max-w-7xl w-full">
              <div
                className={`grid grid-cols-12 gap-8 items-center ${index % 2 === 0 ? "" : "lg:grid-flow-col-dense"}`}
              >
                {/* Text Content */}
                <div
                  className={`col-span-12 lg:col-span-5 space-y-6 ${
                    index % 2 === 0 ? "lg:pr-12" : "lg:pl-12 lg:col-start-8"
                  }`}
                >
                  {/* Date */}
                  <div className="text-[#FE7A25] font-keepick-primary text-sm tracking-wider">{event.date}</div>

                  {/* Main Title */}
                  <h2 className="font-keepick-heavy text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide">
                    {event.title.split("\n").map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </h2>

                  {/* Subtitle */}
                  {event.subtitle && (
                    <h3 className="font-keepick-primary text-lg md:text-xl text-gray-400 tracking-widest">
                      {event.subtitle.split("\n").map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </h3>
                  )}

                  {/* Description */}
                  <p className="font-keepick-primary text-gray-300 leading-relaxed text-base md:text-lg max-w-md">
                    {event.description}
                  </p>

                  {/* View Button */}
                  <button className="border border-white/30 px-8 py-3 font-keepick-primary text-sm tracking-wider hover:bg-white hover:text-black transition-all duration-300 mt-8">
                    자세히 보기
                  </button>
                </div>

                {/* Images Collage */}
                <div
                  className={`col-span-12 lg:col-span-7 relative h-[500px] md:h-[600px] ${
                    index % 2 === 0 ? "" : "lg:col-start-1"
                  }`}
                >
                  <TimelineImageLayout event={event} index={index} />
                </div>
              </div>
            </div>
          </motion.section>
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="font-keepick-heavy text-3xl md:text-4xl mb-4 tracking-wider">ALBUM {albumId}</h2>
          <p className="font-keepick-primary text-gray-400 text-sm tracking-wider">소중한 순간들을 함께 나누는 공간</p>
          <div className="mt-8 flex justify-center gap-8 text-sm font-keepick-primary text-gray-500">
            <Link href={`/group/${groupId}`} className="hover:text-white transition-colors">
              홈
            </Link>
            <Link href={`/group/${groupId}/gallery`} className="hover:text-white transition-colors">
              갤러리
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}