declare module "framer-motion" {
	import type { ComponentType, HTMLAttributes } from "react";
	export const motion: {
		[key in keyof JSX.IntrinsicElements]: ComponentType<HTMLAttributes<HTMLElement>>;
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
