import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-9 w-40 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-5 w-60 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-36 bg-muted rounded-md animate-pulse" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-9 w-12 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-14 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
