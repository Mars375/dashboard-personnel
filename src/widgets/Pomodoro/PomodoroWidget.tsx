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
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);
	const padding = isCompact ? "p-2" : "p-4";

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
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0", padding)}>
			{isFull ? (
				<div className="flex flex-col items-center justify-center gap-4 flex-1">
					{/* Mode selector */}
					<div className="flex gap-2">
						<Button
							variant={mode === "work" ? "default" : "outline"}
							size="sm"
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

					{/* Timer */}
					<div className="relative w-48 h-48 flex items-center justify-center">
						<svg className="w-full h-full transform -rotate-90">
							<circle
								cx="96"
								cy="96"
								r="88"
								stroke="currentColor"
								strokeWidth="8"
								fill="none"
								className="text-muted"
							/>
							<circle
								cx="96"
								cy="96"
								r="88"
								stroke="currentColor"
								strokeWidth="8"
								fill="none"
								strokeDasharray={`${2 * Math.PI * 88}`}
								strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress)}`}
								className="text-primary transition-all duration-1000"
							/>
						</svg>
						<div className="absolute text-center">
							<div className="text-4xl font-bold">
								{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
							</div>
							<div className="text-sm text-muted-foreground">{mode === "work" ? "Travail" : "Pause"}</div>
						</div>
					</div>

					{/* Controls */}
					<div className="flex gap-2">
						{isRunning ? (
							<Button
								onClick={handlePause}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Pause className="h-4 w-4 mr-2" />
								Pause
							</Button>
						) : (
							<Button
								onClick={handleStart}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Play className="h-4 w-4 mr-2" />
								Démarrer
							</Button>
						)}
						<Button
							variant="outline"
							onClick={handleReset}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<RotateCcw className="h-4 w-4 mr-2" />
							Reset
						</Button>
					</div>

					{/* Stats */}
					<div className="text-xs text-muted-foreground">
							{stats.today} session{(stats.today > 1 ? "s" : "")} aujourd'hui
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-2 flex-1">
					<div className="text-3xl font-bold">
						{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
					</div>
					{isRunning ? (
						<Button
							size="sm"
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
			)}
		</Card>
	);
}

export const PomodoroWidget = memo(PomodoroWidgetComponent);

