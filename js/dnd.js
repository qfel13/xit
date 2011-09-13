var Xit = (function(document) {
	var debug = false,
		levelSize = 20,
		playerIndex,
		infoDiv,
		x = { 
			levelSize: levelSize, 
			m: []
		};
	
	x.init = function() {
		initDom();
		x.cLevel = 1;
		x.loadCurrentLevel();
	}
	
	function loadFromString(s) {
		var i,j,l,k,line,lines,className,render, v;

			x.m.length = 0;
			lines = s.split("\n");
			for (i = 0, k = lines.length; i < k; i += 1) {
				line = lines[i];
				for (j = 0, l = line.length/2; j < l; j += 1) {
					className = line[2*j] + line[2*j+1];
					if (className !== "00") {
						v = {v:className};
						x.setInM({"x": j, "y": i}, v);
						render = document.getElementById("render_" + j + "_" + i);
						render.className = "render " + className;
						if (className === "P0") {
							playerIndex = i*levelSize + j;
						}
					}
				}
			}
			checkAllWalls();
	}
	
	x.loadLevel = function(ln) {
		var xhr = new XMLHttpRequest(), ls;
		ls = (ln > 9 ? "": "0") + ln;
		xhr.open("GET", "/levels/0" + ls + ".txt", true);
		xhr.onreadystatechange = function (aEvt) {
			if (xhr.readyState === 4) {
				if(xhr.status === 200) {
					x.cLevelStr = xhr.responseText;
					loadFromString(x.cLevelStr);
				} else {
					console.error("Error wrong status " + xhr.status);
				}
			}
		};
		xhr.send(null);
	}
	
	x.restartLevel = function() {
		loadFromString(x.cLevelStr);
	}
	
	x.loadCurrentLevel = function() {
		//~~(Math.random()*14 + 1);
		x.loadLevel(x.cLevel);
	}
	
	x.loadNextLevel = function() {
		x.cLevel += 1;//~~(Math.random()*14 + 1);
		x.loadLevel(x.cLevel);
	}
	
	/**
	 * DOM initialization.
	 * @private
	 * @param {number} size size of generated board
	 */
	function initDom(size) {
		var renderBoard = document.createElement("div"),
			render, i, j;
		size = size || levelSize;
		renderBoard.id = "renderBoard";
		renderBoard.style.width = 30 * size + "px";
		renderBoard.style.height = 32 * size + "px";
		
		// console.debug("size =", size);
		for (i = -1; i <= size; i+=1) {
			for (j = -1; j <= size; j+=1) {
				render = document.createElement("div");
				render.id = "render_" + i + "_" + j;
				render.style.left = 30*i + "px";
				render.style.top = 32*j + "px";
				render.style.zIndex = j;
				renderBoard.appendChild(render);
			}
		}
		
		infoDiv = document.createElement("div"),
		infoDiv.id = "info";
		
		document.body.appendChild(renderBoard);
		document.body.appendChild(infoDiv);
	}
	
	function checkIndexes(notNulls, nulls, a) {
		var i, j, l;
		for (i = 0, l = notNulls.length; i < l; i += 1) {
			if (!a[notNulls[i]]) {
				return false;
			}
		}
		for (j = 0, l = nulls.length; j < l; j += 1) {
			if (a[nulls[j]]) {
				return false;
			}
		}
		return true;
	}
	
	function checkAround(id) {
		var render,
		a = [];
		if(x.getFromM(id)) {
			return;
		}
		a[0] = x.getFromM({"x": (id.x - 1), "y": (id.y - 1)});
		a[1] = x.getFromM({"x": id.x, "y": (id.y - 1)});
		a[2] = x.getFromM({"x": (id.x + 1), "y": (id.y - 1)});
		a[3] = x.getFromM({"x": (id.x + 1), "y": id.y});
		a[4] = x.getFromM({"x": (id.x + 1), "y": (id.y + 1)});
		a[5] = x.getFromM({"x": id.x, "y": (id.y + 1)});
		a[6] = x.getFromM({"x": (id.x - 1), "y": (id.y + 1)});
		a[7] = x.getFromM({"x": (id.x - 1), "y": id.y});
		
		
		render = document.getElementById("render_" + id.x + "_" + id.y);
		if (!render) {
			console.warn("render === null", JSON.stringify(id));
			return;
		}
		render.className = "render";
		
		if (checkIndexes([4], [1,3,5,6,7], a)) { // 0,2
			render.className = "render topLeftCorner";
			
		} else if (checkIndexes([6], [1,3,4,5,7], a)) { // 0,2
			render.className = "render topRightCorner"; 
			
		} else if (checkIndexes([4,6], [1,3,5,7], a)) { // 0,2
			render.className = "render topLeftRightCorner";
			
		} else if (checkIndexes([1,6], [3,4,5,7], a)) { // 0,2
			render.className = "render topRightCornerWallBottom";
			
		} else if (checkIndexes([1,4], [3,5,6,7], a)) { // 0,2
			render.className = "render topLeftCornerWallBottom";
			
		} else if (checkIndexes([5], [1,3,7], a)) { // 0,2,4,6
			render.className = "render wallTop";
			
		} else if (checkIndexes([1,5], [3,7], a)) { // 0,2,4,6
			render.className = "render wallTopBottom";
			
		} else if (checkIndexes([3], [1,4,5,6,7], a)) { // 0,2
			render.className = "render bottomLeftCorner";
			
		} else if (checkIndexes([7], [1,3,4,5,6], a)) { // 0,2
			render.className = "render bottomRightCorner";
			 
		} else if (checkIndexes([1], [3,4,5,6,7], a)) { // 0,2
			render.className = "render wallBottom";
			
		} else if (checkIndexes([3,4], [1,5,6,7], a)) { // 0,2
			render.className = "render wallLeft";
			
		} else if (checkIndexes([6,7], [1,3,4,5], a)) { // 0,2
			render.className = "render wallRight";
			
		} else if (checkIndexes([1,5,7], [3], a)) { // 0,2,4,6
			render.className = "render wallRightTopBottom";
			
		} else if (checkIndexes([1,3,5], [7], a)) { // 0,2,4,6
			render.className = "render wallLeftTopBottom";
			
		} else if (checkIndexes([1,3], [4,5,6,7], a)) { // 0,2
			render.className = "render wallBottomLeft";
			
		} else if (checkIndexes([1,7], [3,4,5,6], a)) { // 0,2
			render.className = "render wallBottomRight";
			
		} else if (checkIndexes([1,3,4], [5,6,7], a)) { // 0,2
			render.className = "render wallBottomLeftWallLeft";
			
		} else if (checkIndexes([1,6,7], [3,4,5], a)) { // 0,2
			render.className = "render wallBottomRightWallRight";
			
		} else if (checkIndexes([5,7], [1,2,3], a)) { // 0,4,6
			render.className = "render wallTopRight";
			
		} else if (checkIndexes([3,5], [0,1,7], a)) { // 2,4,6
			render.className = "render wallTopLeft";
			
		} else if (checkIndexes([1,3,5,7], [], a)) { // 0,2,4,6
			render.className = "render wallBlock";
			
		} else if (checkIndexes([3,5,7], [1], a)) { // 0,2,4,6
			render.className = "render wallTopLeftRight";
			
		} else if (checkIndexes([1,3,7], [4,5,6], a)) { // 0,2
			render.className = "render wallBottomLeftCornerRightCorner";
			
		} else if (checkIndexes([1,3,6,7], [4,5], a)) { // 0,2
			render.className = "render wallBottomLeftCornerWallRight";
			
		} else if (checkIndexes([1,3,4,7], [5,6], a)) { // 0,2
			render.className = "render wallBottomWallLeftRightCorner";
			
		} else if (checkIndexes([1,3,4,6,7], [5], a)) { // 0,2
			render.className = "render wallBottomWallLeftWallRight";
			
		} else if (checkIndexes([3,4,6,7], [1,5], a)) { // 0,2
			render.className = "render wallLeftRight";
			
		} else if (checkIndexes([3,7], [1,4,5,6], a)) { // 0,2
			render.className = "render bottomLeftRightCorner";
			
		} else if (checkIndexes([3,6,7], [1,4,5], a)) { // 0,2
			render.className = "render bottomLeftCornerWallRight";
			
		} else if (checkIndexes([3,4,7], [1,5,6], a)) { // 0,2
			render.className = "render bottomRightCornerWallLeft";
			
		} else if (checkIndexes([4,6,7], [1,3,5], a)) { // 0,2
			render.className = "render topLeftCornerWallRight";
			
		} else if (checkIndexes([3,4,6], [1,5,7], a)) { // 0,2
			render.className = "render topRightCornerWallLeft";
			
		} else if (checkIndexes([2,5,7], [1,3], a)) { // 0,4,6
			render.className = "render wallRightBottom";
			
		} else if (checkIndexes([0,3,5], [1,7], a)) { // 2,4,6
			render.className = "render wallLeftBottom";
			
		} else if (checkIndexes([1,3,4,6], [5,7], a)) { // 0,2
			render.className = "render wallLeftTop";
			
		} else if (checkIndexes([1,4,6,7], [3,5], a)) { // 0,2
			render.className = "render wallRightTop";
			
		} else if (checkIndexes([1,3,6], [4,5,7], a)) { // 0,2
			render.className = "render topRightCornerWallBottomLeft";
			
		} else if (checkIndexes([1,4,7], [3,5,6], a)) { // 0,2
			render.className = "render topLeftCornerWallBottomRight";
			
		} else if (checkIndexes([3,6], [1,4,5,7], a)) { // 0,2
			render.className = "render topRightCornerBottomLeftCorner";
			
		} else if (checkIndexes([1,4,6], [3,5,7], a)) { // 0,2
			render.className = "render topLeftRightCornerWallBottom";
			
		} else if (checkIndexes([4,7], [1,3,5,6], a)) { // 0,2
			render.className = "render topLeftCornerBottomRightCorner";
		
		} else if (checkIndexes([], [1,3,4,5,6,7], a)) { // 0,2
			if (debug) { console.debug("nothing to do"); }
		} else {
			if (debug) { console.debug("id", id, "around", a); }
		}
	}
	
	function checkAllWalls() {
		var i, j, l = levelSize + 1;
		for (i = -1; i < l; i += 1) {
			for (j = -1; j < l; j += 1) {
				checkAround({"x": i, "y": j});
			}
		}
	}
	x.checkAllWalls = checkAllWalls;
	
	function fillW(val) {
		if (val.v.indexOf("1") > -1 || val.v.indexOf("4") > -1 || val.v.indexOf("7") > -1) {
			val.w = 1;
		} else if (val.v.indexOf("2") > -1 || val.v.indexOf("5") > -1 || val.v.indexOf("8") > -1) {
			val.w = 2;
		} else if (val.v.indexOf("3") > -1 || val.v.indexOf("6") > -1 || val.v.indexOf("9") > -1) {
			val.w = 3;
		}
	}
	
	x.setInM = function (idObj, val) {
		if (debug) { console.debug("setInM id", idObj); }
		if (["F0", "G0", "I0", "O0", "T2", "T5"].indexOf(val.v) > -1) {
			val.floor = true;
		} else if (["B1", "B2", "B3", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9"].indexOf(val.v) > -1) {
			val.block = true;
			fillW(val);
		} else if(val.v === "S0") {
			val.slider = true;
			val.w = 1;
		} else if(val.v === "T1") {
			val.trap = true;
		} else if(val.v === "E0") {
			val.exit = true;
			val.floor = true;
		} else if (["C0", "H0", "M0", "P1", "P2", "W7"].indexOf(val.v) > -1) {
			val.extra = true;
		}
		x.m[idObj.y*levelSize+idObj.x] = val;
	}
	x.setInM2 = function (index, val) {
		var j = (index % levelSize), i = ~~(index/levelSize);
		x.setInM({"x": j, "y": i}, val);
		render = document.getElementById("render_" + j + "_" + i);
		render.className = "render " + val.v;
	}
	
	x.getFromM = function(idObj) {
		if (idObj.x < 0 || idObj.x >= levelSize || idObj.y < 0 || idObj.y >= levelSize) {
			return undefined;
		}
		var a = x.m[idObj.y*levelSize+idObj.x],v;
		
		if (a) {
			v=a.v
		}
		// console.debug(a, v);
		return v;
	}
	
	function moveBlock(p, a, w) {
		var n = p + a,
		s = x.m[n],
		b = x.m[p];
		
		if (s && b) {
			if (!w) {
				w = b.w;
			}
			if(w < 3) {
				if (s.floor) {
					x.setInM2(p, {v: "F0"});
					x.setInM2(n, {v: b.v});
					return true;
				} else if (s.trap) {
					x.setInM2(p, {v: "F0"});
					x.setInM2(n, {v: "T5"});
					return true;
				} else if (s.block) {
					w += s.w;
					if (w < 3 && moveBlock(n, a)) {
						x.setInM2(p, {v: "F0"});
						x.setInM2(n, {v: b.v});
						return true;
					}
				}
			}
		}
		return false;
	}
	
	function moveSlider(p, a, w) {
		var v, n = p + a, 
		moved = false,
		trap = false;
		i = p,
		next = x.m[n],
		slider = x.m[p];
		
		if (slider && next) {
			if (next.floor || next.trap) {
				moved = true;
				// check how far slider can go
				while(next && (next.floor || next.trap)) {
					i += a;
					if (next.trap) {
						trap = true;
						break;
					}
					next = x.m[i+a];
				}
				x.setInM2(p, {v: "F0"});
				v = slider.v;
				if (trap) { v = "T5"; }
				x.setInM2(i, {v: v});
				
			}
		}
		return moved
	}
	
	function move(a) {
		var n = playerIndex + a,
		s = x.m[n];
		if (s) {
			if (s.exit) {
				x.setInM2(playerIndex, {v:"F0"});
				x.setInM2(n, {v: "P4"});
				playerIndex = n;
				info("Level " + x.cLevel + " completed!");
				x.loadNextLevel();
			} else if (s.floor) {
				x.setInM2(playerIndex, {v:"F0"}); // TODO
				x.setInM2(n, {v:"P0"});
				playerIndex = n;
			} else if (s.block) {
				if (moveBlock(n, a)) {
					x.setInM2(playerIndex, {v:"F0"});
					x.setInM2(n, {v:"P0"});
					playerIndex = n;
				}
			} else if (s.slider) {
				if (moveSlider(n,a)) {
					x.setInM2(playerIndex, {v:"F0"});
					x.setInM2(n, {v:"P0"});
					playerIndex = n;
				}
			} else if (s.extra) {
				// pickExtra(s); // TODO
				x.setInM2(playerIndex, {v:"F0"});
				x.setInM2(n, {v:"P0"});
				playerIndex = n;
			} else if (s.trap) {
				info("Try one more time", true);
				x.restartLevel();
			}
		}
	}
	
	function info(s, e) {
		if (e) {
			infoDiv.className = "error";
		} else {
			infoDiv.className = "";
		}
		infoDiv.innerHTML = s;
		infoDiv.style.display = "block";
		setTimeout(function() {
			infoDiv.style.display = "none";
		}, 1000);
	}
	
	x.left = function() {
		move(-1);
	}
	x.right = function() {
		move(1);
	}
	x.up = function() {
		move(-levelSize);
	}
	x.down = function() {
		move(levelSize);
	}
	
	return x;
})(document);



document.addEventListener("DOMContentLoaded", function () {
	Xit.init();
	
	document.addEventListener("keydown", function(event){
		var k = event.keyCode, i, p = false, ctrl = event.ctrlKey;
		// console.log("k =", k, "ctrl =", ctrl);
		if (k == 37) { // left
			Xit.left();
			p = !0;
		} else if (k == 39) { //right
			Xit.right();
			p = !0;
		} else if (k == 38) { //up
			Xit.up();
			p = !0;
		} else if (k == 40) { //down
			Xit.down();
			p = !0;
		} else if (k == 78/* && ctrl*/) {
			Xit.loadCurrentLevel();
			p = !0;
		} else if (k >= 49 && k <= 57) {
			Xit.cLevel = k - 48;
			Xit.loadCurrentLevel();
			p = !0;
		}
		
		p && event.preventDefault();
	}, false);
}, false);