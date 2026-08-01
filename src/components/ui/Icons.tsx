'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export const UserIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const DashboardIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
  </svg>
);

export const PrayerIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.4 14.4C14.1702 13.7926 13.965 12.91 13.2 12.4C12 11.6 10.8 11.2 10.8 10C10.8 8.8 10.4 6.4 10.4 6.4L10.9564 5.81442C12.3148 6.4197 13.6 4.70457 13.6 3.6C13.6 2.49543 12.7046 1.6 11.6 1.6C10.4954 1.6 9.6 2.49543 9.6 3.6C9.6 4.4 8.96 4.88 8 5.2C6.8 5.6 5.2 6.4 5.2 10.4C5.2 13.6 6.66666 14.6666 7.2 15.2C4.64 15.2 4 16.8 4 17.6H14.4C15.2837 17.6 16 16.8837 16 16C16 15.1163 15.2837 14.4 14.4 14.4ZM14.4 14.4C8.21752 14.4 7.64794 10.6666 8 8.8"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MegaphoneIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.4386 3.67586L6.8946 6.3371C6.46793 6.54191 6.01203 6.59322 5.54729 6.48911C5.24314 6.42097 5.09105 6.38691 4.96858 6.37292C3.44786 6.19927 2.5 7.40285 2.5 8.78692V9.54642C2.5 10.9305 3.44786 12.1341 4.96858 11.9604C5.09105 11.9464 5.24315 11.9123 5.54729 11.8442C6.01203 11.7401 6.46793 11.7914 6.8946 11.9962L12.4386 14.6575C13.7112 15.2684 14.3475 15.5738 15.057 15.3357C15.7664 15.0977 16.0099 14.5867 16.497 13.565C17.8343 10.7593 17.8343 7.57404 16.497 4.7683C16.0099 3.74655 15.7664 3.23567 15.057 2.99758C14.3475 2.7595 13.7112 3.06495 12.4386 3.67586Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.833 14.1666V14.5833C10.833 15.6534 10.833 16.1884 10.6463 16.4905C10.3974 16.8932 9.94234 17.1208 9.47076 17.0782C9.11709 17.0464 8.68909 16.7253 7.83301 16.0833L6.83301 15.3333C6.01845 14.7224 5.83301 14.3515 5.83301 13.3333V12.0833" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.25 11.6667V6.66667" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CampaignIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15.5742 8.28414C15.2825 6.66627 14.3743 5.46156 13.5849 4.75395C13.3552 4.54804 13.2403 4.44508 12.9866 4.3498C12.7329 4.25452 12.5148 4.25452 12.0786 4.25452H11.1206C10.6844 4.25452 10.4663 4.25452 10.2126 4.3498C9.95889 4.44508 9.84401 4.54804 9.61433 4.75395C8.82489 5.46156 7.91677 6.66627 7.62506 8.28414C7.40802 9.48782 8.61264 10.4001 9.95888 10.4001H13.2403C14.5866 10.4001 15.7912 9.48782 15.5742 8.28414Z" stroke="currentColor" strokeWidth="1.2" />
    <path d="M3.59961 11.2H5.51547C5.75079 11.2 5.98287 11.2531 6.19335 11.3549L7.82693 12.1453C8.03737 12.2471 8.26945 12.3001 8.50481 12.3001H9.33889C10.1456 12.3001 10.7996 12.933 10.7996 13.7136C10.7996 13.7451 10.778 13.7729 10.7466 13.7815L8.71393 14.3436C8.34929 14.4444 7.95881 14.4093 7.61961 14.2451L5.8733 13.4003M10.7996 13.2L14.4738 12.0711C15.1252 11.8682 15.8293 12.1088 16.2373 12.6739C16.5323 13.0823 16.4122 13.6674 15.9824 13.9154L9.96993 17.3844C9.58753 17.6051 9.13633 17.6589 8.71577 17.5341L3.59961 16.0159" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SettingsIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.9163 9.99998C12.9163 11.6108 11.6105 12.9166 9.99967 12.9166C8.38884 12.9166 7.08301 11.6108 7.08301 9.99998C7.08301 8.38915 8.38884 7.08331 9.99967 7.08331C11.6105 7.08331 12.9163 8.38915 12.9163 9.99998Z" stroke="currentColor" strokeWidth="1.25" />
    <path d="M17.5095 11.7472C17.9444 11.6299 18.1619 11.5712 18.2477 11.4591C18.3337 11.347 18.3337 11.1666 18.3337 10.8058V9.19441C18.3337 8.83366 18.3337 8.65324 18.2477 8.54116C18.1618 8.42899 17.9444 8.37033 17.5095 8.25306C15.8842 7.81473 14.8669 6.1155 15.2864 4.5008C15.4017 4.05673 15.4594 3.83471 15.4043 3.70448C15.3492 3.57426 15.1912 3.48453 14.8751 3.30504L13.4378 2.48902C13.1277 2.3129 12.9726 2.22484 12.8334 2.24359C12.6942 2.26234 12.5372 2.41902 12.223 2.73235C11.007 3.94548 8.99499 3.94543 7.77894 2.73228C7.46485 2.41893 7.30781 2.26227 7.1686 2.24351C7.0294 2.22476 6.8743 2.31282 6.5641 2.48893L5.12686 3.30497C4.81077 3.48443 4.65272 3.57417 4.59764 3.70437C4.54256 3.83458 4.60022 4.05663 4.71553 4.50074C5.1348 6.11549 4.11676 7.81477 2.49118 8.25308C2.05626 8.37033 1.8388 8.42899 1.75289 8.54108C1.66699 8.65324 1.66699 8.83366 1.66699 9.19441V10.8058C1.66699 11.1666 1.66699 11.347 1.75289 11.4591C1.83878 11.5712 2.05625 11.6299 2.49118 11.7472C4.11649 12.1855 5.13373 13.8847 4.71426 15.4994C4.5989 15.9435 4.54122 16.1655 4.59629 16.2957C4.65138 16.426 4.80943 16.5157 5.12553 16.6952L6.56278 17.5112C6.873 17.6873 7.02811 17.7754 7.16733 17.7567C7.30654 17.7379 7.46356 17.5812 7.77758 17.2678C8.99424 16.0537 11.0077 16.0537 12.2244 17.2677C12.5384 17.5812 12.6954 17.7378 12.8347 17.7566C12.9738 17.7753 13.129 17.6872 13.4392 17.5112L14.8764 16.6951C15.1926 16.5157 15.3507 16.4259 15.4057 16.2957C15.4607 16.1654 15.4031 15.9434 15.2877 15.4993C14.868 13.8847 15.8844 12.1856 17.5095 11.7472Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

