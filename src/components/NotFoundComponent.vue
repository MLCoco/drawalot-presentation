<template>
  <v-container fluid id="home">
    <img class="logo" src="./../../static/media/logo.png">
    <h1>404 Not Found</h1>
    <button v-on:click="home">Go to Home Page</button>
  </v-container>
</template>

<script>
    export default {
        name: "NotFoundComponent",
        methods: {
          home() {
            this.$router.push('/');
          }
        }
    }
</script>

<style scoped>
h1 {
  font-size: 4em;
}

button {
  width: 200px;
}

</style>
