/**
 * Created by Loic France on 12/20/2016.
 */
import {objectMatch, objectsEqual} from "./utils"

export type KeyMapCallback = (action: any, event: KeyboardEvent) => boolean|void
export type KeyMapCondition = (action: any, event: KeyboardEvent) => boolean
export type KeyMapMapping = {[key: string]: KeymapKeyFilter|(KeymapKeyFilter|KeyMapCondition)[]}

type KeymapKeyFilter = ({
    code: string
} | {
    key: string
}) & {
  [KeyMap.condition]?: (action: any, event: KeyboardEvent) => boolean,
  [key: string]: any // other parameters to filter keyboard events (repeat, ctrlKey, etc)
}

export default class KeyMap {
  private mapping: Map<string, any>
  private callback: KeyMapCallback|null
  private keyListener: EventListener

  static readonly condition : unique symbol = Symbol.for("condition function to trigger action")

  constructor(mapping: KeyMapMapping|null = null, callback : KeyMapCallback|null = null) {
    this.mapping = new Map()
    this.callback = callback
    this.keyListener = this.listener_template.bind(this) as EventListener
    if (mapping)
      this.setMapping(mapping)
  }

  get onKeyEvent() : EventListener { // to use in "onClick = " expressions
    return this.keyListener
  }


  private listener_template(event: KeyboardEvent) {
    if (this.callback) {
      let action = this.getAction(event);
      if (action) {
        return this.callback(action, event) || false;
      }
      else return false;
    }
  }

  setMapping(mapping: KeyMapMapping) {
    this.clearMapping();
    for (const [action, evtFilter] of Object.entries(mapping)) {
      if (Array.isArray(evtFilter)) {
        let condition = null
        let i
        if (typeof evtFilter[0] == "function") {
          condition = evtFilter[0]
          i = 1
        } else {}
        for (let i = 0; i < evtFilter.length; i++) {
          let filter = evtFilter[i]
          if (typeof filter == "function") {
            if (i == 0)
              condition = filter
            else
              throw Error("a funtion is only possible on the first element of the array")
          } else {
            if (condition) {
              if (KeyMap.condition in evtFilter[i])
                throw Error("cannot accumulate global condition and local condition")
              filter = {...(evtFilter[i] as KeymapKeyFilter), [KeyMap.condition]: condition}
            } else {
              filter = evtFilter[i] as KeymapKeyFilter
            }
            this.setAction(filter,
              action
            );
          }
        }
      } else this.setAction(evtFilter, action);
    }
  }

  setCallback(callback: KeyMapCallback|null) {
    this.callback = callback;
  }

  clearMapping() {
    this.mapping.clear();
  }

  enable(element: HTMLElement|Document, events: string|string[],
       options: boolean|AddEventListenerOptions|undefined = undefined) {
    if (Array.isArray(events)) {
      for (let event of events) {
        element.addEventListener(event, this.keyListener, options);
      }
    } else
      element.addEventListener(events, this.keyListener, options);
  };

  disable(element: HTMLElement|Document, events: string|string[],
        options: boolean|AddEventListenerOptions|undefined = undefined) {
    if (Array.isArray(events)) {
      for (let event of events) {
        element.removeEventListener(event, this.keyListener, options);
      }
    } else
      element.removeEventListener(events, this.keyListener, options);
  };

  setAction = (keyEventFilter: KeymapKeyFilter, action: any = undefined)=> {
    const useCode = keyEventFilter.hasOwnProperty('code')
    const useKey = keyEventFilter.hasOwnProperty('key')
    if (useCode == useKey)
      throw Error("one and only one of the attrributes 'code' and 'key' must be defined");
    let id;
    if (useCode)
      id = keyEventFilter.code as string
    else {
      id = keyEventFilter.key as string
      if (/^a-z$/.test(id)) // one lowercase letter
        id = id.toUpperCase()
    }
    const actions = this.mapping.get(id);

    if (actions === undefined) {
      if (action)
        this.mapping.set(id, [{keyEventFilter: keyEventFilter, action: action}]);
    }
    else {
      for (let i = 0; i < actions.length; i++) {
        if (objectsEqual(actions[i].keyEventFilter, keyEventFilter)) {
          if (action)
            actions[i].action = action;
          else
            actions.splice(i, 1);
          break;
        }
      }
      if (action)
        actions.push({keyEventFilter: keyEventFilter, action: action});
    }
  }

  private getAction(evt: KeyboardEvent) {
    let key = evt.key,
      code = evt.code;
    if (/^a-z$/.test(key)) // one lowercase letter
      key = key.toUpperCase()
    let actions = this.mapping.get(code) || this.mapping.get(key);

    if (actions) {
      let maxAttrLen = 0; // filters with more constraints are prefered
      let result;
      for (let action of actions) {
        let attrLen = Object.keys(action.keyEventFilter).length; //constraints number
        const filter = action.keyEventFilter;
        const condition = filter[KeyMap.condition]; // condition not counted in attrLen
        if (condition)
          attrLen++
        if (attrLen > maxAttrLen && objectMatch(evt, filter)
            && (!condition || condition(action, evt))) {
          maxAttrLen = attrLen;
          result = action.action;
        }
      }
      if (maxAttrLen > 0) {
        return result;
      }
    }
    return undefined;
  }
}
