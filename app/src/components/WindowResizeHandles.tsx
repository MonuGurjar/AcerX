import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type ResizeDirection =
  | "East"
  | "North"
  | "NorthEast"
  | "NorthWest"
  | "South"
  | "SouthEast"
  | "SouthWest"
  | "West";

export const WindowResizeHandles: React.FC = () => {
  const handleResize = (direction: ResizeDirection) => (e: React.MouseEvent) => {
    if (e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      getCurrentWindow().startResizeDragging(direction).catch(() => {});
    }
  };

  return (
    <>
      {/* Edges - 6px hitboxes */}
      <div
        className="fixed top-0 left-3 right-3 h-[6px] cursor-n-resize z-50 select-none pointer-events-auto"
        onMouseDown={handleResize("North")}
      />
      <div
        className="fixed bottom-0 left-3 right-3 h-[6px] cursor-s-resize z-50 select-none pointer-events-auto"
        onMouseDown={handleResize("South")}
      />
      <div
        className="fixed left-0 top-3 bottom-3 w-[6px] cursor-w-resize z-50 select-none pointer-events-auto"
        onMouseDown={handleResize("West")}
      />
      <div
        className="fixed right-0 top-3 bottom-3 w-[6px] cursor-e-resize z-50 select-none pointer-events-auto"
        onMouseDown={handleResize("East")}
      />

      {/* Corners - 12x12px hitboxes */}
      <div
        className="fixed top-0 left-0 w-[12px] h-[12px] cursor-nw-resize z-50 select-none pointer-events-auto"
        onMouseDown={handleResize("NorthWest")}
      />
      <div
        className="fixed top-0 right-0 w-[12px] h-[12px] cursor-ne-resize z-50 select-none pointer-events-auto"
        onMouseDown={handleResize("NorthEast")}
      />
      <div
        className="fixed bottom-0 left-0 w-[12px] h-[12px] cursor-sw-resize z-50 select-none pointer-events-auto"
        onMouseDown={handleResize("SouthWest")}
      />
      <div
        className="fixed bottom-0 right-0 w-[12px] h-[12px] cursor-se-resize z-50 select-none pointer-events-auto"
        onMouseDown={handleResize("SouthEast")}
      />
    </>
  );
};
