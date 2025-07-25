import { HomeIcon, InfoIcon,Megaphone, CalendarIcon, UserIcon, PackageIcon, AirplayIcon } from 'lucide-react'; // Import icons from lucide-react

export type MenuItem = {
  id: number;
  title: string;
  path: string;
  newTab: boolean;
  icon: React.ElementType; // Store the icon as a component (React.ElementType)
};

export const menuData: MenuItem[] = [
  {
    id: 1,
    title: "Pricing",
    path: "/pricing",
    newTab: false,
    icon: PackageIcon, // Just reference the icon component
  },
  {
    id: 2,
    title: "About",
    path: "/about",
    newTab: false,
    icon: InfoIcon, // Just reference the icon component
  },
  {
    id: 3,
    title: "Timetable",
    path: "/timetable",
    newTab: false,
    icon: CalendarIcon, // Just reference the icon component
  },
  {
    id: 4,
    title: "Info",
    path: "/info",
    newTab: false,
    icon: InfoIcon, // Just reference the icon component
  },
  // {
  //   id: 5,
  //   title: "AeroVoice",
  //   path: "/flights",
  //   newTab: false,
  //   icon: AirplayIcon, // Just reference the icon component
  // },
  
  {
    id: 6,
    title: 'Announcements templates',
    path: '/templatesAnnouncements',
    icon: Megaphone,
    newTab: true
  },
  {
    id: 7,
    title: 'Flight Board Status',
    path: '/flightsBoard',
    icon: AirplayIcon,
    newTab: true
  },

];
