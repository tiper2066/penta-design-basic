'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ImageIcon, ChevronLeft, ChevronRight, Download, MoreVertical, Edit, Trash2, X, User, Calendar, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { WorkUploadDialog } from "@/components/work/WorkUploadDialog";
import { WorkEditDialog } from "@/components/work/WorkEditDialog";
import { useSession } from 'next-auth/react';

// Reusing interfaces (should be in a shared types file eventually)
interface WorkItem {
    id: string;
    title: string;
    category: string;
    description: string;
    images?: string[];
    imageNames?: string[];
    attachments?: { id?: string; url: string; filename: string; size: number }[];
    uploadedBy: string;
    date: string;
    createdAt?: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();
    const isAdmin = session?.user && (session.user as any).role === 'ADMIN';

    const [results, setResults] = useState<WorkItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
    const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Read params
    const q = searchParams.get('q') || '';

    // Fetch function
    const performSearch = async (page = 1) => {
        setIsLoading(true);
        try {
            // Construct query string from current searchParams but update page
            const currentParams = new URLSearchParams(searchParams.toString());
            currentParams.set('page', page.toString());
            currentParams.set('limit', '12'); // 12 items per page for search

            const response = await fetch(`/api/search?${currentParams.toString()}`);
            if (response.ok) {
                const data = await response.json();
                const dbWorks = data.items || [];
                setTotal(data.total);
                setTotalPages(data.totalPages);
                setCurrentPage(data.page);

                const formatted = dbWorks.map((w: any) => ({
                    id: w.id,
                    title: w.title,
                    category: w.category,
                    description: w.description,
                    images: w.images || [],
                    imageNames: w.imageNames || [],
                    attachments: w.attachments || [],
                    uploadedBy: w.uploadedBy,
                    date: new Date(w.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }).replace(/\. /g, '.').substring(0, 10),
                    createdAt: w.createdAt
                }));
                setResults(formatted);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        performSearch(1); // Reset to page 1 on new search params
    }, [searchParams]);

    const handlePageChange = (newPage: number) => {
        // Just update internal state? No, we should probably scroll to top or re-fetch.
        // It's cleaner to update fetch directly or update URL? 
        // Let's just update fetch here for simplicity, but ideally URL should reflect page.
        // But since we use searchParams in useEffect, changing URL is best.
        // However, standard nextjs router.push might be too heavy. 
        // Let's call performSearch(newPage) directly as we did in other pages.
        performSearch(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ... Copying Helper functions from WorkPage (handleDownload, etc) ...
    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(url, '_blank');
        }
    };

    const getPreviewImage = (item: WorkItem) => {
        if (item.images && item.images.length > 0) return item.images[0];
        return null; // or placeholder
    };

    // ... Dialog handlers ...
    const handleNext = () => {
        if (!selectedItem) return;
        const currentIndex = results.findIndex(w => w.id === selectedItem.id);
        const nextIndex = (currentIndex + 1) % results.length;
        setSelectedItem(results[nextIndex]);
    };

    const handlePrev = () => {
        if (!selectedItem) return;
        const currentIndex = results.findIndex(w => w.id === selectedItem.id);
        const prevIndex = (currentIndex - 1 + results.length) % results.length;
        setSelectedItem(results[prevIndex]);
    };

