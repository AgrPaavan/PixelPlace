import React, { useState, useEffect, useCallback } from "react";
import PixelCanvas from "./components/PixelCanvas";
import ColorPicker from "./components/ColorPicker";
import Header from "./components/Header";
import {
  GRID_SIZE,
  COOLDOWN_SECONDS,
  INITIAL_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
} from "./constants";
import { Coordinates, PixelRecord } from "./types";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { supabase } from "./supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

// Generate empty grid
const createEmptyGrid = () => new Array(GRID_SIZE * GRID_SIZE).fill(0);

const App: React.FC = () => {
  // --- State ---
  const [gridData, setGridData] = useState<number[]>(createEmptyGrid());
  const [selectedPixel, setSelectedPixel] = useState<Coordinates | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number>(1); // Default to Red
  const [lastPlacedTime, setLastPlacedTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [scale, setScale] = useState<number>(INITIAL_ZOOM);
  const [offset, setOffset] = useState<Coordinates>({ x: 0, y: 0 });
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // --- Effects ---

  // Initial Data Load & Realtime Subscription
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    const initialize = async () => {
      // 1. Fetch initial state
      try {
        const { data, error } = await supabase
          .from("pixels")
          .select("x, y, color_index")
          .limit(GRID_SIZE * GRID_SIZE); // Safety limit

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching initial pixels:", error);
        } else if (data) {
          setGridData((prev) => {
            const newGrid = [...prev];
            data.forEach((p: any) => {
              // Ensure strictly numbers
              const x = Number(p.x);
              const y = Number(p.y);
              const color = Number(p.color_index);

              if (!isNaN(x) && !isNaN(y) && !isNaN(color)) {
                if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                  newGrid[y * GRID_SIZE + x] = color;
                }
              }
            });
            return newGrid;
          });
        }
      } catch (err) {
        console.error("Unexpected error fetching pixels:", err);
      }

      if (!isMounted) return;

      // 2. Set up Realtime Subscription
      // IMPORTANT: Ensure you have run "alter publication supabase_realtime add table pixels;" in Supabase SQL Editor
      channel = supabase
        .channel("pixel-universe-global")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pixels" },
          (payload) => {
            console.log("Realtime event received:", payload); // Debug log
            // Handle INSERT and UPDATE events
            const { eventType, new: newRecord } = payload;

            if (eventType === "INSERT" || eventType === "UPDATE") {
              const pixel = newRecord as PixelRecord;
              // Validate payload structure
              if (
                !pixel ||
                typeof pixel.x === "undefined" ||
                typeof pixel.y === "undefined"
              ) {
                console.warn("Invalid pixel data in event:", pixel);
                return;
              }

              setGridData((prev) => {
                const x = Number(pixel.x);
                const y = Number(pixel.y);
                const color = Number(pixel.color_index);
                const index = y * GRID_SIZE + x;

                // Boundary & validity checks
                if (index < 0 || index >= prev.length) return prev;

                // Optimization: Don't trigger render if color is same (e.g. echo from own update)
                if (prev[index] === color) return prev;

                const newData = [...prev];
                newData[index] = color;
                return newData;
              });
            }
          },
        )
        .on("presence", { event: "sync" }, () => {
          if (!channel) return;
          const newState = channel.presenceState();
          // Count unique presence IDs (users connected)
          const count = Object.keys(newState).length;
          setOnlineCount(Math.max(1, count));
        })
        .subscribe(async (status) => {
          console.log("Subscription status:", status);
          if (status === "SUBSCRIBED") {
            console.log("Connected to Supabase Realtime");
            if (isMounted) setIsConnected(true);
            if (channel) {
              await channel.track({ online_at: new Date().toISOString() });
            }
          } else if (status === "CHANNEL_ERROR") {
            console.error("Failed to connect to Supabase Realtime");
            if (isMounted) setIsConnected(false);
          } else if (status === "TIMED_OUT") {
            console.error("Supabase Realtime connection timed out");
            if (isMounted) setIsConnected(false);
          }
        });
    };

    initialize();

    // Clean up
    return () => {
      isMounted = false;
      if (channel) {
        console.log("Cleaning up subscription...");
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Cooldown Logic
  useEffect(() => {
    // Restore cooldown from local storage if page refreshed
    const savedTime = localStorage.getItem("pixelplace_last_placed");
    if (savedTime) {
      setLastPlacedTime(parseInt(savedTime, 10));
    }

    const checkCooldown = () => {
      const now = Date.now();
      const diff = now - lastPlacedTime;
      const remaining = Math.max(0, COOLDOWN_SECONDS * 1000 - diff);
      setCooldownRemaining(remaining);
    };

    const timer = setInterval(checkCooldown, 100);
    checkCooldown();

    return () => clearInterval(timer);
  }, [lastPlacedTime]);

  // --- Handlers ---

  const handlePixelClick = useCallback((coords: Coordinates) => {
    setSelectedPixel(coords);
  }, []);

  const handleConfirmPlacement = async () => {
    if (!selectedPixel) return;
    if (cooldownRemaining > 0) return;

    // 1. Optimistic Update: Update UI immediately for responsiveness
    const prevGrid = [...gridData];
    const index = selectedPixel.y * GRID_SIZE + selectedPixel.x;
    const pixelToSave = { ...selectedPixel }; // capture closure
    const colorToSave = selectedColorId;

    setGridData((prev) => {
      const newData = [...prev];
      newData[index] = colorToSave;
      return newData;
    });

    // Start Cooldown immediately
    const now = Date.now();
    setLastPlacedTime(now);
    localStorage.setItem("pixelplace_last_placed", now.toString());

    // Close Picker
    setSelectedPixel(null);

    // 2. Send to Supabase
    try {
      const { error } = await supabase.from("pixels").upsert(
        {
          x: pixelToSave.x,
          y: pixelToSave.y,
          color_index: colorToSave,
        },
        { onConflict: "x,y" },
      );

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Failed to save pixel:", err);
      // Revert optimistic update on error if needed,
      // but usually better to keep it and let the next real-time sync fix it
      // or show a toast. For now, we revert to keep state consistent.
      setGridData(prevGrid);
      alert("Failed to place pixel. Please try again.");
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, MAX_ZOOM));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.2, MIN_ZOOM));
  const handleCenter = () => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans select-none">
      <Header onlineCount={onlineCount} />

      {/* Main Canvas Area */}
      <PixelCanvas
        gridData={gridData}
        selectedPixel={selectedPixel}
        onPixelClick={handlePixelClick}
        scale={scale}
        offset={offset}
        setOffset={setOffset}
      />

      {/* Floating Zoom Controls */}
      <div className="fixed top-20 right-4 z-30 flex flex-col space-y-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-slate-800/80 backdrop-blur text-white rounded-lg shadow-lg hover:bg-slate-700 transition active:scale-95"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-slate-800/80 backdrop-blur text-white rounded-lg shadow-lg hover:bg-slate-700 transition active:scale-95"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleCenter}
          className="p-2 bg-slate-800/80 backdrop-blur text-white rounded-lg shadow-lg hover:bg-slate-700 transition active:scale-95"
        >
          <Maximize size={20} />
        </button>
      </div>

      {/* Bottom Interface */}
      <ColorPicker
        isOpen={!!selectedPixel}
        selectedPixel={selectedPixel}
        selectedColorId={selectedColorId}
        onSelectColor={setSelectedColorId}
        onConfirm={handleConfirmPlacement}
        onCancel={() => setSelectedPixel(null)}
        cooldownRemaining={cooldownRemaining}
      />

      {/* Status Bar */}
      {!isConnected && (
        <div className="fixed bottom-2 right-2 z-10 pointer-events-none animate-pulse">
          <p className="text-[10px] font-bold text-red-300 bg-red-900/80 backdrop-blur px-3 py-1 rounded-full border border-red-700/50 shadow-lg">
            Connecting to Universe...
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
