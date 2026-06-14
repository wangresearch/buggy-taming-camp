const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const keys = new Set();

const state = {
  planet: "main",
  questStep: 0,
  p1Step: 0,
  p2Step: 0,
  fruit: 0,
  food: 0,
  duggies: 0,
  wood: 0,
  grassStarter: 0,
  waterCrystal: 0,
  portalKey: 0,
  safeWildReady: false,
  caveFound: false,
  predatorCalmed: false,
  showInventory: false,
  showQuest: false,
  dialogue: [],
  dialogueIndex: 0,
  menu: null,
  ended: false,
  nearby: null,
};

const player = { x: 480, y: 330, r: 15, speed: 3 };

const alys = [
  { id: "beigeAly", name: "Beige Aly", planet: "main", x: 300, y: 330, r: 18, color: "#d6b783", tamed: true, hearts: 2 },
  { id: "blueAly", name: "Light Blue Aly", planet: "main", x: 745, y: 440, r: 18, color: "#8eddf0", tamed: false, hearts: 0 },
  { id: "tealAly", name: "Teal Aly", planet: "main", x: 835, y: 210, r: 18, color: "#2eb8a6", tamed: false, hearts: 0 },
  { id: "rareBlueAly", name: "Rare Light Blue Aly", planet: "waterfall", x: 735, y: 390, r: 20, color: "#b9f4ff", tamed: false, hearts: 0 },
];

const spots = [
  { id: "lily", name: "Lily", planet: "both", x: 480, y: 255, r: 22, color: "#9e71d6", type: "npc" },
  { id: "tent", name: "Camp Tent", planet: "main", x: 175, y: 135, w: 120, h: 90, color: "#e87359", type: "tent" },
  { id: "tree", name: "Fruit Tree", planet: "main", x: 750, y: 135, r: 46, color: "#31794a", type: "tree" },
  { id: "deposit", name: "Town Deposit", planet: "main", x: 190, y: 510, w: 120, h: 70, color: "#c99a53", type: "deposit" },
  { id: "pond", name: "Pond", planet: "main", x: 740, y: 330, r: 70, color: "#55a7d9", type: "pond" },
  { id: "burrow", name: "Burrow", planet: "main", x: 280, y: 390, r: 44, color: "#73522f", type: "scenery" },
  { id: "forest", name: "Forest Patch", planet: "main", x: 840, y: 205, r: 62, color: "#226f4a", type: "forest" },
  { id: "shop", name: "Buggy Center Shop", planet: "main", x: 470, y: 115, w: 150, h: 78, color: "#6d86d6", type: "shop" },
  { id: "safeWild", name: "Safe Wild Area", planet: "main", x: 500, y: 525, w: 165, h: 88, color: "#b7db78", type: "safeWild" },
  { id: "portal", name: "Waterfall Portal", planet: "main", x: 80, y: 330, r: 42, color: "#83d8ff", type: "portal" },
  { id: "waterfall", name: "Giant Waterfall", planet: "waterfall", x: 480, y: 145, w: 190, h: 180, color: "#63c9ee", type: "waterfall" },
  { id: "hiddenCave", name: "Hidden Cave", planet: "waterfall", x: 480, y: 275, w: 130, h: 70, color: "#3e5662", type: "cave" },
  { id: "predator", name: "Storm Bird", planet: "waterfall", x: 210, y: 440, r: 30, color: "#434a78", type: "predator" },
  { id: "returnPortal", name: "Main Island Portal", planet: "waterfall", x: 82, y: 130, r: 34, color: "#97e6ff", type: "returnPortal" },
];

const p0QuestText = [
  "Talk to Lily.",
  "Collect a fruit from the tree.",
  "Visit the camp tent for Aly food.",
  "Deposit the fruit at the town spot.",
  "Talk to Lily for the taming lesson.",
  "Tame Light Blue Aly.",
  "Feed or care for an Aly.",
  "Talk to Lily.",
  "Complete.",
];

