/**
 * Created by Larken on 7/8/2017.
 */
class Door extends Entity {
    constructor(x, y, id) {
        super(x, y, {
            id : id,
            visible: false,
            blocked: true,
        });
        this.closed = true;
    }

    react() {
        if (this.closed) {
            this.openDoor();
        }
    }

    openDoor() {
        this.closed = false;
        this.options.blocked = false;
        this.options.visible = true;
        this.id = tileset.tileproperties[this.id].activated_id;
    }

    closeDoor() {
        this.closed = false;
        this.options.blocked = false;
        this.options.visible = true;
        this.options.id = this.id;
    }

}