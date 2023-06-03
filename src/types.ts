export type Line = {
    line: string,
    lineHasEnded?: boolean,
    read?: boolean,
}

export type Page = Line[]

export type Choice = {
    libe: string,
    f: number,
}