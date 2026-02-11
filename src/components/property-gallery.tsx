"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PropertyPhoto } from "@/lib/types";

interface PropertyGalleryProps {
    photos: PropertyPhoto[];
    title: string;
}

export default function PropertyGallery({ photos, title }: PropertyGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!photos || photos.length === 0) {
        return (
            <div className="aspect-[16/9] bg-muted flex items-center justify-center rounded-xl">
                <p className="text-muted-foreground">No photos available</p>
            </div>
        );
    }

    const sortedPhotos = [...photos].sort((a, b) => {
        if (a.is_cover) return -1;
        if (b.is_cover) return 1;
        return a.position - b.position;
    });

    const goTo = (index: number) => {
        setCurrentIndex((index + sortedPhotos.length) % sortedPhotos.length);
    };

    return (
        <div className="relative group">
            {/* Main Image */}
            <div className="aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-xl bg-muted">
                <img
                    src={sortedPhotos[currentIndex].url}
                    alt={`${title} - Photo ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                />
            </div>

            {/* Navigation Arrows */}
            {sortedPhotos.length > 1 && (
                <>
                    <button
                        onClick={() => goTo(currentIndex - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => goTo(currentIndex + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {sortedPhotos.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                className={`w-2 h-2 rounded-full transition-all ${i === currentIndex
                                        ? "bg-white w-6"
                                        : "bg-white/50 hover:bg-white/80"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Counter */}
                    <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                        {currentIndex + 1} / {sortedPhotos.length}
                    </div>
                </>
            )}

            {/* Thumbnails */}
            {sortedPhotos.length > 1 && (
                <div className="hidden md:flex gap-2 mt-3 overflow-x-auto pb-1">
                    {sortedPhotos.map((photo, i) => (
                        <button
                            key={photo.id}
                            onClick={() => goTo(i)}
                            className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-transparent opacity-60 hover:opacity-100"
                                }`}
                        >
                            <img
                                src={photo.url}
                                alt={`Thumbnail ${i + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
