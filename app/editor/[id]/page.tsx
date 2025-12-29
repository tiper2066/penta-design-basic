'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Draggable from 'react-draggable';
import html2canvas from 'html2canvas-pro';
import {
    Type,
    Download,
    ChevronLeft,
    Move,
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Trash2,
    Plus,
    Minus,
    Search,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getDaysInMonth, startOfMonth, getDay } from 'date-fns';

interface TextItem {
    type: 'title' | 'content';
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    fontWeight: string; // 'normal' | 'bold'
    isBold: boolean;
}

interface CalendarItem {
    id: string;
    x: number;
    y: number;
    year: number;
    month: number; // 1-12

    // 스타일
    fontSize: number;
    fontFamily: string;
    headerColor: string;
    weekdayColor: string;
    sundayColor: string;
    saturdayColor: string;
    dayColor: string;
    backgroundColor: string;
    opacity: number;

    // 레이아웃
    cellWidth: number;
    cellHeight: number;
    showWeekdays: boolean;

    // 공휴일
    showHolidays: boolean;
    holidayColor: string;
}

// 한국 공휴일 데이터 (2024-2026)
const getKoreanHolidays = (year: number, month: number): Map<number, string> => {
    const holidays = new Map<number, string>();

    // 2024년 공휴일
    if (year === 2024) {
        if (month === 1) { holidays.set(1, '신정'); }
        if (month === 2) { holidays.set(9, '설날'); holidays.set(10, '설날'); holidays.set(11, '설날'); holidays.set(12, '대체공휴일'); }
        if (month === 3) { holidays.set(1, '삼일절'); }
        if (month === 4) { holidays.set(10, '국회의원선거'); }
        if (month === 5) { holidays.set(5, '어린이날'); holidays.set(6, '대체공휴일'); holidays.set(15, '부처님오신날'); }
        if (month === 6) { holidays.set(6, '현충일'); }
        if (month === 8) { holidays.set(15, '광복절'); }
        if (month === 9) { holidays.set(16, '추석'); holidays.set(17, '추석'); holidays.set(18, '추석'); }
        if (month === 10) { holidays.set(3, '개천절'); holidays.set(9, '한글날'); }
        if (month === 12) { holidays.set(25, '크리스마스'); }
    }

    // 2025년 공휴일
    if (year === 2025) {
        if (month === 1) { holidays.set(1, '신정'); holidays.set(28, '설날'); holidays.set(29, '설날'); holidays.set(30, '설날'); }
        if (month === 3) { holidays.set(1, '삼일절'); holidays.set(3, '대체공휴일'); }
        if (month === 5) { holidays.set(5, '어린이날'); holidays.set(6, '부처님오신날'); }
        if (month === 6) { holidays.set(6, '현충일'); }
        if (month === 8) { holidays.set(15, '광복절'); }
        if (month === 10) { holidays.set(3, '개천절'); holidays.set(5, '추석'); holidays.set(6, '추석'); holidays.set(7, '추석'); holidays.set(8, '대체공휴일'); holidays.set(9, '한글날'); }
        if (month === 12) { holidays.set(25, '크리스마스'); }
    }

    // 2026년 공휴일
    if (year === 2026) {
        if (month === 1) { holidays.set(1, '신정'); }
        if (month === 2) { holidays.set(16, '설날'); holidays.set(17, '설날'); holidays.set(18, '설날'); }
        if (month === 3) { holidays.set(1, '삼일절'); }
        if (month === 5) { holidays.set(5, '어린이날'); holidays.set(24, '부처님오신날'); holidays.set(25, '대체공휴일'); }
        if (month === 6) { holidays.set(6, '현충일'); }
        if (month === 8) { holidays.set(15, '광복절'); }
        if (month === 9) { holidays.set(24, '추석'); holidays.set(25, '추석'); holidays.set(26, '추석'); }
        if (month === 10) { holidays.set(3, '개천절'); holidays.set(9, '한글날'); }
        if (month === 12) { holidays.set(25, '크리스마스'); }
    }

    return holidays;
};

