'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Save, X, Trash2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { signOut } from 'next-auth/react';

export default function ProfileSettingsPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(session?.user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(session?.user?.image || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarDeleted, setAvatarDeleted] = useState(false);
    const [hasPassword, setHasPassword] = useState<boolean | null>(null);
    const [isRemovingPassword, setIsRemovingPassword] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deletePasswordInput, setDeletePasswordInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check if user has existing password
    useEffect(() => {
        const checkPasswordStatus = async () => {
            try {
                const response = await fetch('/api/user/password-status');
                if (response.ok) {
                    const data = await response.json();
                    setHasPassword(data.hasPassword);
                }
            } catch (error) {
                console.error('Failed to check password status:', error);
            }
        };
        if (session?.user) {
            checkPasswordStatus();
        }
    }, [session]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setAvatarDeleted(false); // Reset deleted state when new file is selected
        }
    };

    const handleAvatarDelete = () => {
        setAvatarPreview(null);
        setAvatarFile(null);
        setAvatarDeleted(true);
        // Clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const deleteOldAvatar = async (imageUrl: string) => {
        try {
            // Extract file path from URL
            const url = new URL(imageUrl);
            const pathParts = url.pathname.split('/');
            const filePath = pathParts.slice(-2).join('/'); // Get 'avatars/filename'
            
            const { error } = await supabase.storage
                .from('work-images')
                .remove([filePath]);

            if (error) {
                console.error('Error deleting old avatar:', error);
            }
        } catch (error) {
            console.error('Error parsing avatar URL:', error);
        }
    };

    const uploadAvatar = async (): Promise<string | null> => {
        if (!avatarFile || !session?.user?.email) return null;

        try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${session.user.email}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error } = await supabase.storage
                .from('work-images')
                .upload(filePath, avatarFile, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('work-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Avatar upload error:', error);
            return null;
        }
    };

    const validatePassword = (password: string): { valid: boolean; message: string } => {
        // 최소 5자 이상
        if (password.length < 5) {
            return { valid: false, message: '비밀번호는 최소 5자 이상이어야 합니다.' };
        }

        // 영문 포함 (대소문자 구분 없음)
        if (!/[a-zA-Z]/.test(password)) {
            return { valid: false, message: '비밀번호에 영문이 포함되어야 합니다.' };
        }

        // 숫자 포함
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: '비밀번호에 숫자가 포함되어야 합니다.' };
        }

        // 허용된 특수문자만 사용 (.!@#)
        const allowedSpecialChars = /^[a-zA-Z0-9.!@#]*$/;
        if (!allowedSpecialChars.test(password)) {
            return { valid: false, message: '비밀번호에는 .!@# 특수문자만 사용할 수 있습니다.' };
        }

        // 특수문자 포함 여부 확인
        if (!/[.!@#]/.test(password)) {
            return { valid: false, message: '비밀번호에 특수문자(.!@#)가 포함되어야 합니다.' };
        }

        return { valid: true, message: '' };
    };

    const handleRemovePassword = async () => {
        if (!currentPassword) {
            alert('현재 비밀번호를 입력해주세요.');
            return;
        }

        if (!confirm('정말로 비밀번호를 제거하시겠습니까? 제거 후에는 구글 계정으로만 로그인할 수 있습니다.')) {
            return;
        }

        setIsRemovingPassword(true);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    currentPassword,
                    removePassword: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error || '비밀번호 제거에 실패했습니다.');
                return;
            }

            alert('비밀번호가 성공적으로 제거되었습니다. 이제 구글 계정으로만 로그인할 수 있습니다.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setHasPassword(false);
            router.refresh();
        } catch (error: any) {
            console.error('Password removal error:', error);
            alert('비밀번호 제거 중 오류가 발생했습니다.');
        } finally {
            setIsRemovingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        // Verify password if user has one
        if (hasPassword && !deletePasswordInput) {
            alert('계정 삭제를 위해 현재 비밀번호를 입력해주세요.');
            return;
        }

        const confirmMessage = `정말로 계정을 삭제하시겠습니까?

⚠️ 주의사항:
• 계정 삭제 후에는 복구할 수 없습니다
• 모든 개인 정보가 영구적으로 삭제됩니다
• 업로드한 콘텐츠는 별도로 관리됩니다

계속하시려면 "확인"을 클릭하세요.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setIsDeletingAccount(true);

        try {
            const response = await fetch('/api/user/delete-account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: deletePasswordInput,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error || '계정 삭제에 실패했습니다.');
                return;
            }

            alert('계정이 성공적으로 삭제되었습니다. 이용해 주셔서 감사합니다.');
            
            // Sign out and redirect to home
            await signOut({ callbackUrl: '/' });
        } catch (error: any) {
            console.error('Account deletion error:', error);
            alert('계정 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let avatarUrl = session?.user?.image;

            // Handle avatar changes
            if (avatarDeleted) {
                // Delete old avatar from storage if exists
                if (session?.user?.image) {
                    await deleteOldAvatar(session.user.image);
                }
                // User deleted the avatar
                avatarUrl = null;
            } else if (avatarFile) {
                // Delete old avatar before uploading new one
                if (session?.user?.image) {
                    await deleteOldAvatar(session.user.image);
                }
                // User uploaded a new avatar
                const uploadedUrl = await uploadAvatar();
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl;
                }
            }

            // Prepare update data
            const updateData: any = {
                name,
                image: avatarUrl,
            };

            // Add password if changing
            if (newPassword) {
                // Validate new password
                const validation = validatePassword(newPassword);
                if (!validation.valid) {
                    alert(validation.message);
                    setIsLoading(false);
                    return;
                }

                if (newPassword !== confirmPassword) {
                    alert('새 비밀번호가 일치하지 않습니다.');
                    setIsLoading(false);
                    return;
                }
                // Only require current password if user has existing password
                if (hasPassword && !currentPassword) {
                    alert('현재 비밀번호를 입력해주세요.');
                    setIsLoading(false);
                    return;
                }
                updateData.currentPassword = currentPassword;
                updateData.newPassword = newPassword;
            }

            // Call API to update profile
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error || '프로필 업데이트에 실패했습니다.');
                setIsLoading(false);
                return;
            }

            // Update session
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name,
                    image: avatarUrl,
                },
            });

            alert('프로필이 성공적으로 업데이트되었습니다.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setAvatarFile(null);
            setAvatarDeleted(false);
            router.refresh();
        } catch (error: any) {
            console.error('Profile update error:', error);
            alert('프로필 업데이트 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>로그인이 필요합니다.</p>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">프로필 설정</h1>
                <p className="text-muted-foreground mt-2">
                    아바타, 이름, 비밀번호를 변경할 수 있습니다.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>프로필 사진</CardTitle>
                        <CardDescription>클릭하여 새 프로필 사진을 업로드하세요. 새 프로필 사진은 다음 로그인 시 반영됩니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 border-2">
                                    {avatarPreview && !avatarDeleted && (
                                        <AvatarImage src={avatarPreview} alt={name} />
                                    )}
                                    <AvatarFallback className="text-2xl">
                                        {name?.slice(0, 2).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                
                                {/* Upload overlay */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <Camera className="h-6 w-6 text-white" />
                                </button>

                                {/* Delete button - only show if there's an image */}
                                {avatarPreview && !avatarDeleted && (
                                    <button
                                        type="button"
                                        onClick={handleAvatarDelete}
                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg"
                                        title="프로필 사진 삭제"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                    JPG, PNG 또는 GIF 형식. 최대 5MB.
                                </p>
                                {avatarDeleted && (
                                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                                        프로필 사진이 삭제됩니다. 저장을 클릭하여 적용하세요.
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Name Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>이름</CardTitle>
                        <CardDescription>표시될 이름을 입력하세요.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름"
                            required
                        />
                    </CardContent>
                </Card>

                {/* Password Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>{hasPassword ? '비밀번호 변경' : '비밀번호 설정'}</CardTitle>
                        <CardDescription>
                            {hasPassword
                                ? '비밀번호를 변경하거나 제거할 수 있습니다. 비밀번호를 제거하면 구글 계정으로만 로그인할 수 있습니다.'
                                : '구글 계정으로 가입하셨지만 비밀번호를 설정하시면 이메일/비밀번호 방식으로도 로그인할 수 있습니다.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {hasPassword && (
                            <div>
                                <label className="text-sm font-medium">현재 비밀번호</label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="현재 비밀번호"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium">새 비밀번호</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="새 비밀번호"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                최소 5자 이상, 영문·숫자·특수문자(.!@#) 포함 필수
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">새 비밀번호 확인</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="새 비밀번호 확인"
                            />
                        </div>

                        {/* Password Removal Section - Only show if user has password */}
                        {hasPassword && (
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-foreground">비밀번호 제거</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            구글 계정으로만 로그인 가능. 비밀번호를 제거하려면 "현재 비밀번호"를 입력해주세요.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleRemovePassword}
                                        disabled={isRemovingPassword || !currentPassword}
                                    >
                                        {isRemovingPassword && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        비밀번호 제거
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Account Deletion Section */}
                <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                            <UserX className="h-5 w-5" />
                            회원 탈퇴
                        </CardTitle>
                        <CardDescription>
                            계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                                ⚠️ 계정 삭제 시 주의사항
                            </h4>
                            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                                <li>• 모든 개인 정보가 영구적으로 삭제됩니다</li>
                                <li>• 삭제된 계정은 복구할 수 없습니다</li>
                                <li>• 업로드한 콘텐츠는 시스템에서 별도 관리됩니다</li>
                                <li>• 동일한 이메일로 재가입이 가능합니다</li>
                            </ul>
                        </div>

                        {hasPassword && (
                            <div>
                                <label className="text-sm font-medium text-red-600 dark:text-red-400">
                                    계정 삭제를 위한 비밀번호 확인
                                </label>
                                <Input
                                    type="password"
                                    value={deletePasswordInput}
                                    onChange={(e) => setDeletePasswordInput(e.target.value)}
                                    placeholder="현재 비밀번호를 입력하세요"
                                    className="border-red-200 dark:border-red-800 focus:border-red-400 dark:focus:border-red-600"
                                />
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={isDeletingAccount || (hasPassword === true && !deletePasswordInput)}
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                            >
                                {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <UserX className="mr-2 h-4 w-4" />
                                {isDeletingAccount ? '삭제 중...' : '계정 삭제'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        취소
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        저장
                    </Button>
                </div>
            </form>
        </div>
    );
}
