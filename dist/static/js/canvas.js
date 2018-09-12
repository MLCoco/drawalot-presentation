

    /*Code Body*/
    "use strict";
    var color = "black";
    var coordinate_index = 0;
    var $ = require('jquery')
    window.jQuery = $

    function initCanvas(block){
      var canvas_container = document.getElementById(block);
      var canvas = document.createElement('canvas');

      canvas.setAttribute('width', $('#'+ block).css("width"));
      canvas.setAttribute('height', $('#'+ block).css("height"));
      console.log(canvas.width, canvas.height);
      canvas_container.appendChild(canvas);

    }

    function loadTools(tool_name){
      var tools = document.getElementById("tools");
      //var tool = new Image();
      var tool = document.createElement("img");
      tool.className = tool_name;
      tool.src = require("../media/"+ tool_name + ".png");
      tool.style.marginBottom = "15px";
      tools.appendChild(tool);
      var toolElement = document.querySelector("."+tool_name);
      toolElement.addEventListener("click", function(){
        color = tool_name;
        tool.style.marginLeft = "20px";
      });

    }




    // Wait for the DOM to fully load
    window.onload = function () {
      //var $ = window.jQuery = require('jquery');
      var role = "drawer";
      //var role = "guesser";
      if(role == "guesser"){
        document.getElementById("guesserContainer").style.display = "grid";
        initCanvas("canvas1");
        initCanvas("canvas2");
        console.log("here");
      } else {
        console.log("here for drawer");
        document.getElementById("drawerContainer").style.display = "grid";
        initCanvas("canvasMe");
        initCanvas("canvasPeer");
        var toolLoaded = 0;
        var tools = ["black", "red", "blue", "yellow", "green", "eraser"];
        tools.forEach(function(tool_name){
          console.log("loading tools for drawer");
          loadTools(tool_name);
          toolLoaded += 1;
        });
        document.getElementById("tools").addEventListener("click", function(){
          tools.forEach(function(tool_name){
            if(tool_name == color){
              document.querySelector("."+tool_name).style.marginLeft = "20px";
            } else {
              document.querySelector("."+tool_name).style.marginLeft = "0px";
            }
          });
        });
        var markerImage = new Image();
        var Me = document.querySelector("#canvasMe canvas");
        var Peer = document.querySelector("#canvasPeer canvas");
        //console.log(divMe);
        if(typeof G_vmlCanvasManager != 'undefined') {
  	       Me = G_vmlCanvasManager.initElement(Me);
           Peer = G_vmlCanvasManager.initElement(Peer);
         }
         var p1 = Me.getContext("2d");
         var p2 = Peer.getContext("2d");
         //console.log(canvas1);
         var paint = false;

        var clickX = new Array();
        var clickY = new Array();
        var clickDrag = new Array();

        function addClick(x, y, dragging)
        {
          clickX.push(x);
          clickY.push(y);
          clickDrag.push(dragging);
        }

        $('#canvasMe').mousedown(function(e){
          var mouseX = e.pageX - this.offsetLeft;
          var mouseY = e.pageY - this.offsetTop;

          paint = true;
          addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
          draw(p1, p2);
          //p2.drawImage(Me, 0, 0, p2.canvas.width, p2.canvas.height);
        });

        $('#canvasMe').mousemove(function(e){
          if(paint){
            addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
            draw(p1, p2);
            //p2.drawImage(Me, 0, 0, p2.canvas.width, p2.canvas.height);
          }
        });

        $('#canvasMe').mouseup(function(e){
          paint = false;
        });

        $('#canvasMe').mouseleave(function(e){
          paint = false;
        });

        document.querySelector(".clear").addEventListener("click", function(){
          p1.clearRect(0, 0, p1.canvas.width, p1.canvas.height);
          p2.clearRect(0, 0, p2.canvas.width, p2.canvas.height);
          coordinate_index = 0;
          clickX = [];
          clickY = [];
          clickDrag = [];
        });


        function draw(context, p2){
          //context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
          //context.strokeStyle = "#df4b26";
          if(color == "eraser"){
            context.globalCompositeOperation = "destination-out";
            context.strokeStyle = "white";
            context.lineWidth = 10;
          } else {
            context.globalCompositeOperation = "source-over";
            context.strokeStyle = color;
            //p2.globalCompositeOperation = "source-over";
            //p2.strokeStyle = color;
            context.lineWidth = 5;
          }
          context.lineJoin = "round";

          for(var i=coordinate_index; i < clickX.length; i++) {
            context.beginPath();
            if(clickDrag[i] && i){
              context.moveTo(clickX[i-1], clickY[i-1]);
             }else{
               context.moveTo(clickX[i]-1, clickY[i]);
             }
             context.lineTo(clickX[i], clickY[i]);
             context.closePath();
             context.stroke();
             coordinate_index += 1;
             if(color == "eraser"){
               p2.clearRect(0, 0, context.canvas.width, context.canvas.height);
               p2.drawImage(context.canvas, 0, 0, p2.canvas.width, p2.canvas.height);
             } else {
               p2.drawImage(context.canvas, 0, 0, p2.canvas.width, p2.canvas.height);

             }
          }
        }

        function selectPen(context, x, y, color, selected) {

  					context.beginPath();
  					context.moveTo(x + 10, y + 24);
  					context.lineTo(x + 10, y + 24);
  					context.lineTo(x + 22, y + 16);
  					context.lineTo(x + 22, y + 31);
  					context.closePath();
  					context.fillStyle = color;
  					context.fill();

  					if (selected) {
  						context.drawImage(markerImage, x, y, mediumImageWidth, mediumImageHeight);
  					} else {
  						context.drawImage(markerImage, 0, 0, 59, mediumImageHeight, x, y, 59, mediumImageHeight);
  					}
  				}

      }

}
