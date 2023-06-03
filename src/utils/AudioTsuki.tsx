export default class AudioTsuki {
    audio: HTMLAudioElement;
    
    constructor() {
        this.audio = new Audio();
    }

    //add a new audio
    addWave(wave: string, loop: boolean) {
        this.audio.src = wave;
        this.audio.play();

        if (loop) {
            this.audio.loop = true;
        }
    }

    //play or stop audio
    handleAudio(action: string, loop: boolean) {
        if (action === "play") {
            this.audio.play();
        } else if (action === "stop") {
            this.audio.pause();
        }

        if (loop) {
            this.audio.loop = true;
        }
    }
}