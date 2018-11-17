import Phaser from 'phaser'
import * as OvercookedMDP from "./mdp.es6"

let Direction = OvercookedMDP.Direction;

export class OvercookedGame {
    constructor ({
        start_grid,

        container_id,

        tileSize = 128,
        gameWidth = tileSize*start_grid[0].length,
        gameHeight = tileSize*start_grid.length,

        ANIMATION_DURATION = 500
    }){
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.container_id = container_id;
        this.mdp = OvercookedMDP.OvercookedGridworld.from_grid(start_grid);
        this.state = this.mdp.get_start_state();

        let gameparent = this;
        this.scene = new Phaser.Class({
            Extends: Phaser.Scene,
            initialize: function() {
                Phaser.Scene.call(this, {key: "PlayGame"})
            },
            preload: function () {
                this.load.atlas("tiles",
                    "assets/terrain.png",
                    "assets/terrain.json");
                this.load.atlas("chefs",
                    "assets/chefs.png",
                    "assets/chefs.json");
                this.load.atlas("objects",
                    "assets/objects.png",
                    "assets/objects.json");
            },
            create: function () {
                this.gameparent = gameparent;
                this.mdp = gameparent.mdp;
                this.sprites = {};
                this.drawLevel();
                this.drawState(gameparent.state, this.sprites);
                this.cursors = this.input.keyboard.createCursorKeys();
                // this.player.can_take_input = true;
                // this.animating_transition = false;
            },
            drawLevel: function() {
                //draw tiles
                let terrain_to_img = {
                    ' ': 'floor.png',
                    'X': 'table.png',
                    'P': 'pot.png',
                    'O': 'onions.png',
                    'T': 'tomatoes.png',
                    'D': 'dishes.png',
                    'S': 'serve.png'
                };
                let pos_dict = this.mdp._get_terrain_type_pos_dict();
                for (let ttype in pos_dict) {
                    if (!pos_dict.hasOwnProperty(ttype)) {continue}
                    for (let i = 0; i < pos_dict[ttype].length; i++) {
                        let [x, y] = pos_dict[ttype][i];
                        let tile = this.add.sprite(
                            tileSize * x,
                            tileSize * y,
                            "tiles",
                            terrain_to_img[ttype]
                        );
                        tile.setDisplaySize(tileSize, tileSize);
                        tile.setOrigin(0);
                    }
                }

            },
            drawState: function (state, sprites) {
                sprites = typeof(sprites) === 'undefined' ? {} : sprites;

                //draw chefs
                sprites['chefs'] =
                    typeof(sprites['chefs']) === 'undefined' ? {} : sprites['chefs'];
                for (let pi = 0; pi < state.players.length; pi++) {
                    let chef = state.players[pi];
                    let [x, y] = chef.position;
                    let dir = Direction.DIRECTION_TO_NAME[chef.orientation];
                    let held_obj = chef.held_object;
                    if (typeof(held_obj) !== 'undefined') {
                        if (held_obj.name === 'soup') {
                            held_obj = "-soup-"+held_obj.state[0];
                        }
                        else {
                            held_obj = "-"+held_obj.name;
                        }
                    }
                    else {
                        held_obj = "";
                    }
                    if (typeof(sprites['chefs'][pi]) === 'undefined') {
                        let chefsprite = this.add.sprite(
                            tileSize*x,
                            tileSize*y,
                            "chefs",
                            `${dir}${held_obj}.png`
                        );
                        chefsprite.setDisplaySize(tileSize, tileSize);
                        chefsprite.depth = 1;
                        chefsprite.setOrigin(0);
                        sprites['chefs'][pi] = chefsprite;
                    }
                    else {
                        let chefsprite = sprites['chefs'][pi];
                        chefsprite.setFrame(`${dir}${held_obj}.png`);
                        this.tweens.add({
                            targets: chefsprite,
                            x: tileSize*x,
                            y: tileSize*y,
                            duration: ANIMATION_DURATION,
                            ease: 'Linear',
                            onComplete: (tween, target, player) => {
                                target[0].setPosition(tileSize*x, tileSize*y);
                                //this.animating = false;
                            }
                        })
                    }
                }

                //draw environment objects
                if (typeof(sprites['objects']) !== 'undefined') {
                    for (let objpos in sprites.objects) {
                        let {objsprite, timesprite} = sprites.objects[objpos];
                        objsprite.destroy();
                        timesprite.destroy();
                    }
                }
                sprites['objects'] = {};

                for (let objpos in state.objects) {
                    if (!state.objects.hasOwnProperty(objpos)) { continue }
                    let obj = state.objects[objpos];
                    let [x, y] = obj.position;
                    let spriteframe, souptype, n_ingredients;
                    let cooktime = "";
                    if (obj.name === 'soup') {
                        [souptype, n_ingredients, cooktime] = obj.state;

                        if (cooktime <= this.mdp.COOK_TIME) {
                            spriteframe =
                                `soup-${souptype}-${n_ingredients}-cooking.png`;
                        }
                        else {
                            spriteframe = `soup-${souptype}-cooked.png`;
                        }
                        let objsprite = this.add.sprite(
                            tileSize*x,
                            tileSize*y,
                            "objects",
                            spriteframe
                        );
                        objsprite.setDisplaySize(tileSize, tileSize);
                        objsprite.depth = 1;
                        objsprite.setOrigin(0);
                        let timesprite =  this.add.text(
                            tileSize*(x+.5),
                            tileSize*(y+.6),
                            String(cooktime),
                            {
                                font: "25px Arial",
                                fill: "red",
                                align: "center",
                            }
                        );
                        timesprite.depth = 2;

                        sprites['objects'][objpos] = {
                            objsprite, timesprite
                        }
                    }
                }
            },
            update: function() {
                let state;
                let redraw = false;
                if (typeof(this.gameparent.state_to_draw) !== 'undefined') {
                    state = this.gameparent.state_to_draw;
                    delete this.gameparent.state_to_draw;
                    redraw = true;
                }
                if (!redraw) {
                    return
                }

                this.drawState(state, this.sprites);


            }
        });
    }

    init () {
        let gameConfig = {
            type: Phaser.WEBGL,
            width: this.gameWidth,
            height: this.gameHeight,
            scene: [this.scene],
            parent: this.container_id,
            pixelArt: true
        };
        this.game = new Phaser.Game(gameConfig);
    }

    drawState(state) {
        this.state_to_draw = state;
    }

    close () {
        this.game.destroy();
    }

}