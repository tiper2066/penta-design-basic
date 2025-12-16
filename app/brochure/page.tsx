import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function BrochurePage() {
    const brochures = [
        { id: 1, title: 'WAPPLES Brochure KR', product: 'WAPPLES' },
        { id: 2, title: 'WAPPLES Brochure EN', product: 'WAPPLES' },
        { id: 3, title: 'D.AMO Brochure', product: 'D.AMO' },
        { id: 4, title: 'iSIGN Brochure', product: 'iSIGN' },
        { id: 5, title: 'Cloudbric Brochure', product: 'Cloudbric' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">BROCHURE</h1>
                <p className="text-muted-foreground">제품별 최신 브로셔를 확인하세요.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {brochures.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[1/1.414] bg-neutral-100 dark:bg-neutral-900 border flex items-center justify-center">
                            <span className="text-xl font-bold text-muted-foreground/20 rotate-45">{item.product}</span>
                        </div>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base truncate">{item.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{item.product}</p>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <Button className="w-full" variant="outline">
                                <Download className="mr-2 h-4 w-4" /> PDF
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
