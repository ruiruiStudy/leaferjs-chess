<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/gameStore'
import { useChessBoard } from '@/composables/useChessBoard'
import { PIECE_NAMES } from '@/utils/chess-engine'
import { saveGameRecord } from '@/utils/game-record'
import { RotateCcw, LogOut, Lightbulb, Trophy, Play, Search } from 'lucide-vue-next'

const router = useRouter()
const store = useGameStore()
const { board, selectedPos, validMoves, hintMove, lastMove } = storeToRefs(store)

const boardContainerRef = ref<HTMLElement | null>(null)

const { BOARD_WIDTH, BOARD_HEIGHT } = useChessBoard(
  boardContainerRef,
  board,
  selectedPos,
  validMoves,
  hintMove,
  lastMove,
  (pos) => store.selectPiece(pos)
)

const turnLabel = computed(() => store.currentSide === 'red' ? '红方' : '黑方')
const isRedTurn = computed(() => store.currentSide === 'red')

const resultText = computed(() => {
  if (store.gameResult === 'red_win') return '红方胜!'
  if (store.gameResult === 'black_win') return '黑方胜!'
  return '和棋!'
})

const redCapturedNames = computed(() => store.capturedRed.map(p => PIECE_NAMES[p]))
const blackCapturedNames = computed(() => store.capturedBlack.map(p => PIECE_NAMES[p]))

function handleRestart() {
  store.restartGame()
}

function handleQuit() {
  store.quitGame()
  router.push('/')
}

function handleHint() {
  store.requestHint()
}

function handleContinue() {
  store.restartGame()
}

function handleReview() {
  if (store.gameRecord) {
    saveGameRecord(store.gameRecord)
  }
  router.push('/history')
}
</script>

