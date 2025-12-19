'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, HardDrive, BarChart3, Link as LinkIcon, ShieldAlert, Gauge } from 'lucide-react';

interface WorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  images?: string[];
  uploadedBy: string;
  createdAt?: string;
}

export default function AdminUsagePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/works');
        if (res.ok) {
          const data = await res.json();
          setWorks(data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (status !== 'loading') fetchData();
  }, [status]);

  const stats = useMemo(() => {
    const totalPosts = works.length;
    const wallpaperPosts = works.filter(w => w.category === 'WALLPAPER').length;
    const designPosts = works.filter(w => w.category !== 'WALLPAPER').length;
    const totalImages = works.reduce((sum, w) => sum + (w.images?.length || 0), 0);
    const recent = [...works]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
    return { totalPosts, wallpaperPosts, designPosts, totalImages, recent };
  }, [works]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="text-lg font-medium">관리자만 접근 가능한 페이지입니다.</p>
      </div>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const bucketName = 'work-images';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Gauge className="h-8 w-8 text-muted-foreground" />
            대시보드 
          </h1>
          <p className="text-muted-foreground">게시물/이미지 집계와 외부 대시보드 바로가기를 확인하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-4 bg-penta-indigo/3 dark:bg-penta-indigo">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">총 게시물</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground dark:text-muted" />
            </div>
            <div className="text-3xl font-bold mt-2">{stats.totalPosts}</div>
          </CardHeader>
        </Card>
        <Card className="p-4 bg-penta-green/5 dark:bg-penta-green">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">바탕화면</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground dark:text-muted" />
            </div>
            <div className="text-3xl font-bold mt-2">{stats.wallpaperPosts}</div>
          </CardHeader>
        </Card>
        <Card className="p-4 bg-penta-yellow/3 dark:bg-penta-yellow">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">디자인 작업물</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground dark:text-muted" />
            </div>
            <div className="text-3xl font-bold mt-2">{stats.designPosts}</div>
          </CardHeader>
        </Card>
        <Card className="p-4 bg-penta-blue/3 dark:bg-penta-blue">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">총 이미지 수</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground dark:text-muted" />
            </div>
            <div className="text-3xl font-bold mt-2">{stats.totalImages}</div>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-semibold">최근 업로드</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.recent.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">{w.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{w.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date((w as any).createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{(w.images?.length || 0)} images</span>
              </div>
            </Card>
          ))}
          {stats.recent.length === 0 && (
            <div className="text-sm text-muted-foreground">최근 업로드된 항목이 없습니다.</div>
          )}
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-semibold">외부 대시보드</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            {/* <a href="https://app.supabase.com/" target="_blank" rel="noopener noreferrer"> */}
            <a href="https://supabase.com/dashboard/org/oyqrzeeterlhhzhazowq/usage?projectRef=ufjokrexojcapahydsap" target="_blank" rel="noopener noreferrer">
              <LinkIcon className="mr-2 h-4 w-4" />
              Supabase Dashboard
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
              <LinkIcon className="mr-2 h-4 w-4" />
              Vercel Dashboard
            </a>
          </Button>
          {supabaseUrl && (
            <Button
              variant="ghost"
              onClick={async () => { try { await navigator.clipboard.writeText(supabaseUrl); } catch (e) {} }}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Supabase Host 주소 복사
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Storage 버킷: <span className="font-mono">{bucketName}</span> • 폴더: <span className="font-mono">works/</span>, <span className="font-mono">wallpaper/</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Supabase Dashboard 는 해당 프로젝트의 Project Settings &gt; Billings &gt; Usage 에서 확인할 수 있다.<br /> 
          Supabase Host 주소는 Supabase API 요청을 위한 기본 주소 (NEXT_PUBLIC_SUPABASE_URL) 입니다. 필요 시 복사하여 설정에 사용하세요.
        </p>
      </div>
    </div>
  );
}