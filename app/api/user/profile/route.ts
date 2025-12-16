import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, image, currentPassword, newPassword, removePassword } = body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        // Handle image update (including null for deletion)
        if (image !== undefined) {
            updateData.image = image;
        }

        // Handle password removal
        if (removePassword) {
            // Verify current password before removal
            if (!user.password) {
                return NextResponse.json(
                    { error: '제거할 비밀번호가 없습니다.' },
                    { status: 400 }
                );
            }

            if (!currentPassword) {
                return NextResponse.json(
                    { error: '비밀번호 제거를 위해 현재 비밀번호를 입력해주세요.' },
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

            // Check if user has OAuth account (Google) to fall back to
            const oauthAccount = await prisma.account.findFirst({
                where: { 
                    userId: user.id,
                    provider: 'google'
                },
            });

            if (!oauthAccount) {
                return NextResponse.json(
                    { error: '구글 계정 연동 없이는 비밀번호를 제거할 수 없습니다.' },
                    { status: 400 }
                );
            }

            // Remove password
            updateData.password = null;
        }
        // Handle password change/setting
        else if (newPassword) {
            // If user has existing password (credential login), verify it
            if (user.password) {
                if (!currentPassword) {
                    return NextResponse.json(
                        { error: '현재 비밀번호를 입력해주세요.' },
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
            // If user has no password (OAuth login), allow setting password without verification

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: '프로필 업데이트에 실패했습니다.' },
            { status: 500 }
        );
    }
}
