<template>
    <v-container fluid id="lobby">
      <img class="logo" src="./../../static/media/logo.png">
      <div class="create" v-if='status !== "inRoom"'>
        <button v-on:click='createRoom' class='create-room'>Create Room</button>
        <div>OR</div>
        <form v-on:submit.prevent='joinRoom' class="roomForm">
          <v-text-field v-model='roomCode' class="form-input" type='text' label='Enter room code' name='roomCode' id='roomCode'></v-text-field>
          <button type='submit' class='join-room'>Join Room</button>
        </form>
      </div>
      <div class="create" v-else>
            <span>
              <p>Your peer id is {{ myId }}</p>
              <p>Your room code is {{ roomCode }}</p>
              <p>There are currently {{ numPlayers }} players in the room</p>
              <button v-on:click='searchForOpponent'>Refresh</button>
            </span>
      </div>
    </v-container>
</template>

<script>
var peerjs = require('./peer.js')

export default {
  name: 'Lobby',
  data() {
    return {
      p: '',
      status: '', // toggle frontend, 2 states: waiting in a room or not in a room
      myId: '',
      roomCode: '',
      connectedPeers: {},
      numPeers: 0,
      role: '',
      show: true,
      host: false,
      words: null, // list of 20 words chosen from the db
      opponentConnection: null
    }
  },
  computed: {
    sanitizedRoomCode() {
      return this.roomCode.trim()
    },

    numPlayers() {
      return this.numPeers// + 1
    }
  },
  created() {
    // if we want to define our own id, per user, then make request to db and set something as id
    // this.p = new Peer({ host: 'drawalot-peerjs.herokuapp.com', port: 443, secure: true })
  },
  mounted() {
    if (!this.$peer.open) {
      // if connection wasn't already established
      // this line probably won't run since we establish a connection so early on
      this.$peer.on('open', id => {
        // on connection with PeerServer and given a peer-id
        this.myId = id
        this.$peer.id = this.myId
      })
    }
  },
  watch: {
    numPeers: function() { // when the num of peers changes, check for opponent and listen for connection close
      this.receiveConnection()

      this.searchForOpponent()

      this.forEachActivePeer(dataConnection => {
        dataConnection.on('close', () => {
          alert('A player on your team has left')
          dataConnection.close() // close conn?
          delete this.connectedPeers[dataConnection.peer] // delete the peer from the set of connected users

          // if this.connectedPeers becomes empty -> make a post request to delete the room or set it to inactive
        })
      })
    },

    opponentConnection: function() { // watch for connection change i.e. when we call .connect, it returns a dataconnection
      this.receiveConnection()
    },

  },
  methods: {
    createRoom() {
      // initiator
      if (!this.$peer.open) {
        // console.log('wot')
        // if connection wasn't already established
        // this line probably won't run since we establish a connection so early on
        this.$peer.on('open', id => {
          // console.log('GETTING ID')
          // on connection with PeerServer and given a peer-id
          this.myId = id
          this.$peer.id = this.myId
        })
      }
      // console.log(this.$peer.id)
      // console.log(this.$peer)
      this.myId = this.$peer.id // set peerId
      this.host = true

      var room = new Request('/api/room', {
        // post the server and get the new code for the room
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      fetch(room)
        .then(res => {
          if (res.ok) {
            return res.json() // wait for response body and convert to json
          } else {
            throw new Error('invalid room')
          }
        })
        .then(data => {
          this.roomCode = data.roomCode

          // when we receive room code, post our peerid to the room
          var addPeer = new Request('/api/room/' + this.sanitizedRoomCode, {
            credentials: 'include',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              peerId: this.myId
            })
          })
          fetch(addPeer)
            .then(res => {
              if (res.ok) {
                return res.json() // wait for response body and convert to json
              } else {
                throw new Error('invalid room')
              }
            })
            .then(data => { // room is successfully created
              this.connectedPeers[this.myId] = null // add our own peerid to the list
              this.numPeers = Object.keys(this.connectedPeers).length // update num users
              // console.log(this.connectedPeers)
            })
            .catch(err => {
              // console.log(err)
              this.role = ''
              this.status = ''
              alert('Please try again')
              return
            })
        })
        .catch(err => {
          // console.log(err)
          this.role = ''
          this.status = ''
          // this.$router.replace('/')
          alert('Please try again')
          return
        })

      this.receiveConnection()
      // set status
      this.role = 'guesser'
      this.status = 'inRoom'
    },

    // does each joining player also have to wait for conns?
    joinRoom() {
      // again, this probably won't run unless things are slow
      if (!this.$peer.on) {
        this.$peer.on('open', id => {
          // on connection with PeerServer and given a peer-id
          this.myId = id
          this.$peer.id = this.myId
        })
      }
      this.myId = this.$peer.id

      var room = new Request('/api/room/' + this.sanitizedRoomCode, {
        // check roomCode is valid via get request,
        credentials: 'include',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      fetch(room)
        .then(res => {
          if (res.ok) {
            return res.json()
          } else {
            throw new Error('invalid room')
          }
        })
        .then(data => {
          if (data != null) {
            // console.log(this.myId)
            var addPeer = new Request('/api/room/' + this.sanitizedRoomCode, {
              // post my peer id to the room db
              credentials: 'include',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                peerId: this.myId
              })
            })
            fetch(addPeer)
              .then(res => {
                if (res.ok) {
                  return res.json()
                } else {
                  throw new Error('invalid room')
                }
              })
              .then(data => {
                // body.peers is the list of users in this room
                // console.log('my peers are ' + data.peers)
                data.peers.forEach(peerId => {
                  // for each unconnected, peer, connect with them
                  if (!this.connectedPeers[peerId] && peerId !== this.myId) {
                    // console.log('attempting to connect to each peer in the room ' + peerId)
                    var dataConnection = this.$peer.connect(peerId, {
                      // attempt to connect with peerid
                      label: 'handshake'
                    })
                    console.log('join-room | creating a connection with: ', dataConnection)

                    dataConnection.on('open', () => {
                      console.log('connection established with ' + peerId)
                      console.log(dataConnection)
                      this.connect(dataConnection) // when connected to a peer, increment the # of peers and handle connection
                    })

                    dataConnection.on('error', err => {
                      // if connection failed
                      // console.log(err)
                      return
                    })

                    // this.connectedPeers[peerId] = dataConnection
                  }
                  this.connectedPeers[peerId] = dataConnection // store our own peerid, maybe set ours to null? and store role?
                })
                this.receiveConnection()
                this.role = 'drawer'
                this.status = 'inRoom'
              })
              .catch(err => {
                console.log(err)
                alert('You have entered an invalid game room')
                this.roomCode = ''
                return
              })
          }
        })
        .catch(err => {
          console.log(err)
          alert('You have entered an invalid game room')
          this.roomCode = ''
          return
        })
    },

    connect(dataConnection) {
      if (dataConnection.label === 'handshake') {
        // handle connection from peer
        // this.numPeers++
        dataConnection.on('data', data => { // when data is received from the connection
          // console.log('RECEIVE DATA FROM A PEER')
          // console.log(data)
          if (data.type === 'move-to-game-room') {
            this.moveToGameRoom()
          }

          dataConnection.on('close', () => {
            // when the connection is closed
            alert('A player on your team has left')
            // this.numPeers--
            delete this.connectedPeers[dataConnection.peer] // delete the peer from the set of connected users
          })
        })
        this.connectedPeers[dataConnection.peer] = dataConnection // store the connection and the peerid
        this.numPeers = Object.keys(this.connectedPeers).length
      } else if (dataConnection.label === 'opponent-handshake') {
        // console.log('opponent-handshake')
        this.opponentConnection = dataConnection // set the opponent connection
        // console.log(this.opponentConnection)
        dataConnection.on('data', data => { // when data is received from the connection
          if (data.type === 'notify-opponent') { // if data was a move to room command
            // console.log(data.type)
            this.searchForOpponent() // get words and move to room
          }

          dataConnection.on('close', () => { // when the connection is closed
            alert("The opposing team's host has left the game")
            this.opponentConnection = null
          })
        })
      }
    },

    /**
     * @description Applies a lambda function to each peer's set of connections
     **/
    forEachActivePeer(lambda) {
      // console.log(this.connectedPeers)
      Object.keys(this.connectedPeers).forEach((peerId, index) => { // for each connected peer
        if (peerId !== this.myId) {
          // console.log('sending to' + peerId)
          this.$peer.connections[peerId].forEach(dataConnection => {
            // for each connection the peer has, apply a function to the connection
            lambda(dataConnection)
          })
        }
      })
    },

    searchForOpponent() {
      // // console.log(this.numPeers)
      if (this.numPeers === 3) {
        // if the room is ready to play
        // host will attempt to find a room, if it finds one, it will broadcast to the connected peers
        if (this.host) {
          // set the game room to ready state and post to the server
          var opponent = new Request(
            '/api/room/' + this.sanitizedRoomCode + '/matchmake',
            {
              credentials: 'include',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: 'ready'
              })
            }
          )
          fetch(opponent)
            .then(res => {
              if (res.ok) {
                return res.json() // wait for response body and convert to json
              } else {
                throw new Error('invalid room')
              }
            })
            .then(data => {
              // console.log(data)
              if (!data) { // no other rooms are ready in db, our added room to db and set the status to ready
                // console.log('no rooms are available')
                //// alert('no rooms are available')
                //setTimeout(function() { // alert('no opponent team is available, please be patient!'); }, 1);
                // this.searchForOpponent();

                this.receiveConnection() // listen for connections made by the other team's host
              } else { // found another ready room
                var oppId = data.peers[0]
                var words = new Request('/api/words', { // get the keywords
                  credentials: 'include',
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    'usedwords': []
                  })
                })
                fetch(words)
                .then(res => {
                  if (res.ok) {
                    return res.json()
                  } else {
                    throw new Error('failed to retrieve words')
                  }
                })
                .then(data => { // host gets keywords
                  this.words = { type: 'words', data: data } // create data as object so we can identify what kind of data this is, in case we receive data async
                  // set start timer and end timer in game room? (or in lobby.vue?)

                  if (oppId !== this.myId) {
                    // connect to host of the other team ONLY IF WE THE TEAM THAT INITIATED THE MATCH
                    // console.log('SENDING OPPONENT HANDSHAKE TO INITIATE CONNECTION WITH THE OTHER TEAM')
                    var dataConnection = this.$peer.connect(oppId, {
                      // attempt to connect with peerid
                      label: 'opponent-handshake'
                    })
                    console.log('creating a connection with: ', dataConnection)

                    /* when opponent receives connection (i.e. .on('connection')), then the connection is fully
                    established and should be bi-directional at this point */
                    dataConnection.on('open', () => {
                      // console.log(dataConnection)
                      this.opponentConnection = dataConnection // save the connection only when it is open
                      // // console.log(this.opponentConnection)
                      // // console.log("connection opened with opponent")
                      // this.connect(dataConnection) // when connected to a peer, increment the # of peers and handle connection
                      // console.log('SENDING OPPONENT NOTIFY DATA')
                      this.opponentConnection.send({ type: 'notify-opponent', data: null }) // notify opponent to move

                      this.forEachActivePeer(dataConnection => { // notify peers to move to room
                        // console.log('sending move-to-game-room')
                        dataConnection.send({ type: 'move-to-game-room', data: null })
                      })

                      this.moveToGameRoom()
                    })

                    dataConnection.on('error', err => { // if connection failed
                      // console.log(err)
                      return
                    })
                  } else { // db returns your own room b/c your room was set to ingame by another team
                    this.forEachActivePeer(dataConnection => { // notify peers to move to room
                      // console.log('sending move-to-game-room')
                      dataConnection.send({ type: 'move-to-game-room', data: null })
                    })

                    this.moveToGameRoom()
                  }

                  // this.moveToGameRoom()
                })
                .catch(err => {
                  // console.log(err)
                })

                // this.forEachActivePeer(dataConnection => { // notify peers to move to room
                //   // console.log('sending move-to-game-room')
                //   dataConnection.send({ type: 'move-to-game-room', data: null })
                // })
              }
            })
            .catch(err => {
              console.log(err)
              // alert(err)
            })
        }
      }
    },

    moveToGameRoom() {
      //setTimeout(function() { alert('MOVE TO GAME ROOM'); }, 1);
      //alert('MOVING TO GAME ROOM')
      // console.log('moving to game room')
      // console.log(this.opponentConnection)
      this.$router.replace({
        name: 'Room',
        params: {
          // send game info and connection data to component
          myId: this.myId,
          role: this.role,
          roomCode: this.sanitizedRoomCode, // route param
          connectedPeers: this.connectedPeers, // pass dataconnections to room component
          words: this.words, // send keywords to room component
          startTime: this.startTime,
          endTime: this.endTime,
          opponentConnection: this.opponentConnection
        }
      })
    },

    /**
     * When room creator receives connections
     */
    receiveConnection() { // each time we receive a connection from another peer, the .on event is triggered
      this.$peer.on('connection', dataConnection => {
        console.log('Received a connection by', dataConnection)
        // on incoming connection with a remote peer
        this.connect(dataConnection) // increment the # of peers and handle the connection
      })
    }
  }
}
</script>

<style scoped>
  p {
    font-size: 20px;
  }

  .create {
    margin-left: 10%;
    align-self: center;
    margin-top: 30px;
    width: 80%;
  }

  button {
    width: 200px;
  }

  .roomForm{
    margin-top: 20px;
  }
</style>
