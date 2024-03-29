import { _decorator, Node, Camera, UITransform, Rect, EventTarget, view, View, size } from 'cc';
const { ccclass, property } = _decorator;


const shadowCameraEventTarget: EventTarget = new EventTarget();
enum ShadowCameraEvent {
    STICK_NODE_TO_CAMERA
}

@ccclass('ShadowCamera')
export class ShadowCamera extends Camera {
	static eventTarget: EventTarget = shadowCameraEventTarget;
	static EventType: typeof ShadowCameraEvent = ShadowCameraEvent;

	@property({ 
		type: Camera,
		tooltip: 'camera to copy orthoHeight property' 
	})
	public mainCamera: Camera = null;

	private _transform: UITransform = null;

    onLoad() {
		super.onLoad();

		if (this.enabled) {
			if (this.targetTexture) {
                View.instance.on('canvas-resize', this.onCanvasResize, this);
                shadowCameraEventTarget.on(ShadowCameraEvent.STICK_NODE_TO_CAMERA, this.onStickNodeToCamera, this);
			} else {
				this.enabled = false;
			}
		}
    }

	start() {
		this.onCanvasResize();
	}

	getVisibleRect() {
		const viewSize = view.getVisibleSize();
		const sideRatio = viewSize.width / viewSize.height;
		const center = this.node.worldPosition;

		const cameraHeight = this.orthoHeight * 2;
		const cameraWidth = sideRatio * cameraHeight;

		const visibleRect = new Rect(
            center.x - 0.5 * cameraWidth, 
            center.y - 0.5 * cameraHeight,
			cameraWidth, 
            cameraHeight
        );
		
		return visibleRect;
	}

	copyMainCameraProps() {
		if (this.mainCamera) {
			this.projection = this.mainCamera.projection;
			if (this.projection === Camera.ProjectionType.ORTHO) {
				this.orthoHeight = this.mainCamera.orthoHeight;
			} else {
				console.warn('Shadow camera projection must be ortho!');
			}
		}
	}

	onCanvasResize() {
		this.copyMainCameraProps();

        const cameraSize = this.getVisibleRect();
        this.targetTexture.resize(cameraSize.width, cameraSize.height);

        if (this._transform) {
            const renderTextureSize = size(cameraSize.width, cameraSize.height);
            this._transform.setContentSize(renderTextureSize);
        }
	}

	onStickNodeToCamera(node: Node, callback: Function) {
		this.copyMainCameraProps();

        this._transform = node.getComponent(UITransform);
        this._transform.setContentSize(this.camera.width, this.camera.height);

        const curPos = this.node.getWorldPosition();
        const newPos = node.getWorldPosition();
        this.node.setWorldPosition(newPos.x, newPos.y, curPos.z);
        
        this.targetTexture.resize(this._transform.width, this._transform.height);

        callback instanceof Function && callback(this.targetTexture);
	}
}

