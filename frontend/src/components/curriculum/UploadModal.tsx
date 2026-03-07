'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Upload, File as FileIcon, X, Camera, FileText, CheckCircle2 } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileImage } from 'react-icons/fa';
import { motion, AnimatePresence } from 'motion/react';

type UploadTab = 'file' | 'youtube';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadFile: (file: File, title: string) => Promise<void>;
  onAddYouTube: (youtubeUrl: string, title: string) => Promise<void>;
  defaultTab?: UploadTab;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

const ACCEPT_STRING = '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp';

function getIconForFile(file: File) {
  if (file.type === 'application/pdf') return <FaFilePdf className="h-8 w-8 text-red-500" />;
  if (file.type.includes('word') || file.type.includes('document')) return <FaFileWord className="h-8 w-8 text-blue-600" />;
  if (file.type.includes('presentation') || file.type.includes('powerpoint')) return <FaFilePowerpoint className="h-8 w-8 text-orange-500" />;
  if (file.type.includes('image')) return <FaFileImage className="h-8 w-8 text-green-500" />;
  return <FileText className="h-8 w-8 text-sky-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function UploadModal({ open, onOpenChange, onUploadFile, onAddYouTube, defaultTab = 'file' }: UploadModalProps) {
  const [tab, setTab] = useState<UploadTab>(defaultTab);

  // File tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // YouTube tab state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeThumbnail, setYoutubeThumbnail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const resetState = () => {
    setSelectedFile(null);
    setFileTitle('');
    setYoutubeUrl('');
    setYoutubeTitle('');
    setYoutubeThumbnail('');
    setError('');
    setIsDragging(false);
    setSubmitting(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      resetState();
      setTab(defaultTab);
    }
    onOpenChange(val);
  };

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
    }
  }, [open, defaultTab]);

  const handleFile = (file: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type as any)) {
      setError('Unsupported file type. Please upload a PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, or JPEG.');
      return;
    }
    setError('');
    setSelectedFile(file);
    if (!fileTitle) {
      setFileTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  // Drag and drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [fileTitle]);

  // YouTube URL handler — auto-extract preview
  const handleYouTubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      setYoutubeThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      setError('');
    } else {
      setYoutubeThumbnail('');
      if (url.length > 10) setError('Could not extract video ID. Please paste a valid YouTube URL.');
    }
  };

  const handleSubmitFile = async () => {
    if (!selectedFile || !fileTitle.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onUploadFile(selectedFile, fileTitle.trim());
      handleOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload file');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitYouTube = async () => {
    if (!youtubeUrl.trim() || !youtubeTitle.trim()) return;
    if (!extractYouTubeVideoId(youtubeUrl)) {
      setError('Invalid YouTube URL');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onAddYouTube(youtubeUrl.trim(), youtubeTitle.trim());
      handleOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to add YouTube video');
    } finally {
      setSubmitting(false);
    }
  };

  // Camera flow
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      // Need a small timeout to let the video element render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error(e));
        }
      }, 100);
    } catch (err: any) {
      setError(err?.message || 'Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `Notes_Capture_${new Date().getTime()}.jpg`, { type: 'image/jpeg' });
            handleFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const canSubmitFile = selectedFile && fileTitle.trim() && !submitting;
  const canSubmitYT = youtubeUrl.trim() && youtubeTitle.trim() && !!extractYouTubeVideoId(youtubeUrl) && !submitting;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg sm:rounded-xl shadow-lg border-border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Content</DialogTitle>
            <DialogDescription>
              Upload learning materials or connect a YouTube video.
            </DialogDescription>
          </DialogHeader>

          <Tabs 
            value={tab} 
            onValueChange={(val) => { setTab(val as UploadTab); setError(''); }} 
            className="w-full mt-2"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 rounded-lg bg-muted p-1">
              <TabsTrigger value="file" className="gap-2 text-sm font-medium rounded-md data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4" />
                Document Upload
              </TabsTrigger>
              <TabsTrigger value="youtube" className="gap-2 text-sm font-medium rounded-md data-[state=active]:text-red-600 data-[state=active]:dark:text-red-400 data-[state=active]:shadow-sm">
                <FaYoutube className="h-4 w-4" />
                Video Upload
              </TabsTrigger>
            </TabsList>

            {/* FILE TAB */}
            <TabsContent value="file" className="outline-none space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key="file-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Drop zone */}
                  <motion.div
                    whileHover={{ scale: selectedFile ? 1 : 1.01 }}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                      'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : selectedFile
                        ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10'
                        : 'border-border dark:border-slate-700 hover:border-primary/50 hover:bg-muted/40'
                    )}
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        {getIconForFile(selectedFile)}
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            {selectedFile.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors mt-2 bg-background dark:bg-slate-800 rounded px-3 py-1.5 shadow-sm border border-border"
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFileTitle(''); }}
                        >
                          <X className="h-3 w-3 inline mr-1" />Remove File
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, PPT, PPTX, PNG, JPG</p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Hidden input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_STRING}
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />

                  {/* Action buttons row */}
                  <div className="flex gap-3">
                    <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-sm font-medium dark:border-slate-700"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileIcon className="h-4 w-4 mr-2 text-primary" />
                        Browse Files
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-sm font-medium dark:border-slate-700"
                        onClick={startCamera}
                      >
                        <Camera className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Camera Capture</span>
                      </Button>
                    </motion.div>
                  </div>

                  {/* Title */}
                  <div className="pt-2">
                    <Label htmlFor="file-title" className="text-sm font-semibold">Content Title <span className="text-red-500">*</span></Label>
                    <Input
                      id="file-title"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      placeholder="e.g., Chapter 1 — Introduction Slides"
                      className="mt-1.5 dark:bg-slate-900"
                    />
                  </div>

                  {error && <p className="text-xs font-medium text-destructive">{error}</p>}

                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <motion.div whileTap={{ scale: canSubmitFile ? 0.96 : 1 }}>
                      <Button onClick={handleSubmitFile} disabled={!canSubmitFile}>
                        {submitting ? 'Uploading...' : 'Save Document'}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* YOUTUBE TAB */}
            <TabsContent value="youtube" className="outline-none space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key="youtube-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="yt-url" className="text-sm font-semibold">YouTube Link <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1.5">
                      <FaYoutube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                      <Input
                        id="yt-url"
                        value={youtubeUrl}
                        onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="pl-9 dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Thumbnail preview */}
                  {youtubeThumbnail && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg overflow-hidden border border-border dark:border-slate-800 shadow-sm aspect-video relative group"
                    >
                      <img src={youtubeThumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10"></div>
                    </motion.div>
                  )}

                  <div className="pt-1">
                    <Label htmlFor="yt-title" className="text-sm font-semibold">Video Title <span className="text-red-500">*</span></Label>
                    <Input
                      id="yt-title"
                      value={youtubeTitle}
                      onChange={(e) => setYoutubeTitle(e.target.value)}
                      placeholder="e.g., Lecture 3 — Sorting Algorithms"
                      className="mt-1.5 dark:bg-slate-900"
                    />
                  </div>

                  {error && <p className="text-xs font-medium text-destructive">{error}</p>}

                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
                      Cancel
                    </Button>
                    <motion.div whileTap={{ scale: canSubmitYT ? 0.96 : 1 }}>
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white rounded-md px-6 shadow-sm shadow-red-500/20"
                        onClick={handleSubmitYouTube}
                        disabled={!canSubmitYT}
                      >
                        {submitting ? 'Adding Video...' : 'Add Video'}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* WEBCAM MODAL */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-black border-slate-800" aria-describedby={undefined}>
          <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-slate-800">
            <DialogTitle className="text-white font-semibold flex items-center gap-2 m-0 mt-0 text-base">
              <Camera className="h-5 w-5 text-slate-300" />
              Capture Notes
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative bg-black w-full aspect-[4/3] sm:aspect-video flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover" 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none border-[3px] border-white/20 m-6 rounded-lg">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 bg-black/40 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                Position document in frame
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 p-5 flex justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={captureImage}
              className="h-16 w-16 rounded-full border-4 border-slate-400 bg-white flex items-center justify-center hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/40 relative shadow-xl shadow-white/10"
            >
              <div className="h-12 w-12 rounded-full bg-white border cursor-pointer border-slate-200"></div>
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
