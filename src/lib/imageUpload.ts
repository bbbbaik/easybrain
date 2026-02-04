import { createClient } from '@/lib/supabase/client'

/**
 * Supabase Storage의 'images' 버킷에 이미지 파일을 업로드하고 Public URL을 반환합니다.
 */
export async function uploadImage(file: File): Promise<string> {
  const supabase = createClient()

  // [Week 1 수정] 현재는 로그인이 안 된 상태에서도 테스트해야 하므로 주석 처리함
  /*
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }
  */

  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.')
  }

  // 파일 크기 제한 (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024 
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('파일 크기는 10MB를 초과할 수 없습니다.')
  }

  // 고유한 파일명 생성
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop() || 'jpg'
  
  // [Week 1 수정] user.id 대신 'temp' 폴더에 저장
  // 나중에 Auth 구현 후: const fileName = `${user.id}/${timestamp}-${randomString}.${fileExtension}`
  const fileName = `temp/${timestamp}-${randomString}.${fileExtension}`

  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw new Error(`이미지 업로드 실패: ${error.message}`)
    }

    if (!data?.path) {
      throw new Error('업로드된 파일 경로를 가져올 수 없습니다.')
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(data.path)

    return publicUrl
  } catch (error: any) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`오류 발생: ${error?.message || '알 수 없는 오류'}`)
  }
}