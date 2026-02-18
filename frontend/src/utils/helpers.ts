import { NextResponse } from 'next/server';
import { ApiResponse } from '@intellicampus/shared';
import { PAGINATION } from '@intellicampus/shared';

/**
 * Standardized success response for Next.js API routes
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Standardized error response for Next.js API routes
 */
export function createErrorResponse(
  error: string,
  statusCode = 400
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
  };
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Paginated response helper for Next.js API routes
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, { status: 200 });
}

/**
 * Parse pagination from query params
 */
export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, Number(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number(query.limit) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Parse pagination from URL search params (Next.js)
 */
export function parsePaginationFromSearchParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, Number(searchParams.get('page')) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number(searchParams.get('limit')) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
