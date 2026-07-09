<template>
    <Dialog v-model="show" :options="{ size: 'xl' }">
        <template #body-title>
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div>
                        <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">
                            {{ unwrap(_task.subject) || unwrap(_task.title) || __('Untitled Issue') }}
                        </h3>
                        <div class=" flex items-center gap-2">
                            <div class="text-sm text-ink-gray-5">{{ unwrap(_task.name) }}</div>
                            <Tooltip :text="_task.creation?.label">
                                <div class="text-xs text-ink-gray-5">{{ _task.creation?.timeAgo }}</div>
                            </Tooltip>
                        </div>
                    
                    <div class="mt-2 flex items-center gap-2">
                        <div class="flex gap-2 pe-1 items-center">
                            <div class="text-xs text-ink-gray-5">{{ __('Status: ') }}</div>
                            <IssueStatusIcon v-if="unwrap(_task.name)" :status="unwrap(_task.status)" />
                            <div class=" text-sm">{{ unwrap(_task.status) }}</div>
                        </div>
                        <div class="flex gap-2 pe-1 items-center">
                            <div class="text-xs text-ink-gray-5">{{ __('Priority: ') }}</div>
                            <TaskPriorityIcon v-if="unwrap(_task.name)" :priority="unwrap(_task.priority)" />
                            <div class=" text-sm">{{ unwrap(_task.priority) }}</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="text-xs text-ink-gray-5">{{ __('Issue Type: ') }}</div>
                            <div class="text-sm text-ink-gray-9">{{ unwrap(_task.issue_type) || __('-') }}</div>
                        </div>

                    </div>
                </div>
                </div>
                <div class="flex items-center gap-2">
                    <Button v-if="_task.reference_docname" size="sm" :label="_task.reference_doctype == 'CRM Deal'
                            ? __('Open Deal')
                            : _task.reference_doctype == 'Project'
                                ? __('Open Project')
                                : _task.reference_doctype == 'Project Task'
                                    ? __('Open Project Task')
                                    : __('Open Lead')
                        " :iconRight="ArrowUpRightIcon" @click="redirect" />
                </div>
            </div>
        </template>

        <template #body-content>
            <div class="flex flex-col gap-4">
                <div class="space-y-4">
                    <div>
                        <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Subject') }}</div>
                        <TextInput ref="subject" disabled
                            :label="__('Subject')" v-model="_task.subject" :placeholder="__('Call with John Doe')" 
                        />
                        <div class="mb-1.5 mt-1 text-xs text-ink-gray-5">{{ __('Task') }}</div>
                        <div>
                            <TextInput disabled :label="__('Task')" v-model="taskSubject" :placeholder="__('No Task')" />
                            <!-- <div class="text-sm text-ink-gray-7 truncate max-w-xs">{{ taskSubject || __('-') }}</div> -->
                        </div>
                        
                        <div v-if="_task.custom_assigned_to" class="mb-1.5 mt-1 text-xs text-ink-gray-5">{{ __('Assign To') }}</div>
                        <TextInput v-if="_task.custom_assigned_to" disabled :label="__('Assign To')" v-model="_task.custom_assigned_to" :placeholder="__('John Doe')" />
                    

                        <div class="mt-3">
                            <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Description') }}</div>
                            <TextEditor :editable="false"
                                :content="unwrap(_task.description)"
                                editor-class="!prose-sm overflow-auto min-h-[180px] max-h-80 py-1.5 px-2 rounded bg-transparent"
                                @change="(val) => (_task.description = val)" />
                        </div>


                    </div>
                </div>
            </div>

            <div class="mt-4">
                <h4 class="text-lg font-medium mb-2">{{ __('Comments') }}</h4>
                <div class="bg-surface-gray-2 rounded p-3 max-h-72 overflow-auto space-y-3">
                    <div v-if="commentsLoading" class="text-sm text-ink-gray-5">{{ __('Loading comments...') }}</div>
                    <div v-else-if="!comments.length" class="text-sm text-ink-gray-5">{{ __('No comments yet') }}</div>
                    <div v-else>
                        <div v-for="c in comments" :key="c.name" class="flex gap-3 items-start mb-2">
                            <Avatar :label="c.comment_by || c.comment_email" size="sm" />
                            <div class="flex-1">
                                <div class="flex items-center justify-between">
                                    <div class="text-sm font-medium">{{ c.comment_by || c.comment_email }}</div>
                                    <Tooltip :text="formatFullDatetime(c.creation)">
                                        <div class="text-xs text-ink-gray-5">{{ formateDatetime(c.creation) }}</div>
                                    </Tooltip>
                                </div>
                                <div class="mt-1 text-sm text-ink-gray-9">
                                    <TextEditor :editable="false" :content="c.content"
                                        editor-class="!prose-sm max-h-40 overflow-auto bg-transparent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Add a comment') }}</div>
                    <TextEditor :editable="true" :content="newComment" @change="(val) => (newComment = val)"
                        editor-class="!prose-sm min-h-[80px] max-h-40" :placeholder="__('Write a comment...')" />
                    <div class="flex justify-between mt-2 gap-2">
                        <Button 
                            :label="__('Open Task')" 
                            @click="openLinkedTask"
                            :iconRight="ArrowUpRightIcon"
                        />
                    
                        
                        <div class="flex self-end gap-2">
                            <Button v-if="_task.status !== 'Closed'" :label="__('Close Ticket')" :loading="addingComment"
                                @click="closeIssue('Closed')" />
                            <Button v-if="_task.status !== 'Resolved'" :label="__('Resolved')" :loading="addingComment"
                                @click="closeIssue('Resolved')" />
                                
                            <Button :label="__('Post Comment')" variant="solid" :loading="addingComment"
                                @click="postComment" />
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- <template #actions>
            <div class="flex justify-end">
                <Button :label="editMode ? __('Update') : __('Create')" variant="solid"
                    :loading="createTaskResource.loading || updateTaskResource.loading" @click="updateTask" />
            </div>
        </template> -->
    </Dialog>
