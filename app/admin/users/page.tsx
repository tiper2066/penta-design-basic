'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Shield, ShieldUser, User, Calendar, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserData {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    useEffect(() => {
        // Redirect if not admin
        if (status === 'loading') return;
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            router.push('/');
            return;
        }
        fetchUsers();
    }, [session, status, router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users/check-roles');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('사용자 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (email: string, newRole: string, userId: string) => {
        setUpdatingUserId(userId);
        try {
            const response = await fetch('/api/users/update-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, role: newRole }),
            });

            if (response.ok) {
                toast.success(`권한이 ${newRole}으로 변경되었습니다.`);
                fetchUsers(); // Refresh the list
            } else {
                const error = await response.text();
                toast.error(`권한 변경 실패: ${error}`);
            }
        } catch (error) {
            console.error('Failed to update role', error);
            toast.error('권한 변경 중 오류가 발생했습니다.');
        } finally {
            setUpdatingUserId(null);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ShieldUser className="h-8 w-8 text-muted-foreground" />
                        사용자 관리
                    </h1>
                    <p className="text-muted-foreground">
                        등록된 사용자의 권한을 관리합니다.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>전체 사용자 목록</CardTitle>
                    <CardDescription>
                        총 <strong className="text-penta-indigo">{users.length}</strong> 명의 사용자가 등록되어 있습니다. 
                        권한 변경은 선택 즉시 반영됩니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>이름</TableHead>
                                <TableHead>이메일</TableHead>
                                <TableHead>역할</TableHead>
                                <TableHead>가입일</TableHead>
                                <TableHead>권한</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {user.name || '이름 없음'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            {user.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Select
                                            value={user.role}
                                            onValueChange={(value: string) => handleRoleChange(user.email!, value, user.id)}
                                            disabled={updatingUserId === user.id}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USER">USER</SelectItem>
                                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {users.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            등록된 사용자가 없습니다.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
