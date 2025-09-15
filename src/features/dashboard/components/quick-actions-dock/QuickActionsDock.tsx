"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { HomeIcon, Calendar, FileText, Plus, Search, SunMoon, Headphones, Sparkles } from "lucide-react";
import { motion, MotionValue, useMotionValue, useSpring, useTransform, type SpringOptions, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/components/command-palette";
import { useTheme } from "next-themes";

const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;

// Loosened wrappers to avoid TS friction on MotionValue styles in strict mode
const MDiv: any = motion.div;
const MButton: any = motion.button;

type DockProps = {
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

export function QuickActionsDock(props: DockProps) {
  const router = useRouter();
  const { openPalette } = useCommandPalette();
  const { setTheme } = useTheme();

  return (
    <div className="pointer-events-none fixed bottom-3 left-1/2 z-40 -translate-x-1/2 md:bottom-4">
      <Dock {...props}>
        <DockAction label="Overview" onClickHref="/dashboard/overview">
          <HomeIcon className="h-full w-full text-neutral-600 dark:text-neutral-300" />
        </DockAction>
        <DockAction label="Sessions" onClickHref="/dashboard/sessions">
          <Headphones className="h-full w-full text-neutral-600 dark:text-neutral-300" />
        </DockAction>
        <DockAction label="New Session" onClick={() => router.push("/dashboard/sessions/new") }>
          <Plus className="h-full w-full text-neutral-600 dark:text-neutral-300" />
        </DockAction>
        <DockAction label="Calendar" onClickHref="/dashboard/sessions/calendar">
          <Calendar className="h-full w-full text-neutral-600 dark:text-neutral-300" />
        </DockAction>
        <DockAction label="Reports" onClickHref="/dashboard/sessions/reports">
          <FileText className="h-full w-full text-neutral-600 dark:text-neutral-300" />
        </DockAction>
        <DockAction label="Bulk" onClickHref="/dashboard/sessions/bulk-reports">
          <Sparkles className="h-full w-full text-neutral-600 dark:text-neutral-300" />
        </DockAction>
        <DockAction label="Search" onClick={() => openPalette()}>
          <Search className="h-full w-full text-neutral-600 dark:text-neutral-300" />
        </DockAction>
        <DockAction label="Theme" onClick={() => setTheme("system") }>
          <SunMoon className="h-full w-full text-neutral-600 dark:text-neutral-300" />
        </DockAction>
      </Dock>
    </div>
  );
}

// --- Dock primitives (scoped to this feature) ---

type DocContextType = {
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  magnification: number;
  distance: number;
};

const DockContext = React.createContext<DocContextType | undefined>(undefined);

function useDock() {
  const context = React.useContext(DockContext);
  if (!context) throw new Error("useDock must be used within a DockProvider");
  return context;
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
}: React.PropsWithChildren<DockProps>) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const maxHeight = useMemo(() => Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4), [magnification]);
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <MDiv style={{ height }} className="mx-2 flex max-w-full items-end overflow-x-auto">
      <MDiv
        onMouseMove={({ pageX }: any) => { isHovered.set(1); mouseX.set(pageX); }}
        onMouseLeave={() => { isHovered.set(0); mouseX.set(Infinity); }}
        className={cn("mx-auto flex w-fit gap-4 rounded-2xl bg-gray-50 px-4 pb-3 dark:bg-neutral-900 pointer-events-auto", className)}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Quick actions dock"
      >
        <DockContext.Provider value={{ mouseX, spring, distance, magnification }}>
          {children}
        </DockContext.Provider>
      </MDiv>
    </MDiv>
  );
}

function DockAction({ label, children, onClick, onClickHref }: { label: string; children: React.ReactNode; onClick?: () => void; onClickHref?: string; }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const { distance, magnification, mouseX, spring } = useDock();
  const router = useRouter();
  const isHovered = useMotionValue(0);
  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 } as any;
    return val - (domRect as any).x - ((domRect as any).width as number) / 2;
  });
  const widthTransform = useTransform(mouseDistance, [-distance, 0, distance], [40, magnification, 40]);
  const width = useSpring(widthTransform, spring);

  const handleClick = () => {
    if (onClickHref) router.push(onClickHref);
    else onClick?.();
  };

  return (
    <DockItem ref={ref} width={width} isHovered={isHovered} onActivate={handleClick}>
      <DockLabel>{label}</DockLabel>
      <DockIcon>{children}</DockIcon>
    </DockItem>
  );
}

const DockItem = React.forwardRef<HTMLButtonElement, any>(function DockItem({ children, className, width, isHovered, onActivate }, ref) {
  return (
    <MButton
      ref={ref}
      style={{ width }}
      onMouseEnter={() => isHovered.set(1)}
      onMouseLeave={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onActivate}
      className={cn("relative inline-flex items-center justify-center aspect-square rounded-full bg-gray-200 dark:bg-neutral-800", className)}
      tabIndex={0}
      role="button"
      aria-haspopup="false"
    >
      {React.Children.map(children, (child: any) => React.cloneElement(child as any, { width, isHovered }))}
    </MButton>
  );
});

function DockLabel({ children, className, ...rest }: any) {
  const isHovered = (rest as Record<string, unknown>)["isHovered"] as MotionValue<number>;
  const [isVisible, setIsVisible] = React.useState(false);
  React.useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => setIsVisible(latest === 1));
    return () => unsubscribe();
  }, [isHovered]);
  return (
    <AnimatePresence>
      {isVisible && (
        <MDiv
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("absolute -top-6 left-1/2 w-fit whitespace-pre rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white", className)}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </MDiv>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, ...rest }: any) {
  const width = (rest as Record<string, unknown>)["width"] as MotionValue<number>;
  const widthTransform = useTransform(width, (val) => val / 2);
  return (
    <MDiv style={{ width: widthTransform }} className={cn("flex items-center justify-center", className)}>
      {children}
    </MDiv>
  );
}
