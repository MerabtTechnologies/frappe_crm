import { createRouter, createWebHistory } from 'vue-router'
import { call } from 'frappe-ui'
import { usersStore } from '@/stores/users'
import { sessionStore } from '@/stores/session'
import { viewsStore } from '@/stores/views'

export const listRouteDoctypes = {
  Leads: 'CRM Lead',
  Deals: 'CRM Deal',
  Contacts: 'Contact',
  Organizations: 'CRM Organization',
  Notes: 'FCRM Note',
  Tasks: 'CRM Task',
  'Call Logs': 'CRM Call Log',
  'Data Imports': 'Data Import',
  Quotations: 'Quotation',
  Gammas: 'Gamma Proposal',
  Events: 'Event',
  Projects: 'Smart Project',
  'Project Tasks': 'Smart Task',
  'Employee Date Requests': 'Employee Date Request',
  'Employee Project Assignments': 'Employee Project Assignment',
  'Smart Timesheets': 'Smart Timesheet',
  TaskFollowUp: 'CRM Task',
  Issues: 'Issue',
}

let setupChecked = false
export const SETUP_DONE_KEY = 'crm_setup_completed'

async function needsSetup() {
  // Client-side flag guards against re-prompting if the server persist failed.
  if (localStorage.getItem(SETUP_DONE_KEY)) return false
  const completed = await call('frappe.client.get_single_value', {
    doctype: 'FCRM Settings',
    field: 'setup_completed',
  })
  return !completed
}

async function getSetupRedirect(to, isAdminUser) {
  if (to.name === 'Setup') {
    const allowed = isAdminUser && (await needsSetup().catch(() => false))
    return allowed ? null : { name: 'Home', query: to.query }
  }
  if (!isAdminUser || setupChecked) return null
  setupChecked = true
  const required = await needsSetup().catch(() => false)
  return required ? { name: 'Setup', query: to.query } : null
}

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
    alias: '/data-import',
    path: '/data-import/view/:viewType?',
    name: 'Data Imports',
    component: () => import('@/pages/DataImports.vue'),
  },
  // one page across these routes, so an import stays open when its URL changes
  // after the first save
  {
    path: '/data-import/doctype/:doctype?',
    name: 'NewDataImport',
    component: () => import('@/pages/DataImport.vue'),
    meta: { viewKey: 'data-import' },
  },
  {
    path: '/data-import/:importName',
    name: 'DataImport',
    component: () => import('@/pages/DataImport.vue'),
    meta: { viewKey: 'data-import' },
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/pages/Welcome.vue'),
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('@/pages/Setup.vue'),
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
    component: () =>
      import(`@/pages/${handleMobileView('EmployeeDateRequest')}.vue`),
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
    component: () =>
      import(`@/pages/${handleMobileView('EmployeeProjectAssignment')}.vue`),
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
    component: () =>
      import(`@/pages/${handleMobileView('SmartTimesheet')}.vue`),
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
  {
    alias: '/task-follow-up',
    path: '/task-follow-up/view/:viewType?',
    name: 'TaskFollowUp',
    component: () => import('@/pages/TaskFollowUp.vue'),
  },
  {
    alias: '/task-issues',
    path: '/task-issues/view/:viewType?',
    name: 'Issues',
    component: () => import('@/pages/TaskIssues.vue'),
  },
  {
    path: '/task-issues/:issueId',
    name: 'Issue',
    component: () => import(`@/pages/TaskIssues.vue`),
    props: true,
  },
]

const handleMobileView = (componentName) => {
  return window.innerWidth < 768 ? `Mobile${componentName}` : componentName
}

let router = createRouter({
  history: createWebHistory('/crm'),
  routes,
})

