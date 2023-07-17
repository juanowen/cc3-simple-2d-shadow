import { _decorator, Component, Node, EventMouse, v2, UITransform, EventTouch } from 'cc';
const { ccclass, property } = _decorator;
import { ShadowDrawer } from './ShadowDrawer';
import { SunController } from './SunController';

@ccclass('InputHandler')
export class InputHandler extends Component {
    private _shadowLength: number = 30;
    private _shadowAngle: number = 0;
    private _transform: UITransform = null;

    start() {
        this._transform = this.getComponent(UITransform);

        SunController.eventTarget.on(SunController.EventType.TOGGLE_MANUAL_MODE, this.switchOnControls, this);
        SunController.eventTarget.on(SunController.EventType.TOGGLE_AUTO_MODE, this.switchOffControls, this);
    }

    switchOnControls() {
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    switchOffControls() {
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    onTouchMove(event: EventTouch) {
        const size = this._transform.contentSize;
        const position = event.getUILocation();

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


