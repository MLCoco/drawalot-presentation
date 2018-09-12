<template>
    <v-container fluid id="home">
      <img class="logo" src="./../../static/media/logo.png">
      <v-container>
        <v-flex class="text-xs-center login">
          <v-text-field class="form-input" v-model="username" type="text" label="Enter your username" required/>
          <v-text-field class="form-input" v-model="password" type="password" label="Enter your password" required/>
        </v-flex>
      </v-container>
      <button v-on:click="login">Login</button>
      <button v-on:click="signup">Sign up</button>
      <div>
        <a href="/api/login/google">Log In with Google</a>
      </div>
      <div class="alert"></div>
    </v-container>
</template>

<script>
  const api = require('./api.js').default;

export default {
  name: 'Home',
  data() {
    return {
      username: '',
      password: ''
    }
  },
  created() {},
  mounted() {},
  methods: {
    login() {
      api.signin(this.username, this.password, (err, res) => {
        if (err) document.querySelector('.alert').innerHTML = err;
        else this.$router.push('/lobby')
      })
    },
    signup() {
      api.signup(this.username, this.password, (err, res) => {
        if (err) document.querySelector('.alert').innerHTML = err;
        else this.$router.push('/lobby')
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin: 0 10px;
  }

  a {
    color: #42b983;
  }

  .alert{
    margin-top: 30px;
    color: #2B2922;
    justify-content: center;
  }
</style>
