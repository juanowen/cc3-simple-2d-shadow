import { _decorator, Component, Node, Label } from 'cc';
import { SunController } from './SunController';
const { ccclass, property } = _decorator;

@ccclass('TipLabel')
export class TipLabel extends Component {
    @property({ type: Label })
    public label: Label = null;
    @property
    public manualModeTip: string = '';
    @property
    public autoModeTip: string = '';

    start() {
        SunController.eventTarget.on(SunController.EventType.TOGGLE_MANUAL_MODE, this.onToggleManualMode, this);
        SunController.eventTarget.on(SunController.EventType.TOGGLE_AUTO_MODE, this.onToggleAutoMode, this);
    }

    onToggleManualMode() {
        if (this.label) {
            this.label.string = this.manualModeTip;
        }
    }

    onToggleAutoMode() {
        if (this.label) {
            this.label.string = this.autoModeTip;
        }
    }
}


