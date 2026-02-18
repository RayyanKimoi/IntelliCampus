import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { registerSchema, loginSchema } from '../utils/validators';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const result = await userService.register(parsed.data);
    sendSuccess(res, result, 'Registration successful', 201);
  } catch (error: any) {
    sendError(res, error.message, 409);
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const result = await userService.login(parsed.data.email, parsed.data.password);
    sendSuccess(res, result, 'Login successful');
  } catch (error: any) {
    sendError(res, error.message, 401);
  }
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  const user = await userService.getUserById(req.user.userId);

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  const profile = await userService.updateProfile(req.user.userId, req.body);
  sendSuccess(res, profile, 'Profile updated');
});
