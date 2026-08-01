'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import TimePicker from '@/components/ui/TimePicker';
import type { Announcement } from '@/types';
import {
    createAnnouncement,
    updateAnnouncement,
    changeAnnouncementStatus,
    type CreateAnnouncementData,
} from '@/lib/api/announcements';
import { messageOf, withRequestRef } from '@/lib/api/errors';

interface AddAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    announcement?: Announcement | null;
    /**
     * If provided, called in edit-mode instead of saving directly.
     * The parent receives a pre-built async closure and is responsible
     * for showing a confirmation dialog before executing it.
     */
    onUpdateRequest?: (performUpdate: () => Promise<void>) => void;
    /**
     * If provided, called when the user clicks "Send Now" in create-mode,
     * or when editing a draft and promoting it to sent.
     * The parent receives a pre-built async closure and shows a confirmation
     * dialog before executing it.
     */
    onSendRequest?: (performSend: () => Promise<void>) => void;
    /**
     * If provided, called when the user clicks "Delete" inside the edit modal.
     * The parent is responsible for showing a delete confirmation.
     */
    onDeleteRequest?: () => void;
}

/* ── Helper: get today's date in YYYY-MM-DD local time ── */
function getLocalTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

export default function AddAnnouncementModal({ isOpen, onClose, announcement, onUpdateRequest, onSendRequest, onDeleteRequest }: AddAnnouncementModalProps) {
    const isEditMode = !!announcement;
    const editingStatus = announcement?.status; // 'draft' | 'scheduled' | 'sent'

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [scheduleMode, setScheduleMode] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(''); // YYYY-MM-DD
    const [scheduleTime, setScheduleTime] = useState(''); // HH:MM

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset or populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            setError(null);
            if (announcement) {
                setTitle(announcement.title || '');
                setMessage(announcement.message || announcement.description || '');
                if (announcement.scheduledAt || announcement.status === 'scheduled') {
                    setScheduleMode(true);
                    try {
                        const d = new Date(announcement.scheduledAt || announcement.date || Date.now());
                        setScheduleDate(!isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '');
                    } catch {
                        setScheduleDate('');
                    }
                    setScheduleTime(parseTime12to24(announcement.time || ''));
                } else {
                    setScheduleMode(false);
                    setScheduleDate('');
                    setScheduleTime('');
                }
            } else {
                setTitle('');
                setMessage('');
                setScheduleMode(false);
                setScheduleDate('');
                setScheduleTime('');
            }
        }
    }, [isOpen, announcement]);

    const submitAnnouncement = async (newStatus: 'sent' | 'scheduled' | 'draft') => {
        if (!title || !message) {
            setError('Title and Message are required.');
            return;
        }

        let isoDateTime: string | undefined;

        if (newStatus === 'scheduled') {
            if (!scheduleDate) {
                setError('Schedule Date is required when scheduling.');
                return;
            }
            if (scheduleDate < getLocalTodayDateString()) {
                setError('Schedule date cannot be in the past.');
                return;
            }
            const timePart = scheduleTime ? `${scheduleTime}:00` : '00:00:00';
            isoDateTime = `${scheduleDate}T${timePart}Z`;
        } else if (newStatus === 'sent') {
            isoDateTime = new Date().toISOString();
        }
        // draft: no scheduledAt needed

        if (isEditMode && announcement?.id) {
            // Build a self-contained async closure that the parent can execute
            // after showing a confirmation dialog.
            const capturedId = announcement.id;
            const capturedTitle = title;
            const capturedMessage = message;
            const capturedIso = isoDateTime;
            const capturedNewStatus = newStatus;
            const capturedOldStatus = editingStatus;

            const performUpdate = async () => {
                await updateAnnouncement(capturedId, {
                    title: capturedTitle,
                    message: capturedMessage,
                    ...(capturedIso ? { scheduledAt: capturedIso } : {}),
                });
                if (capturedNewStatus !== capturedOldStatus) {
                    await changeAnnouncementStatus(capturedId, capturedNewStatus);
                }
            };

            // Draft → Send: route through send confirmation, not update confirmation
            if (capturedNewStatus === 'sent' && capturedOldStatus !== 'sent' && onSendRequest) {
                onSendRequest(performUpdate);
                return;
            }

            if (onUpdateRequest) {
                // Delegate to parent — it will show confirmation then call performUpdate
                onUpdateRequest(performUpdate);
                return; // Do NOT call onClose here; parent manages that
            }

            // Fallback: no confirmation wired up, save directly
            setIsSaving(true);
            setError(null);
            try {
                await performUpdate();
                onClose();
            } catch (err) {
                setError(withRequestRef(messageOf(err, 'An error occurred while saving the announcement.'), err));
                console.error('Failed to save announcement:', err);
            } finally {
                setIsSaving(false);
            }
            return;
        }

        // ── Create flow ──
        if (newStatus === 'sent' && onSendRequest) {
            const capturedTitle = title;
            const capturedMessage = message;
            const capturedIso = isoDateTime;
            const performSend = async () => {
                const data: CreateAnnouncementData = {
                    title: capturedTitle,
                    message: capturedMessage,
                    status: 'sent',
                    ...(capturedIso ? { scheduledAt: capturedIso } : {}),
                };
                await createAnnouncement(data);
            };
            onSendRequest(performSend);
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const data: CreateAnnouncementData = {
                title,
                message,
                status: newStatus,
                ...(isoDateTime ? { scheduledAt: isoDateTime } : {}),
            };
            await createAnnouncement(data);
            onClose();
        } catch (err) {
            setError(withRequestRef(messageOf(err, 'An error occurred while saving the announcement.'), err));
            console.error('Failed to save announcement:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSend = () => submitAnnouncement('sent');
    const handleSave = () => submitAnnouncement('scheduled');
    const handleSaveAsDraft = () => submitAnnouncement('draft');

    const handleScheduleClick = () => {
        setScheduleMode(true);
        if (!scheduleDate) setScheduleDate(getLocalTodayDateString());
    };


    const modalTitle = isEditMode
        ? editingStatus === 'scheduled'
            ? 'Edit Scheduled Announcement'
            : 'Edit Announcement'
        : scheduleMode
            ? 'Schedule for Later'
            : 'Add New Announcement';

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[680px] p-0">
            <div className="bg-white rounded-[24px] p-[24px] flex flex-col gap-[24px]">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <h2 className="font-inter font-bold text-[24px] text-[var(--grey-800)] leading-normal">
                        {modalTitle}
                    </h2>
                    <ModalCloseButton onClick={onClose} disabled={isSaving} />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Title Field */}
                <div className="flex flex-col gap-[8px]">
                    <label className="font-inter font-semibold text-[16px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                        Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="form-field h-[48px]"
                    />
                </div>

                {/* Message Field */}
                <div className="flex flex-col gap-[8px]">
                    <label className="font-inter font-semibold text-[16px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Message"
                        className="form-field h-[168px] resize-none"
                    />
                </div>

                {/* Date & Time — visible in schedule mode */}
                {scheduleMode && (
                    <div className="flex gap-[24px]">
                        {/* Date */}
                        <div className="flex-1 flex flex-col gap-[8px]">
                            <label className="font-inter font-semibold text-[16px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                                Date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    min={getLocalTodayDateString()}
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="form-field h-[48px] appearance-none"
                                    style={{ colorScheme: 'light' }}
                                />
                            </div>
                        </div>
                        {/* Time */}
                        <div className="flex-1 flex flex-col gap-[8px]">
                            <label className="font-inter font-semibold text-[16px] text-[var(--grey-800)] tracking-[0.16px] leading-none">
                                Time
                            </label>
                            <TimePicker
                                value={scheduleTime}
                                onChange={setScheduleTime}
                                placeholder="00:00"
                            />
                        </div>
                    </div>
                )}

                {/* Note */}
                <p className="font-inter font-normal text-[12px] text-[#666d80] leading-normal">
                    {scheduleMode
                        ? '*When you save, the message will automatically be sent at the scheduled date and time.'
                        : '*When you send, it goes live immediately in the Mobile App.'}
                </p>

                {/* Footer Buttons */}
                <div className="flex items-center w-full">
                    {/* Delete — always pinned left when visible */}
                    {isEditMode && editingStatus !== 'sent' && (
                        <button
                            onClick={() => onDeleteRequest?.()}
                            disabled={isSaving}
                            className="h-[44px] px-[24px] flex items-center justify-center border border-[#ec2d30] rounded-[12px] font-inter font-medium text-[16px] text-[#ec2d30] hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            Delete
                        </button>
                    )}

                    {/* Right-side buttons */}
                    <div className="flex items-center gap-[12px] ml-auto">
                        {isEditMode ? (
                            editingStatus === 'sent' ? (
                                /* Sent → Cancel | Update */
                                <>
                                    <button
                                        onClick={onClose}
                                        disabled={isSaving}
                                        className="h-[44px] px-[24px] flex items-center justify-center border border-[var(--border-01)] rounded-[12px] font-inter font-medium text-[16px] text-[var(--grey-800)] hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={isSaving}
                                        className="h-[44px] px-[24px] flex items-center justify-center bg-[var(--brand)] rounded-[12px] font-inter font-medium text-[16px] text-white hover:bg-[#065d29] transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Update'}
                                    </button>
                                </>
                            ) : editingStatus === 'scheduled' ? (
                                /* Scheduled → [Delete left] | Send Now | Update */
                                <>
                                    <button
                                        onClick={handleSend}
                                        disabled={isSaving}
                                        className="h-[44px] px-[24px] flex items-center justify-center border border-[var(--border-01)] rounded-[12px] font-inter font-medium text-[16px] text-[var(--grey-800)] hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Sending...' : 'Send Now'}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="h-[44px] px-[24px] flex items-center justify-center bg-[var(--brand)] rounded-[12px] font-inter font-medium text-[16px] text-white hover:bg-[#065d29] transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Update'}
                                    </button>
                                </>
                            ) : (
                                /* Draft → [Delete left] | Cancel | Save */
                                <>
                                    <button
                                        onClick={onClose}
                                        disabled={isSaving}
                                        className="h-[44px] px-[24px] flex items-center justify-center border border-[var(--border-01)] rounded-[12px] font-inter font-medium text-[16px] text-[var(--grey-800)] hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveAsDraft}
                                        disabled={isSaving}
                                        className="h-[44px] px-[24px] flex items-center justify-center bg-[var(--brand)] rounded-[12px] font-inter font-medium text-[16px] text-white hover:bg-[#065d29] transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </>
                            )
                        ) : (
                            /* ── Create mode ── */
                            scheduleMode ? (
                                /* Schedule mode → Save */
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="h-[44px] px-[24px] flex items-center justify-center bg-[var(--brand)] rounded-[12px] font-inter font-medium text-[16px] text-white hover:bg-[#065d29] transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            ) : (
                                /* Default → Save */
                                <button
                                    onClick={handleSaveAsDraft}
                                    disabled={isSaving}
                                    className="h-[44px] px-[24px] flex items-center justify-center bg-[var(--brand)] rounded-[12px] font-inter font-medium text-[16px] text-white hover:bg-[#065d29] transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
