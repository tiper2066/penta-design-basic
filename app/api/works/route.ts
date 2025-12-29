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
    const excludeCategory = searchParams.get('excludeCategory');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0'); // 0 means all (for backward compat if needed, or specific use cases)

    try {
        let whereClause: any = {};
        if (category) {
            whereClause = { category };
        } else if (excludeCategory) {
            whereClause = { category: { not: excludeCategory } };
        }

        // If limit is 0 or not provided/negative, we could default to all, but the user requested 10.
        // However, for admin stats we might need all. Let's strictly follow "pagination" request for the Work page usage.
        // We will default to all IF limit is not specified to minimize breakage, BUT user asked to "fetch 10 at a time".
        // To support both, I will apply pagination if 'limit' is > 0.
        // If limit is NOT provided, I will default to ALL to keep compatibility with parts I might miss, 
        // BUT I will change the response shape to { items: [], total: ... } which IS a breaking change anyway.
        // So let's fully commit to the new shape.

        const fetchLimit = limit > 0 ? limit : undefined;
        const skip = fetchLimit ? (page - 1) * fetchLimit : undefined;

        const [total, works] = await Promise.all([
            prisma.work.count({ where: whereClause }),
            prisma.work.findMany({
                where: whereClause,
                include: { attachments: true },
                orderBy: {
                    createdAt: 'desc',
                },
                take: fetchLimit,
                skip: skip,
            })
        ]);

        const totalPages = fetchLimit ? Math.ceil(total / fetchLimit) : 1;

        return NextResponse.json({
            items: works,
            total,
            page,
            totalPages,
        });
    } catch (error) {
        console.error('Error fetching works:', error);
        return NextResponse.json(
            { error: 'Error fetching works' },
            { status: 500 }
        );
    }
}
