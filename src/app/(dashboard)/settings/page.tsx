'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import ContentSwitcher from '@/components/ui/ContentSwitcher';
import { ChevronDownIcon, MapPinIcon, PlusIcon, EditIcon } from '@/components/ui/Icons';
import { getSettings, updateSettings, updatePaymentSettings, saveStripeKeys, clearStripeKeys, getDonationCauses, createDonationCause, updateDonationCause, deleteDonationCause } from '@/lib/api/settings';
import type {
  MasjidSettingsResponse,
  MasjidServices,
  MasjidFacilities,
  StripeSettingsResponse,
} from '@/types/settings';

const Checkbox = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex items-center gap-[8px] cursor-pointer group w-fit"
  >
    <div
      className="w-[20px] h-[20px] rounded-[4px] border transition-colors flex items-center justify-center shrink-0"
      style={{
        backgroundColor: checked ? 'var(--brand)' : '#fff',
        borderColor: checked ? 'var(--brand)' : '#e2e8f0',
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <span
      className="font-inter text-[16px] text-[#4b4b4b] leading-normal select-none"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {label}
    </span>
  </button>
);

const RadioYesNo = ({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: boolean;
  onChange: () => void;
}) => (
  <label className="flex items-center gap-[8px] cursor-pointer" onClick={onChange}>
    <div className="w-[20px] h-[20px] rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center shrink-0">
      {selected && <div className="w-[10px] h-[10px] rounded-full bg-[var(--brand)]" />}
    </div>
    <span className="font-inter font-medium text-[14px] text-[#667085]">{label}</span>
  </label>
);

const SettingInput = ({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-col gap-[8px] flex-1 min-w-0">
    <label className="font-inter font-semibold text-[16px] text-[#4b4b4b] tracking-[0.16px] leading-none">
      {label}
    </label>
    <input
      type="text"
      placeholder={placeholder ?? label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="form-field h-[48px]"
    />
  </div>
);

const LoadingSkeleton = () => (
  <div className="border border-[#e2e8f0] rounded-[24px] p-[24px] flex flex-col gap-[24px] animate-pulse">
    <div className="h-6 w-48 bg-[#e2e8f0] rounded" />
    <div className="h-[2px] bg-[#f6f6f6] rounded-[2px]" />
    <div className="flex gap-[24px]">
      <div className="flex flex-col gap-[24px] flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-[8px]">
            <div className="h-4 w-32 bg-[#e2e8f0] rounded" />
            <div className="h-[48px] bg-[#e2e8f0] rounded-[12px]" />
          </div>
        ))}
      </div>
      <div className="flex-1 flex justify-center pt-[40px]">
        <div className="w-[56px] h-[56px] bg-[#e2e8f0] rounded-[16px]" />
      </div>
    </div>
  </div>
);

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] shadow-lg text-white font-inter font-medium text-[15px] transition-all ${
        type === 'success' ? 'bg-[var(--brand)]' : 'bg-[#dc2626]'
      }`}
    >
      {type === 'success' ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10L8 14L16 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2" /><path d="M10 6V10M10 14H10.01" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
      )}
      {message}
    </div>
  );
};

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<'masjid' | 'bank' | 'quick'>('masjid');
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [removingKeys, setRemovingKeys] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeSettingsResponse | null>(null);
  // Stripe key-entry form (secret + webhook secret are write-only; never pre-filled)
  const [publishableKeyInput, setPublishableKeyInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Donation Causes / Quick Settings state
  const [causesList, setCausesList] = useState<{ name: string }[]>([]);
  const [loadingCauses, setLoadingCauses] = useState(false);
  const [isAddingCause, setIsAddingCause] = useState(false);
  const [newCauseInput, setNewCauseInput] = useState('');
  const [savingNewCause, setSavingNewCause] = useState(false);
  const [editingCauseName, setEditingCauseName] = useState<string | null>(null);
  const [editCauseInput, setEditCauseInput] = useState('');
  const [savingEditCause, setSavingEditCause] = useState(false);
  const [deletingCauseName, setDeletingCauseName] = useState<string | null>(null);
  const [deletingCause, setDeletingCause] = useState(false);

  const fetchDonationCauses = useCallback(async () => {
    try {
      setLoadingCauses(true);
      const causes = await getDonationCauses();
      const formatted = causes.map(name => ({ name }));
      setCausesList(formatted);
    } catch (err) {
      console.error('Failed to load donation causes', err);
      setToast({ message: 'Failed to load donation causes', type: 'error' });
    } finally {
      setLoadingCauses(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'quick') {
      fetchDonationCauses();
    }
  }, [activeTab, fetchDonationCauses]);

  const handleAddCauseSubmit = async () => {
    if (!newCauseInput.trim()) {
      setToast({ message: 'Please enter a cause name', type: 'error' });
      return;
    }
    try {
      setSavingNewCause(true);
      const updatedCauses = await createDonationCause(newCauseInput.trim());
      setCausesList(updatedCauses.map(name => ({ name })));
      setNewCauseInput('');
      setIsAddingCause(false);
      setToast({ message: 'Donation cause added successfully', type: 'success' });
    } catch (err) {
      console.error('Failed to add donation cause:', err);
      setToast({ message: (err instanceof Error ? err.message : undefined) ||'Failed to add donation cause', type: 'error' });
    } finally {
      setSavingNewCause(false);
    }
  };

  const handleStartEditCause = (causeName: string) => {
    setEditingCauseName(causeName);
    setEditCauseInput(causeName);
  };

  const handleSaveEditCause = async () => {
    if (!editingCauseName) return;
    if (!editCauseInput.trim()) {
      setToast({ message: 'Please enter a valid cause name', type: 'error' });
      return;
    }
    try {
      setSavingEditCause(true);
      const updatedCauses = await updateDonationCause(editingCauseName, editCauseInput.trim());
      setCausesList(updatedCauses.map(name => ({ name })));
      setEditingCauseName(null);
      setEditCauseInput('');
      setToast({ message: 'Donation cause updated successfully', type: 'success' });
    } catch (err) {
      console.error('Failed to update donation cause:', err);
      setToast({ message: (err instanceof Error ? err.message : undefined) ||'Failed to update donation cause', type: 'error' });
    } finally {
      setSavingEditCause(false);
    }
  };

  const handleConfirmDeleteCause = async () => {
    if (!deletingCauseName) return;
    try {
      setDeletingCause(true);
      const updatedCauses = await deleteDonationCause(deletingCauseName);
      setCausesList(updatedCauses.map(name => ({ name })));
      setDeletingCauseName(null);
      setToast({ message: 'Donation cause deleted successfully', type: 'success' });
    } catch (err) {
      console.error('Failed to delete donation cause:', err);
      setToast({ message: (err instanceof Error ? err.message : undefined) ||'Failed to delete donation cause', type: 'error' });
    } finally {
      setDeletingCause(false);
    }
  };

  // Masjid details form state
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [mensCapacity, setMensCapacity] = useState('');
  const [womensCapacity, setWomensCapacity] = useState('');
  const [hasWomensArea, setHasWomensArea] = useState(false);

  // Services
  const [services, setServices] = useState<MasjidServices>({
    marriageService: false,
    hallRental: false,
    iftarProgram: false,
    counseling: false,
    newMuslimSupport: false,
    funeralService: false,
  });

  // Facilities
  const [facilities, setFacilities] = useState<MasjidFacilities>({
    parking: false,
    womensArea: false,
    shoeRacks: false,
    wuduFacilities: false,
    washroom: false,
  });

  const [hasInfoData, setHasInfoData] = useState(false);
  const [infoSnapshot, setInfoSnapshot] = useState({ name: '', about: '', phone: '', email: '', website: '', addressLine1: '', addressLine2: '', city: '', postcode: '', latitude: '', longitude: '' });

  const [hasServicesData, setHasServicesData] = useState(false);
  const [servicesSnapshot, setServicesSnapshot] = useState({
    mensCapacity: '', womensCapacity: '', hasWomensArea: false,
    services: {} as MasjidServices,
    facilities: {} as MasjidFacilities,
  });

  // Payment form state
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankSortCode, setBankSortCode] = useState('');

  const populateForm = useCallback((data: MasjidSettingsResponse) => {
    const info = {
      name: data.name || '',
      about: data.about || '',
      phone: data.contact?.phone || '',
      email: data.contact?.email || '',
      website: data.contact?.website || '',
      addressLine1: data.address?.line1 || '',
      addressLine2: data.address?.line2 || '',
      city: data.address?.city || '',
      postcode: data.address?.postcode || '',
      latitude: data.location?.latitude?.toString() || '',
      longitude: data.location?.longitude?.toString() || '',
    };
    const svc = {
      mensCapacity: data.capacity?.mens?.toString() || '',
      womensCapacity: data.capacity?.womens?.toString() || '',
      hasWomensArea: (data.capacity?.womens ?? 0) > 0,
      services: data.services ?? { marriageService: false, hallRental: false, iftarProgram: false, counseling: false, newMuslimSupport: false, funeralService: false },
      facilities: data.facilities ?? { parking: false, womensArea: false, shoeRacks: false, wuduFacilities: false, washroom: false },
    };

    setName(info.name); setAbout(info.about); setPhone(info.phone);
    setEmail(info.email); setWebsite(info.website);
    setAddressLine1(info.addressLine1); setAddressLine2(info.addressLine2);
    setCity(info.city); setPostcode(info.postcode);
    setLatitude(info.latitude); setLongitude(info.longitude);
    setMensCapacity(svc.mensCapacity); setWomensCapacity(svc.womensCapacity);
    setHasWomensArea(svc.hasWomensArea);
    setServices(svc.services); setFacilities(svc.facilities);

    setInfoSnapshot(info);
    setHasInfoData(!!data.name);
    setServicesSnapshot(svc);
    setHasServicesData(!!(data.services || data.facilities || data.capacity));

    setBankAccountName(data.payment?.bankAccountName || '');
    setBankName(data.payment?.bankName || '');
    setBankAccountNumber(data.payment?.bankAccountNumber || '');
    setBankSortCode(data.payment?.bankSortCode || '');

    if (data.stripe) setStripeStatus(data.stripe);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      populateForm(data);
    } catch {
      setToast({ message: 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [populateForm]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveKeys = async () => {
    const publishableKey = publishableKeyInput.trim();
    const secretKey = secretKeyInput.trim();
    const webhookSecret = webhookSecretInput.trim();

    // Client-side validation (backend enforces too, but fail fast for a better UX).
    if (!publishableKey.startsWith('pk_')) {
      setToast({ message: "Publishable key must start with 'pk_'", type: 'error' });
      return;
    }
    if (!(secretKey.startsWith('sk_') || secretKey.startsWith('rk_'))) {
      setToast({ message: "Secret key must start with 'sk_' (or 'rk_' for a restricted key)", type: 'error' });
      return;
    }
    if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
      setToast({ message: "Webhook signing secret must start with 'whsec_'", type: 'error' });
      return;
    }
    const modeOf = (k: string) => (k.includes('_live_') ? 'live' : k.includes('_test_') ? 'test' : null);
    const pubMode = modeOf(publishableKey);
    const secMode = modeOf(secretKey);
    if (pubMode && secMode && pubMode !== secMode) {
      setToast({ message: `Publishable key (${pubMode}) and secret key (${secMode}) are from different modes`, type: 'error' });
      return;
    }
    if ((pubMode ?? secMode) === 'live' &&
        !window.confirm('You are saving LIVE Stripe keys. Real payments will be processed. Continue?')) {
      return;
    }

    try {
      setSavingKeys(true);
      const status = await saveStripeKeys({
        publishableKey,
        secretKey,
        webhookSecret: webhookSecret || undefined,
      });
      setStripeStatus(status);
      // Never keep the secret / webhook secret around after saving.
      setSecretKeyInput('');
      setWebhookSecretInput('');
      setPublishableKeyInput('');
      setToast({ message: 'Stripe keys saved successfully', type: 'success' });
    } catch (err) {
      // Expected user-input error (e.g. bad key) — warn, don't console.error
      // (console.error triggers Next.js's full-screen dev overlay).
      console.warn('Failed to save Stripe keys:', err instanceof Error ? err.message : err);
      setToast({ message: err instanceof Error ? err.message : 'Failed to save Stripe keys', type: 'error' });
    } finally {
      setSavingKeys(false);
    }
  };

  const handleRemoveKeys = async () => {
    if (!window.confirm('Remove the Stripe keys? Donations will be disabled until keys are added again.')) return;
    try {
      setRemovingKeys(true);
      await clearStripeKeys();
      setStripeStatus({ connected: false, publishableKey: null, keyMode: null, webhookConfigured: false, keysUpdatedAt: null });
      setToast({ message: 'Stripe keys removed.', type: 'success' });
    } catch (err) {
      console.warn('Failed to remove Stripe keys:', err instanceof Error ? err.message : err);
      setToast({ message: err instanceof Error ? err.message : 'Failed to remove Stripe keys.', type: 'error' });
    } finally {
      setRemovingKeys(false);
    }
  };

  // --- Masjid Information module ---
  const isInfoDirty = useMemo(() => {
    if (!hasInfoData) return false;
    return (
      name !== infoSnapshot.name || about !== infoSnapshot.about ||
      phone !== infoSnapshot.phone || email !== infoSnapshot.email ||
      website !== infoSnapshot.website || addressLine1 !== infoSnapshot.addressLine1 ||
      addressLine2 !== infoSnapshot.addressLine2 || city !== infoSnapshot.city ||
      postcode !== infoSnapshot.postcode || latitude !== infoSnapshot.latitude ||
      longitude !== infoSnapshot.longitude
    );
  }, [hasInfoData, infoSnapshot, name, about, phone, email, website, addressLine1, addressLine2, city, postcode, latitude, longitude]);

  const handleSaveInfo = async () => {
    if (!name.trim()) {
      setToast({ message: 'Masjid name is required', type: 'error' });
      return;
    }
    try {
      setSavingInfo(true);
      await updateSettings({
        name: name.trim(), about: about.trim() || null,
        address: { line1: addressLine1.trim() || null, line2: addressLine2.trim() || null, city: city.trim() || null, postcode: postcode.trim() || null, country: 'United Kingdom' },
        contact: { phone: phone.trim() || null, email: email.trim() || null, website: website.trim() || null },
        location: { latitude: latitude ? parseFloat(latitude) : null, longitude: longitude ? parseFloat(longitude) : null },
        capacity: { mens: mensCapacity ? parseInt(mensCapacity) : null, womens: womensCapacity ? parseInt(womensCapacity) : null },
        services, facilities,
      });
      const newSnap = { name: name.trim(), about: about.trim(), phone: phone.trim(), email: email.trim(), website: website.trim(), addressLine1: addressLine1.trim(), addressLine2: addressLine2.trim(), city: city.trim(), postcode: postcode.trim(), latitude: latitude.trim(), longitude: longitude.trim() };
      setInfoSnapshot(newSnap);
      setHasInfoData(true);
      setToast({ message: 'Masjid information saved successfully', type: 'success' });
    } catch (err) {
      console.error('Failed to save info:', err);
      setToast({ message: 'Failed to save masjid information', type: 'error' });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleDiscardInfo = () => {
    setName(infoSnapshot.name); setAbout(infoSnapshot.about); setPhone(infoSnapshot.phone);
    setEmail(infoSnapshot.email); setWebsite(infoSnapshot.website);
    setAddressLine1(infoSnapshot.addressLine1); setAddressLine2(infoSnapshot.addressLine2);
    setCity(infoSnapshot.city); setPostcode(infoSnapshot.postcode);
    setLatitude(infoSnapshot.latitude); setLongitude(infoSnapshot.longitude);
  };

  // --- Services / Facilities / Capacity module ---
  const isServicesDirty = useMemo(() => {
    if (!hasServicesData) return false;
    return (
      mensCapacity !== servicesSnapshot.mensCapacity ||
      womensCapacity !== servicesSnapshot.womensCapacity ||
      hasWomensArea !== servicesSnapshot.hasWomensArea ||
      JSON.stringify(services) !== JSON.stringify(servicesSnapshot.services) ||
      JSON.stringify(facilities) !== JSON.stringify(servicesSnapshot.facilities)
    );
  }, [hasServicesData, servicesSnapshot, mensCapacity, womensCapacity, hasWomensArea, services, facilities]);

  const handleSaveServices = async () => {
    try {
      setSavingServices(true);
      await updateSettings({
        name: name.trim(), about: about.trim() || null,
        address: { line1: addressLine1.trim() || null, line2: addressLine2.trim() || null, city: city.trim() || null, postcode: postcode.trim() || null, country: 'United Kingdom' },
        contact: { phone: phone.trim() || null, email: email.trim() || null, website: website.trim() || null },
        capacity: { mens: mensCapacity ? parseInt(mensCapacity) : null, womens: womensCapacity ? parseInt(womensCapacity) : null },
        services, facilities,
      });
      setServicesSnapshot({ mensCapacity, womensCapacity, hasWomensArea, services, facilities });
      setHasServicesData(true);
      setToast({ message: 'Services & facilities saved successfully', type: 'success' });
    } catch (err) {
      console.error('Failed to save services:', err);
      setToast({ message: 'Failed to save services & facilities', type: 'error' });
    } finally {
      setSavingServices(false);
    }
  };

  const handleDiscardServices = () => {
    setMensCapacity(servicesSnapshot.mensCapacity);
    setWomensCapacity(servicesSnapshot.womensCapacity);
    setHasWomensArea(servicesSnapshot.hasWomensArea);
    setServices(servicesSnapshot.services);
    setFacilities(servicesSnapshot.facilities);
  };

  const handleSavePayment = async () => {
    try {
      setSavingPayment(true);
      const data = await updatePaymentSettings({
        bankAccountName: bankAccountName.trim() || null,
        bankName: bankName.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        bankSortCode: bankSortCode.trim() || null,
      });
      populateForm(data);
      setToast({ message: 'Payment settings saved successfully', type: 'success' });
    } catch (err) {
      console.error('Failed to save payment settings:', err);
      setToast({ message: 'Failed to save payment settings', type: 'error' });
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="flex flex-col gap-[24px]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h1 className="font-inter font-bold text-[28px] text-[#1f1f1f] leading-none">App Settings</h1>

      {/* Tab Bar */}
      <ContentSwitcher
        tabs={[
          { id: 'masjid', label: 'Masjid Details' },
          { id: 'bank', label: 'Bank & Payment Settings' },
          { id: 'quick', label: 'Quick Settings' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'masjid' | 'bank' | 'quick')}
      />

      {/* Masjid Details Tab */}
      {activeTab === 'masjid' && (
        loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="border border-[#e2e8f0] rounded-[24px] p-[24px] flex flex-col gap-[24px]">
            <h2 className="font-inter font-semibold text-[20px] text-[#36394a]">Masjid Informations</h2>
            <div className="h-[2px] bg-[#f6f6f6] rounded-[2px]" />

            {/* Form Fields — 2 columns */}
            <div className="flex flex-col gap-[24px]">
              <div className="flex gap-[24px]">
                <SettingInput label="Masjid Name" value={name} onChange={setName} />
                <SettingInput label="Contact Number" value={phone} onChange={setPhone} />
              </div>
              <div className="flex gap-[24px]">
                <SettingInput label="Email" value={email} onChange={setEmail} />
                <SettingInput label="Website" value={website} onChange={setWebsite} />
              </div>
            </div>

            {/* About + Address */}
            <div className="flex gap-[24px]">
              <div className="flex flex-col gap-[8px] flex-1">
                <textarea
                  placeholder="About Masjid"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="form-field min-h-[148px] resize-none"
                />
              </div>
              <div className="flex flex-col gap-[24px] flex-1">
                <SettingInput label="Address Line 1" value={addressLine1} onChange={setAddressLine1} />
                <SettingInput label="Address Line 2" value={addressLine2} onChange={setAddressLine2} />
                <div className="flex gap-[24px]">
                  <SettingInput label="Town or City" value={city} onChange={setCity} />
                  <SettingInput label="Post Code" value={postcode} onChange={setPostcode} />
                </div>
                <div className="flex gap-[24px]">
                  <SettingInput label="Latitude" placeholder="e.g. 51.5074" value={latitude} onChange={setLatitude} />
                  <SettingInput label="Longitude" placeholder="e.g. 0.1278" value={longitude} onChange={setLongitude} />
                </div>
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => {
                      if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setLatitude(pos.coords.latitude.toFixed(6));
                            setLongitude(pos.coords.longitude.toFixed(6));
                            setToast({ message: 'Current location fetched successfully', type: 'success' });
                          },
                          () => setToast({ message: 'Unable to retrieve location', type: 'error' })
                        );
                      } else {
                        setToast({ message: 'Geolocation is not supported by your browser', type: 'error' });
                      }
                    }}
                    className="h-[40px] px-[16px] border border-[#e2e8f0] text-[#4b4b4b] rounded-[10px] font-inter font-medium text-[14px] hover:bg-[#f6f6f6] transition-colors flex items-center gap-[8px] cursor-pointer"
                  >
                    <MapPinIcon size={16} className="text-[#667085]" />
                    <span>Pick Location on Map</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Save Info */}
            <div className="flex justify-end gap-[12px]">
              {hasInfoData && isInfoDirty && (
                <button
                  onClick={handleDiscardInfo}
                  disabled={savingInfo}
                  className="h-[44px] px-[24px] border border-[#e2e8f0] text-[#4b4b4b] rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#f6f6f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSaveInfo}
                disabled={savingInfo}
                className="h-[44px] px-[24px] bg-[var(--brand)] text-white rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#065d29] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingInfo ? 'Saving...' : hasInfoData && isInfoDirty ? 'Save Changes' : 'Save'}
              </button>
            </div>

            <div className="h-[2px] bg-[#f6f6f6] rounded-[2px]" />

            {/* Service Offered */}
            <div className="flex gap-[24px]">
              <div className="flex flex-col gap-[8px] flex-1">
                <h2 className="font-inter font-semibold text-[20px] text-[#36394a]">Service Offered</h2>
                <p
                  className="text-[16px] text-[#666d80] leading-[1.25] max-w-[300px]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Select the services provided by your masjid. These will be displayed in the mobile app for community
                  awareness.
                </p>
              </div>
              <div className="flex flex-col gap-[16px] flex-1">
                <Checkbox
                  label="Marriage / Nikkah Ceremonies"
                  checked={services.marriageService}
                  onChange={(v) => setServices((s) => ({ ...s, marriageService: v }))}
                />
                <Checkbox
                  label="Hall Hire"
                  checked={services.hallRental}
                  onChange={(v) => setServices((s) => ({ ...s, hallRental: v }))}
                />
                <Checkbox
                  label="Iftar (Ramadan)"
                  checked={services.iftarProgram}
                  onChange={(v) => setServices((s) => ({ ...s, iftarProgram: v }))}
                />
                <Checkbox
                  label="Advice & Counselling"
                  checked={services.counseling}
                  onChange={(v) => setServices((s) => ({ ...s, counseling: v }))}
                />
                <Checkbox
                  label="New Muslim Support"
                  checked={services.newMuslimSupport}
                  onChange={(v) => setServices((s) => ({ ...s, newMuslimSupport: v }))}
                />
                <Checkbox
                  label="Funeral Support"
                  checked={services.funeralService}
                  onChange={(v) => setServices((s) => ({ ...s, funeralService: v }))}
                />
              </div>
            </div>

            <div className="h-[2px] bg-[#f6f6f6] rounded-[2px]" />

            {/* Facilities Available */}
            <div className="flex gap-[24px]">
              <div className="flex flex-col gap-[8px] flex-1">
                <h2 className="font-inter font-semibold text-[20px] text-[#36394a]">Facilities Available</h2>
                <p
                  className="text-[16px] text-[#666d80] leading-[1.25] max-w-[300px]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Indicate the facilities available at your masjid. These will help users understand accessibility and
                  amenities.
                </p>
              </div>
              <div className="flex flex-col gap-[16px] flex-1">
                <Checkbox
                  label="Parking"
                  checked={facilities.parking}
                  onChange={(v) => setFacilities((f) => ({ ...f, parking: v }))}
                />
                <Checkbox
                  label="Womens Area"
                  checked={facilities.womensArea}
                  onChange={(v) => setFacilities((f) => ({ ...f, womensArea: v }))}
                />
                <Checkbox
                  label="Shoe Shelves"
                  checked={facilities.shoeRacks}
                  onChange={(v) => setFacilities((f) => ({ ...f, shoeRacks: v }))}
                />
                <Checkbox
                  label="Ablutions rooms"
                  checked={facilities.wuduFacilities}
                  onChange={(v) => setFacilities((f) => ({ ...f, wuduFacilities: v }))}
                />
                <Checkbox
                  label="Washroom"
                  checked={facilities.washroom}
                  onChange={(v) => setFacilities((f) => ({ ...f, washroom: v }))}
                />
              </div>
            </div>

            <div className="h-[2px] bg-[#f6f6f6] rounded-[2px]" />

            {/* Capacity */}
            <div className="flex gap-[24px]">
              <div className="flex flex-col gap-[8px] flex-1">
                <h2 className="font-inter font-semibold text-[20px] text-[#36394a]">Capacity</h2>
                <p
                  className="text-[16px] text-[#666d80] leading-[1.25] max-w-[300px]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Provide the approximate capacity of the masjid. This helps users plan their visit, especially during
                  peak prayer times.
                </p>
              </div>
              <div className="flex flex-col gap-[16px] flex-1">
                <div className="flex flex-col gap-[6px]">
                  <input
                    type="number"
                    placeholder="Men"
                    min="0"
                    value={mensCapacity}
                    onChange={(e) => setMensCapacity(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="form-field h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between">
                    <span className="font-inter font-medium text-[14px] text-[#667085]">Women&apos;s Access</span>
                    <div className="flex items-center gap-[16px]">
                      <RadioYesNo label="Yes" selected={hasWomensArea} onChange={() => setHasWomensArea(true)} />
                      <RadioYesNo label="No" selected={!hasWomensArea} onChange={() => { setHasWomensArea(false); setWomensCapacity(''); }} />
                    </div>
                  </div>
                  {hasWomensArea && (
                    <input
                      type="number"
                      placeholder="Women"
                      min="0"
                      value={womensCapacity}
                      onChange={(e) => setWomensCapacity(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="form-field h-[48px]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Save Services */}
            <div className="flex justify-end gap-[12px]">
              {hasServicesData && isServicesDirty && (
                <button
                  onClick={handleDiscardServices}
                  disabled={savingServices}
                  className="h-[44px] px-[24px] border border-[#e2e8f0] text-[#4b4b4b] rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#f6f6f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSaveServices}
                disabled={savingServices}
                className="h-[44px] px-[24px] bg-[var(--brand)] text-white rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#065d29] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingServices ? 'Saving...' : hasServicesData && isServicesDirty ? 'Save Changes' : 'Save'}
              </button>
            </div>
          </div>
        )
      )}

      {/* Bank & Payment Settings Tab */}
      {activeTab === 'bank' && (
        loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="border border-[#e2e8f0] rounded-[24px] p-[24px] flex flex-col gap-[24px]">
            <h2 className="font-inter font-semibold text-[20px] text-[#36394a]">BANK &amp; PAYMENT SETTINGS</h2>
            <div className="h-[2px] bg-[#f6f6f6] rounded-[2px]" />

            {/* Stripe (Card Payments) */}
            <div className="flex gap-[24px]">
              <div className="flex flex-col gap-[8px] flex-1">
                <h3 className="font-inter font-semibold text-[18px] text-[#36394a]">Stripe (Card Payments)</h3>
                <p className="text-[14px] text-[#666d80] leading-[1.4] max-w-[300px]">
                  Enter your own Stripe account keys to accept online donations. Payments go directly into your Stripe account. The secret key is stored securely and is never shown again.
                </p>
              </div>
              <div className="flex-1 flex flex-col gap-[16px]">
                {/* Current status */}
                {stripeStatus?.connected ? (
                  <div className="flex flex-col gap-[10px] p-[16px] bg-[#f9fafb] border border-[#e2e8f0] rounded-[12px]">
                    <div className="flex items-center gap-[8px]">
                      <div className="w-[8px] h-[8px] rounded-full bg-[var(--brand)]" />
                      <span className="font-inter text-[14px] text-[#4b4b4b]">Connected</span>
                      {stripeStatus.keyMode && (
                        <span className={`px-[8px] py-[2px] rounded-[6px] font-inter font-semibold text-[11px] uppercase tracking-wider ${stripeStatus.keyMode === 'live' ? 'bg-[rgba(7,119,52,0.1)] text-[var(--brand)]' : 'bg-amber-100 text-amber-700'}`}>
                          {stripeStatus.keyMode}
                        </span>
                      )}
                    </div>
                    {stripeStatus.publishableKey && (
                      <span className="font-inter text-[13px] text-[#666d80] break-all">
                        Publishable key: <span className="text-[#4b4b4b]">{stripeStatus.publishableKey}</span>
                      </span>
                    )}
                    <div className="flex items-center gap-[8px]">
                      <div className={`w-[8px] h-[8px] rounded-full ${stripeStatus.webhookConfigured ? 'bg-[var(--brand)]' : 'bg-amber-400'}`} />
                      <span className="font-inter text-[13px] text-[#4b4b4b]">
                        Webhook: <strong>{stripeStatus.webhookConfigured ? 'Configured' : 'Not configured'}</strong>
                      </span>
                    </div>
                    {stripeStatus.keysUpdatedAt && (
                      <span className="font-inter text-[12px] text-[#94a3b8]">
                        Last updated {new Date(stripeStatus.keysUpdatedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-[8px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-gray-300" />
                    <span className="font-inter text-[14px] text-[#666d80]">Not configured</span>
                  </div>
                )}

                {/* Key entry / update form */}
                <div className="flex flex-col gap-[12px]">
                  <div className="flex flex-col gap-[8px]">
                    <label className="font-inter font-semibold text-[14px] text-[#4b4b4b]">Publishable Key</label>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="pk_live_..."
                      value={publishableKeyInput}
                      onChange={(e) => setPublishableKeyInput(e.target.value)}
                      className="form-field h-[48px]"
                    />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="font-inter font-semibold text-[14px] text-[#4b4b4b]">Secret Key</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="sk_live_..."
                      value={secretKeyInput}
                      onChange={(e) => setSecretKeyInput(e.target.value)}
                      className="form-field h-[48px]"
                    />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="font-inter font-semibold text-[14px] text-[#4b4b4b]">
                      Webhook Signing Secret <span className="font-normal text-[#94a3b8]">(optional)</span>
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="whsec_..."
                      value={webhookSecretInput}
                      onChange={(e) => setWebhookSecretInput(e.target.value)}
                      className="form-field h-[48px]"
                    />
                    <p className="font-inter text-[12px] text-[#94a3b8] leading-[1.4]">
                      In your Stripe Dashboard → Developers → Webhooks, add an endpoint pointing to your
                      backend&apos;s <code>/api/v1/webhooks/stripe</code> for the events
                      <code> payment_intent.succeeded</code> and <code> payment_intent.payment_failed</code>,
                      then paste the signing secret (<code>whsec_…</code>) here.
                    </p>
                  </div>
                  <div className="flex gap-[12px] pt-[4px]">
                    <button
                      onClick={handleSaveKeys}
                      disabled={savingKeys}
                      className="h-[44px] px-[24px] bg-[var(--brand)] text-white rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#065d29] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingKeys ? 'Saving...' : stripeStatus?.connected ? 'Update Keys' : 'Save Keys'}
                    </button>
                    {stripeStatus?.connected && (
                      <button
                        onClick={handleRemoveKeys}
                        disabled={removingKeys}
                        className="h-[44px] px-[20px] border border-red-200 text-red-600 rounded-[12px] font-inter font-medium text-[16px] hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {removingKeys ? 'Removing...' : 'Remove Keys'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )
      )}

      {/* Quick Settings / Donation Causes Tab */}
      {activeTab === 'quick' && (
        loadingCauses ? (
          <LoadingSkeleton />
        ) : (
          <div className="border border-[#e2e8f0] rounded-[24px] p-[24px] flex flex-col gap-[24px] bg-white">
            {/* Header section */}
            <div className="flex items-start justify-between gap-[16px]">
              <div className="flex flex-col gap-[4px]">
                <h2 className="font-inter font-semibold text-[20px] text-[#36394a]">Donation Cause</h2>
                <p className="font-inter text-[15px] text-[#666d80]">
                  Manage the donation categories displayed in the mobile application
                </p>
              </div>
              {!isAddingCause && (
                <button
                  onClick={() => { setIsAddingCause(true); setNewCauseInput(''); }}
                  className="h-[44px] px-[20px] bg-[var(--brand)] text-white rounded-[12px] font-inter font-medium text-[15px] hover:bg-[#065d29] transition-colors flex items-center gap-[8px] cursor-pointer shrink-0"
                >
                  <PlusIcon size={18} />
                  <span>Add Cause</span>
                </button>
              )}
            </div>

            {/* Inline Add Cause Form (Image 3 Figma) */}
            {isAddingCause && (
              <div className="flex items-center gap-[12px] p-[16px] bg-[#f9fafb] border border-[#e2e8f0] rounded-[16px]">
                <input
                  type="text"
                  placeholder="eg., Masjid Development"
                  value={newCauseInput}
                  onChange={(e) => setNewCauseInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCauseSubmit()}
                  className="form-field h-[48px] flex-1 text-[15px]"
                  autoFocus
                />
                <button
                  onClick={handleAddCauseSubmit}
                  disabled={savingNewCause}
                  className="h-[44px] px-[24px] bg-[var(--brand)] text-white rounded-[12px] font-inter font-medium text-[15px] hover:bg-[#065d29] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {savingNewCause ? 'Adding...' : 'Add Cause'}
                </button>
                <button
                  onClick={() => { setIsAddingCause(false); setNewCauseInput(''); }}
                  disabled={savingNewCause}
                  className="h-[44px] px-[20px] border border-[#e2e8f0] text-[#4b4b4b] rounded-[12px] font-inter font-medium text-[15px] hover:bg-white transition-colors cursor-pointer shrink-0"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Cause Items List */}
            <div className="flex flex-col gap-[12px]">
              {causesList.length === 0 ? (
                <div className="text-center py-[48px] text-[#666d80] font-inter">
                  No donation causes configured. Click &quot;+ Add Cause&quot; above to create one.
                </div>
              ) : (
                causesList.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-[16px] border border-[#e2e8f0] rounded-[14px] bg-white hover:border-[#cbd5e1] transition-all"
                  >
                    {editingCauseName === item.name ? (
                      /* Inline Edit Cause Form (Image 4 Figma) */
                      <div className="flex items-center gap-[12px] w-full">
                        <div className="text-[#94a3b8] cursor-grab shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/>
                            <circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={editCauseInput}
                          onChange={(e) => setEditCauseInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditCause()}
                          className="form-field h-[44px] flex-1 text-[15px]"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEditCause}
                          disabled={savingEditCause}
                          className="h-[40px] px-[20px] bg-[var(--brand)] text-white rounded-[10px] font-inter font-medium text-[14px] hover:bg-[#065d29] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {savingEditCause ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingCauseName(null); setEditCauseInput(''); }}
                          disabled={savingEditCause}
                          className="h-[40px] px-[16px] border border-[#e2e8f0] text-[#4b4b4b] rounded-[10px] font-inter font-medium text-[14px] hover:bg-[#f6f6f6] transition-colors cursor-pointer shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* Row Display Mode (Image 2 Figma) */
                      <>
                        <div className="flex items-center gap-[16px]">
                          {/* Drag Handle Icon :: */}
                          <div className="text-[#94a3b8] cursor-grab select-none">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/>
                              <circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
                            </svg>
                          </div>

                          <span className="font-inter font-semibold text-[16px] text-[#1f1f1f]">
                            {item.name}
                          </span>

                          <span className="px-[10px] py-[3px] bg-[rgba(7,119,52,0.1)] text-[var(--brand)] rounded-[6px] font-inter font-semibold text-[11px] uppercase tracking-wider select-none">
                            ACTIVE
                          </span>
                        </div>

                        {/* Right actions: Edit + Delete */}
                        <div className="flex items-center gap-[12px]">
                          <button
                            onClick={() => handleStartEditCause(item.name)}
                            className="p-[8px] text-[#667085] hover:text-[var(--brand)] hover:bg-[#f6f6f6] rounded-[8px] transition-colors cursor-pointer"
                            title="Edit Cause"
                          >
                            <EditIcon size={18} />
                          </button>

                          <button
                            onClick={() => setDeletingCauseName(item.name)}
                            className="p-[8px] text-[#dc2626] hover:bg-[#fee2e2] rounded-[8px] transition-colors cursor-pointer"
                            title="Delete Cause"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Bottom Save / Discard bar */}
            <div className="flex justify-end gap-[12px] pt-[8px] border-t border-[#f6f6f6]">
              <button
                onClick={() => fetchDonationCauses()}
                className="h-[44px] px-[24px] border border-[#e2e8f0] text-[#4b4b4b] rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#f6f6f6] transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={() => setToast({ message: 'Donation cause settings saved successfully', type: 'success' })}
                className="h-[44px] px-[24px] bg-[var(--brand)] text-white rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#065d29] transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        )
      )}

      {/* Delete Donation Cause Confirmation Modal (Image 5 Figma) */}
      {deletingCauseName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-4">
          <div className="bg-white rounded-[24px] p-[24px] max-w-[440px] w-full flex flex-col gap-[20px] shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-[16px]">
              <div className="w-[48px] h-[48px] rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                </svg>
              </div>
              <div className="flex flex-col gap-[4px]">
                <h3 className="font-inter font-bold text-[20px] text-[#1f1f1f]">Delete Donation Cause</h3>
              </div>
            </div>
            <p className="font-inter text-[15px] text-[#666d80] leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-[#1f1f1f]">&apos;{deletingCauseName}&apos;</span>? This action cannot be undone and will remove the cause from the mobile application.
            </p>
            <div className="flex items-center justify-end gap-[12px] pt-[8px]">
              <button
                onClick={() => setDeletingCauseName(null)}
                disabled={deletingCause}
                className="h-[44px] px-[24px] border border-[#e2e8f0] text-[#4b4b4b] rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#f6f6f6] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCause}
                disabled={deletingCause}
                className="h-[44px] px-[24px] bg-[#dc2626] text-white rounded-[12px] font-inter font-medium text-[16px] hover:bg-[#b91c1c] transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingCause ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div />}>
      <SettingsPageContent />
    </Suspense>
  );
}
