var xit = (function(document) {
	var debug = {useExtra: true},
		levelSize = 20,
		levelH, /** @unused */
		levelW, /** @unused */
		cLevel,
		cEnergy,
		cExtra = 0,
		extras = [],
		chooseExtraMode = false,
		levelTimeLimit,
		infoDiv,
		intervalId,
		startDate,
		timeDiv,
		energyDiv,
		MAX_W = 3,
		LEFT = -1,
		RIGHT = 1,
		UP = -levelSize,
		DOWN = levelSize,
		map = [],
		items = [],
		players = [],
		levelCache = []
		running = false;
		
	/**
	 * Module initialization.
	 * @public
	 */
	function init() {
		initDom();
		level = localStorage["q13.cLevel"] || 1;
		loadLevel(level);
		bindKeys();
	}
	
	/**
	 * DOM initialization.
	 * @private
	 * @param {number} size size of generated board
	 */
	function initDom(size) {
		var renderBoard = document.createElement("div"),
			i, j;
		size = size || levelSize; // TODO: change to arg len
		renderBoard.id = "renderBoard";
		renderBoard.style.width = 30 * size + "px";
		renderBoard.style.height = 32 * size + "px";
		
		renderBoard.addEventListener("webkitTransitionEnd", transitionEndHandler, false);
		renderBoard.addEventListener("transitionend", transitionEndHandler, false);
		
		if (debug["initDom"]) { console.log("size =", size); }
		for (j = -1; j <= size; j+=1) {
			for (i = -1; i <= size; i+=1) {
				addToBoard(createDiv(i, j, "render_", true), renderBoard);
			}
		}
		
		infoDiv = document.createElement("div");
		infoDiv.id = "info";
		
		var hudDiv = createHud();
		
		document.body.appendChild(renderBoard);
		document.body.appendChild(infoDiv);
		document.body.appendChild(hudDiv);
	}
	
	function transitionEndHandler(event) {
			if (debug["transitionEndHandler"]) { console.log("handler event =", event); }
			var t = event.target;
			var z = t.getAttribute("z");
			t.removeAttribute("z");
			if (z) {
				t.style.zIndex = z;
			}
		}
	
	function createHud() {
		var hud = document.createElement("div");
		hud.id = "hud";
		
		var extraDiv;
		for (var i = 0; i < 4; i++) {
			extraDiv = document.createElement("div");
			extraDiv.id = "extra" + i;
			hud.appendChild(extraDiv);
			extras[i] = {item: extraDiv};
		}
		energyDiv = document.createElement("div");
		energyDiv.id = "energy";
		timeDiv = document.createElement("div");
		timeDiv.id = "time";
		
		hud.appendChild(energyDiv);
		hud.appendChild(timeDiv);
		
		return hud;
	}
	
	/**
	 * @public
	 * @param {number} n number of level to load
	 */
	function loadLevel(n) {
		var levelStr = levelCache[n];
		if (!levelStr) {
			if(debug["loadLevel"]) { console.log("No entry in cache - loading from server"); }
			var xhr = new XMLHttpRequest(), 
				ls = (n > 9 ? n > 99 ? "" : "0" : "00") + n;
			xhr.open("GET", "levels/" + ls + ".txt", true);
			xhr.onreadystatechange = function (aEvt) {
				if (xhr.readyState === 4) {
					if(xhr.status === 200) {
						levelStr = xhr.responseText;
						levelCache[n] = levelStr;
						parseLevel(levelStr);
						cLevel = n;
					} else {
						console.error("Error wrong status " + xhr.status);
					}
				}
			};
			xhr.send(null);
		} else {
			if(debug["loadLevel"]) { console.log("Found entry in cache - loading from cache"); }
			parseLevel(levelStr);
			cLevel = n;
		}
	}
	
	function parseLevel(s) {
		var i,j,l,ll,k,line,lines,className,render, v, version;

			clean();
			
			lines = s.split("\n");
			version = lines.shift();
			if(debug["parseLevel"]) { console.log("vesrion", version); }
			k = lines.length;
			if (k > levelSize) {
				console.warn("should reinit DOM");
			}
			for (i = 0; i < k; i += 1) {
				line = lines[i];
				ll = line.length;
				if (ll > levelSize) {
					
				}
				for (j = 0, l = ll/2; j < l; j += 1) {
					className = line[2*j] + line[2*j+1];
					if (className !== "00") {
						set(j, i, className);
					}
				}
			}
			checkAllWalls();
			
			// time
			levelTimeLimit = 90; // in secs
			timeDiv.style.left = (480 + levelTimeLimit) + "px";
			timeDiv.style.width = (120 - levelTimeLimit) + "px";
			
			// energy
			setEnergy(180);
	}
	
	function setEnergy(energy) {
		var e = ~~(energy/4);
		energyDiv.style.left = (480 + e) + "px";
		energyDiv.style.width = (120 - e) + "px";
		cEnergy = energy;
	}
	
	function reloadLevel() {
		stopCountdown();
		parseLevel(levelCache[cLevel]);
	}
	
	
	function nextLevel() {
		stopCountdown();
		loadLevel(cLevel + 1);
	}
	
	function previousLevel() {
		stopCountdown();
		loadLevel(cLevel - 1);
	}
	
	function clean() {
		map.length = 0;
		cleanArray(items);
		cleanArray(players);
		cleanExtras();
	}
	
	/** 
	 * @private 
	 */
	function cleanArray(a) {
		for (var i = 0, l = a.length; i < l; i++) {
			var aa = a[i];
			if (aa) { removeFromBoard(aa.item); }
		}
		a.length = 0;
	}
	
	function cleanExtras() {
		for (var i = 0, l = extras.length; i < l; i++) {
			var e = extras[i];
			e.item.classList.remove(e.v);
			delete e.v;
		}
	}
	
	function createDiv(x, y, prefix, append) {
		var div = document.createElement("div");
		div.id = prefix + (append ? (x + "_" + y) : "");
		
		divStyle(x, y, div);
		
		return div;
	}
	
	function divStyle(x, y, div) {
		div.style.left = 30 * x + "px";
		div.style.top = 32*y + "px";
		div.style.zIndex = y;
	}
	
	function divStyle2(index, div) {
		var x = (index % levelSize), y = ~~(index/levelSize); // TODO change it !!!
		// divStyle(x, y, div);
		div.style.left = 30 * x + "px";
		div.style.top = 32*y + "px";
	}
	
	function addToBoard(render, renderBoard) {
		renderBoard = renderBoard || document.getElementById("renderBoard");
		if (renderBoard) {
			renderBoard.appendChild(render);
		} else {
			console.warn("!renderBoard");
		}
	}
	
	function removeFromBoard(render, renderBoard) {
		renderBoard = renderBoard || document.getElementById("renderBoard");
		if (renderBoard) {
			try {
				renderBoard.removeChild(render);
			} catch (e) {
				console.warn("error while removing", e);
			}
		} else {
			console.warn("!renderBoard");
		}
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
		if(getFromM(id)) {
			return;
		}
		a[0] = getFromM({"x": (id.x - 1), "y": (id.y - 1)});
		a[1] = getFromM({"x": id.x, "y": (id.y - 1)});
		a[2] = getFromM({"x": (id.x + 1), "y": (id.y - 1)});
		a[3] = getFromM({"x": (id.x + 1), "y": id.y});
		a[4] = getFromM({"x": (id.x + 1), "y": (id.y + 1)});
		a[5] = getFromM({"x": id.x, "y": (id.y + 1)});
		a[6] = getFromM({"x": (id.x - 1), "y": (id.y + 1)});
		a[7] = getFromM({"x": (id.x - 1), "y": id.y});
		
		
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
			if (debug["checkAround"]) { console.log("nothing to do"); }
		} else {
			if (debug["checkAround"]) { console.log("id", id, "around", a); }
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
	
	function fillW(val) {
		if (!val.w) {
			if (val.v.indexOf("1") > -1 || val.v.indexOf("4") > -1 || val.v.indexOf("7") > -1) {
				val.w = 1;
			} else if (val.v.indexOf("2") > -1 || val.v.indexOf("5") > -1 || val.v.indexOf("8") > -1) {
				val.w = 2;
			} else if (val.v.indexOf("3") > -1 || val.v.indexOf("6") > -1 || val.v.indexOf("9") > -1) {
				val.w = 3;
			}
		}
	}
	
	function setClassName2(index, className) {
		setClassName(index % levelSize, ~~(index / levelSize), className);
	}
	
	function setClassName(x, y, className) {
		render = document.getElementById("render_" + x + "_" + y);
		if (!render) { 
			console.warn("render_" + x + "_" + y);
			return;
		}
		render.className = "render " + className;
	}
	
	function set(x, y, className) {
		var index = y * levelSize + x,
			val = {};
		if (!className) {
			console.warn("!className");
			return;
		}
		
		val.v = className;
		if (isFloor(className)) {
		
			addToMap(index, val);
			setClassName(x, y, className);
		} else if (isItem(className)) {
			// TODO: remove workaround 
			addToMap(index, {v:"F0"});
			setClassName(x, y, "F0");
		
			var item = createDiv(x, y, "item_" + items.length, false, y);
			item.className = "item " + className;
			addToBoard(item);
			addToItems(index, val, item);
		} else if (isPlayer(className)) {
			// TODO: remove workaround 
			addToMap(index, {v:"F0"});
			setClassName(x, y, "F0");
			
			var player = createDiv(x, y, "player_" + players.length, false, y);
			player.className = "player " + className;
			addToBoard(player);
			
			players.push({item: player, index: index});
		}
	}
	
	function isFloor(v) {
		return ["E0", "E1", "F0", "G0", "I0", "O0", "T0", "T1", "T2", "T5", "W8", "W9"].indexOf(v) > -1;
	}
	
	function isItem(v) {
		return isBlock(v) || isWheelBlock(v) || isExtra(v) || isSlider(v) || isBomb(v) || isBlowable(v) || isTeleportIn(v) || isTeleportOut(v);
	}
	
	function isPlayer(v) {
		return v === "P0";
	}
	
	function isBlock(v) {
		return ["B1", "B2", "B3", "M1", "M2", "M3", "S4"].indexOf(v) > -1;
	}
	
	function isWheelBlock(v) {
		return ["M4", "M5", "M6", "M7", "M8", "M9", "W1", "W2", "W3", "W4", "W5", "W6"].indexOf(v) > -1;
	}
	
	function isBomb(v) {
		return v === "B0";
	}
	
	function isBlowable(v) {
		return v === "B9";
	}
	
	function isTeleportIn(v) {
		return v === "T3";
	}
	
	function isTeleportOut(v) {
		return v === "T4";
	}
	
	function isExtra(v) {
		return ["C0", "H0", "M0", "P1", "P2", "W7"].indexOf(v) > -1;
	}
	
	function isSlider(v) {
		return v === "S1";
	}

	function addToItems(index, val, item) {
		var v = val.v;
		if (isBlock(v)) {
			val.block = true;
		} else if (isWheelBlock(v)) {
			val.block = true;
			if (["M4", "M5", "M6", "W1", "W2", "W3"].indexOf(v) > -1) {
				val.dir = [LEFT, RIGHT];
			} else {
				val.dir = [UP, DOWN];
			}
		} else if (isSlider(v)) {
			val.slider = true;
		} else if (isExtra(v)) {
			val.extra = true;
		} else if (isBomb(v)) {
			val.block = true;
			val.bomb = true;
			val.w = 1;
		} else if (isBlowable(v)) {
			val.blowable = true;
			val.w = MAX_W + 1;
		} else if (isTeleportOut(v)) {
			val.teleportOut = true;
			val.w = 1;
		} else if (isTeleportIn(v)) {
			val.teleportIn = true;
			val.w = 1;
		}
		
		if (val.block || val.slider) {
			fillW(val);
		}
		
		val.index = index;
		val.item = item;
		
		items.push(val);
	}
	
	function addToMap(index, val) {
		val.floor = true;
		if (val.v === "G0") {
			val.glue = true;
		} else if (val.v === "I0") {
			val.ice = true;
		} else if (val.v === "T0") {
			val.teleport = true;
		} else if(val.v === "T1") {
			val.trap = true;
		} else if(val.v === "T2") {
			val.twister = true;
		} else if(val.v === "E0") {
			val.exit = true;
		} else if(val.v === "E1") {
			val.electricity = true;
		} else if(val.v === "W8") {
			val.water = true;
		} else if(val.v === "W9") {
			val.deepWater = true;
		}
		
		map[index] = val;
	};
    
	function getFromM(idObj) {
		if (idObj.x < 0 || idObj.x >= levelSize || idObj.y < 0 || idObj.y >= levelSize) {
			return undefined;
		}
		var a = map[idObj.y*levelSize+idObj.x],v;
		
		if (a) {
			v=a.v;
		}
		return v;
	};
	
	function moveBlock(p, a, item, w) {
		if (debug["moveBlock"]) { console.log("moveBlock", p, a, item, w); }
		var n = p + a,
		f = map[n];
		
		if (f) {
			if (!w) {
				w = item.w;
			}
			if(w < MAX_W) {
				// console.log("dir", item.dir, "a", a);
				if ((!item.dir) || (item.dir && item.dir.indexOf(a) > -1)) {
					// console.log("dir ok");
					var it = getItem(n);
					if (debug["moveBlock"]) { console.log("it", it); }
					if (it) { // FIXME:
						w += it.w;
						if (w < MAX_W) {
							if (((it.block || it.teleportIn || it.teleportOut) && moveBlock(n, a, it, w)) || (it.slider && moveSlider(n, a, it, w))) {
								moveItem(item, n, a);
								return true;
							}
						}
					} else if (f.trap) {
						if (debug["moveBlock"]) { console.log("f.trap"); }
						divStyle2(n, item.item);
						addToMap(n, {v: "T5"});
						setClassName2(n, "T5");
						removeFromItems(item);
						return true;
					} else if (f.teleport) {
						console.log("teleport", f, "a", a);
						playerMove = true;
						teleportOut = items[0];//findTeleportOut();
						n = teleportOut.index + a;
						moveItem(item, n, a);
						return true;
					} else if (f.ice) {
						var i = n, 
							trap = false,
							afterIce = map[i+a], 
							afterIceIt = getItem(i+a);
						if (debug["moveBlock"]) { console.log("ice", i, afterIce, afterIceIt); }
						while (afterIce && afterIce.ice && !afterIceIt) { // FIXME
							i += a;
							afterIce = map[i+a];
							afterIceIt = getItem(i+a);
							if (debug["moveBlock"]) { console.log("afterIce", JSON.stringify(afterIce), "afterIceIt", afterIceIt); }
						}
						if (debug["moveBlock"]) { console.log("i", i, "a", a); }
						if (afterIce) {
							if (debug["moveBlock"]) { console.log(afterIce); }
							if (afterIce.trap) {// FIXME
								i += a;
								if (debug["moveBlock"]) { console.log("trap"); }
								addToMap(i, {v: "T5"});// FIXME
								setClassName2(i, "T5");// FIXME
								removeFromItems(item);// FIXME
							} else if (afterIce.twister && !afterIceIt) {
								i += a;
								if (item.dir) {
									var cl = item.item.classList;
									if (a === LEFT || a === RIGHT) {
										item.dir = [DOWN, UP];
										cl.remove("W3");
										cl.add("W6");
									} else {
										item.dir = [LEFT, RIGHT];
										cl.remove("W6");
										cl.add("W3");
									}
								}
							} else if (afterIce.floor && !afterIceIt) {
								i += a;
								if (afterIce.glue) {
									item.w = MAX_W + 1;
								}
							}
						}
						if (debug["moveBlock"]) { console.log("i", i, "a", a); }
						moveItem(item, i, a);
						return true;
					} else if (f.twister) {
						moveItem(item, n, a);
						if (item.dir) {
							var cl = item.item.classList;
							if (a === LEFT || a === RIGHT) {
								item.dir = [DOWN, UP];
								cl.remove("W3");
								cl.add("W6");
							} else {
								item.dir = [LEFT, RIGHT];
								cl.remove("W6");
								cl.add("W3");
							}
						}
						return true;
					} else if (f.floor) {
						moveItem(item, n, a);
						if (f.glue) {
							item.w = MAX_W + 1;
						}
						return true;
					}
				}
			}
		}
		return false;
	}
	
	function moveSlider(p, a, slider, w) {
		if (debug["moveSlider"]) { console.log("moveSlider", p, a, slider, w); }
		var n = p + a,
		v, //?
		moved = false,
		trap = false,
		i = p,
		next = map[n]
		nextIt = getItem(n);
		playerIt = getItem(n, players);
		
		if (slider && next) {
			if (!w) {
				w = slider.w;
			}
			if (slider.w < MAX_W) {
				if (nextIt) {
					w += nextIt.w;
					if (w < MAX_W) {
						if ((nextIt.block && moveBlock(n, a, nextIt, w)) || (nextIt.slider && moveSlider(n, a, nextIt, w))) {
							moveItem(slider, n, a);
							return true;
						}
					}
				} else if (next.floor) {
					moved = true;
					// check how far slider can go
					while(next && next.floor && !nextIt && !playerIt) {
						i += a;
						if (next.trap) {
							trap = true;
							break;
						}
						next = map[i+a];
						nextIt = getItem(i+a);
						playerIt = getItem(i+a, players);
					}
					
					moveItem(slider, i, a);
					if (trap) { 
						addToMap(i, {v: "T5"});
						setClassName2(i, "T5");
						removeFromItems(slider);
					}
					if (map[i].glue) {
						slider.w = MAX_W + 1;
					}
				}
			}
		}
		return moved;
	}
	
	function getItem(index, a) {
		a = a || items;
		for (var i = 0, l = a.length; i < l; i++) {
			var item = a[i];
			if (item && item.index === index) {
				return item;
			}
		}
		return undefined;
	}
	
	function removeFromItems(it) {
		for (var i = 0, l = items.length; i < l; i++) {
			var item = items[i];
			if (item === it) {
				removeFromBoard(item.item);
				//item.item = null;
				delete items[i];
				return true;
			}
		}
		return false;
	}
	
	function findEmptyExtra() {
		for (var i = 0, l = extras.length; i < l; i++) {
			if (!extras[i].v) {
				return extras[i];
			}
		}
		return undefined;
	}
	
	function moveItem(it, n, a) {
		var item = it.item, z = ~~(n/levelSize);
		
		if (a == -levelSize) {
			item.setAttribute("z", z);
		} else {
			item.style.zIndex = z;
			item.removeAttribute("z");
		}
		divStyle2(n, item);
		it.index = n;
	}
	
	
	
	function movePlayer(player, a) {
		var n = player.index + a,
			playerMove = false,
			f = map[n]; // floor object
		
		player.dir = a;
		if (a === LEFT) {
			player.item.className = "player P0 left";
		} else if (a === RIGHT) {
			player.item.className = "player P0 right";
		} else if (a === UP) {
			player.item.className = "player P0 up";
		} else if (a === DOWN) {
			player.item.className = "player P0";
		}
		
		if (f) {
			var it = getItem(n);
			if (it) {
				if (debug["movePlayer"]) { console.log("it", it); }
				if (it.block || it.teleportOut || it.teleportIn) {
					if (debug["movePlayer"]) { console.log("move block"); }
					if (moveBlock(n, a, it)) {
						playerMove = true;
					}
				} else if (it.slider) {
					if (debug["movePlayer"]) { console.log("move slider"); }
					if (moveSlider(n, a, it)) {
						playerMove = true;
					}
				} else if (it.extra) {
					if (debug["movePlayer"]) { console.log("pick extra"); }
					if (pickExtra(it)) {
						playerMove = true;
					}
				}
			}
			if ((it && playerMove) || !it) {
				if (f.exit) {
					playerMove = true;
					info("Level " + cLevel + " completed!");
					setTimeout(function() {
						if (debug["movePlayer"]) { console.log("settimeout"); }
						nextLevel();
					}, 500);
				} else if (f.teleport) {
					console.log("teleport", f, "player.dir", player.dir);
					playerMove = true;
					teleportOut = items[0];//findTeleportOut();
					n = teleportOut.index + player.dir;
				} else if (f.trap || f.electricity || f.water || f.deepWater) {
					playerMove = true;
					info("Try one more time", true);
					reloadLevel();
				} else if (f.floor) {
					playerMove = true;
				}
			}
		}
		
		if (playerMove) {
			moveItem(player, n, a);
			setEnergy(cEnergy - 1);
		}
	}
	
	function updateTimer() {
		var now = new Date().getTime(),
			time = ~~((now - startDate) / 1000);
		
		// console.log("time", time, now);
		if (time < levelTimeLimit) {
			var c = 1,
				l = (parseInt(timeDiv.style.left, 10) - c),
				w = (parseInt(timeDiv.style.width, 10) + c);
			
			timeDiv.style.left = l + "px";
			timeDiv.style.width = w + "px";
		} else {
			info("The time is out");
			reloadLevel();
			stopCountdown();
		}
	}
	
	function startCountdown() {
		running = true;
		intervalId = setInterval(updateTimer, 1000);
	}
	
	function stopCountdown() {
		running = false;
		clearInterval(intervalId);
		intervalId = undefined;
	}
	
	function move(a) {
		if (!running) {
			startDate = new Date();
			if (debug["move"]) { console.log("startDate", startDate.getTime()); }
			startCountdown();
		}
		if (chooseExtraMode) {
			var extraIndex;
			if (a === LEFT && cExtra > 0) {
					extraIndex = cExtra - 1;
					selectExtra(extraIndex);
			} else if (a === RIGHT && cExtra < 3) {
					extraIndex = cExtra + 1;
					selectExtra(extraIndex);
			}
		} else {
			for (var i = 0, l = players.length; i < l; i += 1) {
				var player = players[i];
				movePlayer(player, a);
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
	
	function getCurrentLevel() {
		return cLevel;
	}
	
	function keydownHandler(event) {
		var k = event.keyCode, i, p = false, ctrl = event.ctrlKey, shift = event.shiftKey, level;
		if (debug["keydownHandler"]) { console.log("k =", k, "ctrl =", ctrl); }
		if (k == 37) { // left
			xit.left();
			p = !0;
		} else if (k == 39) { //right
			xit.right();
			p = !0;
		} else if (k == 38) { //up
			xit.up();
			p = !0;
		} else if (k == 40) { //down
			xit.down();
			p = !0;
		} else if (k == 13) { //enter
			xit.extra();
			p = !0;
		} else if (k == 82 && !ctrl && !shift) { // r
			xit.reloadLevel();
			p = !0;
		} else if (k == 78 && !ctrl && !shift) { // n
			xit.nextLevel();
			p = !0;
		} else if (k == 80 && !ctrl && !shift) { // p
			xit.previousLevel();
			p = !0;
		} else if (k == 79 && !ctrl && !shift) { // o
			level = prompt("Level number (1 - 14)?", 101);
			if (level) {
				xit.loadLevel(+level);
				p = !0;
			}
		} else if (k >= 49 && k <= 57 && !ctrl && !shift) { // 1 - 9 keyboard keys
			xit.loadLevel(/*100 + */k - 48);
			p = !0;
		}
		
		if (p) { event.preventDefault(); }
	}
	
	function bindKeys() {
		document.addEventListener("keydown", keydownHandler, false);
	}
	
	/*EXTRA*/
	
	function pickExtra(item) {
		var ex = findEmptyExtra(), 
			className = item.v;
		
		if (ex) {
			removeFromItems(item);
			ex.item.classList.add(className);
			ex.v = className;
			if (debug["pickExtra"]) { console.log("removed pick item"); }
			return true;
		} else {
			return false;
		}
	}
	
	function selectExtra(index) {
		var oldEl = extras[cExtra].item,
			newEl = extras[index].item;
		
		oldEl.classList.remove("active");
		newEl.classList.add("active");
		cExtra = index;
	}
	
	// function bombExplode() {
		
	// }
	
	function blow(index) {
		var it = getItem(index);
		
		if (it) {
			removeFromItems(it);
		}
		var f = map[index];
		if (f && !f.trap) {
			addToMap(index, {v: "F1"});
			setClassName2(index, "F1");
		}
	}
	
	function triggerBomb() {
		for (var i = 0, l = players.length; i < l; ++i) {
			var player = players[i];
			var n = player.index + player.dir;
			var item = getItem(n);
			
			if (debug["triggerBomb"]) { console.log("item", item, "n", n); }
			
			if (item && item.bomb) {
				if (debug["triggerBomb"]) { console.log("found bomb"); }
				var start = new Date();
				info("3");
				item.timeoutId = setTimeout(function a(){
					var now = new Date();
					var diff = now.getTime() - start.getTime();
					if (debug["triggerBomb"]) { console.log("timeout", diff); }
					if (diff < 3000) {
						if (diff < 1000) {
							info("3");
						} else if (diff < 2000) {
							info("2");
						} else if (diff < 3000) {
							info("1");
						}
						item.timeoutId = setTimeout(a, 500);
					} else {
						var itIndex = item.index;
						removeFromItems(item);
						addToMap(itIndex, {v: "F1"});
						setClassName2(itIndex, "F1");
						
						blow(itIndex + LEFT);
						blow(itIndex + RIGHT);
						blow(itIndex + UP);
						blow(itIndex + DOWN);
					}
				}, 500);
				return true;
			} else { 
				return false;
			}
		}
	}
	
	function pullBlock() {
		for (var i = 0, l = players.length; i < l; ++i) {
			var player = players[i],
				c = 0,
				n = player.index + player.dir,
				a = player.dir,
				it = getItem(n),
				f = map[n];
				
			while (!it && f) {
				console.log("c", c, "it", it, "f", f);
				n += a;
				it = getItem(n);
				f = map[n];
				c++;
			}
			if (debug["pullBlock"]) { console.log("c", c, "it", it, "f", f, "n", n); }
			if (it) {
				if (debug["pullBlock"]) { console.log("it", it); }
				moveSlider(n, -a, it);
				return true;
			}
		}
		return false;
	}
	
	function addWheel() {
		for (var i = 0, l = players.length; i < l; ++i) {
			var player = players[i],
				n = player.index + player.dir,
				a = player.dir,
				it = getItem(n);
			// TODO:
			if (it) {
				console.log("found it", it);
				
				var cl = it.item.classList;
				cl.remove("B3");
				if (a === LEFT || a === RIGHT) {
					cl.add("W3");
					it.v = "W3";
					it.dir = [LEFT, RIGHT];
				} else {
					cl.add("W6");
					it.v = "W6";
					it.dir = [UP, DOWN];
				}
				it.w -= 1.5;
			}
		}
	}
	
	function useExtra() {
		var ex = extras[cExtra];
		
		ex.item.classList.remove("active");
		var name = ex.v;
		var used = false;
		if (name) {
			if(name === "H0") {
				if (debug["useExtra"]) { console.log("heart"); }
				setEnergy(cEnergy + 90);
				used = true;
			} else if(name === "C0") {
				used = triggerBomb();
			} else if(name === "P1") {
				if (debug["useExtra"]) { console.log("puller"); }
				used = pullBlock();
			} else if(name === "P2") {
				if (debug["useExtra"]) { console.log("pusher"); }
				// TODO:
			} else if(name === "W7") {
				if (debug["useExtra"]) { console.log("wheel"); }
				// TODO:
				used = addWheel();
			} else {
				if (debug["useExtra"]) { console.log("unknown extra"); }
			}
			if (used) {
				ex.item.classList.remove(name);
				delete ex.v;
			}
		}
		
	}
	
	function extra() {
		if (chooseExtraMode) {
			// deactivate extra mode
			useExtra();
		} else {
			// activate extra mode
			selectExtra(cExtra);
		}
		chooseExtraMode = !chooseExtraMode;
	}
	
	return {
		// fields
		levelSize: levelSize, 
		m: map,
		i: items,
		p: players,
		e: extras,
		// methods
		init: init,
		getCurrentLevel: getCurrentLevel,
		loadLevel: loadLevel,
		nextLevel: nextLevel,
		reloadLevel: reloadLevel,
		previousLevel: previousLevel,
		left: function () { move(LEFT); },
		right: function () { move(RIGHT); },
		up: function () { move(UP); },
		down: function () { move(DOWN); },
		//info: info,
		extra: extra
	};
})(document);

if (document.addEventListener) {
	document.addEventListener("DOMContentLoaded", function () {
		xit.init();
	}, false);
} else {
	alert("use better browser");
}
	