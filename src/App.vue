<template>
  <div id="app">
    <v-app>
      <v-content>
        <transition v-if="$route.name !== 'Room'" name="router-anim" mode="out-in"
                    enter-active-class="animated fadeIn"
                    leave-active-class="animated fadeOut">
          <router-view/>
        </transition>
        <router-view v-else/>
      </v-content>
    </v-app>
  </div>
</template>

<script>
export default {
  name: "App"
};
</script>

<style>
  @import "./components/animate.css";
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  font-size: large;
}
.logo {
  border-radius: 30px;
  height: 229px;
  width: 330px;
}

button {
  font-size: 20px;
  height: 50px;
  width: 100px;
  display: inline-block;
  margin: 15px 32px;
}

button:hover {
  border-radius: 20px;
  border-style: outset;

}

.form-input {
  font-size: 14px;
  font-weight: 800;
  height: 50px;
}

#home, #lobby {
  height:105%;
  background-image: url("./../static/media/background.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
</style>
