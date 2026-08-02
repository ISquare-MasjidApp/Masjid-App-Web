'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ── Constants ── */
const SORTED_HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

/* ── Props ── */
interface TimePickerProps {
    value?: string;          // "HH:mm" (24h format)
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

/* ── Helpers ── */
function parseTime(val?: string) {
    if (!val) return { h: '12', m: '00', p: 'AM' };
    const parts = val.split(':');
    const hoursStr = parts[0] || '12';
    const minutesStr = parts[1] || '00';
    let hours = parseInt(hoursStr, 10);
    if (isNaN(hours)) hours = 12;
    const p = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return {
        h: hours.toString().padStart(2, '0'),
        m: minutesStr.slice(0, 2).padStart(2, '0'),
        p,
    };
}

function formatDisplay(val?: string) {
    if (!val) return '';
    const { h, m } = parseTime(val);
    return `${h}:${m}`;
}

function formatPeriod(val?: string) {
    if (!val) return 'AM';
    return parseTime(val).p;
}

/* ═══════════════════════════════════════════════
   TimePicker Component — matches Figma 1093:5095
   ═══════════════════════════════════════════════ */
export default function TimePicker({
    value,
    onChange,
    placeholder = '00:00',
    disabled,
    className = '',
}: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(() => formatDisplay(value));
    const [error, setError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hourListRef = useRef<HTMLDivElement>(null);
    const minuteListRef = useRef<HTMLDivElement>(null);

    const { h, m, p } = parseTime(value);

    // Sync the display when `value` changes externally, and normalise partial
    // input ("1:") back to a formatted time once the dropdown closes. Guarded
    // against the previous render's inputs rather than run from an effect:
    // React re-runs the component immediately without committing the
    // intermediate DOM, so there is no flash of stale text.
    // https://react.dev/reference/react/useState#storing-information-from-previous-renders
    const [lastSync, setLastSync] = useState({ value, isOpen });
    if (lastSync.value !== value || lastSync.isOpen !== isOpen) {
        setLastSync({ value, isOpen });
        if (!isOpen) {
            setInputValue(formatDisplay(value));
        }
    }

    // Scroll a list so the selected item is centered
    const scrollToSelected = useCallback((listRef: React.RefObject<HTMLDivElement | null>, selectedIndex: number) => {
        const el = listRef.current;
        if (!el) return;
        // Measure actual item heights for accuracy
        const items = el.children;
        if (selectedIndex < 0 || selectedIndex >= items.length) return;
        const targetItem = items[selectedIndex] as HTMLElement;
        const visibleHeight = el.clientHeight;
        // Center the item in the scrollable area
        el.scrollTop = targetItem.offsetTop - visibleHeight / 2 + targetItem.offsetHeight / 2;
    }, []);

    // When dropdown opens or value changes, scroll to the selected hour/minute
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                const hourIdx = SORTED_HOURS.indexOf(h);
                const minIdx = MINUTES.indexOf(m);
                scrollToSelected(hourListRef, hourIdx);
                scrollToSelected(minuteListRef, minIdx);
            });
        }
    }, [isOpen, h, m, scrollToSelected]);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── Build 24h time from 12h parts and fire onChange ── */
    const commitTime = useCallback((newH: string, newM: string, newP: string) => {
        let hours24 = parseInt(newH, 10);
        if (newP === 'PM' && hours24 < 12) hours24 += 12;
        if (newP === 'AM' && hours24 === 12) hours24 = 0;
        const timeString = `${hours24.toString().padStart(2, '0')}:${newM}`;
        onChange(timeString);
    }, [onChange]);

    /* ── Selection from dropdown ── */
    const handleSelect = (type: 'h' | 'm' | 'p', val: string) => {
        let newH = h, newM = m, newP = p;
        if (type === 'h') newH = val;
        if (type === 'm') newM = val;
        if (type === 'p') newP = val;
        commitTime(newH, newM, newP);
        setInputValue(`${newH}:${newM}`);
    };

    /* ── Toggle period (AM ↔ PM) ── */
    const togglePeriod = () => {
        const newP = p === 'AM' ? 'PM' : 'AM';
        handleSelect('p', newP);
    };

    /* ── Typing in input ── */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const isDeleting = val.length < inputValue.length;

        const digits = val.replace(/[^\d]/g, '').slice(0, 4);

        if (isDeleting) {
            setInputValue(val);
            setError(false);
            return;
        }

        let formatted = '';
        if (digits.length > 0) {
            let hStr = digits.substring(0, 2);
            if (hStr.length === 2) {
                const hVal = parseInt(hStr, 10);
                if (hVal > 12) hStr = '12';
                if (hVal === 0) hStr = '01';
                formatted += hStr;
            } else {
                const hVal = parseInt(hStr, 10);
                if (hVal > 1) {
                    formatted += `0${hVal}`;
                } else {
                    formatted += hStr;
                }
            }
        }
        if (formatted.length === 2 && digits.length >= 2) {
            formatted += ':';
        }
        if (digits.length > 2) {
            let mStr = digits.substring(2, 4);
            if (mStr.length === 2) {
                const mVal = parseInt(mStr, 10);
                if (mVal > 59) mStr = '59';
            }
            formatted += mStr;
        }

        setInputValue(formatted);
        setError(false);

        // Live sync: commit value + scroll dropdown as user types
        const typedH = formatted.split(':')[0];
        const typedM = formatted.split(':')[1];

        // Live-commit the typed value so the dropdown highlights it immediately
        if (typedH && typedH.length === 2) {
            const validH = SORTED_HOURS.includes(typedH) ? typedH : h;
            const validM = (typedM && typedM.length === 2 && MINUTES.includes(typedM)) ? typedM : m;
            commitTime(validH, validM, p);

            // Scroll to the typed hour
            if (isOpen) {
                requestAnimationFrame(() => {
                    const hIdx = SORTED_HOURS.indexOf(validH);
                    if (hIdx >= 0) scrollToSelected(hourListRef, hIdx);
                    if (typedM && typedM.length === 2) {
                        const mIdx = MINUTES.indexOf(validM);
                        if (mIdx >= 0) scrollToSelected(minuteListRef, mIdx);
                    }
                });
            }
        }
    };

    const handleBlur = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) {
            onChange('');
            setError(false);
            return;
        }

        const timeRegex = /^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)?$/i;
        const match = trimmed.match(timeRegex);
        if (!match) {
            setError(true);
            return;
        }

        const [, hourStr, minStr, period] = match;
        let hour = parseInt(hourStr, 10);
        const min = parseInt(minStr, 10);

        if (hour < 0 || hour > 23 || min < 0 || min > 59) {
            setError(true);
            return;
        }

        const periodNorm = period ? period.toUpperCase() : p;

        if (periodNorm === 'PM' && hour < 12) hour += 12;
        if (periodNorm === 'AM' && hour === 12) hour = 0;

        const h24 = hour.toString().padStart(2, '0');
        const m24 = min.toString().padStart(2, '0');

        onChange(`${h24}:${m24}`);
        setInputValue(formatDisplay(`${h24}:${m24}`));
        setError(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
            setIsOpen(false);
        }
    };

    /* ── Render ── */
    return (
        <div className={`relative ${className}`} ref={containerRef} style={{ width: '100%' }}>
            {/* Input Field — Figma: h-48, rounded-12, px-16, flex justify-between */}
            <div
                className={`flex items-center justify-between h-[48px] px-[16px] rounded-[12px] border cursor-pointer transition-colors
                    ${disabled
                        ? 'bg-[var(--neutral-100)] cursor-not-allowed border-[var(--border-01)]'
                        : isOpen
                            ? 'border-[var(--brand)] bg-white'
                            : error
                                ? 'border-[var(--error)] bg-white'
                                : 'border-[var(--border-01)] bg-white hover:border-[var(--brand)]'
                    }`}
                onClick={() => !disabled && setIsOpen(true)}
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`bg-transparent outline-none border-none font-inter text-[14px] w-full
                        ${disabled ? 'text-[var(--neutral-300)] cursor-not-allowed' : 'text-[var(--grey-800)]'}
                    `}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                />
                {/* AM/PM label on right side */}
                <span
                    className={`font-inter text-[14px] shrink-0 ml-[8px] select-none
                        ${disabled ? 'text-[var(--neutral-300)]' : 'text-[var(--grey-800)]'}
                    `}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                >
                    {formatPeriod(value)}
                </span>
            </div>

            {/* Dropdown — Figma 1093:5095: w-152, rounded-12, p-12, gap-6, absolute overlay */}
            {isOpen && !disabled && (
                <div
                    className="absolute z-[100] bg-white border border-[var(--border-01)] rounded-[12px] p-[12px] flex gap-[6px] items-start justify-center shadow-lg"
                    style={{ width: '152px', top: '100%', left: '0', marginTop: '4px' }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {/* HOUR Column */}
                    <div className="flex-1 flex flex-col gap-[8px] items-center justify-center min-w-0">
                        <span className="font-inter font-semibold text-[10px] text-[#666d80] uppercase leading-none select-none">
                            HOUR
                        </span>
                        <div className="flex gap-[2px] items-start w-full">
                            <div
                                ref={hourListRef}
                                className="flex-1 flex flex-col gap-[6px] items-start overflow-y-auto min-w-0"
                                style={{ maxHeight: '120px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {SORTED_HOURS.map((hour) => (
                                    <button
                                        key={hour}
                                        type="button"
                                        onClick={() => handleSelect('h', hour)}
                                        className={`w-full flex items-center justify-center px-[2px] py-[4px] cursor-pointer transition-colors
                                            ${h === hour
                                                ? 'bg-[#077734] text-white rounded-[4px]'
                                                : 'text-[#36394a] rounded-[2px] hover:bg-[rgba(7,119,52,0.05)]'
                                            }`}
                                    >
                                        <span className="font-inter font-normal text-[12px] leading-none">{hour}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Hour Divider */}
                            <div className="w-[2px] h-[23px] bg-[#e2e8f0] rounded-[12px] shrink-0 self-start" />
                        </div>
                    </div>

                    {/* MINUTE Column */}
                    <div className="flex-1 flex flex-col gap-[8px] items-center justify-center min-w-0">
                        <span className="font-inter font-semibold text-[10px] text-[#666d80] uppercase leading-none select-none">
                            MIN
                        </span>
                        <div className="flex gap-[2px] items-start w-full">
                            <div
                                ref={minuteListRef}
                                className="flex-1 flex flex-col gap-[6px] items-start overflow-y-auto min-w-0"
                                style={{ maxHeight: '120px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {MINUTES.map((minute) => (
                                    <button
                                        key={minute}
                                        type="button"
                                        onClick={() => handleSelect('m', minute)}
                                        className={`w-full flex items-center justify-center px-[2px] py-[4px] cursor-pointer transition-colors
                                            ${m === minute
                                                ? 'bg-[#077734] text-white rounded-[4px]'
                                                : 'text-[#36394a] rounded-[2px] hover:bg-[rgba(7,119,52,0.05)]'
                                            }`}
                                    >
                                        <span className="font-inter font-normal text-[12px] leading-none">{minute}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Minute Divider */}
                            <div className="w-[2px] h-[59px] bg-[#e2e8f0] rounded-[12px] shrink-0 self-start" />
                        </div>
                    </div>

                    {/* PERIOD Column */}
                    <div className="flex-1 flex flex-col gap-[8px] items-center justify-center min-w-0">
                        <span className="font-inter font-semibold text-[10px] text-[#666d80] uppercase leading-none select-none">
                            PERIOD
                        </span>
                        <div className="flex flex-col gap-[6px] items-center w-full">
                            {(['AM', 'PM'] as const).map((period) => (
                                <button
                                    key={period}
                                    type="button"
                                    onClick={() => handleSelect('p', period)}
                                    className={`w-full flex items-center justify-center px-[2px] py-[4px] cursor-pointer transition-colors
                                        ${p === period
                                            ? 'bg-[#077734] text-white rounded-[4px]'
                                            : 'text-[#36394a] hover:bg-[rgba(7,119,52,0.05)]'
                                        }`}
                                >
                                    <span className="font-inter font-normal text-[12px] leading-none">{period}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
