"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "../overview/hooks/use-sessions";

export function SessionsListPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const filters = useMemo(() => ({
    search: searchTerm || undefined
  }), [searchTerm]);
  
  const { sessions, loading, error, total, totalPages } = useSessions(filters, currentPage, 10);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline">Tag</Button>
        <Button variant="outline">Generate Reports</Button>
        <div className="ml-auto flex items-center gap-2">
          <Input 
            placeholder="Search sessions…" 
            className="w-64" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline">Filters</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All Sessions 
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              Error loading sessions: {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm ? 'No sessions found matching your search.' : 'No sessions yet. Start your first session!'}
            </div>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{session.title || 'Untitled Session'}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString()} • {session.type || 'General'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={session.status === 'active' ? 'default' : session.status === 'completed' ? 'secondary' : 'destructive'}
                  >
                    {session.status}
                  </Badge>
                  {session.type && (
                    <Badge variant="outline">{session.type}</Badge>
                  )}
                  <Button size="sm" variant="ghost">Peek</Button>
                  <Button size="sm" onClick={() => location.assign(`/dashboard/sessions/${session.id}`)}>
                    Open
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

