import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase'; // Supabase 클라이언트 임포트

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, description, fileUrl, attachments, attachmentsToRemove } = body;

  // 1. Supabase Storage에서 삭제할 파일들을 제거하고 DB에서도 레코드 삭제
  if (Array.isArray(attachmentsToRemove) && attachmentsToRemove.length > 0) {
    for (const attachmentId of attachmentsToRemove) {
      const attachment = await prisma.noticeAttachment.findUnique({
        where: { id: attachmentId },
      });
      if (attachment) {
        const urlParts = attachment.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const path = `notice/${fileName}`;
        await supabase.storage.from('work-images').remove([path]);
        await prisma.noticeAttachment.delete({ where: { id: attachmentId } });
      }
    }
  }

  // 2. 공지사항 업데이트
  const data: any = { title, description };
  if (typeof fileUrl !== 'undefined') data.fileUrl = fileUrl; // fileUrl 필드가 Post 모델에 여전히 존재한다면 유지
  await prisma.post.update({ where: { id }, data });

  // 3. 새로운 첨부 파일 추가 (클라이언트에서 넘어온 attachments 중 DB에 없는 것만 새로 생성)
  if (Array.isArray(attachments) && attachments.length > 0) {
    // 현재 DB에 존재하는 첨부파일 ID 목록을 가져옴 (삭제된 것 제외)
    const currentDbAttachments = await prisma.noticeAttachment.findMany({
      where: { postId: id },
      select: { id: true }
    });
    const currentDbAttachmentIds = new Set(currentDbAttachments.map(a => a.id));

    const attachmentsToCreate = attachments.filter((a: any) => !a.id);

    if (attachmentsToCreate.length > 0) {
      await prisma.noticeAttachment.createMany({
        data: attachmentsToCreate.map((a: any) => ({
          postId: id,
          url: a.url,
          filename: a.filename,
          size: a.size,
        })),
      });
    }
  }

  const full = await prisma.post.findUnique({ where: { id }, include: { attachments: true } });
  return NextResponse.json(full);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // 게시물과 연결된 첨부파일 정보 가져오기
  const postToDelete = await prisma.post.findUnique({
    where: { id },
    include: { attachments: true },
  });

  if (postToDelete) {
    // Supabase Storage에서 첨부파일 삭제
    for (const attachment of postToDelete.attachments) {
      const urlParts = attachment.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const path = `notice/${fileName}`;
      await supabase.storage.from('work-images').remove([path]);
    }
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}