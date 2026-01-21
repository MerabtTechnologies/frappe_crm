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
          class="px-3 py-1.5 text-sm rounded-md border transition-colors"
          :class="dateRange === '7days' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
        >
          Last 7 Days
        </button>
        <button
          @click="setDateRange('30days')"
          class="px-3 py-1.5 text-sm rounded-md border transition-colors"
          :class="dateRange === '30days' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
        >
          Last 30 Days
        </button>
        <button
          @click="setDateRange('60days')"
          class="px-3 py-1.5 text-sm rounded-md border transition-colors"
          :class="dateRange === '60days' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
        >
          Last 60 Days
        </button>
        <button
          @click="setDateRange('90days')"
          class="px-3 py-1.5 text-sm rounded-md border transition-colors"
          :class="dateRange === '90days' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'"
        >
          Last 90 Days
        </button>
        <button
          @click="setDateRange('custom')"
          class="px-3 py-1.5 text-sm rounded-md border transition-colors"
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
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            v-model="toDate"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div class="flex gap-2">
          <!-- <button
            @click="applyFilters"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!fromDate || !toDate"
          >
            Apply Filters
          </button> -->
          <button
            @click="resetFilters"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      
      <!-- Active filters display -->
      <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-gray-200">
        <div class="text-sm text-gray-600">
          Showing data from <strong class="font-semibold">{{ formatDateDisplay(fromDate) }}</strong> to <strong class="font-semibold">{{ formatDateDisplay(toDate) }}</strong>
          <span v-if="dateRange !== 'custom'" class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">({{ getDateRangeLabel() }})</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-3 text-gray-600">Loading CRM data...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
      <div class="text-red-600 font-medium mb-2 flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        Error Loading Data
      </div>
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button @click="applyFilters" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
        Try Again
      </button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Summary Cards -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Deal Summary -->
          <div class="bg-white p-4 rounded-lg border shadow-sm hover:shadow transition-shadow">
            <div class="text-sm text-gray-500 flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z" clip-rule="evenodd" />
              </svg>
              Total Deals
            </div>
            <div class="text-2xl font-bold text-gray-800 mt-1">
              {{ dealSummary.total_deals || 0 }}
            </div>
            <div class="text-xs text-gray-500 mt-1">Sum of all deal counts</div>
          </div>
          
          <div class="bg-white p-4 rounded-lg border shadow-sm hover:shadow transition-shadow">
            <div class="text-sm text-gray-500 flex items-center gap-2">
              <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
              </svg>
              Deal Value
            </div>
            <div class="text-2xl font-bold text-gray-800 mt-1">
              {{ formatCurrency(dealSummary.total_value || 0) }}
            </div>
            <div class="text-xs text-gray-500 mt-1">Sum of all deal values</div>
          </div>
          
          <!-- Lead Summary -->
          <div class="bg-white p-4 rounded-lg border shadow-sm hover:shadow transition-shadow">
            <div class="text-sm text-gray-500 flex items-center gap-2">
              <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Total Leads
            </div>
            <div class="text-2xl font-bold text-gray-800 mt-1">
              {{ leadSummary.total_leads || 0 }}
            </div>
            <div class="text-xs text-gray-500 mt-1">Sum of all lead counts</div>
          </div>
        </div>
      </div>

      <!-- Deal Data Table -->
      <div class="bg-white rounded-lg border overflow-hidden mb-6 shadow-sm">
        <div class="p-4 border-b bg-gray-50">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Deal Performance</h3>
              <p class="text-sm text-gray-600 mt-1">Deal counts and values by owner and status</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-600 bg-white px-3 py-1.5 rounded border">
                <span class="font-medium">{{ dealSummary.total_deals || 0 }}</span> deals • 
                <span class="font-medium">{{ formatCurrency(dealSummary.total_value || 0) }}</span> value
              </div>
              <button 
                @click="applyFilters" 
                class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
                :disabled="loading"
              >
                <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                </svg>
                {{ loading ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OWNER</th>
                <th 
                  v-for="status in dealStatuses" 
                  :key="status"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ status }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Value
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="owner in uniqueOwners" :key="owner">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3 border border-blue-200">
                      <span class="text-blue-800 text-sm font-medium">
                        {{ getInitials(owner) }}
                      </span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ formatOwnerName(owner) }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ owner }}
                      </div>
                    </div>
                  </div>
                </td>
                <td 
                  v-for="status in dealStatuses" 
                  :key="`deal-${owner}-${status}`"
                  class="px-6 py-4 whitespace-nowrap text-center"
                >
                  <span class="inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold" 
                    :class="getDealCount(owner, status) > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'">
                    {{ getDealCount(owner, status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-base font-bold" :class="getDealValue(owner) > 0 ? 'text-green-600' : 'text-gray-400'">
                    {{ formatCurrency(getDealValue(owner)) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td class="px-6 py-4 font-bold text-gray-900 text-sm uppercase">TOTALS</td>
                <td 
                  v-for="status in dealStatuses" 
                  :key="`deal-total-${status}`"
                  class="px-6 py-4 font-bold text-gray-900 text-center"
                >
                  <span class="inline-flex items-center justify-center h-7 w-7 rounded-full text-sm bg-blue-100 text-blue-800">
                    {{ getTotalDealsForStatus(status) }}
                  </span>
                </td>
                <td class="px-6 py-4 font-bold text-green-600">
                  {{ formatCurrency(dealSummary.total_value || 0) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Lead Data Table -->
      <div class="bg-white rounded-lg border overflow-hidden shadow-sm">
        <div class="p-4 border-b bg-gray-50">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Lead Performance</h3>
              <p class="text-sm text-gray-600 mt-1">Lead counts by owner and status</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-600 bg-white px-3 py-1.5 rounded border">
                <span class="font-medium">{{ leadSummary.total_leads || 0 }}</span> leads
              </div>
              <button 
                @click="applyFilters" 
                class="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-green-50 transition-colors"
                :disabled="loading"
              >
                <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                </svg>
                {{ loading ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LEAD OWNER</th>
                <th 
                  v-for="status in leadStatuses" 
                  :key="status"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ status }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Leads
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="owner in uniqueOwners" :key="`lead-${owner}`">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-3 border border-green-200">
                      <span class="text-green-800 text-sm font-medium">
                        {{ getInitials(owner) }}
                      </span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ formatOwnerName(owner) }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ owner }}
                      </div>
                    </div>
                  </div>
                </td>
                <td 
                  v-for="status in leadStatuses" 
                  :key="`lead-${owner}-${status}`"
                  class="px-6 py-4 whitespace-nowrap text-center"
                >
                  <span class="inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold" 
                    :class="getLeadCount(owner, status) > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'">
                    {{ getLeadCount(owner, status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold bg-green-100 text-green-800">
                    {{ getTotalLeadsForOwner(owner) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td class="px-6 py-4 font-bold text-gray-900 text-sm uppercase">TOTALS</td>
                <td 
                  v-for="status in leadStatuses" 
                  :key="`lead-total-${status}`"
                  class="px-6 py-4 font-bold text-gray-900 text-center"
                >
                  <span class="inline-flex items-center justify-center h-7 w-7 rounded-full text-sm bg-green-100 text-green-800">
                    {{ getTotalLeadsForStatus(status) }}
                  </span>
                </td>
                <td class="px-6 py-4 font-bold text-green-600">
                  <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-800">
                    {{ leadSummary.total_leads || 0 }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="mt-8 pt-6 border-t border-gray-200">
        <div class="text-center">
          <div class="inline-flex flex-wrap items-center justify-center text-xs text-gray-400 gap-2">
            <span>Sales Performance Dashboard</span>
            <span class="text-gray-300">•</span>
            <span>{{ new Date().getFullYear() }}</span>
            <span class="text-gray-300">•</span>
            <span>CRM Analytics</span>
            <span class="text-gray-300">•</span>
            <span>Data updated: {{ dataUpdatedTime }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { createResource } from 'frappe-ui'
<script setup lang="ts">
import { usersStore } from '../stores/users'


const API_ENDPOINT = 'merabt_crm.merabt_crm.override.custom_chart.get_deal_performance_cards'

const { users, getUser, isManager, isAdmin } = usersStore()

// Reactive variables
const loading = ref(false)
const error = ref(null)
const dataUpdatedTime = ref('')

// Date filter variables
const fromDate = ref('')
const toDate = ref('')
const dateRange = ref('30days')

// Create resource for data fetching (similar to Lead.vue pattern)
const performanceData = createResource({
  url: `/api/method/${API_ENDPOINT}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Transform the response to handle Frappe's response format
  transform: (data) => {
    if (data.message) {
      return data.message
    } else if (data.data) {
      return data.data
    } else {
      return data
    }
  },
  onError: (err) => {
    console.error('Performance data error:', err)
    error.value = err.messages?.[0] || err.message || 'Error loading data'
    loading.value = false
  },
  onSuccess: () => {
    loading.value = false
    dataUpdatedTime.value = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
})

// Function to set date range
const setDateRange = (range) => {
  dateRange.value = range
  const today = new Date()
  
  let daysToSubtract = 30
  
  switch(range) {
    case '7days':
      daysToSubtract = 7
      break
    case '60days':
      daysToSubtract = 60
      break
    case '90days':
      daysToSubtract = 90
      break
    case 'custom':
      // Don't auto-set dates for custom range
      return
  }
  
  const from = new Date(today)
  from.setDate(today.getDate() - daysToSubtract)
  
  fromDate.value = formatDateForAPI(from)
  toDate.value = formatDateForAPI(today)
  
  // Auto-apply filters when selecting a quick range
  applyFilters()
}

// Format date for API (YYYY-MM-DD)
const formatDateForAPI = (date) => {
  return date.toISOString().split('T')[0]
}

// Get date range label
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

// Apply filters
const applyFilters = () => {
  loading.value = true
  error.value = null
  
  const requestBody = {}
  
  // Only include dates if they have values
  if (fromDate.value && fromDate.value !== '') {
    requestBody.from_date = fromDate.value
  }
  
  if (toDate.value && toDate.value !== '') {
    requestBody.to_date = toDate.value
  }
  
  // Submit the request
  performanceData.submit(requestBody)
}

// Reset filters
const resetFilters = () => {
  setDateRange('30days')
}

// Computed properties
const hasActiveFilters = computed(() => {
  return fromDate.value !== '' || toDate.value !== ''
})

const formatDateDisplay = (dateString) => {
  if (!dateString) return 'All Time'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Data computed properties from the resource
const apiData = computed(() => {
  return performanceData.data || {}
})

const dealSummary = computed(() => {
  return apiData.value?.deal_summary || {
    total_deals: 0,
    total_value: 0,
    all_statuses: [],
    deal_statuses: []
  }
})

const leadSummary = computed(() => {
  return apiData.value?.lead_summary || {
    total_leads: 0,
    lead_statuses: []
  }
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

// Use deal_summary.deal_statuses or all_statuses
const dealStatuses = computed(() => {
  return dealSummary.value.deal_statuses || 
         dealSummary.value.all_statuses || 
         []
})

// Use lead_summary.lead_statuses
const leadStatuses = computed(() => {
  return leadSummary.value.lead_statuses || []
})

// Helper methods for deal data
const getDealCount = (owner, status) => {
  if (!dealData.value || !Array.isArray(dealData.value)) return 0
  const found = dealData.value.find((item) => 
    item.owner === owner && item.status === status
  )
  return found ? parseInt(found.count) || 0 : 0
}

const getDealValue = (owner) => {
  if (!dealData.value || !Array.isArray(dealData.value)) return 0
  return dealData.value
    .filter((item) => item.owner === owner)
    .reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0)
}

const getTotalDealsForStatus = (status) => {
  if (!dealData.value || !Array.isArray(dealData.value)) return 0
  return dealData.value
    .filter((item) => item.status === status)
    .reduce((sum, item) => sum + (parseInt(item.count) || 0), 0)
}

// Helper methods for lead data
const getLeadCount = (owner, status) => {
  if (!leadData.value || !Array.isArray(leadData.value)) return 0
  const found = leadData.value.find((item) => 
    item.owner === owner && item.status === status
  )
  return found ? parseInt(found.count) || 0 : 0
}

const getTotalLeadsForOwner = (owner) => {
  if (!leadData.value || !Array.isArray(leadData.value)) return 0
  return leadData.value
    .filter((item) => item.owner === owner)
    .reduce((sum, item) => sum + (parseInt(item.count) || 0), 0)
}

const getTotalLeadsForStatus = (status) => {
  if (!leadData.value || !Array.isArray(leadData.value)) return 0
  return leadData.value
    .filter((item) => item.status === status)
    .reduce((sum, item) => sum + (parseInt(item.count) || 0), 0)
}

// Helper functions
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '₹0'
  // Use plain number string without thousand separators (no commas)
  return '₹' + Math.round(value).toString()
}

const formatOwnerName = (owner: string) => {
  const crmUsers = users.data?.crmUsers || []

  if (!owner) return 'Unassigned'
  if (owner === 'Administrator') return 'Admin'
  if (owner === 'Unassigned') return 'Unassigned'

  if (Array.isArray(crmUsers)) {
    const match = crmUsers.find((u: any) =>
      u.name === owner || u.email === owner || u.user === owner || u.full_name === owner
    )
    if (match) return match.full_name || match.name || owner
  }

  if (owner.includes('@')) {
    const local = owner.split('@')[0].replace(/[._-]+/g, ' ')
    return local.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  }

  return owner
}

const getInitials = (owner) => {
  const name = formatOwnerName(owner)
  if (name === 'Unassigned') return 'UN'
  if (name === 'Admin') return 'AD'
  if (name.length >= 2) return name.substring(0, 2).toUpperCase()
  return name.charAt(0).toUpperCase()
}

// Initialize on mount
onMounted(() => {
  // Set default date range
  setDateRange('30days')
})

// Watch for date changes in custom range mode
watch([fromDate, toDate], () => {
  if (dateRange.value === 'custom') {
    // Debounce the applyFilters call
    clearTimeout(window.filterTimeout)
    window.filterTimeout = setTimeout(() => {
      if (fromDate.value && toDate.value) {
        applyFilters()
      }
    }, 500)
  }
})

// Watch loading state from resource
watch(() => performanceData.loading, (newVal) => {
  loading.value = newVal
})

// Watch error state from resource
watch(() => performanceData.error, (newVal) => {
  if (newVal) {
    error.value = newVal.messages?.[0] || newVal.message || 'Error loading data'
  }
})
</script>

<style scoped>
.performance-review-container {
  min-height: calc(100vh - 100px);
}

/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>