import './pixi.min.js';
import './charm.min.js';
import './ion.sound.min.js';



const START_TIME = 4250;
let PLAYERS = {}
, deadline
, to
, greeted = false
, in_game = false
, results_shown = true
, started = false
, curTree
, curTreeY
, curBranchY = 0
, curMaxTime
, curTimeBonus = 250
, curScore = 0
, curLevel = 1;

function ge(id) {
    return "string" == typeof id ? document.getElementById(id) : id;
}
function trim(text) {
    return (text || "").replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, "");
}
function hasClass(obj, name) {
    obj = ge(obj);
    return obj && (new RegExp('(\\s|^)' + name + '(\\s|$)')).test(obj.className);
}
function addClass(obj, name) {
    obj = ge(obj);
    if (obj && !hasClass(obj, name)) obj.className = trim(obj.className + ' ' + name);
}
function removeClass(obj, name) {
    obj = ge(obj);
    if (obj && hasClass(obj, name)) obj.className = trim(obj.className.replace((new RegExp('(\\s+|^)' + name + '(\\s+|$)')), ' '));
}
function toggleClass(obj, name, a) {
    let n = "undefined" == typeof a ? hasClass(obj, name) : !a;
    n ? removeClass(obj, name) : addClass(obj, name)
}
function addEvent(e, ev, a) {
    if (e = ge(e), a = a || rf, e && 3 != e.nodeType && 8 != e.nodeType) {
        e.setInterval && e != window && (e = window);
        for (let t = ev.split(" "), n = 0, r = t.length; r > n; n++) {
            let o = t[n];
            e.addEventListener ? e.addEventListener(o, a, !1) : e.attachEvent && e.attachEvent("on" + o, a)
        }
    }
}
function removeEvent(e, ev, a) {
    if (e = ge(e), a = a || rf, e && 3 != e.nodeType && 8 != e.nodeType) {
        for (let t = ev.split(" "), n = 0, r = t.length; r > n; n++) {
            let o = t[n];
            e.removeEventListener ? e.removeEventListener(o, a, !1) : e.detachEvent && e.detachEvent("on" + o, a)
        }
    }
}

let eScoreValue       = ge('score_value')
, eTable            = ge('table')
, eTableWrap        = ge('table_wrap')
, ePageWrap         = ge('page_wrap')
, eCanvasWrap       = ge('canvas_wrap')
, eButtonLeft       = ge('button_left')
, eButtonRight      = ge('button_right');

let Graphics = {
    bg_trees:     'images/bg_trees.svg',
    bg_bottom:    'images/bg_bottom.svg',
    bg_clouds:    'images/bg_clouds.svg',

    ground_bg:    'images/ground_bg.svg',
    ground_left:  'images/ground_left.svg',
    ground_right: 'images/ground_right.svg',

    log: 'images/log.svg',
    branch: 'images/branch.svg',
    trunk: 'images/trunk.svg',
    stumb: 'images/stumb.svg',
    stones: 'images/stones.svg',
    lumber_body: 'images/lumber_body.svg',
    hand_up: 'images/hand_up.svg',
    hand_down: 'images/hand_down.svg',
    lumber_died: 'images/lumber_died.svg',
}

let bg_trees, bg_bottom, bg_clouds, ground_bg, ground_left, ground_right, branches, move_branches, trunk, stumb, stones, lumber, lumber_body, hand_down, hand_up, lumber_died, timeline_wrap, timeline, timeline_warn, scores_label, level_label;
let g_ground_bg, g_ground_left, g_ground_right, g_stumb, g_stones, g_lumber, g_lumber_body, g_hand_up, g_lumber_died;

let cWidth, cHeight, cIsVertical, renderer, canvas, resolution, stage, charm;
let gHeight = 170, g_renderer, g_canvas, g_stage;
let isTimelineWarn, isLumberLeft = false;

let tBranch, tLog;

resolution = window.devicePixelRatio;
if (resolution > 2) {
    resolution = 2;
}

renderer = PIXI.autoDetectRenderer(cWidth, cHeight, {
    antialias: true,
    resolution: resolution
});
renderer.roundPixels = true;
renderer.backgroundColor = 0xD3F7FF;
canvas = renderer.view;
eCanvasWrap.appendChild(canvas);

stage = new PIXI.Container();
charm = new Charm(PIXI);

