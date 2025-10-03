"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Notification {
	id: string;
	title: string;
	message: string;
	created_at: string;
	read: boolean;
}

export function NotificationBell() {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [open, setOpen] = useState(false)

	useEffect(() => {
		loadNotifications()
		const interval = setInterval(loadNotifications, 30000) // Poll every 30s
		return () => clearInterval(interval)
	}, [])

	async function loadNotifications() {
		try {
			const res = await fetch("/api/notifications?limit=10&unread=true")
			if (!res.ok) return
			const data = await res.json()
			setNotifications(data.notifications || [])
			setUnreadCount(data.count || 0)
		} catch {}
	}

	async function markAllRead() {
		try {
			await fetch("/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ mark_all: true }),
			})
			setUnreadCount(0)
			setNotifications([])
		} catch {}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
							{unreadCount > 9 ? "9+" : unreadCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="flex items-center justify-between mb-2">
					<h4 className="font-semibold">Notifications</h4>
					{unreadCount > 0 && (
						<Button variant="ghost" size="sm" onClick={markAllRead}>
							Mark all read
						</Button>
					)}
				</div>
				<div className="space-y-2 max-h-[400px] overflow-y-auto">
					{notifications.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-4">No new notifications</p>
					) : (
						notifications.map(n => (
							<div key={n.id} className="p-2 border rounded text-sm">
								<div className="font-medium">{n.title}</div>
								<div className="text-muted-foreground">{n.message}</div>
								<div className="text-xs text-muted-foreground mt-1">
									{new Date(n.created_at).toLocaleString()}
								</div>
							</div>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	)
}
