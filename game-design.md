# Rift Slayer

Enter the rift and defeat the monsters to return with glorious trophies!

## Description

The game is inspired by Diablo 3. It has 3 classes: Paladin, Wizard and Blademaster. Each class has its own spells, skills and passive effects (talents).

The player starts on the main menu, where they can continue an existing save or start a new game. A new game begins with character creation: the player enters a name, chooses a class and sets the difficulty of the run. Clicking "Create Character" starts the game.

The player spawns in a single-screen tiled world — the town. The town holds a shop, a grand wizard who can open rifts, a shrine where the player can upgrade talents and assign skills to the skillbar slots, and a stash for storing items. The player walks up to a town location and clicks it to interact with it. Every world is a single screen with no scrolling: the whole map fits the viewport and is always fully visible.

Entering a rift replaces the town world with a rift world of one of 4 types: fire, ice, earth or darkness. The player ventures into the rift to fight waves of monsters. Each wave contains 1 elite monster, and after the last wave a boss appears. Defeating the boss drops that rift type's trophy (Fire, Ice, Earth or Darkness). The player returns to town after clearing the rift or being defeated, which closes the rift.

All monsters and the player share the same stats and operate the same way, except monsters have no movement input and 0 Run Time.

The player starts with only a small base health regeneration and must stay alive using healing abilities, potions and healing secondary effects on items.

### Difficulty
Difficulty can be set to Easy, Normal or Hard and cannot be changed once a character has been created. Easy has fewer rift waves and Hard has more rift waves. More waves mean more monsters and more elites. Difficulty does not change the drop chance or quality of items.

### Classes
Each class has a small talent tree to unlock skills or passive effects. Talents are upgraded at the town shrine using Rift Trophies, which is also where the player assigns skills to the 4 skillbar slots.

#### Paladin
The Paladin is a defensive melee fighter who uses a mace and shield, and can cast spells or infuse his mace or shield with holy power.
##### Skills
- Smite: Strike a monster with holy-infused mace, dealing bonus damage; extra damage to darkness monsters.
- Holy Bulwark: Raise your shield to greatly reduce incoming damage for a short time.
- Consecration: Bless the ground around you, dealing holy damage over time to monsters standing in it.
- Judgment: Hurl a bolt of holy light at a distant monster.
- Lay on Hands: Instantly restore a large portion of your health.
##### Talents
- Holy Infusion: Your mace deals bonus holy damage on every hit.
- Shield Mastery: Increased armor and a chance to block attacks while holding a shield.
- Divine Retribution: Reflect a portion of the damage you take back at the attacker.
- Righteous Fury: Smite has a chance to stun the target.
- Blessed Regeneration: Regenerate health over time.

#### Wizard
The Wizard is well schooled in the magics of nature, wielding fire, ice, earth and lightning to control the battlefield from a distance.
##### Skills
- Fireball: Hurl a ball of fire that deals damage in an area.
- Frost Nova: Freeze monsters around you, slowing or stopping them in place.
- Chain Lightning: A bolt of lightning that jumps between nearby monsters.
- Rock Wall: Raise a wall of earth that blocks monsters' movement.
- Regrowth: Restore health over a short time.
##### Talents
- Elemental Affinity: Spells of your chosen element deal bonus damage.
- Overflowing Mana: Increased maximum mana and faster mana regeneration.
- Scorched Earth: Fireball leaves burning ground that damages monsters.
- Deep Freeze: Frost Nova freezes monsters for longer.
- Nature's Boon: Increased healing and health regeneration received.

#### Blademaster
The Blademaster has excellent skill with blades and other sharp objects, darting around the battlefield to cut monsters down.
##### Skills
- Whirlwind: Spin with your blades, hitting all nearby monsters.
- Blade Flurry: Unleash a rapid flurry of slashes on a single target.
- Shadowstep: Teleport a short distance to a monster and strike it.
- Lacerate: A deep cut that makes the target bleed over time.
- Adrenaline: Temporarily increase your attack speed.
##### Talents
- Keen Edge: Your blades ignore a portion of monster armor.
- Bloodlust: Your attacks heal you for a portion of the damage dealt.
- Focus: Increased critical strike chance.
- Relentless: Bleeds you apply last longer and tick faster.
- Second Wind: Restore health when you defeat a monster.

### Progression
The player does not level up or earn XP. They get stronger through gear and talent upgrades only.