g_renderer = PIXI.autoDetectRenderer(cWidth, cHeight, {
    transparent: true,
    resolution: resolution
});
g_renderer.roundPixels = true;
g_canvas = g_renderer.view;
//eCanvasWrap.appendChild(g_canvas);

g_stage = new PIXI.Container();

initCanvas();

function initCanvas() {
    cIsVertical = true;
    cWidth  = Math.min(ePageWrap.offsetWidth || 375, 600);
    cHeight = ePageWrap.offsetHeight;
    if (cHeight <= 480 && cWidth >= 480) {
        // cHeight -= 0;
        cIsVertical = false;
    } else if (cHeight <= 480) {
        cHeight -= 128;
    } else if (cHeight <= 570) {
        cHeight -= 188;
    } else {
        cHeight -= 228;
    }

    renderer.resize(cWidth, cHeight);
    canvas.width = cWidth * resolution;
    canvas.height = cHeight * resolution;
    canvas.style.width = cWidth + 'px';
    canvas.style.height = cHeight + 'px';

    g_renderer.resize(cWidth, gHeight);
    g_canvas.width = cWidth * resolution;
    g_canvas.height = gHeight * resolution;
    g_canvas.style.width = cWidth + 'px';
    g_canvas.style.height = gHeight + 'px';
}

