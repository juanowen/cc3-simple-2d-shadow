import { _decorator, Component, Node, EventTarget, Color, Sprite  } from 'cc';
import { ShadowDrawer } from './ShadowDrawer';
const { ccclass, property } = _decorator;

enum SunControllerMode {
    Auto,
    Manual
}

const sunControllerEventTarget: EventTarget = new EventTarget();
enum SunControllerEventType {
    TOGGLE_AUTO_MODE,
    TOGGLE_MANUAL_MODE
}

@ccclass('SunController')
export class SunController extends Component {
    static eventTarget: EventTarget = sunControllerEventTarget;
    static EventType: typeof SunControllerEventType = SunControllerEventType;

    @property({ type: ShadowDrawer })
    public shadowDrawer: ShadowDrawer = null;
    @property
    public nightColor: Color = new Color(255, 255, 255);
    @property
    public twilightColor: Color = new Color(255, 255, 255);
    @property
    public dayColor: Color = new Color(255, 255, 255);
    @property({ min: 0, max: 1, slide: true })
    public shiftSpeed: number = 1;

    private _mode: SunControllerMode = SunControllerMode.Auto;
    private _currentState: number = 0;
    private _sprite: Sprite = null;
    private _shiftSpeed: number = 1;

    start() {
        this._shiftSpeed = this.shiftSpeed;
        this._sprite = this.getComponent(Sprite);

        sunControllerEventTarget.on(SunControllerEventType.TOGGLE_AUTO_MODE, this.toggleAutoMode, this);
        sunControllerEventTarget.on(SunControllerEventType.TOGGLE_MANUAL_MODE, this.toggleManualMode, this);
    }

    update(deltaTime: number) {
        if (this._mode === SunControllerMode.Auto) {
            this._currentState = (this._currentState + deltaTime * this.shiftSpeed) % 1;

            this.processSunShift();
        }
    }

    processSunShift() {
        const angle = (90 + 360 * this._currentState) % 360;

        if (this.shadowDrawer) {
            // timeOfDay: 1 - noon, -1 - midnight
            const timeOfDay = Math.sin(angle / 360 * Math.PI * 2);

            this.shadowDrawer.setShadowAngle(angle);

            const opacityState = (Math.sin(angle / 360 * Math.PI * 2) - 0.3) / 1.3;
            const opacity = Math.max(0, opacityState * -140);
            this.shadowDrawer.setShadowOpacity(opacity);
            
            const width = Math.max(10, 30 + timeOfDay * 20);
            this.shadowDrawer.setShadowBlurWidth(width);

            const length = 15 * (0.75 + Math.sin(this._currentState * Math.PI) * 0.25);
            this.shadowDrawer.setShadowLength(length, true);

            this.shiftSpeed = this._shiftSpeed * (1 + timeOfDay * 0.5);
        }

        if (this._sprite) {
            // timeOfDay: 1 - noon, -1 - midnight
            const timeOfDay = (Math.sin(angle / 360 * Math.PI * 2) + 0.5) / 1.5;

            let color: Color = new Color();
            if (timeOfDay < 0) {
                Color.lerp(color, this.twilightColor, this.dayColor, -timeOfDay);
            } else {
                Color.lerp(color, this.twilightColor, this.nightColor, timeOfDay);
            }

            this._sprite.color = color;
        }
    }

    toggleAutoMode() {
        this._mode = SunControllerMode.Auto;
    }

    toggleManualMode() {
        this._mode = SunControllerMode.Manual;

        if (this.shadowDrawer) {
            this.shadowDrawer.setShadowAngle(90);
            this.shadowDrawer.setShadowOpacity(140);
            this.shadowDrawer.setShadowBlurWidth(10);
            this.shadowDrawer.setShadowLength(20, true);

            this.shiftSpeed = this._shiftSpeed;
        }

        if (this._sprite) {
            this._sprite.color = new Color(255, 255, 255, 0);
        }
    }
}


