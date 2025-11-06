// src/widgets/Pomodoro/PomodoroWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, memo, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import { addSession } from "@/store/pomodoroStorage";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type TimerMode = "work" | "shortBreak" | "longBreak";

function PomodoroWidgetComponent({ size = "medium" }: WidgetProps) {
	const [mode, setMode] = useState<TimerMode>("work");
	const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes en secondes
	const [isRunning, setIsRunning] = useState(false);
	const [sessionCount, setSessionCount] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const isCompact = useMemo(() => size === "compact", [size]);
	const isMedium = useMemo(() => size === "medium", [size]);
	const isFull = useMemo(() => size === "full", [size]);
	const padding = isCompact ? "p-2" : isMedium ? "p-3" : "p-4";

	const TIMES = {
		work: 25 * 60,
		shortBreak: 5 * 60,
		longBreak: 15 * 60,
	};

	useEffect(() => {
		setTimeLeft(TIMES[mode]);
	}, [mode]);

	useEffect(() => {
		if (isRunning && timeLeft > 0) {
			intervalRef.current = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setIsRunning(false);
						// Session terminée
						const dateStr = format(new Date(), "yyyy-MM-dd");
						addSession({
							date: dateStr,
							duration: TIMES[mode] / 60,
							completed: true,
						});
						setSessionCount((prev) => prev + 1);
						// Passer au break après work
						if (mode === "work") {
							setTimeout(() => {
								setMode(sessionCount % 4 === 3 ? "longBreak" : "shortBreak");
							}, 1000);
						} else {
							setTimeout(() => {
								setMode("work");
							}, 1000);
						}
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isRunning, timeLeft, mode, sessionCount]);

	const handleStart = useCallback(() => {
		setIsRunning(true);
	}, []);

	const handlePause = useCallback(() => {
		setIsRunning(false);
	}, []);

	const handleReset = useCallback(() => {
		setIsRunning(false);
		setTimeLeft(TIMES[mode]);
	}, [mode]);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const progress = 1 - timeLeft / TIMES[mode];

	const stats = useMemo(() => {
		try {
			const stored = localStorage.getItem("pomodoro:sessions");
			const sessions = stored ? JSON.parse(stored) : [];
			const today = format(new Date(), "yyyy-MM-dd");
			const todaySessions = sessions.filter((s: { date: string; completed: boolean }) => s.date === today && s.completed);
			return {
				today: todaySessions.length,
				total: sessions.filter((s: { completed: boolean }) => s.completed).length,
			};
		} catch {
			return { today: 0, total: 0 };
		}
	}, [sessionCount]);

	return (
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0 overflow-hidden", padding)}>
			{isCompact ? (
				/* VERSION COMPACTE - Ultra minimaliste */
				<div className="flex flex-col items-center justify-center gap-2 flex-1 min-w-0 overflow-hidden">
					<div className="text-3xl font-bold truncate">
						{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
					</div>
					{isRunning ? (
						<Button
							size="sm"
							className="shrink-0"
							onClick={handlePause}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Pause className="h-3 w-3" />
						</Button>
					) : (
						<Button
							size="sm"
							className="shrink-0"
							onClick={handleStart}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Play className="h-3 w-3" />
						</Button>
					)}
				</div>
			) : isMedium ? (
				/* VERSION MEDIUM - Compacte mais complète, sans scroll */
				<div className="flex flex-col h-full gap-2.5 min-w-0 overflow-hidden">
					{/* Header : Mode selector compact */}
					<div className="flex gap-1.5 shrink-0 min-w-0">
						<Button
							variant={mode === "work" ? "default" : "outline"}
							size="sm"
							className="h-7 text-xs flex-1 min-w-0 truncate"
							onClick={() => setMode("work")}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Travail
						</Button>
						<Button
							variant={mode === "shortBreak" ? "default" : "outline"}
							size="sm"
							className="h-7 text-xs flex-1 min-w-0 truncate"
							onClick={() => setMode("shortBreak")}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Pause
						</Button>
					</div>

					{/* Timer avec cercle progressif plus petit */}
					<div className="relative flex items-center justify-center flex-1 min-h-0 min-w-0 overflow-hidden">
						<svg className="w-32 h-32 transform -rotate-90 shrink-0 max-w-full max-h-full" viewBox="0 0 128 128" preserveAspectRatio="xMidYMid meet">
							<circle
								cx="64"
								cy="64"
								r="56"
								stroke="currentColor"
								strokeWidth="6"
								fill="none"
								className="text-muted"
							/>
							<circle
								cx="64"
								cy="64"
								r="56"
								stroke="currentColor"
								strokeWidth="6"
								fill="none"
								strokeDasharray={`${2 * Math.PI * 56}`}
								strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress)}`}
								className="text-primary transition-all duration-1000"
							/>
						</svg>
						<div className="absolute text-center min-w-0">
							<div className="text-2xl font-bold truncate">
								{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
							</div>
							<div className="text-[10px] text-muted-foreground mt-0.5 truncate">
								{mode === "work" ? "Travail" : "Pause"}
							</div>
						</div>
					</div>

					{/* Controls compacts */}
					<div className="flex gap-1.5 shrink-0 justify-center min-w-0">
						{isRunning ? (
							<Button
								size="sm"
								className="h-7 text-xs px-2.5 shrink-0 truncate"
								onClick={handlePause}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Pause className="h-3 w-3 mr-1 shrink-0" />
								<span className="truncate">Pause</span>
							</Button>
						) : (
							<Button
								size="sm"
								className="h-7 text-xs px-2.5 shrink-0 truncate"
								onClick={handleStart}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Play className="h-3 w-3 mr-1 shrink-0" />
								<span className="truncate">Démarrer</span>
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs px-2 shrink-0"
							onClick={handleReset}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<RotateCcw className="h-3 w-3" />
						</Button>
					</div>

					{/* Stats compactes */}
					<div className="text-[10px] text-muted-foreground text-center shrink-0 truncate">
						{stats.today} session{stats.today > 1 ? "s" : ""} aujourd'hui
					</div>
				</div>
			) : isFull ? (
				/* VERSION FULL - Version complète avec tous les détails (réduite) */
				<div className="flex flex-col items-center justify-center gap-3 flex-1 min-w-0 overflow-hidden">
					{/* Mode selector */}
					<div className="flex gap-1.5 shrink-0 min-w-0">
						<Button
							variant={mode === "work" ? "default" : "outline"}
							size="sm"
							className="h-7 text-xs truncate"
							onClick={() => setMode("work")}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Travail
						</Button>
						<Button
							variant={mode === "shortBreak" ? "default" : "outline"}
							size="sm"
							className="h-7 text-xs truncate"
							onClick={() => setMode("shortBreak")}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Pause
						</Button>
					</div>

					{/* Timer - Réduit */}
					<div className="relative w-40 h-40 flex items-center justify-center shrink-0 max-w-full max-h-full">
						<svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160" preserveAspectRatio="xMidYMid meet">
							<circle
								cx="80"
								cy="80"
								r="72"
								stroke="currentColor"
								strokeWidth="6"
								fill="none"
								className="text-muted"
							/>
							<circle
								cx="80"
								cy="80"
								r="72"
								stroke="currentColor"
								strokeWidth="6"
								fill="none"
								strokeDasharray={`${2 * Math.PI * 72}`}
								strokeDashoffset={`${2 * Math.PI * 72 * (1 - progress)}`}
								className="text-primary transition-all duration-1000"
							/>
						</svg>
						<div className="absolute text-center min-w-0">
							<div className="text-3xl font-bold truncate">
								{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
							</div>
							<div className="text-xs text-muted-foreground mt-0.5 truncate">{mode === "work" ? "Travail" : "Pause"}</div>
						</div>
					</div>

					{/* Controls - Compacts */}
					<div className="flex gap-1.5 shrink-0 min-w-0">
						{isRunning ? (
							<Button
								size="sm"
								className="h-8 text-xs truncate"
								onClick={handlePause}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Pause className="h-3.5 w-3.5 mr-1.5 shrink-0" />
								<span className="truncate">Pause</span>
							</Button>
						) : (
							<Button
								size="sm"
								className="h-8 text-xs truncate"
								onClick={handleStart}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Play className="h-3.5 w-3.5 mr-1.5 shrink-0" />
								<span className="truncate">Démarrer</span>
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs shrink-0"
							onClick={handleReset}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<RotateCcw className="h-3.5 w-3.5 mr-1.5 shrink-0" />
							<span className="truncate">Reset</span>
						</Button>
					</div>

					{/* Stats */}
					<div className="text-[10px] text-muted-foreground shrink-0 truncate">
						{stats.today} session{(stats.today > 1 ? "s" : "")} aujourd'hui
					</div>
				</div>
			) : null}
		</Card>
	);
}

export const PomodoroWidget = memo(PomodoroWidgetComponent);

