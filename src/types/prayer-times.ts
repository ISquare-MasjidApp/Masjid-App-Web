// ============================================
// Prayer Time API Types — matches backend DTOs
// ============================================

/**
 * Individual prayer time data (within the JSONB prayers field)
 */
export interface PrayerTimeEntry {
    athan: string;  // e.g. "06:15"
    jamah?: string; // e.g. "06:45"
}

/**
 * All six daily prayers
 */
export interface PrayersData {
    fajr: PrayerTimeEntry;
    sunrise: PrayerTimeEntry;
    zuhr: PrayerTimeEntry;
    asr: PrayerTimeEntry;
    maghrib: PrayerTimeEntry;
    isha: PrayerTimeEntry;
}

/**
 * Jumu'ah (Friday) prayer time slot
 */
export interface JumuahTimeEntry {
    khutbah?: string;
    begins?: string;
    jamah: string;
}

/**
 * PrayerTime response from the API
 */
export interface PrayerTimeResponse {
    id: string;
    date: string; // YYYY-MM-DD
    hijriDate: string | null;
    hijriDay?: string | null;
    prayers: PrayersData;
    jumuahTimes: JumuahTimeEntry[] | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Paginated list response
 */
export interface PrayerTimesListResponse {
    content: PrayerTimeResponse[];
    pagination: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

/**
 * Request to create a single prayer time
 */
export interface CreatePrayerTimeRequest {
    date: string; // YYYY-MM-DD
    hijriDate?: string;
    prayers: PrayersData;
    jumuahTimes?: JumuahTimeEntry[];
}

/**
 * Request to update a prayer time
 */
export interface UpdatePrayerTimeRequest {
    hijriDate?: string;
    prayers?: PrayersData;
    jumuahTimes?: JumuahTimeEntry[];
}

/**
 * Request for bulk create/update
 */
export interface BulkPrayerTimeRequest {
    prayerTimes: CreatePrayerTimeRequest[];
}

/**
 * Result of a bulk operation
 */
export interface BulkPrayerTimeResult {
    created: number;
    updated: number;
    failed: number;
}
