import { memo, useCallback } from "react";
import { gameContext, settings } from "../utils/variables";
import { RouteDayName, RouteName } from "../types";
import { dayTitle, imageUrl, phaseTitle } from "../utils/lang";
import { findImageObjectByName } from "../utils/gallery";
import { useTraceUpdate } from "../utils/utils";

export type SpritePos = keyof typeof gameContext.graphics

const POSITIONS: Array<SpritePos> = Object.keys(gameContext.graphics) as Array<SpritePos>

export function graphicElement(pos: SpritePos, image: string,
    _attrs: Record<string, any> = {}, resolution=settings.resolution) {

  image = image || ((pos=="bg") ? "#000000" : "#00000000")
  const {key, style, ...attrs} = _attrs
  const isColor = image.startsWith('#')
  const isPhaseText = image.startsWith('$')
  let _phaseTitle
  let _dayTitle
  if (isPhaseText) {
    let [route, routeDay, day] = image.substring(1).split('|')
    _phaseTitle = phaseTitle(route as RouteName, routeDay as RouteDayName)
    if (day)
      _dayTitle = dayTitle(parseInt(day))
  }
  const className = `${pos} ${isPhaseText ? 'phase' : ''}`
  return (
    <div
      key={key}
      className={className}
      {...(isColor ? {style:{ background: image, ...style }} : {})}
      {...(isPhaseText || isColor ? attrs : {})}>
      {isPhaseText ?
      <div>
        <div className="phase-title">{_phaseTitle}</div>
        {_dayTitle && <div className="phase-day">{_dayTitle}</div>}
      </div>
      : !isColor &&
        <img src={imageUrl(image, resolution)} alt={`[[sprite:${image}]]`} draggable={false}
          className={findImageObjectByName(image)?.sensitive && settings.blurThumbnails ? "blur" : ""}
          {...attrs}
          style={style}
        />
      }
    </div>
  )
}

export async function preloadImage(src:string, resolution=settings.resolution): Promise<void> {
  if (src.startsWith('#') || src.startsWith('$'))
    return
  else {
    return new Promise((resolve, reject)=> {
      const img = new Image()
      img.onload = resolve as VoidFunction
      img.onerror = img.onabort = reject
      img.src = imageUrl(src, resolution)
    })
  }
}

export function graphicElements(images: Partial<Record<SpritePos, string>>,
                        attrs?: Partial<Record<SpritePos, Record<string,any>>>|
                                ((pos:SpritePos)=>Record<string,any>), resolution=settings.resolution) {
return POSITIONS.map(pos => images[pos] && graphicElement(pos,
  images[pos] as string, {
    key: images[pos]||pos,
    ...(typeof attrs == 'function' ? attrs(pos) : attrs?.[pos] ?? {})
  }, resolution))
}

//##############################################################################
//#                                 COMPONENTS                                 #
//##############################################################################

type Props = {
  pos: SpritePos
  image: string
  resolution?: typeof settings.resolution
} & ({
  fadeIn?: undefined
  fadeOut?: undefined
  fadeTime?: 0
  toImg?: undefined
  onAnimationEnd?: undefined
} | (
  { fadeTime: number, onAnimationEnd: VoidFunction } & (
    { fadeIn: string, fadeOut?: undefined, toImg?: undefined } |
    { fadeOut: string, fadeIn?: undefined, toImg: string }
  )
)) & Record<string, any>

export const Graphics = memo(({pos, image, resolution=settings.resolution,
    fadeTime=0, fadeIn=undefined, fadeOut=undefined, toImg=undefined,
    onAnimationEnd=undefined, ...props} : Props)=> {

  //useTraceUpdate(`graph[${pos}]`, {pos, image, resolution, fadeTime, fadeIn, fadeOut, toImg, onAnimationEnd, ...props})

//____________________________________image_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const imageProps = useCallback(()=> {
//.............. no image ..............
    if (!image) {
      return pos == 'bg' ? {} : undefined
    }
//............ static image ............
    else if (fadeTime == 0) {
      return {}
    }
//........ (dis)appearing image ........
    else {
      return {
        ...(fadeIn ? {'fade-in' : fadeIn}
          : fadeOut ? {'fade-out': fadeOut} : {}),
          style: {
            '--transition-time': `${fadeTime}ms`
          },
        onAnimationEnd
      }
    }
  }, [pos, image, fadeTime, fadeIn, fadeOut])()

//________________________________crossfade mask________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // add an opaque background to the crossfade-disappearing image to prevent
  // the background from being visible by transparency
  const maskProps = useCallback(()=> {
    if (pos == 'bg' || fadeTime == 0 || fadeOut != 'crossfade'
        || !image.includes('/') || !(toImg?.includes('/')))
      return undefined
    else {
      return {
        'for-mask': "",
        style: {
          '--from-image': `url(${imageUrl(image)})`,
          '--to-image': `url(${imageUrl(toImg)})`
        }
      }
    }

  }, [pos, image, toImg, fadeOut, fadeTime])()

//____________________________________render____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const {style: baseStyle = {}, ...baseAttrs} = (imageProps || {})  as Record<string, any>
  const {style: insertStyle = {}, ...isertAttrs} = props
  return <>
    {maskProps != undefined && graphicElement(pos, image, {
        style: {...baseStyle, ...insertStyle},
        ...baseAttrs,
        ...isertAttrs
      }, resolution)}
    {imageProps != undefined && graphicElement(pos, image, imageProps, resolution)}
  </>
})