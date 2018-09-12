<template>
    <div :key="key" id="game">
      <div id="myProgress">
        <div id="myBar"></div>
      </div>
      <div id="result">
        <span v-on:click="backToLobby" id="close">&times;</span>
        <div id="result_content">

          <p>Your team made {{ this.data.score }} correct guesses!</p>
          <p>Hope to See U Again</p>
        </div>
      </div>
      <div v-if="myRole === 'guesser'" id="guesserContainer">
        <div class= "canvas" id="canvas1"></div>
        <div class= "canvas" id="canvas2"></div>
        <div class= "guesser_area">
          <div id="infoBoard">
            <div class="score">SCORE: {{ score }}</div>
              <input type="text" id="post_guess" placeholder="TAKE A GUESS" required/>
              <button v-on:click="sendGuess" class="btn">Submit Guess</button>
          </div>
        </div>
      </div>
      <div v-else id="drawerContainer">
        <div id="keyword">YOUR KEY WORD: {{ keyword }}</div>
        <div class= "canvas" id="canvasMe"></div>
        <div v-on:click="toolDisplay" id="tools"></div>

        <div class= "canvas" id="canvasPeer"></div>
        <div class="clear">CLEAR</div>
        <div id="infoBoard">
            <div>GUESSER'S ANSWER GUESS: {{ answer }}</div>
            <div>SCORE: {{ this.data.score }}</div>
        </div>
      </div>
      <div>
        Room: {{ this.roomCode }}
        <div>My role is {{ role }}</div>
      </div>
    </div>
</template>

<style src="../../static/style/drawer_canvas.css"></style>
<style src="../../static/style/guesser_canvas.css"></style>


<script>
var $ = require('jquery');
window.jQuery = $;
var validator = require('validator');