export async function beforeNavigation(to, from, next) {
  router.previousRoute = from

  const { isLoggedIn, user } = sessionStore()
  const { users, isProjectManager, isCrmUser, isAdmin } = usersStore()

  if (isLoggedIn && !users.fetched) {
    try {
      await users.promise
    } catch (error) {
      console.error('Error loading users', error)
      if (error?.exc_type !== 'PermissionError') {
        return next(false)
      }
    }
  }

  if (isLoggedIn && isCrmUser()) {
    const isAdminUser = isAdmin() || user === 'Administrator'
    const redirect = await getSetupRedirect(to, isAdminUser)
    if (redirect) return next(redirect)
  }

  if (isLoggedIn && to.name !== 'Not Permitted' && !isCrmUser()) {
    next({ name: 'Not Permitted' })
  } else if (to.name === 'Not Permitted' && isLoggedIn && isCrmUser()) {
    next({ name: 'Home' })
  } else if (
    isLoggedIn &&
    [
      'Smart Timesheet',
      'Smart Timesheets',
      'Project',
      'Projects',
      'Project Task',
      'Project Tasks',
      'Employee Date Request',
      'Employee Date Requests',
      'Employee Project Assignment',
      'Employee Project Assignments',
      'Project Dashboard',
    ].includes(to.name) &&
    !isProjectManager()
  ) {
    next({ name: 'Not Permitted Project' })
  } else if (to.name === 'Home' && isLoggedIn) {
    const { views, getDefaultView } = viewsStore()
    await views.promise

    let defaultView = getDefaultView()
    if (!defaultView) {
      next({ name: 'Leads', query: to.query })
      return
    }

    let { route_name, type, name, is_standard } = defaultView
    if (!listRouteDoctypes[route_name]) {
      return next({
        name: 'Leads',
        params: { viewType: 'list' },
        query: to.query,
      })
    }

    if (name && !is_standard) {
      next({
        name: route_name,
        params: { viewType: type },
        query: { ...to.query, view: name },
      })
    } else {
      next({ name: route_name, params: { viewType: type }, query: to.query })
    }
  } else if (!isLoggedIn) {
    window.location.href = '/login?redirect-to=/crm'
  } else if (to.matched.length === 0) {
    next({ name: 'Invalid Page' })
  } else if (['Deal', 'Lead'].includes(to.name) && !to.hash) {
    let storageKey = to.name === 'Deal' ? 'lastDealTab' : 'lastLeadTab'
    const storedTab = localStorage.getItem(storageKey) || 'activity'
    const activeTab = /^\d+$/.test(storedTab)
      ? 'activity'
      : storedTab.toLowerCase().replace(/\s+/g, '-')
    const hash = '#' + activeTab
    next({ ...to, hash })
  } else if (listRouteDoctypes[to.name] && !to.query?.view) {
    const { views, standardViews, getDefaultView } = viewsStore()
    await views.promise

    const viewType = to.params?.viewType ?? ''
    const standardViewTypes = ['list', 'kanban', 'group_by']

    if (!viewType) {
      const doctype = listRouteDoctypes[to.name]
      let defaultViewType = 'list'

      let globalDefault = getDefaultView(to.name)
      if (globalDefault) {
        defaultViewType = globalDefault.type || 'list'
        if (globalDefault.name && !globalDefault.is_standard) {
          next({
            name: to.name,
            params: { viewType: defaultViewType },
            query: { ...to.query, view: globalDefault.name },
          })
          return
        }
      }

      for (const viewType of standardViewTypes) {
        const standardView = standardViews?.[doctype + ' ' + viewType]
        if (standardView?.is_default) {
          defaultViewType = viewType
          break
        }
      }

      next({
        name: to.name,
        params: { viewType: defaultViewType },
        query: to.query,
      })
    } else if (!standardViewTypes.includes(viewType)) {
      const viewNameOrLabel = viewType

      let view = views.data?.find(
        (v) =>
          v.dt === listRouteDoctypes[to.name] &&
          (v.name == viewNameOrLabel || v.label === viewNameOrLabel),
      )

      if (view) {
        next({
          name: to.name,
          params: { viewType: view.type || 'list' },
          query: { ...to.query, view: view.name },
        })
      } else {
        next({
          name: to.name,
          params: { viewType: 'list' },
          query: to.query,
        })
      }
    } else {
      next()
    }
  } else {
    next()
  }
}

router.beforeEach(beforeNavigation)

export default router
