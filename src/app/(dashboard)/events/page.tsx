'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    PlusIcon,
    GridViewIcon,
    CalendarViewIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ContentSwitcher,
    ConfirmModal,
} from '@/components/ui';
import type { EventConfirmType } from '@/components/ui';
import { Eye, Edit, Ban, Send } from 'lucide-react';
import DraftRowActions from '@/components/ui/DraftRowActions';
import { TrashIcon } from '@/components/ui/Icons';
import type { Event as EventType, Announcement } from '@/types';
import CalendarView from '@/components/dashboard/CalendarView';
import AddEventModal from '@/components/dashboard/AddEventModal';
import AddAnnouncementModal from '@/components/dashboard/AddAnnouncementModal';
import AnnouncementViewModal from '@/components/dashboard/AnnouncementViewModal';
import EventDetailsModal from '@/components/dashboard/EventDetailsModal';
import { getEvents, cancelEvent, deleteEvent, changeEventStatus } from '@/lib/api/events';
import type { GetEventsParams } from '@/lib/api/events';
import { getAnnouncements, deleteAnnouncement, changeAnnouncementStatus } from '@/lib/api/announcements';
import type { GetAnnouncementsParams } from '@/lib/api/announcements';

// Date/Time helper functions
function formatDate(isoString: string) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return '';
    }
}

function formatTime(isoString: string) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return '';
    }
}

// Maps the backend event.status enum to the ConfirmModal's eventType variant.
function statusToConfirmType(status: string | undefined): EventConfirmType {
    switch ((status || '').toLowerCase()) {
        case 'cancelled':
            return 'cancelled';
        case 'draft':
            return 'draft';
        case 'past':
        case 'completed':
        case 'sent':
            return 'past';
        case 'published':
        default:
            return 'upcoming';
    }
}

// Time filter options
type TimeFilterOption = 'ALL' | 'Upcoming' | 'Ongoing' | 'Past';
const EVENT_TIME_OPTIONS: TimeFilterOption[] = ['ALL', 'Upcoming', 'Ongoing', 'Past'];

const EVENT_STATUS_FILTERS = ['All', 'Published', 'Draft', 'Cancelled', 'Completed'] as const;
type EventStatusFilter = (typeof EVENT_STATUS_FILTERS)[number];

/**
 * An Event plus the display-only fields derived in fetchEvents — the backend
 * returns neither, but the table renders both.
 */
type EventRow = EventType & { timeStatus?: string };

