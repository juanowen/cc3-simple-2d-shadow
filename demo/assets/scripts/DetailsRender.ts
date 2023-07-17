import { _decorator, Component, Node, Label } from 'cc';
import { ShadowDrawer } from './ShadowDrawer';
const { ccclass, property } = _decorator;

@ccclass('DetailsRender')
export class DetailsRender extends Component {
    @property({ type: ShadowDrawer })
    public shadowDrawer: ShadowDrawer = null;
    @property({ type: Label })
    public valueLabel: Label = null;

    onLoad() {
        if (!this.shadowDrawer || !this.valueLabel) {
            this.enabled = false;
        }
    }

    update(deltaTime: number) {
        this.valueLabel.string = `${Math.floor(this.shadowDrawer.shadowOpacity)}
${Math.floor(this.shadowDrawer.shadowAngle)}
${Math.floor(this.shadowDrawer.shadowLength)}
${Math.floor(this.shadowDrawer.shadowBlurWidth)}`;
    }
}


