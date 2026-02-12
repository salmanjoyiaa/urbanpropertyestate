import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function NotFound() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="font-display text-8xl font-bold text-primary/10 mb-4">
                        404
                    </div>
                    <h1 className="font-display text-3xl font-bold mb-3">
                        Page Not Found
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild size="lg">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/properties">
                                <Search className="mr-2 h-4 w-4" />
                                Browse Properties
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
