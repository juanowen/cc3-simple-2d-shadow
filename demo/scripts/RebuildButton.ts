import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { HouseFactory } from './HouseFactory';

@ccclass('RebuildButton')
export class RebuildButton extends Component {
    start() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onTouchStart() {
        HouseFactory.eventTarget.emit(HouseFactory.EventType.REBUILD_HOUSES);  
    }
}


