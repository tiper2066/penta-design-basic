'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, FileText, Code } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (status !== 'authenticated') {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {session?.user?.name ? `Welcome back, ${session.user.name}` : "Welcome to Penta Design System"}
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
              <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <ImageIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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
              <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <ImageIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">TEMPLATE</h3>
                <p className="text-sm text-muted-foreground">PPT, 서식 다운로드</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Code Generator (Dummy) */}
        <Link href="/code-generator" onClick={(e) => handleLinkClick(e, '/code-generator')}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-50 h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center h-full">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Code className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">CODE GEN</h3>
                <p className="text-sm text-muted-foreground">eDM 코드 생성 (준비중)</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Updates Area Mockup */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="p-6 border-b">
            <h3 className="font-semibold">Recent Uploads</h3>
          </div>
          <CardContent className="p-6">
            <ul className="space-y-4">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs font-medium">
                      IMG
                    </div>
                    <div>
                      <p className="text-sm font-medium">Main Visual Banner_0{i}.png</p>
                      <p className="text-xs text-muted-foreground">Updated 2 hours ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <div className="p-6 border-b">
            <h3 className="font-semibold">Notice</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>📢 새로운 WAPPLES 브로셔가 업데이트 되었습니다. (2025 ver)</p>
              <p>📢 디자인 팀 주간 회의는 월요일 오전 10시입니다.</p>
              <p>✨ iSIGN 아이콘 팩이 v2.0 으로 업데이트 되었습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
