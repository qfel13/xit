$(function () {
	var levelSize = 20, // TODO: 
	debug = false, 
	debugId = "render_-1_2",
	paint = false,
	m = [],
	s = [],
	ts,
	drags = $('.drag'),
	drops = $('.drop'),
	borderShown = false,
	downloader = $('#downloader'),
	iframeAdded = false;
	
	
	console.log("cLevel", localStorage["q13.cLevel"]);
	window.debugMode = function() {
		debug = true;
	};
	
	function setInM(idObj, val) {
		if (debug) { console.debug("setInM id", idObj); }
		m[idObj.y*levelSize+idObj.x] = val;
	}
	
	function getFromM(idObj) {
		if (idObj.x < 0 || idObj.x >= levelSize || idObj.y < 0 || idObj.y >= levelSize) {
			return undefined;
		}
		return m[idObj.y*levelSize+idObj.x];
	}
	
	function fromId(id, move) {
		var ret = {},
		start = id.indexOf("_"),
		end = id.indexOf("_", start + 1);
		
		ret.xStr = id.substring(start + 1, end);
		ret.x = Number(ret.xStr);
		ret.yStr = id.substring(end + 1);
		ret.y = Number(ret.yStr);
		return ret;
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
		if (typeof debugId !== "undefined" && id === debugId) {
			if (debug) { console.debug("id", id, "around", a); }
			if (debug) { console.debug("render before", render); }
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
		
		if (typeof debugId !== "undefined" && id === debugId) {
			if (debug) { console.debug("render after", render); }
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
	
	// DRAG
	drags.each(function() {
		this.setAttribute('draggable', 'true');
	});
	
	drags.bind("click", function(e) {
		var i, l, cl, render, select, idObj;
		if(s.length > 0) {
			cl = this.getAttribute('cl');
			for(i = 0, l = s.length; i < l; i += 1) {
				render = document.getElementById("render" + s[i]);
				render.className = "render " + cl;
				select = document.getElementById("drop" + s[i]);
				select.className = "drop out";
				idObj = fromId(s[i]);
				setInM(idObj, cl);
			}
			s = [];
			checkAllWalls();
		} else {
			if (ts) {
				if (debug) { console.debug("ts", ts); }
				ts.className = ts.className.replace(' toolSelected', '');
			}
			if (this !== ts) {
				this.className += ' toolSelected';
				ts = this;
			} else {
				ts = undefined;
			}
		}
	});
		
	drags.bind('dragstart', function(e) {
		var dt = e.originalEvent.dataTransfer;
		dt.effectAllowed = 'copy';
		dt.setData('Text', JSON.stringify({"className": this.className, "id": this.id, "cl": this.getAttribute("cl")}));
	});
	
	// DROP
	drops.bind('dragover', function(e) {
		e.preventDefault();
		var dt = e.originalEvent.dataTransfer;
		dt.dropEffect = 'copy';
		return false;
	});
	
	drops.bind('drop', function(e) {
		var dt = e.originalEvent.dataTransfer,
		textObj, render, cl;
		e.stopPropagation();
		paint = false;
		this.className = "drop out";
		
		
		try {
			textObj = JSON.parse(dt.getData('Text'));
			if (debug) { console.debug("textObj", textObj); }
			if (textObj.id === "") {
				if (debug) { console.debug("empty id"); }
				return false;
			}
			render = document.getElementById(this.id.replace("drop", "render"));
			
			cl = textObj.cl;
			if (debug) { console.debug("cl", cl); }
			if (cl) {
				render.className = "render " + cl;
				setInM(fromId(this.id), cl);
				checkAllWalls();
			}
		} catch (ex) {
			if (debug) { console.debug("drop ex:", ex); }
			return false;
		}
		return false;
	});
	
	drops.bind('dragenter', function(e) {
		this.className = "drop over";
		return false;
	});
	
	drops.bind('dragleave', function(e) {
		this.className = "drop out";
	});
	
	drops.bind('mouseup', function(e) {
		if (debug) { console.debug("mouseup id = ", this.id); }
		paint = false;
		checkAllWalls();
	});
	
	$(document).bind('mouseup', function(e) {
		if (debug) { console.debug("body mouseup"); }
		paint = false;
	});
	
	function toggle(a, el) {
		var i, l;
		for (i = 0, l = a.length; i < l; i += 1) {
			if (a[i] === el) {
				a.splice(i, 1);
				return;
			}
		}
		a.push(el);
	}
	
	drops.bind('mousedown', function(e) {
		var cl, render;
		if (e.which === 1) { // only for left click
			paint = true;
			
			if (ts) {
				cl = ts.getAttribute("cl");
				render = document.getElementById(this.id.replace("drop","render"));
				render.className = "render " + cl;
				setInM(fromId(this.id), cl);
			} else {
				toggle(s, this.id.replace("drop", ""));
				if (this.className.indexOf("out") !== -1) {
					this.className = "drop selected";
				} else {
					this.className = "drop out";
				}
			}
			if (debug) { console.debug("s", s.length); }
		}
	});
	
	drops.bind('mouseover', function() {
		var cl, render;
		if (paint) {
			if (ts) {
				cl = ts.getAttribute("cl");
				render = document.getElementById(this.id.replace("drop","render"));
				render.className = "render " + cl;
				setInM(fromId(this.id), cl);
			} else {
				toggle(s, this.id.replace("drop", ""));
				if (this.className.indexOf("out") !== -1) {
					this.className = "drop selected";
				} else {
					this.className = "drop out";
				}
			}
		}
	});
	
	function getGeneratedMap () {
		var count = 0,
		map = "",
		debugMap = "",
		i, l;
		
		for (i = 0, l = levelSize * levelSize; i < l; i += 1) {
			count += 1;
			map += (m[i] || "00");
			debugMap += m[i] ? m[i] + " " : "00 ";
			if (count === levelSize) {
				count = 0;
				map += "\n";
				debugMap += "\n";
			}
		}
		return {"map": map, "debugMap": debugMap};
	}
	// GENERATE
	$('#generate').bind('click', function() {
		var out = $('#out'),
		text = getGeneratedMap(),
		qr = $('#qr'),
		textUrl;
		
		out.html(text.debugMap);
		textUrl = encodeURI(text.map);
		if (debug) { console.debug("text = ", text); }
		
		qr.html("<img src='https://chart.googleapis.com/chart?chs=500x500&cht=qr&chl="+textUrl+"&chld=L|1&choe=UTF-8' />");
		qr.show();
	});
	$('#showOut').bind('click', function() {
		var out = $('#out');
		if (out.is(":visible")) {
			out.hide();
		} else {
			out.show();
		}
	});
	$('#showDrops').bind('click', function() {
		var dropBoard = $('#dropBoard');
		
		$(this).toggleClass('showDropsSelected');
		
		if (dropBoard.is(":visible")) {
			dropBoard.hide();
		} else {
			dropBoard.show();
		}
	});
	
	// BORDERS
	$('#showBorders').bind('click', function() {
		if (borderShown) {
			$('#dropBoard').css('border', '');
			$('#renderBoard').css('border', '');
			borderShown = false;
		} else {
			$('#dropBoard').css('border', '1px solid white');
			$('#renderBoard').css('border', '1px solid white');
			borderShown = true;
		}
	});
	// DOWNLOADER
	if (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder) {
		downloader.bind('click', function() {
			var bb, blob, iframe, url;
			
			if (window.BlobBuilder) {
				bb = new BlobBuilder();
				url = window.URL;
			} else if (window.WebKitBlobBuilder) {
				bb = new WebKitBlobBuilder();
				url = window.webkitURL;
			} else if (window.MozBlobBuilder) {
				bb = new MozBlobBuilder();
				url = window.URL;
			}
			
			bb.append(getGeneratedMap().map);
			blob = bb.getBlob('plain/text');
			iframe = document.createElement("iframe");
			iframe.style.display = "none";
			iframe.src = url.createObjectURL(blob);
			if (!iframeAdded) {
				document.body.appendChild(iframe);
				iframeAdded = true;
			}
		});
	} else {
		downloader.hide();
	}
	
	function minimizeMap(map) {
		return map;
	}
	
	$("#tryLevel").bind("click", function() {
		var map = getGeneratedMap().map;
		map = minimizeMap(map);
		console.log("map\n" + map);
		localStorage["level"] = map;
		document.location.href = "../#load";
	});
	
	// read from file
	if (!window.File) {
		console.warn('!window.File');
	}
	if (!window.FileReader) {
		console.warn('!window.FileReader');
	}
	if (!window.FileList) {
		console.warn('!window.FileList');
	}
	
	function parseLevel(s) {
		lines = s.split("\n");
		for (i = 0, k = lines.length; i < k; i += 1) {
			line = lines[i];
			for (j = 0, l = line.length/2; j < l; j += 1) {
				className = line[2*j] + line[2*j+1];
				if (className !== "00") {
					setInM({"x": j, "y": i}, className);
					render = document.getElementById("render_" + j + "_" + i);
					render.className = "render " + className;
				}
			}
		}
		checkAllWalls();
	}
	
	$('#files').bind('change', function (evt) {
		var files = evt.target.files, // FileList object
		i = 0, l, f, reader;
		
		function handler(theFile) {
			return function(e) {
				var i,j,l,k,line,lines,className,render;
				// clear map
				m = [];
				parseLevel(e.target.result);
				/*lines = e.target.result.split("\n");
				for (i = 0, k = lines.length; i < k; i += 1) {
					line = lines[i];
					for (j = 0, l = line.length/2; j < l; j += 1) {
						className = line[2*j] + line[2*j+1];
						if (className !== "00") {
							setInM({"x": j, "y": i}, className);
							render = document.getElementById("render_" + j + "_" + i);
							render.className = "render " + className;
						}
					}
				}
				checkAllWalls();
				*/
			};
		}
		
		f = files[i];
		do {
			if (f.type.match('text.*')) {
				reader = new FileReader();
				
				reader.onload = handler(f);
				reader.readAsText(f);
			}
			i += 1;
			f = files[i];
		} while (f);
	});
	
	function getLevelName() {
		var loadRegex = /load=?(\w+)?/i,
			l = document.location,
			h = l.hash,
			hMatch = h.match(loadRegex),
			s = l.search,
			sMatch = s.match(loadRegex),
			name = "level";
			
		if (hMatch) {
			return (hMatch[1] || name);
		} else if (sMatch) {
			return (sMatch[1] || name);
		}
	}
	
	function loadLevelFromStorage (name) {
		var levelStr = localStorage[name];
		if (levelStr) {
			parseLevel(levelStr);
			return true;
		}
		return false;
	}
	
	var lName = getLevelName();
		
	if (lName) {
		loadLevelFromStorage("level");
	}
});