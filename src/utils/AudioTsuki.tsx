export default class AudioTsuki {
    audio: HTMLAudioElement;
    
    constructor(audio: string | undefined = undefined, loop: boolean = false) {
        this.audio = new Audio(audio)
        this.audio.play();
        this.audio.loop = loop;
    }

    play() {
        this.audio.play();
    }

    stop() {
        this.audio.pause();
    }

    setAudio(audio: string, loop: boolean = false) {
        this.audio = new Audio(audio)
        this.audio.loop = loop
    }
}