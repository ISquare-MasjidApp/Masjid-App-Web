import { get, post, put, patch, del } from './client';
import type { Announcement } from '@/types';
import type { ApiResponse } from '@/types/api';
import type { PaginatedResponse } from './events';

// Request parameters
export interface GetAnnouncementsParams {
    status?: 'draft' | 'scheduled' | 'sent';
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    size?: number;
}

export interface CreateAnnouncementData {
    title: string;
    message: string;
    scheduledAt?: string;
    status: 'draft' | 'scheduled' | 'sent';
}

export interface UpdateAnnouncementData {
    title?: string;
    message?: string;
    scheduledAt?: string;
}

/**
 * Fetch announcements for admin with optional filters and pagination
 */
export async function getAnnouncements(params?: GetAnnouncementsParams): Promise<PaginatedResponse<Announcement>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
            }
        });
    }

    const qs = queryParams.toString();
    const endpoint = `/admin/announcements${qs ? `?${qs}` : ''}`;
    
    const response = await get<ApiResponse<PaginatedResponse<Announcement>>>(endpoint);
    return response.data;
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(data: CreateAnnouncementData): Promise<Announcement> {
    const response = await post<ApiResponse<Announcement>>('/admin/announcements', data);
    return response.data;
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(id: string, data: UpdateAnnouncementData): Promise<Announcement> {
    const response = await put<ApiResponse<Announcement>>(`/admin/announcements/${id}`, data);
    return response.data;
}

/**
 * Change the status of an announcement
 */
export async function changeAnnouncementStatus(id: string, status: string): Promise<Announcement> {
    const response = await patch<ApiResponse<Announcement>>(`/admin/announcements/${id}/status`, { status });
    return response.data;
}

/**
 * Delete an unsent announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
    await del<void>(`/admin/announcements/${id}`);
}
