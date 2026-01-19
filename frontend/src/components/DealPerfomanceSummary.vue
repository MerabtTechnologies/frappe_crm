<template>
  <div class="performance-review-container p-4">
    <!-- Header with Chart Logo -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <!-- Chart Icon -->
        <div class="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Sales Performance</h1>
          <p class="text-gray-600">Actual deal and lead data from CRM</p>
        </div>
      </div>
    </div>

  <!-- Date Filters -->
<div class="bg-white rounded-lg border p-4 mb-6">
  <!-- Quick Date Range Buttons -->
  <div class="flex flex-wrap gap-2 mb-4">
    <button
      @click="setDateRange('7days')"
      class="px-3 py-1.5 text-sm rounded-md border"
      :class="dateRange === '7days' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
    >
      Last 7 Days
    </button>
    <button
      @click="setDateRange('30days')"
      class="px-3 py-1.5 text-sm rounded-md border"
      :class="dateRange === '30days' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
    >
      Last 30 Days
    </button>
    <button
      @click="setDateRange('60days')"
      class="px-3 py-1.5 text-sm rounded-md border"
      :class="dateRange === '60days' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
    >
      Last 60 Days
    </button>
    <button
      @click="setDateRange('90days')"
      class="px-3 py-1.5 text-sm rounded-md border"
      :class="dateRange === '90days' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
    >
      Last 90 Days
    </button>
    <button
      @click="setDateRange('custom')"
      class="px-3 py-1.5 text-sm rounded-md border"
      :class="dateRange === 'custom' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
    >
      Custom Range
    </button>
  </div>

  <!-- Date Inputs (only visible when custom range is selected) -->
  <div v-if="dateRange === 'custom'" class="flex flex-col md:flex-row md:items-end gap-4">
    <div class="flex-1">
      <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
      <input
        type="date"
        v-model="fromDate"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div class="flex-1">
      <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
      <input
        type="date"
        v-model="toDate"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div class="flex gap-2">
      <button
        @click="applyFilters"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Apply Filters
      </button>
      <button
        @click="resetFilters"
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        Reset
      </button>
    </div>
  </div>
  
  <!-- Active filters display -->
  <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-gray-200">
    <div class="text-sm text-gray-600">
      Showing data from <strong>{{ formatDateDisplay(fromDate) }}</strong> to <strong>{{ formatDateDisplay(toDate) }}</strong>
      <span v-if="dateRange !== 'custom'" class="ml-2 text-blue-600">({{ getDateRangeLabel() }})</span>
    </div>
  </div>
