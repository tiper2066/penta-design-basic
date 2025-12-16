import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function TemplatePage() {
    const templates = [
        { id: 1, title: 'Corporate PPT 2025', type: 'PPT' },
        { id: 2, title: 'Letterhead A4', type: 'Word' },
        { id: 3, title: 'Business Card v2', type: 'Print' },
        { id: 4, title: 'Email Signature', type: 'HTML' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">TEMPLATE</h1>
                <p className="text-muted-foreground">업무에 필요한 공식 템플릿을 다운로드하세요.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {templates.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[3/4] bg-muted/30 p-6 flex flex-col items-center justify-center relative">
                            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                            <span className="font-mono text-sm text-muted-foreground">.{item.type.toLowerCase()}</span>
                        </div>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{item.type} Template</p>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <Button className="w-full">
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
