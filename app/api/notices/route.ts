import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const notices = await prisma.post.findMany({
    where: { category: { is: { name: 'NOTICE' } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { attachments: true },
  });
  return NextResponse.json(notices);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  console.log('Full request body:', body);
  try {
    const { title, description, fileUrl, attachments } = body;
    const category = await prisma.category.upsert({
      where: { name: 'NOTICE' },
      update: {},
      create: { name: 'NOTICE' },
    });

    const post = await prisma.post.create({
      data: {
        title,
        description,
        fileUrl,
        categoryId: category.id,
      },
    });

    if (Array.isArray(attachments) && attachments.length > 0) {
      console.log('Attachments data before createMany:', attachments);
      await prisma.noticeAttachment.createMany({
        data: attachments.map((a: any) => ({
          postId: post.id,
          url: a.url,
          filename: a.filename,
          size: a.size,
        })),
      });
    }

    const full = await prisma.post.findUnique({ where: { id: post.id }, include: { attachments: true } });
    return NextResponse.json(full);
  } catch (error: any) {
    console.error('Error creating notice:', error);
    return NextResponse.json({ message: 'Failed to create notice', error: error.message }, { status: 500 });
  }
}