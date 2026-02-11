import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonCard() {
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-1/3" />
            </div>
        </div>
    );
}
