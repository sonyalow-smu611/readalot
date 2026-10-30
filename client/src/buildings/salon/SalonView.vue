<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Hair Salon → Profile. Owner: Aalric.
// Clouds part to show the whole salon. The reader stands by the barber chair on the left, as their
// town sprite, wearing the look being styled; on the right a dock of widgets holds the style
// studio and the profile. On a phone the dock is a sheet under the reader that pulls up.
// Saves throw pixel confetti over the dock.
// This view holds the state and does the saving; the parts in components/ show it and report
// what the reader did.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import AboutYou from '@/buildings/salon/components/AboutYou.vue'
import CoinsCard from '@/buildings/salon/components/CoinsCard.vue'
import ConfirmDialog from '@/buildings/salon/components/ConfirmDialog.vue'
import FavouriteGenres from '@/buildings/salon/components/FavouriteGenres.vue'
import LevelCard from '@/buildings/salon/components/LevelCard.vue'
import PrivacyAlert from '@/buildings/salon/components/PrivacyAlert.vue'
import PrivacySetting from '@/buildings/salon/components/PrivacySetting.vue'
import PixelConfetti from '@/buildings/salon/components/PixelConfetti.vue'
import ProfileEditForm from '@/buildings/salon/components/ProfileEditForm.vue'
import ReaderCard from '@/buildings/salon/components/ReaderCard.vue'
import SalonBackdrop from '@/buildings/salon/components/SalonBackdrop.vue'
import SalonClouds from '@/buildings/salon/components/SalonClouds.vue'
import SalonStage from '@/buildings/salon/components/SalonStage.vue'
import SavedQuotes from '@/buildings/salon/components/SavedQuotes.vue'
import ShelfListSheet from '@/buildings/salon/components/ShelfListSheet.vue'
import StyleStudio from '@/buildings/salon/components/StyleStudio.vue'
import { PRIVACY_ALERTS, SHELF_STATS } from '@/buildings/salon/profileOptions.js'
import { drawSalon } from '@/buildings/salon/salonArt.js'
import { useDecor } from '@/composables/useDecor'
import { normaliseCharacter } from '@/lib/avatar/catalogue.js'
import { saveProfile, signOut } from '@/services/auth.js'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useProgressStore } from '@/stores/progress.js'
import '@/buildings/salon/pixel.css'
import { useUserStore } from '@/stores/user'
import { PLACES } from '@/town/places.js'

const PRIVACY_ALERT_MS = 2600
const SAVED_NOTE_MS = 4000
const PANELS = [
  { id: 'studio', label: 'Style studio' },
  { id: 'profile', label: 'Profile' },
]

const place = PLACES.find((p) => p.id === 'salon')
const art = drawSalon()
const router = useRouter()
const user = useUserStore()
const bookshelf = useBookshelfStore()
const { inventory, placed, shopOpen } = useDecor()

const clouds = ref(true)
const panel = ref('studio')

// saving one change to the account; returns the error message, or '' when it worked
async function save(details) {
  const result = await saveProfile(details)
  if (result.error) return result.error.message
  user.mergeProfile(details)
  return ''
}

// ---- the character
const draft = ref({ ...user.profile.character })
const lookBusy = ref(false)
const lookError = ref('')
const lookSaved = ref('')
const hop = ref(0)
const celebrate = ref(0)
const discarding = ref(false)
// bumped by every save, to throw confetti
const confetti = ref(0)
// phones: whether the dock's sheet is pulled up over the reader
const sheetOpen = ref(false)
const progress = useProgressStore()
// a level-up while in the salon is worth confetti too
watch(() => progress.levelUps, () => (confetti.value += 1))
let leaveAnswer = null
let savedTimer = null

const changed = computed(() => JSON.stringify(draft.value) !== JSON.stringify(user.profile.character))

// every change makes the reader bounce
watch(draft, () => (hop.value += 1))

function resetLook() {
  draft.value = { ...user.profile.character }
  lookError.value = ''
}

async function saveLook() {
  lookBusy.value = true
  lookError.value = await save({ character: normaliseCharacter(draft.value) })
  lookBusy.value = false
  if (lookError.value) return
  draft.value = { ...user.profile.character }
  celebrate.value += 1
  confetti.value += 1
  lookSaved.value = 'Saved. Your new look is ready for town.'
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => (lookSaved.value = ''), SAVED_NOTE_MS)
}

// Leaving with an unsaved look asks first: save it and go, drop it and go, or stay.
function askLeave() {
  if (!changed.value) return Promise.resolve(true)
  discarding.value = true
  return new Promise((resolve) => (leaveAnswer = resolve))
}

// logging out has already asked (it must save while still signed in)
let asked = false
onBeforeRouteLeave(() => (asked ? true : askLeave()))

function answerLeave(leave) {
  discarding.value = false
  if (leave) resetLook()
  leaveAnswer?.(leave)
  leaveAnswer = null
}

async function saveAndLeave() {
  discarding.value = false
  await saveLook()
  // a failed save stays, with the error on the save bar
  leaveAnswer?.(!lookError.value)
  leaveAnswer = null
}

