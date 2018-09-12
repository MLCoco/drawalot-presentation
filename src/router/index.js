import Vue from 'vue'
import api from './../components/api'
import VueRouter from 'vue-router'
import Home from '@/components/Home'
import Lobby from '@/components/Lobby'
import Room from '@/components/Room'
import NotFoundComponent from '@/components/NotFoundComponent'

Vue.use(VueRouter);

function requireAuth (req, res, next) {
  if (!api.getCurrentUser()) {
    console.log('CHECKING FOR CURRENT USER')
    next({
      path: '/'
    })
  } else {
    next()
  }
}

export default new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      // when url redirects to localhost:xxxx/lobby, display this component
      path: '/lobby',
      name: 'Lobby',
      component: Lobby,
      beforeEnter: requireAuth
    },
    {
      path: '/room/:roomCode',
      name: 'Room',
      component: Room,
      beforeEnter: requireAuth,
      props: true
    },
    {
      path: '*',
      name: 'NotFoundComponent',
      component: NotFoundComponent
    }
  ]
})