<template>
  <div class="relative min-h-screen flex flex-col items-center py-4 px-2 overflow-x-hidden" style="background: linear-gradient(160deg, #0D0D1A 0%, #1A1A2E 40%, #16213E 100%)">
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 59px, #D4A843 59px, #D4A843 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, #D4A843 59px, #D4A843 60px)"></div>

    <div class="relative z-10 flex flex-col items-center w-full">
      <div class="w-full flex flex-col items-center gap-2 mb-3" :style="{ maxWidth: BOARD_WIDTH + 'px' }">
        <div class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg" style="background: rgba(139, 69, 19, 0.12); border: 1px solid rgba(212, 168, 67, 0.12)">
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full shadow-sm"
              :style="{ backgroundColor: isRedTurn ? '#C41E3A' : '#9CA3AF', boxShadow: isRedTurn ? '0 0 8px rgba(196, 30, 58, 0.5)' : '0 0 8px rgba(156, 163, 175, 0.3)' }"
            ></span>
            <span
              class="text-lg font-bold tracking-wider"
              :style="{ color: isRedTurn ? '#C41E3A' : '#9CA3AF', fontFamily: 'STKaiti, KaiTi, serif' }"
            >
              {{ turnLabel }}
            </span>
          </div>

          <div
            v-if="store.isInCheckState"
            class="check-blink text-xl font-bold tracking-widest"
            style="color: #C41E3A; font-family: 'STKaiti', 'KaiTi', serif; text-shadow: 0 0 12px rgba(196, 30, 58, 0.6)"
          >
            将军!
          </div>

          <div
            v-if="store.isAiThinking"
            class="flex items-center gap-1.5 animate-pulse"
          >
            <span class="text-base tracking-wider" style="color: #D4A843; font-family: 'STKaiti', 'KaiTi', serif">思考中...</span>
          </div>
        </div>

        <div class="w-full flex items-start justify-between px-2 gap-4">
          <div class="flex items-center gap-1 flex-wrap">
            <span class="text-xs tracking-wider shrink-0" style="color: #C41E3A; font-family: 'STKaiti', 'KaiTi', serif">红方得:</span>
            <span
              v-for="(name, i) in redCapturedNames"
              :key="'rc-' + i"
              class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style="background: rgba(245, 230, 200, 0.1); color: #9CA3AF; border: 1px solid rgba(156, 163, 175, 0.25); font-family: 'STKaiti', 'KaiTi', serif"
            >{{ name }}</span>
          </div>
          <div class="flex items-center gap-1 flex-wrap justify-end">
            <span class="text-xs tracking-wider shrink-0" style="color: #9CA3AF; font-family: 'STKaiti', 'KaiTi', serif">黑方得:</span>
            <span
              v-for="(name, i) in blackCapturedNames"
              :key="'bc-' + i"
              class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style="background: rgba(245, 230, 200, 0.1); color: #C41E3A; border: 1px solid rgba(196, 30, 58, 0.25); font-family: 'STKaiti', 'KaiTi', serif"
            >{{ name }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-lg" style="box-shadow: 0 0 30px rgba(139, 69, 19, 0.25), 0 0 60px rgba(212, 168, 67, 0.08)">
        <div ref="boardContainerRef" :style="{ width: BOARD_WIDTH + 'px', height: BOARD_HEIGHT + 'px' }"></div>
      </div>

      <div class="flex items-center gap-3 mt-5">
        <button
          @click="handleRestart"
          class="group flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          style="background: linear-gradient(135deg, #8B4513, #6B3410); color: #D4A843; font-family: 'STKaiti', 'KaiTi', serif; box-shadow: 0 2px 12px rgba(139, 69, 19, 0.4)"
        >
          <RotateCcw :size="18" class="transition-transform duration-300 group-hover:-rotate-45" />
          重新开始
        </button>
        <button
          @click="handleQuit"
          class="group flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          style="background: linear-gradient(135deg, #374151, #1F2937); color: #9CA3AF; font-family: 'STKaiti', 'KaiTi', serif; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); border: 1px solid rgba(156, 163, 175, 0.12)"
        >
          <LogOut :size="18" class="transition-transform duration-300 group-hover:translate-x-0.5" />
          退出本局
        </button>
        <button
          @click="handleHint"
          class="group flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          style="background: linear-gradient(135deg, #D4A843, #B8922E); color: #1A1A2E; font-family: 'STKaiti', 'KaiTi', serif; box-shadow: 0 2px 12px rgba(212, 168, 67, 0.4)"
        >
          <Lightbulb :size="18" class="transition-transform duration-300 group-hover:scale-110" />
          请求支招
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="store.phase === 'ended'"
          class="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

          <div class="relative w-full max-w-sm rounded-xl p-8 flex flex-col items-center gap-6 shadow-2xl" style="background: linear-gradient(160deg, #1A1A2E, #16213E); border: 1px solid rgba(212, 168, 67, 0.2)">
            <Trophy :size="56" style="color: #D4A843; filter: drop-shadow(0 0 12px rgba(212, 168, 67, 0.4))" />

            <div class="text-3xl font-bold tracking-widest" style="color: #D4A843; font-family: 'STKaiti', 'KaiTi', serif; text-shadow: 0 0 20px rgba(212, 168, 67, 0.3)">
              {{ resultText }}
            </div>

            <div class="w-32 h-px" style="background: linear-gradient(90deg, transparent, #D4A843, transparent)"></div>

            <div class="flex items-center gap-4 w-full">
              <button
                @click="handleContinue"
                class="group flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-base font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                style="background: linear-gradient(135deg, #C41E3A, #A01830); color: #F5E6C8; font-family: 'STKaiti', 'KaiTi', serif; box-shadow: 0 4px 15px rgba(196, 30, 58, 0.4)"
              >
                <Play :size="18" class="transition-transform duration-300 group-hover:translate-x-0.5" />
                继续对局
              </button>
              <button
                @click="handleReview"
                class="group flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-base font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                style="background: linear-gradient(135deg, #8B4513, #6B3410); color: #D4A843; font-family: 'STKaiti', 'KaiTi', serif; box-shadow: 0 4px 15px rgba(139, 69, 19, 0.4)"
              >
                <Search :size="18" class="transition-transform duration-300 group-hover:scale-110" />
                复盘分析
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
.check-blink {
  animation: blink 0.8s ease-in-out infinite;
}
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.9);
  opacity: 0;
}
</style>