function addSprites(loadedImgs) {
    let texture;

    bg_trees = new PIXI.extras.TilingSprite(pixiTextureFromImage(loadedImgs.bg_trees), cWidth, cHeight);
    bg_trees.tileScale.x = 0.5;
    bg_trees.tileScale.y = 0.5;
    bg_trees.tilePosition.x = -13;
    bg_trees.anchor.set(0, 1);
    stage.addChild(bg_trees);

    bg_bottom = new PIXI.extras.TilingSprite(pixiTextureFromImage(loadedImgs.bg_bottom), cWidth, 90);
    bg_bottom.tileScale.x = 0.5;
    bg_bottom.tileScale.y = 0.5;
    bg_bottom.tilePosition.x = -13;
    bg_bottom.anchor.set(0, 1);
    stage.addChild(bg_bottom);

    bg_clouds = new PIXI.extras.TilingSprite(pixiTextureFromImage(loadedImgs.bg_clouds), cWidth, 128);
    bg_clouds.y = 15;
    bg_clouds.tileScale.x = 0.5;
    bg_clouds.tileScale.y = 0.5;
    bg_clouds.tilePosition.x = 15;
    stage.addChild(bg_clouds);

    ground_bg = new PIXI.extras.TilingSprite(pixiTextureFromImage(loadedImgs.ground_bg), cWidth - 140 - 195, 95);
    ground_bg.tileScale.x = 0.5;
    ground_bg.tileScale.y = 0.5;
    ground_bg.anchor.set(0, 1);
    stage.addChild(ground_bg);

    ground_left = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.ground_left));
    ground_left.width = 140;
    ground_left.height = 95;
    ground_left.anchor.set(0, 1);
    stage.addChild(ground_left);

    ground_right = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.ground_right));
    ground_right.width = 195;
    ground_right.height = 95;
    ground_right.anchor.set(1, 1);
    stage.addChild(ground_right);

    tLog = new PIXI.Texture(new PIXI.BaseTexture(loadedImgs.log));
    tBranch = new PIXI.Texture(new PIXI.BaseTexture(loadedImgs.branch));

    branches = new PIXI.Container();
    branches.visible = !results_shown;
    stage.addChild(branches);

    move_branches = new PIXI.Container();
    move_branches.visible = !results_shown;
    stage.addChild(move_branches);

    trunk = new PIXI.extras.TilingSprite(pixiTextureFromImage(loadedImgs.trunk), 50, 375);
    trunk.visible = !results_shown;
    trunk.tileScale.x = 0.5;
    trunk.tileScale.y = 0.5;
    trunk.tilePosition.y = 25;
    trunk.anchor.set(0.5, 1);
    stage.addChild(trunk);

    stumb = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.stumb));
    stumb.width = 50;
    stumb.height = 60;
    stumb.visible = !!results_shown;
    stumb.anchor.set(0.5, 1);
    stumb.cacheAsBitmap = true;
    stage.addChild(stumb);

    stones = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.stones));
    stones.width = 75;
    stones.height = 36;
    stones.anchor.set(0.5, 1);
    stones.cacheAsBitmap = true;
    stage.addChild(stones);

    lumber = new PIXI.Container();
    flip(lumber, isLumberLeft);

    lumber_body = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.lumber_body));
    lumber_body.width = 50;
    lumber_body.height = 107;
    lumber_body.anchor.set(0, 1);
    lumber_body.cacheAsBitmap = true;
    lumber.addChild(lumber_body);

    hand_up = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.hand_up));
    hand_up.x = 21;
    hand_up.y = -57;
    hand_up.width = 47;
    hand_up.height = 52;
    hand_up.anchor.set(0, 1);
    hand_up.cacheAsBitmap = true;
    hand_up.visible = true;
    lumber.addChild(hand_up);

    hand_down = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.hand_down));
    hand_down.x = 29;
    hand_down.y = -58;
    hand_down.width = 59;
    hand_down.height = 9;
    hand_down.anchor.set(1, 1);
    hand_down.cacheAsBitmap = true;
    hand_down.visible = false;
    lumber.addChild(hand_down);

    stage.addChild(lumber);

    lumber_died = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.lumber_died));
    lumber_died.width = 73;
    lumber_died.height = 85;
    lumber_died.anchor.set(0, 1);
    lumber_died.cacheAsBitmap = true;
    lumber_died.visible = false;
    flip(lumber_died, isLumberLeft);
    stage.addChild(lumber_died);

    timeline_wrap = new PIXI.Container();
    timeline_wrap.visible = !results_shown;

    let timeline_rect = new PIXI.Graphics();
    timeline_rect.lineStyle(3, 0x886332);
    timeline_rect.beginFill(0xFFFFFF);
    timeline_rect.drawRoundedRect(0, 0, 98, 17, 9.5);
    timeline_rect.endFill();
    timeline_wrap.addChild(timeline_rect);

    let timeline_mask = new PIXI.Graphics();
    timeline_mask.beginFill(0x000000);
    timeline_mask.drawRoundedRect(4.5, 4, 89, 9, 4.5);
    timeline_mask.endFill();
    timeline_wrap.addChild(timeline_mask);

    timeline = new PIXI.Graphics();
    timeline.mask = timeline_mask;
    timeline.beginFill(0x7EAD4F);
    timeline.drawRoundedRect(4.5, 4, 89, 9, 4.5);
    timeline.endFill();
    timeline.x = -89;
    timeline_wrap.addChild(timeline);

    timeline_warn = new PIXI.Graphics();
    timeline_warn.mask = timeline_mask;
    timeline_warn.beginFill(0xCE453A);
    timeline_warn.drawRoundedRect(4.5, 4, 89, 9, 4.5);
    timeline_warn.endFill();
    timeline_warn.alpha = 0;
    timeline_wrap.addChild(timeline_warn);
    stage.addChild(timeline_wrap);

    timelineColor(false);

    scores_label = new PIXI.Text('', {
        fontFamily: 'Charter',
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        dropShadow: true,
        dropShadowAngle: radians(90),
        dropShadowColor: 0x886332,
        dropShadowDistance: 1.5
    });
    scores_label.anchor.set(0.5, 0);
    scores_label.visible = !results_shown;
    stage.addChild(scores_label);

    level_label = new PIXI.Text('', {
        fontFamily: 'Charter',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        dropShadow: true,
        dropShadowAngle: radians(90),
        dropShadowColor: 0x886332,
        dropShadowDistance: 1.5
    });
    level_label.anchor.set(0.5, 0);
    level_label.visible = !results_shown;
    level_label.alpha = 0;
    level_label.scale.x = .8;
    level_label.scale.y = .8;
    stage.addChild(level_label);


    g_ground_bg = new PIXI.extras.TilingSprite(pixiTextureFromImage(loadedImgs.ground_bg), cWidth - 140 - 195, 95);
    g_ground_bg.tileScale.x = 0.5;
    g_ground_bg.tileScale.y = 0.5;
    g_ground_bg.anchor.set(0, 1);
    g_stage.addChild(g_ground_bg);

    g_ground_left = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.ground_left));
    g_ground_left.width = 140;
    g_ground_left.height = 95;
    g_ground_left.anchor.set(0, 1);
    g_stage.addChild(g_ground_left);

    g_ground_right = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.ground_right));
    g_ground_right.width = 195;
    g_ground_right.height = 95;
    g_ground_right.anchor.set(1, 1);
    g_stage.addChild(g_ground_right);

    g_stumb = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.stumb));
    g_stumb.width = 50;
    g_stumb.height = 60;
    g_stumb.anchor.set(0.5, 1);
    g_stumb.cacheAsBitmap = true;
    g_stage.addChild(g_stumb);

    g_stones = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.stones));
    g_stones.width = 75;
    g_stones.height = 36;
    g_stones.anchor.set(0.5, 1);
    g_stones.cacheAsBitmap = true;
    g_stage.addChild(g_stones);

    g_lumber = new PIXI.Container();
    flip(g_lumber, isLumberLeft);

    g_lumber_body = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.lumber_body));
    g_lumber_body.width = 50;
    g_lumber_body.height = 107;
    g_lumber_body.anchor.set(0, 1);
    g_lumber_body.cacheAsBitmap = true;
    g_lumber.addChild(g_lumber_body);

    g_hand_up = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.hand_up));
    g_hand_up.x = 21;
    g_hand_up.y = -57;
    g_hand_up.width = 47;
    g_hand_up.height = 52;
    g_hand_up.anchor.set(0, 1);
    g_hand_up.cacheAsBitmap = true;
    g_hand_up.visible = true;
    g_lumber.addChild(g_hand_up);

    g_stage.addChild(g_lumber);

    g_lumber_died = new PIXI.Sprite(pixiTextureFromImage(loadedImgs.lumber_died));
    g_lumber_died.width = 73;
    g_lumber_died.height = 85;
    g_lumber_died.anchor.set(0, 1);
    g_lumber_died.cacheAsBitmap = true;
    g_lumber_died.visible = false;
    flip(g_lumber_died, isLumberLeft);
    g_stage.addChild(g_lumber_died);

    initSprites();
}