// Separate component to handle ref correctly for Draggable
function DraggableText({
    item,
    selectedId,
    updateItem,
    setSelectedId,
    scale
}: {
    item: TextItem;
    selectedId: string | null;
    updateItem: (id: string, updates: Partial<TextItem>) => void;
    setSelectedId: (id: string | null) => void;
    scale: number;
}) {
    const nodeRef = useRef(null);

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: item.x, y: item.y }}
            onStop={(e, data) => updateItem(item.id, { x: data.x, y: data.y })}
            onStart={() => setSelectedId(item.id)}
            scale={scale}
        // removed bounds="parent" to avoid visibility issues if parent size is not yet detected
        >
            <div
                ref={nodeRef}
                onMouseDown={(e) => e.stopPropagation()} // Critical: Prevent canvas deselect
                onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                className={cn(
                    "absolute cursor-move select-none p-2 border-2 transition-colors",
                    selectedId === item.id ? "border-blue-500 bg-blue-500/10" : "border-transparent hover:border-white/30"
                )}
                style={{
                    top: 0,
                    left: 0,
                    fontSize: `${item.fontSize}px`,
                    color: item.color,
                    fontFamily: item.fontFamily,
                    fontWeight: item.isBold ? 'bold' : 'normal',
                    zIndex: selectedId === item.id ? 100 : 50, // Active item on top
                    whiteSpace: 'pre-wrap',
                    minWidth: '50px',
                    minHeight: '1em',
                    textShadow: '0 0 1px rgba(0,0,0,0.5)'
                }}
            >
                {item.text}
            </div>
        </Draggable>
    );
}