const p1QuestText = [
  "Talk to Lily.",
  "Collect wood from the forest patch.",
  "Buy grass starter at the Buggy Center Shop.",
  "Tame Teal Aly.",
  "Plant grass starter in the Safe Wild Area.",
  "Feed or care for an Aly.",
  "Talk to Lily.",
  "Complete.",
];

const p2QuestText = [
  "Talk to Lily.",
  "Collect a water crystal from the pond.",
  "Talk to Lily to make a portal key.",
  "Use the Waterfall Portal.",
  "Find the hidden cave behind the waterfall.",
  "Tame Rare Light Blue Aly.",
  "Face the first predator danger.",
  "Talk to Lily.",
  "Complete.",
];

function startDialogue(lines) {
  state.dialogue = lines;
  state.dialogueIndex = 0;
  state.menu = null;
}

function currentDialogue() {
  return state.dialogue[state.dialogueIndex];
}

function advanceDialogue() {
  if (!state.dialogue.length) return false;
  state.dialogueIndex += 1;
  if (state.dialogueIndex >= state.dialogue.length) {
    state.dialogue = [];
    state.dialogueIndex = 0;
  }
  return true;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function visibleSpot(spot) {
  return spot.planet === "both" || spot.planet === state.planet;
}

function visibleAly(aly) {
  return aly.planet === state.planet;
}

function getNearby() {
  const targets = [...spots.filter(visibleSpot), ...alys.filter(visibleAly)];
  let best = null;
  let bestDistance = 9999;

  for (const target of targets) {
    const d = distance(player, target);
    const range = target.w ? 84 : 68;
    if (d < range && d < bestDistance) {
      best = target;
      bestDistance = d;
    }
  }

  return best;
}

function setStep(step) {
  state.questStep = Math.max(state.questStep, step);
}

function setP1Step(step) {
  state.p1Step = Math.max(state.p1Step, step);
}

function setP2Step(step) {
  state.p2Step = Math.max(state.p2Step, step);
}

function activeQuestName() {
  if (state.p2Step > 0) return "Waterfall Key";
  if (state.p1Step > 0) return "Wild Area Welcome";
  return "Getting Started";
}

function activeQuestText() {
  if (state.p2Step > 0) return p2QuestText[state.p2Step];
  if (state.p1Step > 0) return p1QuestText[state.p1Step];
  return p0QuestText[state.questStep];
}

function interact() {
  if (state.ended) return;
  if (advanceDialogue()) return;
  if (state.menu) {
    state.menu = null;
    return;
  }

  const nearby = getNearby();
  if (!nearby) {
    startDialogue(["There is nothing close enough to use."]);
    return;
  }

  if (nearby.id === "lily") talkToLily();
  else if (nearby.id === "tree") useFruitTree();
  else if (nearby.id === "tent") useTent();
  else if (nearby.id === "deposit") useDeposit();
  else if (nearby.id === "pond") usePond();
  else if (nearby.id === "forest") useForest();
  else if (nearby.id === "shop") useShop();
  else if (nearby.id === "safeWild") useSafeWild();
  else if (nearby.id === "portal") usePortal();
  else if (nearby.id === "returnPortal") returnToMain();
  else if (nearby.id === "waterfall" || nearby.id === "hiddenCave") useWaterfall();
  else if (nearby.id === "predator") usePredator();
  else if (nearby.id.endsWith("Aly")) openAlyMenu(nearby);
}

function useFruitTree() {
  if (state.questStep < 1) {
    startDialogue(["Lily probably knows what to do first."]);
    return;
  }
  if (state.fruit === 0) {
    state.fruit = 1;
    if (state.p1Step === 0 && state.p2Step === 0) setStep(2);
    startDialogue(["You picked one shiny starter fruit."]);
  } else {
    startDialogue(["You already have a fruit."]);
  }
}

function useTent() {
  if (state.questStep < 2) {
    startDialogue(["Collect a fruit first, then come back for Aly food."]);
    return;
  }
  state.food += 1;
  if (state.p1Step === 0 && state.p2Step === 0) setStep(3);
  startDialogue(["The tent helper gives you one bowl of Aly food."]);
}

function useDeposit() {
  if (state.questStep < 3) {
    startDialogue(["This spot is for town supplies. Bring fruit after visiting the tent."]);
    return;
  }
  if (state.fruit > 0) {
    state.fruit = 0;
    state.duggies += 2;
    if (state.p1Step === 0 && state.p2Step === 0) setStep(4);
    startDialogue(["You deposited the fruit for Buggy Town and earned 2 Duggies."]);
  } else {
    startDialogue(["You need a fruit to deposit here."]);
  }
}

function usePond() {
  if (state.p2Step === 1 && state.waterCrystal === 0) {
    state.waterCrystal = 1;
    setP2Step(2);
    startDialogue(["You found a bright water crystal near the pond."]);
  } else {
    startDialogue(["The pond sparkles quietly."]);
  }
}

function useForest() {
  if (state.p1Step < 1) {
    startDialogue(["The forest patch rustles softly. It looks useful for later."]);
    return;
  }
  if (state.wood === 0) {
    state.wood = 1;
    setP1Step(2);
    startDialogue(["You collected one bundle of soft wood from the forest patch."]);
  } else {
    startDialogue(["You already have wood for the Safe Wild Area."]);
  }
}

function useShop() {
  if (state.p1Step < 2) {
    startDialogue(["The shop has supplies, but Lily wants wood first."]);
    return;
  }
  if (state.grassStarter > 0) {
    startDialogue(["You already bought grass starter."]);
    return;
  }
  if (state.duggies < 2) {
    startDialogue(["Grass starter costs 2 Duggies. Deposit fruit to earn more."]);
    return;
  }
  state.duggies -= 2;
  state.grassStarter = 1;
  state.food += 1;
  setP1Step(3);
  startDialogue(["You bought grass starter. The shop also gives you one extra Aly food."]);
}

function useSafeWild() {
  if (state.p1Step < 4) {
    startDialogue(["This safe wild area is not ready yet."]);
    return;
  }
  if (!state.safeWildReady && state.grassStarter > 0) {
    state.grassStarter = 0;
    state.safeWildReady = true;
    setP1Step(5);
    startDialogue(["You planted the grass starter. The Safe Wild Area feels softer and safer."]);
  } else {
    startDialogue(["The Safe Wild Area is ready for happy Alys."]);
  }
}

function usePortal() {
  if (state.p2Step < 3 || state.portalKey === 0) {
    startDialogue(["The portal is quiet. Lily can help make the key later."]);
    return;
  }
  state.planet = "waterfall";
  player.x = 120;
  player.y = 160;
  setP2Step(4);
  startDialogue(["The portal opens. You arrive on Waterfall Planet."]);
}

function returnToMain() {
  state.planet = "main";
  player.x = 120;
  player.y = 330;
  startDialogue(["You return to Main Island."]);
}

function useWaterfall() {
  if (state.p2Step < 4) {
    startDialogue(["The waterfall roars. Something may be hidden behind it."]);
    return;
  }
  state.caveFound = true;
  setP2Step(5);
  startDialogue(["You found a hidden cave behind the waterfall. A rare Aly glow shines inside."]);
}

function usePredator() {
  if (state.p2Step < 6) {
    startDialogue(["The Storm Bird watches from the mist."]);
    return;
  }
  state.predatorCalmed = true;
  setP2Step(7);
  startDialogue([
    "The Storm Bird dives through the harsh waterfall wind.",
    "Lily: Stay calm. One day the Peace Flute can make predators friendly.",
    "For now, you step back safely and the Storm Bird flies away.",
  ]);
}

function talkToLily() {
  if (state.questStep === 0) {
    setStep(1);
    startDialogue([
      "Lily: Welcome to the Buggyverse!",
      "Lily: I'm Lily. I help take care of the Alys here.",
      "Lily: This is your first Aly. It's a Beige Aly, and it likes burrows and soft dirt.",
      "Lily: Let's get you started. First, collect a fruit from the tree.",
    ]);
    return;
  }

  if (state.questStep === 4 && state.p1Step === 0) {
    setStep(5);
    startDialogue([
      "Lily: You did great.",
      "Lily: Now let's help you meet another Aly.",
      "Lily: That Light Blue Aly likes water.",
      "Lily: Stand near it and gently squeeze its cheeks.",
      "Lily: If it smiles, that means it trusts you.",
    ]);
    return;
  }

  if (state.questStep === 7 && state.p1Step === 0) {
    setStep(8);
    setP1Step(1);
    startDialogue([
      "Lily: Thank you for helping today.",
      "Lily: The Buggyverse is ready for more help.",
      "Lily: Next, let's make the Safe Wild Area better.",
      "Lily: This new quest is called Wild Area Welcome.",
      "Lily: Start by collecting wood from the forest patch.",
    ]);
    return;
  }

  if (state.p1Step === 6 && state.p2Step === 0) {
    setP1Step(7);
    setP2Step(1);
    startDialogue([
      "Lily: The Safe Wild Area looks wonderful.",
      "Lily: Now we can try something bigger.",
      "Lily: Waterfall Planet is ready to unlock.",
      "Lily: This quest is called Waterfall Key.",
      "Lily: Collect a water crystal from the pond so I can make a portal key.",
    ]);
    return;
  }

  if (state.p2Step === 2) {
    state.waterCrystal = 0;
    state.portalKey = 1;
    setP2Step(3);
    startDialogue([
      "Lily: This water crystal is perfect.",
      "Lily: I made it into a Waterfall Portal Key.",
      "Lily: Use the portal on the left side of Main Island.",
    ]);
    return;
  }

  if (state.p2Step === 7) {
    setP2Step(8);
    state.ended = true;
    startDialogue([
      "Lily: You unlocked Waterfall Planet and found a rare Aly.",
      "Lily: You also saw why the Peace Flute matters.",
      "Lily: Great work. P2 is complete for now!",
    ]);
    return;
  }

  if (state.p2Step > 0) startDialogue([`Lily: ${p2QuestText[state.p2Step]}`]);
  else if (state.p1Step > 0) startDialogue([`Lily: ${p1QuestText[state.p1Step]}`]);
  else startDialogue([`Lily: ${p0QuestText[state.questStep]}`]);
}

function openAlyMenu(aly) {
  state.menu = { aly, options: ["Squeeze cheeks", "Feed", "Check happiness"] };
}

function chooseMenu(index) {
  if (!state.menu) return;
  const aly = state.menu.aly;
  const choice = state.menu.options[index];
  state.menu = null;

  if (choice === "Squeeze cheeks") squeezeAly(aly);
  else if (choice === "Feed") feedAly(aly);
  else if (choice === "Check happiness") {
    const hearts = aly.hearts ? "H ".repeat(aly.hearts).trim() : "0 hearts";
    startDialogue([`${aly.name} happiness: ${hearts}`]);
  }
}

function squeezeAly(aly) {
  if (aly.id === "blueAly" && !aly.tamed && state.questStep >= 5) {
    aly.tamed = true;
    aly.hearts = 2;
    setStep(6);
    startDialogue(["Light Blue Aly smiles. It trusts you now!"]);
    return;
  }
  if (aly.id === "tealAly" && !aly.tamed && state.p1Step >= 3) {
    aly.tamed = true;
    aly.hearts = 2;
    setP1Step(4);
    startDialogue(["Teal Aly makes a tiny raincloud and smiles. It trusts you now!"]);
    return;
  }
  if (aly.id === "rareBlueAly" && !aly.tamed && state.p2Step >= 5) {
    aly.tamed = true;
    aly.hearts = 2;
    setP2Step(6);
    startDialogue(["Rare Light Blue Aly glows like waterfall mist. It trusts you now!"]);
    return;
  }
  if (aly.tamed) {
    aly.hearts = Math.min(3, aly.hearts + 1);
    startDialogue([`${aly.name} looks extra happy.`]);
  } else {
    startDialogue([`${aly.name} is curious, but Lily should explain taming first.`]);
  }
}

function feedAly(aly) {
  if (!aly.tamed) {
    startDialogue([`${aly.name} needs to trust you before it can be fed.`]);
    return;
  }
  if (state.food <= 0) {
    startDialogue(["You do not have Aly food right now."]);
    return;
  }
  state.food -= 1;
  aly.hearts = Math.min(3, aly.hearts + 1);
  if (state.questStep >= 6 && state.p1Step === 0 && state.p2Step === 0) setStep(7);
  if (state.p1Step >= 5 && state.p2Step === 0) setP1Step(6);
  startDialogue([`${aly.name} eats happily.`]);
}

function toggleInventory() {
  state.showInventory = !state.showInventory;
  state.showQuest = false;
}

function toggleQuest() {
  state.showQuest = !state.showQuest;
  state.showInventory = false;
}

function update() {
  if (!state.dialogue.length && !state.menu && !state.ended) {
    let dx = 0;
    let dy = 0;
    if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
    if (keys.has("arrowright") || keys.has("d")) dx += 1;
    if (keys.has("arrowup") || keys.has("w")) dy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) dy += 1;

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      player.x += (dx / len) * player.speed;
      player.y += (dy / len) * player.speed;
      player.x = Math.max(24, Math.min(W - 24, player.x));
      player.y = Math.max(80, Math.min(H - 24, player.y));
    }
  }
  state.nearby = getNearby();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (state.planet === "waterfall") drawWaterfallGround();
  else drawMainGround();
  drawMapObjects();
  alys.filter(visibleAly).forEach(drawAly);
  drawLily();
  drawPlayer();
  drawHud();
  drawPrompt();
  drawPanels();
  drawMenu();
  drawDialogue();
  if (state.ended && !state.dialogue.length) drawEnding();
}

