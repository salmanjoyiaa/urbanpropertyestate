import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SkeletonCard from "@/components/skeleton-card";

export default function PropertiesLoading() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <div className="pt-16">
                {/* Filter bar skeleton */}
                <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex gap-2">
                            <div className="flex-1 h-10 rounded-md bg-muted animate-pulse" />
                            <div className="w-[160px] h-10 rounded-md bg-muted animate-pulse hidden sm:block" />
                            <div className="w-20 h-10 rounded-md bg-muted animate-pulse" />
                            <div className="w-10 h-10 rounded-md bg-muted animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <div className="h-9 w-40 bg-muted rounded animate-pulse mb-2" />
                        <div className="h-5 w-60 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
