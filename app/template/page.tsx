'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Plus, MoreVertical, Edit, Trash2, Loader2, ImageIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { WorkUploadDialog } from "@/components/work/WorkUploadDialog";
import { WorkEditDialog } from "@/components/work/WorkEditDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";

// Interface for database items
interface WorkItem {
    id: string;
    title: string;
    category: string;
    description: string;
    images?: string[];
    imageNames?: string[];
    uploadedBy: string;
    date: string;
}

export default function TemplatePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get('type');
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    // State for Wallpaper Gallery
    const [wallpapers, setWallpapers] = useState<WorkItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
    const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [zoomSrc, setZoomSrc] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Existing hardcoded templates
    const templates = [
        { id: 1, title: 'Corporate PPT 2025', type: 'PPT' },
        { id: 2, title: 'Letterhead A4', type: 'Word' },
        { id: 3, title: 'Business Card v2', type: 'Print' },
        { id: 4, title: 'Email Signature', type: 'HTML' },
    ];

    const fetchWallpapers = async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/works?category=WALLPAPER&page=${page}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                // API now returns { items: [], total, ... }
                const dbWorks = data.items || [];
                setTotalPages(data.totalPages || 1);

                const formatted = dbWorks.map((w: any) => ({
                    id: w.id,
                    title: w.title,
                    category: w.category,
                    description: w.description,
                    images: w.images || [],
                    imageNames: w.imageNames || [],
                    uploadedBy: w.uploadedBy,
                    date: new Date(w.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }).replace(/\. /g, '.').substring(0, 10)
                }));
                setWallpapers(formatted);
            }
        } catch (error) {
            console.error("Failed to fetch wallpapers", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (type === 'wallpaper') {
            fetchWallpapers(currentPage);
        }
    }, [type, currentPage]);

    useEffect(() => {
        if (type === 'wallpaper') {
            const id = searchParams.get('id');
            if (id && wallpapers.length > 0) {
                const found = wallpapers.find(w => w.id === id);
                if (found) setSelectedItem(found);
            }
        }
    }, [type, wallpapers, searchParams]);

    const handleDelete = async (id: string) => {
        if (!confirm('정말로 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/works/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchWallpapers();
                setSelectedItem(null);
            } else {
                alert('삭제 실패');
            }
        } catch (error) {
            console.error('Error deleting work:', error);
        }
    };

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
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    const handleNext = () => {
        if (!selectedItem) return;
        const currentIndex = wallpapers.findIndex(w => w.id === selectedItem.id);
        const nextIndex = (currentIndex + 1) % wallpapers.length;
        setSelectedItem(wallpapers[nextIndex]);
    };

    const handlePrev = () => {
        if (!selectedItem) return;
        const currentIndex = wallpapers.findIndex(w => w.id === selectedItem.id);
        const prevIndex = (currentIndex - 1 + wallpapers.length) % wallpapers.length;
        setSelectedItem(wallpapers[prevIndex]);
    };

    if (type === 'wallpaper') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">WALLPAPER</h1>
                        <p className="text-muted-foreground">PC 및 모바일 배경화면을 다운로드하세요.</p>
                    </div>
                    {isAdmin && (
                        <WorkUploadDialog
                            trigger={
                                <Button>
                                    <Plus className="h-4 w-4" /> 게시물 추가
                                </Button>
                            }
                            initialCategory="WALLPAPER"
                            uploadPath="wallpaper"
                            onSuccess={() => fetchWallpapers(currentPage)}
                        />
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    wallpapers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <ImageIcon className="h-16 w-16 mb-4 opacity-20 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">아직 업로드된 게시물이 없습니다</h3>
                            <p className="text-muted-foreground mb-4">관리자가 첫 번째 배경화면을 업로드해보세요.</p>
                            {isAdmin && (
                                <WorkUploadDialog
                                    trigger={<Button><Plus className="h-4 w-4" /> 게시물 추가</Button>}
                                    initialCategory="WALLPAPER"
                                    uploadPath="wallpaper"
                                    onSuccess={() => fetchWallpapers(currentPage)}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {wallpapers.map((item) => (
                                <Card key={item.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all py-0 border-transparent hover:border-sidebar-primary/20" onClick={() => setSelectedItem(item)}>
                                    <div className="aspect-square bg-muted relative overflow-hidden">
                                        {item.images && item.images.length > 0 ? (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.title}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                                className="object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                <ImageIcon className="h-10 w-10" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm" className="pointer-events-none">
                                                상세보기
                                            </Button>
                                        </div>
                                    </div>
                                    <CardHeader className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                                                <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                                            </div>
                                            {isAdmin && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={(e) => e.stopPropagation()}>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingItem(item);
                                                            setIsEditDialogOpen(true);
                                                        }}>
                                                            <Edit className="mr-2 h-4 w-4" /> 수정
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(item.id);
                                                        }}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> 삭제
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )
                )}

                {/* Pagination Controls */}
                {wallpapers.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            다음
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}

                {/* Detail Dialog */}
                <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
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
                                        {/* Edit Button */}
                                        <Button
                                            size="sm"
                                            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (selectedItem.images && selectedItem.images.length > 0) {
                                                    router.push(`/editor/${selectedItem.id}?url=${encodeURIComponent(selectedItem.images[0])}&name=${encodeURIComponent(selectedItem.title)}`);
                                                }
                                            }}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            편집하기
                                        </Button>

                                        <div className="w-full h-full flex flex-col items-center justify-center p-0 gap-4">
                                            {selectedItem.images && selectedItem.images.length > 0 ? (
                                                selectedItem.images.map((img, idx) => (
                                                    <div key={idx} className="relative w-full h-full flex-1 min-h-0">
                                                        <img
                                                            src={img}
                                                            alt={`${selectedItem.title} - ${idx + 1}`}
                                                            className="w-full h-full object-cover shadow-lg cursor-zoom-in"
                                                            onClick={() => setZoomSrc(img)}
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
                                                    {isAdmin && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                className="flex-1"
                                                                onClick={() => {
                                                                    setSelectedItem(null);
                                                                    setEditingItem(selectedItem!);
                                                                    setIsEditDialogOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                수정
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                className="flex-1"
                                                                onClick={() => {
                                                                    setSelectedItem(null);
                                                                    handleDelete(selectedItem!.id);
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                삭제
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {zoomSrc && (
                            <div
                                className="pointer-events-auto fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center"
                                role="dialog"
                                aria-modal="true"
                            >
                                <button
                                    aria-label="Close zoom"
                                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    onClick={() => setZoomSrc(null)}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <img
                                    src={zoomSrc}
                                    alt="Zoomed"
                                    className="max-w-[95vw] max-h-[95vh] object-contain"
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <WorkEditDialog
                    work={editingItem}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    uploadPath="wallpaper"
                    onSuccess={() => {
                        fetchWallpapers(currentPage);
                        setEditingItem(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">TEMPLATE</h1>
                <p className="text-muted-foreground">업무에 필요한 공식 템플릿을 다운로드하세요.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {templates.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[3/4] bg-muted/30 p-6 flex flex-col items-center justify-center relative">
                            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                            <span className="font-mono text-sm text-muted-foreground">.{item.type.toLowerCase()}</span>
                        </div>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{item.type} Template</p>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <Button className="w-full">
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