export const BellIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 5.36662V8.14162" stroke="currentColor" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" />
    <path d="M10.0167 1.66667C6.95002 1.66667 4.46668 4.15 4.46668 7.21667V8.96667C4.46668 9.53333 4.23335 10.3833 3.94168 10.8667L2.88335 12.6333C2.23335 13.725 2.68335 14.9417 3.88335 15.3417C7.86668 16.6667 12.175 16.6667 16.1583 15.3417C17.2833 14.9667 17.7667 13.65 17.1583 12.6333L16.1 10.8667C15.8083 10.3833 15.575 9.525 15.575 8.96667V7.21667C15.5667 4.16667 13.0667 1.66667 10.0167 1.66667Z" stroke="currentColor" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" />
    <path d="M12.775 15.6832C12.775 17.2082 11.525 18.4582 9.99999 18.4582C9.24165 18.4582 8.54165 18.1415 8.04165 17.6415C7.54165 17.1415 7.22499 16.4415 7.22499 15.6832" stroke="currentColor" strokeWidth="1.25" strokeMiterlimit="10" />
  </svg>
);

export const ChevronDownIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16.6 7.45833L11.1667 12.8917C10.525 13.5333 9.475 13.5333 8.83333 12.8917L3.4 7.45833" stroke="currentColor" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronLeftIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronRightIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const ArrowUpRightIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export const CalendarIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const ClockIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const PlusIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const EditIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const EyeIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ListIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// Grid view icon matching Figma content switcher (active state)
export const GridViewIcon = ({ className = '', size = 18 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Three horizontal rows with left dot + line */}
    <circle cx="3" cy="4" r="1" fill="currentColor" stroke="none" />
    <line x1="6" y1="4" x2="15" y2="4" />
    <circle cx="3" cy="9" r="1" fill="currentColor" stroke="none" />
    <line x1="6" y1="9" x2="15" y2="9" />
    <circle cx="3" cy="14" r="1" fill="currentColor" stroke="none" />
    <line x1="6" y1="14" x2="15" y2="14" />
  </svg>
);

// Calendar view icon matching Figma content switcher
export const CalendarViewIcon = ({ className = '', size = 18 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="3" width="14" height="13" rx="2" />
    <line x1="2" y1="7" x2="16" y2="7" />
    <line x1="6" y1="3" x2="6" y2="1" />
    <line x1="12" y1="3" x2="12" y2="1" />
    {/* Calendar grid dots */}
    <circle cx="6" cy="10" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="9" cy="10" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="12" cy="10" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="6" cy="13" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="9" cy="13" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export const FilterIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
export const CloseIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const UploadIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const StopCircleIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" />
  </svg>
);

export const TrashIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const ActivityPulseIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const UsersIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const PoundIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 7c0-1.1-.9-2-2-2h-3.5C10.5 5 9 6.5 9 8.5V14c0 1.1-.9 2-2 2h0" />
    <path d="M6 16h12" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

export const StarIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const SearchIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const SendIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const InfoIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const DownloadIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const MapPinIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);


