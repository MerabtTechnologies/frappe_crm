
<template>
  <div class="p-4 space-y-4">

    <!-- <div class="text-lg font-semibold">
      Gamma Templates
    </div> -->

    <!-- Quotation Info -->
    <div class="border rounded p-3 bg-gray-50">
      <p class="text-sm text-gray-600">
        Doctype: <b>{{ doctype }}</b>
      </p>
      <p class="text-sm text-gray-600">
        Document Name: <b>{{ docname }}</b>
      </p>
    </div>

    <!-- No Data -->
    <div v-if="loading" class="text-gray-500">Loading templates...</div>

    <div v-else-if="props.proposals.length === 0" class="text-gray-500">
      No Gamma presentation found for this Quotation.
    </div>

    <!-- Gamma Embed -->
    <div v-for="item in props.proposals" :key="item.name"
         class="border rounded shadow-sm bg-white overflow-hidden">

      <!-- Header -->
      <div class="flex justify-between items-center p-3 bg-gray-100 border-b">
        <div>
          <b>{{ item.name }}</b>
          <span class="ml-2 text-xs px-2 py-1 rounded bg-green-100 text-green-700">
            {{ item.status }}
          </span>
          <div class="text-sm text-gray-500">{{ item.proposal_name }}</div>
        </div>

        <!-- Actions -->
        <div class="space-x-2">
          <a :href="`https://gamma.app/docs/${item.gamma_embed_id}`"
             target="_blank"
             class="text-sm text-blue-600 hover:underline">
            Edit
          </a>

          <a :href="item.gamma_url"
             target="_blank"
             class="text-sm text-green-600 hover:underline">
            Present
          </a>
          <!-- console.log(item.gamma_url); -->

         <button
          @click="shareLink(item.gamma_url)"
          class="text-sm text-purple-600 hover:underline">
          Share
        </button>


         <button
          @click="unlinkProposal(item.name)"
          class="text-sm text-red-600 hover:underline">
          Unlink
        </button>

        </div>
      </div>

      <!-- IFRAME -->
      <iframe
        v-if="item.gamma_embed_id"
        :src="`https://gamma.app/embed/${item.gamma_embed_id}`"
        class="w-full"
        style="height:600px;border:none;"
        allowfullscreen>
      </iframe>

    </div>

    <!-- Create Button -->
    <!-- <Button
      label="Create Gamma Template"
      @click="createTemplate"
    /> -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Button, call } from 'frappe-ui'

const props = defineProps({
  doctype: String,
  docname: String,
  proposals: [Object],
})

const proposals = ref([])
const loading = ref(true)

/* LOAD DATA */
async function loadGammaTemplates() {
  loading.value = true

  try {
    // const res = await call('merabt_crm.custom.quotation.get_quotation_proposals', {
    //   quotation_name: props.docname
    // })

    // props.proposals = res || []

  // console.log('Proposals: ', props.proposals);
  

    props.proposals.forEach(p => {
      // console.log(" Gamma URL:", p.gamma_url)
      // console.log("Embed ID:", p.gamma_embed_id)
    })

  } catch (err) {
    console.error(" API Failed", err)
  }

  loading.value = false
}
/* UNLINK */
async function unlinkProposal(name) {
  const confirmMsg = `Are you sure you want to unlink the Gamma proposal "${name}" from this quotation?`

  if (!confirm(confirmMsg)) return

  try {
    const res = await call(
      'merabt_crm.custom.quotation.unlink_gamma_proposal',
      { proposal_name: name }
    )

    // Remove from UI
    props.proposals = props.proposals.filter(p => p.name !== name)

    alert(`✅ Gamma proposal "${name}" unlinked successfully.`)

  } catch (err) {
    console.error(" Unlink failed:", err)
    alert(" Failed to unlink Gamma proposal.")
  }
}


onMounted(loadGammaTemplates)

/* CREATE NEW */
// function createTemplate() {
//   alert("Test API later")
// }

/* SHARE */
function shareLink(url) {
  if (!url) {
    alert("No share link found for this proposal")
    return
  }

  // console.log("Opening Share URL:", url)
  window.open(url, "_blank")
}



</script>
