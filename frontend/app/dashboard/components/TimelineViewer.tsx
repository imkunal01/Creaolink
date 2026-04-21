"use client";

import React, { useMemo } from 'react';

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
  green: '#22c55e',
  red: '#ef4444',
  purple: '#a855f7',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  yellow: '#eab308',
  magenta: '#d946ef',
  white: '#f8fafc',
};

export default function TimelineViewer({ data, pixelsPerSecond = 20 }: TimelineViewerProps) {
  if (!data || !data.sequence) {
    return (
      <div className="w-full h-64 bg-[#1e1e1e] border border-[#333] rounded-lg flex items-center justify-center text-gray-500">
        Waiting for timeline sync...
      </div>
    );
  }

  const sequenceDuration = data.sequence.duration;
  const containerWidth = sequenceDuration * pixelsPerSecond;

  // Separate and sort tracks (Video tracks stack downwards, Audio tracks stack downwards below video)
  const videoTracks = useMemo(() => {
    return data.tracks
      .filter(t => t.type === 'video')
      .sort((a, b) => a.trackIndex - b.trackIndex);
  }, [data.tracks]);
  
  const audioTracks = useMemo(() => {
    return data.tracks
      .filter(t => t.type === 'audio')
      .sort((a, b) => a.trackIndex - b.trackIndex);
  }, [data.tracks]);

  // Generate ruler markers (tick every 10 seconds)
  const rulerTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= Math.ceil(sequenceDuration); i += 10) {
      ticks.push(i);
    }
    return ticks;
  }, [sequenceDuration]);

  // Height constants
  const TRACK_HEIGHT = 50;
  const RULER_HEIGHT = 28;

  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-lg overflow-hidden flex flex-col font-sans text-xs text-gray-300 w-full shadow-2xl">
      {/* Header */}
      <div className="bg-[#252525] p-3 border-b border-[#333] flex justify-between items-center">
        <div className="font-semibold text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
          {data.sequence.name}
        </div>
        <div className="text-gray-400 flex gap-4 text-[11px]">
          <span><span className="text-gray-500">Duration:</span> {sequenceDuration.toFixed(2)}s</span>
          <span><span className="text-gray-500">Clips:</span> {data.metadata.totalClips}</span>
          <span><span className="text-gray-500">Markers:</span> {data.metadata.totalMarkers}</span>
        </div>
      </div>

      {/* Timeline Scrollable Container */}
      <div className="overflow-x-auto overflow-y-auto relative flex max-h-[500px] min-h-[300px]">
        
        {/* Track Headers (Left Sidebar - Sticky) */}
        <div className="w-24 flex-shrink-0 bg-[#252525] border-r border-black sticky left-0 z-30 flex flex-col shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
          {/* Ruler spacer */}
          <div style={{ height: RULER_HEIGHT }} className="border-b border-[#111] bg-[#222]"></div>
          
          {videoTracks.map((track, i) => (
            <div key={`vh-${i}`} style={{ height: TRACK_HEIGHT }} className="border-b border-[#1a1a1a] p-2 flex items-center justify-center bg-[#2a2d35] text-[#8aa8c9] text-[10px] font-medium tracking-wide shadow-inner">
              {track.name}
            </div>
          ))}
          {audioTracks.map((track, i) => (
            <div key={`ah-${i}`} style={{ height: TRACK_HEIGHT }} className="border-b border-[#1a1a1a] p-2 flex items-center justify-center bg-[#1f2926] text-[#6bb59a] text-[10px] font-medium tracking-wide shadow-inner">
              {track.name}
            </div>
          ))}
        </div>

        {/* Tracks Content Area */}
        <div className="relative bg-[#181818]" style={{ width: Math.max(containerWidth, 800) + 100 }}>
          
          {/* Ruler (Sticky Top) */}
          <div style={{ height: RULER_HEIGHT }} className="bg-[#202020] border-b border-[#111] sticky top-0 z-20 w-full overflow-hidden">
            {rulerTicks.map(tick => (
              <div 
                key={`tick-${tick}`} 
                className="absolute top-0 bottom-0 border-l border-[#444] pl-1 pt-1 text-[9px] text-[#777]"
                style={{ left: tick * pixelsPerSecond }}
              >
                {/* Minor ticks */}
                <div className="absolute top-[18px] -left-px h-[10px] w-px bg-[#444]"></div>
                <div className="absolute top-[22px] -left-px translate-x-[20px] h-[6px] w-px bg-[#333]"></div>
                <div className="absolute top-[22px] -left-px translate-x-[40px] h-[6px] w-px bg-[#333]"></div>
                <div className="absolute top-[22px] -left-px translate-x-[60px] h-[6px] w-px bg-[#333]"></div>
                <div className="absolute top-[22px] -left-px translate-x-[80px] h-[6px] w-px bg-[#333]"></div>
                {tick}s
              </div>
            ))}
          </div>

          {/* Markers (overlaid through the whole timeline height) */}
          {data.markers && data.markers.map((marker, i) => {
            const left = marker.time * pixelsPerSecond;
            const color = colorMap[marker.color] || '#22c55e';
            return (
              <div 
                key={`marker-${i}`}
                className="absolute top-0 bottom-0 z-10 w-px group hover:z-50"
                style={{ left, backgroundColor: color }}
              >
                {/* Marker Flag */}
                <div className="absolute top-0 -translate-x-1/2 w-[14px] h-[18px] cursor-pointer" 
                     style={{ 
                       backgroundColor: color, 
                       clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)' 
                     }}>
                </div>
                
                {/* Marker Tooltip */}
                <div className="absolute left-[-50px] top-[25px] w-max max-w-[200px] bg-[#111] px-3 py-2 rounded-md border border-[#333] shadow-lg opacity-0 min-w-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="font-bold flex items-center justify-between" style={{ color }}>
                    <span>{marker.name || 'Marker'}</span>
                  </div>
                  {marker.comment && <div className="text-gray-300 mt-1 whitespace-normal break-words">{marker.comment}</div>}
                  <div className="text-[10px] text-gray-500 mt-2 text-right">{marker.time.toFixed(2)}s</div>
                </div>
              </div>
            );
          })}

          {/* Video Tracks */}
          {videoTracks.map((track, i) => (
            <div key={`v-${i}`} style={{ height: TRACK_HEIGHT }} className="border-b border-[#222] relative w-full bg-[linear-gradient(to_right,#1b1f24_1px,transparent_1px)]" style={{ backgroundSize: `${pixelsPerSecond}px 100%` }}>
              {track.clips.map((clip, j) => (
                <div 
                  key={`vc-${j}`} 
                  className="absolute top-1 bottom-1 bg-[#3a70b5] border border-[#5294e2] rounded-[3px] overflow-hidden px-1.5 whitespace-nowrap hover:bg-[#437fc9] cursor-pointer flex flex-col justify-center transition-colors shadow-sm ml-px"
                  style={{ 
                    left: clip.start * pixelsPerSecond, 
                    width: clip.duration * pixelsPerSecond,
                    minWidth: '3px' // to handle tiny clips visible
                  }}
                  title={`${clip.name} \n[${clip.start.toFixed(2)}s - ${clip.end.toFixed(2)}s]`}
                >
                  <span className="truncate text-[#f0f6fc] text-[10px] font-medium drop-shadow-md select-none">{clip.name}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Audio Tracks */}
          {audioTracks.map((track, i) => (
            <div key={`a-${i}`} style={{ height: TRACK_HEIGHT }} className="border-b border-[#222] relative w-full bg-[linear-gradient(to_right,#171c1b_1px,transparent_1px)]" style={{ backgroundSize: `${pixelsPerSecond}px 100%` }}>
              {track.clips.map((clip, j) => (
                <div 
                  key={`ac-${j}`} 
                  className="absolute top-1 bottom-1 bg-[#2e7d5d] border border-[#44b087] rounded-[3px] overflow-hidden px-1.5 whitespace-nowrap hover:bg-[#36936d] cursor-pointer flex flex-col justify-center transition-colors shadow-sm ml-px"
                  style={{ 
                    left: clip.start * pixelsPerSecond, 
                    width: clip.duration * pixelsPerSecond,
                    minWidth: '3px'
                  }}
                  title={`${clip.name} \n[${clip.start.toFixed(2)}s - ${clip.end.toFixed(2)}s]`}
                >
                  <span className="truncate text-[#f0f6fc] text-[10px] font-medium drop-shadow-md select-none">{clip.name}</span>
                </div>
              ))}
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
}