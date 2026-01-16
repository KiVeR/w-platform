import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/editor/1',
  },
  {
    path: '/editor',
    redirect: '/editor/1',
  },
  {
    path: '/editor/:id',
    name: 'editor',
    component: () => import('@/views/EditorView.vue'),
    props: true,
    meta: { title: 'Editeur Landing Page' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  document.title = (to.meta.title as string) || 'Landing Page Editor'
})

export default router
