import { _decorator, Component, EventTarget, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;
import { ShadowDrawer } from './ShadowDrawer';

export const houseFactoryEventTarget: EventTarget = new EventTarget();
enum HouseFactoryEvent {
    REBUILD_HOUSES
};

@ccclass('HouseFactory')
export class HouseFactory extends Component {
    static eventTarget: EventTarget = houseFactoryEventTarget;
    static EventType: typeof HouseFactoryEvent = HouseFactoryEvent;

    @property({ type: [Prefab] })
    public prefabs: Prefab[] = [];
    @property
    public houseCount: number = 25;

    private _houses: Array<any> = [];

    onLoad() {
        this._generateHouses();
        houseFactoryEventTarget.on(HouseFactoryEvent.REBUILD_HOUSES, this.onRebuildHouses, this);
    }

    _getRandomPlace(side: number) {
        return Math.floor(Math.random() * side - side / 2);
    }

    _generateHouses() {
        this.node.children.forEach(child => child.destroy());
        this._houses = [];

        const side = Math.ceil(Math.sqrt(this.houseCount)) * 2;

        let counter = 0;
        while (counter < this.houseCount) {
            const x = this._getRandomPlace(side);
            const y = this._getRandomPlace(side);

            const houseExist = this._houses.find(house => house.x === x && house.y === y) !== undefined;
            if (x !== 0 && y !== 0 && !houseExist) {
                const prefab = this.prefabs[Math.floor(Math.random() * this.prefabs.length)];
                this._houses.push({ 
                    node: instantiate(prefab), 
                    x, 
                    y,
                    posX: (x - y) * 80, 
                    posY: (x + y) * -40
                });
                counter++;
            }
        }

        this._houses.sort((a, b) => b.posY - a.posY);
        this._houses.forEach(house => {
            house.node.setPosition(house.posX, house.posY);
            house.node.setParent(this.node);
        });

        ShadowDrawer.eventTarget.emit(ShadowDrawer.EventType.REDRAW_SHADOW);
    }

    onRebuildHouses() {
        ShadowDrawer.eventTarget.emit(ShadowDrawer.EventType.CLEAR_SHADOW_OBJECTS);
        this._generateHouses();
    }
}


