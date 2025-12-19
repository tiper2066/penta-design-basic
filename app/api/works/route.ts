import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, category, description, images, imageNames = [], uploadedBy, attachments = [] } = body;

        const work = await prisma.work.create({
            data: {
                title,
                category,
                description,
                images,
                imageNames,
                uploadedBy,
                attachments: { create: attachments },
            },
        });

        return NextResponse.json(work);
    } catch (error) {
        console.error('Error creating work:', error);
        return NextResponse.json(
            { error: 'Error creating work' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    try {
        const whereClause = category ? { category } : {};

        const works = await prisma.work.findMany({
            where: whereClause,
            include: { attachments: true },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(works);
    } catch (error) {
        console.error('Error fetching works:', error);
        return NextResponse.json(
            { error: 'Error fetching works' },
            { status: 500 }
        );
    }
}
