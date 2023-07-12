import { _decorator, Component, Node, input, Input, EventMouse, v2, UITransform } from 'cc';
const { ccclass, property } = _decorator;
import { ShadowDrawer } from './ShadowDrawer';

@ccclass('InputHandler')
export class InputHandler extends Component {
    private _shadowLength: number = 30;
    private _shadowAngle: number = 0;
    private _transform: UITransform = null;

    start() {
        this._transform = this.getComponent(UITransform);

        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onMouseMove(event: EventMouse) {
        const size = this._transform.contentSize;
        const position = event.getLocation();

        const delta = v2(position.x - size.width / 2, position.y - size.height / 2);

        const newLength = Math.hypot(delta.x, delta.y) / 7;
        const newAngle = 180 + Math.floor(Math.atan2(delta.y, delta.x) * 180 / Math.PI);

        if (newAngle !== this._shadowAngle || newAngle !== this._shadowAngle) {
            this._shadowLength = newLength;
            this._shadowAngle = newAngle;
            
            ShadowDrawer.eventTarget.emit(ShadowDrawer.EventType.REDRAW_SHADOW, this._shadowAngle, this._shadowLength);
        }
    }
}


