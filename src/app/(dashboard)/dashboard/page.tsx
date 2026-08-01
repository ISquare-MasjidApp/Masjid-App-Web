'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Megaphone } from 'lucide-react';
import DateHeader from '@/components/dashboard/DateHeader';
import PrayerTimeCard from '@/components/dashboard/PrayerTimeCard';
import JummahCard from '@/components/dashboard/JummahCard';
import QuickActionButton from '@/components/dashboard/QuickActionButton';
import EventCard from '@/components/dashboard/EventCard';
import CampaignCard from '@/components/dashboard/CampaignCard';
import Skeleton from '@/components/ui/Skeleton';
import AddEventModal from '@/components/dashboard/AddEventModal';
import AddAnnouncementModal from '@/components/dashboard/AddAnnouncementModal';
import AddCampaignModal from '@/app/(dashboard)/campaigns/components/AddCampaignModal';
import UpdatePrayerTimeModal from '@/components/prayer-management/UpdatePrayerTimeModal';
import Link from 'next/link';
import type { PrayerTime, Event, Campaign } from '@/types';
import { getPrayerTimes } from '@/lib/api/prayer-times';
import { getEvents } from '@/lib/api/events';
import { getCampaigns } from '@/lib/api/campaigns';
import type { PrayerTimeResponse, PrayersData, JumuahTimeEntry } from '@/types/prayer-times';

