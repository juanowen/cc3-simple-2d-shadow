import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { HouseFactory } from '../HouseFactory';
import { ScreenButton } from './ScreenButton';

@ccclass('RebuildButton')
export class RebuildButton extends ScreenButton {
    onTouchStart() {
        super.onTouchStart();
        
        HouseFactory.eventTarget.emit(HouseFactory.EventType.REBUILD_HOUSES);  
    }
}


