/* eslint-disable @typescript-eslint/camelcase */
import { Config, Context, dependency, Get, Hook, HttpResponseNoContent, HttpResponseOK, Options, Put } from '@foal/core'
import { ValidateMultipartFormDataBody, Disk } from '@foal/storage'
import { Cache, Convert, Graphic, Upload } from '../services'
import { Utils } from '../utils'
import { Zip } from '../services/zip.service'

const MAX_PROGRESS = Config.get('convert.progress.max')

@Hook(() => response => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'HEAD, GET, POST, PUT, PATCH, DELETE')
  response.setHeader('Content-Security-Policy', 'script-src \'self\'')
  response.setHeader('Referrer-Policy', 'no-referrer')
})

export class ApiController {
  @dependency
  uploaderService: Upload

  @dependency
  convertService: Convert

  @dependency
  utils: Utils

  @dependency
  cache: Cache

  @dependency
  graphicService: Graphic

  @dependency
  zipService: Zip

  @dependency
  disk: Disk

  @Options('*')
  options(ctx: Context) {
    const response = new HttpResponseNoContent()
    response.setHeader('Access-Control-Allow-Methods', 'HEAD, GET, POST, PUT, PATCH, DELETE')
    // You may need to allow other headers depending on what you need.
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return response
  }

  @Get('/')
  index(ctx: Context) {
    return new HttpResponseOK('Hello world!')
  }

  @Put('/upload/:session_id')
  @ValidateMultipartFormDataBody({
    fields: {
      name: { type: 'string', require: true },
      id: { type: 'string', require: true }
    },
    files: {
      file: { required: true }
    }
  })
  async uploadFile(ctx: Context) {
    const fid = ctx.request.body.fields.id
    const session = ctx.request.params.session_id
    const folder = this.utils.getFolderBySessionAndFid(session, fid)

    const { buffer, filename: fileName } = ctx.request.body.files.file
    this.uploaderService.upload(folder, fileName, buffer)

    return new HttpResponseOK({
      data: {
        file: fileName
      },
      id: fid
    })
  }


  @Get('/convert/:session_id/:id_file')
  convert(ctx: Context) {
    const session = ctx.request.params.session_id
    const fid = ctx.request.params.id_file
    const fileSave = this.utils.getFolderBySessionAndFid(session, fid)

    this.convertService.convertPDF(fileSave)
    return new HttpResponseOK({ status: 'success' })
  }

  @Get('/status/:session_id/:id_file')
  status(ctx: Context) {
    const session = ctx.request.params.session_id
    const fid = ctx.request.params.id_file
    const progress = this.convertService.getStatusConvert(session, fid)
    if (progress >= MAX_PROGRESS) {
      const thumb = this.graphicService.getThumb(session, fid)
      const convert = this.convertService.getConvertFile(session, fid)
      return new HttpResponseOK({
        convert_result: convert,
        fid: fid,
        progress: progress,
        savings: null,
        sid: session,
        status: 'success',
        thumb_url: thumb
      })
    }

    return new HttpResponseOK({
      fid: fid,
      progress: progress,
      sid: session,
      status: 'processing',
      status_text: null
    })
  }

  @Get('/download/:session_id/:id_file/:file_name')
  download(ctx: Context) {
    const session = ctx.request.params.session_id
    const fid = ctx.request.params.id_file
    const fileName = ctx.request.params.file_name
    const folder = this.utils.getFolderBySessionAndFid(session, fid)
    const fConvert = this.utils.getConvertFile(folder, fileName)
    return this.disk.createHttpResponse(fConvert.replace('temp/', ''), {
      forceDownload: true,
      filename: fileName
    })
  }

  @Get('/all/:session_id/:file_name')
  async downloadAll(ctx: Context) {
    const { order } = ctx.request.query
    const session = ctx.request.params.session_id
    const fileName = ctx.request.params.file_name
    const zip = await this.zipService.zipDownloadAll(order, session, fileName)
    return new HttpResponseOK(zip)

  }
}
