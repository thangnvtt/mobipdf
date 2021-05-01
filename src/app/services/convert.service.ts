import { Config, dependency } from '@foal/core'
import * as convert from 'ebook-convert'
import * as Path from 'path'
import { Utils } from '../utils'
import { Cache } from './cache.service'
import { Upload } from './upload.service'
import { Graphic } from './graphic.service'

const FOLDER_CONVERT = Config.get('settings.disk.convert.path')
const FOLDER_THUMB = Config.get('settings.disk.graphic.path')
const MAX_PROGRESS = Config.get('convert.progress.max')
const MIN_PROGRESS = Config.get('convert.progress.min')
const WARNING_PROGRESS = Config.get('convert.progress.warning')
const WAITING_PROGRESS = Config.get('convert.progress.waiting')
const PERCENT_CALCULATE_PROGRESS = Config.get('convert.percent')
const AUTHORS = Config.get('convert.options.authors')
const PAGE_BREAKS_BEFORE = Config.get('convert.options.pageBreaksBefore')
const CHAPTER = Config.get('convert.options.chapter')
const INSERT_BLANK_LINE = Config.get('convert.options.insertBlankLine')
const INSERT_BLANK_LINE_SIZE = Config.get('convert.options.insertBlankLineSize')
const LINE_HEIGHT = Config.get('convert.options.lineHeight')
const MARGIN_TOP = Config.get('convert.options.marginTop')
const MARGIN_RIGHT = Config.get('convert.options.marginRight')
const MARGIN_BOTTOM = Config.get('convert.options.marginBottom')
const MARGIN_LEFT = Config.get('convert.options.marginLeft')
const TYPE = {
    PDF: 'pdf',
    PNG: 'png'
}
export class Convert {
    @dependency
    cache: Cache

    @dependency
    uploadService: Upload

    @dependency
    utils: Utils

    @dependency
    graphicService: Graphic

    getStatusConvert(sessionID: string, fileID: string): number {
        const folder = this.utils.getFolderBySessionAndFid(sessionID, fileID)
        const progress = Number(this.cache.get(`${folder}:progress`))
        if (progress) {
            if (progress === MAX_PROGRESS) return progress
            let next = this.calculateNextProgress(progress)
            if (next > WARNING_PROGRESS) {
                const thumb = this.graphicService.getThumb(sessionID, fileID)
                if (!thumb) next = WAITING_PROGRESS
            }
            this.setStatusConvert(folder, next)
            return next
        }

        const file = this.utils.getFirstFileOnFolder(FOLDER_CONVERT, folder)
        if (!file) {
            const next = this.calculateNextProgress(MIN_PROGRESS)
            this.setStatusConvert(folder, next)
            return next
        }

        this.setStatusConvert(folder, MAX_PROGRESS)
        return MAX_PROGRESS
    }

    setStatusConvert(folder: string, progress: number): void {
        this.cache.set(`${folder}:progress`, progress)
    }

    setConvertFile(folder: string, fileName: string): void {
        this.cache.set(`${folder}:convert`, fileName)
    }

    getConvertFile(sessionID: string, fileID: string): string {
        const folder = this.utils.getFolderBySessionAndFid(sessionID, fileID)
        let fConvert = this.cache.get(`${folder}:convert`)
        if (!fConvert) {
            fConvert = this.utils.getFirstFileOnFolder(FOLDER_CONVERT, folder)
        }
        return fConvert
    }

    async convertPDF(folder: string, type = TYPE.PDF) {
        const inputFile = this.uploadService.getFileByFolder(folder)
        const outputFileName = this.utils.getOutputFileName(inputFile, type)

        this.utils.createFolder(Path.join(FOLDER_THUMB, folder))
        this.utils.createFolder(Path.join(FOLDER_CONVERT, folder))

        const inputPath = this.utils.getUploadFile(folder, inputFile)
        const outputPath = this.utils.getConvertFile(folder, outputFileName)
        const options = {
            input: inputPath,
            output: outputPath,
            authors: AUTHORS,
            pageBreaksBefore: PAGE_BREAKS_BEFORE,
            chapter: CHAPTER,
            insertBlankLine: INSERT_BLANK_LINE,
            insertBlankLineSize: INSERT_BLANK_LINE_SIZE,
            lineHeight: LINE_HEIGHT,
            marginTop: MARGIN_TOP,
            marginRight: MARGIN_RIGHT,
            marginBottom: MARGIN_BOTTOM,
            marginLeft: MARGIN_LEFT
        }

        return new Promise((resolve, reject) => {
            convert(options, async err => {
                if (err) return reject(err)
                await this.graphicService.genThumb(folder, outputFileName)
                this.setStatusConvert(folder, MAX_PROGRESS)
                this.setConvertFile(folder, outputFileName)
                resolve(outputFileName)
            })
        })
    }

    private calculateNextProgress(progressCurrent: number): number {
        const next = Math.ceil((MAX_PROGRESS - progressCurrent) * Number(PERCENT_CALCULATE_PROGRESS))
        return progressCurrent + next
    }
}
