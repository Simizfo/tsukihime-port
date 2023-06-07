export class AudioManager {
    private audio: HTMLAudioElement;
    
    constructor() {
      this.audio = new Audio();
    }
    
    loadAudio(src: string): void {
      this.audio.src = src;
    }
    
    play(): void {
      this.audio.play();
    }
    
    pause(): void {
      this.audio.pause();
    }
    
    stop(): void {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    
    setVolume(volume: number): void {
      this.audio.volume = volume;
    }
    
    getVolume(): number {
      return this.audio.volume;
    }
    
    setCurrentTime(time: number): void {
      this.audio.currentTime = time;
    }
    
    getCurrentTime(): number {
      return this.audio.currentTime;
    }
    
    getDuration(): number {
      return this.audio.duration;
    }
    
    isPlaying(): boolean {
      return !this.audio.paused;
    }

    setLoop(loop: boolean): void {
      this.audio.loop = loop;
    }

    getAudio(): string {
      return this.audio.src;
    }
  }
  