// ---- the profile
const editing = ref(false)
const editBusy = ref(false)
const editError = ref('')
const aboutKey = ref('')
const aboutBusy = ref(false)
const aboutError = ref('')
const privacyBusy = ref(false)
const privacyError = ref('')
const privacyAlert = ref('')
const confirmingLogout = ref(false)
const listStatus = ref('')
const removingId = ref('')
const removeBusy = ref(false)
const removeError = ref('')
let listOpener = null
let privacyTimer = null

const shelfReady = computed(() => !bookshelf.loading && !bookshelf.error)
const listStat = computed(() => SHELF_STATS.find((stat) => stat.status === listStatus.value) ?? null)
const listBooks = computed(() => (listStatus.value ? bookshelf.booksByStatus[listStatus.value] : []))
const decorCount = computed(() => inventory.value.length + placed.value.length)

onMounted(() => {
  if (!bookshelf.books.length && !bookshelf.loading) bookshelf.load()
})

onBeforeUnmount(() => {
  clearTimeout(privacyTimer)
  clearTimeout(savedTimer)
})

function startEdit() {
  editError.value = ''
  aboutKey.value = ''
  editing.value = true
}

async function saveEdit(details) {
  editBusy.value = true
  editError.value = await save(details)
  editBusy.value = false
  if (editError.value) return
  editing.value = false
  confetti.value += 1
}

function editAbout(key) {
  aboutError.value = ''
  aboutKey.value = key
}

async function saveAbout(details) {
  aboutBusy.value = true
  aboutError.value = await save(details)
  aboutBusy.value = false
  if (aboutError.value) return
  aboutKey.value = ''
  confetti.value += 1
}

async function toggleDiscoverable() {
  const next = !user.profile.discoverable
  privacyError.value = ''
  privacyBusy.value = true
  user.mergeProfile({ discoverable: next })
  showPrivacyAlert(next ? 'public' : 'private')
  const result = await saveProfile({ discoverable: next })
  privacyBusy.value = false
  if (result.error) {
    user.mergeProfile({ discoverable: !next })
    hidePrivacyAlert()
    privacyError.value = result.error.message
    return
  }
  confetti.value += 1
}

function showPrivacyAlert(mode) {
  clearTimeout(privacyTimer)
  privacyAlert.value = mode
  privacyTimer = setTimeout(hidePrivacyAlert, PRIVACY_ALERT_MS)
}

function hidePrivacyAlert() {
  clearTimeout(privacyTimer)
  privacyAlert.value = ''
}

function openList(status, opener) {
  listOpener = opener
  listStatus.value = status
}

function closeList() {
  listStatus.value = ''
  removingId.value = ''
  removeError.value = ''
  listOpener?.focus()
  listOpener = null
}

function askRemove(id) {
  removeError.value = ''
  removingId.value = id
}

async function confirmRemove(id) {
  removeBusy.value = true
  removeError.value = ''
  try {
    await bookshelf.removeBook(id)
    removingId.value = ''
  } catch (err) {
    removeError.value = err.message
  } finally {
    removeBusy.value = false
  }
}

// The shop lives in the room, so open it there.
function visitShop() {
  shopOpen.value = true
  router.push({ name: 'room' })
}