function drawMainGround() {
  ctx.fillStyle = "#8bc577";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#78b866";
  for (let x = 0; x < W; x += 48) {
    for (let y = 80; y < H; y += 48) {
      if ((x + y) % 96 === 0) ctx.fillRect(x, y, 24, 4);
    }
  }
  ctx.fillStyle = "#d5bb79";
  roundedRect(415, 220, 135, 90, 18);
}

function drawWaterfallGround() {
  ctx.fillStyle = "#80c9d8";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#74b16e";
  roundedRect(40, 80, 880, 520, 22);
  ctx.fillStyle = "#9fdcec";
  roundedRect(380, 70, 200, 450, 16);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let y = 100; y < 520; y += 36) ctx.fillRect(420, y, 120, 8);
}

function drawMapObjects() {
  for (const spot of spots.filter(visibleSpot)) {
    if (spot.id === "lily") continue;
    if (spot.id === "pond") drawPond();
    else if (spot.id === "burrow") drawBurrow();
    else if (spot.id === "tent") drawTent();
    else if (spot.id === "tree") drawTree();
    else if (spot.id === "deposit") drawDeposit();
    else if (spot.id === "forest") drawForest();
    else if (spot.id === "shop") drawShop();
    else if (spot.id === "safeWild") drawSafeWild();
    else if (spot.id === "portal") drawPortal(spot, "Waterfall Portal");
    else if (spot.id === "returnPortal") drawPortal(spot, "Main Island Portal");
    else if (spot.id === "waterfall") drawWaterfall();
    else if (spot.id === "hiddenCave") drawCave();
    else if (spot.id === "predator") drawPredator();
  }
}