export default {
  name: 'Room',
  props: ['myId', 'role', 'roomCode', 'connectedPeers', 'words', 'opponentConnection'],
  data() {
    return {
      isRoom: true,
      myRole:'',
      tools: ["black", "red", "blue", "yellow", "green", "eraser"],
      clickX: [],
      clickY: [],
      clickDrag: [],
      paint: false,
      color: "black",
      coordinate_index: 0,
      keyword: '',
      score:0,
      listening:0,
      opponent_score:10,
      word_index: 0,
      data: {guesser:0, url:'', eraser:0, clear:0, keyword:'', wordIndex: 0, guess:'', score:0, next_guesser:'', word_list:[], opponent_score:null},
      answer: '',
      peer: [],
      peerId: [],
      time: 100,
      //time: 40,
      timer: '',
      key:0,
      word_list: '',
      count: 0

    }
  },
  created() {
    if(this.connectedPeers == null){
      this.$router.replace('/lobby');
    }
    this.myRole = this.role;
    this.word_list = this.words;
  },
  mounted() {
    // console.log("mounting");
    // console.log(this.opponentConnection)
    // console.log('end of opponentConnection')
    var peers = Object.keys(this.connectedPeers);
    var peer = [];
    // console.log(peers)
    peers.forEach(id => {
      if (id !== this.myId) {
        this.peerId.push(id);
        this.peer.push(this.connectedPeers[id]);
      }
    })
    var peer1 = this.peer[0]
    var peer2 = this.peer[1]

    var game = this;
    this.timer = setInterval(this.barMove, 1000);
    if(game.myRole == "drawer"){
      game.drawer_gameflow(peer1, peer2);
    } else {
      game.guesser_gameflow(peer1, peer2);

    }

    this.forEachActivePeer(dataConnection => { // check for clients closing connection
      dataConnection.on('close', () => {
        alert('A player on your team has left')
        delete this.connectedPeers[dataConnection.peer] // delete the peer from the set of connected users
        dataConnection.close() // close conn
      })
    })
  },
  methods:{
    drawer_gameflow(peer1, peer2){
      var game = this;
      //var peer1 = this.peer[0];
      //var peer2 = this.peer[1];
      game.initCanvas("canvasMe");
      game.initCanvas("canvasPeer");
      for(var i = 0; i<game.tools.length; i++){
        var tool_name = game.tools[i];
        game.loadTools(tool_name);
      }
      var Me = document.querySelector("#canvasMe canvas");
      var Peer = document.querySelector("#canvasPeer canvas");
      if(typeof G_vmlCanvasManager != 'undefined') {
         Me = G_vmlCanvasManager.initElement(Me);
         Peer = G_vmlCanvasManager.initElement(Peer);
       }
       var p1 = Me.getContext("2d");
       var p2 = Peer.getContext("2d");

       $('#canvasMe').mousedown(function(e){
         var mouseX = e.pageX - this.offsetLeft;
         var mouseY = e.pageY - this.offsetTop;

         game.paint = true;
         game.addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
         game.draw(Me, peer1, peer2);
       });

       $('#canvasMe').mousemove(function(e){
         if(game.paint){
           game.addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
           game.draw(Me, peer1, peer2);
         }
       });

       $('#canvasMe').mouseup(function(e){
         game.paint = false;
       });

       $('#canvasMe').mouseleave(function(e){
         game.paint = false;
       });

       document.querySelector(".clear").addEventListener("click", function(){
         p1.clearRect(0, 0, p1.canvas.width, p1.canvas.height);
         game.coordinate_index = 0;
         game.clickX = [];
         game.clickY = [];
         game.clickDrag = [];
         var url = "clear";
         game.data.clear = 1;
         peer1.send(game.data);
         peer2.send(game.data);
         game.data.clear = 0;
       });

       game.receiveData(peer1, p2);
       game.receiveData(peer2, p2);
       if(game.role == "guesser" && game.listening == 0){
         // console.log("game listening"+game.listening);
         game.receiveOpponentScore();
         game.listening = 1;
       }

    },

    guesser_gameflow(peer1, peer2){
      var game = this;
      //// console.log(this.word_list);
      game.data.guesser = 1;
      game.data.keyword = game.word_list.data[game.data.wordIndex].left_word;
      peer1.send(game.data);
      game.data.keyword = game.word_list.data[game.data.wordIndex].right_word;
      peer2.send(game.data);
      game.data.keyword = '';

      game.initCanvas("canvas1");
      game.initCanvas("canvas2");
      var drawer1 = document.querySelector("#canvas1 canvas");
      var drawer2 = document.querySelector("#canvas2 canvas");
      if(typeof G_vmlCanvasManager != 'undefined') {
         drawer1 = G_vmlCanvasManager.initElement(drawer1);
         drawer2 = G_vmlCanvasManager.initElement(drawer2);
       }
       var p1 = drawer1.getContext("2d");
       var p2 = drawer2.getContext("2d");
       game.receiveData(peer1, p1);
       game.receiveData(peer2, p2);
       if(game.role == "guesser" && game.listening == 0){
         game.receiveOpponentScore();
         game.listening = 1;
       }
    },

    barMove() {
      var bar = document.getElementById("myBar");
      //// console.log(this.time);
      if (this.time <= 0) {
        bar.style.width = 0 + '%';
        this.count += 1;
        if(this.count == 5){
          clearInterval(this.timer);
          if(this.role == "guesser"){
            this.opponentConnection.send(this.data.score);
          }
        } else {
          if(this.myRole == "guesser"){
            this.data.word_list = this.word_list;
            this.data.wordIndex ++;
            this.data.next_guesser = this.peerId[Math.floor((Math.random() * 2))];
            this.peer[0].send(this.data);
            this.peer[1].send(this.data);
            this.data.guesser = 0;
            this.data.next_guesser = '';
            this.myRole = "drawer";
            this.key++;
            this.$mount(this.$el);
            this.drawer_gameflow(this.peer[0], this.peer[1]);
          }
        }
        this.time = 100;
        //this.time = 100;
      } else {
        this.time -= (5/3);
        bar.style.width = this.time + '%';
      }
    },


    initCanvas(block){
      var canvas_container = document.querySelector("#"+block);
      // console.log(canvas_container);
      var canvas = document.createElement('canvas');

      canvas.setAttribute('width', $('#'+ block).css("width"));
      canvas.setAttribute('height', $('#'+ block).css("height"));
      // console.log(block);
      canvas_container.appendChild(canvas);

    },

    loadTools(tool_name){
      var tools = document.getElementById("tools");
      //var tool = new Image();
      var tool = document.createElement("img");
      tool.className = tool_name;
      tool.src = require("../../static/media/"+ tool_name + ".png");
      tool.style.marginBottom = "15px";
      tools.appendChild(tool);
      var toolElement = document.querySelector("."+tool_name);
      var game = this;
      toolElement.addEventListener("click", function(){
        game.color = tool_name;
        tool.style.marginLeft = "20px";
      });

    },

    toolDisplay(){
      for(var i = 0; i<this.tools.length; i++){
        var tool_name = this.tools[i];
        if(tool_name == this.color){
          document.querySelector("."+tool_name).style.marginLeft = "20px";
        } else {
          document.querySelector("."+tool_name).style.marginLeft = "0px";
        }
      }
    },

    addClick(x, y, dragging){
      this.clickX.push(x);
      this.clickY.push(y);
      this.clickDrag.push(dragging);
    },

    draw(myCanvas, peer1, peer2){
      var context = myCanvas.getContext("2d");
      var url;
      if(this.color == "eraser"){
        context.globalCompositeOperation = "destination-out";
        context.strokeStyle = "white";
        context.lineWidth = 10;
      } else {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = this.color;
        context.lineWidth = 5;
      }
      context.lineJoin = "round";

      for(var i=this.coordinate_index; i < this.clickX.length; i++) {
        context.beginPath();
        if(this.clickDrag[i] && i){
          context.moveTo(this.clickX[i-1], this.clickY[i-1]);
         }else{
           context.moveTo(this.clickX[i]-1, this.clickY[i]);
         }
         context.lineTo(this.clickX[i], this.clickY[i]);
         context.closePath();
         context.stroke();
         this.coordinate_index += 1;


         if(this.color == "eraser"){
           this.data.eraser = 1;
           this.data.url = myCanvas.toDataURL();
           peer1.send(this.data);
           peer2.send(this.data);
           this.data.eraser = 0;
         } else {
           this.data.url = myCanvas.toDataURL();
           peer1.send(this.data);
           peer2.send(this.data);
         }

      }
    },

    receiveData(conn, changeCanvas){
      var game = this;
      var img = new Image();
      conn.on('data', function(data){
        if(data.guesser){
          // console.log(data.opponent_score);
          if(data.opponent_score != null){
            // console.log("receiving opponent score!!!!" + data.opponent_score);
            game.opponent_score = data.opponent_score;
            game.displayResult();
          } else {
            if(data.next_guesser != ''){
              // console.log("next guesser is "+ data.next_guesser+ " my id is "+game.myId);
              if(game.myId == data.next_guesser){
                // console.log("i m next guesser");
                game.word_list = data.word_list;
                game.data.wordIndex = data.wordIndex;
                game.myRole = "guesser";
                game.key ++;
                game.$mount(game.$el);
                game.guesser_gameflow(game.peer[0], game.peer[1]);
              } else {
                game.key++;
                game.$mount(game.$el);
                game.drawer_gameflow(game.peer[0], game.peer[1]);
              }
            }
            if(data.keyword != ''){
              game.keyword = data.keyword;
              game.data.wordIndex = data.wordIndex;
              if(game.score != data.score){
                // console.log("score in is "+ data.score);
                game.score = data.score;
                game.data.score = data.score;
              }
            }
            if(data.guess != ''){
              game.answer = data.guess;
            }

          }
        } else {
          if(data.clear){
            changeCanvas.clearRect(0, 0, changeCanvas.canvas.width, changeCanvas.canvas.height);
          } else if (data.eraser) {
            img.src = data.url;
            img.onload = function() {
              changeCanvas.clearRect(0, 0, changeCanvas.canvas.width, changeCanvas.canvas.height);
              changeCanvas.drawImage(img, 0, 0, changeCanvas.canvas.width, changeCanvas.canvas.height);
            };
          } else {
            img.src = data.url;
            img.onload = function() {
                changeCanvas.drawImage(img, 0, 0, changeCanvas.canvas.width, changeCanvas.canvas.height);
            };
          }
        }
      });
    },

    sendGuess(){
      this.answer = validator.escape(document.getElementById("post_guess").value);
      if(this.answer == this.word_list.data[this.data.wordIndex].compound_word){
        document.getElementById("post_guess").value = '';
        //setTimeout(function() {alert("Your guess is correct!!!"); }, 0);
        this.data.guesser = 1;
        this.score += 1;
        this.data.score += 1;
        this.data.guess = this.answer;
        // console.log(this.word_list.data.length);
        if(this.data.wordIndex < this.word_list.data.length - 1){
          this.data.wordIndex ++;
          this.data.keyword = this.word_list.data[this.data.wordIndex].left_word;
          this.peer[0].send(this.data);
          this.data.keyword = this.word_list.data[this.data.wordIndex].right_word;
          this.peer[1].send(this.data);
          this.data.keyword = '';
        } else {
          var old_words = [];
          this.word_list.data.forEach(function(word){
            old_words.push(word.compound_word);
          });
          this.getMoreWords(old_words);
        }
      } else {
        document.getElementById("post_guess").value = '';
        this.data.guesser = 1;
        this.data.guess = this.answer;
        this.peer[0].send(this.data);
        this.peer[1].send(this.data);
        this.data.guess = '';
      }
    },

    displayResult(){
        // console.log("displaying result");
        var result = document.getElementById("result");
        // console.log(document.getElementById("ending"));
        if(document.getElementById("ending") == null){
          var element = document.createElement('div');
          element.id = "ending";
          // console.log(this.data.score, this.opponent_score);
          if(this.data.score > this.opponent_score){
            element.innerHTML = `<p>GAME END!\nCongratuations! Your team won the game!!</p>`
          } else if(this.data.score == this.opponent_score){
            element.innerHTML = `<p>GAME END!\nWell done! Your team made a tie!!</p>`
          } else {
            element.innerHTML = `<p>GAME END!\nYour team lost the game....try next time!</p>`
          }
          document.getElementById("result_content").prepend(element);
        }
        result.style.display = "block";
        // console.log("my id is" + this.myId + "my opponent id is " + this.opponentConnection);
    },

    receiveOpponentScore(){
      var game = this;
      // console.log("listening opponent score!");
      this.opponentConnection.on('data', function(data){
          game.opponent_score = data;
          // console.log("opponent score is " + game.opponent_score);
          game.data.opponent_score = game.opponent_score;
          game.data.guesser = 1;
          game.peer[0].send(game.data);
          game.peer[1].send(game.data);
          game.displayResult();
      });

    },

    backToLobby(){
      var result = document.getElementById("result");
      result.style.display = "none";
      this.$router.go();
    },

//===============================================================================================================
    getMoreWords(old_words){
      //var game = this;
      var words = new Request('/api/words', { // get the keywords
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'usedwords': old_words
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
      .then(data => {
        // console.log("from database: ")
        // console.log(data)
        this.word_list = { type: 'words', data: data }
        this.data.wordIndex = 0;
        this.data.keyword = this.word_list.data[this.data.wordIndex].left_word;
        this.peer[0].send(this.data);
        this.data.keyword = this.word_list.data[this.data.wordIndex].right_word;
        this.peer[1].send(this.data);
        this.data.keyword = '';
      })
      .catch(err => {
        // console.log(err)
      })
    },

  //=====================================================================================================
    /**
     * @description Applies a lambda function to each peer's set of connections
     **/
    forEachActivePeer(lambda) {
      Object.keys(this.connectedPeers).forEach((peerId, index) => { // for each connected peer
        if (peerId !== this.myId) {
          this.$peer.connections[peerId].forEach(dataConnection => {
            // for each connection the peer has, apply a function to the connection
            lambda(dataConnection)
          })
        }
      })
    },
  }
}
</script>
