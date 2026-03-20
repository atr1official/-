<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();
const { data } = storeToRefs(store);

const userLocation = computed(() => {
  const location = data.value.系统.当前地点;
  return typeof location === 'object' ? location['{{user}}'] : '';
});

const shixiaInnerThoughts = computed(() => data.value.时夏['对{{user}}的内心话']);
const liyuanInnerThoughts = computed(() => data.value.栗原['对{{user}}的心理话']);

const shixiaImage = computed(() => {
  if (data.value['{{user}}的选择'].时夏) {
    return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/时夏.png';
  }

  if (data.value['{{user}}的选择'].栗原) {
    return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/时夏leave.png';
  }

  return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/时夏normal.png';
});

const liyuanImage = computed(() => {
  if (data.value['{{user}}的选择'].时夏) {
    return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/栗原leave.png';
  }

  if (data.value['{{user}}的选择'].栗原) {
    return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/栗原.png';
  }

  return 'https://raw.githubusercontent.com/atr1official/atri_official/main/时夏&栗原/栗原normal.png';
});
</script>

<template>
  <div
    class="relative mt-4 flex w-full select-none flex-col gap-4 rounded-xl border-4 border-black bg-gray-900 p-4 font-sans shadow-2xl md:gap-8 md:p-5 md:flex-row"
    style="background-image: radial-gradient(#333 2px, transparent 2px); background-size: 12px 12px"
  >
    <div
      class="absolute -top-4 left-1/2 z-30 flex -translate-x-1/2 transform gap-4 rounded-full border-2 border-black bg-white px-5 py-1.5 text-xs font-bold whitespace-nowrap shadow-[2px_2px_0px_rgba(0,0,0,1)]"
    >
      <div class="tracking-wide text-blue-600">{{ data.系统.日期 }} {{ data.系统.时间 }}</div>
      <div class="w-px bg-black/30"></div>
      <div v-if="typeof data.系统.当前地点 === 'object'" class="flex gap-4 text-gray-800">
        <span><span class="text-blue-600">时夏:</span> {{ data.系统.当前地点.时夏 }}</span>
        <span><span class="text-yellow-600">栗原:</span> {{ data.系统.当前地点.栗原 }}</span>
        <span><span class="text-green-600">你:</span> {{ userLocation }}</span>
      </div>
      <div v-else class="text-gray-500">地点待初始化</div>
    </div>

    <div
      class="relative flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-lg border-4 border-black bg-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
    >
      <div class="absolute inset-0 opacity-40 blur-md">
        <img :src="shixiaImage" class="h-full w-full object-cover" alt="" />
      </div>
      <div class="absolute inset-0 flex items-center justify-center p-2">
        <img :src="shixiaImage" class="max-h-full max-w-full object-contain drop-shadow-lg" alt="时夏" />
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

      <div class="absolute bottom-0 left-0 z-10 flex w-full flex-col p-4 md:pr-10">
        <div class="mb-3 flex items-end justify-between">
          <div
            class="text-4xl font-black tracking-wider text-blue-400/90 italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            时夏
          </div>
          <div class="w-1/2 max-w-[200px]">
            <div class="mb-1 flex justify-between text-xs font-bold text-blue-200/90 drop-shadow-md">
              <span>爱意隐藏值</span>
              <span>{{ data.时夏.爱隐藏值 }} / 200</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full border border-blue-900/50 bg-gray-900/50 shadow-inner">
              <div
                class="h-full bg-gradient-to-r from-blue-600/80 to-blue-400/80"
                :style="{ width: `${(data.时夏.爱隐藏值 / 200) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="rounded border-l-4 border-blue-500/70 bg-black/30 p-2 shadow backdrop-blur-sm">
            <div class="mb-0.5 text-xs font-bold text-blue-300/90">对你的内心话</div>
            <div class="text-sm text-white/80 italic">"{{ shixiaInnerThoughts }}"</div>
          </div>

          <div class="rounded border-l-4 border-gray-500/70 bg-black/30 p-2 shadow backdrop-blur-sm">
            <div class="mb-0.5 text-xs font-bold text-gray-300/90">对栗原</div>
            <div class="text-sm text-white/70">"{{ data.时夏.对栗原 }}"</div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="relative flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-lg border-4 border-black bg-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
    >
      <div class="absolute inset-0 opacity-40 blur-md">
        <img :src="liyuanImage" class="h-full w-full object-cover" alt="" />
      </div>
      <div class="absolute inset-0 flex items-center justify-center p-2">
        <img :src="liyuanImage" class="max-h-full max-w-full object-contain drop-shadow-lg" alt="栗原" />
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

      <div class="absolute bottom-0 left-0 z-10 flex w-full flex-col p-4 md:pl-10">
        <div class="mb-3 flex items-end justify-between">
          <div
            class="text-4xl font-black tracking-wider text-yellow-400/90 italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            栗原
          </div>
          <div class="w-1/2 max-w-[200px]">
            <div class="mb-1 flex justify-between text-xs font-bold text-yellow-200/90 drop-shadow-md">
              <span>灰心度</span>
              <span>{{ data.栗原.灰心度 }} / 200</span>
            </div>
            <div
              class="h-2 w-full overflow-hidden rounded-full border border-yellow-900/50 bg-gray-900/50 shadow-inner"
            >
              <div
                class="h-full bg-gradient-to-r from-yellow-600/80 to-yellow-400/80"
                :style="{ width: `${(data.栗原.灰心度 / 200) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="rounded border-l-4 border-yellow-500/70 bg-black/30 p-2 shadow backdrop-blur-sm">
            <div class="mb-0.5 text-xs font-bold text-yellow-300/90">对你的心理话</div>
            <div class="text-sm text-white/80 italic">"{{ liyuanInnerThoughts }}"</div>
          </div>

          <div class="rounded border-l-4 border-gray-500/70 bg-black/30 p-2 shadow backdrop-blur-sm">
            <div class="mb-0.5 text-xs font-bold text-gray-300/90">对时夏</div>
            <div class="text-sm text-white/70">"{{ data.栗原.对时夏 }}"</div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="absolute top-[46%] left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-4 border-black bg-white px-3 py-2 text-2xl font-black text-black italic shadow-[4px_4px_0px_rgba(0,0,0,1)] md:px-4 md:py-2.5 md:text-3xl"
      style="font-family: 'Comic Sans MS', cursive, sans-serif"
    >
      VS
    </div>
  </div>
</template>
