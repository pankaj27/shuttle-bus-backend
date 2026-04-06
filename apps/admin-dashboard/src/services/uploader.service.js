import api from './api'

export const uploaderService = {
  upload(file, folder = 'general', width, height) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    if (width) formData.append('width', width)
    if (height) formData.append('height', height)

    return api.post('uploader', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  delete(path) {
    return api.delete('uploader', { data: { path } })
  },
}