// Calendar Component
function DraggableCalendar({
    item,
    selectedId,
    updateItem,
    setSelectedId,
    scale
}: {
    item: CalendarItem;
    selectedId: string | null;
    updateItem: (id: string, updates: Partial<CalendarItem>) => void;
    setSelectedId: (id: string | null) => void;
    scale: number;
}) {
    const nodeRef = useRef(null);

    // Generate calendar days
    const generateCalendarDays = () => {
        const firstDay = startOfMonth(new Date(item.year, item.month - 1));
        const daysInMonth = getDaysInMonth(firstDay);
        const startWeekday = getDay(firstDay); // 0 (일) ~ 6 (토)

        const days: (number | null)[] = [];

        // 앞쪽 빈 칸
        for (let i = 0; i < startWeekday; i++) {
            days.push(null);
        }

        // 실제 날짜
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        // 뒤쪽 빈 칸 (6주 맞추기)
        while (days.length < 42) {
            days.push(null);
        }

        return days;
    };

    const days = generateCalendarDays();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    const getDayColor = (dayIndex: number) => {
        if (dayIndex === 0) return item.sundayColor; // 일요일
        if (dayIndex === 6) return item.saturdayColor; // 토요일
        return item.weekdayColor; // 평일
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: item.x, y: item.y }}
            onStop={(e, data) => updateItem(item.id, { x: data.x, y: data.y })}
            onStart={() => setSelectedId(item.id)}
            scale={scale}
        >
            <div
                ref={nodeRef}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                className={cn(
                    "absolute cursor-move select-none border-2 transition-colors rounded-lg",
                    selectedId === item.id ? "border-blue-500 bg-blue-500/10" : "border-transparent hover:border-white/30"
                )}
                style={{
                    top: 0,
                    left: 0,
                    backgroundColor: item.backgroundColor,
                    opacity: item.opacity,
                    fontFamily: item.fontFamily,
                    zIndex: selectedId === item.id ? 100 : 50,
                    padding: '16px',
                }}
            >
                {/* Header: Year & Month */}
                <div
                    className="text-center font-bold mb-3"
                    style={{
                        fontSize: `${item.fontSize * 1.2}px`,
                        color: item.headerColor,
                    }}
                >
                    {item.year}년 {item.month}월
                </div>

                {/* Weekdays */}
                {item.showWeekdays && (
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekdays.map((day, index) => (
                            <div
                                key={day}
                                className="text-center font-semibold"
                                style={{
                                    width: `${item.cellWidth}px`,
                                    height: `${item.cellHeight}px`,
                                    fontSize: `${item.fontSize * 0.8}px`,
                                    color: getDayColor(index),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                )}

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                        const dayOfWeek = index % 7;
                        return (
                            <div
                                key={index}
                                className="text-center"
                                style={{
                                    width: `${item.cellWidth}px`,
                                    height: `${item.cellHeight}px`,
                                    fontSize: `${item.fontSize}px`,
                                    color: day ? getDayColor(dayOfWeek) : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {day || ''}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Draggable>
    );
}

export default function EditorPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const imageUrl = searchParams.get('url');
    const nameParam = searchParams.get('name');

    // Canvas & Items
    const canvasRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState<TextItem[]>([]);
    const [calendars, setCalendars] = useState<CalendarItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');

    // Zoom State
    const [scale, setScale] = useState(1);
    const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
    const mainRef = useRef<HTMLElement>(null);

    // Selected Item Props
    const selectedItem = items.find(i => i.id === selectedId);
    const selectedCalendar = calendars.find(c => c.id === selectedId);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const { naturalWidth, naturalHeight } = img;

        setImgSize({ width: naturalWidth, height: naturalHeight });

        // Initial Fit
        if (mainRef.current) {
            const { clientWidth, clientHeight } = mainRef.current;
            const padding = 64; // p-8 * 2
            const availableW = clientWidth - padding;
            const availableH = clientHeight - padding;

            const fitScale = Math.min(
                availableW / naturalWidth,
                availableH / naturalHeight,
                0.9 // Max initial zoom 90% if image is small? No, ensure it's visible.
            );
            // If image is smaller than viewport, scaling up to 1 might be okay, but 'fitScale' handles downscaling larger images.
            // If image is huge, fitScale < 1.
            // If image is tiny, fitScale > 1 (expand to fit?). Usually we default to min(fit, 1) or just fit.
            // Let's default to fitting.
            setScale(fitScale);
        }
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 5)); // Max 500%
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.1)); // Min 10%
    const handleResetZoom = () => {
        setScale(1);
    };

    // Keyboard Delete Support
    // ... (Use existing)

    // ... (Keep addTextItem, updateItem, deleteItem, handleDownload)


    // Keyboard Delete Support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedId) return;

            // Prevent deletion if user is typing in an input field
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteItem(selectedId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId]);

    const addTextItem = (type: 'title' | 'content') => {
        const isTitle = type === 'title';
        const newItem: TextItem = {
            id: crypto.randomUUID(),
            type, // Store type
            text: isTitle ? '제목을 입력하세요' : '내용을 입력하세요\n여러 줄을 입력할 수 있습니다.',
            x: 50, // Start slightly inset
            y: 50,
            fontSize: isTitle ? 64 : 24, // Larger default size for title, smaller for content
            color: '#000000', // Black for better initial visibility on light backgrounds
            fontFamily: 'Pretendard',
            fontWeight: isTitle ? 'bold' : 'normal',
            isBold: isTitle
        };
        setItems([...items, newItem]);
        setSelectedId(newItem.id);
    };

    const updateItem = (id: string, updates: Partial<TextItem>) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const deleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        setCalendars(prev => prev.filter(cal => cal.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    // Calendar Functions
    const addCalendar = () => {
        const now = new Date();
        const newCalendar: CalendarItem = {
            id: crypto.randomUUID(),
            x: 100,
            y: 100,
            year: now.getFullYear(),
            month: now.getMonth() + 1,

            // 기본 스타일
            fontSize: 16,
            fontFamily: 'Pretendard',
            headerColor: '#ffffff',
            weekdayColor: '#ffffff',
            sundayColor: '#ff4444',
            saturdayColor: '#4444ff',
            dayColor: '#ffffff',
            backgroundColor: '#000000',
            opacity: 1,

            // 기본 레이아웃
            cellWidth: 40,
            cellHeight: 40,
            showWeekdays: true,

            // 공휴일
            showHolidays: true,
            holidayColor: '#ff4444',
        };
        setCalendars([...calendars, newCalendar]);
        setSelectedId(newCalendar.id);
    };

    const updateCalendar = (id: string, updates: Partial<CalendarItem>) => {
        setCalendars(prev => prev.map(cal => cal.id === id ? { ...cal, ...updates } : cal));
    };

    const handleDownload = async () => {
        if (!canvasRef.current) return;

        // De-select to hide helpers
        setSelectedId(null);

        // Wait for UI to update (hide bounding boxes)
        setTimeout(async () => {
            if (!canvasRef.current) return;
            try {
                const canvas = await html2canvas(canvasRef.current, {
                    useCORS: true, // Important for external images
                    backgroundColor: '#171717', // Match dark theme (neutral-900)
                    scale: 2, // Better quality for download
                });

                const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');

                // Determine base filename
                let baseName = 'wallpaper';
                if (nameParam) {
                    // Use title passed from previous page, remove existing extension if likely present
                    baseName = nameParam.replace(/\.[^/.]+$/, "");
                } else if (imageUrl) {
                    // Fallback to URL parsing
                    baseName = imageUrl.split('/').pop()?.split('?')[0].split('.')[0] || 'wallpaper';
                }

                const mimeType = downloadFormat === 'png' ? 'image/png' : 'image/jpeg';
                // Remove potential duplicate date if User clicks multiple times? No, Date is formatted same day.

                const link = document.createElement('a');
                link.download = `${baseName}_edit_${dateStr}.${downloadFormat}`;
                link.href = canvas.toDataURL(mimeType, 0.9);
                link.click();
            } catch (err) {
                console.error("Export failed", err);
                alert("이미지 저장에 실패했습니다.");
            }
        }, 100);
    };

    // Use Proxy to avoid CORS issues with html2canvas
    const proxyUrl = imageUrl ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}` : null;

    // Clean URL to force original image (remove any Supabase transformation params)
    const getOriginalImageUrl = (url: string | null) => {
        if (!url) return null;

        // If it's a Supabase Storage URL, ensure we get the original
        // Supabase auto-transforms images, we need to explicitly request original
        try {
            const urlObj = new URL(url);
            // Remove any existing transformation params
            urlObj.searchParams.delete('width');
            urlObj.searchParams.delete('height');
            urlObj.searchParams.delete('resize');
            urlObj.searchParams.delete('quality');

            // Force original by adding download param (prevents transformation)
            // Actually, let's try without download first
            return urlObj.toString();
        } catch {
            return url;
        }
    };

    const originalImageUrl = getOriginalImageUrl(imageUrl);

    if (!imageUrl) {
        return <div className="p-8 text-center">이미지를 불러올 수 없습니다.</div>
    }

    return (
        <div className="flex h-screen w-screen bg-neutral-900 text-white overflow-hidden fixed top-0 left-0">
            {/* Left Sidebar - Tools */}
            <aside className="w-20 md:w-64 bg-neutral-800 border-r border-neutral-700 flex flex-col z-40 flex-none shrink-0">
                <div className="p-4 border-b border-neutral-700">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-neutral-400 hover:text-white pl-0">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">나가기</span>
                    </Button>
                </div>

                <div className="p-4 space-y-4">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden md:block">Add Elements</h3>

                    <Button
                        variant="secondary"
                        className="w-full justify-start h-12"
                        onClick={() => addTextItem('title')}
                    >
                        <Type className="mr-2 h-5 w-5" />
                        <span className="hidden md:inline">제목 추가</span>
                    </Button>
                    <Button
                        variant="secondary"
                        className="w-full justify-start h-12"
                        onClick={() => addTextItem('content')}
                    >
                        <AlignLeft className="mr-2 h-5 w-5" />
                        <span className="hidden md:inline">내용 추가</span>
                    </Button>
                    <Button
                        variant="secondary"
                        className="w-full justify-start h-12 bg-green-600/20 hover:bg-green-600/30"
                        onClick={addCalendar}
                    >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        <span className="hidden md:inline">캘린더 추가</span>
                    </Button>
                </div>
            </aside>

            {/* Center - Canvas Area */}
            <main ref={mainRef} className="flex-1 w-0 relative bg-neutral-900/50 flex flex-col overflow-hidden z-10">

                {/* Scrollable Container */}
                <div className="flex-1 overflow-auto p-12 flex relative custom-scrollbar">
                    <div
                        className="relative m-auto transition-all duration-75 ease-out shadow-2xl"
                        style={{
                            width: imgSize.width ? imgSize.width * scale : 'auto',
                            height: imgSize.height ? imgSize.height * scale : 'auto',
                            flexShrink: 0
                        }}
                    >
                        <div
                            ref={canvasRef}
                            className="relative overflow-hidden group origin-top-left bg-[#171717]"
                            style={{
                                width: imgSize.width || 'auto',
                                height: imgSize.height || 'auto',
                                transform: `scale(${scale})`,
                            }}
                            onClick={() => setSelectedId(null)}
                        >
                            <img
                                src={originalImageUrl || imageUrl}
                                alt="Background"
                                className="w-full h-full object-contain pointer-events-none select-none"
                                crossOrigin="anonymous"
                                onLoad={handleImageLoad}
                            />
                            {items.map(item => (
                                <DraggableText
                                    key={item.id}
                                    item={item}
                                    selectedId={selectedId}
                                    updateItem={updateItem}
                                    setSelectedId={setSelectedId}
                                    scale={scale}
                                />
                            ))}
                            {calendars.map(calendar => (
                                <DraggableCalendar
                                    key={calendar.id}
                                    item={calendar}
                                    selectedId={selectedId}
                                    updateItem={updateCalendar}
                                    setSelectedId={setSelectedId}
                                    scale={scale}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Zoom Toolbar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 bg-neutral-800/90 backdrop-blur border border-neutral-700 p-2 rounded-lg shadow-xl text-white">
                        <span className="text-sm font-medium px-2 text-neutral-400">보기:</span>
                        <div className="bg-white text-neutral-900 text-sm font-bold min-w-[4ch] px-2 py-1 rounded text-center">
                            {Math.round(scale * 100)}%
                        </div>

                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-neutral-700 bg-neutral-600 hover:text-white rounded-md ml-2" onClick={handleZoomOut}>
                            <Minus className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-neutral-700 bg-neutral-600 hover:text-white rounded-md" onClick={handleResetZoom} title="원본 크기 (100%)">
                            <Search className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-neutral-700 bg-neutral-600 hover:text-white rounded-md" onClick={handleZoomIn}>
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Download Actions (Top Right of Canvas) */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <select
                        className="bg-neutral-800 border border-neutral-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value as 'png' | 'jpg')}
                    >
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                    </select>
                    <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                        <Download className="mr-2 h-4 w-4" />
                        다운로드
                    </Button>
                </div>
            </main>

            {/* Right Sidebar - Properties */}
            {selectedItem || selectedCalendar ? (
                <aside className="w-80 bg-neutral-800 border-l border-neutral-700 flex flex-col z-40 flex-none shrink-0 transition-all">
                    <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                        <h3 className="font-semibold">
                            {selectedCalendar ? '캘린더 편집' : '텍스트 편집'}
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                            onClick={() => deleteItem(selectedId!)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="p-4 space-y-6 overflow-y-auto">
                        {/* Text Item Editing */}
                        {selectedItem && (
                            <>
                                <div className="space-y-2">
                                    <Label>내용</Label>
                                    {selectedItem.type === 'content' ? (
                                        <textarea
                                            value={selectedItem.text}
                                            onChange={(e) => updateItem(selectedItem.id, { text: e.target.value })}
                                            className="w-full h-32 bg-neutral-900 border border-neutral-600 rounded-md p-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={selectedItem.text}
                                            onChange={(e) => updateItem(selectedItem.id, { text: e.target.value })}
                                            className="w-full bg-neutral-900 border border-neutral-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>크기</Label>
                                        <span className="text-xs text-muted-foreground">{selectedItem.fontSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="12"
                                        max="120"
                                        step="1"
                                        value={selectedItem.fontSize}
                                        onChange={(e) => updateItem(selectedItem.id, { fontSize: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>색상</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(c => (
                                            <button
                                                key={c}
                                                className={cn(
                                                    "w-8 h-8 rounded-full border border-neutral-600",
                                                    selectedItem.color === c && "ring-2 ring-white ring-offset-2 ring-offset-neutral-800"
                                                )}
                                                style={{ backgroundColor: c }}
                                                onClick={() => updateItem(selectedItem.id, { color: c })}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={selectedItem.color}
                                            onChange={(e) => updateItem(selectedItem.id, { color: e.target.value })}
                                            className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>폰트</Label>
                                    <select
                                        className="w-full bg-neutral-900 border border-neutral-600 rounded-md p-2 text-sm"
                                        value={selectedItem.fontFamily}
                                        onChange={(e) => updateItem(selectedItem.id, { fontFamily: e.target.value })}
                                    >
                                        <option value="Pretendard">Pretendard (기본)</option>
                                        <optgroup label="Korean">
                                            <option value="'Nanum Gothic', sans-serif">나눔고딕 (Nanum Gothic)</option>
                                            <option value="'Nanum Myeongjo', serif">나눔명조 (Nanum Myeongjo)</option>
                                            <option value="'Malgun Gothic', sans-serif">맑은 고딕 (Malgun Gothic)</option>
                                            <option value="Dotum, sans-serif">돋움 (Dotum)</option>
                                            <option value="Gulim, sans-serif">굴림 (Gulim)</option>
                                        </optgroup>
                                        <optgroup label="Sans Serif">
                                            <option value="Arial, sans-serif">Arial</option>
                                            <option value="Helvetica, sans-serif">Helvetica</option>
                                            <option value="Verdana, sans-serif">Verdana</option>
                                            <option value="Tahoma, sans-serif">Tahoma</option>
                                            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                                            <option value="Impact, sans-serif">Impact</option>
                                        </optgroup>
                                        <optgroup label="Serif">
                                            <option value="'Times New Roman', serif">Times New Roman</option>
                                            <option value="Georgia, serif">Georgia</option>
                                            <option value="Garamond, serif">Garamond</option>
                                        </optgroup>
                                        <optgroup label="Others">
                                            <option value="'Courier New', monospace">Courier New</option>
                                            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "flex-1 border-neutral-600",
                                            selectedItem.isBold
                                                ? "bg-white text-black hover:bg-neutral-200 border-transparent font-bold"
                                                : "bg-transparent text-white hover:bg-neutral-800 hover:text-white"
                                        )}
                                        onClick={() => updateItem(selectedItem.id, { isBold: !selectedItem.isBold })}
                                    >
                                        <Bold className="h-4 w-4 mr-2" /> Bold
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Calendar Editing */}
                        {selectedCalendar && (
                            <>
                                {/* Year & Month Selection */}
                                <div className="space-y-2">
                                    <Label>연도 / 월</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            className="bg-neutral-900 border border-neutral-600 rounded-md p-2 text-sm"
                                            value={selectedCalendar.year}
                                            onChange={(e) => updateCalendar(selectedCalendar.id, { year: parseInt(e.target.value) })}
                                        >
                                            {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                                <option key={year} value={year}>{year}년</option>
                                            ))}
                                        </select>
                                        <select
                                            className="bg-neutral-900 border border-neutral-600 rounded-md p-2 text-sm"
                                            value={selectedCalendar.month}
                                            onChange={(e) => updateCalendar(selectedCalendar.id, { month: parseInt(e.target.value) })}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <option key={month} value={month}>{month}월</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Font Size */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>폰트 크기</Label>
                                        <span className="text-xs text-muted-foreground">{selectedCalendar.fontSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="32"
                                        step="1"
                                        value={selectedCalendar.fontSize}
                                        onChange={(e) => updateCalendar(selectedCalendar.id, { fontSize: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Cell Size */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>셀 크기</Label>
                                        <span className="text-xs text-muted-foreground">{selectedCalendar.cellWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="30"
                                        max="80"
                                        step="5"
                                        value={selectedCalendar.cellWidth}
                                        onChange={(e) => {
                                            const size = parseInt(e.target.value);
                                            updateCalendar(selectedCalendar.id, {
                                                cellWidth: size,
                                                cellHeight: size
                                            });
                                        }}
                                        className="w-full h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Header Color */}
                                <div className="space-y-2">
                                    <Label>헤더 색상</Label>
                                    <input
                                        type="color"
                                        value={selectedCalendar.headerColor}
                                        onChange={(e) => updateCalendar(selectedCalendar.id, { headerColor: e.target.value })}
                                        className="w-full h-10 p-1 border border-neutral-600 rounded-md overflow-hidden"
                                    />
                                </div>

                                {/* Weekday Colors */}
                                <div className="space-y-2">
                                    <Label>요일 색상</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-neutral-400">일요일</label>
                                            <input
                                                type="color"
                                                value={selectedCalendar.sundayColor}
                                                onChange={(e) => updateCalendar(selectedCalendar.id, { sundayColor: e.target.value })}
                                                className="w-full h-8 p-0 border border-neutral-600 rounded overflow-hidden"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-400">평일</label>
                                            <input
                                                type="color"
                                                value={selectedCalendar.weekdayColor}
                                                onChange={(e) => updateCalendar(selectedCalendar.id, { weekdayColor: e.target.value })}
                                                className="w-full h-8 p-0 border border-neutral-600 rounded overflow-hidden"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-400">토요일</label>
                                            <input
                                                type="color"
                                                value={selectedCalendar.saturdayColor}
                                                onChange={(e) => updateCalendar(selectedCalendar.id, { saturdayColor: e.target.value })}
                                                className="w-full h-8 p-0 border border-neutral-600 rounded overflow-hidden"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Background Color */}
                                <div className="space-y-2">
                                    <Label>배경 색상</Label>
                                    <input
                                        type="color"
                                        value={selectedCalendar.backgroundColor}
                                        onChange={(e) => updateCalendar(selectedCalendar.id, { backgroundColor: e.target.value })}
                                        className="w-full h-10 p-1 border border-neutral-600 rounded-md overflow-hidden"
                                    />
                                </div>

                                {/* Opacity */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>투명도</Label>
                                        <span className="text-xs text-muted-foreground">{Math.round(selectedCalendar.opacity * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={selectedCalendar.opacity}
                                        onChange={(e) => updateCalendar(selectedCalendar.id, { opacity: parseFloat(e.target.value) })}
                                        className="w-full h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Show Weekdays Toggle */}
                                <div className="flex items-center justify-between">
                                    <Label>요일 표시</Label>
                                    <button
                                        onClick={() => updateCalendar(selectedCalendar.id, { showWeekdays: !selectedCalendar.showWeekdays })}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                            selectedCalendar.showWeekdays ? "bg-blue-600" : "bg-neutral-600"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                selectedCalendar.showWeekdays ? "translate-x-6" : "translate-x-1"
                                            )}
                                        />
                                    </button>
                                </div>
                            </>
                        )}
                    </div >
                </aside >
            ) : (
                <aside className="w-80 bg-neutral-800 border-l border-neutral-700 flex flex-col items-center justify-center text-center p-8 text-neutral-500 flex-none shrink-0 z-40">
                    <Move className="h-12 w-12 mb-4 opacity-20" />
                    <p>아이템을 선택하여<br />편집하세요</p>
                </aside>
            )
            }
        </div >
    );
}
