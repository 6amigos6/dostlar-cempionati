const CLOUDINARY = {
  cloudName: 'djyfwp5yr',
  uploadPreset: 'Orujov_Presents',
}

// Şəkli Cloudinary-yə yükləyir və URL qaytarır
export async function uploadToCloudinary(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', CLOUDINARY.uploadPreset)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, {
    method: 'POST',
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Şəkil yüklənmədi')
  return data.secure_url
}