</template>

<script setup>
import IssueStatusIcon from '@/components/Icons/IssueStatusIcon.vue'
import TaskPriorityIcon from '@/components/Icons/TaskPriorityIcon.vue'
import ArrowUpRightIcon from '@/components/Icons/ArrowUpRightIcon.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import Link from '@/components/Controls/Link.vue'
import { taskPriorityOptions, getFormat, toServerDatetime } from '@/utils'
import { usersStore } from '@/stores/users'
import { useTelemetry } from 'frappe-ui/frappe'
import {
    Avatar,
    TextEditor,
    Dropdown,
    Tooltip,
    DateTimePicker,
    createResource,
    toast,
    TextInput,
    FormLabel,
} from 'frappe-ui'
import { useOnboarding } from 'frappe-ui/frappe'
import { ref, watch, nextTick, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { getMeta } from '@/stores/meta'
import { useDocument } from '@/data/document'



const props = defineProps({
    task: {
        type: Object,
        default: {},
    },
    doctype: {
        type: String,
        default: 'CRM Lead',
    },
    doc: {
        type: String,
        default: '',
    },
})

const show = defineModel()
const issues = defineModel('reloadIssues')

const emit = defineEmits(['reloadIssues', 'after'])

const router = useRouter()
const { users, getUser } = usersStore()
const { updateOnboardingStep } = useOnboarding('frappecrm')
const { capture } = useTelemetry()

const { getFormattedPercent, getFormattedFloat, getFormattedCurrency, getFields } = getMeta(props.doctype)

const { triggerOnChange, triggerOnLoad, assignees, permissions, document, error } = useDocument(
    'Issue',
    props.task.name,
    { fields: '*', auto: true }
)

const comments = ref([])
const commentsLoading = ref(false)
const newComment = ref('')
const addingComment = ref(false)


const subject = ref(null)
const editMode = ref(false)
const _task = ref({
    name: null,
    subject: '',
    description: '',
    assigned_to: '',
    opening_date: null,
    opening_time: null,
    custom_task: '',
    status: 'Backlog',
    priority: 'Low',
    resolution_details: '',
    issue_type: '',
    reference_doctype: props.doctype,
    reference_docname: null,
    owner: '',
    creation: null,
})

function unwrap(value) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
        if ('label' in value && typeof value.label === 'string') return value.label
        if ('value' in value) return value.value
        if ('name' in value) return value.name
        try {
            return JSON.stringify(value)
        } catch (e) {
            return ''
        }
    }
    return value
}