Talents are upgraded at the town shrine with Rift Trophies:
- Trophies are typed by rift: Fire, Ice, Earth and Darkness Trophies, each dropped by the matching rift's boss.
- The talent tree is organized in tiers. Each talent can be ranked up, and each rank costs more trophies than the last.
- Unlocking a higher tier requires trophies from more rift bosses. For example, the first tier accepts any trophy, while a later tier requires one trophy from each of the four boss types, so progress is gated by beating different rifts.

Example talent cost (tune later):
- Rank 1: 1 trophy, Rank 2: 2 trophies, Rank 3: 4 trophies.

### Combat
The player aims with the mouse, and attacks and skills go toward the cursor, including melee attacks.

Basic attack:
- Hold the left mouse button to attack repeatedly.
- Paladin and Blademaster strike in a melee arc — a sector of a circle in front of the player in the aimed direction.
- The Wizard instead shoots a wand projectile toward the cursor, since the Wizard has no melee attack.

Skills (slots 1-4):
- Ranged skills (e.g. Fireball, Judgment) fly toward where the cursor was when the skill was cast and land there.
- Close-range skills (e.g. Smite, Blade Flurry) hit an arc in front of the player in the aimed direction.
- Area skills (e.g. Frost Nova, Consecration, Whirlwind) affect an area around the player.
- Targeted skills (e.g. Chain Lightning, Shadowstep) pick a monster near the cursor.

Cooldowns and mana:
- Skills cost mana, and most have a short cooldown.
- Some skills can be held: Blade Flurry can be held down for continuous attacks, adding to the basic attacks.

### Rifts
Talking to the grand wizard allows the player to open a rift of a chosen level. At the start levels 1, 2 and 3 are unlocked; defeating a rift unlocks up to 3 levels higher, so completing level 1 unlocks up to 4 and completing level 3 unlocks up to 6.

Entering a rift puts the player in the rift world of the chosen type. A list of monsters is generated from the rift level and type, and a loot table is generated from the rift level and distributed among the monsters. When a monster carrying loot dies, the item drops on the ground in the rift world; the player moves to it and clicks to pick it up.

Monsters spawn in waves on a fixed timer. Each wave contains 1 elite monster among the regular monsters. After the last wave a boss spawns; defeating the boss closes the rift and drops that rift type's trophy.

#### Worlds
There are 5 worlds: the town and the 4 rift worlds (fire, ice, earth and darkness). Every world is a single screen with no scrolling — the whole map fits the viewport and is always visible. Entering a rift swaps the town world for the rift world of the chosen type until the player returns to town. Each rift world is built from tiles in the color style of its rift type:
- Fire: reds and oranges.
- Ice: pale blues and whites.
- Earth: browns and greens.
- Darkness: deep purples and blacks.

#### World Generation
Each rift world is an open arena with a few randomly placed props — rocks, crystals, bones and similar. Props are decorative, so they never hide monsters or block the whole-screen view.

#### Rift Type
fire, ice, earth and darkness. Each rift's monsters, elite and boss match its type; every wave has 1 elite and the boss appears after the last wave.

##### Fire
- Monsters: Emberlings and Flame Imps, fast and aggressive; their hits apply Burn, dealing damage over time.
- Elite: an Infernal, a stronger monster that leaves a trail of fire as it moves and bursts into flame on death.
- Boss: the Pyrelord, who hurls volleys of fireballs, unleashes a flame nova around itself and radiates a burning aura.

##### Ice
- Monsters: Frostlings, slower attackers whose hits apply Chill, reducing the player's movement and attack speed.
- Elite: a Glacial, who periodically releases a frost nova that slows the player and shields itself in ice for a short time.
- Boss: the Glacius Titan, who fires barrages of ice shards, freezes the player with a frost nova and radiates a chilling aura.

##### Earth
- Monsters: Stone Brutes, slow armored monsters with high health whose heavy slams hit hard.
- Elite: a Gargantuan, with extra armor and health, whose ground slam sends a shockwave across the arena.
- Boss: the Terra Colossus, who throws boulders, slams the ground for area damage and charges across the arena.

##### Darkness
- Monsters: Shades, elusive monsters that teleport near the player and strike to weaken them, temporarily reducing their stats.
- Elite: a Cursed Shade, who radiates a curse aura that lowers the player's stats.
- Boss: the Shadow Lord, who fires shadow bolts, summons Shades and curses the player, reducing their damage and defenses.

### Saving
The game auto-saves the player's state while they are in town. Entering a rift makes a save point of the current state. If the player is defeated in the rift, the last save is reloaded, returning them to that pre-rift state. Clearing a rift returns the player to town, where the game auto-saves again with the new loot and trophies. The pause menu (Esc) also offers a manual Save option.

