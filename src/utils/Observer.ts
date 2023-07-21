import { useEffect } from "react"

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
export function observe<T extends Observable, T1 extends ObservableContainer<T>>(object: T|T1, property: keyof T, callback: ObserverCallback) {
    if (!(observerSymbol in object)) {
        (object as any)[observerSymbol] = new PropertiesObserver(object)
    }
    (object as any)[observerSymbol].observe(property, callback)
}

/**
 * Stops Listening for changes of the property.
 *
 * All parameters must be the same as when calling the `observe` function
 */
export function unobserve<T extends Observable, T1 extends ObservableContainer<T>>(object: T|T1, property: keyof T, callback: ObserverCallback): boolean {
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

const callbacksSymbol = Symbol("callbacks")
const hiddenObjSymbol = Symbol("hidden object")

class ObservableContainer<T extends Object> {
    constructor(obj: T) {
        const callbacks : Array<(prop: keyof T, val: any)=>void> = []
        return new Proxy(obj, {
            //...Reflect,
            get(target, key: PropertyKey, receiver) {
                switch(key) {
                    case callbacksSymbol: return callbacks
                    case hiddenObjSymbol: return obj
                    default : return Reflect.get(target, key, receiver)
                }
            },
            set(target, key: PropertyKey, value, receiver) {
                const diff = value != Reflect.get(target, key, receiver)
                const result = Reflect.set(target, key, value, receiver)
                if (diff && result && typeof key != 'symbol') {
                    for (const cb of callbacks)
                        cb(key as keyof typeof obj, value)
                }
                return result
            }
        })
    }
}

export function observeChildren<T extends Object>(parent: T, attr: keyof T, callback: (prop: PropertyKey, value: any)=>void) {
    if (!(callbacksSymbol in parent[attr])) {
        parent[attr] = new ObservableContainer(parent[attr]) as any
    }
    const callbacks = parent[attr][callbacksSymbol as keyof ObservableContainer<T>] as Array<(prop: PropertyKey, val: any)=>void>
    callbacks.push(callback)
}
export function unobserveChildren<T extends Object>(parent: T, attr: keyof T, callback: (prop: PropertyKey, value: any)=>void): boolean {
    const callbacks = parent[attr][callbacksSymbol as keyof ObservableContainer<T>] as Array<(prop: keyof T, val: any)=>void>
    const index = callbacks?.indexOf(callback)??-1
    if (index == -1)
        return false
    callbacks.splice(index, 1)
    if (callbacks.length == 0)
        parent[attr] = parent[attr][hiddenObjSymbol as keyof ObservableContainer<T>]
    return true
}

export function useObserver<T extends Observable, T1 extends ObservableContainer<T>>(callback:ObserverCallback, object: T|T1, property: keyof T) {
    useEffect(()=> {
        observe(object, property, callback)
        return unobserve.bind(null, object, property, callback) as VoidFunction
    }, [])
}
export function useChildrenObserver<T extends Object>(callback: (prop: PropertyKey, value: any)=>void, parent: T, attr: keyof T) {
    useEffect(()=> {
        observeChildren(parent, attr, callback)
        return unobserveChildren.bind(null, parent, attr as any, callback) as VoidFunction
    }, [])
}
