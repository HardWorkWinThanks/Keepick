// "use client";

// 하나의 Layout으로 관리하기에는 화면마다 레이아웃이 너무달라져서 비효율적.


// import { useState, ReactNode } from "react";
// import Header from "./HeaderWidget";
// import Sidebar from "./SidebarWidget";

// interface LayoutProps {
//   children: ReactNode;
// }

// export default function LayoutWidget({ children }: LayoutProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(true); // 사이드바 기본 상태 (true: 열림)

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Sidebar */}
//       <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

//       {/* Main Content */}
//       <div
//         className={`transition-all duration-300 ${
//           sidebarOpen ? "lg:ml-64" : "ml-0"
//         }`}
//       >
//         {/* Header */}
//         <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

//         {/* Page Content */}
//         <main className="p-4 sm:p-6 lg:p-8">{children}</main>
//       </div>
//     </div>
//   );
// }
