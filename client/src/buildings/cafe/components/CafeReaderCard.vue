<script setup>
// AI-assisted presentation component — review and record in AI_USAGE.md.
defineProps({
  reader: { type: Object, required: true },
})
const emit = defineEmits(['close', 'visit'])
</script>

<template>
  <aside class="cafe-detail" aria-label="Selected reader">
    <button type="button" class="cafe-detail__close" aria-label="Close reader details" @click="emit('close')">×</button>
    <div class="cafe-detail__intro">
      <div class="cafe-detail__initials" aria-hidden="true">{{ reader.displayName.charAt(0).toUpperCase() }}</div>
      <div class="cafe-detail__who">
        <strong>{{ reader.displayName }}</strong>
        <span v-if="reader.username">@{{ reader.username }}</span>
        <small v-if="reader.isDemo" class="cafe-detail__demo">Demo profile · not a database account</small>
      </div>
      <span class="cafe-detail__match">
        {{ reader.compatibility == null ? 'Match unavailable' : `${reader.compatibility}% match` }}
      </span>
    </div>
    <p class="cafe-detail__title">Favourite genres</p>
    <div class="cafe-detail__genres">
      <span v-for="genre in reader.favoriteGenres" :key="genre">{{ genre }}</span>
      <span v-if="!reader.favoriteGenres.length">Not shared yet</span>
    </div>
    <button type="button" class="cafe-detail__visit" @click="emit('visit')">View Room →</button>
  </aside>
</template>

<style scoped>
.cafe-detail{position:relative;background:#fffbf1;color:#392c25;border:3px solid #5d4537;border-radius:14px;box-shadow:6px 8px 0 #35262166;padding:18px;min-width:0;font-family:var(--rl-font-body,system-ui,sans-serif)}
.cafe-detail__close{position:absolute;right:8px;top:4px;border:0;background:transparent;font-size:25px;color:#624635;cursor:pointer;line-height:1.3}
.cafe-detail__intro{display:flex;align-items:center;gap:9px;padding-right:20px;flex-wrap:wrap}
.cafe-detail__initials{width:42px;height:42px;flex:none;display:grid;place-items:center;background:#d5e6d9;border:2px solid #5f8972;border-radius:7px;color:#33553f;font-weight:800}
.cafe-detail__who{min-width:70px;flex:1}.cafe-detail__who strong{display:block;font-size:15px}.cafe-detail__who span{display:block;font-size:11px;color:#836e5d}
.cafe-detail__demo{display:block;font-size:10px;color:#8c7562;margin-top:3px}
.cafe-detail__match{background:#2e7154;color:white;border-radius:15px;font-size:11px;font-weight:700;padding:5px 8px;white-space:nowrap}
.cafe-detail__title{font-size:11px;font-weight:800;margin:12px 0 6px}
.cafe-detail__genres{display:flex;flex-wrap:wrap;gap:5px}
.cafe-detail__genres span{background:#f0e2ce;padding:5px 8px;border-radius:14px;font-size:11px}
.cafe-detail__visit{display:block;width:100%;margin-top:13px;border:0;border-radius:9px;background:#5d4537;color:#fff;padding:10px 16px;font-weight:750;cursor:pointer;font-size:13px}
.cafe-detail__visit:hover{background:#3c2d26}
@media (max-width:640px){.cafe-detail{border-radius:16px 16px 0 0;padding:13px 15px;box-shadow:0 -4px 22px #25181355}.cafe-detail__initials{width:35px;height:35px}.cafe-detail__visit{margin-top:8px}.cafe-detail__genres span{padding:3px 7px}}
</style>