function drawForest() {
  const forest = spots.find((s) => s.id === "forest");
  ctx.fillStyle = forest.color;
  circle(forest.x, forest.y, forest.r);
  ctx.fillStyle = "#2f8a5c";
  circle(forest.x - 40, forest.y + 24, 34);
  circle(forest.x + 42, forest.y + 18, 30);
  ctx.fillStyle = "#7b4d2a";
  roundedRect(forest.x - 6, forest.y + 35, 12, 52, 5);
  label("Forest Patch", forest.x, forest.y + 94);
}

function drawShop() {
  const shop = spots.find((s) => s.id === "shop");
  ctx.fillStyle = shop.color;
  roundedRect(shop.x - 75, shop.y - 39, 150, 78, 8);
  ctx.fillStyle = "#f5e6ac";
  roundedRect(shop.x - 42, shop.y - 8, 84, 36, 5);
  ctx.fillStyle = "#27314f";
  text("SHOP", shop.x, shop.y + 14, 16);
  label("Buggy Center Shop", shop.x, shop.y + 60);
}

function drawSafeWild() {
  const area = spots.find((s) => s.id === "safeWild");
  ctx.fillStyle = state.safeWildReady ? "#d8ef91" : area.color;
  roundedRect(area.x - 82, area.y - 44, 165, 88, 14);
  ctx.strokeStyle = "#7a9b46";
  ctx.lineWidth = 4;
  ctx.strokeRect(area.x - 76, area.y - 38, 153, 76);
  ctx.fillStyle = state.safeWildReady ? "#66a853" : "#8fb45e";
  circle(area.x - 35, area.y + 5, 8);
  circle(area.x + 15, area.y - 12, 8);
  circle(area.x + 48, area.y + 18, 8);
  label("Safe Wild Area", area.x, area.y + 68);
}

