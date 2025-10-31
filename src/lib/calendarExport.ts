// Utilitaires pour l'export de calendrier (.ics et JSON)

import type { CalendarEvent } from "@/widgets/Calendar/types";

/**
 * Exporte les événements au format JSON
 */
export function exportCalendarToJSON(events: CalendarEvent[]): void {
	const dataStr = JSON.stringify(events, null, 2);
	const dataBlob = new Blob([dataStr], { type: "application/json" });
	const url = URL.createObjectURL(dataBlob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `calendar-events-${new Date().toISOString().split("T")[0]}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Exporte les événements au format .ics (iCalendar)
 */
export function exportCalendarToICS(events: CalendarEvent[]): void {
	let icsContent = "BEGIN:VCALENDAR\n";
	icsContent += "VERSION:2.0\n";
	icsContent += "PRODID:-//Dashboard Personnel//Calendar Widget//EN\n";
	icsContent += "CALSCALE:GREGORIAN\n";
	icsContent += "METHOD:PUBLISH\n";

	events.forEach((event) => {
		const startDate = event.date;
		const startTime = event.time ? event.time.replace(":", "") : "0000";
		const dtStart = `${startDate.replace(/-/g, "")}T${startTime}00`;

		// End date/time (1 hour after start if time is specified, or end of day)
		let dtEnd = `${startDate.replace(/-/g, "")}T${event.time ? startTime : "2359"}00`;
		if (event.time) {
			const [hours, minutes] = event.time.split(":");
			const endHour = String((parseInt(hours) + 1) % 24).padStart(2, "0");
			dtEnd = `${startDate.replace(/-/g, "")}T${endHour}${minutes}00`;
		}

		icsContent += "BEGIN:VEVENT\n";
		icsContent += `UID:${event.id}@dashboard-personnel\n`;
		icsContent += `DTSTART:${dtStart}\n`;
		icsContent += `DTEND:${dtEnd}\n`;
		icsContent += `SUMMARY:${escapeICS(event.title)}\n`;
		if (event.description) {
			icsContent += `DESCRIPTION:${escapeICS(event.description)}\n`;
		}
		icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z\n`;
		icsContent += "END:VEVENT\n";
	});

	icsContent += "END:VCALENDAR\n";

	const dataBlob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
	const url = URL.createObjectURL(dataBlob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `calendar-events-${new Date().toISOString().split("T")[0]}.ics`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Échappe les caractères spéciaux pour le format ICS
 */
function escapeICS(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\n/g, "\\n");
}

/**
 * Importe les événements depuis un fichier JSON
 */
export function importCalendarFromJSON(
	file: File,
	onSuccess: (events: CalendarEvent[]) => void,
	onError: (error: string) => void
): void {
	if (!file.name.endsWith(".json")) {
		onError("Le fichier doit être au format JSON");
		return;
	}

	const reader = new FileReader();
	reader.onload = (event) => {
		try {
			const imported = JSON.parse(event.target?.result as string) as CalendarEvent[];
			if (Array.isArray(imported)) {
				// Valider que chaque événement a les champs requis
				const validEvents = imported.filter(
					(e) => e.id && e.title && e.date && e.createdAt
				);
				onSuccess(validEvents);
			} else {
				onError("Le fichier JSON doit contenir un tableau d'événements");
			}
		} catch {
			onError("Le fichier JSON est invalide");
		}
	};
	reader.readAsText(file);
}

