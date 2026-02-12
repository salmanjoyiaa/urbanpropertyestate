import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function MarketplaceLoading() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <div className="pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center mb-10">
                        <div className="h-10 w-72 bg-muted rounded animate-pulse mx-auto mb-4" />
                        <div className="h-5 w-96 bg-muted rounded animate-pulse mx-auto" />
                    </div>

                    {/* Category pills skeleton */}
                    <div className="flex gap-2 flex-wrap justify-center mb-8">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-9 w-24 bg-muted rounded-full animate-pulse" />
                        ))}
                    </div>

                    {/* Grid skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl border overflow-hidden">
                                <div className="aspect-[4/3] bg-muted animate-pulse" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
