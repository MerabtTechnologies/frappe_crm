import { createRouter, createWebHistory } from 'vue-router'
import { usersStore } from '@/stores/users'
import { sessionStore } from '@/stores/session'
import { viewsStore } from '@/stores/views'

const routes = [
  {
    path: '/',
    name: 'Home',
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/pages/MobileNotification.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
  },
  {
    alias: '/leads',
    path: '/leads/view/:viewType?',
    name: 'Leads',
    component: () => import('@/pages/Leads.vue'),
  },
  {
    path: '/leads/:leadId',
    name: 'Lead',
    component: () => import(`@/pages/${handleMobileView('Lead')}.vue`),
    props: true,
  },
  {
    alias: '/deals',
    path: '/deals/view/:viewType?',
    name: 'Deals',
    component: () => import('@/pages/Deals.vue'),
  },
  {
    path: '/deals/:dealId',
    name: 'Deal',
    component: () => import(`@/pages/${handleMobileView('Deal')}.vue`),
    props: true,
  },
  {
    alias: '/notes',
    path: '/notes/view/:viewType?',
    name: 'Notes',
    component: () => import('@/pages/Notes.vue'),
  },
  {
    alias: '/tasks',
    path: '/tasks/view/:viewType?',
    name: 'Tasks',
    component: () => import('@/pages/Tasks.vue'),
  },
  {
    alias: '/contacts',
    path: '/contacts/view/:viewType?',
    name: 'Contacts',
    component: () => import('@/pages/Contacts.vue'),
  },
  {
    path: '/contacts/:contactId',
    name: 'Contact',
    component: () => import(`@/pages/${handleMobileView('Contact')}.vue`),
    props: true,
  },
  {
    alias: '/organizations',
    path: '/organizations/view/:viewType?',
    name: 'Organizations',
    component: () => import('@/pages/Organizations.vue'),
  },
  {
    path: '/organizations/:organizationId',
    name: 'Organization',
    component: () => import(`@/pages/${handleMobileView('Organization')}.vue`),
    props: true,
  },
  {
    alias: '/call-logs',
    path: '/call-logs/view/:viewType?',
    name: 'Call Logs',
    component: () => import('@/pages/CallLogs.vue'),
  },
  {
    path: '/data-import',
    name: 'DataImportList',
    component: () => import('@/pages/DataImport.vue'),
  },
  {
    path: '/data-import/doctype/:doctype',
    name: 'NewDataImport',
    component: () => import('@/pages/DataImport.vue'),
    props: true,
  },
  {
    path: '/data-import/:importName',
    name: 'DataImport',
    component: () => import('@/pages/DataImport.vue'),
    props: true,
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/pages/Welcome.vue'),
  },
  {
    path: '/:invalidpath',
    name: 'Invalid Page',
    component: () => import('@/pages/InvalidPage.vue'),
  },
  {
    path: '/not-permitted',
    name: 'Not Permitted',
    component: () => import('@/pages/NotPermitted.vue'),
  },
  {
    alias: '/quotations',
    path: '/quotations/view/:viewType?',
    name: 'Quotations',
    component: () => import('@/pages/Quotations.vue'),
  },
  {
    path: '/quotations/:quotationId',
    name: 'Quotation',
    component: () => import(`@/pages/${handleMobileView('Quotation')}.vue`),
    props: true,
  },
  {
    alias: '/Gammas',
    path: '/Gammas/view/:viewType?',
    name: 'Gammas',
    component: () => import('@/pages/GammaProposals.vue'),
  },
  {
    path: '/Gammas/:GammaId',
    name: 'Gamma',
    component: () => import(`@/pages/${handleMobileView('GammaProposal')}.vue`),
    props: true,
  },
  {
    alias: '/events',
    path: '/events/view/:viewType?',
    name: 'Events',
    component: () => import('@/pages/Events.vue'),
  },
  {
    path: '/events/:eventId',
    name: 'Event',
    component: () => import(`@/pages/${handleMobileView('Event')}.vue`),
    props: true,
  },
  {
    path: '/not-permitted-project',
    name: 'Not Permitted Project',
    component: () => import('@/pages/NotPermittedProject.vue'),
  },
  // add Additional routes
    {
    alias: '/projects',
    path: '/projects/view/:viewType?',
    name: 'Projects',
    component: () => import('@/pages/Projects.vue'),
  },
  {
    path: '/projects/:projectId',
    name: 'Project',
    component: () => import(`@/pages/${handleMobileView('Project')}.vue`),
    props: true,
  },
  {
    alias: '/project-tasks',
    path: '/project-tasks/view/:viewType?',
    name: 'Project Tasks',
    component: () => import('@/pages/ProjectTasks.vue'),
  },
  {
    path: '/project-tasks/:taskId',
    name: 'Project Task',
    component: () => import(`@/pages/${handleMobileView('ProjectTask')}.vue`),
    props: true,
  },
  {
    alias: '/employee-date-requests',
    path: '/employee-date-requests/view/:viewType?',
    name: 'Employee Date Requests',
    component: () => import('@/pages/EmployeeDateRequests.vue'),
  },
  {
    path: '/employee-date-requests/:requestId',
    name: 'Employee Date Request',
    component: () => import(`@/pages/${handleMobileView('EmployeeDateRequest')}.vue`),
    props: true,
  },
  {
    alias: '/employee-project-assignments',
    path: '/employee-project-assignments/view/:viewType?',
    name: 'Employee Project Assignments',
    component: () => import('@/pages/EmployeeProjectAssignments.vue'),
  },
  {
    path: '/employee-project-assignments/:assignmentId',
    name: 'Employee Project Assignment',
    component: () => import(`@/pages/${handleMobileView('EmployeeProjectAssignment')}.vue`),
    props: true,
  },
  {
    alias: '/timesheets',
    path: '/timesheets/view/:viewType?',
    name: 'Smart Timesheets',
    component: () => import('@/pages/SmartTimesheets.vue'),
  },
  {
    path: '/timesheets/:timesheetId',
    name: 'Smart Timesheet',
    component: () => import(`@/pages/${handleMobileView('SmartTimesheet')}.vue`),
    props: true,
  },
  {
    alias: '/project-dashboard',
    path: '/project-dashboard',
    name: 'Project Dashboard',
    component: () => import('@/pages/DashboardProject.vue'),
  },
 
  // router.js
  {
  path: '/performance-review',
  name: 'PerformanceReview',
  component: () => import('@/components/DealPerfomanceSummary.vue'),
},



]

