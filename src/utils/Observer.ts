type ObserverCallback<T=any> = (value: T)=>void
type Observable = {[key: PropertyKey]: any}
type PropertyObserver = {
    originalDesciptor: PropertyDescriptor,
    hasChanged: boolean,
    callbacks: Array<ObserverCallback>
}

class PropertiesObserver {

    private observers: Map<PropertyKey, PropertyObserver>
    private parent: Observable
    private microtaskQueued: boolean
    private onValueChange: VoidFunction
    private notify: VoidFunction

    constructor(parent: Observable) {
        this.observers = new Map()
        this.parent = parent
        this.microtaskQueued = false
        this.onValueChange = this._onValueChange.bind(this)
        this.notify = this._notify.bind(this)
    }
    private _onValueChange() {
        if (!this.microtaskQueued) {
            queueMicrotask(this.notify)
            this.microtaskQueued = true
        }
    }
    private _notify() {
        this.microtaskQueued = false
        for (const [property, observer] of this.observers.entries()) {
            if (observer.hasChanged) {
                observer.hasChanged = false
                const value = this.parent[property]
                for (const callback of observer.callbacks) {
                    callback(value)
                }
            }
        }
    }

    private getObserver(property: PropertyKey): PropertyObserver {
        if (!this.observers.has(property)) {
            const descriptor = Object.getOwnPropertyDescriptor(this.parent, property)
            if (!descriptor)
                throw Error(`property ${property.toString()} is not a direct property of object ${this.parent}`)
            if (!(descriptor.configurable && (descriptor.writable??true)))
                throw Error(`property ${property.toString()} of ${this.parent} must be configurable and writable to be observed`)
            
            // Replace current property descriptor
            const onValueChange = this.onValueChange
            const observer = {
                originalDesciptor: descriptor,
                hasChanged: false,
                callbacks: []
            }
            Object.defineProperty(this.parent, property, {
                get(){ return descriptor.get?.call(this)??descriptor.value },
                set(v: any){
                    const oldValue = this[property]
                    const result = descriptor.set?.call(this,v)??(descriptor.value = v)
                    if (v != oldValue) {
                        observer.hasChanged = true
                        onValueChange()
                    }
                    return result
                },
                enumerable: descriptor.enumerable,
                configurable: true
            })
            this.observers.set(property, observer)
        }
        return this.observers.get(property) as PropertyObserver
    }
    observe(property: PropertyKey, callback: ObserverCallback) {
        this.getObserver(property).callbacks.push(callback)
    }
    unobserve(property: PropertyKey, callback: ObserverCallback): number {
        const observer = this.getObserver(property)
        const index = observer.callbacks.indexOf(callback)
        if (index >= 0) {
            observer.callbacks.splice(index, 1)
            const remainingObservers = observer.callbacks.length
            if (remainingObservers == 0) {
                Object.defineProperty(this.parent, property, observer.originalDesciptor)
                this.observers.delete(property)
            }
            return remainingObservers
        }
        return -1
    }
    notifyObservers(property: PropertyKey) {
        const callbacks = this.observers.get(property)?.callbacks??[]
        const value = this.parent[property]
        for (const callback of callbacks) {
            callback(value)
        }
    }
}

const observerSymbol = Symbol("Observer")

/**
 * Listen for changes of a property in the specified object.
 * @param object the object with the property to observe
 * @param property the property to observe in the object. Must be the object's own property, configurable and writable
 * @param callback the function to call when the property has changed
 */
export function observe<T extends Observable>(object: T, property: keyof T, callback: ObserverCallback) {
    if (!(observerSymbol in object)) {
        (object as any)[observerSymbol] = new PropertiesObserver(object)
    }
    object[observerSymbol].observe(property, callback)
}

/**
 * Stops Listening for changes of the property.
 * 
 * All parameters must be the same as when calling the `observe` function
 */
export function unobserve<T extends Observable>(object: T, property: keyof T, callback: ObserverCallback): boolean {
    if (observerSymbol in object) {
        let remainingObservers = object[observerSymbol].unobserve(property, callback)
        if (remainingObservers == 0)
            delete object[observerSymbol]
        return remainingObservers >= 0
    } else {
        return false
    }
}

/**
 * Notify all listeners (call the callbacks) with the current value of the specified property
 */
export function notifyObservers<T extends Observable>(object: T, property: keyof T) {
    queueMicrotask(object[observerSymbol].notifyObservers.bind(object[observerSymbol], property))
}