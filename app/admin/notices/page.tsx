'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Edit, Trash2, Paperclip, MoreVertical, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// 파일 크기를 읽기 쉬운 형식으로 변환하는 유틸리티 함수
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function AdminNoticesPage() {
  const { data: session, status } = useSession();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/notices');
        if (res.ok) {
          const data = await res.json();
          setNotices(data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openAdd = () => {
    setEditingNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setExistingAttachments([]);
    setAttachmentsToRemove([]);
    setNewFiles([]);
    setIsDialogOpen(true);
  };

  const openEdit = (n: any) => {
    setEditingNotice(n);
    setNoticeTitle(n.title || '');
    setNoticeContent(n.description || '');
    setExistingAttachments(n.attachments || []);
    setAttachmentsToRemove([]);
    setNewFiles([]);
    setIsDialogOpen(true);
  };

  const saveNotice = async () => {
    const isAdmin = session?.user?.role === 'ADMIN';
    if (!isAdmin) return;

    const uploaded: any[] = [];
    for (const file of newFiles) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `notice/${fileName}`;
      const { error } = await supabase.storage.from('work-images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('work-images').getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, filename: file.name, size: file.size });
      }
    }

    const kept = existingAttachments.filter((a: any) => !attachmentsToRemove.includes(a.id));
    const finalAttachments = [...kept.map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, size: a.size })), ...uploaded];

    const payload: any = { title: noticeTitle, description: noticeContent, attachments: finalAttachments, attachmentsToRemove };

    const endpoint = editingNotice ? `/api/notices/${editingNotice.id}` : '/api/notices';
    const method = editingNotice ? 'PUT' : 'POST';
    const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const reload = await fetch('/api/notices');
      if (reload.ok) {
        const data = await reload.json();
        setNotices(data);
      }
      setIsDialogOpen(false);
    } else {
      const errorData = await res.json();
      console.error('Failed to save notice:', errorData);
      alert(`공지사항 저장 실패: ${errorData.message || res.statusText}`);
    }
  };

  const deleteNotice = async (n: any) => {
    const isAdmin = session?.user?.role === 'ADMIN';
    if (!isAdmin) return;
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/notices/${n.id}`, { method: 'DELETE' });
    if (res.ok) {
      const reload = await fetch('/api/notices');
      if (reload.ok) {
        const data = await reload.json();
        setNotices(data);
      }
    }
  };

  if (status !== 'authenticated') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">공지사항 관리</h1>
        <p className="text-muted-foreground text-sm">로그인이 필요합니다.</p>
      </div>
    );
  }

  if ((session.user as any).role !== 'ADMIN') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">공지사항 관리</h1>
        <p className="text-muted-foreground text-sm">접근 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">공지사항 관리</h1>
        <Button onClick={openAdd}>공지 추가</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">로딩 중...</div>
          ) : notices.length === 0 ? (
            <div className="text-sm text-muted-foreground">등록된 공지사항이 없습니다.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">날짜</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>내용</TableHead>
                  <TableHead className="w-[80px] text-center">첨부</TableHead>
                  <TableHead className="w-[50px] text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((n) => {
                  const createdAt = new Date(n.createdAt);
                  const isNew = Date.now() - createdAt.getTime() <= 3 * 24 * 60 * 60 * 1000;
                  const dateStr = createdAt
                    .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                    .replace(/\. /g, '.')
                    .substring(0, 10);
                  return (
                    <TableRow key={n.id}>
                      <TableCell className="text-sm text-muted-foreground">{dateStr}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium cursor-pointer" onClick={() => { setSelectedNotice(n); setIsDetailOpen(true); }}>
                          {n.title}
                          {isNew && (
                            <Badge variant="secondary" className="ml-2 bg-penta-blue/10 text-penta-blue border-transparent">NEW</Badge>
                          )}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">{n.description}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        {(n.attachments?.length || 0) > 0 || n.fileUrl ? (
                          <Paperclip className="h-4 w-4 text-muted-foreground mx-auto" />
                        ) : null}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(n)}>
                              <Edit className="mr-2 h-4 w-4" /> 수정
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteNotice(n)}>
                              <Trash2 className="mr-2 h-4 w-4" /> 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNotice ? '공지 수정' : '공지 추가'}</DialogTitle>
            <DialogDescription>공지 입력 또는 수정을 위한 폼</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="제목" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} />
            <Textarea placeholder="내용" value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">새 첨부 파일</h4>
              <Input type="file" multiple onChange={(e) => setNewFiles(Array.from(e.target.files || []))} />
              {newFiles.length > 0 && (
                <ul className="text-xs text-muted-foreground">
                  {newFiles.map((f, i) => (<li key={i}>{f.name}</li>))}
                </ul>
              )}
            </div>
            {existingAttachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">기존 첨부 파일</h4>
                <ul className="space-y-2">
                  {existingAttachments.map((a: any) => {
                    const removed = attachmentsToRemove.includes(a.id);
                    return (
                      <li key={a.id} className="flex items-center justify-between">
                        <span className={`text-xs ${removed ? 'line-through text-muted-foreground' : ''}`}>{a.filename || '첨부 파일'} ({formatBytes(a.size || 0)})</span>
                        <Button type="button" variant={removed ? 'outline' : 'destructive'} size="sm" onClick={() => {
                          setAttachmentsToRemove((prev) => removed ? prev.filter((id) => id !== a.id) : [...prev, a.id]);
                        }}>
                          {removed ? '복구' : '삭제'}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)} variant="ghost">취소</Button>
            <Button onClick={saveNotice}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotice?.title || '공지 상세'}</DialogTitle>
            <DialogDescription>공지의 상세 내용과 첨부파일 목록</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedNotice?.description}</p>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">첨부 파일</h4>
              {selectedNotice?.attachments?.length ? (
                <div className="space-y-2">
                  {selectedNotice.attachments.map((a: any, idx: number) => (
                    <Button
                      key={a.id ?? idx}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={async () => {
                        try {
                          const response = await fetch(a.url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          const fallback = a.filename || `attachment_${idx + 1}`;
                          link.href = url;
                          link.download = fallback;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch {
                          window.open(a.url, '_blank');
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" /> {a.filename || `첨부 ${idx + 1}`} ({formatBytes(a.size || 0)})
                    </Button>
                  ))}
                </div>
              ) : selectedNotice?.fileUrl ? (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const response = await fetch(selectedNotice.fileUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      const lastSeg = selectedNotice.fileUrl.split('?')[0].split('/').pop() || 'attachment';
                      link.href = url;
                      link.download = selectedNotice.originalFilename || lastSeg;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch {
                      const a = document.createElement('a');
                      a.href = selectedNotice.fileUrl;
                      a.download = selectedNotice.originalFilename || 'attachment';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> 첨부 다운로드
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">첨부 파일이 없습니다.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}