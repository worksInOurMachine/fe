"use client";

import SpotlightCard from "@/components/ui/soptlight-card";
import Link from "next/link";
import React from "react";
import { useState } from "react";
import { MapPin, MessageSquare, ArrowRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
const page = () => {
  const router = useRouter();
  
const roadmap =  typeof window !== 'undefined' ? window.localStorage.getItem("roadmap") : null;

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const cards = [
    {
      id: "interview",
      title: "Create Interview",
      description:
        "Generate AI-powered mock interviews to practice and improve your skills",
      icon: Eye,
      gradient: "from-green-500 to-green-700",
      hoverGradient: "from-green-700 to-green-800",
      href: "/create-interview",
    },
    {
      id: "roadmap",
      title: "Roadmap",
      description: "Generate Learning Roadmap for your next Job preparation",
      icon: MapPin,
      gradient: "from-blue-500 to-cyan-500",
      hoverGradient: "from-blue-600 to-cyan-600",
      href: "/roadmap",
    },
    {
      id: "chat",
      title: "Chat",
      description:
        "Chat with our AI to get Guidance and prepare for your next Interview",
      icon: MessageSquare,
      gradient: "from-purple-500 to-pink-500",
      hoverGradient: "from-purple-600 to-pink-600",
      href: "/chat",
    },
  ];

  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full mt-10 max-w-[80vw]">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Explore Our Services
          </h1>
          <p className="text-slate-400 text-lg text-balance">
            Choose an option to get started
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === card.id;

            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative cursor-pointer"
                onClick={() => {
                  card.id == "chat" || card.id == "interview"
                    ? router.push(card.href)
                    : "";
                }}
              >
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10 ${
                    isHovered ? `bg-gradient-to-r ${card.hoverGradient}` : ""
                  }`}
                />

                {/* Card Container */}
                <div
                  className={`relative h-full bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 transition-all duration-300 overflow-hidden
                    ${
                      isHovered
                        ? "border-slate-500 shadow-2xl transform scale-105"
                        : "hover:border-slate-600"
                    }
                  `}
                >
                  {/* Animated background gradient */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r ${card.gradient}`}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Icon Container */}
                    <div
                      className={`inline-flex w-fit mb-6 p-3 rounded-lg bg-gradient-to-r ${
                        card.gradient
                      } 
                        transform transition-all duration-300
                        ${isHovered ? "scale-110 shadow-lg" : "scale-100"}
                      `}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-balance">
                      {card.title}
                    </h2>

                    {/* Description */}
                    <p className="text-slate-400 mb-6 flex-grow text-balance">
                      {card.description}
                    </p>

                    {/* CTA with Arrow */}
                    <div
                      className={`inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group/cta
                        ${
                          isHovered
                            ? "text-white translate-x-0"
                            : "text-slate-300 -translate-x-1"
                        }
                      `}
                    >
                      {card.id == "chat" ? (
                        <span>Learn More</span>
                      ) : card.id == "roadmap" ? (
                        <div className="flex gap-2 ">
                          {roadmap ? (
                            <Button
                              className=" cursor-pointer"
                              onClick={() => router.push("/roadmap")}
                            >
                              View Previous
                            </Button>
                          ) : (
                            ""
                          )}
                          <Button
                            className=" cursor-pointer"
                            onClick={() => {
                              window.localStorage.removeItem("roadmap");
                              router.push("/roadmap");
                            }}
                          >
                            Generate New
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span>Get Started</span>
                          <ArrowRight
                            className={`w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-2`}
                          />
                        </>
                      )}

                      {card.id == "chat" ? (
                        <ArrowRight
                          className={`w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-2`}
                        />
                      ) : (
                        ""
                      )}
                    </div>
                  </div>

                  {/* Hover border accent */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                      card.gradient
                    } 
                      transform transition-all duration-300 origin-left
                      ${isHovered ? "scale-x-100" : "scale-x-0"}
                    `}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer text */}
        <div className="text-center mt-12">
          <p className="text-slate-500 text-sm">
            Hover over the cards to see more details
          </p>
        </div>
      </div>
    </main>
  );
};

export default page;