function drawPond() {
  const pond = spots.find((s) => s.id === "pond");
  ctx.fillStyle = pond.color;
  ellipse(pond.x, pond.y, 95, 58);
  ctx.strokeStyle = "#d9f7ff";
  ctx.lineWidth = 4;
  ellipseStroke(pond.x, pond.y, 95, 58);
  label(state.p2Step === 1 ? "Water Crystal" : "Water", pond.x, pond.y + 6);
}

function drawBurrow() {
  const burrow = spots.find((s) => s.id === "burrow");
  ctx.fillStyle = "#987044";
  ellipse(burrow.x, burrow.y, 75, 45);
  ctx.fillStyle = burrow.color;
  ellipse(burrow.x, burrow.y + 10, 42, 22);
  label("Burrow", burrow.x, burrow.y + 62);
}

function drawTent() {
  const tent = spots.find((s) => s.id === "tent");
  ctx.fillStyle = tent.color;
  triangle(tent.x - 70, tent.y + 45, tent.x, tent.y - 55, tent.x + 70, tent.y + 45);
  ctx.fillStyle = "#ffd7a8";
  triangle(tent.x - 18, tent.y + 45, tent.x, tent.y + 5, tent.x + 18, tent.y + 45);
  label("Camp Tent", tent.x, tent.y + 70);
}

