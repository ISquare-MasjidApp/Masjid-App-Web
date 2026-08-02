'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ChevronDownIcon, EditIcon } from '@/components/ui/Icons';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import Input from '@/components/ui/Input';
import { updateCampaign } from '@/lib/api/campaigns';
import { withRequestRef } from '@/lib/api/errors';
import type { Campaign } from '@/types';

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onUpdated?: (updated: Campaign) => void;
  onDeleteRequest?: () => void;
}

export default function EditCampaignModal({ isOpen, onClose, campaign, onUpdated, onDeleteRequest }: EditCampaignModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    goalAmount: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublished = campaign.status === 'active' || campaign.status === 'paused';

  // Sync form whenever the modal opens or the campaign changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: campaign.title ?? '',
        category: campaign.category ?? 'General',
        goalAmount: String(campaign.goalAmount ?? ''),
        startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
        endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
        description: campaign.description ?? '',
      });
      setError(null);
    }
  }, [isOpen, campaign]);

  const handleClose = () => {
    setShowConfirm(false);
    setError(null);
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPublished) {
      setShowConfirm(true);
    } else {
      void doSave();
    }
  };

  const doSave = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await updateCampaign(campaign.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        goalAmount: Number(formData.goalAmount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: campaign.status,
      });
      onUpdated?.(updated);
      handleClose();
    } catch (err) {
      setError(withRequestRef('Failed to update campaign. Please try again.', err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen && !showConfirm} onClose={handleClose} className="max-w-[700px] w-full">
        <div className="flex items-center justify-between p-[24px] border-b border-[var(--border-01)]">
          <h2 className="text-[20px] font-semibold text-[var(--grey-800)] font-inter">Edit Campaign</h2>
          <ModalCloseButton onClick={handleClose} />
        </div>

        <form className="p-[24px] flex flex-col gap-[24px]" onSubmit={handleFormSubmit}>

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
              <div className="flex items-center h-[48px] border border-[var(--border-01)] rounded-[12px] overflow-hidden transition-all duration-150 focus-within:border-transparent focus-within:shadow-[0_0_0_2px_var(--brand)]">
                <span className="flex items-center justify-center h-full px-[14px] text-[14px] font-medium text-[var(--grey-800)] border-r border-[var(--border-01)] bg-transparent select-none shrink-0">
                  £
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  required
                  className="flex-1 h-full px-[12px] outline-none bg-transparent text-[14px] text-[var(--grey-800)] placeholder:text-[var(--neutral-500)]"
                  value={formData.goalAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, goalAmount: val });
                  }}
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
              <label className="text-[14px] font-medium text-[var(--grey-800)]">End Date</label>
              <input
                type="date"
                required
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

          {/* Action Buttons */}
          <div className="flex items-center mt-2 pt-2 border-t border-[var(--border-01)]">
            {campaign.status === 'draft' && (
              <button
                type="button"
                onClick={() => onDeleteRequest?.()}
                disabled={submitting}
                className="h-[44px] px-[24px] flex items-center justify-center border border-[#ec2d30] rounded-[12px] font-inter font-medium text-[16px] text-[#ec2d30] hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <div className="flex items-center gap-[12px] ml-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="h-[44px] px-[24px] flex items-center justify-center border border-[var(--border-01)] rounded-[12px] font-inter font-medium text-[16px] text-[var(--grey-800)] hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-[44px] px-[24px] flex items-center justify-center bg-[var(--brand)] rounded-[12px] font-inter font-medium text-[16px] text-white hover:bg-[#065d29] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showConfirm}
        eventType="upcoming"
        title="Save Changes to Published Campaign?"
        description="This campaign is currently live. Editing it will update the details visible to donors. Please confirm you want to proceed."
        confirmLabel="Save Changes"
        submittingLabel="Saving..."
        confirmVariant="primary"
        iconNode={<EditIcon size={24} className="text-white" />}
        iconContainerClassName="bg-[var(--brand)] border-[#bbf7d0]"
        onClose={() => setShowConfirm(false)}
        onConfirm={doSave}
      />
    </>
  );
}
