/**
 * Camera Module - Handles webcam acquisition, stream management, and lifecycle.
 */
export class CameraManager {
  constructor(videoElementId = 'webcam-video') {
    this.videoElement = document.getElementById(videoElementId);
    this.stream = null;
    this.isStreaming = false;
    this.width = 640;
    this.height = 480;
  }

  /**
   * Initializes webcam with responsive constraints
   * @returns {Promise<HTMLVideoElement>}
   */
  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API (navigator.mediaDevices.getUserMedia) is not supported in this browser.');
    }

    const constraints = {
      audio: false,
      video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        facingMode: 'user',
        frameRate: { ideal: 60, min: 30 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;

        await new Promise((resolve) => {
          let resolved = false;
          const done = async () => {
            if (resolved) return;
            resolved = true;
            try {
              await this.videoElement.play();
            } catch (playErr) {
              console.warn('[CameraManager] videoElement.play() warning:', playErr);
            }
            this.width = this.videoElement.videoWidth || 640;
            this.height = this.videoElement.videoHeight || 480;
            this.isStreaming = true;
            resolve();
          };

          // Safety timeout in case browser does not trigger metadata events
          const timeout = setTimeout(done, 3000);

          if (this.videoElement.readyState >= 2) {
            clearTimeout(timeout);
            done();
          } else {
            this.videoElement.onloadeddata = () => {
              clearTimeout(timeout);
              done();
            };
            this.videoElement.onloadedmetadata = () => {
              clearTimeout(timeout);
              done();
            };
          }
        });
      }
      return this.videoElement;
    } catch (err) {
      console.error('[CameraManager] Error accessing webcam:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera permission was denied. Please allow camera access in your browser to play.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No webcam device was found on this computer.');
      } else {
        throw new Error(`Unable to start webcam: ${err.message}`);
      }
    }
  }

  /**
   * Stops active camera stream
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isStreaming = false;
  }
}