function initSprites() {
    bg_trees.width = cWidth;
    bg_trees.height = cHeight;
    bg_trees.y = cHeight;
    bg_trees.tilePosition.y = (cHeight - 52);

    bg_bottom.width = cWidth;
    bg_bottom.height = 90;
    bg_bottom.y = cHeight - 40;

    bg_clouds.width = cWidth;
    bg_clouds.height = 128;

    ground_bg.width = cWidth - 140 - 195;
    ground_bg.height = 95;
    ground_bg.x = 140;
    ground_bg.y = cHeight;
    ground_left.y = cHeight;
    ground_right.x = cWidth;
    ground_right.y = cHeight;

    branches.x = cWidth / 2;
    branches.y = (cHeight - 55) + curBranchY;

    move_branches.x = cWidth / 2;
    move_branches.y = cHeight - 105;

    trunk.x = cWidth / 2;
    trunk.y = cHeight - 45;
    trunk.height = cHeight - 45;

    stumb.x = cWidth / 2;
    stumb.y = cHeight - 45;

    stones.x = cWidth / 2;
    stones.y = cHeight - 34;

    lumber.x = cWidth / 2 + (isLumberLeft ? -35 : 35);
    lumber.y = cHeight - 55;

    lumber_died.x = cWidth / 2 + (isLumberLeft ? -32 : 32);
    lumber_died.y = cHeight - 55;

    timeline_wrap.x = cWidth / 2 - 48.5;
    timeline_wrap.y = 11;

    scores_label.x = cWidth / 2;
    scores_label.y = 30;

    level_label.x = cWidth / 2;
    level_label.y = 56;


    g_ground_bg.width = cWidth - 140 - 195;
    g_ground_bg.height = 95;
    g_ground_bg.x = 140;
    g_ground_bg.y = gHeight;
    g_ground_left.y = gHeight;
    g_ground_right.x = cWidth;
    g_ground_right.y = gHeight;

    g_stumb.x = cWidth / 2;
    g_stumb.y = gHeight - 45;

    g_stones.x = cWidth / 2;
    g_stones.y = gHeight - 34;

    g_lumber.x = cWidth / 2 + (isLumberLeft ? -35 : 35);
    g_lumber.y = gHeight - 55;

    g_lumber_died.x = cWidth / 2 + (isLumberLeft ? -32 : 32);
    g_lumber_died.y = gHeight - 55;

    g_renderer.render(g_stage);

    if (!greeted) {
        updateLumber(!cIsVertical);
    }
}

let loaded = false, graphicsLoaded = false;

