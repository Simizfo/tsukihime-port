export default class AudioTsuki {
    audio: HTMLAudioElement;
    loop: boolean;
    
    constructor(audio: string, loop: boolean = false) {
        this.audio = new Audio(audio);
        this.audio.play();
        this.loop = loop;
    }

    //play or stop audio
    handleAudio(action: string) {
        if (action === "play") {
            this.audio.play();
        } else if (action === "stop") {
            this.audio.pause();
        }
    }
}