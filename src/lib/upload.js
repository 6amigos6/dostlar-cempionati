// Cloudinary-ə şəkil yüklənməsi (unsigned preset — server anahtarı tələb olunmur).
// Preset və cloud adı istifadəçinin Cloudinary hesabına aiddir.
export const CLOUDINARY_CLOUD = 'djyfwp5yr'
export const CLOUDINARY_PRESET = 'Orujov_Presents'

export async function uploadImage(file) {
  const body = new FormData()
  body.append('file', file)
  body.append('cloud_name', CLOUDINARY_CLOUD)
  body.append('upload_preset', CLOUDINARY_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body,
  })
  const data = await res.json()
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || 'Şəkil yüklənə bilmədi')
  }
  return data.secure_url
}
