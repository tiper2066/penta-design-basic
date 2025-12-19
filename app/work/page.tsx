'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Download,
    ChevronLeft,
    ChevronRight,
    X,
    MoreVertical,
    Calendar,
    User,
    Info,
    ImageIcon,
    Edit,
    Trash2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";
import { WorkUploadDialog } from "@/components/work/WorkUploadDialog";
import { WorkEditDialog } from "@/components/work/WorkEditDialog";

// Interface for work items from database
interface WorkItem {
    id: string;
    title: string;
    category: string;
    description: string;
    images?: string[]; // Array of URLs
    imageNames?: string[]; // Original filenames
    attachments?: { id?: string; url: string; filename: string; size: number }[];
    uploadedBy: string;
    date: string; // Formatted date string
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


export default function WorkPage() {
    const { data: session } = useSession();
    const [works, setWorks] = useState<WorkItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const fetchWorks = async () => {
        try {
            const response = await fetch('/api/works');
            if (response.ok) {
                const dbWorks = await response.json();
                const formattedWorks = dbWorks.map((w: any) => ({
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
                    }).replace(/\. /g, '.').substring(0, 10)
                }));
                // Set only database works (exclude WALLPAPER)
                const filteredWorks = formattedWorks.filter((w: any) => w.category !== 'WALLPAPER');
                setWorks(filteredWorks);
            }
        } catch (error) {
            console.error("Failed to fetch works", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorks();
    }, []);

    const searchParams = useSearchParams();

    useEffect(() => {
        const id = searchParams.get('id');
        if (id && works.length > 0) {
            const found = works.find(w => w.id === id);
            if (found) setSelectedItem(found);
        }
    }, [searchParams, works]);

    const handleNext = () => {
        if (!selectedItem) return;
        const currentIndex = works.findIndex(w => w.id === selectedItem.id);
        const nextIndex = (currentIndex + 1) % works.length;
        setSelectedItem(works[nextIndex]);
    };

    const handlePrev = () => {
        if (!selectedItem) return;
        const currentIndex = works.findIndex(w => w.id === selectedItem.id);
        const prevIndex = (currentIndex - 1 + works.length) % works.length;
        setSelectedItem(works[prevIndex]);
    };

    const getPreviewImage = (item: WorkItem) => {
        if (item.images && item.images.length > 0) {
            return item.images[0];
        }
        return null;
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
        } catch {
            window.open(url, '_blank');
        }
    };

    const handleEdit = (item: WorkItem) => {
        setEditingItem(item);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (item: WorkItem) => {
        if (!confirm(`"${item.title}" 게시물을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/works/${item.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error || '게시물 삭제에 실패했습니다.');
                return;
            }

            alert('게시물이 성공적으로 삭제되었습니다.');
            fetchWorks(); // Refresh the list
        } catch (error) {
            console.error('Delete error:', error);
            alert('게시물 삭제 중 오류가 발생했습니다.');
        }
    };

    const isAdmin = session?.user && (session.user as any).role === 'ADMIN';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Penta Design</h1>
                    <p className="text-muted-foreground">기 제작된 디자인 산출물을 확인하고 다운로드하세요.</p>
                </div>
                {/* Only show Upload button to ADMIN users */}
                {session?.user && (session.user as any).role === 'ADMIN' && (
                    <WorkUploadDialog onSuccess={fetchWorks} uploadPath="works" />
                )}
            </div>

            {works.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ImageIcon className="h-16 w-16 mb-4 opacity-20 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">아직 업로드된 게시물이 없습니다</h3>
                    <p className="text-muted-foreground mb-4">
                        관리자가 첫 번째 디자인 작업물을 업로드해보세요.
                    </p>
                    {isAdmin && (
                        <WorkUploadDialog onSuccess={fetchWorks} uploadPath="works" />
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6 sm:gap-3 items-start" style={{ gridAutoRows: 'max-content' }}>
                    {works.map((item) => {
                    const previewImg = getPreviewImage(item);
                    return (
                        <Card
                            key={item.id}
                            className="py-0 gap-3 overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-transparent hover:border-sidebar-primary/20 flex flex-col max-w-[320px]"
                            onClick={() => setSelectedItem(item)}
                        >
                            {/* Image Area - Dynamic Height */}
                            <div className="bg-muted flex items-center justify-center relative overflow-hidden">
                                {previewImg ? (
                                    <img
                                        src={previewImg}
                                        alt={item.title}
                                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                        style={{ maxHeight: '400px' }}
                                    />
                                ) : (
                                    <div className="w-full h-48 flex flex-col items-center justify-center text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                                        <span className="font-medium text-xs">No Image</span>
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="secondary" size="sm" className="pointer-events-none">
                                        상세보기
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Fixed Height Info Area */}
                            <CardHeader className="p-4 h-auto flex-shrink-0">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <CardTitle className="text-base font-semibold">
                                            {item.title && item.title.length > 18 ? `${item.title.slice(0, 18)}...` : item.title || 'Title'}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                                    </div>
                                    {isAdmin ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={(e) => { e.stopPropagation(); }}>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    수정
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                                    className="text-red-600 dark:text-red-400"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    삭제
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={(e) => { e.stopPropagation(); }}>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                        </Card>
                    );
                    })}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent
                    className="!fixed !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-full !h-full bg-transparent shadow-none border-none p-0 flex items-center justify-center pointer-events-none"
                    hideCloseButton
                    aria-describedby={undefined}
                >
                    <DialogTitle className="sr-only">
                        {selectedItem?.title} Detail View
                    </DialogTitle>

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

                                        {/* Files (Mock for now, could link to original images) */}
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
                                                                    <p className="text-xs text-muted-foreground">Original</p>
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    );
                                                })
                                            )}

                                            {!selectedItem.images?.length && !selectedItem.attachments?.length && (
                                                <p className="text-sm text-muted-foreground italic">No downloadable files.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-6 border-t bg-muted/20 space-y-3">
                                        <Button className="w-full" size="lg" onClick={() => {
                                            selectedItem?.images?.forEach((imgUrl, idx) => {
                                                const name = selectedItem?.imageNames?.[idx] || (imgUrl.split('?')[0].split('/').pop() || `Image_${idx + 1}.png`);
                                                handleDownload(imgUrl, name);
                                            });
                                        }}>
                                            Download All Assets
                                        </Button>
                                        
                                        {/* Admin Actions */}
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    className="flex-1"
                                                    onClick={() => {
                                                        setSelectedItem(null);
                                                        handleEdit(selectedItem!);
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
                                                        handleDelete(selectedItem!);
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
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <WorkEditDialog
                work={editingItem}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSuccess={() => {
                    fetchWorks();
                    setEditingItem(null);
                }}
                uploadPath="works"
            />
        </div>
    );
}