function drawTree() {
  const tree = spots.find((s) => s.id === "tree");
  ctx.fillStyle = "#7b4d2a";
  roundedRect(tree.x - 11, tree.y + 10, 22, 58, 8);
  ctx.fillStyle = tree.color;
  circle(tree.x, tree.y, tree.r);
  ctx.fillStyle = state.fruit === 0 ? "#ef5f55" : "#7bbd5a";
  circle(tree.x - 18, tree.y - 8, 7);
  circle(tree.x + 20, tree.y + 7, 7);
  label("Fruit Tree", tree.x, tree.y + 86);
}

function drawDeposit() {
  const dep = spots.find((s) => s.id === "deposit");
  ctx.fillStyle = dep.color;
  roundedRect(dep.x - 58, dep.y - 35, 116, 70, 8);
  ctx.fillStyle = "#604025";
  ctx.fillRect(dep.x - 40, dep.y - 4, 80, 8);
  label("Town Deposit", dep.x, dep.y + 58);
}

function drawPortal(portal, labelText) {
  ctx.fillStyle = "rgba(120, 225, 255, 0.55)";
  circle(portal.x, portal.y, portal.r);
  ctx.strokeStyle = portal.color;
  ctx.lineWidth = 5;
  ellipseStroke(portal.x, portal.y, portal.r * 0.75, portal.r);
  label(labelText, portal.x, portal.y + portal.r + 22);
}

