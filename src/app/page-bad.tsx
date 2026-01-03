'use client'

import EmailForm from '@/components/EmailForm'
import Image from 'next/image'

export default function Home() {
  return (
    <main style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Hero Section with Phone Mockup */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                   style={{ backgroundColor: 'rgba(8, 145, 178, 0.08)', color: '#0891B2' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                Coming Soon
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight"
                  style={{ color: '#11181C' }}>
                Stay Informed
                <br />
                <span style={{ color: '#0891B2' }}>Without the Noise</span>
              </h1>

              {/* Subtext */}
              <p className="text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                 style={{ color: '#687076' }}>
                Relevant delivers AI-personalized news that matters to you. 
                No doom scrolling, no algorithm tricks—just curated stories 
                with clear summaries of why they&apos;re important.
              </p>

              {/* Email Form */}
              <div className="flex justify-center lg:justify-start pt-4">
                <EmailForm />
              </div>

              {/* Trust Text */}
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                Join the waitlist · Be first to launch
              </p>
            </div>

            {/* Right Column - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-[300px] sm:w-[340px] md:w-[380px]">
                {/* Phone Frame */}
                <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl"
                     style={{ 
                       backgroundColor: '#FFFFFF',
                       border: '12px solid #1f2937',
                       boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                     }}>
                  
                  {/* Dynamic Island */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-10"></div>
                  
                  {/* Status Bar */}
                  <div className="h-14 flex items-center justify-between px-8 pt-2"
                       style={{ backgroundColor: '#F9FAFB' }}>
                    <div className="text-sm font-semibold" style={{ color: '#11181C' }}>9:41</div>
                    <div className="flex gap-1 items-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#11181C' }}>
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                      </svg>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="px-5 py-6 space-y-5 pb-24"
                       style={{ 
                         backgroundColor: '#F9FAFB',
                         minHeight: '600px'
                       }}>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Good morning</div>
                        <div className="text-2xl font-bold" style={{ color: '#11181C' }}>Your Feed</div>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                           style={{ backgroundColor: '#0891B2' }}>
                        <span className="text-white text-sm font-semibold">AS</span>
                      </div>
                    </div>

                    {/* News Card 1 */}
                    <div className="rounded-2xl p-5 space-y-4 shadow-lg"
                         style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="w-full h-36 rounded-xl overflow-hidden"
                           style={{ backgroundColor: '#E5E7EB' }}>
                        <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold" style={{ color: '#0891B2' }}>TECHNOLOGY</div>
                        <div className="text-base font-bold leading-snug" style={{ color: '#11181C' }}>
                          Major AI breakthrough announced by leading tech company
                        </div>
                        <div className="text-sm leading-relaxed" style={{ color: '#687076' }}>
                          New model shows significant improvements in reasoning capabilities...
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <div className="h-7 px-3 rounded-full flex items-center text-xs font-medium"
                             style={{ backgroundColor: 'rgba(8, 145, 178, 0.08)', color: '#0891B2' }}>
                          AI
                        </div>
                        <div className="h-7 px-3 rounded-full flex items-center text-xs font-medium"
                             style={{ backgroundColor: 'rgba(8, 145, 178, 0.08)', color: '#0891B2' }}>
                          5 min read
                        </div>
                      </div>
                    </div>

                    {/* News Card 2 (Partial) */}
                    <div className="rounded-2xl p-5 space-y-4 shadow-lg"
                         style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="w-full h-28 rounded-xl"
                           style={{ backgroundColor: '#F3F4F6' }}>
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold" style={{ color: '#0891B2' }}>BUSINESS</div>
                        <div className="text-base font-bold leading-snug" style={{ color: '#11181C' }}>
                          Market trends shift as investors focus on...
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Tab Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-around px-8 pb-4"
                       style={{ 
                         backgroundColor: '#FFFFFF',
                         borderTop: '1px solid #E5E7EB'
                       }}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: '#0891B2' }}></div>
                      <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#0891B2' }}></div>
                    </div>
                    <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: '#E5E7EB' }}></div>
                    <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: '#E5E7EB' }}></div>
                    <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: '#E5E7EB' }}></div>
                  </div>
                </div>

                {/* Floating Badges */}
                <div className="absolute -right-6 top-24 px-4 py-2 rounded-full shadow-xl animate-pulse"
                     style={{ 
                       backgroundColor: 'rgba(255, 255, 255, 0.95)',
                       border: '1px solid #E5E7EB'
                     }}>
                  <div className="text-sm font-bold" style={{ color: '#0891B2' }}>
                    ✨ AI Powered
                  </div>
                </div>

                <div className="absolute -left-6 bottom-32 px-4 py-2 rounded-full shadow-xl animate-pulse"
                     style={{ 
                       backgroundColor: 'rgba(255, 255, 255, 0.95)',
                       border: '1px solid #E5E7EB',
                       animationDelay: '1s'
                     }}>
                  <div className="text-sm font-bold" style={{ color: '#10B981' }}>
                    🎯 Personalized
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: '#11181C' }}>
              News that adapts to <span style={{ color: '#0891B2' }}>you</span>
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: '#687076' }}>
              Built for professionals who need to stay informed without wasting time
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
                 style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                   style={{ backgroundColor: 'rgba(8, 145, 178, 0.08)' }}>
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#11181C' }}>
                AI-Powered Curation
              </h3>
              <p className="leading-relaxed" style={{ color: '#687076' }}>
                Our AI learns what matters to you and surfaces the most relevant stories from thousands of sources.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
                 style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                   style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#11181C' }}>
                Clear Summaries
              </h3>
              <p className="leading-relaxed" style={{ color: '#687076' }}>
                Get the key points instantly. No clickbait, no fluff—just what you need to know.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
                 style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                   style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)' }}>
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#11181C' }}>
                Zero Noise
              </h3>
              <p className="leading-relaxed" style={{ color: '#687076' }}>
                No doom scrolling, no distractions. Just your personalized feed designed for focus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: '#11181C' }}>
            Ready to stay <span style={{ color: '#0891B2' }}>relevant</span>?
          </h2>
          <p className="text-xl mb-12" style={{ color: '#687076' }}>
            Join the waitlist and be among the first to experience the future of news.
          </p>
          <div className="flex justify-center">
            <EmailForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            © {new Date().getFullYear()} Relevant. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
