import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

// GET single work
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const work = await prisma.work.findUnique({
            where: { id },
        });

        if (!work) {
            return NextResponse.json(
                { error: '게시물을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json(work);
    } catch (error) {
        console.error('Error fetching work:', error);
        return NextResponse.json(
            { error: '게시물 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// UPDATE work
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '관리자 권한이 필요합니다.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, category, description, images, imagesToDelete } = body;
        
        console.log('PUT request data:', {
            id,
            title,
            category,
            description,
            imagesCount: images?.length || 0,
            imagesToDeleteCount: imagesToDelete?.length || 0
        });

        // Check if work exists
        const existingWork = await prisma.work.findUnique({
            where: { id },
        });

        if (!existingWork) {
            return NextResponse.json(
                { error: '게시물을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // Delete old images from Supabase if specified
        if (imagesToDelete && imagesToDelete.length > 0) {
            for (const imageUrl of imagesToDelete) {
                try {
                    const url = new URL(imageUrl);
                    const pathParts = url.pathname.split('/');
                    const filePath = pathParts.slice(-2).join('/'); // Get 'works/filename'
                    
                    await supabase.storage
                        .from('work-images')
                        .remove([filePath]);
                } catch (error) {
                    console.error('Error deleting image:', error);
                }
            }
        }

        // Update work
        const updatedWork = await prisma.work.update({
            where: { id },
            data: {
                title,
                category,
                description,
                images,
            },
        });

        return NextResponse.json(updatedWork);
    } catch (error) {
        console.error('Error updating work:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { 
                error: '게시물 수정 중 오류가 발생했습니다.',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE work
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '관리자 권한이 필요합니다.' },
                { status: 403 }
            );
        }

        // Get work to delete associated images
        const work = await prisma.work.findUnique({
            where: { id },
        });

        if (!work) {
            return NextResponse.json(
                { error: '게시물을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // Delete associated images from Supabase
        if (work.images && work.images.length > 0) {
            for (const imageUrl of work.images) {
                try {
                    const url = new URL(imageUrl);
                    const pathParts = url.pathname.split('/');
                    const filePath = pathParts.slice(-2).join('/'); // Get 'works/filename'
                    
                    await supabase.storage
                        .from('work-images')
                        .remove([filePath]);
                } catch (error) {
                    console.error('Error deleting image:', error);
                }
            }
        }

        // Delete work from database
        await prisma.work.delete({
            where: { id },
        });

        return NextResponse.json({ 
            message: '게시물이 성공적으로 삭제되었습니다.' 
        });
    } catch (error) {
        console.error('Error deleting work:', error);
        return NextResponse.json(
            { error: '게시물 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}