### Items
#### Item Types
- Main-hand weapon: a min-max damage range. Melee weapons roll Attack Power, while wands and staves roll Magic Power instead.
- Off-hand (shield): Armor plus Health or Mana.
- Helmet, chest, legs, boots and gloves: Armor plus at least Health or Mana.
- Amulet and two rings: no Armor; they roll a mix of other stats and secondary effects, such as the healing effects below.
- All items add their rarity bonus stats on top of these base stats.

#### Rarity
Items come in rarities that determine how many bonus stats they roll:
- Common (white): no bonus stats.
- Uncommon (green): 1 bonus stat.
- Rare (blue): 2 bonus stats.
- Epic (purple): 3 bonus stats plus a special affix.
- Legendary (orange): a unique effect in addition to bonus stats.
Higher level rifts drop higher rarity items. The shop only sells common, uncommon and rare items, mostly common.

#### Secondary Effects
Items can roll healing and other secondary effects that help the player survive:
- Life on Hit: restore a small amount of health each time you hit a monster.
- Life per Second: regenerate health over time.
- Life Steal: heal for a percentage of the damage you deal.
- Life on Kill: restore health when you defeat a monster.

### Inventory
The player has an equipment set and a bag for carrying items.
- Equipment slots: main-hand weapon, off-hand (shield), helmet, chest, legs, boots, gloves, amulet and two rings.
- Bag: a limited number of slots; consumables such as potions stack.
- Consumables: healing potions, mana potions and run time potions restore their respective stats.
- Items can be equipped, compared, sold or dropped from the inventory.
- A stash in town stores extra items the player wants to keep.

### Shop
The shop sells and buys items; the player can sell any item in their inventory. There is no buy back option or warning for selling.
Items sold by the shop are rerolled when the town map loads; the items are near the player's level, providing base level gear. The shop only sells common, uncommon and rare items, mostly common. Besides armor and weapons the shop always has a selection of consumables: healing potions, mana potions, run time potions and possibly more.
#### Currencies
- Gold: the main currency, dropped by monsters and earned by selling items; used for shop purchases.
- Rift Trophies: one type per rift (Fire, Ice, Earth and Darkness), dropped by that rift's boss; used to upgrade talents, not spent in the shop.

### Stats
#### Primary Stats
- Strength: increases Attack Power by 5 per point.
- Intellect: increases Magic Power by 5 per point and Mana by 10 per point.
- Stamina: increases Health by 10 per point and Run Time duration by 1 second per point.
- Health: if above 0 in combat the player is still alive.
- Mana: allows spell casting.
- Armor: reduces physical damage taken by a small amount.
#### Secondary Stats
- Attack Power: Melee weapons have increased damage by (Attack Power / 10) points for min and max damage.
- Magic Power: Magic attacks deal increased damage by (Magic Power / 10) points for its total damage.
- Run Time: Allows the player to run; if it reaches 0 the player starts walking and regenerates Run Time by 0.5 seconds per second.
- Health Regeneration: restores health over time; the player always has a small base regeneration, increased by items and talents.

### Controls
- WASD: move the player.
- Mouse: aim; attacks and skills go toward the cursor.
- Left mouse button: the universal action - click or hold to use the basic attack, interact with town locations or pick up dropped items.
- 1, 2, 3, 4: activate the skills equipped in slots 1-4.
- Esc: pause the game and open the pause menu.
- Each class has 5 skills but only 4 skill slots, so the player chooses which 4 to equip at the town shrine. This keeps the button count fixed at 4 even if more skills are added later.

All keybinds can be reassigned in the Options menu.

Still to be decided:
- Default key to open and close the inventory - e.g. I or B.

### UI
The game needs the following screens and HUD.

Screens:
- Main menu: continue an existing save or start a new game, plus the Options menu.
- Options (from the main menu): sound volume, keybindings and similar settings.
- Keybindings (in Options): reassign all keys - movement, skills, inventory, pause and others.
- Character creation: name input, class selection, difficulty selection and a "Create Character" button.
- Shrine: spend Rift Trophies to upgrade talents and assign skills to the 4 skillbar slots.
- Inventory: equipment slots, the bag grid, and equip, compare, drop and sell actions.
- Shop: buy and sell lists with the player's gold.
- Stash: store and retrieve items in town.
- Rift selection: choose the rift level and type when talking to the grand wizard.
- Pause menu (Esc): Continue, Save and Back to Main Menu.

In-game HUD:
- Player Health, Mana and Run Time bars.
- The skill bar with 4 slots (bound to 1-4), showing cooldowns.
- Gold and Rift Trophy counts (per type).
