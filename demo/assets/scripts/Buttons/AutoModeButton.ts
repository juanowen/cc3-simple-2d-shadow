import { _decorator, Component, Node } from 'cc';
import { ScreenButton } from './ScreenButton';
import { SunController } from '../SunController';
const { ccclass, property } = _decorator;

@ccclass('AutoModeButton')
export class AutoModeButton extends ScreenButton {
    start() {
        super.start();

        this.isPushed = true;
        this.toggleStatus();

        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        SunController.eventTarget.on(SunController.EventType.TOGGLE_MANUAL_MODE, this.onTouchEnd, this);
    }

    onTouchStart() {
        super.onTouchStart();
        
        SunController.eventTarget.emit(SunController.EventType.TOGGLE_AUTO_MODE);  
    }
}