function checkLoad() {
    if (graphicsLoaded) {
        loaded = true;
        addClass(ePageWrap, 'ready');
        setTimeout(function() {
            updateTable();
        }, 500);
    }
}

loadImages(Graphics, function(loadedImgs) {
    graphicsLoaded = true;
    addSprites(loadedImgs);
    checkLoad();
    animate();
});

renderer.render(stage);
g_renderer.render(g_stage);

function animate() {

    if (in_game && started) {
        checkAndUpdateProgress();
    }

    bg_clouds.tilePosition.x -= 0.25;

    charm.update();
    renderer.render(stage);
    requestAnimationFrame(animate);
}

function loadImages(files, cb) {
    let images = {}
    let cnt = 0, done = 0
    for(let i in files) {
        cnt += 1;
    }
    for(let i in files) {
        images[i] = new Image();
        images[i].src = files[i];
        images[i].onload = function() {
            done += 1;
            if (done == cnt) {
                cb(images)
            }
        }
    }
}

ion.sound({
    sounds: [
        {name: 'hit1'},
        {name: 'hit2'},
        {name: 'hit3'}
    ],
    path: 'sounds/',
    preload: true,
    multiplay: true,
    volume: 1
});
function playSound(sound) {
    ion.sound.play(sound);
}

function pixiTextureFromImage(img) {
    let base_texture = new PIXI.BaseTexture(img);
    return new PIXI.Texture(base_texture);
}
function flip(sprite, flipped) {
    if (!flipped === sprite.scale.x < 0) {
        sprite.scale.x = -sprite.scale.x;
    }
}
function radians(degrees) {
    return degrees * Math.PI / 180;
}
function now() {
    return +(new Date);
}
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function timelineColor(warn) {
    if (isTimelineWarn !== warn) {
        isTimelineWarn = warn;
        if (warn) {
            charm.fadeIn(timeline_warn, 6);
        } else {
            charm.fadeOut(timeline_warn, 6);
        }
    }
}
function initTree() {
    curTree = [0, 0];
    curTreeY = 100;
    curBranchY = 0;

    branches.y = (cHeight - 55) + curBranchY;
    trunk.tilePosition.y = 25 + curBranchY;

    branches.removeChildren();
    move_branches.removeChildren();
    while (curTree.length < 11) {
        let is_left = rand(1, 1000) <= 500;
        curTree.push(is_left ? -1 : 1, is_left ? -2 : 2);
        curTreeY += 100;

        let branch = new PIXI.Sprite(tBranch);
        branch.x = is_left ? -10 : 10;
        branch.y = -curTreeY;
        branch.width = 125;
        branch.height = 80;
        branch.anchor.set(0, 1);
        flip(branch, is_left);
        branch.cacheAsBitmap = true;
        branches.addChild(branch);
    }
}
function checkAndUpdateProgress() {
    let time_left = deadline - now();
    if (time_left > 0) {
        updateProgress();
        return;
    }
    stopGame();
}
function updateScore() {
    let cur_score = +curScore || '0';
    if (loaded) {
        scores_label.text = cur_score;
    }
    eScoreValue.innerHTML = cur_score;
}

function updateTree(left, no_move) {
    if (curTree.length % 2) {
        let is_left = rand(1, 1000) <= 500;
        curTree.push(is_left ? -1 : 1, is_left ? -2 : 2);
        curTreeY += 100;

        let branch = new PIXI.Sprite(tBranch);
        branch.x = is_left ? -10 : 10;
        branch.y = -curTreeY;
        branch.width = 125;
        branch.height = 80;
        branch.anchor.set(0, 1);
        flip(branch, is_left);
        branch.cacheAsBitmap = true;
        branches.addChild(branch);
    }
    let cur_branch = curTree.shift();

    if (!no_move) {
        if (Math.abs(cur_branch) == 2) {
            branches.removeChildAt(0);

            let branch = new PIXI.Sprite(tBranch);
            branch.x = left ? 10 : -10;
            branch.width = 125;
            branch.height = 80;
            branch.anchor.set(0, 1);
            flip(branch, !left);
            branch.cacheAsBitmap = true;
            charm.slide(branch, branch.x + (left ? 100 : -100), -30, 24);
            charm.fadeOut(branch, 24);
            charm.rotate(branch, radians(left ? 60 : -60), 24);
            charm.scale(branch, branch.scale.x * 1.2, branch.scale.y * 1.2, 24).onComplete = function() {
                move_branches.removeChild(branch);
            };
            move_branches.addChild(branch);
        }
        else {
            let branch = new PIXI.Sprite(tLog);
            branch.x = left ? 25 : -25;
            branch.width = 50;
            branch.height = 50;
            branch.anchor.set(left ? 1 : 0, 1);
            branch.cacheAsBitmap = true;
            charm.slide(branch, branch.x + (left ? 100 : -100), -10, 24);
            charm.fadeOut(branch, 24);
            charm.rotate(branch, radians(left ? 60 : -60), 24);
            charm.scale(branch, branch.scale.x * 1.2, branch.scale.y * 1.2, 24).onComplete = function() {
                move_branches.removeChild(branch);
            };
            move_branches.addChild(branch);
        }
    }
    curBranchY += 50;
    charm.slide(branches, branches.x, (cHeight - 55) + curBranchY, 9);
    charm.slide(trunk.tilePosition, trunk.tilePosition.x, 25 + curBranchY, 9);
}

