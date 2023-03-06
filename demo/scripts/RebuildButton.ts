import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { houseFactoryEventTarget, HouseFactoryEvent } from './HouseFactory';

@ccclass('RebuildButton')
export class RebuildButton extends Component {
    start() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onTouchStart() {
        houseFactoryEventTarget.emit(HouseFactoryEvent.REBUILD_HOUSES);  
    }
}


