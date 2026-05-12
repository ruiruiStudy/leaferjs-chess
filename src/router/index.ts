import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import GamePage from '@/pages/GamePage.vue'
import HistoryPage from '@/pages/HistoryPage.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomePage,
    },
    {
        path: '/game',
        name: 'game',
        component: GamePage,
    },
    {
        path: '/history',
        name: 'history',
        component: HistoryPage,
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
