var xit = (function(document) {
	"use strict";
	var cEnergy,
		cExtra = 0,
		cLevel,
		chooseExtraMode = false,
		debug = {parseLevel: true},
		defaultLevelName = "level",
		energyDiv,
		extras = [],
		infoDiv,
		intervalId,
		items = [],
		levelSize = 20,
		levelTimeLimit,
		map = [],
		players = [],
		levelCache = [],
		running = false,
		startDate,
		timeDiv,
		// constants
		DOWN = levelSize,
		LEFT = -1,
		MAX_EXTRAS = 4,
		MAX_W = 3,
		RIGHT = 1,
		UP = -levelSize,
		// for jslint this function have Circular dependency
		reloadLevel,
		stopCountdown,
		moveSlider,
		moveBlock;
	
	
	/**
	 * @dependencies none [getAttribute, removeAttribute] 
	 */
	function transitionEndHandler(event) {
		if (debug.transitionEndHandler) { console.log("handler event =", event); }
		var t = event.target, 
			z = t.getAttribute("z");
		t.removeAttribute("z");
		if (z) {
			t.style.zIndex = z;
		}
	}
	
	/**
	 * @dependencies none 
	 */
	function divStyle(x, y, div) {
		div.style.left = 30 * x + "px";
		div.style.top = 32*y + "px";
		div.style.zIndex = y;
	}
	
	/**
	 * @dependencies none
	 */
	function divStyle2(index, div) {
		var x = (index % levelSize), 
			y = ~~(index/levelSize);
		
		div.style.left = 30 * x + "px";
		div.style.top = 32*y + "px";
	}
	
	/**
	 * @dependencies divStyle [createElement]
	 */
	function createDiv(x, y, prefix, append) {
		var div = document.createElement("div");
		div.id = prefix + (append ? (x + "_" + y) : "");
		
		divStyle(x, y, div);
		
		return div;
	}
	
	/**
	 * @dependencies extras [createElement, appendChild]
	 * @sideEffect assign created DOMElements to extras table
	 * @return {DOMElement} created hud 
	 */
	function createHud() {
		var extraDiv, 
			hud = document.createElement("div"),
			i;
			
		hud.id = "hud";

		for (i = 0; i < MAX_EXTRAS; i += 1) {
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
	 * @private
	 * @param {DOMElement} render DOM element which should be appended
	 * @param {DOMElement} renderBoard DOM element to which render would be appended, can be empty
	 * @dependencies none [getElementById(), appendChild(), console]
	 */
	function addToBoard(render, renderBoard) {
		renderBoard = renderBoard || document.getElementById("renderBoard");
		if (renderBoard) {
			renderBoard.appendChild(render);
		} else {
			console.warn("!renderBoard");
		}
	}
	
	/** 
	 * @private
	 * @param {DOMElement} render DOM element which should be removed
	 * @param {DOMElement} renderBoard DOM element from which render would be removed, can be empty
	 * @dependencies none [getElementById, removeChild, console]
	 */
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
	
	/**
	 * DOM initialization.
	 * @private
	 * @param {number} size size of generated board
	 * @dependencies createDiv(), addToBoard(), createHud(), levelSize [createElement(), addEventListener(), appendChild(), body]
	 */
	function initDom(size) {
		var renderBoard = document.createElement("div"),
			i, j, hudDiv;
		size = size || levelSize; // FIXME: change to arg len
		renderBoard.id = "renderBoard";
		renderBoard.style.width = 30 * size + "px";
		renderBoard.style.height = 32 * size + "px";
		
		renderBoard.addEventListener("webkitTransitionEnd", transitionEndHandler, false);
		renderBoard.addEventListener("transitionend", transitionEndHandler, false);
		
		if (debug.initDom) { console.log("size =", size); }
		for (j = -1; j <= size; j+=1) {
			for (i = -1; i <= size; i+=1) {
				addToBoard(createDiv(i, j, "render_", true), renderBoard);
			}
		}
		
		infoDiv = document.createElement("div");
		infoDiv.id = "info";
		
		hudDiv = createHud();
		
		document.body.appendChild(renderBoard);
		document.body.appendChild(infoDiv);
		document.body.appendChild(hudDiv);
	}
	
	/** 
	 * @private 
	 * @param {array} a array which should be cleaned
	 * @dependencies removeFromBoard()
	 */
	function cleanArray(a) {
	var i, l, aa;
		for (i = 0, l = a.length; i < l; i += 1) {
			aa = a[i];
			if (aa) { removeFromBoard(aa.item); }
		}
		a.length = 0;
	}
	
	/** 
	 * @private 
	 * @dependencies extras [classList]
	 */
	function cleanExtras() {
		var i, l, e;
		for (i = 0, l = extras.length; i < l; i += 1) {
			e = extras[i];
			e.item.classList.remove(e.v);
			delete e.v;
		}
	}
	
	/**
	 * Cleans all internal tables [items, players, extras] and removes connected DOMElements.
	 * @private
	 * @dependencies cleanArray(), cleanExtras()
	 */
	function clean() {
		map.length = 0;
		cleanArray(items);
		cleanArray(players);
		cleanExtras();
	}
	
	/**
	 * @private
	 * @dependencies none [getElementById(), className, console]
	 */
	function setClassName(x, y, className) {
		var render = document.getElementById("render_" + x + "_" + y);
		if (!render) { 
			console.warn("render_" + x + "_" + y);
			return;
		}
		render.className = "render " + className;
	}
	
	/**
	 * @private
	 * @dependencies setClassName(), levelSize
	 */
	function setClassName2(index, className) {
		setClassName(index % levelSize, ~~(index / levelSize), className);
	}
	
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isFloor(v) {
		return ["E0", "E1", "F0", "G0", "I0", "O0", "T0", "T1", "T2", "T5", "W8", "W9"].indexOf(v) > -1;
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isPlayer(v) {
		return v === "P0";
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isBlock(v) {
		return ["B1", "B2", "B3", "M1", "M2", "M3"].indexOf(v) > -1;
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isWheelBlock(v) {
		return ["M4", "M5", "M6", "M7", "M8", "M9", "W1", "W2", "W3", "W4", "W5", "W6"].indexOf(v) > -1;
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isBomb(v) {
		return v === "B0";
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isBlowable(v) {
		return v === "B9";
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isTeleportIn(v) {
		return v === "T3";
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isTeleportOut(v) {
		return v === "T4";
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isExtra(v) {
		return ["C0", "H0", "M0", "P1", "P2", "W7"].indexOf(v) > -1;
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isSlider(v) {
		return v === "S1";
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isSnow(v) {
		return v === "S4";
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function isRadioactive(v) {
		return v === "R0";
	}
	
	/**
	 * @private
	 * @dependencies isBlock(), isWheelBlock(), isExtra(), isSlider(), isBomb(), isBlowable(), isTeleportIn(), isTeleportOut(), isSonw(), isRadioactive()
	 */
	function isItem(v) {
		return isBlock(v) || isWheelBlock(v) || isExtra(v) || isSlider(v) || isBomb(v) || isBlowable(v) || isTeleportIn(v) || isTeleportOut(v) || isSnow(v) || isRadioactive(v);
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
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
	
	/**
	 * @private
	 * @dependencies isBlock(), isWheelBlock(), isExtra(), isSlider(), isBomb(), isBlowable(), isTeleportIn(), 
	 *					isTeleportOut(), fillW(), items, MAX_W
	 */
	function addToItems(index, val, item) {
		var v = val.v;
		if (isBlock(v)) {
			val.block = true;
		} else if (isWheelBlock(v)) {
			val.block = true;
			val.wheel = true;
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
		} else if (isSnow(v)) {
			val.snow = true;
			val.block = true;
		}
		
		if (val.block || val.slider) {
			fillW(val);
			if (val.wheel) {
				val.w -= 1.5; // FIXME
			}
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
			console.log("E0");
			val.exit = true;
		} else if(val.v === "E1") {
			val.electricity = true;
		} else if(val.v === "W8") {
			val.water = true;
		} else if(val.v === "W9") {
			val.deepWater = true;
		}
		
		map[index] = val;
	}
	
	/**
	 * @private
	 * @dependencies isFloor(), isItem(), isPlayer(), createDiv(), addToMap(), setClassName(), levelSize, players [console]
	 */
	function set(x, y, className) {
		var index = y * levelSize + x,
			val = {},
			item, 
			player;
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
		
			item = createDiv(x, y, "item_" + items.length, false, y);
			item.className = "item " + className;
			addToBoard(item);
			addToItems(index, val, item);
		} else if (isPlayer(className)) {
			// TODO: remove workaround 
			addToMap(index, {v:"F0"});
			setClassName(x, y, "F0");
			
			player = createDiv(x, y, "player_" + players.length, false, y);
			player.className = "player " + className;
			addToBoard(player);
			
			players.push({item: player, index: index});
		}
	}
	
	/**
	 * @private
	 * @dependencies map, levelSize
	 */
	function getFromMap(x, y) {
		var a, v;
		if (x < 0 || x >= levelSize || y < 0 || y >= levelSize) {
			return undefined;
		}
		a = map[y * levelSize + x];
		
		if (a) {
			v = a.v;
		}
		return v;
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
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
	
	/**
	 * @private
	 * @dependencies getFromMap(), checkIndexes() [console]
	 */
	function checkAround(x, y) {
		var a = [], render;
		
		if(getFromMap(x, y)) {
			return;
		}
		
		a[0] = getFromMap(x - 1, y - 1);
		a[1] = getFromMap(x, y - 1);
		a[2] = getFromMap(x + 1, y - 1);
		a[3] = getFromMap(x + 1,y);
		a[4] = getFromMap(x + 1, y + 1);
		a[5] = getFromMap(x, y + 1);
		a[6] = getFromMap(x - 1, y + 1);
		a[7] = getFromMap(x - 1, y);
		
		
		render = document.getElementById("render_" + x + "_" + y);
		if (!render) {
			console.warn("render === null, x = ", x, "y = ", y);
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
			if (debug.checkAround) { console.log("nothing to do"); }
		} else {
			if (debug.checkAround) { console.log("x", x, "y", y, "around", a); }
		}
	}
	
	/**
	 * @private
	 * @dependencies checkAround(), levelSize
	 */
	function checkAllWalls() {
		var i, j, l = levelSize + 1;
		for (i = -1; i < l; i += 1) {
			for (j = -1; j < l; j += 1) {
				checkAround(i, j);
			}
		}
	}
	
	/**
	 * @private
	 * @param {number} energy the value to set
	 * @dependencies cEnergy, energyDiv
	 */
	function setEnergy(energy) {
		var e = ~~(energy/4);
		energyDiv.style.left = (480 + e) + "px";
		energyDiv.style.width = (120 - e) + "px";
		cEnergy = energy;
	}
	
	/**
	 * @private
	 * @param {string} s string containing level
	 * @dependencies clean(), set(), checkAllWalls(), setEnergy(), levelSize [console]
	 */
	function parseLevel(s) {
		var i, j, l, ll, k, line, lines, className, version;

			clean();
			lines = s.split("\n");
			lines.pop(); // remove last empty entry
			version = lines.shift();
			if(debug.parseLevel) { console.log("vesrion", version); }
			k = lines.length;
			if(debug.parseLevel) { console.log("levelSize", levelSize, "k", k); }
			if (k > levelSize) {
				console.warn("k should reinit DOM");
			}
			for (i = 0; i < k; i += 1) {
				line = lines[i];
				ll = line.length;
				if ((ll / 2) > levelSize) {
					console.warn("l should reinit DOM");
				}
				for (j = 0, l = ll / 2; j < l; j += 1) {
					className = line[2 * j] + line[2 * j + 1];
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
	
	/**
	 * @public
	 * @param {number} n level number to load
	 * @dependencies cLevel, levelCache, parseLevel [XMLHttpRequest, console]
	 */
	function loadLevel(n) {
		var levelStr = levelCache[n],
			xhr,
			ls = (n > 9 ? n > 99 ? "" : "0" : "00") + n;
		
		if (!levelStr) {
			if(debug.loadLevel) { console.log("No entry in cache - loading from server"); }
			xhr = new XMLHttpRequest();
			xhr.open("GET", "levels/" + ls + ".txt", true);
			xhr.onreadystatechange = function () {
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
			if(debug.loadLevel) { console.log("Found entry in cache - loading from cache"); }
			parseLevel(levelStr);
			cLevel = n;
		}
	}
	
	/**
	 * @public
	 * @param {string} name localStorage key
	 * @dependencies parseLevel [console]
	 */
	function loadLevelFromStorage (name) {
		var levelStr = localStorage[name];
		if (levelStr) {
			levelCache[0] = levelStr;
			parseLevel(levelStr);
			cLevel = 0;
			return true;
		}
		return false;
	}
	
	/**
	 * @private
	 * @dependencies infoDiv [setTimeout]
	 */
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
	
	/**
	 * @private
	 * @dependencies startDate, levelTimeLimit, reloadLevel(), stopCountdown(), info() [Date, parseInt]
	 */
	function updateTimer() {
		var now = new Date().getTime(),
			time = ~~((now - startDate) / 1000),
			c, l, w;
		
		// console.log("time", time, now);
		if (time < levelTimeLimit) {
			c = 1;
			l = (parseInt(timeDiv.style.left, 10) - c);
			w = (parseInt(timeDiv.style.width, 10) + c);
			
			timeDiv.style.left = l + "px";
			timeDiv.style.width = w + "px";
		} else {
			info("The time is out");
			reloadLevel();
			stopCountdown();
		}
	}
	
	/**
	 * @private
	 * @dependencies running, intervalId, updateTimer() [setInterval]
	 */
	function startCountdown() {
		running = true;
		intervalId = setInterval(updateTimer, 1000);
	}
	
	/**
	 * @private
	 * @dependencies running, intervalId, updateTimer() [clearInterval]
	 */
	stopCountdown = function stopCountdown() {
		running = false;
		clearInterval(intervalId);
		intervalId = undefined;
	};
	
	/**
	 * @private
	 * @dependencies stopCountdown(), parseLevel(), levelCache, cLevel
	 */
	reloadLevel = function reloadLevel() {
		stopCountdown();
		parseLevel(levelCache[cLevel]);
	};
	
	/**
	 * @private
	 * @dependencies stopCountdown(), loadLevel(), cLevel
	 */
	function nextLevel() {
		stopCountdown();
		if (cLevel === 14) {
			alert("you finished all prepared levels");
		} else {
			loadLevel(cLevel + 1);
		}
	}
	
	/**
	 * @private
	 * @dependencies stopCountdown(), loadLevel(), cLevel
	 */
	function previousLevel() {
		stopCountdown();
		loadLevel(cLevel - 1);
	}
	
	/**
	 * @private
	 * @dependencies none
	 */
	function getItem(index, a) {
		var i, l, item;
		a = a || items;
		for (i = 0, l = a.length; i < l; i += 1) {
			item = a[i];
			if (item && item.index === index) {
				return item;
			}
		}
		return undefined;
	}
	
	/**
	 * @private
	 * @dependencies removeFromBoard()
	 */
	function removeFrom(a, it) {
		var i, l, item;
		for (i = 0, l = a.length; i < l; i += 1) {
			item = a[i];
			if (item === it) {
				removeFromBoard(item.item);
				delete a[i];
				return true;
			}
		}
		return false;
	}
	
	/**
	 * @private
	 * @dependencies divStyle2(), levelSize [setAttribute, removeAttribute]
	 */
	function moveItem(it, n, a) {
		var item = it.item, z = ~~(n/levelSize);
		
		if (a === -levelSize) {
			item.setAttribute("z", z);
		} else {
			item.style.zIndex = z;
			item.removeAttribute("z");
		}
		divStyle2(n, item);
		it.index = n;
	}
	
	/**
	 * @private
	 * @dependencies extras
	 */
	function findEmptyExtra() {
		var i, l;
		for (i = 0, l = extras.length; i < l; i += 1) {
			if (!extras[i].v) {
				return extras[i];
			}
		}
		return undefined;
	}
	
	/**
	 * @private
	 * @dependencies findEmptyExtra(), removeFrom() [classList, className, console]
	 */
	function pickExtra(item) {
		var ex = findEmptyExtra(), 
			className = item.v;
		
		if (ex) {
			removeFrom(items, item);
			ex.item.classList.add(className);
			ex.v = className;
			if (debug.pickExtra) { console.log("removed pick item"); }
			return true;
		} else {
			return false;
		}
	}
	
	/**
	 * @private
	 * @dependencies getItem(), removeFrom(), addToMap(), setClassName2()
	 */
	function blow(index) {
		var it = getItem(index),
			f;
		
		if (it) {
			removeFrom(items, it);
		}
		f = map[index];
		if (f && !f.trap) {
			addToMap(index, {v: "F1"});
			setClassName2(index, "F1");
		}
	}
	
	function findTeleportOut(v) {
		var i, l, item, tv;
		if(v === "T0") {
			tv = "T4";
		} else if(v === "T5") {
			tv = "T6";
		}
		for (i = 0, l = items.length; i < l; i += 1) {
			item = items[i];
			if (item && item.v === tv) {
				return item;
			}
		}
		return undefined;
	}
	
	function findWaterAround(n) {
		var f, i, l, index, r = [], 
			a = [UP, DOWN, LEFT, RIGHT, 2*UP, 2*DOWN, 2*LEFT, 2*RIGHT, UP + RIGHT, UP + LEFT, DOWN + RIGHT, DOWN + LEFT];
		for (i = 0, l = a.length; i < l; i += 1) {
			index = n + a[i];
			f = map[index];
			if (f) {
				if (f.water) {
					r.push({v: "W8", index: index});
				} else if (f.deepWater) {
					r.push({v: "W9", index: index});
				}
			}
		}
		return r;
	}
	
	moveBlock = function moveBlock(p, a, item, w) {
		if (debug.moveBlock) { console.log("moveBlock", p, a, item, w); }
		var n = p + a,
		f = map[n],
		teleportOut,
		cl, i, j, l, trap, afterIce, afterIceIt, it, waterIndex, waterIndexes, tf, v;
		
		if (f) {
			if (!w) {
				w = item.w;
			}
			if(w < MAX_W) {
				// console.log("dir", item.dir, "a", a);
				if ((!item.dir) || (item.dir && item.dir.indexOf(a) > -1)) {
					// console.log("dir ok");
					it = getItem(n);
					if (debug.moveBlock) { console.log("it", it); }
					if (it) { // FIXME:
						w += it.w;
						if (w < MAX_W) {
							if (it.snow && f.electricity) {
								console.log("waterIndexes", it.waterIndexes);
								for(i = 0, l = it.waterIndexes.length; i < l; i += 1) {
									v = it.waterIndexes[i].v;
									j = it.waterIndexes[i].index;
									addToMap(j, {v: v});// FIXME
									setClassName2(j, v);// FIXME
								}
							}
							if (((it.block || it.teleportIn || it.teleportOut) && moveBlock(n, a, it, w))
									|| (it.slider && moveSlider(n, a, it, w))) {
								moveItem(item, n, a);
								return true;
							}
						}
					} else if (f.trap) {
						if (debug.moveBlock) { console.log("f.trap"); }
						divStyle2(n, item.item);
						addToMap(n, {v: "T5"});
						setClassName2(n, "T5");
						removeFrom(items, item);
						return true;
					} else if (f.teleport) {
						if (debug.moveBlock) { console.log("teleport", f, "a", a); }
						teleportOut = findTeleportOut(f.v);
						if (teleportOut) {
							n = teleportOut.index + a;
							tf = map[n];
							if (!tf) {
								removeFrom(items, item);
							} else if (tf.trap) {
								addToMap(n, {v: "T5"});
								setClassName2(n, "T5");
								removeFrom(items, item);
							} else {
								moveItem(item, n, a);
							}
							return true;
						} else {
							moveItem(item, n, a);
							return true;
						}
					} else if (f.ice) {
						i = n;
						trap = false;
						afterIce = map[i+a];
						afterIceIt = getItem(i+a);
						
						if (debug.moveBlock) { console.log("ice", i, afterIce, afterIceIt); }
						while (afterIce && afterIce.ice && !afterIceIt) { // FIXME
							i += a;
							afterIce = map[i+a];
							afterIceIt = getItem(i+a);
							if (debug.moveBlock) { console.log("afterIce", JSON.stringify(afterIce), "afterIceIt", afterIceIt); }
						}
						if (debug.moveBlock) { console.log("i", i, "a", a); }
						if (afterIce) {
							if (debug.moveBlock) { console.log(afterIce); }
							if (afterIce.trap) {// FIXME
								i += a;
								if (debug.moveBlock) { console.log("trap"); }
								addToMap(i, {v: "T5"});// FIXME
								setClassName2(i, "T5");// FIXME
								removeFrom(items, item);// FIXME
							} else if (afterIce.twister && !afterIceIt) {
								i += a;
								if (item.dir) {
									cl = item.item.classList;
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
							} else if (afterIce.water && !afterIceIt) {
								console.log("water");
							} else if (afterIce.deepWater && !afterIceIt) {
								console.log("deepWater");
							} else if (afterIce.floor && !afterIceIt) {
								i += a;
								if (afterIce.glue) {
									item.w = MAX_W + 1;
								}
							}
						}
						if (debug.moveBlock) { console.log("i", i, "a", a); }
						moveItem(item, i, a);
						return true;
					} else if (f.twister) {
						moveItem(item, n, a);
						if (item.dir) {
							cl = item.item.classList;
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
					} else if (f.deepWater) {
						removeFrom(items, item);
						return true;
					} else if (f.water) {
						// console.log("water");
						f.water = false;
						// moveItem(item, n, a);
						addToMap(n, {v: "WB"});// FIXME
						setClassName2(n, "WB");// FIXME
						removeFrom(items, item);
						return true;
					} else if (f.electricity) {
						console.log("electricity", f, item);
						if (item.snow) {
							console.log("item.snow");
							waterIndexes = findWaterAround(n);
							for (j = 0, l = waterIndexes.length; j < l; j += 1) {
								waterIndex = waterIndexes[j].index;
								addToMap(waterIndex, {v: "I0"});
								setClassName2(waterIndex, "I0");
							}
							item.waterIndexes = waterIndexes;
						} else if (item.teleportIn) {
							console.log("item.teleportIn");
							addToMap(n, {v: "T0"});// FIXME
							setClassName2(n, "T0");// FIXME
							removeFrom(items, item);
							return true;
						}
						moveItem(item, n, a);
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
	};
	
	moveSlider = function moveSlider(p, a, slider, w) {
		if (debug.moveSlider) { console.log("moveSlider", p, a, slider, w); }
		var n = p + a,
			moved = false,
			trap = false,
			water = false,
			i = p,
			next = map[n],
			nextIt = getItem(n),
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
						} else if (next.water) {
							water = true;
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
						removeFrom(items, slider);
					}
					if (water) {
						addToMap(i, {v: "WB"});
						setClassName2(i, "WB");
						removeFrom(items, slider);
					}
					if (map[i].glue) {
						slider.w = MAX_W + 1;
					}
				}
			}
		}
		return moved;
	};
	
	function movePlayer(player, a) {
		var n = player.index + a,
			playerMove = false,
			f = map[n], // floor object
			it, tn, tf, teleportOut;
		
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
			it = getItem(n);
			if (it) {
				if (debug.movePlayer) { console.log("it", it); }
				if (it.block || it.teleportOut || it.teleportIn) {
					if (debug.movePlayer) { console.log("move block"); }
					if (moveBlock(n, a, it)) {
						playerMove = true;
					}
				} else if (it.slider) {
					if (debug.movePlayer) { console.log("move slider"); }
					if (moveSlider(n, a, it)) {
						playerMove = true;
					}
				} else if (it.extra) {
					if (debug.movePlayer) { console.log("pick extra"); }
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
						if (debug.movePlayer) { console.log("settimeout"); }
						nextLevel();
					}, 500);
				} else if (f.teleport) {
					if (debug.movePlayer) { console.log("teleport", f, "player.dir", player.dir); }
					
					teleportOut = findTeleportOut(f.v);
					if (teleportOut) {
						tn = teleportOut.index + player.dir;
						tf = map[tn];
						if (!tf) {
							blow(n);
							playerMove = false;
							removeFrom(players, player);
							info("Try one more time", true);
							setTimeout(reloadLevel, 500);
						} else if (getItem(tn)) {
							blow(tn);
							playerMove = false;
							removeFrom(players, player);
							info("Try one more time", true);
							setTimeout(reloadLevel, 500);
						} else if (tf.trap) {
							playerMove = false;
							removeFrom(players, player);
							info("Try one more time", true);
							setTimeout(reloadLevel, 500);
						} else {
							playerMove = true;
							n = tn;
						}
					} else {
						playerMove = true;
					}
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
	
	/**
	 * @private
	 * @dependencies extras, cExtra
	 */
	function selectExtra(index) {
		var oldEl = extras[cExtra].item,
			newEl = extras[index].item;
		
		oldEl.classList.remove("active");
		newEl.classList.add("active");
		cExtra = index;
	}
	
	/**
	 * @private
	 * @dependencies startDate, running, chooseExtraMode, LEFT, RIGHT, cExtra, players, startCountdown(), selectExtra(), movePlayer()
	 */
	function move(a) {
		var extraIndex, i, l, player;
		
		if (!running) {
			startDate = new Date();
			if (debug.move) { console.log("startDate", startDate.getTime()); }
			startCountdown();
		}
		if (chooseExtraMode) {
			if (a === LEFT && cExtra > 0) {
					extraIndex = cExtra - 1;
					selectExtra(extraIndex);
			} else if (a === RIGHT && cExtra < 3) {
					extraIndex = cExtra + 1;
					selectExtra(extraIndex);
			}
		} else {
			for (i = 0, l = players.length; i < l; i += 1) {
				player = players[i];
				movePlayer(player, a);
			}
		}
	}
	
	function getCurrentLevel() {
		return cLevel;
	}
	
	function keydownHandler(event) {
		var k = event.keyCode, p = false, ctrl = event.ctrlKey, shift = event.shiftKey, level;
		if (debug.keydownHandler) { console.log("k =", k, "ctrl =", ctrl); }
		if (k === 37) { // left
			xit.left();
			p = true;
		} else if (k === 39) { //right
			xit.right();
			p = true;
		} else if (k === 38) { //up
			xit.up();
			p = true;
		} else if (k === 40) { //down
			xit.down();
			p = true;
		} else if (k === 13) { //enter
			xit.extra();
			p = true;
		} else if (k === 67 && !ctrl && !shift) { // c
			document.location.href = "editor/";
			p = true;
		} else if (k === 69 && !ctrl && !shift) { // e
			localStorage[defaultLevelName] = levelCache[cLevel];
			document.location.href = "editor/#load";
			p = true;
		} else if (k === 82 && !ctrl && !shift) { // r
			xit.reloadLevel();
			p = true;
		} else if (k === 78 && !ctrl && !shift) { // n
			xit.nextLevel();
			p = true;
		} else if (k === 80 && !ctrl && !shift) { // p
			xit.previousLevel();
			p = true;
		} else if (k === 79 && !ctrl && !shift) { // o
			level = prompt("Level number (1 - 14)?", 101);
			if (level) {
				xit.loadLevel(+level);
				p = true;
			}
		} else if (k >= 49 && k <= 57 && !ctrl && !shift) { // 1 - 9 keyboard keys
			xit.loadLevel(/*100 + */k - 48);
			p = true;
		}
		
		if (p) { event.preventDefault(); }
	}
	
	function bindKeys() {
		document.addEventListener("keydown", keydownHandler, false);
	}
		
	function triggerBombForPlayer(player) {
		var n, item, start, now, diff, itIndex;
		n = player.index + player.dir;
		item = getItem(n);
		
		if (debug.triggerBomb) { console.log("item", item, "n", n); }
		
		if (item && item.bomb) {
			if (debug.triggerBomb) { console.log("found bomb"); }
			start = new Date();
			info("3");
			item.timeoutId = setTimeout(function bombCountdown(){
				now = new Date();
				diff = now.getTime() - start.getTime();
				if (debug.triggerBomb) { console.log("timeout", diff); }
				if (diff < 3000) {
					if (diff < 1000) {
						info("3");
					} else if (diff < 2000) {
						info("2");
					} else if (diff < 3000) {
						info("1");
					}
					item.timeoutId = setTimeout(bombCountdown, 500);
				} else {
					itIndex = item.index;
					removeFrom(items, item);
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
	
	function triggerBomb() {
		var i, l, player;
		for (i = 0, l = players.length; i < l; i += 1) {
			player = players[i];
			triggerBombForPlayer(player);
		}
	}
	
	function pullBlock() {
		var i, l, player, c, n, a, it, f;
		for ( i = 0, l = players.length; i < l; i += 1) {
			player = players[i];
			c = 0;
			n = player.index + player.dir;
			a = player.dir;
			it = getItem(n);
			f = map[n];
				
			while (!it && f) {
				console.log("c", c, "it", it, "f", f);
				n += a;
				it = getItem(n);
				f = map[n];
				c += 1;
			}
			if (debug.pullBlock) { console.log("c", c, "it", it, "f", f, "n", n); }
			if (it) {
				if (debug.pullBlock) { console.log("it", it); }
				moveSlider(n, -a, it);
				return true;
			}
		}
		return false;
	}
	
	function addWheel() {
		var i, l, player, n, a, it, cl;
		for (i = 0, l = players.length; i < l; i += 1) {
			player = players[i];
			n = player.index + player.dir;
			a = player.dir;
			it = getItem(n);
			
			if (it) {
				if (debug.addWheel) { console.log("found it", it); }
				
				cl = it.item.classList;
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
		var ex = extras[cExtra],
			cl = ex.item.classList,
			name = ex.v,
			used = false;
		
		cl.remove("active");
		
		if (name) {
			if(name === "H0") {
				if (debug.useExtra) { console.log("heart"); }
				setEnergy(cEnergy + 90);
				used = true;
			} else if(name === "C0") {
				used = triggerBomb();
			} else if(name === "P1") {
				if (debug.useExtra) { console.log("puller"); }
				used = pullBlock();
			} else if(name === "P2") {
				if (debug.useExtra) { console.log("pusher"); }
				// TODO:
			} else if(name === "W7") {
				if (debug.useExtra) { console.log("wheel"); }
				used = addWheel();
			} else {
				console.warn("unknown extra");
			}
			if (used) {
				cl.remove(name);
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
	
	function getLevelName() {
		var loadRegex = /load=?(\w+)?/i,
			l = document.location,
			h = l.hash,
			hMatch = h.match(loadRegex),
			s = l.search,
			sMatch = s.match(loadRegex);
			
		if (hMatch) {
			return (hMatch[1] || defaultLevelName);
		} else if (sMatch) {
			return (sMatch[1] || defaultLevelName);
		}
	}
	
	/**
	 * Module initialization.
	 * @public
	 */
	function init() {
		var lName = getLevelName(),
			loaded = false;
		
		initDom();
		
		if (lName) {
			loaded = loadLevelFromStorage(lName);
			if (!loaded) {
				info("Loading from localStorage level with name '" + lName + "' failed", true);
			}
		}
		if (!loaded) {
			loadLevel(+localStorage["q13.cLevel"] || 1);
		}
		bindKeys();
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
}(document));

document.addEventListener("DOMContentLoaded", function () {
	"use strict";
	xit.init();
}, false);
