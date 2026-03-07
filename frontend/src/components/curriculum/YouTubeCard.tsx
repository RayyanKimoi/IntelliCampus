'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, Play, ExternalLink } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import { ChapterContent } from '@/services/chapterCurriculumService';

interface YouTubeCardProps {
  item: ChapterContent;
  onEdit: (item: ChapterContent) => void;
  onDelete: (item: ChapterContent) => void;
}

import { motion } from 'motion/react';

export function YouTubeCard({ item, onEdit, onDelete }: YouTubeCardProps) {
  const handleWatch = () => {
    if (item.youtubeUrl) {
      window.open(item.youtubeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="group h-full flex flex-col justify-between border-border dark:border-slate-800 bg-background dark:bg-slate-900 hover:shadow-lg hover:border-red-400/40 transition-all duration-200 overflow-hidden">
        <div>
          {/* Thumbnail */}
          <div className="relative w-full aspect-video bg-slate-900 dark:bg-slate-950 overflow-hidden shrink-0">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaYoutube className="h-10 w-10 text-red-500" />
              </div>
            )}
            {/* Play overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={handleWatch}
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 w-12 rounded-full bg-white/95 flex items-center justify-center shadow-xl"
              >
                <Play className="h-5 w-5 text-slate-900 ml-0.5" />
              </motion.div>
            </div>
            {/* YouTube badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
              <FaYoutube className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-semibold text-white">YouTube</span>
            </div>
            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-6 w-6 rounded bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              >
                <Edit2 className="h-3 w-3 text-white" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-6 w-6 rounded bg-black/60 hover:bg-red-600/90 flex items-center justify-center transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              >
                <Trash2 className="h-3 w-3 text-white" />
              </motion.button>
            </div>
          </div>

          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-semibold line-clamp-2 leading-snug">{item.title}</CardTitle>
            <CardDescription className="text-xs">
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
        </div>

        <CardContent className="pt-0 mt-auto">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              className="w-full text-xs bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={handleWatch}
            >
              <Play className="h-3 w-3 mr-2" />
              Watch
              <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
