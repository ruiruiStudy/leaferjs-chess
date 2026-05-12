<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, type Difficulty } from '@/stores/gameStore'
import { Play, History, X, Sword, Shield, Crown } from 'lucide-vue-next'

const router = useRouter()
const store = useGameStore()
const showDifficultyModal = ref(false)

function openDifficultyModal() {
  showDifficultyModal.value = true
}

function closeDifficultyModal() {
  showDifficultyModal.value = false
}

function selectDifficulty(diff: Difficulty) {
  store.startGame(diff)
  router.push('/game')
}

function goToHistory() {
  router.push('/history')
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden flex flex-col items-center justify-center" style="background: linear-gradient(160deg, #0D0D1A 0%, #1A1A2E 40%, #16213E 100%)">
    <div class="absolute inset-0 opacity-[0.04]" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 59px, #D4A843 59px, #D4A843 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, #D4A843 59px, #D4A843 60px)"></div>
    <div class="absolute inset-0 opacity-[0.02]" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 30px, #8B4513 30px, #8B4513 31px)"></div>

    <div class="relative z-10 flex flex-col items-center gap-10 px-4">
      <div class="flex flex-col items-center gap-6">
        <div class="relative w-28 h-28 rounded-full flex items-center justify-center border-4 shadow-lg shadow-red-900/30" style="background: radial-gradient(circle at 40% 35%, #F5E6C8, #D4A843 60%, #8B4513); border-color: #C41E3A">
          <span class="text-4xl font-bold select-none" style="color: #1A1A2E; font-family: 'STKaiti', 'KaiTi', serif">帅</span>
        </div>

        <h1 class="text-6xl md:text-7xl font-bold tracking-widest" style="color: #D4A843; font-family: 'STKaiti', 'KaiTi', serif; text-shadow: 0 0 40px rgba(212, 168, 67, 0.3), 0 4px 8px rgba(0,0,0,0.5)">
          中国象棋
        </h1>

        <p class="text-lg md:text-xl tracking-[0.5em]" style="color: #C41E3A; font-family: 'STKaiti', 'KaiTi', serif; text-shadow: 0 2px 4px rgba(0,0,0,0.4)">
          楚河汉界，智谋对决
        </p>

        <div class="w-48 h-px mt-2" style="background: linear-gradient(90deg, transparent, #D4A843, transparent)"></div>
      </div>

      <div class="flex flex-col sm:flex-row gap-5 mt-4">
        <button
          @click="openDifficultyModal"
          class="group relative px-10 py-4 rounded-lg text-xl font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 flex items-center gap-3"
          style="background: linear-gradient(135deg, #C41E3A, #A01830); color: #F5E6C8; font-family: 'STKaiti', 'KaiTi', serif; box-shadow: 0 4px 20px rgba(196, 30, 58, 0.4)"
        >
          <Play :size="22" class="transition-transform duration-300 group-hover:translate-x-0.5" />
          开始对局
        </button>

        <button
          @click="goToHistory"
          class="group relative px-10 py-4 rounded-lg text-xl font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 flex items-center gap-3"
          style="background: linear-gradient(135deg, #8B4513, #6B3410); color: #D4A843; font-family: 'STKaiti', 'KaiTi', serif; box-shadow: 0 4px 20px rgba(139, 69, 19, 0.4)"
        >
          <History :size="22" class="transition-transform duration-300 group-hover:-translate-x-0.5" />
          历史对局
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDifficultyModal"
          class="fixed inset-0 z-50 flex items-center justify-center px-4"
          @click.self="closeDifficultyModal"
        >
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

          <div class="relative w-full max-w-md rounded-xl p-8 shadow-2xl" style="background: linear-gradient(160deg, #1A1A2E, #16213E); border: 1px solid rgba(212, 168, 67, 0.2)">
            <button
              @click="closeDifficultyModal"
              class="absolute top-4 right-4 p-1 rounded-full transition-colors duration-200 hover:bg-white/10"
              style="color: #D4A843"
            >
              <X :size="20" />
            </button>

            <h2 class="text-3xl font-bold text-center mb-8 tracking-widest" style="color: #D4A843; font-family: 'STKaiti', 'KaiTi', serif">
              选择难度
            </h2>

            <div class="flex flex-col gap-4">
              <button
                @click="selectDifficulty('easy')"
                class="group w-full py-4 px-6 rounded-lg text-lg font-bold tracking-wider transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
                style="background: linear-gradient(135deg, #2D6A4F, #1B4332); color: #95D5B2; border: 1px solid rgba(149, 213, 178, 0.2); font-family: 'STKaiti', 'KaiTi', serif"
              >
                <Shield :size="20" class="transition-transform duration-300 group-hover:scale-110" />
                简单
              </button>

              <button
                @click="selectDifficulty('medium')"
                class="group w-full py-4 px-6 rounded-lg text-lg font-bold tracking-wider transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
                style="background: linear-gradient(135deg, #B45309, #92400E); color: #FCD34D; border: 1px solid rgba(252, 211, 77, 0.2); font-family: 'STKaiti', 'KaiTi', serif"
              >
                <Sword :size="20" class="transition-transform duration-300 group-hover:scale-110" />
                中等
              </button>

              <button
                @click="selectDifficulty('hard')"
                class="group w-full py-4 px-6 rounded-lg text-lg font-bold tracking-wider transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
                style="background: linear-gradient(135deg, #991B1B, #7F1D1D); color: #FCA5A5; border: 1px solid rgba(252, 165, 165, 0.2); font-family: 'STKaiti', 'KaiTi', serif"
              >
                <Crown :size="20" class="transition-transform duration-300 group-hover:scale-110" />
                困难
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
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
