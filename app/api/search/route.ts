import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category'); // 'WALLPAPER', 'General', etc.
    const excludeCategory = searchParams.get('excludeCategory');

    // Search Scope
    // 'all' | 'title' | 'description'
    const scope = searchParams.get('scope') || 'all';

    // Date Range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // File Size (in bytes)
    const minSize = searchParams.get('minSize') ? parseInt(searchParams.get('minSize')!) : undefined;
    const maxSize = searchParams.get('maxSize') ? parseInt(searchParams.get('maxSize')!) : undefined;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        const whereClause: any = {
            AND: []
        };

        // 1. Keyword Search
        if (q) {
            const searchConditions = [];
            if (scope === 'all' || scope === 'title') {
                searchConditions.push({ title: { contains: q, mode: 'insensitive' } });
            }
            if (scope === 'all' || scope === 'description') {
                searchConditions.push({ description: { contains: q, mode: 'insensitive' } });
            }

            if (searchConditions.length > 0) {
                whereClause.AND.push({ OR: searchConditions });
            }
        }

        // 2. Category Filter
        // Special logic for "Work" (Penta Design) which is everything EXCEPT Wallpaper? 
        // Or if user selects specific category.
        // Let's rely on what frontend sends. 
        // If frontend sends category='WALLPAPER', we search that.
        // If frontend sends excludeCategory='WALLPAPER', we search everything else.
        if (category) {
            whereClause.AND.push({ category: category });
        }
        if (excludeCategory) {
            whereClause.AND.push({ category: { not: excludeCategory } });
        }

        // 3. Date Range
        if (startDate || endDate) {
            const dateFilter: any = {};
            if (startDate) dateFilter.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // End of that day
                dateFilter.lte = end;
            }
            whereClause.AND.push({ createdAt: dateFilter });
        }

        // 4. File Size (Check attachments)
        // Check if ANY attachment matches the size range
        if (minSize !== undefined || maxSize !== undefined) {
            const sizeFilter: any = {};
            if (minSize !== undefined) sizeFilter.gte = minSize;
            if (maxSize !== undefined) sizeFilter.lte = maxSize;

            whereClause.AND.push({
                attachments: {
                    some: {
                        size: sizeFilter
                    }
                }
            });
        }

        // Pagination
        const skip = (page - 1) * limit;

        const [total, works] = await Promise.all([
            prisma.work.count({ where: whereClause }),
            prisma.work.findMany({
                where: whereClause,
                include: { attachments: true },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip,
            })
        ]);

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            items: works,
            total,
            page,
            totalPages
        });

    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