async function logout() {
  confirmingLogout.value = false
  if (!(await askLeave())) return
  asked = true
  user.dismissGuide()
  await signOut()
  user.applySession(null)
  router.push({ name: 'login' })
}
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" :accent="place.accent" flush>
    <div class="salon">
      <SalonBackdrop class="salon__room" :src="art.backdrop" />

      <div class="salon__layout">
        <SalonStage
          class="salon__stage"
          :character="draft"
          :changed="changed"
          :art="art"
          :name="user.profile.name"
          :hop="hop"
          :celebrate="celebrate"
        />

        <aside class="dock" :class="{ 'is-open': sheetOpen }" aria-label="Salon widgets">
          <button
            type="button"
            class="dock__handle"
            :aria-expanded="sheetOpen"
            :aria-label="sheetOpen ? 'Show less' : 'Show more'"
            @click="sheetOpen = !sheetOpen"
          >
            <span aria-hidden="true" />
          </button>
          <div class="dock__tabs" role="tablist" aria-label="Salon">
            <button
              v-for="p in PANELS"
              :id="`salon-tab-${p.id}`"
              :key="p.id"
              type="button"
              role="tab"
              class="btn btn-chip dock__tab"
              :aria-selected="panel === p.id"
              aria-controls="salon-panel"
              @click="panel = p.id"
            >
              {{ p.label }}
            </button>
          </div>
          <p class="dock__saved" role="status">{{ lookSaved }}</p>

          <div id="salon-panel" class="dock__panel" role="tabpanel" :aria-labelledby="`salon-tab-${panel}`">
            <StyleStudio
              v-if="panel === 'studio'"
              v-model="draft"
              :changed="changed"
              :busy="lookBusy"
              :error="lookError"
              @save="saveLook"
              @reset="resetLook"
            />

            <div v-else class="dock__profile">
              <template v-if="!editing">
                <ReaderCard
                  :profile="user.profile"
                  :counts="bookshelf.statusCounts"
                  :ready="shelfReady"
                  :loading="bookshelf.loading"
                  @edit="startEdit"
                  @open-list="openList"
                />
                <LevelCard :xp="progress.xp" :level="progress.level" />
                <FavouriteGenres :genres="user.profile.favouriteGenres" />
                <CoinsCard :decor-count="decorCount" @shop="visitShop" />
                <AboutYou
                  :profile="user.profile"
                  :editing-key="aboutKey"
                  :busy="aboutBusy"
                  :error="aboutError"
                  @edit="editAbout"
                  @cancel="aboutKey = ''"
                  @save="saveAbout"
                  @clear-error="aboutError = ''"
                />
                <PrivacySetting
                  :discoverable="user.profile.discoverable"
                  :busy="privacyBusy"
                  :error="privacyError"
                  :status="PRIVACY_ALERTS[privacyAlert]?.title ?? ''"
                  @toggle="toggleDiscoverable"
                />
                <SavedQuotes />
                <button type="button" class="btn btn-secondary logout" data-tour="profile-logout" @click="confirmingLogout = true">
                  Log out
                </button>
              </template>
              <ProfileEditForm
                v-else
                :profile="user.profile"
                :busy="editBusy"
                :error="editError"
                @save="saveEdit"
                @cancel="editing = false"
              />
            </div>
          </div>
          <PixelConfetti :burst="confetti" />
        </aside>
      </div>

      <SalonClouds v-if="clouds" @done="clouds = false" />
    </div>

    <ShelfListSheet
      v-if="listStat"
      :stat="listStat"
      :books="listBooks"
      :removing-id="removingId"
      :remove-busy="removeBusy"
      :remove-error="removeError"
      @close="closeList"
      @ask-remove="askRemove"
      @cancel-remove="removingId = ''"
      @confirm-remove="confirmRemove"
    />
    <ConfirmDialog
      v-if="confirmingLogout"
      book
      title="Close this book?"
      text="You will leave the shelf. Sign in again when you want to come back."
      stay-label="Stay"
      go-label="Log out"
      @stay="confirmingLogout = false"
      @go="logout"
    />
    <ConfirmDialog
      v-if="discarding"
      title="Save your new look?"
      text="You're leaving the salon, and your new look hasn't been saved yet."
      save-label="Save look and leave"
      stay-label="Stay"
      go-label="Discard and leave"
      @stay="answerLeave(false)"
      @go="answerLeave(true)"
      @save="saveAndLeave"
    />
    <PrivacyAlert :mode="privacyAlert" :character="user.profile.character" @close="hidePrivacyAlert" />
  </BuildingShell>
</template>

<style scoped>
.salon {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #3a3a48;
}

/* the whole room, standing on the bottom edge */
.salon__room {
  position: absolute;
  inset: 0;
}

.salon__layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 480px);
  gap: 24px;
  height: 100%;
  padding: 20px 28px 0;
}

.salon__stage {
  height: 100%;
  padding-bottom: 20px;
}

.dock {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 20px;
}

/* only phones pull the sheet up */
.dock__handle {
  display: none;
}

.dock__tabs {
  display: flex;
  flex: none;
  gap: 6px;
  padding: 5px;
  border: 3px solid var(--px-ink);
  border-radius: 4px;
  background: var(--px-paper);
  box-shadow: var(--px-shadow);
}

.dock__tab {
  flex: 1 1 0;
}

.dock__saved {
  flex: none;
  margin: 0;
  text-align: center;
}

.dock__saved:not(:empty) {
  margin-top: 10px;
  padding: 8px 12px;
  border: 2px solid #1e1a24;
  border-radius: 999px;
  background: #f6e27a;
  color: #1e1a24;
  font-weight: 700;
}

.dock__panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 12px;
  padding: 2px 6px 1.5rem 2px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.logout {
  display: block;
  width: 100%;
  margin: 16px 0 8px;
}

/* Narrow screens: the reader on top, the widgets in a sheet underneath that pulls up over them */
@media (max-width: 899px) {
  .salon__layout {
    display: block;
    padding: 0;
  }

  .salon__stage {
    height: 52%;
    padding: 12px 12px 34px;
  }

  .dock {
    position: absolute;
    inset: 48% 0 0;
    z-index: 3;
    padding: 0 12px 12px;
    border-top: 3px solid var(--px-ink);
    border-radius: 16px 16px 0 0;
    background: var(--px-paper-dark);
    box-shadow: 0 -6px 0 rgba(43, 29, 36, 0.18);
    transition: top 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .dock.is-open {
    top: 8%;
  }

  .dock__handle {
    display: grid;
    place-items: center;
    flex: none;
    width: 100%;
    height: 44px;
    border: 0;
    background: none;
  }

  .dock__handle span {
    width: 48px;
    height: 6px;
    border-radius: 3px;
    background: var(--px-ink);
    opacity: 0.45;
  }

  .dock__panel {
    padding-right: 2px;
  }
}

@media (max-width: 899px) and (prefers-reduced-motion: reduce) {
  .dock {
    transition: none;
  }
}
</style>
