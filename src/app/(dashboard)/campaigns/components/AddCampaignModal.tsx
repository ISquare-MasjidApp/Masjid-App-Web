'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { ChevronDownIcon, MegaphoneIcon } from '@/components/ui/Icons';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import Input from '@/components/ui/Input';
import { createCampaign } from '@/lib/api/campaigns';
import { withRequestRef } from '@/lib/api/errors';

interface AddCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type Step = 'form' | 'confirm';

export default function AddCampaignModal({ isOpen, onClose, onCreated }: AddCampaignModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    goalAmount: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setStep('form');
    setError(null);
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('confirm');
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createCampaign({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        goalAmount: Number(formData.goalAmount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'draft',
      });
      onCreated?.();
      handleClose();
    } catch (err) {
      setError(withRequestRef('Failed to save draft. Please try again.', err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await createCampaign({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        goalAmount: Number(formData.goalAmount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'active',
      });
      onCreated?.();
      handleClose();
    } catch (err) {
      setError(withRequestRef('Failed to create campaign. Please try again.', err));
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] w-full">
      {step === 'form' ? (
        <>
          <div className="flex items-center justify-between p-[24px] border-b border-[var(--border-01)]">
            <h2 className="text-[20px] font-semibold text-[var(--grey-800)] font-inter">Add New Campaign</h2>
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
            <div className="flex items-center justify-end gap-[16px] mt-2 pt-2 border-t border-[var(--border-01)]">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-[20px] py-[10px] text-[14px] font-medium text-[var(--grey-800)] bg-white border border-[var(--border-01)] rounded-[8px] hover:bg-[var(--neutral-50)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveDraft}
                className="px-[20px] py-[10px] text-[14px] font-medium text-white bg-[var(--brand)] rounded-[8px] hover:bg-[#046c4e] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </>
      ) : (
        /* Confirmation Step */
        <div className="p-[24px] flex flex-col gap-[32px] items-center">
          {/* Icon + Text */}
          <div className="flex flex-col gap-[16px] items-center justify-center w-full">
            <div className="w-[48px] h-[48px] rounded-[99px] bg-white border border-[var(--border-01)] flex items-center justify-center">
              <MegaphoneIcon size={24} className="text-[var(--grey-800)]" />
            </div>
            <div className="flex flex-col gap-[6px] items-center text-center">
              <p className="text-[20px] font-bold text-[#36394a]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Publish Campaign?
              </p>
              <p className="text-[16px] text-[#666d80] font-normal max-w-[400px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                You are about to publish this campaign to users. Please confirm all details are correct.
              </p>
            </div>
          </div>

          {error && <p className="text-[13px] text-[#f64c4c]">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-[22px] items-center w-full">
            <button
              type="button"
              onClick={() => setStep('form')}
              disabled={submitting}
              className="flex-1 h-[43px] border border-[#e2e8f0] rounded-[8px] text-[16px] font-bold text-[#4b4b4b] hover:bg-[var(--neutral-50)] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={submitting}
              className="flex-1 h-[43px] bg-[var(--brand)] rounded-[8px] text-[16px] font-bold text-white hover:bg-[#046c4e] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {submitting ? 'Publishing...' : 'Create & Publish'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
