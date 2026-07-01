export class CRMTask {
  onRender() {
    if (this.doc.reference_doctype && this.doc.reference_docname) {
      let label = this.doc.reference_doctype.replace('CRM ', '')

      const routeMap = {
        'CRM Lead': { name: 'Lead', paramKey: 'leadId' },
        'CRM Deal': { name: 'Deal', paramKey: 'dealId' },
        'Smart Project': { name: 'Project', paramKey: 'projectId' },
        'Smart Task': { name: 'Project Task', paramKey: 'taskId' },
        'Smart Timesheet': { name: 'Smart Timesheet', paramKey: 'timesheetId' },
        'Employee Date Request': {
          name: 'Employee Date Request',
          paramKey: 'requestId',
        },
        'Employee Project Assignment': {
          name: 'Employee Project Assignment',
          paramKey: 'assignmentId',
        },
        Event: { name: 'Event', paramKey: 'eventId' },
        'Gamma Proposal': { name: 'Gamma', paramKey: 'GammaId' },
        Quotation: { name: 'Quotation', paramKey: 'quotationId' },
      }

      this.actions = [
        {
          name: 'Redirect Action',
          label: __('Open {0}', [label]),
          onClick: (close) => {
            if (!this.doc.reference_docname) return
            const route =
              routeMap[this.doc.reference_doctype] ||
              routeMap['CRM Lead']
            this.router.push({
              name: route.name,
              params: { [route.paramKey]: this.doc.reference_docname },
            })
            close?.()
          },
        },
      ]
    }
  }
}
