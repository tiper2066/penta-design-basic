'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Globe, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (name.trim().length < 2) {
            setError("Full Name must be at least 2 characters long.");
            setLoading(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        // Validate password
        const validation = validatePassword(password);
        if (!validation.valid) {
            setError(validation.message);
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            await axios.post('/api/register', {
                name,
                email,
                password
            });
            // Success logic could go here
            router.push('/login');
        } catch (error: any) {
            console.error(error);
            setError(error.response?.data || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                <CardHeader className="space-y-1 text-center items-center">
                    <CardTitle className="text-2xl font-bold py-4">Membership of the P.D.S</CardTitle>
                    <CardDescription>Email / Password 로 계정을 만드세요.</CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4 pb-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">Password</label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">
                                최소 5자 이상, 영문·숫자·특수문자(.!@#) 포함 필수
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="******"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            회원가입
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            이미 계정이 있다면{" "}
                            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                                로그인
                            </Link>
                            {" "}하세요.
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
