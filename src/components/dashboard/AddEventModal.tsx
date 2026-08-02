import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { UploadIcon } from '@/components/ui/Icons';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import TimePicker from '@/components/ui/TimePicker';
import type { Event } from '@/types';
import { createEvent, updateEvent } from '@/lib/api/events';
import { messageOf, withRequestRef } from '@/lib/api/errors';

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event?: Event | null; // If provided, we are in Edit mode
    onDeleteRequest?: () => void;
}

/* ── Helper: parse "10:30 AM" → "10:30" (24h) ── */
function parseTime12to24(t: string): string {
    if (!t) return '';
    const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '';
    let h = parseInt(match[1], 10);
    const m = match[2];
    const p = match[3].toUpperCase();
    if (p === 'PM' && h < 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
}

/* ── Helper: get today's date in YYYY-MM-DD local time ── */
function getLocalTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function AddEventModal({ isOpen, onClose, event, onDeleteRequest }: AddEventModalProps) {
    const isEditMode = !!event;

    // Form State
    const [title, setTitle] = useState('');
    const [speaker, setSpeaker] = useState('');
    const [venue, setVenue] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState(''); // YYYY-MM-DD
    const [startTime, setStartTime] = useState(''); // HH:MM
    const [endTime, setEndTime] = useState('');     // HH:MM
    const [link, setLink] = useState('');

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageName, setImageName] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset or Populate form when modal opens/event changes
    useEffect(() => {
        if (isOpen) {
            setError(null);
            if (event) {
                setTitle(event.title || '');
                setSpeaker(event.speaker || '');
                setVenue(event.venue || event.location || 'Masjid Abu Bakar');
                setDescription(event.description || '');
                // Parse date: ISO String → "YYYY-MM-DD"
                try {
                    const d = new Date(event.date || event.createdAt || Date.now());
                    if (!isNaN(d.getTime())) {
                        setEventDate(d.toISOString().split('T')[0]);
                    } else {
                        setEventDate('');
                    }
                } catch {
                    setEventDate('');
                }
                setStartTime(parseTime12to24(event.startTime || ''));
                setEndTime(parseTime12to24(event.endTime || '')); // currently unused by backend
                setLink(event.link || '');

                setImageFile(null);
                setImageName(event.images && event.images.length > 0 ? 'Existing Image Attached' : '');
            } else {
                setTitle('');
                setSpeaker('');
                setVenue('');
                setDescription('');
                setEventDate(getLocalTodayDateString());
                setStartTime('');
                setEndTime('');
                setLink('');
                setImageFile(null);
                setImageName('');
            }
        }
    }, [isOpen, event]);

    const handleSave = async (asDraft?: boolean) => {
        if (!title || !eventDate || !description || !speaker || !venue) {
            setError("Title, Speaker, Venue, Date, and Description are required fields.");
            return;
        }

        const todayStr = getLocalTodayDateString();
        if (eventDate < todayStr) {
            setError("Event date cannot be in the past.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Combine Date and Time into an ISO String payload
            // Default time to 00:00:00 if no start time is selected
            const timePart = startTime ? `${startTime}:00` : '00:00:00';
            const isoDateTime = `${eventDate}T${timePart}`;

            const formData = new FormData();

            // Required DTO fields
            formData.append('title', title);
            formData.append('date', isoDateTime);
            formData.append('description', description);

            // The backend expects specific string enums (matching UI or backend statuses)
            // Default "Publish" = 'published' vs "Draft" = 'draft'
            formData.append('status', asDraft ? 'draft' : 'published');

            // Optional DTO fields
            if (speaker) formData.append('speaker', speaker);
            if (venue) formData.append('venue', venue);
            if (link) formData.append('link', link);

            // Append Image
            if (imageFile) {
                formData.append('images', imageFile);
            }

            if (isEditMode && event?.id) {
                await updateEvent(event.id, formData);
            } else {
                await createEvent(formData);
            }
            onClose(); // Parent will refresh data on close
        } catch (err) {
            setError(withRequestRef(messageOf(err, 'An error occurred while saving the event.'), err));
            console.error('Failed to save event:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] p-0">
            <div className="bg-white border border-[var(--border-01)] rounded-[24px] p-[24px] flex flex-col gap-[24px]">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <h2 className="font-inter font-bold text-[24px] text-[var(--grey-800)] leading-normal">
                        {isEditMode ? 'Update Event Information' : 'Add New Event'}
                    </h2>
                    <ModalCloseButton onClick={onClose} disabled={isSaving} />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-[12px] text-sm">
                        {error}
                    </div>
                )}

                {/* Event Title */}
                <div className="flex flex-col gap-[8px]">
                    <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                        Event Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Event Title"
                        className="form-field h-[48px]"
                    />
                </div>

                {/* Speaker & Venue Row */}
                <div className="flex gap-[24px]">
                    {/* Speaker */}
                    <div className="flex-1 flex flex-col gap-[8px]">
                        <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                            Speaker
                        </label>
                        <input
                            type="text"
                            value={speaker}
                            onChange={(e) => setSpeaker(e.target.value)}
                            placeholder="Speaker"
                            className="form-field h-[48px]"
                        />
                    </div>
                    {/* Venue */}
                    <div className="flex-1 flex flex-col gap-[8px]">
                        <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                            Venue
                        </label>
                        <input
                            type="text"
                            value={venue}
                            onChange={(e) => setVenue(e.target.value)}
                            placeholder="Venue"
                            className="form-field h-[48px]"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-[8px]">
                    <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                        className="form-field h-[144px] resize-none"
                    />
                </div>

                {/* Date & Time */}
                <div className="flex gap-[24px]">
                    {/* Date */}
                    <div className="flex-1 flex flex-col gap-[8px]">
                        <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                            Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                min={getLocalTodayDateString()}
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="form-field h-[48px] appearance-none"
                                style={{ colorScheme: 'light' }}
                            />
                        </div>
                    </div>
                    {/* Start Time */}
                    <div className="flex-1 flex flex-col gap-[8px]">
                        <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                            Start Time
                        </label>
                        <TimePicker
                            value={startTime}
                            onChange={setStartTime}
                            placeholder="00:00"
                        />
                    </div>
                    {/* End Time */}
                    <div className="flex-1 flex flex-col gap-[8px]">
                        <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                            End Time
                        </label>
                        <TimePicker
                            value={endTime}
                            onChange={setEndTime}
                            placeholder="00:00"
                        />
                    </div>
                </div>

                {/* Registration Link & Upload Image Row */}
                <div className="flex gap-[24px]">
                    {/* Registration Link */}
                    <div className="flex-1 flex flex-col gap-[8px]">
                        <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                            Registration Link <span className="font-inter font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="Registration Link (Optional)"
                            className="form-field h-[48px]"
                        />
                    </div>
                    {/* Upload Image */}
                    <div className="flex-1 flex flex-col gap-[8px]">
                        <label className="font-inter font-semibold text-[14px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                            Upload Image <span className="font-inter font-normal">(Optional)</span>
                        </label>
                        {imageName ? (
                            <div className="flex items-center w-full h-[44px] px-[12px] border border-[var(--border-01)] rounded-[12px] bg-white overflow-hidden">
                                <span className="font-inter font-normal text-[14px] text-[var(--grey-800)] truncate">
                                    {imageName}
                                </span>
                                <button
                                    onClick={() => setImageName('')}
                                    className="ml-[6px] text-[#666d80] hover:text-[var(--grey-800)] transition-colors text-[14px] leading-none shrink-0"
                                    type="button"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-between w-full h-[44px] px-[12px] border border-[var(--border-01)] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-colors">
                                <span className="font-inter font-normal text-[14px] text-[#666d80]">
                                    Image Upload
                                </span>
                                <UploadIcon className="text-[var(--grey-800)]" size={20} />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setImageFile(e.target.files[0]);
                                            setImageName(e.target.files[0].name);
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center w-full">
                    {isEditMode && event?.status?.toLowerCase() === 'draft' && (
                        <button
                            type="button"
                            onClick={() => onDeleteRequest?.()}
                            disabled={isSaving}
                            className="h-[44px] px-[24px] flex items-center justify-center border border-[#ec2d30] rounded-[12px] font-inter font-medium text-[16px] text-[#ec2d30] hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            Delete
                        </button>
                    )}
                    <div className="flex items-center gap-[12px] ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="h-[44px] px-[24px] flex items-center justify-center border border-[var(--border-01)] rounded-[12px] font-inter font-medium text-[16px] text-[var(--grey-800)] hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSave(true)}
                            className="h-[44px] px-[24px] flex items-center justify-center bg-[var(--brand)] rounded-[12px] font-inter font-medium text-[16px] text-white hover:bg-[#065d29] transition-colors disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