export default function EventsPage() {
    const [activeTab, setActiveTab] = useState<'events' | 'announcements'>('events');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // --- Events State ---
    const [events, setEvents] = useState<EventRow[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<EventStatusFilter>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [eventsPage, setEventsPage] = useState(1);
    const [eventsPagination, setEventsPagination] = useState({ totalPages: 1, totalElements: 0, size: 10 });

    // --- Time Filter State ---
    const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('ALL');
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const timeDropdownRef = useRef<HTMLDivElement>(null);

    // --- Announcements State ---
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [announcementFilter, setAnnouncementFilter] = useState<'All' | 'Scheduled' | 'Drafts' | 'Sent'>('All');
    const [announcementSearchQuery, setAnnouncementSearchQuery] = useState('');
    const [announcementsPage, setAnnouncementsPage] = useState(1);
    const [announcementsPagination, setAnnouncementsPagination] = useState({ totalPages: 1, totalElements: 0, size: 10 });

    // --- Modal State ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
    const [viewEvent, setViewEvent] = useState<EventType | null>(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
    const [cancelTarget, setCancelTarget] = useState<EventType | null>(null);
    const [deleteEventTarget, setDeleteEventTarget] = useState<EventType | null>(null);
    const [publishEventTarget, setPublishEventTarget] = useState<EventType | null>(null);

    // --- Announcement Confirmation State ---
    const [deleteAnnouncementTarget, setDeleteAnnouncementTarget] = useState<Announcement | null>(null);
    const [publishDraftAnnouncementTarget, setPublishDraftAnnouncementTarget] = useState<Announcement | null>(null);
    const [pendingAnnouncementUpdate, setPendingAnnouncementUpdate] = useState<(() => Promise<void>) | null>(null);
    const [pendingAnnouncementSend, setPendingAnnouncementSend] = useState<(() => Promise<void>) | null>(null);

    // --- Click outside handler for time dropdowns ---
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
                setTimeDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- API Fetching: Events ---
    const fetchEvents = useCallback(async () => {
        setEventsLoading(true);
        try {
            // Determine status filter parameter based on UI activeFilter
            let statusParam: GetEventsParams['status'];
            let upcomingParam: boolean | undefined;
            let pastParam: boolean | undefined;

            if (activeFilter === 'Draft') statusParam = 'draft';
            if (activeFilter === 'Published') statusParam = 'published';
            if (activeFilter === 'Cancelled') statusParam = 'cancelled';
            if (activeFilter === 'Completed') statusParam = 'completed';

            // Apply time filter (overrides status-based upcoming/past if set)
            if (timeFilter === 'Upcoming') upcomingParam = true;
            if (timeFilter === 'Past') pastParam = true;

            const response = await getEvents({
                page: eventsPage - 1, // backend is 0-indexed
                size: 10,
                search: searchQuery || undefined,
                status: statusParam,
                upcoming: upcomingParam,
                past: pastParam,
            });

            // Process backend data for UI display
            const processedEvents = response.content.map(evt => {
                let timeStatus = 'Upcoming';
                if (evt.date) {
                    const eventDate = new Date(evt.date);
                    const now = new Date();
                    if (eventDate.toDateString() === now.toDateString()) {
                        timeStatus = 'Ongoing';
                    } else if (eventDate < now) {
                        timeStatus = 'Past';
                    }
                }
                return {
                    ...evt,
                    // Assign UI helper fields derived from backend ISO date representations
                    date: evt.date ? formatDate(evt.date) : '',
                    startTime: evt.date ? formatTime(evt.date) : '',
                    // If backend does not provide endTime yet natively, keep it blank or derived.
                    endTime: '',
                    timeStatus
                };
            });

            setEvents(processedEvents);
            setEventsPagination({
                totalPages: response.pagination.totalPages,
                totalElements: response.pagination.totalElements,
                size: response.pagination.size,
            });
        } catch (error) {
            console.warn('Failed to fetch events:', error);
            setEvents([]);
        } finally {
            setEventsLoading(false);
        }
    }, [eventsPage, searchQuery, activeFilter, timeFilter]);

    // --- API Fetching: Announcements ---
    const fetchAnnouncements = useCallback(async () => {
        setAnnouncementsLoading(true);
        try {
            let statusParam: GetAnnouncementsParams['status'];
            if (announcementFilter === 'Scheduled') statusParam = 'scheduled';
            if (announcementFilter === 'Drafts') statusParam = 'draft';
            if (announcementFilter === 'Sent') statusParam = 'sent';

            const response = await getAnnouncements({
                page: announcementsPage - 1, // backend is 0-indexed
                size: 10,
                search: announcementSearchQuery || undefined,
                status: statusParam,
            });

            const processedAnnouncements = response.content.map(ann => ({
                ...ann,
                // Map Backend DTO field "scheduledAt" to "date" and "time" for UI table
                date: ann.scheduledAt ? formatDate(ann.scheduledAt) : (ann.createdAt ? formatDate(ann.createdAt) : ''),
                time: ann.scheduledAt ? formatTime(ann.scheduledAt) : (ann.createdAt ? formatTime(ann.createdAt) : ''),
            }));

            setAnnouncements(processedAnnouncements);
            setAnnouncementsPagination({
                totalPages: response.pagination.totalPages,
                totalElements: response.pagination.totalElements,
                size: response.pagination.size,
            });
        } catch (error) {
            console.warn('Failed to fetch announcements:', error);
            setAnnouncements([]);
        } finally {
            setAnnouncementsLoading(false);
        }
    }, [announcementsPage, announcementSearchQuery, announcementFilter]);

    // --- Fetch Triggers ---
    useEffect(() => {
        if (activeTab === 'events') {
            // Debounce search
            const timer = setTimeout(() => {
                fetchEvents();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [fetchEvents, activeTab]);

    useEffect(() => {
        if (activeTab === 'announcements') {
            const timer = setTimeout(() => {
                fetchAnnouncements();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [fetchAnnouncements, activeTab]);


    // --- Handlers ---
    const handleAddEvent = () => {
        if (activeTab === 'announcements') {
            setEditingAnnouncement(null);
            setIsAddAnnouncementOpen(true);
        } else {
            setEditingEvent(null);
            setIsAddModalOpen(true);
        }
    };

    const handleEditEvent = (event: EventType) => {
        if (viewEvent) setViewEvent(null);
        setEditingEvent(event);
        setIsAddModalOpen(true);
    };

    const handleViewEvent = (event: EventType) => {
        setViewEvent(event);
    };

    const requestCancelEvent = (event: EventType) => {
        // Closing the details modal first keeps focus management clean.
        if (viewEvent) setViewEvent(null);
        setCancelTarget(event);
    };

    const handleConfirmCancelEvent = async () => {
        if (!cancelTarget?.id) return;
        try {
            await cancelEvent(cancelTarget.id);
            fetchEvents();
        } catch (err) {
            console.error("Failed to cancel event", err);
            alert("Failed to cancel the event.");
            throw err;
        }
    };

    const handleConfirmDeleteEvent = async () => {
        if (!deleteEventTarget?.id) return;
        try {
            await deleteEvent(deleteEventTarget.id);
            fetchEvents();
        } catch (err) {
            console.error("Failed to delete event", err);
            alert("Failed to delete the event.");
            throw err;
        }
    };

    const handleConfirmPublishEvent = async () => {
        if (!publishEventTarget?.id) return;
        try {
            await changeEventStatus(publishEventTarget.id, 'published');
            fetchEvents();
        } catch (err) {
            console.error("Failed to publish event", err);
            alert("Failed to publish the event.");
            throw err;
        }
    };

    const handleConfirmPublishDraftAnnouncement = async () => {
        if (!publishDraftAnnouncementTarget?.id) return;
        await changeAnnouncementStatus(publishDraftAnnouncementTarget.id, 'sent');
        fetchAnnouncements();
    };

    const handleViewAnnouncement = (announcement: Announcement) => {
        setViewingAnnouncement(announcement);
    };

    const handleEditAnnouncement = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setIsAddAnnouncementOpen(true);
    };

    // Stage delete — shows ConfirmModal instead of window.confirm
    const handleDeleteAnnouncement = (announcement: Announcement) => {
        setDeleteAnnouncementTarget(announcement);
    };

    // Executed by the delete ConfirmModal on confirm
    const handleConfirmDeleteAnnouncement = async () => {
        if (!deleteAnnouncementTarget?.id) return;
        await deleteAnnouncement(deleteAnnouncementTarget.id);
        fetchAnnouncements();
    };

    // Received from AddAnnouncementModal in edit mode — close editor, queue update
    const handleAnnouncementUpdateRequest = (performUpdate: () => Promise<void>) => {
        setIsAddAnnouncementOpen(false);
        setEditingAnnouncement(null);
        setPendingAnnouncementUpdate(() => performUpdate);
    };

    // Executed by the update ConfirmModal on confirm
    const handleConfirmAnnouncementUpdate = async () => {
        if (!pendingAnnouncementUpdate) return;
        await pendingAnnouncementUpdate();
        fetchAnnouncements();
    };

    // Received from AddAnnouncementModal on "Send Now" — close editor, queue send
    const handleAnnouncementSendRequest = (performSend: () => Promise<void>) => {
        setIsAddAnnouncementOpen(false);
        setEditingAnnouncement(null);
        setPendingAnnouncementSend(() => performSend);
    };

    // Executed by the send ConfirmModal on confirm
    const handleConfirmAnnouncementSend = async () => {
        if (!pendingAnnouncementSend) return;
        await pendingAnnouncementSend();
        fetchAnnouncements();
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setEditingEvent(null);
        // Refresh after create/edit
        fetchEvents();
    };

    const handleCloseAddAnnouncement = () => {
        setIsAddAnnouncementOpen(false);
        setEditingAnnouncement(null);
        fetchAnnouncements();
    }

    const handleCloseViewModal = () => {
        setViewEvent(null);
    };

    // --- Pagination Computations ---
    const eventsRangeStart = eventsPagination.totalElements === 0 ? 0 : (eventsPage - 1) * eventsPagination.size + 1;
    const eventsRangeEnd = Math.min(eventsPage * eventsPagination.size, eventsPagination.totalElements);

    const announcementsRangeStart = announcementsPagination.totalElements === 0 ? 0 : (announcementsPage - 1) * announcementsPagination.size + 1;
    const announcementsRangeEnd = Math.min(announcementsPage * announcementsPagination.size, announcementsPagination.totalElements);

    const displayEvents = events.filter(event => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
            event.title?.toLowerCase().includes(q) ||
            event.speaker?.toLowerCase().includes(q) ||
            event.venue?.toLowerCase().includes(q)
        );
    });

    const displayAnnouncements = announcements.filter(ann => {
        if (!announcementSearchQuery.trim()) return true;
        const q = announcementSearchQuery.trim().toLowerCase();
        return (
            ann.title?.toLowerCase().includes(q) ||
            (ann.message || ann.description || '').toLowerCase().includes(q)
        );
    });

    const showEmptyState = displayEvents.length === 0 && !eventsLoading;

    return (
        <div className="space-y-[24px]">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[24px] font-inter font-semibold text-[var(--grey-800)] leading-normal">
                        Event & Announcements
                    </h1>
                </div>
                <button
                    onClick={handleAddEvent}
                    className="flex items-center gap-[10px] bg-[var(--brand)] text-white px-[24px] py-[16px] rounded-[12px] hover:bg-[#065d29] transition-all duration-200 h-[44px] shadow-sm hover:shadow-md active:scale-95"
                >
                    <PlusIcon size={20} className="stroke-[2]" />
                    <span className="font-inter font-medium text-[16px] leading-normal">
                        {activeTab === 'announcements' ? 'New Announcements' : 'New Event'}
                    </span>
                </button>
            </div>

            {/* Tabs */}
            <ContentSwitcher
                tabs={[
                    { id: 'events', label: 'Events' },
                    { id: 'announcements', label: 'Announcements' }
                ]}
                activeTab={activeTab}
                onChange={(tabId) => setActiveTab(tabId as 'events' | 'announcements')}
            />


            {/* Content Area */}
            {activeTab === 'events' ? (
                <>
                    {viewMode === 'list' ? (
                        <div className="border border-[var(--border-01)] rounded-[24px] p-[24px] bg-white">
                            {/* Controls */}
                            <div className="flex justify-between items-center mb-[24px] h-[40px]">
                                <div className="flex items-center">
                                    {EVENT_STATUS_FILTERS.map((filter, index, arr) => (
                                        <button
                                            key={filter}
                                            onClick={() => { setActiveFilter(filter); setEventsPage(1); }}
                                            className={`
                                        h-[40px] px-[16px] py-[10px] font-inter text-[14px] 
                                        border border-[var(--border-01)]
                                        transition-all duration-200 flex items-center justify-center gap-[8px]
                                        ${activeFilter === filter ? 'font-bold text-white bg-[var(--brand)] z-10 hover:bg-[#065d29]' : 'font-normal text-[var(--grey-800)] bg-white hover:bg-[rgba(7,119,52,0.05)] hover:text-[var(--brand)]'}
                                        ${index === 0 ? 'rounded-l-[8px]' : ''}
                                        ${index === arr.length - 1 ? 'rounded-r-[8px]' : ''}
                                        ${index !== 0 ? '-ml-[1px]' : ''}
                                    `}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-[7px]">
                                    {/* Time Filter Dropdown */}
                                    <div className="relative" ref={timeDropdownRef}>
                                        <button
                                            id="events-time-filter-trigger"
                                            onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                                            className={`flex items-center gap-[8px] bg-white border border-solid px-[12px] py-[8px] rounded-[12px] h-[42px] cursor-pointer transition-all duration-200 hover:shadow-sm ${timeFilter !== 'ALL'
                                                    ? 'border-[rgba(7,119,52,0.5)]'
                                                    : 'border-[rgba(7,119,52,0.1)]'
                                                }`}
                                        >
                                            <span className="font-inter font-medium text-[12px] leading-[18px] text-[#666d80] whitespace-nowrap">
                                                Time: {timeFilter === 'ALL' ? 'ALL' : timeFilter.toLowerCase()}
                                            </span>
                                            <svg
                                                width="18" height="18" viewBox="0 0 18 18" fill="none"
                                                className={`transition-transform duration-200 ${timeDropdownOpen ? 'rotate-180' : ''}`}
                                            >
                                                <path d="M14.94 6.71252L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71252" stroke="#666d80" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        {/* Dropdown Menu */}
                                        {timeDropdownOpen && (
                                            <div
                                                id="events-time-filter-dropdown"
                                                className="absolute top-[calc(100%+4px)] left-0 z-50 bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden shadow-md min-w-[160px] animate-in fade-in duration-150"
                                            >
                                                {EVENT_TIME_OPTIONS.map((option, index) => (
                                                    <button
                                                        key={option}
                                                        id={`events-time-option-${option.toLowerCase()}`}
                                                        onClick={() => {
                                                            setTimeFilter(option);
                                                            setTimeDropdownOpen(false);
                                                            setEventsPage(1);
                                                        }}
                                                        className={`w-full text-left px-[12px] py-[8px] font-inter font-normal text-[12px] transition-colors duration-150 ${timeFilter === option
                                                                ? 'bg-[#077734] text-white'
                                                                : 'text-[#666d80] hover:bg-[rgba(7,119,52,0.05)]'
                                                            } ${index === EVENT_TIME_OPTIONS.length - 1 ? 'rounded-b-[12px]' : ''
                                                            } ${index === 0 ? 'rounded-t-[12px]' : ''
                                                            }`}
                                                    >
                                                        Time: {option}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative w-[342px] h-[40px]">
                                        <input
                                            type="text"
                                            placeholder="Search Events"
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setEventsPage(1); }}
                                            className="w-full h-full pl-[38px] pr-[14px] border border-[var(--border-01)] rounded-[11px] font-inter text-[12px] text-[#666d80] placeholder-[#666d80] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
                                        />
                                        <div className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[var(--grey-100)]">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--white\/white-900,white)] border border-[var(--white\/border,#e2e8f0)] rounded-[12px] flex items-center gap-[8px] px-[8px] py-[6px]">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`flex items-center justify-center px-[12px] py-[6px] rounded-[8px] transition-colors ${viewMode === 'list' ? 'bg-[rgba(7,119,52,0.1)]' : 'hover:bg-gray-50'}`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6.75 2.25H2.25V6.75H6.75V2.25Z" stroke={viewMode === 'list' ? "#077734" : "#666d80"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M15.75 2.25H11.25V6.75H15.75V2.25Z" stroke={viewMode === 'list' ? "#077734" : "#666d80"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M15.75 11.25H11.25V15.75H15.75V11.25Z" stroke={viewMode === 'list' ? "#077734" : "#666d80"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M6.75 11.25H2.25V15.75H6.75V11.25Z" stroke={viewMode === 'list' ? "#077734" : "#666d80"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('calendar')}
                                            className={`flex items-center justify-center px-[12px] py-[6px] rounded-[8px] transition-colors ${(viewMode as string) === 'calendar' ? 'bg-[rgba(7,119,52,0.1)]' : 'hover:bg-gray-50'}`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 1.5V3.75" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 1.5V3.75" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M2.625 6.81738H15.375" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M15.75 6.375V12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375Z" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M11.7709 10.2748H11.7776" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M11.7709 12.5248H11.7776" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M8.99645 10.2748H9.00318" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M8.99645 12.5248H9.00318" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M6.22011 10.2748H6.22684" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M6.22011 12.5248H6.22684" stroke={(viewMode as string) === 'calendar' ? "#077734" : "#666d80"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="w-full overflow-hidden">
                                {showEmptyState ? (
                                    <div className="bg-[var(--white\/table-white,#fafbfb)] border border-[var(--white\/border,#e2e8f0)] border-dashed flex flex-col gap-[16px] items-center px-[24px] py-[80px] rounded-[24px] w-full mb-[24px]">
                                        <div className="bg-white border border-[#e2e8f0] flex items-center justify-center p-[8px] rounded-[99px] size-[48px]">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666d80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="9" y1="15" x2="15" y2="15"></line><line x1="12" y1="12" x2="12" y2="18"></line></svg>
                                        </div>
                                        <div className="flex flex-col gap-[8px] items-center text-center">
                                            <h3 className="font-['Inter'] font-bold text-[20px] text-[#36394a]">
                                                No {timeFilter !== 'ALL' ? timeFilter.toLowerCase() + ' ' : ''}{activeFilter !== 'All' ? activeFilter.toLowerCase() + ' ' : ''}events found
                                            </h3>
                                            <p className="font-['Inter'] font-medium text-[16px] text-[#666d80] max-w-[374px]">
                                                Try adjusting your filters or create a new event to get started.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#fafbfb] border-b border-t border-[var(--border-01)] h-[48px]">
                                            <tr>
                                                <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Title</th>
                                                <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Date & Time</th>
                                                <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Status</th>
                                                <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-none bg-white">
                                            {displayEvents.map((event) => (
                                                <tr key={event.id} className="group hover:bg-[#fafbfb] transition-colors duration-150 border-b border-[#e2e8f0] last:border-0">
                                                    <td className="h-[70px] px-[16px] py-[14px] font-['Inter'] font-medium text-[14px] text-[#666d80]">
                                                        {event.title}
                                                    </td>
                                                    <td className="h-[70px] px-[16px] py-[14px]">
                                                        <div className="flex flex-col gap-[4px]">
                                                            <span className="font-['Inter'] font-medium text-[14px] text-[#666d80]">
                                                                {event.date} | {event.startTime}
                                                            </span>
                                                            <span className={`font-['Inter'] font-normal text-[12px] ${event.timeStatus === 'Upcoming' ? 'text-[#47b881]' :
                                                                    event.timeStatus === 'Past' ? 'text-[#9ca3af]' : 'text-[#ffad0d]'
                                                                }`}>
                                                                {event.timeStatus}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="h-[70px] px-[16px] py-[14px]">
                                                        <span className={`
                                                inline-flex items-center px-[8px] py-[4px] rounded-[8px] text-[12px] font-normal capitalize border bg-white
                                                ${event.status?.toLowerCase() === 'published' ? 'text-[#47b881] border-[#6bc497]' : ''}
                                                ${event.status?.toLowerCase() === 'cancelled' ? 'text-[#f64c4c] border-[#eb6f70]' : ''}
                                                ${event.status?.toLowerCase() === 'draft' ? 'text-[#ffad0d] border-[#ffc62b]' : ''}
                                                ${event.status?.toLowerCase() === 'completed' ? 'text-[#47b881] border-[#6bc497]' : ''}
                                            `}
                                                            style={{ fontFamily: "'Inter', sans-serif" }}
                                                        >
                                                            {event.status?.toLowerCase() === 'draft' ? 'Drafts' : event.status}
                                                        </span>
                                                    </td>
                                                    <td className="h-[70px] px-[16px] py-[14px]">
                                                        {event.status?.toLowerCase() === 'draft' ? (
                                                            <DraftRowActions
                                                                onPublish={() => setPublishEventTarget(event)}
                                                                onEdit={() => handleEditEvent(event)}
                                                                onDelete={() => setDeleteEventTarget(event)}
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-[12px]">
                                                                <button
                                                                    onClick={() => handleViewEvent(event)}
                                                                    className="text-[#667085] hover:text-[var(--brand)] transition-colors"
                                                                    title="View Event"
                                                                >
                                                                    <Eye size={20} strokeWidth={1.5} />
                                                                </button>
                                                                {event.status?.toLowerCase() === 'cancelled' ? (
                                                                    <button
                                                                        onClick={() => setDeleteEventTarget(event)}
                                                                        className="text-[#eb6f70] hover:opacity-80 transition-opacity"
                                                                        title="Delete Event"
                                                                    >
                                                                        <TrashIcon size={20} />
                                                                    </button>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleEditEvent(event)}
                                                                            className="text-[#667085] hover:text-[var(--brand)] transition-colors"
                                                                            title="Edit Event"
                                                                        >
                                                                            <Edit size={20} strokeWidth={1.5} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => requestCancelEvent(event)}
                                                                            className="text-[#eb6f70] hover:opacity-80 transition-opacity"
                                                                            title="Cancel Event"
                                                                        >
                                                                            <Ban size={20} strokeWidth={1.5} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* Pagination Footer */}
                                <div className="flex items-center justify-between h-[40px] px-0 mt-0 border-t border-[var(--border-01)] bg-white relative w-full">
                                    <p className="absolute left-0 top-[10px] font-inter text-[14px] text-[#666d80]">
                                        {`${eventsRangeStart}-${eventsRangeEnd} of ${eventsPagination.totalElements} items`}
                                    </p>
                                    <div className="absolute right-[64px] top-[8px] flex items-center gap-[8px]">
                                        <div className="bg-white h-[23px] px-[11px] rounded-[8px] flex items-center justify-center gap-[8px] cursor-pointer">
                                            <span className="font-inter text-[14px] text-[#666d80]">{eventsPage}</span>
                                            <ChevronDownIcon size={16} className="text-[#666d80]" />
                                        </div>
                                        <span className="font-inter text-[14px] text-[#666d80]">of {eventsPagination.totalPages} pages</span>
                                    </div>
                                    <div className="absolute right-0 top-1/2 -translate-y-[calc(50%-0.5px)] flex items-center gap-[8px]">
                                        <button
                                            onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                                            disabled={eventsPage <= 1}
                                            className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                        >
                                            <ChevronLeftIcon size={16} className="text-[#666d80] stroke-[1.5]" />
                                        </button>
                                        <button
                                            onClick={() => setEventsPage(p => Math.min(eventsPagination.totalPages, p + 1))}
                                            disabled={eventsPage >= eventsPagination.totalPages}
                                            className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                        >
                                            <ChevronRightIcon size={16} className="text-[#666d80] stroke-[1.5]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <CalendarView
                            events={events}
                            currentDate={new Date()}
                            onDateChange={() => { }}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            onEventClick={handleViewEvent}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />
                    )}
                </>
            ) : (
                <div className="border border-[var(--border-01)] rounded-[24px] p-[24px] bg-white">
                    {/* Controls */}
                    <div className="flex justify-between items-center mb-[16px] h-[40px]">
                        <div className="flex items-center">
                            {(['All', 'Sent', 'Scheduled', 'Drafts'] as const).map((filter, index, arr) => (
                                <button
                                    key={filter}
                                    onClick={() => { setAnnouncementFilter(filter); setAnnouncementsPage(1); }}
                                    className={`
                                        h-[40px] px-[16px] py-[10px] font-inter text-[14px]
                                        border border-[var(--border-01)]
                                        transition-all duration-200 flex items-center justify-center gap-[8px]
                                        ${announcementFilter === filter ? 'font-bold text-white bg-[var(--brand)] z-10 hover:bg-[#065d29]' : 'font-normal text-[var(--grey-800)] bg-white hover:bg-[rgba(7,119,52,0.05)] hover:text-[var(--brand)]'}
                                        ${index === 0 ? 'rounded-l-[8px]' : ''}
                                        ${index === arr.length - 1 ? 'rounded-r-[8px]' : ''}
                                        ${index !== 0 ? '-ml-[1px]' : ''}
                                    `}
                                >
                                    {filter === 'All' && announcementFilter === 'All' && (
                                        <div className="w-[10px] h-[10px] rounded-full"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="white" stroke="white" strokeWidth="1" /></svg></div>
                                    )}
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-[7px]">
                            <div className="relative w-[342px] h-[40px]">
                                <input
                                    type="text"
                                    placeholder="Search announcements"
                                    value={announcementSearchQuery}
                                    onChange={(e) => { setAnnouncementSearchQuery(e.target.value); setAnnouncementsPage(1); }}
                                    className="w-full h-full pl-[38px] pr-[14px] border border-[var(--border-01)] rounded-[11px] font-inter text-[12px] text-[#666d80] placeholder-[#666d80] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
                                />
                                <div className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[var(--grey-100)]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="w-full overflow-hidden">
                        {displayAnnouncements.length === 0 && !announcementsLoading ? (
                            <div className="bg-[var(--white\/table-white,#fafbfb)] border border-[var(--white\/border,#e2e8f0)] border-dashed flex flex-col gap-[16px] items-center px-[24px] py-[80px] rounded-[24px] w-full mb-[24px]">
                                <div className="bg-white border border-[#e2e8f0] flex items-center justify-center p-[8px] rounded-[99px] size-[48px]">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666d80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                </div>
                                <div className="flex flex-col gap-[8px] items-center text-center">
                                    <h3 className="font-['Inter'] font-bold text-[20px] text-[#36394a]">
                                        No {announcementFilter !== 'All' ? announcementFilter.toLowerCase() + ' ' : ''}announcements found
                                    </h3>
                                    <p className="font-['Inter'] font-medium text-[16px] text-[#666d80] max-w-[374px]">
                                        Try adjusting your filters or create a new announcement to get started.
                                    </p>
                                </div>
                            </div>
                        ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#fafbfb] border-b border-t border-[var(--border-01)] h-[48px]">
                                <tr>
                                    <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Title</th>
                                    <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Message</th>
                                    <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Date Sent</th>
                                    <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Status</th>
                                    <th className="px-[16px] py-[14px] font-inter font-medium text-[12px] text-[#666d80] uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-none bg-white">
                                {displayAnnouncements.map((announcement) => (
                                    <tr key={announcement.id} className="group hover:bg-[#fafbfb] transition-colors duration-150">
                                        <td className="h-[70px] px-[16px] py-[22px] font-inter font-medium text-[14px] text-[#666d80]">
                                            {announcement.title}
                                        </td>
                                        <td className="h-[70px] px-[16px] py-[22px] font-inter font-medium text-[14px] text-[#666d80] truncate max-w-[200px]" title={announcement.message || announcement.description}>
                                            {announcement.message || announcement.description}
                                        </td>
                                        <td className="h-[70px] px-[16px] py-[22px] font-inter font-medium text-[14px] text-[#666d80] whitespace-nowrap">
                                            {announcement.date}  {announcement.time}
                                        </td>
                                        <td className="h-[70px] px-[16px] py-[22px]">
                                            <span
                                                className={`inline-flex items-center px-[8px] py-[4px] rounded-[8px] text-[12px] capitalize border bg-white
                                                    ${announcement.status === 'scheduled' ? 'text-[#ff8156] border-[#ffa487]' : ''}
                                                    ${announcement.status === 'draft' ? 'text-[#ffad0d] border-[#ffc62b]' : ''}
                                                    ${announcement.status === 'sent' ? 'text-[#47b881] border-[#6bc497]' : ''}
                                                `}
                                                style={{ fontFamily: '"Inter", sans-serif' }}
                                            >
                                                {announcement.status === 'scheduled' ? 'Scheduled' : announcement.status === 'draft' ? 'Draft' : 'Sent'}
                                            </span>
                                        </td>
                                        <td className="h-[70px] px-[16px] py-[22px]">
                                            {announcement.status === 'draft' ? (
                                                <DraftRowActions
                                                    onPublish={() => setPublishDraftAnnouncementTarget(announcement)}
                                                    onEdit={() => handleEditAnnouncement(announcement)}
                                                    onDelete={() => handleDeleteAnnouncement(announcement)}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-[12px]">
                                                    {announcement.status === 'sent' && (
                                                        <button
                                                            onClick={() => handleViewAnnouncement(announcement)}
                                                            className="text-[#667085] hover:text-[var(--brand)] transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye size={20} strokeWidth={1.5} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditAnnouncement(announcement)}
                                                        className="text-[#667085] hover:text-[var(--brand)] transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={20} strokeWidth={1.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAnnouncement(announcement)}
                                                        className="text-[#eb6f70] hover:opacity-80 transition-opacity"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex justify-between items-center mt-[8px] h-[40px] border-t border-[var(--border-01)] pt-[8px]">
                        <span className="font-['DM_Sans'] font-normal text-[14px] text-[#666d80]">
                            {announcementsRangeStart}-{announcementsRangeEnd} of {announcementsPagination.totalElements} items
                        </span>
                        <div className="flex items-center gap-[8px]">
                            <div className="flex items-center gap-[8px]">
                                <div className="flex items-center gap-[8px] bg-white rounded-[8px] px-[11px] h-[23px]">
                                    <span className="font-['DM_Sans'] font-normal text-[14px] text-[#666d80]">{announcementsPage}</span>
                                    <ChevronDownIcon size={16} className="text-[#666d80]" />
                                </div>
                                <span className="font-['DM_Sans'] font-normal text-[14px] text-[#666d80]">of {announcementsPagination.totalPages} pages</span>
                            </div>
                            <div className="flex items-center gap-[8px]">
                                <button
                                    onClick={() => setAnnouncementsPage(p => Math.max(1, p - 1))}
                                    disabled={announcementsPage <= 1}
                                    className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                >
                                    <ChevronLeftIcon size={16} className="text-[#666d80] stroke-[1.5]" />
                                </button>
                                <button
                                    onClick={() => setAnnouncementsPage(p => Math.min(announcementsPagination.totalPages, p + 1))}
                                    disabled={announcementsPage >= announcementsPagination.totalPages}
                                    className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                >
                                    <ChevronRightIcon size={16} className="text-[#666d80] stroke-[1.5]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddEventModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                event={editingEvent}
                onDeleteRequest={() => {
                    if (editingEvent) {
                        setIsAddModalOpen(false);
                        setEditingEvent(null);
                        setDeleteEventTarget(editingEvent);
                    }
                }}
            />
            <EventDetailsModal
                isOpen={!!viewEvent}
                onClose={handleCloseViewModal}
                event={viewEvent}
                onEdit={handleEditEvent}
                onCancelRequest={requestCancelEvent}
            />
            <AddAnnouncementModal
                isOpen={isAddAnnouncementOpen}
                onClose={handleCloseAddAnnouncement}
                announcement={editingAnnouncement}
                onUpdateRequest={handleAnnouncementUpdateRequest}
                onSendRequest={handleAnnouncementSendRequest}
                onDeleteRequest={() => {
                    if (editingAnnouncement) {
                        setIsAddAnnouncementOpen(false);
                        setEditingAnnouncement(null);
                        setDeleteAnnouncementTarget(editingAnnouncement);
                    }
                }}
            />
            <AnnouncementViewModal
                isOpen={!!viewingAnnouncement}
                onClose={() => setViewingAnnouncement(null)}
                announcement={viewingAnnouncement}
            />
            <ConfirmModal
                isOpen={!!cancelTarget}
                eventType={statusToConfirmType(cancelTarget?.status)}
                onClose={() => setCancelTarget(null)}
                onConfirm={handleConfirmCancelEvent}
            />
            {/* Delete event confirmation modal — dynamic based on status (Figma) */}
            {(() => {
                const getEventDeleteDetails = (event: EventType | null) => {
                    if (!event) return { title: 'Delete Event?', description: '', confirmLabel: 'Delete Event' };

                    if (event.status === 'cancelled') {
                        return {
                            title: 'Delete Cancelled Event?',
                            description: 'This event has already been cancelled. If deleted, it will be permanently removed from both the Admin Dashboard and the Community App.',
                            confirmLabel: 'Delete Event',
                        };
                    }

                    if (event.status === 'draft') {
                        return {
                            title: 'Delete Draft Event?',
                            description: 'This event is currently saved as a draft and is not visible to community members. If you delete this draft, it will be permanently removed from the system.',
                            confirmLabel: 'Delete Permanently',
                        };
                    }

                    const now = new Date();
                    const eventDate = new Date(event.date);
                    const isPast = event.status === 'completed' || eventDate < now;

                    if (isPast) {
                        return {
                            title: 'Delete Past Event?',
                            description: 'This event has already been completed. Deleting it will permanently remove the event record from the Admin Dashboard and the Community App, including any associated attendance or event information.',
                            confirmLabel: 'Delete Permanently',
                        };
                    }

                    // Upcoming / published
                    return {
                        title: 'Delete Upcoming Event?',
                        description: 'This event is already published and visible in the Community App. Deleting this event will remove it for all community members and they will no longer be able to view or attend it.',
                        confirmLabel: 'Delete Event',
                    };
                };

                const details = getEventDeleteDetails(deleteEventTarget);

                return (
                    <ConfirmModal
                        isOpen={!!deleteEventTarget}
                        eventType="cancelled"
                        onClose={() => setDeleteEventTarget(null)}
                        onConfirm={handleConfirmDeleteEvent}
                        title={details.title}
                        description={details.description}
                        confirmLabel={details.confirmLabel}
                        submittingLabel="Deleting..."
                    />
                );
            })()}
            {/* Publish draft event confirmation */}
            <ConfirmModal
                isOpen={!!publishEventTarget}
                eventType="draft"
                onClose={() => setPublishEventTarget(null)}
                onConfirm={handleConfirmPublishEvent}
                title="Publish Event?"
                description="This event will be published and visible to all members in the Community App."
                confirmLabel="Publish"
                submittingLabel="Publishing..."
                confirmVariant="primary"
                iconNode={<Send size={24} className="text-white" strokeWidth={1.5} />}
                iconContainerClassName="bg-[rgba(7,119,52,0.7)] border-[rgba(7,119,52,0.2)]"
            />
            {/* Publish draft announcement confirmation */}
            <ConfirmModal
                isOpen={!!publishDraftAnnouncementTarget}
                eventType="draft"
                onClose={() => setPublishDraftAnnouncementTarget(null)}
                onConfirm={handleConfirmPublishDraftAnnouncement}
                title="Send Announcement?"
                description="This announcement will be sent immediately to all members in the Community App."
                confirmLabel="Send Now"
                submittingLabel="Sending..."
                confirmVariant="primary"
                iconNode={<Send size={24} className="text-white" strokeWidth={1.5} />}
                iconContainerClassName="bg-[rgba(7,119,52,0.7)] border-[rgba(7,119,52,0.2)]"
            />
            {/* Delete announcement confirmation */}
            <ConfirmModal
                isOpen={!!deleteAnnouncementTarget}
                eventType="upcoming"
                onClose={() => setDeleteAnnouncementTarget(null)}
                onConfirm={handleConfirmDeleteAnnouncement}
                title={
                    deleteAnnouncementTarget?.status === 'sent'
                        ? 'Delete Sent Announcement?'
                        : deleteAnnouncementTarget?.status === 'scheduled'
                        ? 'Delete Scheduled Announcement?'
                        : 'Delete Draft?'
                }
                description={
                    deleteAnnouncementTarget?.status === 'sent'
                        ? 'This announcement has already been delivered to members. Deleting it will only remove it from the admin panel.'
                        : deleteAnnouncementTarget?.status === 'scheduled'
                        ? 'This announcement is scheduled to be sent. Deleting it will cancel delivery and permanently remove it.'
                        : 'This draft has not been sent yet. It will be permanently deleted.'
                }
                confirmLabel="Delete"
                submittingLabel="Deleting..."
            />
            {/* Update announcement confirmation */}
            <ConfirmModal
                isOpen={!!pendingAnnouncementUpdate}
                eventType="upcoming"
                onClose={() => setPendingAnnouncementUpdate(null)}
                onConfirm={handleConfirmAnnouncementUpdate}
                title="Update Announcement?"
                description="Your changes will be saved and applied immediately."
                confirmLabel="Update"
                submittingLabel="Updating..."
                confirmVariant="primary"
                iconNode={<Edit size={24} className="text-white" strokeWidth={1.5} />}
                iconContainerClassName="bg-[rgba(7,119,52,0.7)] border-[rgba(7,119,52,0.2)]"
            />
            {/* Send announcement confirmation */}
            <ConfirmModal
                isOpen={!!pendingAnnouncementSend}
                eventType="upcoming"
                onClose={() => setPendingAnnouncementSend(null)}
                onConfirm={handleConfirmAnnouncementSend}
                title="Send Announcement?"
                description="This announcement will be sent immediately to all members in the Community App."
                confirmLabel="Send Now"
                submittingLabel="Sending..."
                confirmVariant="primary"
                iconNode={<Send size={24} className="text-white" strokeWidth={1.5} />}
                iconContainerClassName="bg-[rgba(7,119,52,0.7)] border-[rgba(7,119,52,0.2)]"
            />
        </div>
    );
}
