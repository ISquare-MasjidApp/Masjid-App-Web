'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronDownIcon } from '@/components/ui/Icons';
import Input from '@/components/ui/Input';
import { getCampaignById, updateCampaign } from '@/lib/api/campaigns';
import { withRequestRef } from '@/lib/api/errors';
import type { Campaign } from '@/types';

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    goalAmount: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    getCampaignById(id)
      .then((data) => {
        setCampaign(data);
        setFormData({
          title: data.title ?? '',
          category: data.category ?? 'General',
          goalAmount: String(data.goalAmount ?? ''),
          startDate: data.startDate ? data.startDate.slice(0, 10) : '',
          endDate: data.endDate ? data.endDate.slice(0, 10) : '',
          description: data.description ?? '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateCampaign(id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        goalAmount: Number(formData.goalAmount),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: campaign?.status,
      });
      router.push(`/campaigns/${id}`);
    } catch (err) {
      setError(withRequestRef('Failed to update campaign. Please try again.', err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[300px] text-[var(--neutral-500)]">Loading...</div>;
  }

  if (!campaign) {
    return (
      <div className="flex flex-col gap-[16px]">
        <Link href="/campaigns" className="flex items-center gap-[8px] text-[14px] text-[var(--grey-800)]">
          <ChevronLeftIcon size={16} /> Back
        </Link>
        <p className="text-[var(--neutral-500)]">Campaign not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-[#1F1F1F] font-inter">Edit Campaign</h1>
        <Link
          href={`/campaigns/${id}`}
          className="flex items-center gap-[8px] bg-white border border-[var(--border-01)] text-[var(--grey-800)] px-[16px] py-[8px] rounded-[8px] hover:bg-[#fafafa] transition-colors shadow-sm font-medium text-[14px]"
        >
          <ChevronLeftIcon size={16} />
          <span>Back</span>
        </Link>
      </div>

      {/* Form Card */}
      <div className="rounded-[16px] border border-[var(--border-01)] p-[24px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">

          {/* Title */}
          <div className="flex flex-col gap-[8px]">
            <label className="text-[14px] font-medium text-[var(--grey-800)]">Title</label>
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Cause & Target Amount */}
          <div className="flex items-center gap-[24px]">
            <div className="flex flex-col gap-[8px] flex-1">
              <label className="text-[14px] font-medium text-[var(--grey-800)]">Cause</label>
              <div className="relative">
                <select
                  className="form-field h-[48px] appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Masjid Development">Masjid Development</option>
                  <option value="Education & Dawa'h">Education & Dawa&apos;h</option>
                  <option value="Charity & Welfare">Charity & Welfare</option>
                </select>
                <ChevronDownIcon size={20} className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[var(--neutral-500)] pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-[8px] flex-1">
              <label className="text-[14px] font-medium text-[var(--grey-800)]">Target Amount</label>
              <div className="relative">
                <span className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[var(--grey-800)] font-medium">£</span>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  required
                  className="form-field h-[48px] pl-[32px]"
                  value={formData.goalAmount}
                  onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Start & End Date */}
          <div className="flex items-center gap-[24px]">
            <div className="flex flex-col gap-[8px] flex-1">
              <label className="text-[14px] font-medium text-[var(--grey-800)]">Start Date</label>
              <input
                type="date"
                required
                className="form-field h-[48px]"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-[8px] flex-1">
              <label className="text-[14px] font-medium text-[var(--grey-800)]">End Date <span className="text-[var(--neutral-400)] font-normal">(optional)</span></label>
              <input
                type="date"
                className="form-field h-[48px]"
                value={formData.endDate}
                min={formData.startDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-[8px]">
            <label className="text-[14px] font-medium text-[var(--grey-800)]">Description</label>
            <textarea
              placeholder="Description"
              className="form-field h-[120px] resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {error && <p className="text-[13px] text-[#f64c4c]">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-[16px] pt-[8px] border-t border-[var(--border-01)]">
            <Link
              href={`/campaigns/${id}`}
              className="px-[20px] py-[10px] text-[14px] font-medium text-[var(--grey-800)] bg-white border border-[var(--border-01)] rounded-[8px] hover:bg-[var(--neutral-50)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-[20px] py-[10px] text-[14px] font-medium text-white bg-[var(--brand)] rounded-[8px] hover:bg-[#046c4e] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
