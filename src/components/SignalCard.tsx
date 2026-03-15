import React from 'react';

interface SignalCardProps {
  headline: string;
  synthesisPreview?: string;
  sourceLabel?: string;
  sourceCount?: number;
  timeText?: string;
  imageUrl?: string;
  showGoalBadge?: boolean;
}

export function SignalCard({
  headline,
  synthesisPreview,
  sourceLabel = 'Source',
  sourceCount = 1,
  timeText = 'JUST NOW',
  imageUrl,
  showGoalBadge = false,
}: SignalCardProps) {
  const sourceCountStr = `${sourceCount} SOURCE${sourceCount === 1 ? '' : 'S'}`;
  const footerMetaText = `${sourceCountStr} · ${timeText}`;

  return (
    <div className="w-full mb-2 cursor-pointer font-sans group">
      <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-transform duration-300 group-hover:scale-[1.01]">
        
        {/* Card Meta (Badges) */}
        {showGoalBadge && (
          <div className="flex flex-row justify-between items-start px-4 pt-4 pb-0">
            <div className="flex flex-row gap-2 flex-wrap flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[10px] font-bold tracking-wider uppercase">Goal Aligned</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="px-4 py-4 flex flex-col gap-3">
          <h2 className="text-[20px] leading-[24px] font-medium text-zinc-900 dark:text-zinc-50 tracking-[-0.02em] font-serif">
            {headline}
          </h2>

          {/* Image Container */}
              <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-[14px] overflow-hidden relative">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-blue-900/40 dark:via-indigo-900/20 dark:to-purple-900/40 px-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
                <div className="flex flex-row items-center gap-2 px-3 py-2 rounded-full bg-white/60 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 z-10">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span className="font-mono font-semibold text-[11px] tracking-[0.7px] uppercase text-blue-700 dark:text-blue-300">
                    {sourceLabel}
                  </span>
                </div>
              </div>
            )}
            {/* Optional gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            
            {/* Share button mock */}
            <div className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-black/40 border border-white/15 flex items-center justify-center backdrop-blur-md">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </div>
          </div>

          {/* Synthesis Preview */}
          {synthesisPreview && (
            <div className="flex flex-row gap-2.5 mt-1">
              <div className="w-[3px] rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <p className="flex-1 text-[15px] leading-[22px] text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-900 dark:text-zinc-200">Bottom Line:</span>{' '}
                {synthesisPreview}
              </p>
            </div>
          )}

          {/* Utility Strip */}
          <div className="flex flex-col mt-2">
            <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800/60 mb-3" />
            <div className="flex flex-row items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
                {footerMetaText}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 pb-4 flex flex-row items-center justify-between">
          {/* Feedback */}
          <div className="flex flex-row gap-2">
            <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 transition-colors">
              <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </div>
            <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 transition-colors">
              <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
              </svg>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
