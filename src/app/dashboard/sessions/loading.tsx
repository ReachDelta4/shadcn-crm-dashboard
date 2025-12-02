import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-[150px]" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-[100px]" />
                    <Skeleton className="h-9 w-[120px]" />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-[200px]" />
                    <Skeleton className="h-9 w-[100px]" />
                </div>
                <Skeleton className="h-9 w-[150px]" />
            </div>

            <div className="rounded-lg border bg-card">
                <div className="p-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[100px]" />
                        </div>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-4 w-[150px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