function updateLumber(left, hit, branch) {
    isLumberLeft  = left;
    lumber.x      = cWidth / 2 + (isLumberLeft ? -35 : 35);
    lumber_died.x = cWidth / 2 + (isLumberLeft ? -32 : 32);
    flip(lumber,      left);
    flip(lumber_died, left);

    g_lumber.x      = cWidth / 2 + (isLumberLeft ? -35 : 35);
    g_lumber_died.x = cWidth / 2 + (isLumberLeft ? -32 : 32);
    flip(g_lumber,      left);
    flip(g_lumber_died, left);

    if (greeted) {
        if (in_game) {
            lumber_died.visible = false;
            lumber.visible = true;
            g_lumber_died.visible = false;
            g_lumber.visible = true;
        } else {
            lumber_died.visible = true;
            lumber.visible = false;
            g_lumber_died.visible = true;
            g_lumber.visible = false;
        }
        if (hit) {
            lumberHit(branch);
        }
    }
}

function lumberHit(branch) {
    hand_down.visible = true;
    hand_up.visible = false;
    setTimeout(function() {
        hand_down.visible = false;
        hand_up.visible = true;
    }, 50);
    if (branch) {
        playSound('hit2');
    } else {
        playSound('hit1');
    }
}

function levelUp() {
    curMaxTime *= 0.95;
    curTimeBonus *= 0.95;
    level_label.text = 'Level ' + curLevel;
    charm.fadeIn(level_label, 9);
    charm.scale(level_label, 1, 1, 9);
    setTimeout(function() {
        charm.fadeOut(level_label, 9);
        charm.scale(level_label, .8, .8, 9);
    }, 2000);
}

function updateProgress() {
    let time_left = deadline - now();
    let procent = time_left / curMaxTime;
    if (procent < 0) {
        procent = 0;
    }
    if (procent > 1) {
        procent = 1;
    }
    timelineColor(procent < 0.25);
    timeline.x      = -89 * (1 - procent);
    timeline_warn.x = -89 * (1 - procent);
}

function updateTable() {
    if (!results_shown || !loaded) return;
    let table_html = '';
    let table = getHighscores();
    for (let i = 0; i < table.length; i++) {
        let row = table[i];
        table_html += '<li class="row' + (row.current ? ' you' : '') + '">'
            +    '<span class="place">' + (i+1) + '.</span>'
            +    '<span class="score">' + row.score + '</span>'
            +    '<div class="name">' + row.name + '</div>'
            +  '</li>';
    }
    eTable.innerHTML = table_html;
    if (table.length > 0) {
        addClass(eTableWrap, 'opened');
    } else {
        removeClass(eTableWrap, 'opened');
    }
}

function updateContent() {
    toggleClass(ePageWrap, 'in_greet', !greeted);
    toggleClass(ePageWrap, 'in_game',  !results_shown);
    toggleClass(ePageWrap, 'in_result', results_shown);

    if (loaded) {
        move_branches.visible = !results_shown;
        branches.visible = !results_shown;
        trunk.visible = !results_shown;
        stumb.visible = !!results_shown;
        timeline_wrap.visible = !results_shown;
        scores_label.visible = !results_shown;
        level_label.visible = !results_shown;
    }
}

