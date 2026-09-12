"use client";

import React, { useMemo, useState } from 'react';

// TypeScript interfaces based on the UXP export
export interface TimelineClip {
  name: string;
  start: number;
  end: number;
  duration: number;
  source?: {
    fileName: string;
    filePath: string;
  };
}

export interface TimelineTrack {
  trackIndex: number;
  type: 'video' | 'audio';
  name: string;
  clips: TimelineClip[];
}

export interface TimelineMarker {
  time: number;
  name?: string;
  comment?: string;
  type?: string;
  color: string;
}

export interface TimelineData {
  metadata: {
    totalTracks: number;
    totalClips: number;
    totalMarkers: number;
  };
  sequence: {
    name: string;
    duration: number;
  };
  tracks: TimelineTrack[];
  markers: TimelineMarker[];
}

interface TimelineViewerProps {
  data: TimelineData | null;
  pixelsPerSecond?: number;
}

const colorMap: Record<string, string> = {
  green: '#10b981',
  red: '#ef4444',
  purple: '#a855f7',
  blue: '#00e5ff',
  cyan: '#00e5ff',
  yellow: '#f59e0b',
  magenta: '#ec4899',
  white: '#f4f4f5',
};

function formatTimecode(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 24);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

export default function TimelineViewer({ data, pixelsPerSecond = 24 }: TimelineViewerProps) {
  const [playheadTime, setPlayheadTime] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  if (!data || !data.sequence) {
    return (
      <div className="w-full h-56 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex flex-col items-center justify-center gap-3 text-neutral-500 shadow-inner">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <p className="text-xs font-mono">Waiting for Premiere Pro sequence sync via UXP plugin...</p>
      </div>
    );
  }

  const sequenceDuration = data.sequence.duration || 1;
  const containerWidth = sequenceDuration * pixelsPerSecond;

  const videoTracks = useMemo(() => {
    return data.tracks
      .filter((t) => t.type === 'video')
      .sort((a, b) => b.trackIndex - a.trackIndex);
  }, [data.tracks]);

  const audioTracks = useMemo(() => {
    return data.tracks
      .filter((t) => t.type === 'audio')
      .sort((a, b) => a.trackIndex - b.trackIndex);
  }, [data.tracks]);

  const rulerTicks = useMemo(() => {
    const ticks = [];
    const interval = sequenceDuration > 120 ? 10 : 5;
    for (let i = 0; i <= Math.ceil(sequenceDuration); i += interval) {
      ticks.push(i);
    }
    return ticks;
  }, [sequenceDuration]);

  const TRACK_HEIGHT = 44;
  const RULER_HEIGHT = 28;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(sequenceDuration, clickX / pixelsPerSecond));
    setPlayheadTime(newTime);
  };

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex flex-col font-sans overflow-hidden shadow-2xl">
      {/* Top Header & Telemetry Bar */}
      <div className="bg-white/[0.03] px-5 py-3.5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
              {data.sequence.name}
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Synced
              </span>
            </div>
            <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
              Sequence Frame Rate: 24.00 fps &middot; Premiere Pro 2026 Engine
            </div>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300">
            <span className="text-neutral-500 mr-1.5">POS</span>
            <span className="text-white font-semibold">{formatTimecode(playheadTime)}</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300">
            <span className="text-neutral-500 mr-1.5">DUR</span>
            <span>{formatTimecode(sequenceDuration)}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-neutral-400 text-[10px]">
            <span>{data.metadata.totalClips} clips</span>
            <span>&middot;</span>
            <span>{data.metadata.totalMarkers} markers</span>
          </div>
        </div>
      </div>

      {/* Timeline Scroll Container */}
      <div className="overflow-x-auto overflow-y-auto relative flex max-h-[480px] min-h-[260px] bg-black/40">
        {/* Track Headers (Left Sidebar - Sticky) */}
        <div className="w-28 flex-shrink-0 bg-[#07080a]/90 backdrop-blur-md border-r border-white/[0.08] sticky left-0 z-30 flex flex-col shadow-lg select-none">
          {/* Ruler spacer */}
          <div style={{ height: RULER_HEIGHT }} className="border-b border-white/[0.08] bg-white/[0.02] px-2.5 flex items-center text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
            Tracks
          </div>

          {/* Video track labels */}
          {videoTracks.map((track) => (
            <div
              key={`vh-${track.trackIndex}`}
              style={{ height: TRACK_HEIGHT }}
              className="border-b border-white/[0.04] px-2.5 flex items-center justify-between bg-white/[0.01] text-neutral-400 text-[11px] font-mono"
            >
              <span className="font-semibold text-sky-400">{track.name}</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                VID
              </span>
            </div>
          ))}

          {/* Audio track labels */}
          {audioTracks.map((track) => (
            <div
              key={`ah-${track.trackIndex}`}
              style={{ height: TRACK_HEIGHT }}
              className="border-b border-white/[0.04] px-2.5 flex items-center justify-between bg-white/[0.01] text-neutral-400 text-[11px] font-mono"
            >
              <span className="font-semibold text-emerald-400">{track.name}</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AUD
              </span>
            </div>
          ))}
        </div>

        {/* Tracks Content Area */}
        <div
          className="relative bg-transparent cursor-crosshair select-none"
          style={{ width: Math.max(containerWidth, 800) + 120 }}
          onClick={handleTimelineClick}
        >
          {/* Ruler (Sticky Top) */}
          <div
            style={{ height: RULER_HEIGHT }}
            className="bg-white/[0.03] backdrop-blur-md border-b border-white/[0.08] sticky top-0 z-20 w-full overflow-hidden"
          >
            {rulerTicks.map((tick) => (
              <div
                key={`tick-${tick}`}
                className="absolute top-0 bottom-0 border-l border-white/10 pl-1.5 pt-1 text-[9px] font-mono text-neutral-500"
                style={{ left: tick * pixelsPerSecond }}
              >
                {/* Minor subdivision ticks */}
                <div className="absolute top-[18px] -left-px h-[8px] w-px bg-white/15" />
                <div className="absolute top-[22px] -left-px translate-x-[6px] h-[4px] w-px bg-white/10" />
                <div className="absolute top-[22px] -left-px translate-x-[12px] h-[4px] w-px bg-white/10" />
                <div className="absolute top-[22px] -left-px translate-x-[18px] h-[4px] w-px bg-white/10" />
                {tick}s
              </div>
            ))}
          </div>

          {/* Interactive Playhead Line */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-75 ease-out"
            style={{ left: playheadTime * pixelsPerSecond }}
          >
            <div className="relative -left-[5px] -top-0 w-[11px] h-[14px] bg-[#00e5ff] shadow-[0_0_8px_#00e5ff] rounded-b-sm flex items-center justify-center">
              <div className="w-[1px] h-full bg-[#08090a]" />
            </div>
            <div className="w-[1px] h-full bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
          </div>

          {/* Markers */}
          {data.markers && data.markers.map((marker, i) => {
            const left = marker.time * pixelsPerSecond;
            const color = colorMap[marker.color] || '#00e5ff';
            return (
              <div
                key={`marker-${i}`}
                className="absolute top-0 bottom-0 z-20 w-px group hover:z-40"
                style={{ left, backgroundColor: `${color}80` }}
              >
                {/* Marker Flag */}
                <div
                  className="absolute top-0 -translate-x-1/2 w-[12px] h-[16px] cursor-pointer"
                  style={{
                    backgroundColor: color,
                    clipPath: 'polygon(0 0, 100% 0, 100% 65%, 50% 100%, 0 65%)',
                  }}
                />

                {/* Marker Tooltip */}
                <div className="absolute left-[-60px] top-[26px] w-max max-w-[220px] bg-[#0c0e14]/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/[0.14] shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="font-mono text-xs font-bold flex items-center justify-between gap-2" style={{ color }}>
                    <span>{marker.name || 'Sequence Marker'}</span>
                    <span className="text-[10px] text-neutral-500">{marker.time.toFixed(2)}s</span>
                  </div>
                  {marker.comment && (
                    <p className="text-neutral-300 text-[11px] mt-1 leading-snug break-words">
                      {marker.comment}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Video Tracks */}
          {videoTracks.map((track) => (
            <div
              key={`v-${track.trackIndex}`}
              className="border-b border-white/[0.04] relative w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px)]"
              style={{
                height: TRACK_HEIGHT,
                backgroundSize: `${pixelsPerSecond}px 100%`,
              }}
            >
              {track.clips.map((clip, j) => (
                <div
                  key={`vc-${j}`}
                  className="absolute top-1 bottom-1 bg-[#0284c7]/25 border border-[#38bdf8]/50 hover:border-[#38bdf8] rounded-[4px] overflow-hidden px-2 whitespace-nowrap hover:bg-[#0284c7]/40 cursor-pointer flex flex-col justify-center transition-all shadow-sm group"
                  style={{
                    left: clip.start * pixelsPerSecond,
                    width: Math.max(clip.duration * pixelsPerSecond, 4),
                  }}
                  title={`${clip.name} [${clip.start.toFixed(2)}s - ${clip.end.toFixed(2)}s]`}
                >
                  <span className="truncate text-zinc-100 text-[10px] font-mono font-medium drop-shadow-sm">
                    {clip.name}
                  </span>
                  <span className="text-[9px] font-mono text-sky-300/70 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {clip.duration.toFixed(2)}s
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* Audio Tracks */}
          {audioTracks.map((track) => (
            <div
              key={`a-${track.trackIndex}`}
              className="border-b border-white/[0.04] relative w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px)]"
              style={{
                height: TRACK_HEIGHT,
                backgroundSize: `${pixelsPerSecond}px 100%`,
              }}
            >
              {track.clips.map((clip, j) => (
                <div
                  key={`ac-${j}`}
                  className="absolute top-1 bottom-1 bg-[#047857]/20 border border-[#10b981]/50 hover:border-[#10b981] rounded-[4px] overflow-hidden px-2 whitespace-nowrap hover:bg-[#047857]/35 cursor-pointer flex flex-col justify-center transition-all shadow-sm group"
                  style={{
                    left: clip.start * pixelsPerSecond,
                    width: Math.max(clip.duration * pixelsPerSecond, 4),
                  }}
                  title={`${clip.name} [${clip.start.toFixed(2)}s - ${clip.end.toFixed(2)}s]`}
                >
                  <span className="truncate text-zinc-100 text-[10px] font-mono font-medium drop-shadow-sm">
                    {clip.name}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-300/70 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {clip.duration.toFixed(2)}s
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}