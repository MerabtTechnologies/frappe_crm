import ContactsIcon from '@/components/Icons/ContactsIcon.vue'
import DealsIcon from '@/components/Icons/DealsIcon.vue'
import LeadsIcon from '@/components/Icons/LeadsIcon.vue'
import NoteIcon from '@/components/Icons/NoteIcon.vue'
import OrganizationsIcon from '@/components/Icons/OrganizationsIcon.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import TaskIcon from '@/components/Icons/TaskIcon.vue'
import LucideLayoutDashboard from '~icons/lucide/layout-dashboard'
import router from '@/router'

export const navigationItems = [
  {
    label: 'Dashboard',
    icon: LucideLayoutDashboard,
    route: 'Dashboard',
    desktopOnly: true,
  },
  { label: 'Leads', icon: LeadsIcon, route: 'Leads' },
  { label: 'Deals', icon: DealsIcon, route: 'Deals' },
  { label: 'Contacts', icon: ContactsIcon, route: 'Contacts' },
  { label: 'Organizations', icon: OrganizationsIcon, route: 'Organizations' },
  { label: 'Notes', icon: NoteIcon, route: 'Notes' },
  { label: 'Tasks', icon: TaskIcon, route: 'Tasks' },
  { label: 'Call Logs', icon: PhoneIcon, route: 'Call Logs' },
  {
    label: 'Performance Review',
    icon: 'lucide-chart-line',
    route: 'PerformanceReview',
    desktopOnly: true,
  },
  {
    label: 'Task Follow Up',
    icon: 'lucide-list-checks',
    route: 'TaskFollowUp',
  },
  { label: 'Task Tickets', icon: 'lucide-ticket', route: 'Issues' },
  { label: 'Quotation', icon: 'lucide-file-text', route: 'Quotations' },
  { label: 'Gamma', icon: 'lucide-presentation', route: 'Gammas' },
  { label: 'Event', icon: 'lucide-calendar', route: 'Events' },
  {
    label: 'Project Dashboard',
    icon: LucideLayoutDashboard,
    route: 'Project Dashboard',
    projectOnly: true,
  },
  {
    label: 'Project Tasks',
    icon: 'lucide-list-checks',
    route: 'Project Tasks',
    projectOnly: true,
  },
  {
    label: 'Projects',
    icon: 'lucide-folder',
    route: 'Projects',
    projectOnly: true,
  },
  {
    label: 'Employee Date Request',
    icon: 'lucide-calendar-clock',
    route: 'Employee Date Requests',
    projectOnly: true,
  },
  {
    label: 'Employee Project Assignment',
    icon: 'lucide-user-check',
    route: 'Employee Project Assignments',
    projectOnly: true,
  },
  {
    label: 'Timesheets',
    icon: 'lucide-clock',
    route: 'Smart Timesheets',
    projectOnly: true,
  },
]

export function getNavigationItems({
  mobile = false,
  projectManager = false,
} = {}) {
  return navigationItems.filter(
    (item) =>
      router.hasRoute(item.route) &&
      (!mobile || !item.desktopOnly) &&
      (!item.projectOnly || projectManager),
  )
}