function startGame() {
    greeted = true;
    in_game = true;
    results_shown = false;
    initTree();
    deadline = now() + START_TIME;
    curMaxTime = START_TIME * 2;
    curTimeBonus = 250;
    curScore = 0;
    curLevel = 1;
    started = false;
    updateScore();
    updateProgress();
    updateLumber(isLumberLeft);
    updateContent();
}

function stopGame() {
    in_game = false;
    updateLumber(isLumberLeft);
    playSound('hit3');
    setTimeout(showResults, 400);
}

function showResults() {
    if (!results_shown) {
        results_shown = true;
        g_renderer.render(g_stage);
        const addr = window.webxdc.selfAddr;
        if (curScore > getHighscore(addr)) {
            const name = window.webxdc.selfName;
            const info = name + " scored " + curScore + " in LumberJack";
            window.webxdc.sendUpdate(
                {
                    payload: {
                        addr: addr,
                        name: name,
                        score: curScore,
                    },
                    info: info,
                },
                info
            );
        }
        updateContent();
    }
}

function moveTo(left) {
    if (!in_game) {
        return;
    }
    if (!started) {
        started = true;
        deadline = now() + START_TIME;
    }
    let cur_branch = curTree[0];
    let branch_left = (cur_branch < 0);
    if (!cur_branch || left !== branch_left) {
        deadline += curTimeBonus;
        let time_left = deadline - now();
        if (time_left > curMaxTime) {
            deadline = now() + curMaxTime;
        }
        curScore++;
        if (!(curScore % 20)) {
            curLevel++;
            levelUp();
        }
        updateScore();
        updateTree(left);
    } else {
        if (Math.abs(cur_branch) == 1) {
            updateTree(left, true);
        }
        stopGame();
    }
    updateLumber(left, true, Math.abs(cur_branch) == 2);
}

addEvent(eButtonLeft, 'click', function() {
    if (!greeted || results_shown) {
        startGame();
    } else {
        moveTo(true);
    }
});
addEvent(eButtonRight, 'click', function() {
    if (in_game) {
        moveTo(false);
    }
});

function pressBtn(btn) {
    addClass(btn, 'hover');
    setTimeout(function() {
        removeClass(btn, 'hover');
    }, 100);
}

function getHighscores() {
    return Object.keys(PLAYERS).map((addr) => {
        return {...PLAYERS[addr], current: addr === window.webxdc.selfAddr};
    }).sort((a, b) => b.score - a.score);
}

function getHighscore(addr) {
    return PLAYERS[addr] ? PLAYERS[addr].score : 0;
}


addEvent(document, 'keydown', function(e) {
    e.preventDefault();
    let key = e.which || e.keyCode;
    if (in_game) {
        if (key == 37) {
            pressBtn(eButtonLeft);
            moveTo(true);
        }
        if (key == 39) {
            pressBtn(eButtonRight);
            moveTo(false);
        }
    }
    else if (!greeted || results_shown) {
        if (key == 32) {
            pressBtn(eButtonLeft);
            startGame();
        }
    }
});

let thover = {
    obj: null,
    start: function(e) {
        if (e.touches && e.touches.length == 1) {
            thover.end(e);
            thover.obj = this || null;
            if (thover.obj) {
                addClass(thover.obj, 'hover');
            }
        }
    },
    cancel: function(e) {
        if (thover.obj) {
            thover.end(e);
        }
    },
    end: function() {
        if (thover.obj) {
            removeClass(thover.obj, 'hover');
            thover.obj = null;
            thover.highlight = false;
        }
    },
    check: function(e) {
        if (!e) return false;
        do {
            if (hasClass(e, 'button')) {
                return e;
            }
        }
        while (e = e.parentNode);
        return false;
    }
};


updateScore();
updateContent();
updateTable();

addEvent(document, 'touchmove touchcancel', thover.cancel);
addEvent(document, 'touchend', thover.end);
addEvent(document, 'touchstart', function(e) {
    let t = thover.check(e.target);
    t && thover.start.call(t, e);
});

addEvent(window, 'resize orientationchange', function() {
    initCanvas();
    initSprites();
});

if (!('ontouchstart' in document)) {
    addClass(document.body, '_hover');
}


window.webxdc.setUpdateListener((update) => {
    const player = update.payload;
    if (player.score > getHighscore(player.addr)) {
        PLAYERS[player.addr] = { name: player.name, score: player.score };
    }
    if (update.serial === update.max_serial && !in_game) {
        updateTable();
    }
}, 0);

