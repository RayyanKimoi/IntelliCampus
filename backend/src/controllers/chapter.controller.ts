import { Request, Response } from 'express';
import { chapterService } from '../services/chapter.service';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { z } from 'zod';

// Validation schemas
const createChapterSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  orderIndex: z.number().optional(),
});

const updateChapterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  orderIndex: z.number().optional(),
});

const uploadContentSchema = z.object({
  chapterId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  orderIndex: z.number().optional(),
});

const updateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  orderIndex: z.number().optional(),
});

// ========================
// Chapter Management
// ========================

export const getTeacherCourses = asyncHandler(async (req: Request, res: Response) => {
  const courses = await chapterService.getTeacherCourses(req.user!.userId);
  sendSuccess(res, courses);
});

export const getCourseChapters = asyncHandler(async (req: Request, res: Response) => {
  const chapters = await chapterService.getCourseChapters(req.params.courseId as string);
  sendSuccess(res, chapters);
});

export const getChapterDetail = asyncHandler(async (req: Request, res: Response) => {
  const chapter = await chapterService.getChapterById(req.params.chapterId as string);
  if (!chapter) {
    sendError(res, 'Chapter not found', 404);
    return;
  }
  sendSuccess(res, chapter);
});

export const createChapter = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createChapterSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }
  const chapter = await chapterService.createChapter(parsed.data);
  sendSuccess(res, chapter, 'Chapter created successfully', 201);
});

export const updateChapter = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateChapterSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }
  const chapter = await chapterService.updateChapter(req.params.chapterId as string, parsed.data);
  sendSuccess(res, chapter, 'Chapter updated successfully');
});

export const deleteChapter = asyncHandler(async (req: Request, res: Response) => {
  await chapterService.deleteChapter(req.params.chapterId as string);
  sendSuccess(res, null, 'Chapter deleted successfully');
});

// ========================
// Content Management
// ========================

export const getChapterContent = asyncHandler(async (req: Request, res: Response) => {
  const content = await chapterService.getChapterContent(req.params.chapterId as string);
  sendSuccess(res, content);
});

export const uploadContent = asyncHandler(async (req: Request, res: Response) => {
  const parsed = uploadContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }
  const content = await chapterService.uploadContent({
    ...parsed.data,
    uploadedBy: req.user!.userId,
  });
  sendSuccess(res, content, 'Content uploaded successfully', 201);
});

export const updateContent = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateContentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }
  const content = await chapterService.updateContent(req.params.contentId as string, parsed.data);
  sendSuccess(res, content, 'Content updated successfully');
});

export const deleteContent = asyncHandler(async (req: Request, res: Response) => {
  await chapterService.deleteContent(req.params.contentId as string);
  sendSuccess(res, null, 'Content deleted successfully');
});
