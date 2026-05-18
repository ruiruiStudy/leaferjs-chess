<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useChessBoard } from '@/composables/useChessBoard'
import { PIECE_NAMES } from '@/utils/chess-engine'
import {
  ArrowLeft,
  Trash2,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Play,
  Pause,
  Hand,
  ArrowRight
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const store = useGameStore()

const boardContainerRef = ref<HTMLElement | null>(null)

const isReplayMode = computed(() => store.gameRecord !== null && store.replayBoard !== null)

const boardState = computed(() => store.replayBoard)

const selectedPosComputed = computed(() =>
  store.replayMode === 'sandbox' ? store.selectedPos : null
)

const validMovesComputed = computed(() =>
  store.replayMode === 'sandbox' ? store.validMoves : []
)

const hintMoveComputed = computed(() => null)

const lastMoveComputed = computed(() => {
  if (!store.gameRecord?.moves || store.replayStep <= 0) return null
  const move = store.gameRecord.moves[store.replayStep - 1]
  if (!move) return null
  return { from: move.from, to: move.to }
})

function handleBoardClick(pos: { row: number; col: number }) {
  if (store.replayMode === 'sandbox') {
    store.sandboxSelectPiece(pos)
  }
}

const { BOARD_WIDTH, BOARD_HEIGHT, init, destroy } = useChessBoard(
  boardContainerRef,
  boardState as any,
  selectedPosComputed as any,
  validMovesComputed as any,
  hintMoveComputed as any,
  lastMoveComputed as any,
  handleBoardClick
)

const isAutoPlaying = ref(false)
let autoPlayTimer: ReturnType<typeof setInterval> | null = null

function startAutoPlay() {
  isAutoPlaying.value = true
  autoPlayTimer = setInterval(() => {
    if (store.replayStep >= (store.gameRecord?.moves?.length ?? 0)) {
      stopAutoPlay()
      return
    }
    store.replayNext()
  }, 1500)
}

function stopAutoPlay() {
  isAutoPlaying.value = false
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

function toggleAutoPlay() {
  if (isAutoPlaying.value) {
    stopAutoPlay()
  } else {
    startAutoPlay()
  }
}

function toggleSandbox() {
  if (store.replayMode === 'sandbox') {
    store.exitSandbox()
  } else {
    store.enterSandbox()
  }
}

function exitReplay() {
  stopAutoPlay()
  store.gameRecord = null
  store.replayBoard = null
  store.replayStep = 0
  store.replayMode = 'browse'
  store.selectedPos = null
  store.validMoves = []
  store.sandboxOriginalBoard = null
}

const difficultyMap: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
}

const resultMap: Record<string, string> = {
  red_win: '红方胜',
  black_win: '黑方胜',
  draw: '和棋',
  ongoing: '进行中'
}

function resultColor(result: string): string {
  switch (result) {
    case 'red_win': return 'text-[#C41E3A]'
    case 'black_win': return 'text-gray-400'
    case 'draw': return 'text-[#D4A843]'
    case 'ongoing': return 'text-yellow-400'
    default: return 'text-gray-300'
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

watch(isReplayMode, async (val) => {
  if (val) {
    await nextTick()
    init()
  } else {
    destroy()
    stopAutoPlay()
  }
})

watch(() => store.replayStep, () => {
  nextTick(() => {
    const el = document.getElementById('move-' + (store.replayStep - 1))
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
})

onMounted(() => {
  store.loadHistory()
  if (route.query.mode === 'replay' && isReplayMode.value) {
    nextTick(() => init())
  }
})

onUnmounted(() => {
  stopAutoPlay()
  destroy()
})
</script>

<template>
  <div class="relative min-h-screen overflow-x-hidden" style="background: linear-gradient(160deg, #0D0D1A 0%, #1A1A2E 40%, #16213E 100%)">
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 59px, #D4A843 59px, #D4A843 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, #D4A843 59px, #D4A843 60px)"></div>

    <div v-if="!isReplayMode" class="relative z-10 max-w-2xl mx-auto p-4">
      <div class="flex items-center mb-6">
        <button
          @click="router.push('/')"
          class="p-2 rounded-lg transition-colors duration-300 hover:bg-[#8B4513]/30"
        >
          <ArrowLeft class="w-6 h-6 text-[#D4A843]" />
        </button>
        <h1 class="text-2xl font-bold text-[#D4A843] ml-3 tracking-widest" style="font-family: 'STKaiti', 'KaiTi', serif">
          历史对局
        </h1>
      </div>

      <div v-if="store.historyRecords.length === 0" class="text-center py-20">
        <p class="text-gray-400 text-lg" style="font-family: 'STKaiti', 'KaiTi', serif">暂无对局记录</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="record in store.historyRecords"
          :key="record.id"
          class="rounded-lg p-4 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-lg"
          style="background: rgba(139, 69, 19, 0.12); border: 1px solid rgba(139, 69, 19, 0.25)"
          @click="store.startReplay(record.id)"
        >
          <div class="flex justify-between items-center">
            <div>
              <p class="text-[#D4A843] font-medium" style="font-family: 'STKaiti', 'KaiTi', serif">
                {{ formatDate(record.date) }}
              </p>
              <div class="flex gap-3 mt-1">
                <span class="text-sm text-gray-300">{{ difficultyMap[record.difficulty] || record.difficulty }}</span>
                <span class="text-sm" :class="resultColor(record.result)">{{ resultMap[record.result] || record.result }}</span>
              </div>
            </div>
            <button
              @click.stop="store.deleteHistoryRecord(record.id)"
              class="p-2 rounded-lg transition-colors duration-200 hover:bg-red-900/30"
            >
              <Trash2 class="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="relative z-10 flex flex-col lg:flex-row min-h-screen">
      <div class="flex-1 flex items-center justify-center p-4">
        <div class="rounded-lg" style="box-shadow: 0 0 30px rgba(139, 69, 19, 0.25), 0 0 60px rgba(212, 168, 67, 0.08)">
          <div ref="boardContainerRef" :style="{ width: BOARD_WIDTH + 'px', height: BOARD_HEIGHT + 'px' }"></div>
        </div>
      </div>

      <div class="lg:w-80 xl:w-96 p-4 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l" style="border-color: rgba(139, 69, 19, 0.25)">
        <div
          v-if="store.replayMode === 'sandbox'"
          class="bg-yellow-600 text-black text-center py-2 rounded-lg font-bold tracking-wider"
          style="font-family: 'STKaiti', 'KaiTi', serif"
        >
          沙盘模式
        </div>

        <div v-if="store.gameRecord" class="text-center text-sm text-gray-400" style="font-family: 'STKaiti', 'KaiTi', serif">
          <p>{{ formatDate(store.gameRecord.date) }} · {{ difficultyMap[store.gameRecord.difficulty] }}</p>
          <p :class="resultColor(store.gameRecord.result)">{{ resultMap[store.gameRecord.result] }}</p>
        </div>

        <div class="text-center">
          <span class="text-[#D4A843] text-lg font-bold" style="font-family: 'STKaiti', 'KaiTi', serif">
            {{ store.replayStep }} / {{ store.gameRecord?.moves?.length ?? 0 }}
          </span>
        </div>

        <div class="flex justify-center gap-2">
          <button
            @click="store.replayFirst()"
            class="p-2.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            style="background: rgba(139, 69, 19, 0.2)"
          >
            <SkipBack class="w-5 h-5 text-[#D4A843]" />
          </button>
          <button
            @click="store.replayPrev()"
            class="p-2.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            style="background: rgba(139, 69, 19, 0.2)"
          >
            <ChevronLeft class="w-5 h-5 text-[#D4A843]" />
          </button>
          <button
            @click="toggleAutoPlay"
            class="p-2.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            style="background: rgba(196, 30, 58, 0.2)"
          >
            <Pause v-if="isAutoPlaying" class="w-5 h-5 text-[#C41E3A]" />
            <Play v-else class="w-5 h-5 text-[#C41E3A]" />
          </button>
          <button
            @click="store.replayNext()"
            class="p-2.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            style="background: rgba(139, 69, 19, 0.2)"
          >
            <ChevronRight class="w-5 h-5 text-[#D4A843]" />
          </button>
          <button
            @click="store.replayLast()"
            class="p-2.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            style="background: rgba(139, 69, 19, 0.2)"
          >
            <SkipForward class="w-5 h-5 text-[#D4A843]" />
          </button>
        </div>

        <button
          @click="toggleSandbox()"
          class="py-2.5 px-4 rounded-lg font-bold tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95"
          :class="store.replayMode === 'sandbox'
            ? 'bg-yellow-600 text-black hover:bg-yellow-500'
            : 'text-[#D4A843] hover:bg-[#8B4513]/30'"
          :style="store.replayMode !== 'sandbox' ? 'background: rgba(139, 69, 19, 0.2); font-family: STKaiti, KaiTi, serif' : 'font-family: STKaiti, KaiTi, serif'"
        >
          <Hand v-if="store.replayMode === 'sandbox'" class="w-4 h-4 inline mr-1.5" />
          <ArrowRight v-else class="w-4 h-4 inline mr-1.5" />
          {{ store.replayMode === 'sandbox' ? '退出沙盘' : '沙盘推演' }}
        </button>

        <div class="flex-1 overflow-y-auto rounded-lg p-3 max-h-60 lg:max-h-none" style="background: rgba(139, 69, 19, 0.08)">
          <div
            v-for="(move, index) in store.gameRecord?.moves"
            :key="index"
            :id="'move-' + index"
            class="py-1.5 px-2 rounded text-sm cursor-pointer transition-colors duration-200 hover:bg-[#8B4513]/20"
            :class="index === store.replayStep - 1 ? 'bg-[#D4A843]/20 text-[#D4A843]' : 'text-gray-300'"
            @click="store.replayGoToStep(index + 1)"
          >
            {{ index + 1 }}. {{ PIECE_NAMES[move.piece] || '?' }}
          </div>
        </div>

        <button
          @click="exitReplay()"
          class="py-2.5 px-4 rounded-lg font-bold tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95 text-[#D4A843]"
          style="background: rgba(139, 69, 19, 0.2); font-family: 'STKaiti', 'KaiTi', serif"
        >
          <ArrowLeft class="w-4 h-4 inline mr-1.5" />
          返回列表
        </button>
      </div>
    </div>
  </div>
</template>
