'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@/components/ui/Icons';
import { getCampaignDonations } from '@/lib/api/campaigns';
import type { Donation } from '@/types';

interface DonationRow {
  id: string;
  name: string;
  amount: string;
  date: string;
  method: string;
  // Mirrors Donation['status'] so every status the backend can return is
  // renderable — 'refunded' was previously missing.
  status: Donation['status'];
}

const STATUS_LABEL: Record<string, string> = {
  completed: 'Successful',
  failed: 'Failed',
  pending: 'Pending',
  refunded: 'Refunded',
};

const StatusPill = ({ status }: { status: DonationRow['status'] }) => {
  const styles: Record<string, { border: string; text: string }> = {
    completed: { border: 'border-[#6bc497]', text: 'text-[#47b881]' },
    failed:    { border: 'border-[#eb6f70]', text: 'text-[#f64c4c]' },
    pending:   { border: 'border-[#ffc62b]', text: 'text-[#ffad0d]' },
    refunded:  { border: 'border-[#cbd5e1]', text: 'text-[#667085]' },
  };
  const { border, text } = styles[status] ?? { border: 'border-[#e2e8f0]', text: 'text-[#667085]' };
  return (
    <span className={`inline-flex items-center px-[8px] py-[4px] rounded-[8px] border ${border} ${text} text-[12px] font-normal`}
      style={{ fontFamily: "'Inter', sans-serif" }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
};

export default function DonationHistoryTable({ campaignId }: { campaignId: string }) {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetchDonations = async (page = 0) => {
    setLoading(true);
    try {
      const result = await getCampaignDonations(campaignId, { page, size: pageSize });
      const rows: DonationRow[] = result.content.map((d) => ({
        id: d.id,
        name: d.isAnonymous ? 'Anonymous' : (d.donorName ?? '—'),
        amount: `£${Number(d.totalCharged ?? d.amount).toLocaleString()}`,
        date: d.createdAt
          ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—',
        method: d.paymentMethod ?? 'Card',
        status: d.status,
      }));
      setDonations(rows);
      setTotalItems(result.pagination.totalElements);
      setTotalPages(result.pagination.totalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch donations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations(0);
  }, [campaignId]);

  return (
    <div className="rounded-[24px] border border-[var(--border-01)] flex flex-col p-[24px] gap-[16px]">
      <h2 className="text-[20px] font-semibold text-[#1F1F1F] font-inter">Donation History</h2>

      <table className="w-full text-left">
        <thead>
          <tr className="bg-[#fafbfb] border-y border-[var(--border-01)] h-[48px]">
            <th className="px-[16px] text-[12px] font-medium text-[#667085] uppercase font-inter">Name</th>
            <th className="px-[16px] text-[12px] font-medium text-[#667085] uppercase font-inter">Amount</th>
            <th className="px-[16px] text-[12px] font-medium text-[#667085] uppercase font-inter">Date</th>
            <th className="px-[16px] text-[12px] font-medium text-[#667085] uppercase font-inter">Payment Method</th>
            <th className="px-[16px] text-[12px] font-medium text-[#667085] uppercase font-inter">Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="px-[16px] py-[32px] text-center text-[var(--neutral-500)]">Loading...</td></tr>
          ) : donations.length === 0 ? (
            <tr><td colSpan={5} className="px-[16px] py-[32px] text-center text-[var(--neutral-500)]">No donations yet.</td></tr>
          ) : donations.map((donation, index) => (
            <tr key={donation.id} className={`h-[56px] hover:bg-[#f0f4f8] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafbfb]'}`}>
              <td className="px-[16px] text-[14px] text-[#667085] font-medium font-inter">{donation.name}</td>
              <td className="px-[16px] text-[14px] text-[#36394A] font-bold font-inter">{donation.amount}</td>
              <td className="px-[16px] text-[14px] text-[#667085] font-medium font-inter">{donation.date}</td>
              <td className="px-[16px] text-[14px] text-[#667085] font-medium font-inter">{donation.method}</td>
              <td className="px-[16px]"><StatusPill status={donation.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="h-[40px] border-t border-[#e2e8f0] flex items-center justify-between text-[14px] text-[#4b4b4b] font-inter">
        <span>
          {totalItems === 0 ? '0' : `${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, totalItems)}`} of {totalItems} items
        </span>
        <div className="flex items-center gap-[8px]">
          <div className="bg-[#f5f5f5] rounded-[8px] h-[23px] px-[11px] flex items-center gap-[8px]">
            <span className="text-[#8e8e8e] text-[14px]">{currentPage + 1}</span>
            <ChevronDownIcon size={16} className="text-[#8e8e8e]" />
          </div>
          <span className="text-[#4b4b4b] text-[14px]">of {totalPages} pages</span>
          <button
            onClick={() => fetchDonations(currentPage - 1)}
            disabled={currentPage === 0}
            className="hover:bg-[var(--neutral-100)] rounded-[4px] disabled:opacity-50"
          ><ChevronLeftIcon size={16} /></button>
          <button
            onClick={() => fetchDonations(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="hover:bg-[var(--neutral-100)] rounded-[4px] disabled:opacity-50"
          ><ChevronRightIcon size={16} /></button>
        </div>
      </div>
    </div>
  );
}
