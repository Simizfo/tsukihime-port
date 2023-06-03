export type Line = {
    line: string,
    lineHasEnded?: boolean,
    read?: boolean,
}

export type Page = Line[]