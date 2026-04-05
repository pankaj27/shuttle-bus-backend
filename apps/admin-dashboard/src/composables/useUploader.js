import { ref } from 'vue'
import { uploaderService } from '@/services/uploader.service'
import { message } from 'ant-design-vue'

export function useUploader() {
  const loading = ref(false)
  const uploadedUrl = ref('')

  const uploadFile = async (file, folder = 'general', width, height) => {
    loading.value = true
    try {
      const response = await uploaderService.upload(file, folder, width, height)
      // Adjust based on your actual API response structure.
      // Common patterns: response.url, response.data.url, or response itself if interceptor returns data
      const url = response.url || response.data?.url || response

      uploadedUrl.value = url
      message.success('File uploaded successfully')
      return url
    } catch (error) {
      console.error('Upload failed:', error)
      message.error('Failed to upload file')
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteFile = async (path) => {
    loading.value = true
    try {
      await uploaderService.delete(path)
      message.success('File deleted successfully')
    } catch (error) {
      console.error('Delete failed:', error)
      message.error('Failed to delete file')
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    uploadedUrl,
    uploadFile,
    deleteFile,
  }
}
