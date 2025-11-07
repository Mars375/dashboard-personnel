declare module "framer-motion" {
	import type { ComponentType, HTMLAttributes } from "react";
	
	interface MotionProps extends HTMLAttributes<HTMLElement> {
		initial?: false | { opacity?: number; x?: number; y?: number; scale?: number | number[]; [key: string]: unknown };
		animate?: { opacity?: number | number[]; x?: number; y?: number; scale?: number | number[]; background?: string; rotate?: number | number[]; [key: string]: unknown };
		transition?: { duration?: number; type?: string; stiffness?: number; damping?: number; repeat?: number | typeof Infinity; ease?: string | number[]; delay?: number; [key: string]: unknown };
		exit?: { opacity?: number; [key: string]: unknown };
		[key: string]: unknown;
	}
	
	export const motion: {
		[key in keyof JSX.IntrinsicElements]: ComponentType<MotionProps>;
	};
}

declare module "@/components/ui/popover" {
	import type { ComponentType, ReactNode } from "react";
	export const Popover: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
	export const PopoverTrigger: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
	export const PopoverContent: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
}

declare module "@/components/ui/command" {
	import type { ComponentType, ReactNode } from "react";
	export const Command: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
	export const CommandList: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
	export const CommandItem: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
	export const CommandGroup: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
	export const CommandEmpty: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
}
