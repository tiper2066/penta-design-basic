import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Download } from "lucide-react";

export default function SourcePage() {
    const sources = [
        { id: 1, title: 'Penta Main Logo', type: 'CI/BI' },
        { id: 2, title: 'WAPPLES Logo', type: 'CI/BI' },
        { id: 3, title: 'Shield Icon', type: 'ICON' },
        { id: 4, title: 'Lock Icon', type: 'ICON' },
        { id: 5, title: 'Cloud Diagram', type: 'Diagram' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">SOURCE</h1>
                <p className="text-muted-foreground">벡터(SVG) 리소스를 편집하고 다운로드하세요.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sources.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                        <div className="aspect-square bg-muted/30 p-8 flex items-center justify-center relative group-hover:bg-muted/50 transition-colors">
                            {/* SVG Placeholder */}
                            <div className="w-full h-full border-2 border-dashed border-muted-foreground/20 rounded flex items-center justify-center">
                                <span className="text-sm font-medium text-muted-foreground">SVG Preview</span>
                            </div>
                        </div>
                        <div className="p-4 border-t">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold truncate">{item.title}</h3>
                                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{item.type}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" variant="outline">
                                    <Settings2 className="mr-2 h-4 w-4" /> Edit
                                </Button>
                                <Button size="sm" variant="secondary">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
