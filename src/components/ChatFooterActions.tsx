
import React, { useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Camera, SlidersHorizontal, Globe, Sparkles, ImageIcon, Telescope, Newspaper, Radio, FileText, Calculator } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import ImageGallery from '@/components/ImageGallery';
import LiveTalkingMode from '@/components/chat/LiveTalkingMode';
import { checkStoragePermission, isMobile, isWebView, requestCameraPermission } from '@/utils/permissions';
import { persistAttachmentToSession } from '@/utils/attachmentSession';

export interface UploadedFile {
    id: string;
    file: File;
    preview?: string;
    type: 'image' | 'pdf' | 'file';
}

interface ChatFooterActionsProps {
    webSearchEnabled?: boolean;
    onWebSearchToggle?: (enabled: boolean) => void;
    isImageMode: boolean;
    setIsImageMode: (value: boolean) => void;
    isDeepThinkingMode: boolean;
    setIsDeepThinkingMode: (value: boolean) => void;
    isNewsMode: boolean;
    setIsNewsMode: (value: boolean) => void;
    isReasoningMode: boolean;
    setIsReasoningMode: (value: boolean) => void;
    setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    isLoading?: boolean;
    isDisabled?: boolean;
    attachmentSessionKey?: string;
}

const ChatFooterActions: React.FC<ChatFooterActionsProps> = (props) => {
    const { language } = useLanguage();
    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileUploadInputRef = useRef<HTMLInputElement>(null);

    const requestPhotoLibraryAccess = async () => {
        // Android WebView can require native storage permission for gallery/files.
        if (isWebView() && isMobile()) {
            const granted = await checkStoragePermission(language);
            if (!granted) return false;
        }
        return true;
    };

    const openImagePicker = async () => {
        const canOpen = await requestPhotoLibraryAccess();
        if (!canOpen) return;
        fileInputRef.current?.click();
        setIsAttachOpen(false);
    };

    const openFilePicker = async () => {
        const canOpen = await requestPhotoLibraryAccess();
        if (!canOpen) return;
        fileUploadInputRef.current?.click();
        setIsAttachOpen(false);
    };

    const openCameraPicker = async () => {
        // Prompt camera permission first for better Android/iOS UX.
        const stream = await requestCameraPermission('environment', language);
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        cameraInputRef.current?.click();
        setIsAttachOpen(false);
    };

    const toggleMode = (mode: 'web' | 'image' | 'deep' | 'news' | 'reasoning') => {
        props.onWebSearchToggle?.(mode === 'web' ? !props.webSearchEnabled : false);
        props.setIsImageMode(mode === 'image' ? !props.isImageMode : false);
        props.setIsDeepThinkingMode(mode === 'deep' ? !props.isDeepThinkingMode : false);
        props.setIsNewsMode(mode === 'news' ? !props.isNewsMode : false);
        props.setIsReasoningMode(mode === 'reasoning' ? !props.isReasoningMode : false);
        setIsToolsOpen(false);
        props.textareaRef.current?.focus();
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf' | 'file') => {
        const files = event.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (type === 'image' && !file.type.startsWith('image/')) {
                toast.error(language === 'hi' ? 'कृपया केवल image file चुनें' : 'Please select an image file');
                continue;
            }
            if (file.size > 20 * 1024 * 1024) {
                toast.error(language === 'hi' ? 'फ़ाइल 20MB से छोटी होनी चाहिए' : 'File must be under 20MB');
                continue;
            }

            const uploadedFile: UploadedFile = {
                id: crypto.randomUUID(),
                file,
                type,
                preview: type === 'image' ? URL.createObjectURL(file) : undefined,
            };
            props.setUploadedFiles(prev => [...prev, uploadedFile]);

            try {
                await persistAttachmentToSession(props.attachmentSessionKey, uploadedFile);
            } catch (error) {
                console.error('Attachment session persist failed:', error);
            }
        }

        event.target.value = '';
        setIsAttachOpen(false);
        props.textareaRef.current?.focus();
    };

    return (
        <>
            <input type="file" ref={fileInputRef} onChange={(e) => { void handleFileSelect(e, 'image'); }} accept="image/*" className="hidden" />
            <input type="file" ref={cameraInputRef} onChange={(e) => { void handleFileSelect(e, 'image'); }} accept="image/*" capture="environment" className="hidden" />
            <input type="file" ref={fileUploadInputRef} onChange={(e) => { void handleFileSelect(e, 'file'); }} accept=".pdf,.doc,.docx,.txt,image/*" className="hidden" />

            <div className="flex items-center gap-1">
                {/* Attachment Plus Button */}
                <Popover open={isAttachOpen} onOpenChange={setIsAttachOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" disabled={props.isLoading || props.isDisabled}>
                            <Plus className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-52 p-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                void openImagePicker();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted"
                        >
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/10"><Upload className="h-4 w-4 text-primary" /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{language === 'hi' ? 'इमेज अपलोड' : 'Upload Image'}</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                void openCameraPicker();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted"
                        >
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-emerald-500/10"><Camera className="h-4 w-4 text-emerald-600" /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{language === 'hi' ? 'कैमरा' : 'Camera'}</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                void openFilePicker();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted"
                        >
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-amber-500/10"><FileText className="h-4 w-4 text-amber-600" /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{language === 'hi' ? 'फ़ाइल अपलोड' : 'Upload File'}</p>
                            </div>
                        </button>
                    </PopoverContent>
                </Popover>

                {/* Tools Button */}
                <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" disabled={props.isLoading || props.isDisabled}>
                            <SlidersHorizontal className="h-[18px] w-[18px]" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-60 p-1.5">
                        <button type="button" onClick={() => toggleMode('web')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.webSearchEnabled ? 'bg-emerald-100' : 'bg-muted'}`}><Globe className={`h-4 w-4 ${props.webSearchEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`} /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Web Search</p>
                                <p className="text-xs text-muted-foreground">{props.webSearchEnabled ? 'ON' : 'Real-time web search'}</p>
                            </div>
                        </button>
                        <button type="button" onClick={() => toggleMode('image')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.isImageMode ? 'bg-primary/10' : 'bg-muted'}`}><Sparkles className={`h-4 w-4 ${props.isImageMode ? 'text-primary' : 'text-muted-foreground'}`} /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Image Create</p>
                                <p className="text-xs text-muted-foreground">{props.isImageMode ? 'ON' : 'Generate image with AI'}</p>
                            </div>
                        </button>
                        <button type="button" onClick={() => { setIsGalleryOpen(true); setIsToolsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Image Gallery</p>
                                <p className="text-xs text-muted-foreground">View generated images</p>
                            </div>
                        </button>
                        <button type="button" onClick={() => toggleMode('deep')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.isDeepThinkingMode ? 'bg-amber-100' : 'bg-muted'}`}><Telescope className={`h-4 w-4 ${props.isDeepThinkingMode ? 'text-amber-600' : 'text-muted-foreground'}`} /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Deep Thinking</p>
                                <p className="text-xs text-muted-foreground">{props.isDeepThinkingMode ? 'ON' : 'In-depth topic analysis'}</p>
                            </div>
                        </button>
                        <button type="button" onClick={() => toggleMode('news')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.isNewsMode ? 'bg-blue-100' : 'bg-muted'}`}><Newspaper className={`h-4 w-4 ${props.isNewsMode ? 'text-blue-600' : 'text-muted-foreground'}`} /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">News</p>
                                <p className="text-xs text-muted-foreground">{props.isNewsMode ? 'ON' : 'Search latest news'}</p>
                            </div>
                        </button>
                        <button type="button" onClick={() => toggleMode('reasoning')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.isReasoningMode ? 'bg-violet-100' : 'bg-muted'}`}><Calculator className={`h-4 w-4 ${props.isReasoningMode ? 'text-violet-600' : 'text-muted-foreground'}`} /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Maths & Reasoning</p>
                                <p className="text-xs text-muted-foreground">{props.isReasoningMode ? 'ON' : 'Step-by-step problem solving'}</p>
                            </div>
                        </button>
                        <button type="button" onClick={() => { setIsLiveMode(true); setIsToolsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-destructive/10"><Radio className="h-4 w-4 text-destructive" /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Live Talking</p>
                                <p className="text-xs text-muted-foreground">Experience Gemini Live</p>
                            </div>
                        </button>
                    </PopoverContent>
                </Popover>
            </div>

            <ImageGallery open={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
            <LiveTalkingMode open={isLiveMode} onClose={() => setIsLiveMode(false)} />
        </>
    );
};

export default ChatFooterActions;