function drawWaterfall() {
  const water = spots.find((s) => s.id === "waterfall");
  ctx.fillStyle = water.color;
  roundedRect(water.x - 95, water.y - 90, water.w, water.h, 12);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(water.x - 60, water.y - 70, 26, 145);
  ctx.fillRect(water.x + 28, water.y - 78, 32, 155);
  label("Giant Waterfall", water.x, water.y + 112);
}

function drawCave() {
  const cave = spots.find((s) => s.id === "hiddenCave");
  ctx.fillStyle = state.caveFound ? "#2e3d48" : "#5d8795";
  ellipse(cave.x, cave.y, 80, 40);
  ctx.fillStyle = "#17232b";
  ellipse(cave.x, cave.y + 8, 45, 25);
  label(state.caveFound ? "Hidden Cave" : "Mist Wall", cave.x, cave.y + 60);
}

function drawPredator() {
  const bird = spots.find((s) => s.id === "predator");
  ctx.fillStyle = state.predatorCalmed ? "#767fa8" : bird.color;
  triangle(bird.x - 34, bird.y, bird.x, bird.y - 26, bird.x + 34, bird.y);
  triangle(bird.x - 32, bird.y, bird.x, bird.y + 28, bird.x + 32, bird.y);
  ctx.fillStyle = "#dce9ff";
  circle(bird.x - 8, bird.y - 4, 4);
  circle(bird.x + 8, bird.y - 4, 4);
  label(state.predatorCalmed ? "Calmed Storm Bird" : "Storm Bird", bird.x, bird.y + 56);
}

function drawLily() {
  const lily = spots[0];
  ctx.fillStyle = lily.color;
  circle(lily.x, lily.y, lily.r);
  ctx.fillStyle = "#4c8dde";
  circle(lily.x - 7, lily.y - 3, 3);
  circle(lily.x + 7, lily.y - 3, 3);
  ctx.fillStyle = "#fff5f7";
  roundedRect(lily.x - 17, lily.y + 20, 34, 28, 6);
  label("Lily", lily.x, lily.y - 32);
}

function drawPlayer() {
  ctx.fillStyle = "#315f84";
  circle(player.x, player.y, player.r);
  ctx.fillStyle = "#f2cfaa";
  circle(player.x, player.y - 6, 10);
  ctx.fillStyle = "#443a32";
  roundedRect(player.x + 10, player.y - 4, 8, 17, 3);
}

function drawAly(aly) {
  ctx.fillStyle = aly.color;
  circle(aly.x, aly.y, aly.r);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  circle(aly.x - 7, aly.y - 4, 4);
  circle(aly.x + 7, aly.y - 4, 4);
  ctx.strokeStyle = "#323232";
  ctx.lineWidth = 2;
  line(aly.x - 8, aly.y - 18, aly.x - 18, aly.y - 31);
  line(aly.x + 8, aly.y - 18, aly.x + 18, aly.y - 31);
  drawHearts(aly.x, aly.y - 44, aly.hearts);
  label(aly.name, aly.x, aly.y + 44);
  if (!aly.tamed) {
    ctx.fillStyle = "#29323a";
    text("wild", aly.x, aly.y + 63, 13);
  }
}

function drawHearts(x, y, count) {
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#df3855";
  ctx.fillText("H".repeat(count), x, y);
  ctx.textAlign = "left";
}

function drawHud() {
  ctx.fillStyle = "rgba(25, 35, 28, 0.9)";
  roundedRect(16, 14, 928, 52, 10);
  ctx.fillStyle = "#f7f1df";
  ctx.font = "18px Arial";
  ctx.fillText(`Quest: ${activeQuestName()}`, 32, 44);
  ctx.font = "15px Arial";
  ctx.fillText(`Next: ${activeQuestText()}`, 250, 44);
  ctx.fillText(`Fruit:${state.fruit} Food:${state.food} D:${state.duggies} Key:${state.portalKey}`, 710, 44);
}