const handleMobileView = (componentName) => {
  return window.innerWidth < 768 ? `Mobile${componentName}` : componentName
}

let router = createRouter({
  history: createWebHistory('/crm'),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const { isLoggedIn } = sessionStore()
  const { users, isWebsiteUser, isProjectManager } = usersStore()

  if (isLoggedIn && !users.fetched) {
    try {
      await users.promise
    } catch (error) {
      console.error('Error loading users', error)
    }
  }

  if (isLoggedIn && to.name !== 'Not Permitted' && isWebsiteUser()) {
    next({ name: 'Not Permitted' })
  } else if (to.name === 'Home' && isLoggedIn) {
    const { views, getDefaultView } = viewsStore()
    await views.promise

    let defaultView = getDefaultView()
    if (!defaultView) {
      next({ name: 'Leads' })
      return
    }

    let { route_name, type, name, is_standard } = defaultView
    route_name = route_name || 'Leads'

    if (name && !is_standard) {
      next({
        name: route_name,
        params: { viewType: type },
        query: { view: name },
      })
    } else {
      next({ name: route_name, params: { viewType: type } })
    }
  } else if (!isLoggedIn) {
    window.location.href = '/login?redirect-to=/crm'
  } else if (to.matched.length === 0) {
    next({ name: 'Invalid Page' })
  } else if (['Deal', 'Lead','Employee Date Request','Employee Project Assignment','Project','Project Task', 'Smart Timesheet'].includes(to.name) && !to.hash) {
    let storageKey = to.name === 'Deal' ? 'lastDealTab' : 'lastLeadTab'
    const activeTab = localStorage.getItem(storageKey) || 'activity'
    const hash = '#' + activeTab
    next({ ...to, hash })
  } else if (
              (to.name === 'Smart Timesheet' && !isProjectManager()) || 
              (to.name === 'Smart Timesheets' && !isProjectManager()) ||
              (to.name === 'Projects' && !isProjectManager()) ||
              (to.name === 'Project' && !isProjectManager()) ||
              (to.name === 'Project Tasks' && !isProjectManager()) ||
              (to.name === 'Project Task' && !isProjectManager()) ||
              (to.name === 'Project Plannings' && !isProjectManager()) ||
              (to.name === 'Project Planning' && !isProjectManager()) ||
              (to.name === 'Employee Date Requests' && !isProjectManager()) ||
              (to.name === 'Employee Date Request' && !isProjectManager()) ||
              (to.name === 'Employee Project Assignments' && !isProjectManager()) ||
              (to.name === 'Employee Project Assignment' && !isProjectManager()) ||
              (to.name === 'Project Dashboard' && !isProjectManager()) ||
              (to.name === 'Performance Review' && !isSalesMasterManager())
            ) {
                next({ name: 'Not Permitted Project' })
  } else {
    next()
  }
})

export default router
