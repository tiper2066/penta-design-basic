'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, Loader2, Save, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface WorkItem {
    id: string | number;
    title: string;
    category: string;
    description: string;
    images?: string[];
    uploadedBy: string;
    date: string;
}

interface WorkEditDialogProps {
    work: WorkItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function WorkEditDialog({ work, open, onOpenChange, onSuccess }: WorkEditDialogProps) {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form when work changes
    React.useEffect(() => {
        if (work) {
            setTitle(work.title);
            setCategory(work.category);
            setDescription(work.description);
            setExistingImages(work.images || []);
            setNewImages([]);
            setImagesToDelete([]);
        }
    }, [work]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewImages(prev => [...prev, ...files]);
        }
    };

    const removeExistingImage = (imageUrl: string) => {
        setExistingImages(prev => prev.filter(img => img !== imageUrl));
        setImagesToDelete(prev => [...prev, imageUrl]);
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const uploadNewImages = async (): Promise<string[]> => {
        if (newImages.length === 0) return [];

        const uploadedUrls: string[] = [];

        for (const file of newImages) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `works/${fileName}`;

                const { error } = await supabase.storage
                    .from('work-images')
                    .upload(filePath, file, { upsert: true });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('work-images')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            } catch (error) {
                console.error('Image upload error:', error);
            }
        }

        return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!work) return;

        setIsLoading(true);

        try {
            // Upload new images
            const newImageUrls = await uploadNewImages();

            // Combine existing images (not deleted) with new images
            const allImages = [...existingImages, ...newImageUrls];

            const response = await fetch(`/api/works/${work.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    category,
                    description,
                    images: allImages,
                    imagesToDelete,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Edit API Error:', errorData);
                alert(errorData.error || '게시물 수정에 실패했습니다.');
                if (errorData.details) {
                    console.error('Error details:', errorData.details);
                }
                return;
            }

            alert('게시물이 성공적으로 수정되었습니다.');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Edit error:', error);
            alert('게시물 수정 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        if (work) {
            setTitle(work.title);
            setCategory(work.category);
            setDescription(work.description);
            setExistingImages(work.images || []);
        }
        setNewImages([]);
        setImagesToDelete([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
        }
        onOpenChange(newOpen);
    };

    if (!work) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>게시물 수정</DialogTitle>
                    <DialogDescription>
                        게시물 정보를 수정하세요. 이미지를 추가하거나 삭제할 수 있습니다.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">제목</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="게시물 제목을 입력하세요"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">카테고리</Label>
                        <Input
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="카테고리를 입력하세요"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">설명</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="게시물에 대한 설명을 입력하세요"
                            rows={4}
                            required
                        />
                    </div>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div className="space-y-2">
                            <Label>기존 이미지</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {existingImages.map((imageUrl, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={imageUrl}
                                            alt={`기존 이미지 ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(imageUrl)}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Images */}
                    {newImages.length > 0 && (
                        <div className="space-y-2">
                            <Label>새 이미지</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {newImages.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`새 이미지 ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(index)}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>이미지 추가</Label>
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2"
                            >
                                <Camera className="h-4 w-4" />
                                이미지 선택
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                JPG, PNG, GIF 형식. 최대 5MB.
                            </span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            취소
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            수정 완료
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}