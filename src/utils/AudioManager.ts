import { observe } from "./Observer";
import { STRALIAS_JSON } from "./constants";
import { settings, gameContext, displayMode, SCREEN } from "./variables";

//##############################################################################
//#                             AudioManager class                             #
//##############################################################################

class AudioManager {

  private context: AudioContext;

  //Gain nodes.
  //Set separate gains for track and effects,
  //and merge them into a global gain node to apply a common gain.
  private trackGainNode: GainNode;
  private seGainNode: GainNode;
  private masterGainNode: GainNode;

  //Source nodes.
  //Play the sounds from audio buffers.
  private trackNode: AudioBufferSourceNode|null;
  private seNode: AudioBufferSourceNode|null;

  /**
   * Maps track names and effect names to their audio buffers and paths.
   * Audio buffers are loaded the first time they are used.
   */
  private sounds: Map<string, {buffer: AudioBuffer|Promise<AudioBuffer>|null, path: string}>;

  constructor() {
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

//______________________________public properties_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Common gain for both track and SE. Applied after track gain and SE gain
   */
  set masterVolume(value: number) {
    this.masterGainNode.gain.value = value;
  }

  get masterVolume() : number {
    return this.masterGainNode.gain.value;
  }

  /**
   * Gain for the track.
   */
  set trackVolume(value: number) {
    this.trackGainNode.gain.value = value;
  }

  get trackVolume() : number {
    return this.trackGainNode.gain.value;
  }

  /**
   * Gain for the special effects.
   */
  set seVolume(value: number) {
    this.seGainNode.gain.value = value;
  }

  get seVolume() : number {
    return this.seGainNode.gain.value;
  }

//________________________________public methods________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Add an entry for a track or a special effect to the table,
   * specifying the url where the audio buffer will be loaded from.
   * @param name track/SE name.
   * @param path url to the audio file.
   * @param erase erase the entry if it already exists. Defaults to false.
   */
  setSoundFileUrl(name: string, path: string, erase: boolean = false) : void {
    if (erase || !this.sounds.has(name)) {
      this.sounds.set(name, {path: path, buffer: null});
    } else {
      const sound = this.sounds.get(name);
      this.sounds.set(name, {path: path, buffer: sound?.buffer ?? null});
    }
  }

  /**
   * Check whether the specified track / special effect
   * is already mapped to an audio file.
   * @param name name of the track / SE.
   * @returns true if the name is already mapped, false otherwise.
   */
  isSoundKnown(name: string) : boolean {
    return this.sounds.has(name);
  }

  /**
   * Delete the audio buffer. If the track or special effect is played again,
   * it will be fetched again.
   * Keeps the sound name mapped to the file url.
   * @param name name of the track / SE.
   */
  unloadFile(name: string) : void {
    const sound = this.sounds.get(name);
    if (sound)
      sound.buffer = null;
  }

  /**
   * Set the track to play. If a track is already playing, it is replaced
   * by the specified one. Fetch the audio buffer if necessary.
   * @param name name of the track to play.
   * @param loop true if the track must be looped when it reaches the end
   *             of the audio buffer, false otherwise. Defaults to true.
   */
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

  /**
   * Stop the current track.
   */
  stopTrack(): void {
    this.trackNode?.stop();
  }

  /**
   * Check if a track is playing. When a track ends,
   * it is no longer considered playing.
   * @returns true if a track is playing, false otherwise.
   */
  isTrackPlaying(): boolean {
    return !!this.trackNode;
  }

  /**
   * Set the special effect to play. If a track is already playing,
   * it is replaced by the specified one. Fetch the audio buffer if necessary.
   * @param name name of the SE to play.
   * @param loop true if the SE must be looped when it reaches the end
   *             of the audio buffer, false otherwise. Defaults to false.
   */
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

  /**
   * Stop the current track.
   */
  stopSE() : void {
    this.seNode?.stop();
  }

//_______________________________private methods________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Load the audio buffer of the specified track / special effect,
   * using the stored url.
   * @param name name of the track / SE.
   * @param forceReload force fetching the audio buffer again
   *                    if it is already stored.
   * @returns a promise resolved with the audio buffer when it is loaded.
   */
  private async loadFile(name: string, forceReload: boolean = false): Promise<AudioBuffer> {
    const sound = this.sounds.get(name);
    if (!sound)
      return Promise.reject(`Unknown audio "${name}". Use setSoundFileUrl(name, path)`+
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
}

//##############################################################################
//#                         Application-specific code                          #
//##############################################################################

export const audio = new AudioManager()

//_______________________________register sounds________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

for(const [key, value] of Object.entries(STRALIAS_JSON)) {
  if (/^se\d+$/.test(key))
    audio.setSoundFileUrl(key, value as string)
}

for (let i=1; i <= 10; i++) {
  // "*5" -> CD/track05.mp3
  const paddedNumber = i.toString().padStart(2,'0')
  audio.setSoundFileUrl(`"*${i}"`, `CD/track${paddedNumber}.mp3`)
}

//_______________________________react to changes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function playTrack(name: string) {
  if (name?.length > 0)
    audio.playTrack(name, true)
  else
    audio.stopTrack()
}
function loopSE(name: string) {
  if (name?.length > 0)
    audio.playSE(name, true)
  else
    audio.stopSE()
}
observe(gameContext.audio, 'track', (name)=> {
  if (displayMode.screen == SCREEN.WINDOW)
    playTrack(name)
})
observe(gameContext.audio, 'looped_se', (name)=> {
  if (displayMode.screen == SCREEN.WINDOW)
    loopSE(name)
})

observe(displayMode, 'screen', (screen)=> {
  if (screen == SCREEN.WINDOW) {
    const {track, looped_se} = gameContext.audio
    playTrack(track)
    loopSE(looped_se)
  } else {
    playTrack('')
    loopSE('')
  }
})

audio.masterVolume = settings.volume.master
audio.trackVolume = settings.volume.track
audio.seVolume = settings.volume.se
observe(settings.volume, 'master' , (v)=>{audio.masterVolume = v})
observe(settings.volume, 'track'  , (v)=>{audio.trackVolume = v})
observe(settings.volume, 'se'     , (v)=>{audio.seVolume = v})

//___________________________________commands___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export const commands = {
  'play'    : (arg:string)=> { gameContext.audio.track = arg },
  'playstop': ()=>           { gameContext.audio.track = "" },
  'wave'    : (arg:string)=> { audio.playSE(arg) },
  'waveloop': (arg: string)=>{ gameContext.audio.looped_se = arg },
  'wavestop': ()=>           { gameContext.audio.looped_se = "" },
}
