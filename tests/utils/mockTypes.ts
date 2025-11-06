/**
 * Types pour les mocks de composants UI dans les tests
 */

import type { ReactNode } from "react";

export interface MockComponentProps {
	children?: ReactNode;
	[key: string]: unknown;
}

export interface MockCommandItemProps {
	children?: ReactNode;
	onSelect?: () => void;
	[key: string]: unknown;
}

