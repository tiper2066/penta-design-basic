import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { email, role } = await request.json();

        if (!email || !role) {
            return new NextResponse('Email and role are required', { status: 400 });
        }

        if (role !== 'ADMIN' && role !== 'USER') {
            return new NextResponse('Invalid role. Must be ADMIN or USER', { status: 400 });
        }

        const user = await prisma.user.update({
            where: { email },
            data: { role },
        });

        return NextResponse.json({
            message: `User ${email} role updated to ${role}`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error: any) {
        console.error('UPDATE_ROLE_ERROR', error);
        if (error.code === 'P2025') {
            return new NextResponse('User not found', { status: 404 });
        }
        return new NextResponse('Internal Error', { status: 500 });
    }
}