function displayUser(value) {
    if (!value) return ''
    if (typeof value === 'object') {
        if (value.full_name) return value.full_name
        if (value.label) return value.label
        if (value.name) {
            const u = getUser(value.name)
            if (u && u.full_name) return u.full_name
            return value.name
        }
        return unwrap(value)
    }
    const u = getUser(value)
    if (u && u.full_name) return u.full_name
    return value
}

const validateTask = () => {
    if (!_task.value.subject) {
        toast.error(__('Subject is required'))
        return false
    }
    return true
}

const createTaskResource = createResource({
    url: 'frappe.client.insert',
    makeParams() {
        return {
            doc: {
                doctype: 'Issue',
                reference_doctype: props.doctype,
                reference_docname: props.doc || null,
                ..._task.value,
            },
        }
    },
    validate: validateTask,
    onSuccess(d) {
        if (d.name) {
            updateOnboardingStep('create_first_issue')
            capture('issue_created')
            issues.value?.reload()
            emit('after', d, true)
            show.value = false
            toast.success(__('Issue created'))
        }
    },
})

const updateTaskResource = createResource({
    url: 'frappe.client.set_value',
    makeParams() {
        return {
            doctype: 'Issue',
            name: _task.value.name,
            fieldname: _task.value,
        }
    },
    validate: validateTask,
    onSuccess(d) {
        if (d.name) {
            issues.value?.reload()
            emit('after', d)
            show.value = false
        }
    },
})

function updateTaskStatus(status) {
    _task.value.status = status
}

function updateTaskPriority(priority) {
    _task.value.priority = priority
}

async function onIssueTypeChange(option) {
    const value = option?.value ?? option
    _task.value.issue_type = value
    // if (!_task.value.name) return


    // try {
    //   const res = await call('frappe.client.set_value', {
    //     doctype: 'Issue',
    //     name: _task.value.name,
    //     fieldname: 'issue_type',
    //     value,
    //   })
    //   if (res) {
    //     issues.value?.reload()
    //     toast.success(__('Issue type updated'))
    //   }
    // } catch (e) {
    //   toast.error(__('Could not update issue type'))
    // }
}

function redirect() {
    if (!props.task?.reference_docname) return

    let name = "Deal"
    // convert doctype to route name
    if (props.task.reference_doctype == 'CRM Lead') {
        name = 'Lead'
    } else if (props.task.reference_doctype == 'CRM Deal') {
        name = 'Deal'
    } else if (props.task.reference_doctype == 'Project') {
        name = 'Project'
    } else if (props.task.reference_doctype == 'Project Task') {
        name = 'Project Task'
    }

    let params = { leadId: props.task.reference_docname }

    if (name == 'Deal') {
        params = { dealId: props.task.reference_docname }
    }
    if (name == 'Project') {
        params = { projectId: props.task.reference_docname }
    }
    if (name == 'Project Task') {
        params = { taskId: props.task.reference_docname }
    }

    router.push({ name: name, params: params })
}

async function updateTask() {
    // console.log('Task: ', _task.value);

    if (!_task.value.assigned_to) {
        _task.value.assigned_to = getUser().name
    }
    if (_task.value.name) {
        if (document && document.setValue && typeof document.setValue.submit === 'function') {
            document.setValue.submit(
                { ..._task.value },
                {
                    onSuccess: (d) => {
                        issues.value?.reload()
                        emit('after', d)
                        show.value = false
                    },
                    onError: () => {
                        toast.error(__('Could not update issue'))
                    },
                },
            )
        } else {
            updateTaskResource.submit()
        }
    } else {
        createTaskResource.submit()
    }
}

