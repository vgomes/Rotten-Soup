/**
 * Created by larken on 7/12/17.
 */
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function addPrefix(name) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    if (name !== "you") {
        if (name[0] in vowels)
            return "an " + name;
        else
            return "a " + name;
    } else {
        return name;
    }
}

class Actor extends Entity {
    constructor(x, y, options, routine=null) {
        super(x, y, options);
        this.cb = this.options.combat;
        this.cb.equipment = {
            head: null,
            torso: null,
            legs: null,
            weapon: null,
        };
        this.inventory = [];
        this.inventory_idx = 0;
        for (let i = 0; i < 28; i++) {
            this.inventory.push({
                item: null,
            });
        }
    }

    /* Called by the ROT.js game scheduler to indicate a turn */
    act() {
    }

    addToInventory(newItem) {
        this.inventory[this.inventory_idx].item = newItem;
        this.inventory[this.inventory_idx].action = newItem.use;
        this.inventory_idx++;
    }

    removeFromInventory(removeItem) {
        let idx = this.inventory.indexOf(removeItem);
        if (idx !== null) {
            this.inventory.splice(idx, 1);
            this.inventory_idx--;
        } else {
            throw "invalid item removal - check for bugs!";
        }
    }

    /* The inventory property of actors is an array of object 'slots'. This function
     * returns the actual items that are held at any given time */
    items() {
        return this.inventory.slice(0, this.inventory_idx).map((e) => e.item);
    }

    distanceTo(actor) { // linear distance, no obstacles factored in
        return Math.sqrt(Math.pow(this.x - actor.x, 2) + Math.pow(this.y - actor.y, 2));
    }

    /* Used to perform an action against another actor */
    interact(actor) {
        return null;
    }

    /* Used to react to the interaction of another actor */
    react(actor) {
        return null;
    }

    tryMove(nx, ny) { // returns true if the turn should end here
        if (nx < 0 || nx === Game.map.width || ny < 0 || ny === Game.map.height) return false;
        let ntile = Game.map.data[ny][nx]; // new tile to move to
        if (ntile.actors.length === 0 && !ntile.blocked()) {
            this.move(nx, ny);
            return true;
        } else if (ntile.actors.length > 0) {
            for (let i = 0; i < ntile.actors.length; i++) {
                let actor = ntile.actors[i];
                if (actor instanceof Actor && actor.options.blocked && actor.options.visible) {
                    if (!actor.isDead())
                        this.interact(actor);
                    return true;
                }
            }
        }

        if (!ntile.blocked()) {
            this.move(nx, ny);
            return true;
        }

        return false;
    }

    move(nx, ny) {
        let ntile = Game.map.data[ny][nx]; // new tile to move to
        let ctile = Game.map.data[this.y][this.x]; // current tile
        ctile.removeActor(this); // remove this actor from this tile
        ntile.actors.push(this); // add this actor to the new tile

        this.x = nx; // update x,y coords to new coords
        this.y = ny;
        // Game.drawActor(this); // draw the actor at the new spot
        // Game.drawViewPort();
        // Game.drawMiniMap();
    }

    /* attacks another actor */
    attack(actor) {
        let weapon = this.cb.equipment.weapon;
        let dmg = weapon !== null ? this.cb.str + weapon.roll() : this.cb.str;
        let len = this.cb.description.length;
        let evtdamage = `${capitalize(addPrefix(this.name()))}${this.cb.description[Math.floor(Math.random() * len)]}${addPrefix(actor.name())} and dealt ${dmg} damage.`;
        if (Game.player === this)
            Game.log(evtdamage, 'player_move');
        else
            Game.log(evtdamage, 'attack');

        if (dmg > 0)
            actor.damage(dmg);

        return dmg;
    }

    /* Reduce hp. If less than 0, causes death */
    damage(hp) {
        this.cb.hp -= hp;
        if (this.isDead()) {
            this.death();
        }

    }

    /* Restore HP up to maxhp */
    heal(hp) {
        if (this.cb.hp + hp > this.cb.maxhp)
            this.cb.hp = this.cb.maxhp;
        else
            this.cb.hp += hp;
    }

    /* Restores mana up to max */
    restore(mana) {
        if (this.cb.mana + mana > this.cb.maxmana)
            this.cb.mana = this.cb.maxmana;
        else
            this.cb.mana += mana;
    }

    death() {
        let idx = Game.engine._scheduler.remove(this);
        let ctile = Game.map.data[this.y][this.x];
        // remove this actor from the global actors list and the occupied tile
        ctile.removeActor(this);
        idx = Game.map.actors.indexOf(this);
        // dump the contents of the actor's inventory (items) onto the ground.
        if (this.inventory.length > 0) {
            let items = this.items();
            for (let item of items) {
                ctile.actors.push(item);
            }
        }
        // redraw the tile, either with an appropriate actor or the tile symbol
        Game.map.actors.splice(idx, 1);
        // Game.drawViewPort();

        if (this === Game.player) {
            Game.log(`You died!`, "death");
        } else {
            Game.log(`You killed the ${this.name()}.`, "death");
        }
    }

    isDead() {
        return this.cb.hp <= 0;
    }

    getHP() {
        return this.cb.hp;
    }

    getMaxHP() {
        return this.cb.maxhp;
    }

    getHoverInfo() {
        return `HP: ${this.getHP()} / ${this.getMaxHP()}\n\"${this.description()}\"`;
    }
}