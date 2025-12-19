'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, X, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface WorkUploadDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
    bucketName?: string;
    uploadPath?: string;
    initialCategory?: string;
}

export function WorkUploadDialog({
    onSuccess,
    trigger,
    bucketName = 'work-images',
    uploadPath = 'works',
    initialCategory = ''
}: WorkUploadDialogProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(initialCategory);
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);

            // Generate previews
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            const newUrls = prev.filter((_, i) => i !== index);
            // Revoke the old url to avoid memory leaks
            URL.revokeObjectURL(prev[index]);
            return newUrls;
        });
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        for (const file of selectedFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${uploadPath}/${fileName}`;

            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (error) {
                console.error('Error uploading image:', error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrl);
        }

        return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user) return;
        if (selectedFiles.length === 0) {
            alert('Please select at least one image.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Upload Images
            const imageUrls = await uploadImages();

            // 2. Save Data to DB
            const response = await fetch('/api/works', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    category: category || 'General',
                    description,
                    images: imageUrls,
                    imageNames: selectedFiles.map(f => f.name),
                    attachments: imageUrls.map((url, idx) => ({ url, filename: selectedFiles[idx].name, size: selectedFiles[idx].size })),
                    uploadedBy: session.user.name || 'Unknown',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save work');
            }

            // Reset and Close
            setOpen(false);
            setTitle('');
            setCategory('');
            setDescription('');
            setSelectedFiles([]);
            setPreviewUrls([]);
            if (onSuccess) onSuccess();
            router.refresh();

        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="h-4 w-4" /> 게시물 추가
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload New Work</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Title
                        </label>
                        <Input
                            placeholder="Project Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Category
                        </label>
                        <Input
                            placeholder="e.g. UX Design, Branding"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Description
                        </label>
                        <Textarea
                            placeholder="Describe your work..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Images
                        </label>
                        <div
                            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-1">Click to upload images</p>
                            <p className="text-xs text-muted-foreground/70">JPG, PNG, GIF up to 10MB</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                                multiple
                                accept="image/*"
                            />
                        </div>

                        {/* Preview Grid */}
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative aspect-video rounded-md overflow-hidden bg-muted group border">
                                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-0.5 text-center">
                                                Main Preview
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Uploading...' : 'Upload Work'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
