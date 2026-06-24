"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Label, Tag, Text } from "react-konva";
import type Konva from "konva";
import type { MapPin } from "@/db/schema";

export default function ImageMap({
  imageUrl,
  pins,
  editable,
  selectedPinId,
  onStageClick,
  onPinClick,
}: {
  imageUrl: string;
  pins: MapPin[];
  editable: boolean;
  selectedPinId: string | null;
  onStageClick: (xFrac: number, yFrac: number) => void;
  onPinClick: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new window.Image();
    image.src = imageUrl;
    image.onload = () => setImg(image);
    return () => {
      image.onload = null;
    };
  }, [imageUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const aspect = img ? img.height / img.width : 0.6;
  const width = containerWidth;
  const height = width * aspect;

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!editable) return;
    // Ignore clicks that originated on a pin (they set cancelBubble).
    if (e.target.getClassName?.() === "Circle") return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    onStageClick(pos.x / width, pos.y / height);
  }

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-lg border border-border">
      {img ? (
        <Stage width={width} height={height} onClick={handleStageClick} onTap={handleStageClick}>
          <Layer>
            <KonvaImage image={img} width={width} height={height} />
          </Layer>
          <Layer>
            {pins.map((pin, i) => {
              const x = pin.x * width;
              const y = pin.y * height;
              const selected = pin.id === selectedPinId;
              return (
                <Label
                  key={pin.id}
                  x={x}
                  y={y}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onPinClick(pin.id);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onPinClick(pin.id);
                  }}
                >
                  <Tag
                    fill={pin.color || "#7c3aed"}
                    stroke={selected ? "#ffffff" : "#000000"}
                    strokeWidth={selected ? 2 : 1}
                    cornerRadius={4}
                    pointerDirection="down"
                    pointerWidth={8}
                    pointerHeight={8}
                  />
                  <Text
                    text={pin.label || String(i + 1)}
                    fontSize={13}
                    padding={5}
                    fill="#ffffff"
                  />
                </Label>
              );
            })}
            {/* dots at the exact pin coordinate */}
            {pins.map((pin) => (
              <Circle
                key={`dot-${pin.id}`}
                x={pin.x * width}
                y={pin.y * height}
                radius={4}
                fill={pin.color || "#7c3aed"}
                stroke="#ffffff"
                strokeWidth={1}
                listening={false}
              />
            ))}
          </Layer>
        </Stage>
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
    </div>
  );
}
