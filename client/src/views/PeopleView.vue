<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  sampleReaders, getCompatibility, getSharedBooks, getSharedGenres,
  getCurrentlyReading, isFollowing, toggleFollow,
} from '../services/peopleDemo.js';

const router = useRouter();
const search = ref('');
const activeId = ref(sampleReaders[0].id);
const followed = ref(Object.fromEntries(sampleReaders.map((r) => [r.id, isFollowing(r.id)])));
const error = ref('');
const readers = computed(() => sampleReaders.filter((reader) => {
  const text = `${reader.displayName} ${reader.username} ${reader.favoriteGenres.join(' ')}`.toLowerCase();
  return text.includes(search.value.trim().toLowerCase());
}));
const selected = computed(() => sampleReaders.find((r) => r.id === activeId.value));

// Approximate fictional coordinates, displayed within the fixed OSM map bounds.
const bounds = { west: 103.68, east: 104.00, south: 1.27, north: 1.47 };
const pins = computed(() => readers.value.map((reader) => ({
  ...reader,
  x: ((reader.lng - bounds.west) / (bounds.east - bounds.west)) * 100,
  y: ((bounds.north - reader.lat) / (bounds.north - bounds.south)) * 100,
})));
const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.west}%2C${bounds.south}%2C${bounds.east}%2C${bounds.north}&layer=mapnik`;
function follow(reader) {
  error.value = '';
  try { followed.value[reader.id] = toggleFollow(reader.id); }
  catch (err) { error.value = err.message; }
}
function openRoom(reader) { router.push(`/people/${encodeURIComponent(reader.id)}`); }
</script>

<template>
  <main class="people-discover">
    <header class="discover-intro">
      <span class="eyebrow">THE READALOT COMMUNITY</span>
      <h1>Discover People</h1>
      <p>Meet readers who love the same stories as you.</p>
    </header>

    <label class="search-label" for="people-search">Find your reading people</label>
    <input id="people-search" v-model="search" class="search" type="search" placeholder="Search names or favourite genres…" />

    <section aria-label="Map of sample readers">
      <div class="heading-row"><h2>Readers on the map</h2><span>{{ readers.length }} nearby</span></div>
      <div class="map-box">
        <iframe class="map-frame" :src="mapUrl" title="OpenStreetMap of Singapore with demo reader pins" loading="lazy" tabindex="-1" />
        <button
          v-for="reader in pins" :key="reader.id" type="button" class="map-pin"
          :class="{ chosen: activeId === reader.id }"
          :style="{ left: reader.x + '%', top: reader.y + '%' }"
          :aria-label="`Select ${reader.displayName} on map`"
          @click="activeId = reader.id"
        >📍</button>
      </div>
      <p class="map-note">Demo only: fictional readers and approximate example locations in Singapore. Pins show general areas, not homes.</p>
      <div v-if="selected" class="selected-reader">
        <strong>{{ selected.displayName }}</strong>
        <span>{{ selected.neighborhood }} · {{ getCompatibility(selected) }}% match</span>
        <button type="button" @click="openRoom(selected)">Visit Room →</button>
      </div>
    </section>

    <section aria-label="Reader recommendations">
      <div class="heading-row"><h2>Fellow bookworms</h2><span>Based on your books & genres</span></div>
      <p v-if="!readers.length" class="empty">No readers match your search.</p>
      <article v-for="reader in readers" :key="reader.id" class="reader-card">
        <div class="card-top">
          <div class="avatar">{{ reader.initials }}</div>
          <div class="identity"><h3>{{ reader.displayName }}</h3><span>@{{ reader.username }} · {{ reader.neighborhood }}</span></div>
          <div class="score"><b>{{ getCompatibility(reader) }}%</b><small>match</small></div>
        </div>
        <p class="tagline">{{ reader.tagline }}</p>
        <div class="tag-row"><span v-for="genre in reader.favoriteGenres" :key="genre" class="tag">{{ genre }}</span></div>
        <p class="details">📖 Reading: <strong>{{ getCurrentlyReading(reader)?.title || 'Not currently reading' }}</strong></p>
        <p class="details">🤝 {{ getSharedBooks(reader).length }} shared book(s) · {{ getSharedGenres(reader).length }} shared genre(s)</p>
        <div class="card-actions">
          <button class="secondary" type="button" @click="activeId = reader.id">Show on map</button>
          <button class="secondary" type="button" @click="follow(reader)">{{ followed[reader.id] ? '✓ Following' : '+ Follow' }}</button>
          <button class="primary" type="button" @click="openRoom(reader)">Visit Room →</button>
        </div>
      </article>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>
    <p class="demo-note">Prototype: sample readers and local follows are stored in this browser only.</p>
  </main>
</template>

<style scoped>
.people-discover{padding:20px 16px 96px;color:#40372f;font-family:inherit}.discover-intro{margin:0 0 23px}.eyebrow{font-size:10px;font-weight:700;letter-spacing:2px;color:#9e806e}h1{font-size:29px;margin:8px 0}h2{font-size:17px;margin:0}h3{font-size:15px;margin:0 0 4px}.discover-intro p,.tagline{font-size:13px;color:#897b70}.search-label{display:block;font-size:12px;margin-bottom:8px;font-weight:700}.search{box-sizing:border-box;width:100%;padding:13px;background:white;border:1px solid #e2d3c2;border-radius:12px;font:inherit;font-size:13px}section{margin-top:25px}.heading-row{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}.heading-row span{font-size:10px;color:#937d6e;text-align:right}.map-box{position:relative;height:235px;background:#e8e6dc;border-radius:16px;overflow:hidden;border:1px solid #ded2c2}.map-frame{width:100%;height:100%;border:0;pointer-events:none}.map-pin{position:absolute;transform:translate(-50%,-100%);border:0;background:transparent;cursor:pointer;font-size:23px;filter:drop-shadow(0 1px 2px #555)}.map-pin.chosen{font-size:32px;z-index:2}.map-pin:focus-visible{outline:3px solid #5d4a8d;border-radius:12px}.map-note,.demo-note{font-size:10px;line-height:1.5;color:#8a7b6f}.selected-reader{margin-top:12px;padding:12px;border-radius:13px;background:#f2e9db;display:flex;flex-wrap:wrap;align-items:center;gap:8px}.selected-reader strong{font-size:13px}.selected-reader span{font-size:11px;color:#786755;flex:1}.selected-reader button,.primary{border:0;background:#745d4e;color:#fff;border-radius:10px;padding:10px 12px;font-size:12px;cursor:pointer}.reader-card{background:#fffdf9;border:1px solid #e9dece;border-radius:16px;padding:14px;margin:12px 0}.card-top{display:flex;gap:10px;align-items:center}.avatar{width:43px;height:43px;flex-shrink:0;border-radius:50%;display:grid;place-items:center;background:#d6e7d5;color:#396744;font-size:13px;font-weight:800}.identity{min-width:0;flex:1}.identity span{display:block;font-size:10px;color:#968476}.score{text-align:center;color:#23815c}.score b{display:block;font-size:18px}.score small{display:block;font-size:10px}.tagline{margin:10px 0}.tag-row{display:flex;gap:5px;flex-wrap:wrap}.tag{font-size:10px;background:#f3e8da;border-radius:20px;padding:5px 9px}.details{font-size:11px;margin:12px 0 0;color:#65574c}.card-actions{display:flex;gap:6px;margin-top:16px;flex-wrap:wrap}.card-actions button{flex:1;min-width:85px;white-space:nowrap}.secondary{background:#f4ede4;color:#755d4c;border:1px solid #e0d2c2;border-radius:10px;padding:10px 8px;cursor:pointer;font-size:12px}.empty,.error{font-size:13px;padding:15px;color:#a23d3d}.demo-note{margin-top:25px}
</style>
