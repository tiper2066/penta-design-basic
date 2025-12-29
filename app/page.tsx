'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, ImageIcon, FileText, Code, Wallpaper, BookOpen, MoreVertical, Edit, Trash2, Paperclip } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from "react";
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recentWorks, setRecentWorks] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (status !== 'authenticated') {
      e.preventDefault();
      router.push('/login');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/works?limit=3');
        if (res.ok) {
          const data = await res.json();
          // The API now returns { items: Work[], total, page, totalPages }
          setRecentWorks(data.items || []);
        }
      } catch { }
    };
    load();
  }, []);

  useEffect(() => {
    const loadNotices = async () => {
      setNoticeLoading(true);
      try {
        const res = await fetch('/api/notices');
        if (res.ok) {
          const data = await res.json();
          setNotices(data.slice(0, 3));
        }
      } finally {
        setNoticeLoading(false);
      }
    };
    loadNotices();
  }, []);

  const openAddNotice = () => {
    setEditingNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setExistingAttachments([]);
    setAttachmentsToRemove([]);
    setNewFiles([]);
    setIsNoticeDialogOpen(true);
  };

  const openEditNotice = (n: any) => {
    setEditingNotice(n);
    setNoticeTitle(n.title || '');
    setNoticeContent(n.description || '');
    setExistingAttachments(n.attachments || []);
    setAttachmentsToRemove([]);
    setNewFiles([]);
    setIsNoticeDialogOpen(true);
  };

  const saveNotice = async () => {
    const isAdmin = session?.user?.role === 'ADMIN';
    if (!isAdmin) return;

    let fileUrl: string | undefined = editingNotice?.fileUrl;

    // Upload new files
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

    // Build final attachments
    const kept = existingAttachments.filter((a: any) => !attachmentsToRemove.includes(a.id));
    const finalAttachments = [...kept.map((a: any) => ({ id: a.id, url: a.url, filename: a.filename, size: a.size })), ...uploaded];

    const payload: any = { title: noticeTitle, description: noticeContent, attachments: finalAttachments, attachmentsToRemove };
    if (fileUrl !== undefined) payload.fileUrl = fileUrl;

    const endpoint = editingNotice ? `/api/notices/${editingNotice.id}` : '/api/notices';
    const method = editingNotice ? 'PUT' : 'POST';
    const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const reload = await fetch('/api/notices');
      if (reload.ok) {
        const data = await reload.json();
        setNotices(data.slice(0, 3));
      }
      setIsNoticeDialogOpen(false);
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
        setNotices(data.slice(0, 3));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="space-y-4">
        <h1 className="tracking-tight flex justify-start items-end w-auto gap-2">
          {/* {session?.user?.name ? `${session.user.name} 님 환영합니다.` : "Penta Design Assets Management System"} */}
          <Image
            src="/img/site_logo.svg"
            alt="Layerary logo"
            width={160}
            height={40}
            className="h-[30px] w-auto"
            priority
          />
          <p className="text-lg font-reqular mb-[-6px]">Brand & Design Resources</p>
        </h1>
        <p className="text-muted-foreground w-full">
          펜타시큐리티 디자인 자산 관리 시스템에 오신 것을 환영합니다.
          필요한 모든 디자인 리소스와 템플릿을 이곳에서 관리하고 다운로드 받을 수 있습니다.
        </p>
      </section>

      {/* Quick Access Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Work Card */}
        <Link href="/work" onClick={(e) => handleLinkClick(e, '/work')}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center h-full">
              <div className="p-4 bg-penta-indigo/3 dark:bg-penta-indigo rounded-full">
                <Wallpaper className="h-8 w-8 text-penta-indigo dark:text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">WORK</h3>
                <p className="text-sm text-muted-foreground">디자인 산출물 목록</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Source Card */}
        <Link href="/source" onClick={(e) => handleLinkClick(e, '/source')}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center h-full">
              <div className="p-4 bg-penta-green/5 dark:bg-penta-green rounded-full">
                <ImageIcon className="h-8 w-8 text-penta-green dark:text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">SOURCE</h3>
                <p className="text-sm text-muted-foreground">CI/BI, Icon 벡터 편집</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Template Card */}
        <Link href="/template" onClick={(e) => handleLinkClick(e, '/template')}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center h-full">
              <div className="p-4 bg-penta-yellow/5 dark:bg-penta-yellow rounded-full">
                <FileText className="h-8 w-8 text-penta-yellow dark:text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">TEMPLATE</h3>
                <p className="text-sm text-muted-foreground">PPT, 서식 다운로드</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Brochure */}
        <Link href="/brochure" onClick={(e) => handleLinkClick(e, '/brochure')}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center h-full">
              <div className="p-4 bg-penta-blue/3 dark:bg-penta-blue rounded-full">
                <BookOpen className="h-8 w-8 text-penta-blue dark:text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">BROCHURE</h3>
                <p className="text-sm text-muted-foreground">회사 소개서, 제품 브로셔</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Updates Area Mockup */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="py-0 pb-3 gap-3">
          <div className="pt-4 pb-4 pl-6 pr-6 border-b min-h-[65px] flex items-center">
            <h3 className="font-semibold">최근 게시물</h3>
          </div>
          <CardContent className="p-6">
            <ul className="space-y-4">
              {recentWorks.map((w) => {
                const isWallpaper = w.category === 'WALLPAPER';
                const badgeText = isWallpaper ? '바탕화면' : 'Penta Design';
                const badgeClass = isWallpaper ? 'bg-penta-yellow/10 text-penta-yellow border-transparent' : 'bg-penta-indigo/10 text-penta-indigo border-transparent';
                const href = isWallpaper ? `/template?type=wallpaper&id=${w.id}` : `/work?id=${w.id}`;
                const dateStr = new Date(w.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').substring(0, 10);
                return (
                  <li key={w.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="min-w-[95px]">
                        <Badge variant="secondary" className={badgeClass}>{badgeText}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{dateStr}</p>
                        <p className="text-sm font-medium">{w.title}</p>
                      </div>
                    </div>
                    <Link href={href} onClick={(e) => handleLinkClick(e, href)}>
                      <Button variant="outline" size="sm">바로가기</Button>
                    </Link>
                  </li>
                );
              })}
              {recentWorks.length === 0 && (
                <li className="text-sm text-muted-foreground">최근 게시물이 없습니다.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="py-0 pb-3 gap-3">
          <div className="pt-4 pb-4 pl-6 pr-6 border-b min-h-[65px] flex items-center justify-between">
            <h3 className="font-semibold">공지 사항</h3>
            {/* 관리자용 공지 추가 버튼 (숨김) */}
          </div>
          <CardContent className="p-6">
            {noticeLoading ? (
              <div className="text-sm text-muted-foreground">로딩 중...</div>
            ) : (
              <ul className="space-y-4">
                {notices.map((n) => {
                  const createdAt = new Date(n.createdAt);
                  const isNew = Date.now() - createdAt.getTime() <= 3 * 24 * 60 * 60 * 1000;
                  const dateStr = createdAt
                    .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                    .replace(/\. /g, '.')
                    .substring(0, 10);
                  return (
                    <li key={n.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{dateStr}</p>
                        <p className="text-sm font-medium truncate cursor-pointer" onClick={() => { setSelectedNotice(n); setIsDetailOpen(true); }}>
                          {n.title}
                          {isNew && (
                            <Badge variant="secondary" className="ml-2 bg-penta-blue/10 text-penta-blue border-transparent">NEW</Badge>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(n.attachments?.length || 0) > 0 || n.fileUrl ? (
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        ) : null}
                        {/* 관리자용 수정/삭제 메뉴 (숨김) */}
                      </div>
                    </li>
                  );
                })}
                {notices.length === 0 && (
                  <li className="text-sm text-muted-foreground">등록된 공지사항이 없습니다.</li>
                )}
              </ul>
            )}

            <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNotice ? '공지 수정' : '공지 추가'}</DialogTitle>
                  <DialogDescription id="notice-edit-desc">공지 입력 또는 수정을 위한 폼</DialogDescription>
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
                              <span className={`text-xs ${removed ? 'line-through text-muted-foreground' : ''}`}>{a.filename || '첨부 파일'}</span>
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
                  <Button onClick={() => setIsNoticeDialogOpen(false)} variant="ghost">취소</Button>
                  <Button onClick={saveNotice}>저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedNotice?.title || '공지 상세'}</DialogTitle>
                  <DialogDescription id="notice-detail-desc">공지의 상세 내용과 첨부파일 목록</DialogDescription>
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
                            <Download className="mr-2 h-4 w-4" /> {a.filename || `첨부 ${idx + 1}`}
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
          </CardContent>
        </Card>
      </div>

      {/* Layerary 소개 문구  */}
      <section className="space-y-4">
        <h1 className="text-xl font-semibold">
          LAYERARY 란?
        </h1>
        <p className="text-muted-foreground w-full tracking-tight">
          LAYERARY는 펜타시큐리티의 브랜드와 디자인 기준, 그리고 이를 구성하는 것들을 하나의 체계로 관리하는 포털입니다. <br />
          일관된 브랜드 경험을 위해 필요한 기준과 리소스를 정리하고 공유합니다.<br /><br />

          LAYERARY is Penta Security’s official portal for managing brand and design standards and assets in one cohesive system.<br />
          It provides clear guidance and resources to ensure a consistent brand experience.
        </p>
      </section>
    </div>
  );
}