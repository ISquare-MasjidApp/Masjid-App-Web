import { get, post, put, patch, del, postFormData, putFormData } from './client';
import type { Event } from '@/types';
import type { ApiResponse } from '@/types/api';

// For paginated responses
export interface PaginatedResponse<T> {
    content: T[];
    pagination: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

// Request parameters
export interface GetEventsParams {
    status?: 'draft' | 'published' | 'cancelled' | 'completed';
    upcoming?: boolean;
    past?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    size?: number;
}

/**
 * Fetch events for admin with optional filters and pagination
 */
export async function getEvents(params?: GetEventsParams): Promise<PaginatedResponse<Event>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
            }
        });
    }

    const qs = queryParams.toString();
    const endpoint = `/admin/events${qs ? `?${qs}` : ''}`;
    
    const response = await get<ApiResponse<PaginatedResponse<Event>>>(endpoint);
    return response.data;
}

/**
 * Create a new event
 * Uses FormData to handle image uploads
 */
export async function createEvent(formData: FormData): Promise<Event> {
    const response = await postFormData<ApiResponse<Event>>('/admin/events', formData);
    return response.data;
}

/**
 * Update an existing event
 * Uses FormData to handle potential image updates
 */
export async function updateEvent(id: string, formData: FormData): Promise<Event> {
    const response = await putFormData<ApiResponse<Event>>(`/admin/events/${id}`, formData);
    return response.data;
}

/**
 * Change status of an event (e.g. 'published', 'cancelled', 'draft', 'completed')
 */
export async function changeEventStatus(id: string, status: string): Promise<Event> {
    const response = await patch<ApiResponse<Event>>(`/admin/events/${id}/status`, { status });
    return response.data;
}

/**
 * Cancel an event (soft-cancel — marks status as cancelled, preserves data).
 */
export async function cancelEvent(id: string): Promise<void> {
    await patch<void>(`/admin/events/${id}/status`, { status: 'cancelled' });
}

/**
 * Permanently delete a cancelled event.
 */
export async function deleteEvent(id: string): Promise<void> {
    await del<void>(`/admin/events/${id}`);
}
