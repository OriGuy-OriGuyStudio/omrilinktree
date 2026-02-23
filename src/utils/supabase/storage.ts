import { createClient } from './client'

export async function uploadImage(file: File): Promise<{ url: string | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `user_uploads/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('styles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('styles')
      .getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { url: null, error: error as Error }
  }
}