function render() {
    editMode.value = false
    nextTick(async () => {
        subject.value?.el?.focus?.()
        _task.value = { ...props.task }
        // Merge full server document if available to avoid overwriting
        // with partial `props.task` coming from list view.
        if (document?.doc) {
            _task.value = { ..._task.value, ...document.doc }
        }
        if (_task.value.subject) {
            editMode.value = true
        }
        await loadComments()
        await loadLinkedTask()

    })
    
}

const taskSubject = ref('')

const loadTaskResource = createResource({
    url: 'frappe.client.get',
    makeParams() {
        const linked = _task.value?.custom_task ?? null
        const id = linked && typeof linked === 'object' ? (linked.name ?? linked) : linked
        return { doctype: 'CRM Task', name: id }
    },
})

async function loadLinkedTask() {
    const linked = _task.value?.custom_task ?? null
    const id = linked && typeof linked === 'object' ? (linked.name ?? linked) : linked
    if (!id) {
        taskSubject.value = ''
        return
    }
    try {
        await loadTaskResource.submit()
        const res = loadTaskResource.data
        const payload = res && res.data ? res.data : res
        taskSubject.value = (payload && (payload.subject || payload.title)) || ''
    } catch (e) {
        taskSubject.value = ''
    }
}
// console.log("LOG: ", _task);

onMounted(() => show.value && render())

watch(show, (value) => {
    if (!value) return
    render()
})

watch(
    () => document.doc,
    (doc) => {
        if (!doc) return
        _task.value = { ..._task.value, ...doc }
        loadLinkedTask()
    },
    { immediate: true },
)

watch(
    () => _task.value.custom_task,
    (val) => {
        if (!val) {
            taskSubject.value = ''
            return
        }
        loadLinkedTask()
    },
)

function issueStatusOptions(action, data) {

    let options = ['Open', 'Todo', 'In Progress', 'Done', 'Canceled']
    let statusMeta = getMeta('Issue Type')
        .getFields()
        ?.find((field) => field.fieldname == 'status')

    if (statusMeta) {
        let opts = statusMeta.options
        if (!Array.isArray(opts) && typeof opts === 'string') {
            opts = opts.split('\n').map((o) => ({ label: o, value: o }))
        }
        if (Array.isArray(opts)) {
            options = opts.map((option) => option.value || option.label || option).filter(Boolean)
        }
    }
    return options.map((status) => {
        return {
            icon: () => h(IssueStatusIcon, { status }),
            label: status,
            onClick: () => action && action(status, data),
        }
    })
}

function getIssueTypeOptions() {
    let options = ['Bug', 'Feature Request', 'Task']
    let issueTypeMeta = getMeta('Issue')
        .getFields()
        ?.find((field) => field.fieldname == 'issue_type')

    if (issueTypeMeta) {
        let opts = issueTypeMeta.options
        if (!Array.isArray(opts) && typeof opts === 'string') {
            opts = opts.split('\n').map((o) => ({ label: o, value: o }))
        }
        if (Array.isArray(opts)) {
            options = opts.map((option) => option.value || option.label || option).filter(Boolean)
        }
    }
    return options.map((issue_type) => {
        return {
            label: issue_type,
            value: issue_type,
        }
    })
}

const loadCommentsResource = createResource({
    url: 'merabt_crm.custom.issue.get_comments',
    makeParams() {
        return {
            docname: _task.value.name,
        }
    },
    onSuccess(d) {
        if (d.name) {
            issues.value?.reload()
            emit('after', d)
            show.value = false
        }
    },
})

const createCommentsResource = createResource({
    url: 'merabt_crm.custom.issue.create_comment',
    makeParams() {
        return {
            docname: _task.value.name,
            content: newComment.value,
        }
    },
    // cache: ['comments', _task.value.name],
    onSuccess: (d) =>  {
        
        if (d.name && d.success == 1) {
            issues.value?.reload()
            emit('after', d)
            show.value = false
        }
    }
})

async function loadComments() {
    if (!_task.value?.name) {
        comments.value = []
        return
    }
    commentsLoading.value = true
    try {
        await loadCommentsResource.submit()
        const res = loadCommentsResource.data
        comments.value = res || []
        
    } catch (e) {
        toast.error(__('Could not load comments'))
    }
    commentsLoading.value = false
}

