// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuetify from 'vuetify'
import Peer from 'peerjs'
import App from './App'
import router from './router'
import 'jquery/dist/jquery.min.js'
require('@/../node_modules/vuetify/dist/vuetify.min.css')
// require('@/../src/components/vuetify.css')

Vue.use(Vuetify)

Vue.config.productionTip = false

const peer = new Peer({ host: 'drawalot-peerjs.herokuapp.com', port: 443, secure: true }) // establish connection with PeerServer, no need to wait for open because by the time we access it in the component, connection should be established

Vue.prototype.$peer = peer // define this.$peer so it can be used in all components

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