function drawPrompt() {
  if (state.dialogue.length || state.menu || state.ended) return;
  if (!state.nearby) return;
  ctx.fillStyle = "rgba(20, 28, 23, 0.86)";
  roundedRect(330, 585, 300, 38, 8);
  ctx.fillStyle = "#fff8e7";
  text(`Press E or Space: ${state.nearby.name}`, 480, 610, 16);
}

function drawPanels() {
  if (state.showInventory) {
    panel("Inventory", [
      `Fruit: ${state.fruit}`,
      `Aly food: ${state.food}`,
      `Duggies: ${state.duggies}`,
      `Wood: ${state.wood}`,
      `Grass starter: ${state.grassStarter}`,
      `Water crystal: ${state.waterCrystal}`,
      `Portal key: ${state.portalKey}`,
    ]);
  }
  if (state.showQuest) {
    panel("Quest", [activeQuestName(), `Planet: ${state.planet}`, `Next: ${activeQuestText()}`]);
  }
}

function panel(title, lines) {
  ctx.fillStyle = "rgba(30, 39, 33, 0.94)";
  roundedRect(635, 82, 300, 245, 10);
  ctx.fillStyle = "#fff8e7";
  ctx.font = "20px Arial";
  ctx.fillText(title, 655, 116);
  ctx.font = "16px Arial";
  lines.forEach((lineText, index) => ctx.fillText(lineText, 655, 150 + index * 28));
}

function drawMenu() {
  if (!state.menu) return;
  ctx.fillStyle = "rgba(30, 39, 33, 0.96)";
  roundedRect(330, 430, 300, 150, 10);
  ctx.fillStyle = "#fff8e7";
  ctx.font = "18px Arial";
  ctx.fillText(state.menu.aly.name, 355, 462);
  ctx.font = "16px Arial";
  state.menu.options.forEach((option, index) => ctx.fillText(`${index + 1}. ${option}`, 355, 495 + index * 28));
}

function drawDialogue() {
  if (!state.dialogue.length) return;
  ctx.fillStyle = "rgba(30, 39, 33, 0.96)";
  roundedRect(70, 480, 820, 120, 12);
  ctx.fillStyle = "#fff8e7";
  ctx.font = "20px Arial";
  wrapText(currentDialogue(), 100, 525, 760, 28);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#d7e8d1";
  ctx.fillText("Press E, Space, or click to continue", 100, 580);
}

function drawEnding() {
  ctx.fillStyle = "rgba(22, 31, 26, 0.8)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff8e7";
  ctx.font = "34px Arial";
  text("P2 Complete", W / 2, 285, 34);
  ctx.font = "20px Arial";
  text("Waterfall Planet is unlocked.", W / 2, 325, 20);
  text("The Peace Flute mystery is waiting.", W / 2, 355, 20);
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function ellipseStroke(x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function triangle(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function label(value, x, y) {
  ctx.fillStyle = "rgba(32, 42, 34, 0.72)";
  ctx.font = "14px Arial";
  text(value, x, y, 14);
}

function text(value, x, y, size) {
  ctx.font = `${size}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(value, x, y);
  ctx.textAlign = "left";
}

function wrapText(value, x, y, maxWidth, lineHeight) {
  const words = value.split(" ");
  let lineValue = "";
  for (const word of words) {
    const testLine = `${lineValue}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && lineValue) {
      ctx.fillText(lineValue, x, y);
      lineValue = `${word} `;
      y += lineHeight;
    } else {
      lineValue = testLine;
    }
  }
  ctx.fillText(lineValue, x, y);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  if (key === "e" || key === " ") interact();
  if (key === "i") toggleInventory();
  if (key === "q") toggleQuest();
  if (state.menu && ["1", "2", "3"].includes(key)) chooseMenu(Number(key) - 1);
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
canvas.addEventListener("click", () => {
  if (state.dialogue.length) advanceDialogue();
});

document.getElementById("interactButton").addEventListener("click", interact);
document.getElementById("inventoryButton").addEventListener("click", toggleInventory);
document.getElementById("questButton").addEventListener("click", toggleQuest);

startDialogue(["Lily is waiting in the center of camp. Walk over and press E or Space."]);
gameLoop();