    // ... Edit/Delete ...
    const handleDelete = async (item: WorkItem) => {
        if (!confirm(`"${item.title}" 게시물을 정말 삭제하시겠습니까?`)) return;
        try {
            const response = await fetch(`/api/works/${item.id}`, { method: 'DELETE' });
            if (response.ok) {
                alert('삭제되었습니다.');
                performSearch(currentPage);
                setSelectedItem(null);
            } else {
                alert('삭제 실패');
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">통합 검색</h1>
                <p className="text-muted-foreground">
                    Keyword: <span className="font-semibold text-foreground">"{q}"</span>에 대한 검색 결과 {total}건
                </p>
                {/* Debug info or Filter tags could go here */}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/20">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <Icons.SearchX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
                    <p className="text-muted-foreground">다른 키워드나 조건으로 다시 검색해보세요.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start">
                    {results.map((item) => {
                        const previewImg = getPreviewImage(item);
                        return (
                            <Card
                                key={item.id}
                                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-transparent hover:border-sidebar-primary/20 flex flex-col"
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                                    {previewImg ? (
                                        <img
                                            src={previewImg}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" size="sm" className="pointer-events-none">
                                            상세보기
                                        </Button>
                                    </div>
                                    <Badge className="absolute top-2 left-2 shadow-sm" variant="secondary">
                                        {item.category}
                                    </Badge>
                                </div>
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <CardTitle className="text-base font-semibold truncate" title={item.title}>
                                                {item.title}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                                        </div>
                                        {isAdmin && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsEditDialogOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {results.length > 0 && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        이전
                    </Button>
                    <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        다음
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                {selectedItem?.category === 'WALLPAPER' ? (
                    <DialogContent
                        className="!fixed !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-full !h-full bg-transparent shadow-none border-none p-0 flex items-center justify-center pointer-events-none"
                    >
                        <DialogTitle className="sr-only">{selectedItem?.title}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {selectedItem?.description || "Image details and download options"}
                        </DialogDescription>

                        {selectedItem && (
                            <>
                                {/* Navigation Buttons */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                    className="pointer-events-auto fixed left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all z-[60] hover:scale-110 hidden md:block"
                                    aria-label="Previous item"
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                    className="pointer-events-auto fixed right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all z-[60] hover:scale-110 hidden md:block"
                                    aria-label="Next item"
                                >
                                    <ChevronRight className="h-8 w-8" />
                                </button>

                                {/* Actual Content Card */}
                                <div className="pointer-events-auto relative w-full h-full md:w-[90vw] md:max-w-[1800px] md:h-[90vh] flex flex-col md:flex-row bg-background md:rounded-lg shadow-2xl overflow-hidden">
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors md:hidden"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>

                                    {/* Left: Image(s) Scroll Area */}
                                    <div className="h-[40vh] md:h-full md:w-[70%] bg-neutral-900 overflow-y-auto no-scrollbar flex items-center justify-center relative">
                                        <div className="w-full h-full flex flex-col items-center justify-center p-0 gap-4">
                                            {selectedItem.images && selectedItem.images.length > 0 ? (
                                                selectedItem.images.map((img, idx) => (
                                                    <div key={idx} className="relative w-full h-full flex-1 min-h-0">
                                                        <img
                                                            src={img}
                                                            alt={`${selectedItem.title} - ${idx + 1}`}
                                                            className="w-full h-full object-cover shadow-lg"
                                                        // onClick={() => setZoomSrc(img)} // Zoom state needed if implemented
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-neutral-500">
                                                    <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                                                    <span>No Image Available</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Info Area */}
                                    <div className="h-[60vh] md:h-full md:w-[30%] flex flex-col bg-background border-l relative">
                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            className="absolute top-4 right-4 z-50 p-2 hover:bg-muted rounded-full transition-colors hidden md:block"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>

                                        <div className="flex-1 overflow-y-auto p-6">
                                            <div className="space-y-6 mt-8 md:mt-0">
                                                <div>
                                                    <h2 className="text-2xl font-bold leading-tight mb-2 pr-8">{selectedItem.title}</h2>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                                        <Badge variant="secondary" className="font-normal">
                                                            {selectedItem.category}
                                                        </Badge>
                                                        <span>•</span>
                                                        <span>{selectedItem.date}</span>
                                                    </div>
                                                </div>

                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                                        {selectedItem.description || "No description provided."}
                                                    </p>
                                                </div>

                                                <div className="pt-6 border-t">
                                                    <h3 className="text-sm font-medium mb-3 text-foreground">Download Assets</h3>
                                                    <div className="space-y-2">
                                                        {selectedItem.images?.map((img, idx) => {
                                                            const displayName = selectedItem.imageNames?.[idx] || img.split('?')[0].split('/').pop() || `image_${idx + 1}.png`;
                                                            return (
                                                                <Button
                                                                    key={idx}
                                                                    variant="outline"
                                                                    className="w-full justify-start h-auto py-3"
                                                                    onClick={() => handleDownload(img, displayName)}
                                                                >
                                                                    <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                    <div className="flex flex-col items-start text-left">
                                                                        <span className="text-sm font-medium">{displayName}</span>
                                                                        <span className="text-xs text-muted-foreground">Original Quality</span>
                                                                    </div>
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="p-6 border-t bg-muted/20 space-y-3">
                                                    <Button className="w-full" size="lg" onClick={() => {
                                                        selectedItem?.images?.forEach((img, idx) => {
                                                            const name = selectedItem?.imageNames?.[idx] || (img.split('?')[0].split('/').pop() || `image_${idx + 1}.png`);
                                                            handleDownload(img, name);
                                                        });
                                                    }}>
                                                        Download All Assets
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                ) : (
                    <DialogContent
                        className="!fixed !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-full !h-full bg-transparent shadow-none border-none p-0 flex items-center justify-center pointer-events-none"
                    >
                        <DialogTitle className="sr-only">
                            {selectedItem?.title} Detail View
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Detailed view of the selected work item
                        </DialogDescription>

                        {selectedItem && (
                            <>
                                {/* Navigation Buttons */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                    className="pointer-events-auto fixed left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all z-[60] hover:scale-110 hidden md:block"
                                    aria-label="Previous item"
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                    className="pointer-events-auto fixed right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all z-[60] hover:scale-110 hidden md:block"
                                    aria-label="Next item"
                                >
                                    <ChevronRight className="h-8 w-8" />
                                </button>

                                {/* Actual Content Card */}
                                <div className="pointer-events-auto relative w-full h-full md:w-[1400px] md:h-[90vh] flex flex-col md:flex-row bg-background md:rounded-lg shadow-2xl overflow-hidden">
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>

                                    {/* Left: Image(s) Scroll Area */}
                                    <div className="h-[40vh] md:h-full md:w-[65%] bg-neutral-900 overflow-y-auto no-scrollbar">
                                        <div className="flex flex-col min-h-full items-center justify-start">
                                            {/* Display images vertically */}
                                            {selectedItem.images && selectedItem.images.length > 0 ? (
                                                selectedItem.images.map((imgUrl, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={imgUrl}
                                                        alt={`${selectedItem.title} - ${idx + 1}`}
                                                        className="w-full max-w-full h-auto object-contain shadow-sm"
                                                    />
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-neutral-500 py-20">
                                                    <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                                                    <p>No Images Available</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Info Area */}
                                    <div className="h-[60vh] md:h-full md:w-[35%] bg-background flex flex-col border-l">
                                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

                                            {/* Title & Meta */}
                                            <div>
                                                <Badge variant="secondary" className="mb-3">{selectedItem.category}</Badge>
                                                <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground">{selectedItem.title}</h2>

                                                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground border-b pb-4">
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4" />
                                                        {selectedItem.uploadedBy}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        {selectedItem.date}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                    <Info className="h-4 w-4" /> Description
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                                    {selectedItem.description}
                                                </p>
                                            </div>

                                            {/* Files */}
                                            <div className="space-y-4 pt-4 border-t">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                    <Download className="h-4 w-4" /> Downloads
                                                </h3>

                                                {selectedItem.attachments && selectedItem.attachments.length > 0 ? (
                                                    selectedItem.attachments.map((a, idx) => (
                                                        <Button
                                                            key={a.id ?? idx}
                                                            variant="outline"
                                                            className="w-full justify-start h-auto py-3"
                                                            onClick={() => handleDownload(a.url, a.filename || `Attachment_${idx + 1}`)}
                                                        >
                                                            <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            <div className="flex items-center gap-3 overflow-hidden w-full">
                                                                <div className="h-9 w-9 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center shrink-0">
                                                                    <span className="text-[10px] font-bold">IMG</span>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium truncate">{a.filename || `Attachment_${idx + 1}`} ({formatBytes(a.size || 0)})</p>
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))
                                                ) : (
                                                    selectedItem.images?.map((imgUrl, idx) => {
                                                        const name = selectedItem.imageNames?.[idx] || (imgUrl.split('?')[0].split('/').pop() || `Image_${idx + 1}.png`);
                                                        return (
                                                            <Button
                                                                key={idx}
                                                                variant="outline"
                                                                className="w-full justify-start h-auto py-3"
                                                                onClick={() => handleDownload(imgUrl, name)}
                                                            >
                                                                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                <div className="flex items-center gap-3 overflow-hidden w-full">
                                                                    <div className="h-9 w-9 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center shrink-0">
                                                                        <span className="text-[10px] font-bold">IMG</span>
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium truncate">{name}</p>
                                                                    </div>
                                                                </div>
                                                            </Button>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                )}
            </Dialog>

            {/* Edit Dialog */}
            <WorkEditDialog
                work={editingItem}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                uploadPath={editingItem?.category === 'WALLPAPER' ? 'wallpaper' : 'works'}
                onSuccess={() => {
                    performSearch(currentPage);
                    setEditingItem(null);
                }}
            />
        </div>
    );
}

const Icons = {
    SearchX: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m13.5 8.5-5 5" /><path d="m8.5 8.5 5 5" /><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
    )
};
