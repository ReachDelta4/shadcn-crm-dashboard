export interface ICSEvent {
	uid: string
	title: string
	description?: string
	location?: string
	startUtc: string // ISO 8601
	endUtc: string // ISO 8601
	timezone: string
	organizerEmail?: string
	organizerName?: string
}

function formatDateTimeUtc(isoString: string): string {
	const date = new Date(isoString)
	const year = date.getUTCFullYear()
	const month = String(date.getUTCMonth() + 1).padStart(2, '0')
	const day = String(date.getUTCDate()).padStart(2, '0')
	const hour = String(date.getUTCHours()).padStart(2, '0')
	const minute = String(date.getUTCMinutes()).padStart(2, '0')
	const second = String(date.getUTCSeconds()).padStart(2, '0')
	return `${year}${month}${day}T${hour}${minute}${second}Z`
}

function escapeText(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateICS(event: ICSEvent): string {
	const lines: string[] = []
	lines.push('BEGIN:VCALENDAR')
	lines.push('VERSION:2.0')
	lines.push('PRODID:-//Salesy CRM//Appointments//EN')
	lines.push('CALSCALE:GREGORIAN')
	lines.push('METHOD:REQUEST')
	lines.push('BEGIN:VEVENT')
	lines.push(`UID:${event.uid}`)
	lines.push(`DTSTAMP:${formatDateTimeUtc(new Date().toISOString())}`)
	lines.push(`DTSTART:${formatDateTimeUtc(event.startUtc)}`)
	lines.push(`DTEND:${formatDateTimeUtc(event.endUtc)}`)
	lines.push(`SUMMARY:${escapeText(event.title)}`)
	if (event.description) {
		lines.push(`DESCRIPTION:${escapeText(event.description)}`)
	}
	if (event.location) {
		lines.push(`LOCATION:${escapeText(event.location)}`)
	}
	if (event.organizerEmail) {
		const name = event.organizerName ? `;CN=${escapeText(event.organizerName)}` : ''
		lines.push(`ORGANIZER${name}:mailto:${event.organizerEmail}`)
	}
	lines.push('STATUS:CONFIRMED')
	lines.push('SEQUENCE:0')
	lines.push('END:VEVENT')
	lines.push('END:VCALENDAR')
	return lines.join('\r\n')
}

export function generateICSDataUrl(event: ICSEvent): string {
	const icsContent = generateICS(event)
	const base64 = Buffer.from(icsContent).toString('base64')
	return `data:text/calendar;base64,${base64}`
}

export function generateICSDownloadFilename(title: string, startUtc: string): string {
	const date = new Date(startUtc)
	const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
	const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
	return `${safeTitle}_${dateStr}.ics`
}