// Helper to format date key YYYY-MM-DD
const formatDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Helper to format time for display (12h)
function formatTime12h(time24: string | undefined): string {
  if (!time24) return '—';
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${ampm}`;
}


const PRAYER_NAMES: (keyof PrayersData)[] = ['fajr', 'sunrise', 'zuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  zuhr: 'Zuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export default function DashboardPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [prayerData, setPrayerData] = useState<PrayerTimeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [prayerFetchError, setPrayerFetchError] = useState(false);

  // Events & Campaigns state
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Quick action modal states
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
  const [isUpdatePrayerOpen, setIsUpdatePrayerOpen] = useState(false);

  // Track month/year for fetching
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Fetch upcoming events (max 3) — format date/time same as the events tab
  useEffect(() => {
    setEventsLoading(true);
    getEvents({ upcoming: true, status: 'published', size: 3 })
      .then(res => {
        const processed = res.content.slice(0, 3).map(evt => ({
          ...evt,
          date: evt.date
            ? new Date(evt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
          startTime: evt.date
            ? new Date(evt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '',
          endTime: '',
        }));
        setUpcomingEvents(processed);
      })
      .catch(() => setUpcomingEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  // Fetch active campaigns (max 3)
  useEffect(() => {
    setCampaignsLoading(true);
    getCampaigns({ size: 10 })
      .then(res => setActiveCampaigns(res.content.filter(c => c.status === 'active').slice(0, 3)))
      .catch(() => setActiveCampaigns([]))
      .finally(() => setCampaignsLoading(false));
  }, []);

  // Fetch prayer times when month/year changes
  const fetchPrayerTimes = useCallback(async () => {
    setLoading(true);
    setPrayerFetchError(false);
    try {
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const result = await getPrayerTimes({ startDate, endDate, size: 31 });
      setPrayerData(result.content);
    } catch (error) {
      console.error('Failed to fetch prayer times', error);
      setPrayerFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchPrayerTimes();
  }, [fetchPrayerTimes]);

  // Handle Date Navigation
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);

    // Sync fetch if month changes
    if (newDate.getMonth() !== currentMonth || newDate.getFullYear() !== currentYear) {
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
    }
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);

    // Sync fetch if month changes
    if (newDate.getMonth() !== currentMonth || newDate.getFullYear() !== currentYear) {
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    if (now.getMonth() !== currentMonth || now.getFullYear() !== currentYear) {
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
    }
  };

  // Get data for selected date
  const selectedDateKey = formatDateKey(selectedDate);
  const daysPrayerData = prayerData.find(p => p.date === selectedDateKey);

  /* ── determine active prayer ── */
  const getActivePrayer = (): keyof PrayersData | null => {
    if (!daysPrayerData) return null;
    const now = new Date();
    // Only highlight if selected date is today
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (!isToday) return null;

    const currentMin = now.getHours() * 60 + now.getMinutes();
    const order: (keyof PrayersData)[] = ['fajr', 'sunrise', 'zuhr', 'asr', 'maghrib', 'isha'];
    let active: keyof PrayersData | null = null;
    for (const p of order) {
      const t = daysPrayerData.prayers[p]?.jamah || daysPrayerData.prayers[p]?.athan;
      if (t) {
        const [h, m] = t.split(':').map(Number);
        if (currentMin >= h * 60 + m) active = p;
      }
    }
    return active;
  };
  const activePrayer = getActivePrayer();

  // Format data for PrayerTimeCard
  const displayPrayerTimes: PrayerTime[] = PRAYER_NAMES.map(name => {
    const p = daysPrayerData?.prayers[name];
    const time = p?.jamah || p?.athan || '—';
    const athanTime = p?.athan ? formatTime12h(p.athan) : '—';

    // Determine active status
    const isActive = activePrayer === name;

    return {
      name: PRAYER_LABELS[name],
      time: formatTime12h(time),
      athanTime: name === 'sunrise' ? '' : athanTime, // Sunrise doesn't have athan label usually in UI
      isActive: isActive
    };
  });

  return (
    <div className="flex flex-col gap-[24px]">
      {/* ── Date Section ── */}
      <div className="flex flex-col gap-[16px] items-center bg-[rgba(7,119,52,0.05)] p-[24px] rounded-[16px] w-full">
        <DateHeader
          gregorianDate={selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          islamicDate={daysPrayerData?.hijriDay || daysPrayerData?.hijriDate || '—'}
          isToday={selectedDate.toDateString() === new Date().toDateString()}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onJumpToToday={handleJumpToToday}
        />

        {/* ─── Prayer Time Cards ─── */}
        <div className="flex gap-[30px] items-stretch w-full overflow-x-auto scrollbar-hide">
          {loading ? (
            /* SKELETON LOADING STATE */
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-center gap-[6px] p-[24px] rounded-[12px] bg-white min-w-[160px] h-[127px]">
                <Skeleton className="h-5 w-16" />
                <div className="flex items-end gap-[2px]">
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="h-5 w-8" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : daysPrayerData ? (
            displayPrayerTimes.map((prayer) => {
              // On Fridays, replace Zuhr with the JummahCard
              const isFriday = selectedDate.getDay() === 5;
              const hasJumuah = isFriday && daysPrayerData.jumuahTimes && daysPrayerData.jumuahTimes.length > 0;
              if (prayer.name === 'Zuhr' && hasJumuah) {
                return (
                  <JummahCard
                    key="jummah"
                    jumuahTimes={daysPrayerData.jumuahTimes as JumuahTimeEntry[]}
                    athanTime={daysPrayerData.prayers.zuhr?.athan}
                  />
                );
              }
              return <PrayerTimeCard key={prayer.name} prayer={prayer} />;
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-[12px] py-[32px] w-full">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#077734" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p className="font-inter font-medium text-[14px] text-[#666d80] text-center">
                {prayerFetchError ? 'Failed to load prayer times. Please refresh.' : 'No prayer times set for this date.'}
              </p>
              {!prayerFetchError && (
                <Link
                  href="/prayer-management"
                  className="flex items-center gap-[8px] h-[36px] px-[16px] bg-[var(--brand)] text-white text-[13px] font-medium font-inter rounded-[8px] hover:bg-[#046c4e] transition-colors"
                >
                  Add Prayer Times
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-[18px]">
        <QuickActionButton label="Add Event" onClick={() => setIsAddEventOpen(true)} />
        <QuickActionButton
          label="Add Announcement"
          onClick={() => setIsAddAnnouncementOpen(true)}
        />
        <QuickActionButton label="Create Campaign" onClick={() => setIsAddCampaignOpen(true)} />
        <QuickActionButton
          label="Update Prayer Timings"
          onClick={() => setIsUpdatePrayerOpen(true)}
        />
      </div>

      {/* Upcoming Events Section */}
      <section>
        <h2 className="font-inter font-semibold text-[20px] text-[var(--grey-800)] mb-[16px]">
          Upcoming Events
        </h2>
        {eventsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-[16px] bg-white border border-[#e2e8f0] p-[16px] h-[160px]">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-[16px] bg-[#fafbfb] border border-dashed border-[#e2e8f0] rounded-[24px] p-[24px] w-full">
            <div className="flex items-center justify-center size-[48px] rounded-full bg-white border border-[#e2e8f0]">
              <CalendarDays className="size-[24px] text-[var(--brand-brand,#077734)]" />
            </div>
            <div className="flex flex-col items-center gap-[8px]">
              <p className="font-bold text-[20px] text-[var(--grey-800,#36394a)]">No Upcoming Events</p>
              <p className="font-medium text-[16px] text-[var(--grey-100,#666d80)] text-center max-w-[374px]">
                There are no events scheduled yet. Start by creating your first community event.
              </p>
            </div>
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="flex items-center justify-center h-[44px] px-[24px] bg-[var(--brand-brand,#077734)] text-white font-medium text-[16px] rounded-[12px]"
            >
              Create Event
            </button>
          </div>
        )}
      </section>

      {/* Active Campaigns Section */}
      <section>
        <h2 className="font-inter font-semibold text-[20px] text-[var(--grey-800)] mb-[16px]">
          Active Campaigns
        </h2>
        {campaignsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-[16px] bg-white border border-[#e2e8f0] p-[24px] h-[160px]">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-full mt-4" />
              </div>
            ))}
          </div>
        ) : activeCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
            {activeCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-[16px] bg-[#fafbfb] border border-dashed border-[#e2e8f0] rounded-[24px] p-[24px] w-full">
            <div className="flex items-center justify-center size-[48px] rounded-full bg-white border border-[#e2e8f0]">
              <Megaphone className="size-[24px] text-[var(--brand-brand,#077734)]" />
            </div>
            <div className="flex flex-col items-center gap-[8px]">
              <p className="font-bold text-[20px] text-[var(--grey-800,#36394a)]">No Active Campaigns</p>
              <p className="font-medium text-[16px] text-[var(--grey-100,#666d80)] text-center max-w-[374px]">
                There are no active campaigns at the moment. Start by creating a new fundraising campaign.
              </p>
            </div>
            <button
              onClick={() => setIsAddCampaignOpen(true)}
              className="flex items-center justify-center h-[44px] px-[24px] bg-[var(--brand-brand,#077734)] text-white font-medium text-[16px] rounded-[12px]"
            >
              Create Campaign
            </button>
          </div>
        )}
      </section>

      {/* Quick Action Modals */}
      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={() => { setIsAddEventOpen(false); router.push('/events'); }}
      />

      <AddAnnouncementModal
        isOpen={isAddAnnouncementOpen}
        onClose={() => { setIsAddAnnouncementOpen(false); router.push('/events'); }}
      />

      <AddCampaignModal
        isOpen={isAddCampaignOpen}
        onClose={() => { setIsAddCampaignOpen(false); router.push('/campaigns'); }}
      />

      {isUpdatePrayerOpen && (
        <UpdatePrayerTimeModal
          prayerTime={null}
          onClose={() => { setIsUpdatePrayerOpen(false); router.push('/prayer-management'); }}
          onSuccess={() => { setIsUpdatePrayerOpen(false); router.push('/prayer-management'); }}
        />
      )}
    </div>
  );
}
