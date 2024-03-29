import { _decorator, Component, Node, PolygonCollider2D, Vec2, v2 } from 'cc';
const { ccclass, property, requireComponent } = _decorator;
import { ShadowDrawer } from './ShadowDrawer';

@ccclass('ShadowOwner')
@requireComponent(PolygonCollider2D)
export class ShadowOwner extends Component {
    @property({
        tooltip: 'a multiplier for the length of the shadow (in other words, the height of the object casting the shadow)'
    })
    public shadowScale: number = 1;
    
    // the collider is used here to set size of shadow casting object base. 
    // it will be turned into sensor when the component is loaded
    private _collider: PolygonCollider2D = null;

    onLoad() {
        this._collider = this.getComponent(PolygonCollider2D);
        if (this._collider) {
            this._collider.sensor = true;
            this._collider.apply();

            const worldPos: Vec2 = v2(this.node.worldPosition.x, this.node.worldPosition.y);
            const offset = this._collider.offset;
            const sOffset = v2(offset.x * this.node.scale.x, offset.y * this.node.scale.y);
            const points = this._collider.points.map((point: Vec2) => {
                const sPoint = v2(point.x * this.node.scale.x, point.y * this.node.scale.y);
                return worldPos.clone().add(sPoint).add(sOffset);
            });

            ShadowDrawer.eventTarget.emit(ShadowDrawer.EventType.REGISTER_SHADOW_OBJECT, this, points);
        }
    }
}