</div>
    <!-- Loading -->
    <div v-if="loading" class="text-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-3 text-gray-600">Loading CRM data...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div class="text-red-600 font-medium mb-2">Error</div>
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button @click="fetchData" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Try Again
      </button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Summary Cards -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Deal Summary -->
          <div class="bg-white p-4 rounded-lg border">
            <div class="text-sm text-gray-500">Total Deals</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">
              {{ dealSummary.total_deals || 0 }}
            </div>
            <div class="text-xs text-gray-500 mt-1">Sum of all deal counts</div>
          </div>
          
          <div class="bg-white p-4 rounded-lg border">
            <div class="text-sm text-gray-500">Deal Value</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">
              {{ formatCurrency(dealSummary.total_value || 0) }}
            </div>
            <div class="text-xs text-gray-500 mt-1">Sum of all deal values</div>
          </div>
          
          <!-- Lead Summary -->
          <div class="bg-white p-4 rounded-lg border">
            <div class="text-sm text-gray-500">Total Leads</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">
              {{ leadSummary.total_leads || 0 }}
            </div>
            <div class="text-xs text-gray-500 mt-1">Sum of all lead counts</div>
          </div>
        </div>
      </div>

      <!-- Deal Data Table -->
      <div class="bg-white rounded-lg border overflow-hidden mb-6">
        <div class="p-4 border-b">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Deal Performance</h3>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">
                {{ dealSummary.total_deals || 0 }} deals • {{ formatCurrency(dealSummary.total_value || 0) }} value
              </span>
              <button @click="fetchData" class="text-sm text-blue-600 hover:text-blue-800">
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OWNER</th>
                <th 
                  v-for="status in dealStatuses" 
                  :key="status"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ status }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Value
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="owner in uniqueOwners" :key="owner">
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span class="text-blue-800 text-xs font-medium">
                        {{ getInitials(owner) }}
                      </span>
                    </div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ formatOwnerName(owner) }}
                    </div>
                  </div>
                </td>
                <td 
                  v-for="status in dealStatuses" 
                  :key="`deal-${owner}-${status}`"
                  class="px-4 py-3 whitespace-nowrap text-center"
                >
                  <span class="text-lg font-bold" :class="getDealCount(owner, status) > 0 ? 'text-blue-600' : 'text-gray-400'">
                    {{ getDealCount(owner, status) }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="text-lg font-bold" :class="getDealValue(owner) > 0 ? 'text-green-600' : 'text-gray-400'">
                    {{ formatCurrency(getDealValue(owner)) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td class="px-4 py-3 font-bold text-gray-900">TOTALS</td>
                <td 
                  v-for="status in dealStatuses" 
                  :key="`deal-total-${status}`"
                  class="px-4 py-3 font-bold text-gray-900 text-center"
                >
                  {{ getTotalDealsForStatus(status) }}
                </td>
                <td class="px-4 py-3 font-bold text-green-600">
                  {{ formatCurrency(dealSummary.total_value || 0) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Lead Data Table -->
      <div class="bg-white rounded-lg border overflow-hidden">
        <div class="p-4 border-b">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Lead Performance</h3>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">
                {{ leadSummary.total_leads || 0 }} leads
              </span>
              <button @click="fetchData" class="text-sm text-green-600 hover:text-green-800">
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LEAD OWNER</th>
                <th 
                  v-for="status in leadStatuses" 
                  :key="status"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ status }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Leads
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="owner in uniqueOwners" :key="`lead-${owner}`">
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                      <span class="text-green-800 text-xs font-medium">
                        {{ getInitials(owner) }}
                      </span>
                    </div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ formatOwnerName(owner) }}
                    </div>
                  </div>
                </td>
                <td 
                  v-for="status in leadStatuses" 
                  :key="`lead-${owner}-${status}`"
                  class="px-4 py-3 whitespace-nowrap text-center"
                >
                  <span class="text-lg font-bold" :class="getLeadCount(owner, status) > 0 ? 'text-green-600' : 'text-gray-400'">
                    {{ getLeadCount(owner, status) }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="text-lg font-bold text-green-600">
                    {{ getTotalLeadsForOwner(owner) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td class="px-4 py-3 font-bold text-gray-900">TOTALS</td>
                <td 
                  v-for="status in leadStatuses" 
                  :key="`lead-total-${status}`"
                  class="px-4 py-3 font-bold text-gray-900 text-center"
                >
                  {{ getTotalLeadsForStatus(status) }}
                </td>
                <td class="px-4 py-3 font-bold text-green-600">
                  {{ leadSummary.total_leads || 0 }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <!--------- Footer -------->
      <div class="mt-8 pt-6">
        <div class="text-center">
          <div class="inline-flex items-center text-xs text-gray-400 space-x-2">
            <span>Sales Performance Dashboard</span>
            <span class="text-gray-300">•</span>
            <span>{{ new Date().getFullYear() }}</span>
            <span class="text-gray-300">•</span>
            <span>CRM Analytics</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const API_ENDPOINT = 'merabt_crm.merabt_crm.override.custom_chart.get_deal_performance_cards'

// Reactive variables
const loading = ref(true)
const error = ref<string | null>(null)
const apiData = ref<any>(null)

// Date filter variables
const fromDate = ref<string>('')
const toDate = ref<string>('')
const dateRange = ref<string>('30days') // NEW: Track current date range

// NEW: Function to set date range based on selection
const setDateRange = (range: string) => {
  dateRange.value = range
  const today = new Date()
  
  let daysToSubtract = 30 // Default to 30 days
  
  switch(range) {
    case '7days':
      daysToSubtract = 7
      break
    case '30days':
      daysToSubtract = 30
      break
    case '60days':
      daysToSubtract = 60
      break
    case '90days':
      daysToSubtract = 90
      break
    case 'custom':
      // For custom range, don't auto-set dates, keep current values
      return
  }
  
  const from = new Date(today)
  from.setDate(today.getDate() - daysToSubtract)
  
  // Format dates as YYYY-MM-DD
  fromDate.value = from.toISOString().split('T')[0]
  toDate.value = today.toISOString().split('T')[0]
  
  // Auto-apply filters when selecting a quick range
  applyFilters()
}

// NEW: Get label for date range
const getDateRangeLabel = () => {
  switch(dateRange.value) {
    case '7days': return 'Last 7 Days'
    case '30days': return 'Last 30 Days'
    case '60days': return 'Last 60 Days'
    case '90days': return 'Last 90 Days'
    case 'custom': return 'Custom Range'
    default: return ''
  }
}

// Fetch data with filters
const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
    
    // Prepare request body with filters
    const requestBody: any = {}
    
    if (fromDate.value) {
      requestBody.from_date = fromDate.value
    }
    
    if (toDate.value) {
      requestBody.to_date = toDate.value
    }
    
    const response = await fetch(`/api/method/${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Frappe-CSRF-Token': csrfToken
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('API Response:', result)
    
    if (result.message) {
      apiData.value = result.message
      console.log('Data loaded:', {
        dealData: apiData.value?.deal_data?.length,
        leadData: apiData.value?.lead_data?.length,
        owners: apiData.value?.owners?.length
      })
    } else if (result.error) {
      throw new Error(result.error)
    } else {
      throw new Error('Invalid response format')
    }
    
  } catch (err: any) {
    console.error('Error:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Apply filters
const applyFilters = () => {
  // If custom dates are selected, mark as custom range
  if (dateRange.value !== 'custom') {
    // Check if dates match any predefined range
    const today = new Date()
    const from = new Date(fromDate.value)
    const daysDiff = Math.floor((today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 7) dateRange.value = '7days'
    else if (daysDiff === 30) dateRange.value = '30days'
    else if (daysDiff === 60) dateRange.value = '60days'
    else if (daysDiff === 90) dateRange.value = '90days'
    else dateRange.value = 'custom'
  }
  
  fetchData()
}

// Reset filters - UPDATED
const resetFilters = () => {
  setDateRange('30days') // Reset to Last 30 Days
}

// Check if filters are active
const hasActiveFilters = computed(() => {
  return fromDate.value !== '' || toDate.value !== ''
})

// Format date for display
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return 'All Time'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Computed properties
const dealSummary = computed(() => {
  return apiData.value?.deal_summary || {}
})

const leadSummary = computed(() => {
  return apiData.value?.lead_summary || {}
})

const uniqueOwners = computed(() => {
  return apiData.value?.owners || []
})

const dealData = computed(() => {
  return apiData.value?.deal_data || []
})

const leadData = computed(() => {
  return apiData.value?.lead_data || []
})

const dealStatuses = computed(() => {
 return dealSummary.value?.all_statuses || [] })

const leadStatuses = computed(() => {
  return leadSummary.value?.lead_statuses || []
})

// Helper methods for deal data
const getDealCount = (owner: string, status: string) => {
  const found = dealData.value.find((item: any) => 
    item.owner === owner && item.status === status
  )
  return found ? found.count : 0
}

const getDealValue = (owner: string) => {
  return dealData.value
    .filter((item: any) => item.owner === owner)
    .reduce((sum: number, item: any) => sum + (item.value || 0), 0)
}

const getTotalDealsForStatus = (status: string) => {
  return dealData.value
    .filter((item: any) => item.status === status)
    .reduce((sum: number, item: any) => sum + (item.count || 0), 0)
}

// Helper methods for lead data
const getLeadCount = (owner: string, status: string) => {
  const found = leadData.value.find((item: any) => 
    item.owner === owner && item.status === status
  )
  return found ? found.count : 0
}

const getTotalLeadsForOwner = (owner: string) => {
  return leadData.value
    .filter((item: any) => item.owner === owner)
    .reduce((sum: number, item: any) => sum + (item.count || 0), 0)
}

const getTotalLeadsForStatus = (status: string) => {
  return leadData.value
    .filter((item: any) => item.status === status)
    .reduce((sum: number, item:any) => sum + (item.count || 0), 0)
}

// Helper functions
// Helper functions
// Helper functions
const formatCurrency = (value: number) => {
  if (!value && value !== 0) return '₹0'
  // Convert to string and remove any existing commas, then add ₹ symbol
  return `₹${Math.round(value).toString().replace(/,/g, '')}`
}

const formatOwnerName = (owner: string) => {
  if (!owner) return 'Unassigned'
  if (owner === 'Administrator') return 'Admin'
  if (owner.includes('@')) {
    const name = owner.split('@')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  if (owner === 'Unassigned') return 'Unassigned'
  return owner
}

const getInitials = (owner: string) => {
  const name = formatOwnerName(owner)
  if (name === 'Unassigned') return 'UN'
  if (name === 'Admin') return 'AD'
  return name.substring(0, 2).toUpperCase()
}

// Lifecycle - UPDATED
onMounted(() => {
  // Set default to Last 30 Days on page load
  setDateRange('30days')
})
</script>

<style scoped>
.performance-review-container {
  min-height: calc(100vh - 100px);
}
</style>