async function postComment() {
    if (!newComment.value || !_task.value?.name) return
    
    addingComment.value = true
    try {
        const res = await createCommentsResource.submit()
        if (res?.success == 1) {
            toast.success(__('Comment posted'))
            newComment.value = ''
            await loadComments()
        } else {
            toast.error(__('Could not post comment'))
        }
    } catch (e) {
        toast.error(__('Could not post comment'))
    }
    addingComment.value = false
}

async function closeIssue(status = 'Closed') {
    if (comments.value && comments.value.length > 0) {
        const lastComment = comments.value[comments.value.length - 1]
        _task.value.status = status
        if (document && document.setValue && typeof document.setValue.submit === 'function') {
            document.setValue.submit({ status }, {
                onSuccess: (d) => {
                    issues.value?.reload()
                    emit('after', d)
                    toast.success(__('Issue closed'))
                    show.value = false
                },
                onError: () => {
                    toast.error(__('Could not close issue'))
                },
            })
        } else {
            updateTaskResource.submit()
            issues.value?.reload()
            emit('after', _task.value)
        }
    } else {
        toast.error(__('Add comment before closing issue'))
    }

}

function combineDateTime(dateStr, timeStr) {
    
    if (!dateStr && !timeStr) return null
    const d = dateStr ? String(dateStr).trim() : ''
    let t = timeStr ? String(timeStr).trim() : ''
    if (!d) return t || null
    if (!t) return d

    const ampmMatch = t.match(/(am|pm)$/i)
    const timeMatch = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/) 

    if (ampmMatch && timeMatch) {
        let hh = parseInt(timeMatch[1], 10)
        const mm = timeMatch[2]
        const ss = timeMatch[3] || '00'
        const ampm = ampmMatch[1].toLowerCase()
        if (ampm === 'pm' && hh !== 12) hh += 12
        if (ampm === 'am' && hh === 12) hh = 0
        const hhStr = String(hh).padStart(2, '0')
        return `${d} ${hhStr}:${mm}:${ss}`
    }

    if (timeMatch) {
        const hh = String(timeMatch[1]).padStart(2, '0')
        const mm = timeMatch[2]
        const ss = timeMatch[3] || '00'
        return `${d} ${hh}:${mm}:${ss}`
    }

    return `${d} ${t}`
}

function toDate(datetime) {
    if (!datetime) return null
    if (datetime instanceof Date) return datetime
    if (typeof datetime === 'number') return new Date(datetime)
    if (typeof datetime === 'string') {
        let s = datetime.trim()
        // handle common Frappe format 'YYYY-MM-DD HH:mm:SS'
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
            s = s.replace(' ', 'T')
        }
        const d = new Date(s)
        if (!isNaN(d)) return d
        // try as UTC fallback
        const d2 = new Date(s + 'Z')
        if (!isNaN(d2)) return d2
        return null
    }
    return null
}

function formatFullDatetime(datetime) {
    const d = toDate(datetime)
    if (!d) return ''
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${time} ${dd}-${mm}-${yyyy}`
}

function formateDatetime(datetime) {
    if (!datetime) return ''
    const d = toDate(datetime)
    if (!d) return ''
    const now = new Date()
    const diffSec = Math.floor((now - d) / 1000)
    if (diffSec < 45) return 'just now'
    if (diffSec < 90) return '1 minute ago'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
    const diffWeek = Math.floor(diffDay / 7)
    if (diffWeek < 5) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`
    // older than ~month, show full date
    return formatFullDatetime(datetime)
}

function openLinkedTask() {
    const linked = _task.value?.custom_task ?? _task.value?.reference_docname ?? null
    const id = linked && typeof linked === 'object' ? (linked.name ?? linked) : linked
    if (!id) {
        toast.error(__('No linked task'))
        return
    }
    show.value = false
    try {
        router.push({ name: 'Tasks', query: { open: String(id) } })
    } catch (e) {
        // ignore navigation errors
    }
}



</script>

<style scoped>
:deep(.datepicker svg) {
    width: 0.875rem;
    height: 0.875rem;
}
</style>
