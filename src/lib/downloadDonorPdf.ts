import type { Campaign, Donation } from '@/types';
import { getCampaignDonations } from './api/campaigns';

export async function downloadDonorPdf(campaign: Campaign): Promise<void> {
  // Fetch all donations (up to 500)
  const result = await getCampaignDonations(campaign.id, { page: 0, size: 500 });
  const donations: Donation[] = result.content;

  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const fmt = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Header
  doc.setFontSize(18);
  doc.setTextColor(36, 57, 74);
  doc.text('Campaign Donor Report', 14, 20);

  // Campaign details
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Campaign: ${campaign.title}`, 14, 32);
  doc.text(`Category: ${campaign.category ?? '—'}`, 14, 39);
  doc.text(`Duration: ${fmtDate(campaign.startDate)} – ${fmtDate(campaign.endDate)}`, 14, 46);
  doc.text(`Goal: ${fmt(campaign.goalAmount)}   Raised: ${fmt(campaign.raisedAmount ?? 0)}   Donors: ${campaign.donorCount ?? donations.length}`, 14, 53);
  doc.text(`Status: ${campaign.status.toUpperCase()}   Generated: ${fmtDate(new Date().toISOString())}`, 14, 60);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 64, 196, 64);

  if (donations.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text('No donations recorded for this campaign.', 14, 76);
  } else {
    const rows = donations.map((d, i) => [
      i + 1,
      d.isAnonymous ? 'Anonymous' : (d.donorName ?? '—'),
      fmt(d.amount),
      d.coverFee ? fmt(d.totalCharged ?? d.amount) : '—',
      d.status.charAt(0).toUpperCase() + d.status.slice(1),
      fmtDate(d.completedAt ?? d.createdAt),
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['#', 'Donor Name', 'Amount', 'Total Charged', 'Status', 'Date']],
      body: rows,
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [245, 250, 247] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 22 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 26 },
      },
      margin: { left: 14, right: 14 },
    });

    // Total row summary
    // jspdf-autotable attaches lastAutoTable to the document after rendering,
    // but does not declare it on the jsPDF type.
    type WithLastAutoTable = { lastAutoTable?: { finalY?: number } };
    const finalY: number = (doc as typeof doc & WithLastAutoTable).lastAutoTable?.finalY ?? 200;
    const completedDonations = donations.filter(d => d.status === 'completed');
    const totalRaised = completedDonations.reduce((s, d) => s + (d.amount ?? 0), 0);

    doc.setFontSize(10);
    doc.setTextColor(36, 57, 74);
    doc.text(`Total completed donations: ${completedDonations.length}   Total raised: ${fmt(totalRaised)}`, 14, finalY + 10);
  }

  const filename = `${campaign.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_donors.pdf`;
  doc.save(filename);
}
