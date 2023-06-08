
export class AudioManager {
    private context: AudioContext;
    private trackGainNode: GainNode;
    private seGainNode: GainNode;
    private masterGainNode: GainNode;
    private trackNode: AudioBufferSourceNode|null;
    private seNode: AudioBufferSourceNode|null;

    private sounds: Map<string, {buffer: AudioBuffer|Promise<AudioBuffer>|null, path: string}>;
    
    constructor() {
      debugger
      this.context = new AudioContext();

      this.trackGainNode = this.context.createGain();
      this.seGainNode = this.context.createGain();
      this.masterGainNode = this.context.createGain();

      this.trackGainNode.connect(this.masterGainNode);
      this.seGainNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.context.destination)

      this.sounds = new Map();

      this.trackNode = null;
      this.seNode = null;
    }

    setSoundFileUrl(name: string, path: string, erase: boolean = false) : void {
      if (erase || !this.sounds.has(name)) {
        this.sounds.set(name, {path: path, buffer: null});
      } else {
        const sound = this.sounds.get(name);
        this.sounds.set(name, {path: path, buffer: sound?.buffer ?? null});
      }
    }

    isSoundKnown(name: string) : boolean {
      return this.sounds.has(name);
    }

    private async loadFile(name: string, forceReload: boolean = false): Promise<AudioBuffer> {
      const sound = this.sounds.get(name);
      if (!sound)
        return Promise.reject(`Unknown audio "${name}. Use setAudioFileUrl(name, path)`+
                              ` to associate names with paths`);
      if (sound.buffer && !forceReload)
          return sound.buffer;
      
      sound.buffer = fetch(sound.path)
          .then(data=>data.arrayBuffer())
          .then(arrayBuffer=>this.context.decodeAudioData(arrayBuffer))
          .then(audioBuffer=>{
            sound.buffer = audioBuffer;
            return Promise.resolve(audioBuffer);
          })
          .catch(reason=>Promise.reject(reason));
      return sound.buffer;
    }

    unloadFile(name: string) : void {
      this.sounds.delete(name)
    }

    private async createABSource(name: string, loop: boolean): Promise<AudioBufferSourceNode>
    {
      let audioBuffer = this.loadFile(name);
      if (!audioBuffer)
        return Promise.reject(`unknown sound name "${name}".`+
                              ` Use AudioManager.loadFile(name, src)`+
                              ` to load audio buffers`);
      const node: AudioBufferSourceNode = this.context.createBufferSource()
      node.buffer = await audioBuffer;
      node.loop = loop;

      return node;
    }
    
    async playTrack(name: string, loop = true): Promise<void> {
      if (this.trackNode) {
        this.trackNode.stop();
        this.trackNode.disconnect();
      }
      this.trackNode = await this.createABSource(name, loop);
      this.trackNode.connect(this.trackGainNode);

      this.trackNode.start();
      this.trackNode.onended = ()=> {
        if (this.trackNode) {
          this.trackNode.disconnect();
          this.trackNode = null;
        }
      }
    }
    
    stopTrack(): void {
      this.trackNode?.stop();
    }
    isTrackPlaying(): boolean {
      return !!this.trackNode;
    }

    async playSE(name: string, loop = false): Promise<void> {
      if (this.seNode) {
        this.seNode.stop();
        this.seNode.disconnect();
      }
      this.seNode = await this.createABSource(name, loop);
      this.seNode.connect(this.seGainNode);

      this.seNode.start();
      this.seNode.onended = ()=> {
        if (this.seNode) {
          this.seNode.disconnect();
          this.seNode = null;
        }
      }
    }

    stopSE() : void {
      this.seNode?.stop();
    }

    set masterVolume(value: number) {
      this.masterGainNode.gain.value = value;
    }

    get masterVolume() : number {
      return this.masterGainNode.gain.value;
    }

    set trackVolume(value: number) {
      this.trackGainNode.gain.value = value;
    }

    get trackVolume() : number {
      return this.trackGainNode.gain.value;
    }

    set seVolume(value: number) {
      this.seGainNode.gain.value = value;
    }

    get seVolume() : number {
      return this.seGainNode.gain.value;
    }
  }
  