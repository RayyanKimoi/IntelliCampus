'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Edit2, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileImage } from 'react-icons/fa';
import { ChapterContent } from '@/services/chapterCurriculumService';

interface FileCardProps {
  item: ChapterContent;
  onEdit: (item: ChapterContent) => void;
  onDelete: (item: ChapterContent) => void;
}

export function getContentTypeLabel(type: string): string {
  switch (type) {
    case 'pdf': return 'PDF';
    case 'doc': return 'DOC';
    case 'ppt': return 'PPT';
    case 'image': return 'Image';
    default: return 'File';
  }
}

export function getFileIcon(type: string, fileType?: string) {
  const t = type || '';
  const ft = fileType || '';

  if (t === 'pdf' || ft.includes('pdf')) {
    return <FaFilePdf className="h-6 w-6 text-red-500" />;
  }
  if (t === 'doc' || ft.includes('word') || ft.includes('document')) {
    return <FaFileWord className="h-6 w-6 text-blue-600" />;
  }
  if (t === 'ppt' || ft.includes('presentation') || ft.includes('powerpoint')) {
    return <FaFilePowerpoint className="h-6 w-6 text-orange-500" />;
  }
  if (t === 'image' || ft.includes('image')) {
    return <FaFileImage className="h-6 w-6 text-green-500" />;
  }
  return <FileText className="h-6 w-6 text-sky-500" />;
}

export function getTypeBadgeColor(type: string) {
  switch (type) {
    case 'pdf': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'doc': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'ppt': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'image': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
  }
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

import { motion } from 'motion/react';

export function FileCard({ item, onEdit, onDelete }: FileCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="group h-full flex flex-col justify-between border-border dark:border-slate-800 bg-background dark:bg-slate-900 hover:shadow-lg hover:border-primary/40 dark:hover:border-primary/40 transition-shadow duration-200">
        <CardHeader className="pb-3 flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {getFileIcon(item.type, item.fileType)}
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getTypeBadgeColor(item.type)}`}>
                {getContentTypeLabel(item.type)}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit(item)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-7 w-7 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>
          <CardTitle className="text-base line-clamp-2 leading-snug">{item.title}</CardTitle>
          <CardDescription className="text-xs mt-1">
            {formatFileSize(item.fileSize)} · {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => item.fileUrl && window.open(item.fileUrl, '_blank')}
              disabled={!item.fileUrl}
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Download
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
