<!DOCTYPE html>
<html lang="en">
<head>
<meta charset=utf-8 />
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Xit Level Editor</title>
<link rel="stylesheet" type="text/css" href="css/editor.css" />
<script src="js/jquery-1.5.1.min.js"></script>
<script src="js/editor.js"></script>
</head>
<body>
	<div id="floors">
		<div class="toolsHeader">floors</div>
		<span cl="D0" class="drag D0" id="doorTool"></span>
		<span cl="E0" class="drag E0" id="exitTool"></span>
		<span cl="E1" class="drag E1" id="electricityTool"></span>
		<span cl="F0" class="drag F0" id="floorTool"></span>
		<span cl="G0" class="drag G0" id="glueTool"></span>
		<span cl="I0" class="drag I0" id="iceTool"></span>
		<span cl="O0" class="drag O0" id="openerTool"></span>
		<span cl="T0" class="drag T0" id="teleportInFloorTool"></span>
		<span cl="T1" class="drag T1" id="trapTool"></span>
		<span cl="T2" class="drag T2" id="twisterTool"></span>
		<span cl="W8" class="drag W8" id="waterTool"></span>
		<span cl="W9" class="drag W9" id="deepWaterTool"></span>
	</div>
	<div id="blocks">
		<div class="toolsHeader">blocks</div>
		<span cl="B1" class="drag B1" id="block1Tool"></span>
		<span cl="B2" class="drag B2" id="block2Tool"></span>
		<span cl="B3" class="drag B3" id="block3Tool"></span>
		<span cl="M1" class="drag M1" id="block1magnetizedTool"></span>
		<span cl="M2" class="drag M2" id="block2magnetizedTool"></span>
		<span cl="M3" class="drag M3" id="block3magnetizedTool"></span>
		<span cl="M4" class="drag M4" id="block1wheelmagnetizedTool"></span>
		<span cl="M5" class="drag M5" id="block2wheelmagnetizedTool"></span>
		<span cl="M6" class="drag M6" id="block3wheelmagnetizedTool"></span>
		<span cl="M7" class="drag M7" id="block1wheel2magnetizedTool"></span>
		<span cl="M8" class="drag M8" id="block2wheel2magnetizedTool"></span>
		<span cl="M9" class="drag M9" id="block3wheel2magnetizedTool"></span>
		<span cl="S0" class="drag S0" id="slideTool"></span>
		<span cl="W1" class="drag W1" id="block1wheelTool"></span>
		<span cl="W2" class="drag W2" id="block2wheelTool"></span>
		<span cl="W3" class="drag W3" id="block3wheelTool"></span>
		<span cl="W4" class="drag W4" id="block1wheel2Tool"></span>
		<span cl="W5" class="drag W5" id="block2wheel2Tool"></span>
		<span cl="W6" class="drag W6" id="block3wheel2Tool"></span>
		<span cl="B9" class="drag B9" id="blowableTool"></span>
	</div>
	<div id="objects">
		<div class="toolsHeader">objects</div>
		<span cl="B0" class="drag B0" id="bombTool"></span>
		<span cl="E2" class="drag E2" id="electromagnetTool"></span>
		<span cl="E3" class="drag E3" id="electromagnet2Tool"></span>
		<span cl="P0" class="drag P0" id="playerTool"></span>
		<span cl="R0" class="drag R0" id="radioactiveTool"></span>
		<span cl="S1" class="drag S1" id="snowTool"></span>
		<span cl="T3" class="drag T3" id="teleportInBlockTool"></span>
		<span cl="T4" class="drag T4" id="teleportOutTool"></span>
		<span cl="W0" class="drag W0" id="wallTool"></span>
	</div>
	<div id="extras">
		<div class="toolsHeader">extras</div>
		<span cl="C0" class="drag C0" id="clockTool"></span>
		<span cl="H0" class="drag H0" id="heartTool"></span>
		<span cl="M0" class="drag M0" id="magnetizerTool"></span>
		<span cl="P1" class="drag P1" id="pullerTool"></span>
		<span cl="P2" class="drag P2" id="pusherTool"></span>
		<span cl="W7" class="drag W7" id="wheelTool"></span>
	</div>
	<div id="buttons">
		<div class="toolsHeader">buttons</div>
		<span cl="" class="drag rubber" id="rubberTool"></span>
		<span id="tryLevel" class="helper">try level</span>
		<span id="generate" class="helper">generate</span>
		<span id="showOut" class="helper" style="display:none">debug</span>
		<span id="showDrops" class="helper">drops</span>
		<span id="showBorders" class="helper" style="display:none">borders</span>
		<span id="downloader" class="helper">download</span>
		<span id="loader" class="helper" style="display:none">load from file</span>
		<input type="file" id="files" multiple="multiple" accept="text/*" style="float: left; color: #FFF;"/>
	</div>
	<?php $size = 20; ?>
	<div id="dropBoard" style="width: <?php echo 30*$size; ?>px; height: <?php echo 32 *$size; ?>px;">
	<?php
		for ($i = 0; $i < $size; $i++) {
			for ($j = 0; $j < $size; $j++) {
				echo '<div class="drop out" id="drop_'.$i.'_'.$j.'" style="left: '.($i*30).'px; top: '.($j*32).'px;"></div>';
			}
		}
	?>
	</div>
	
	<div id="renderBoard" style="width: <?php echo 30*$size; ?>px; height: <?php echo 32 *$size; ?>px;">
	<?php
		for ($j = -1; $j < $size + 1; $j++) {
			for ($i = -1; $i < $size + 1; $i++) {
				echo '<div class="render" id="render_'.$i.'_'.$j.'" style="left: '.($i*30).'px; top: '.($j*32 - 25).'px; z-index: '.$j.'"></div>';
			}
		}
	?>
	</div>
	
	<div id="dots1" class="dots"></div>
	<div id="dots2" class="dots"></div>
	<div id="stone1" class="stone"></div>
	<div id="stone2" class="stone"></div>
	<div id="stone3" class="stone"></div>
	<div id="hole1" class="hole"></div>
	<div id="hole2" class="hole"></div>
	<div id="results">
		<div id="qr"></div>
		<pre id="out"></pre>
	</div>
</body>
</html>