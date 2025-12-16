import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { currentPassword } = body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // Verify password if user has one
        if (user.password) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: '계정 삭제를 위해 현재 비밀번호를 입력해주세요.' },
                    { status: 400 }
                );
            }

            const isPasswordValid = await bcrypt.compare(
                currentPassword,
                user.password
            );

            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: '현재 비밀번호가 올바르지 않습니다.' },
                    { status: 400 }
                );
            }
        }

        // Check if user has uploaded content (for future implementation)
        // This is a placeholder for when we implement content ownership tracking
        const hasUploadedContent = false; // TODO: Implement content check
        
        if (hasUploadedContent) {
            return NextResponse.json(
                { error: '업로드한 콘텐츠가 있는 관리자는 계정을 삭제할 수 없습니다.' },
                { status: 400 }
            );
        }

        // Delete user account and related data
        await prisma.$transaction(async (tx) => {
            // Delete user's accounts (OAuth connections)
            await tx.account.deleteMany({
                where: { userId: user.id },
            });

            // Delete user's sessions
            await tx.session.deleteMany({
                where: { userId: user.id },
            });

            // Delete the user
            await tx.user.delete({
                where: { id: user.id },
            });
        });

        return NextResponse.json({ 
            message: '계정이 성공적으로 삭제되었습니다.' 
        });

    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json(
            { error: '계정 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}