const TICKS_PER_SECOND = 254016000000;

const MARKER_COLORS = {
  0: "green", 1: "red",   2: "purple", 3: "blue",
  4: "cyan",  5: "yellow", 6: "magenta", 7: "white"
};

const MARKER_TYPES = {
  0: "comment", 1: "chapter", 2: "segmentation", 3: "web"
};

function ticksToSeconds(ticks) {
  return parseInt(ticks) / TICKS_PER_SECOND;
}

function extractClips(track) {
  const clips = [];
  const clipCount = track.clips.numItems;

  for (let j = 0; j < clipCount; j++) {
    const clip = track.clips[j];

    // Filter out empty gap clips (type 2 = empty gap clip)
    if (clip.type === 2) continue;

    let fileName = "";
    let filePath = "";

    try {
      // projectItem can be null for adjustment layers, titles, etc.
      if (clip.projectItem) {
        filePath = clip.projectItem.getMediaPath() || "";
        // Extract just the filename from the full path
        fileName = filePath
          ? filePath.split(/[\\/]/).pop()
          : clip.name;
      } else {
        fileName = clip.name;
      }
    } catch (e) {
      // Some synthetic clips have no projectItem — fail gracefully
      fileName = clip.name;
    }

    clips.push({
      name: clip.name,
      start: ticksToSeconds(clip.start.ticks),
      end: ticksToSeconds(clip.end.ticks),
      duration: ticksToSeconds(clip.end.ticks) - ticksToSeconds(clip.start.ticks),
      source: {
        fileName: fileName,
        filePath: filePath
      }
    });
  }

  return clips;
}

function extractTracks(sequence) {
  const tracks = [];

  // Video tracks
  const videoCount = sequence.videoTracks.numItems;
  for (let i = 0; i < videoCount; i++) {
    const track = sequence.videoTracks[i];
    tracks.push({
      trackIndex: i,
      type: "video",
      name: track.name || `Video ${i + 1}`,
      clips: extractClips(track)
    });
  }

  // Audio tracks
  const audioCount = sequence.audioTracks.numItems;
  for (let i = 0; i < audioCount; i++) {
    const track = sequence.audioTracks[i];
    tracks.push({
      trackIndex: i,
      type: "audio",
      name: track.name || `Audio ${i + 1}`,
      clips: extractClips(track)
    });
  }

  return tracks;
}

// ─── NEW in Phase 3 ───────────────────────────────────────

function extractMarkers(sequence) {
  const markers = [];

  try {
    const markerCount = sequence.markers.numItems;

    for (let i = 0; i < markerCount; i++) {
      const marker = sequence.markers[i];

      const entry = {
        time: ticksToSeconds(marker.time.ticks),
        name: marker.name || "",
        comment: marker.comments || "",      // note: .comments not .comment
        type: MARKER_TYPES[marker.type] || "comment",
        color: MARKER_COLORS[marker.colorIndex] || "green"
      };

      // Drop empty name/comment fields to keep JSON clean
      if (!entry.name)    delete entry.name;
      if (!entry.comment) delete entry.comment;
      if (!entry.type || entry.type === "comment") delete entry.type;

      markers.push(entry);
    }
  } catch (e) {
    // Sequence has no markers — return empty array, don't crash
    console.log("No markers found:", e.message);
  }

  // Sort by timeline position
  markers.sort((a, b) => a.time - b.time);

  return markers;
}

function buildCleanJSON(data) {
  // Recursively strip null, undefined, and empty string values
  function stripEmpty(obj) {
    if (Array.isArray(obj)) {
      return obj.map(stripEmpty).filter(
        item => item !== null && item !== undefined
      );
    }
    if (obj !== null && typeof obj === "object") {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleaned_value = stripEmpty(value);
        // Keep 0 and false — only drop null/undefined/empty string
        if (
          cleaned_value !== null &&
          cleaned_value !== undefined &&
          cleaned_value !== ""
        ) {
          cleaned[key] = cleaned_value;
        }
      }
      return cleaned;
    }
    return obj;
  }

  return JSON.stringify(stripEmpty(data), null, 2);
}

// ─── UPDATED extractTimelineData ─────────────────────────

function extractTimelineData() {
  if (!app || !app.project) {
    throw new Error("No project open in Premiere Pro");
  }

  const sequence = app.project.activeSequence;

  if (!sequence) {
    throw new Error("No active sequence — open a timeline first");
  }

  const tracks = extractTracks(sequence);     // from Phase 2
  const markers = extractMarkers(sequence);   // NEW

  const totalClips = tracks.reduce((sum, t) => sum + t.clips.length, 0);

  if (totalClips === 0) {
    throw new Error("Timeline is empty — no clips found");
  }

  // ─── Metadata block ───────────────────────────────────
  const metadata = {
    extractedAt: new Date().toISOString(),
    pluginVersion: "1.0.0",
    totalTracks: tracks.length,
    totalClips: totalClips,
    totalMarkers: markers.length
  };

  return {
    metadata: metadata,
    sequence: {
      name: sequence.name,
      id: sequence.sequenceID || null,
      duration: ticksToSeconds(sequence.end.ticks),
      frameRate: sequence.timebase || null
    },
    tracks: tracks,
    markers: markers
  };
}

module.exports = {
  extractTimelineData,
  buildCleanJSON,
  ticksToSeconds
};